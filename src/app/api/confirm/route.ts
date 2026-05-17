import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { orderId, paymentKey, amount, clientId, grids, uploadedUrl } = await req.json();

    if (!orderId || !paymentKey || !amount) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 토스페이먼츠 결제 승인 요청
    const secretKey = process.env.TOSS_SECRET_KEY!;
    const encodedKey = Buffer.from(`${secretKey}:`).toString('base64');

    const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        paymentKey,
        amount: Number(amount),
      }),
    });

    const tossData = await tossResponse.json();

    if (!tossResponse.ok) {
      console.error('토스 결제 승인 실패:', tossData);
      return NextResponse.json(
        { error: tossData.message || '결제 승인에 실패했습니다.' },
        { status: tossResponse.status }
      );
    }

    // 결제 승인 성공 - DB 업데이트
    const gridList = grids ? grids.split(',') : [];

    // spaces 상태를 pending -> active로 변경
    const { error: spacesError } = await supabase
      .from('spaces')
      .update({ status: 'active' })
      .eq('client_id', clientId)
      .in('grid_id', 
        (await supabase
          .from('grids')
          .select('id')
          .in('grid_number', gridList)
        ).data?.map(g => g.id) || []
      );

    if (spacesError) {
      console.error('Spaces 업데이트 실패:', spacesError);
    }

    // grids 상태를 occupied로 변경
    await supabase
      .from('grids')
      .update({ status: 'occupied' })
      .in('grid_number', gridList);

    // 청구서 생성 (기존 청구서 있으면 업데이트, 없으면 생성)
    const now = new Date();
    const storageAmount = Number(amount);

    const { data: existingBill } = await supabase
      .from('monthly_bills')
      .select('id, storage_fee')
      .eq('client_id', clientId)
      .eq('billing_year', now.getFullYear())
      .eq('billing_month', now.getMonth() + 1)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let billId: string;

    if (existingBill) {
      // 기존 청구서에 보관료 추가
      await supabase
        .from('monthly_bills')
        .update({
          storage_fee: (existingBill.storage_fee ?? 0) + storageAmount,
          status: 'paid',
        })
        .eq('id', existingBill.id);
      billId = existingBill.id;
    } else {
      // 새 청구서 생성
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
        .in('grid_id',
          (await supabase.from('grids').select('id').in('grid_number', gridList)).data?.map(g => g.id) || []
        );

      const totalDeposit = (spacesData ?? []).reduce((sum: number, s: any) => sum + (s.deposit_amount ?? 0), 0);
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

    // 텔레그램 알림
    try {
      await fetch(`${req.nextUrl.origin}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `🎉 <b>그리드 예약 및 결제 완료 (카드)</b>\n\n` +
            `👤 고객명: ${clientName}\n` +
            `📦 예약 공간: ${gridList.join(', ')} (${gridList.length} Grid)\n` +
            `💰 결제 금액: ${Number(amount).toLocaleString('ko-KR')}원\n` +
            `💳 결제 방법: ${tossData.method || '카드'}\n` +
            `🆔 주문번호: ${orderId}` +
            (uploadedUrl ? `\n📎 사업자등록증: 첨부됨` : ''),
        }),
      });
    } catch (e) {
      console.error('텔레그램 알림 실패:', e);
    }

    return NextResponse.json({
      success: true,
      payment: tossData,
    });

  } catch (error) {
    console.error('결제 승인 처리 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '결제 승인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
