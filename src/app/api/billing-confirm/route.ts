import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { orderId, paymentKey, amount, billId, clientId } = await req.json();

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

    // 결제 승인 성공 - monthly_bills 상태 업데이트
    const { error: billError } = await supabase
      .from('monthly_bills')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', billId);

    if (billError) {
      console.error('청구서 상태 업데이트 실패:', billError);
    }

    // bill_line_items에 결제 완료 기록 (없는 경우만 추가)
    const { data: existingItems } = await supabase
      .from('bill_line_items')
      .select('id')
      .eq('bill_id', billId);

    if (!existingItems || existingItems.length === 0) {
      await supabase.from('bill_line_items').insert({
        bill_id:     billId,
        item_type:   'storage',
        description: '정산 결제',
        amount:      Number(amount),
      });
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
          message: `💳 <b>정산 결제 완료! (카드)</b>\n\n` +
            `👤 고객명: ${clientName}\n` +
            `💰 결제 금액: ${Number(amount).toLocaleString('ko-KR')}원\n` +
            `💳 결제 방법: ${tossData.method || '카드'}\n` +
            `📅 결제일: ${new Date().toLocaleDateString('ko-KR')}\n` +
            `🆔 주문번호: ${orderId}`,
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
    console.error('정산 결제 승인 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '결제 승인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
