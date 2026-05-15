'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle, ChevronLeft } from 'lucide-react';

const BLUE = '#2563EB';

function FailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = searchParams.get('code');
  const message = searchParams.get('message');
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    // 실패 로그 (필요시 서버로 전송 가능)
    console.error('결제 실패:', { code, message, orderId });
  }, [code, message, orderId]);

  return (
    <div style={{ minHeight: '100vh', background: '#F0F7F4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <div style={{ maxWidth: 420, width: '100%', background: '#fff', borderRadius: 20, padding: '40px 24px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <XCircle size={44} color="#EF4444" strokeWidth={2} />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>결제가 취소되었습니다</h1>
        
        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 8 }}>
          {message || '결제 과정에서 문제가 발생했습니다.'}
        </p>

        {code && (
          <div style={{ background: '#FEF2F2', borderRadius: 12, padding: '12px 16px', marginBottom: 24 }}>
            <p style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>오류 코드: {code}</p>
          </div>
        )}

        {orderId && (
          <div style={{ background: '#F0F7F4', borderRadius: 12, padding: '12px 16px', marginBottom: 24 }}>
            <p style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>주문번호</p>
            <p style={{ fontSize: 12, color: '#0F172A', fontWeight: 600, wordBreak: 'break-all' }}>{orderId}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => router.push('/booking')}
            style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: `linear-gradient(90deg, ${BLUE}, #3B82F6)`, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 16px ${BLUE}44` }}
          >
            예약 페이지로 이동
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: '1px solid #D1E8DF', background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <ChevronLeft size={16} />
            대시보드로 돌아가기
          </button>
        </div>

        <div style={{ marginTop: 24, padding: '16px', background: '#F0F7F4', borderRadius: 12 }}>
          <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>
            문제가 지속되면 고객센터로 문의해주세요.<br />
            <a href="tel:010-2897-8524" style={{ color: BLUE, fontWeight: 600, textDecoration: 'none' }}>📞 010-2897-8524</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FailPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F0F7F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8' }}>불러오는 중...</p>
      </div>
    }>
      <FailInner />
    </Suspense>
  );
}
