'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';

const BLUE = '#2563EB';

function SuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        const orderId = searchParams.get('orderId');
        const paymentKey = searchParams.get('paymentKey');
        const amount = searchParams.get('amount');
        const clientId = searchParams.get('clientId');
        const grids = searchParams.get('grids');
        const uploadedUrl = searchParams.get('uploadedUrl');

        if (!orderId || !paymentKey || !amount) {
          throw new Error('필수 파라미터가 누락되었습니다.');
        }

        const response = await fetch('/api/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            paymentKey,
            amount,
            clientId,
            grids,
            uploadedUrl,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '결제 승인에 실패했습니다.');
        }

        setStatus('success');
        
        // 3초 후 대시보드로 이동
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);

      } catch (error) {
        console.error('결제 승인 오류:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : '결제 처리 중 오류가 발생했습니다.');
      }
    };

    confirmPayment();
  }, [searchParams, router]);

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: '#F0F7F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={48} color={BLUE} className="animate-spin" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>결제 처리 중입니다</p>
          <p style={{ fontSize: 13, color: '#94A3B8' }}>잠시만 기다려주세요...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ minHeight: '100vh', background: '#F0F7F4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
        <div style={{ maxWidth: 400, width: '100%', background: '#fff', borderRadius: 20, padding: '40px 24px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <span style={{ fontSize: 32 }}>❌</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>결제 처리 실패</h1>
          <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
            {errorMessage}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: BLUE, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            대시보드로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F7F4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <div style={{ maxWidth: 400, width: '100%', background: '#fff', borderRadius: 20, padding: '40px 24px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, ${BLUE}, #3B82F6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: `0 8px 24px ${BLUE}44` }}>
          <Check size={44} color="#fff" strokeWidth={3} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>결제가 완료되었습니다! 🎉</h1>
        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 8 }}>
          그리드 예약이 정상적으로 접수되었습니다.
        </p>
        <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 28 }}>
          대시보드에서 계약 현황을 확인하실 수 있습니다.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: `linear-gradient(90deg, ${BLUE}, #3B82F6)`, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 16px ${BLUE}44` }}
          >
            대시보드로 이동
          </button>
          <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 8 }}>3초 후 자동으로 이동됩니다...</p>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F0F7F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={48} color={BLUE} className="animate-spin" />
      </div>
    }>
      <SuccessInner />
    </Suspense>
  );
}
