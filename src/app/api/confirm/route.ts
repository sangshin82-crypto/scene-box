import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ─── 포트원 V2 단건 조회 응답 타입 ──────────────────────────────────────────
interface PortOnePaymentAmount {
  total:    number;
  taxFree?: number;
  vat?:     number;
}

interface PortOnePayment {
  paymentId:  string;
  status:     string;           // "PAID" | "FAILED" | "CANCELLED" | ...
  amount:     PortOnePaymentAmount;
  method?:    string;
  orderName?: string;
  paidAt?:    string;
}
// ────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ─── 포트원 V2: paymentId 기반 파라미터 ────────────────────────────────
    const { paymentId, amount, clientId, grids, uploadedUrl, months, startDate } = await req.json() as {
      paymentId:   string;
      amount:      number;
      clientId:    string;
      grids:       string;
      uploadedUrl?: string;
      months?:     number;
      startDate?:  string;
    };
    // ────────────────────────────────────────────────────────────────────────

    // ─── 토스페이먼츠 파라미터 (비활성화) ────────────────────────────────────
    // const { orderId, paymentKey, amount, clientId, grids, uploadedUrl } = await req.json();
    // ────────────────────────────────────────────────────────────────────────

    if (!paymentId || !amount || !clientId) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다. (paymentId, amount, clientId)' },
        { status: 400 }
      );
    }

    // ─── 토스페이먼츠 결제 승인 요청 (비활성화) ──────────────────────────────
    // const secretKey  = process.env.TOSS_SECRET_KEY!;
    // const encodedKey = Buffer.from(`${secretKey}:`).toString('base64');
    //
    // const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    //   method:  'POST',
    //   headers: {
    //     'Authorization':  `Basic ${encodedKey}`,
    //     'Content-Type':   'application/json',
    //   },
    //   body: JSON.stringify({
    //     orderId,
    //     paymentKey,
    //     amount: Number(amount),
    //   }),
    // });
    //
    // const tossData = await tossResponse.json();
    //
    // if (!tossResponse.ok) {
    //   console.error('토스 결제 승인 실패:', tossData);
    //   return NextResponse.json(
    //     { error: tossData.message || '결제 승인에 실패했습니다.' },
    //     { status: tossResponse.status }
    //   );
    // }
    // ────────────────────────────────────────────────────────────────────────

    // ─── 포트원 V2 단건 조회 (결제 검증) ────────────────────────────────────
    const portoneApiRes = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PORTONE_API_SECRET}`,
        },
      }
    );

    const portoneData: PortOnePayment = await portoneApiRes.json();

    if (!portoneApiRes.ok) {
      console.error('포트원 결제 조회 실패:', portoneData);
      return NextResponse.json(
        { error: (portoneData as unknown as { message?: string }).message || '결제 조회에 실패했습니다.' },
        { status: portoneApiRes.status }
      );
    }

    // 결제 완료 상태 확인
    if (portoneData.status !== 'PAID') {
      console.error('결제 미완료 상태:', portoneData.status);
      return NextResponse.json(
        { error: `결제가 완료되지 않았습니다. (상태: ${portoneData.status})` },
        { status: 400 }
      );
    }

    // 금액 위변조 검증
    if (portoneData.amount.total !== Number(amount)) {
      console.error(
        '결제 금액 불일치 - 예상:', Number(amount),
        '실제:', portoneData.amount.total
      );
      return NextResponse.json(
        { error: `결제 금액 위변조가 감지되었습니다. (예상: ${amount}원, 실제: ${portoneData.amount.total}원)` },
        { status: 400 }
      );
    }
    // ────────────────────────────────────────────────────────────────────────

    // ─── DB 업데이트 (기존 씬박스 로직 100% 유지) ─────────────────────────────
    const gridList = grids ? grids.split(',') : [];

    // spaces 상태를 pending → active로 변경
    const { data: gridRows } = await supabase
      .from('grids')
      .select('id')
      .in('grid_number', gridList);

    const gridIds = (gridRows ?? []).map((g: { id: string }) => g.id);

    const { error: spacesError } = await supabase
      .from('spaces')
      .update({ status: 'active' })
      .eq('client_id', clientId)
      .in('grid_id', gridIds);

    if (spacesError) {
      console.error('Spaces 업데이트 실패:', spacesError);
    }

    // grids 상태를 occupied로 변경
    await supabase
      .from('grids')
      .update({ status: 'occupied' })
      .in('grid_number', gridList);

    // 청구서 생성 (기존 청구서 있으면 업데이트, 없으면 생성)
    const now          = new Date();
    const storageAmount = Number(amount);

    const { data: existingBill } = await supabase
      .from('monthly_bills')
      .select('id, storage_fee')
      .eq('client_id', clientId)
      .eq('billing_year',  now.getFullYear())
      .eq('billing_month', now.getMonth() + 1)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let billId: string;

    if (existingBill) {
      await supabase
        .from('monthly_bills')
        .update({
          storage_fee: (existingBill.storage_fee ?? 0) + storageAmount,
          status:      'paid',
        })
        .eq('id', existingBill.id);
      billId = existingBill.id;
    } else {
      const { data: billData } = await supabase
        .from('monthly_bills')
        .insert({
          client_id:     clientId,
          billing_year:  now.getFullYear(),
          billing_month: now.getMonth() + 1,
          storage_fee:   storageAmount,
          transport_fee: 0,
          disposal_fee:  0,
          status:        'paid',
        })
        .select()
        .single();
      billId = billData?.id;
    }

    if (billId) {
      // 보관료 line_item 추가
      await supabase.from('bill_line_items').insert({
        bill_id:     billId,
        item_type:   'storage',
        description: `월 보관료 (${gridList.join(', ')})`,
        amount:      storageAmount,
      });

      // 이행보증금 line_item 추가 (spaces에서 deposit_amount 조회)
      const { data: spacesData } = await supabase
        .from('spaces')
        .select('deposit_amount')
        .eq('client_id', clientId)
        .in('grid_id', gridIds);

      const totalDeposit = (spacesData ?? []).reduce(
        (sum: number, s: { deposit_amount?: number }) => sum + (s.deposit_amount ?? 0),
        0
      );
      if (totalDeposit > 0) {
        await supabase.from('bill_line_items').insert({
          bill_id:     billId,
          item_type:   'deposit',
          description: '이행보증금',
          amount:      totalDeposit,
        });
      }
    }

    // 고객 정보 조회
    const { data: clientData } = await supabase
      .from('clients')
      .select('name')
      .eq('id', clientId)
      .single();

    const clientName = clientData?.name ?? '고객';

    // 텔레그램 알림 (서버에서 직접 호출)
    try {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          parse_mode: 'HTML',
          text:
            `💳 <b>결제 완료! (카드)</b>\n\n` +
            `👤 고객명: ${clientName}\n` +
            `📦 예약 공간: ${gridList.join(', ')} (${gridList.length} Grid)\n` +
            `📅 이용 기간: ${months ?? '-'}개월\n` +
            `💰 결제 금액: ${Number(amount).toLocaleString('ko-KR')}원 (VAT 포함)\n` +
            `🗓 시작일: ${startDate ?? '-'}` +
            (uploadedUrl ? `\n📎 사업자등록증: 첨부됨` : ''),
        }),
      });
    } catch (e) {
      console.error('텔레그램 알림 실패:', e);
    }
    // ────────────────────────────────────────────────────────────────────────

    return NextResponse.json({
      success: true,
      payment: portoneData,
    });

  } catch (error) {
    console.error('결제 승인 처리 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '결제 승인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
