'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, Package, CreditCard, User } from 'lucide-react';

const MAX_W = 430;

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const isLoginPage   = pathname === '/';
  const isBookingPage = pathname.startsWith('/booking');
  const showPhoneBar  = !isLoginPage && !pathname.startsWith('/billing');

  return (
    <div style={{
      margin: '0 auto',
      width: '100%',
      maxWidth: MAX_W,
      minHeight: '100vh',
      position: 'relative',
      background: '#F0F7F4',
    }}>

      {/* 전화번호 띠 — 헤더(57px) 바로 아래 고정 */}
      {showPhoneBar && (
        <div style={{
          position: 'fixed',
          top: 57,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: MAX_W,
          zIndex: 90,
          background: '#EFF6FF',
          borderBottom: '1px solid #BFDBFE',
          padding: '6px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          height: 32,
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', letterSpacing: '-0.2px' }}>
            📞 전화 예약/정산/변경 문의:&nbsp;
            <a href="tel:07080576783" style={{ color: '#2563EB', textDecoration: 'none' }}>070-8057-6783</a>
            &nbsp;/&nbsp;
            <a href="tel:01028978524" style={{ color: '#2563EB', textDecoration: 'none' }}>010-2897-8524</a>
          </span>
        </div>
      )}

      {children}

      {/* 푸터 */}
      {!isLoginPage && !isBookingPage && (
        <div style={{
          width: '100%',
          maxWidth: MAX_W,
          background: '#F0F7F4',
          borderTop: '1px solid #D1E8DF',
          padding: '20px 20px 180px',
          marginTop: 20,
        }}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>스타일링소다</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { label: '대표',               value: '박민지' },
                { label: '사업자등록번호',     value: '[추후 기재]' },
                { label: '통신판매업 신고번호', value: '[추후 기재]' },
                { label: '주소',               value: '[추후 기재]' },
                { label: '전화',               value: '070-8057-6783 / 010-2897-8524' },
                { label: '이메일',             value: 'easy.keep.kr@gmail.com' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', gap: 6 }}>
                  <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0, minWidth: 90 }}>{label}</span>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, borderTop: '1px solid #D1E8DF', paddingTop: 14 }}>
            <button onClick={() => router.push('/terms')}
              style={{ fontSize: 11, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
              이용약관
            </button>
            <span style={{ fontSize: 11, color: '#D1D5DB' }}>|</span>
            <button onClick={() => router.push('/privacy')}
              style={{ fontSize: 11, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontWeight: 700 }}>
              개인정보처리방침
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 10 }}>
            © 2026 스타일링소다. All rights reserved.
          </p>
        </div>
      )}

      {/* 하단 네비게이션 */}
      {!isLoginPage && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: MAX_W,
          zIndex: 100,
          background: '#fff',
          borderTop: '0.5px solid #D1E8DF',
          display: 'flex',
          height: 56,
          alignItems: 'center',
          justifyContent: 'space-around',
        }}>
          <NavBtn label="홈" icon={Home} active={pathname === '/dashboard'} onClick={() => router.push('/dashboard')} />
          <NavBtn label="내 보관함" icon={Package} active={pathname.startsWith('/inventory')} onClick={() => router.push('/inventory')} />
          <NavBtn label="정산" icon={CreditCard} active={pathname.startsWith('/billing')} onClick={() => router.push('/billing')} />
          <NavBtn label="마이" icon={User} active={false} onClick={() => router.push('/dashboard')} />
        </div>
      )}
    </div>
  );
}

function NavBtn({ label, icon: Icon, active, onClick }: {
  label: string; icon: React.ElementType; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      width: '100%', height: '100%', gap: 3,
      background: 'none', border: 'none', cursor: 'pointer',
      color: active ? '#2563EB' : '#94A3B8',
    }}>
      <Icon size={20} strokeWidth={active ? 2 : 1.5} />
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 400 }}>{label}</span>
      {active && <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#2563EB', marginTop: -2 }} />}
    </button>
  );
}