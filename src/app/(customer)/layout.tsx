'use client';

import { useRouter, usePathname } from 'next/navigation';

const MAX_W = 430;

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/';
  const isBookingPage = pathname.startsWith('/booking');

  return (
    <div
      style={{
        margin: '0 auto',
        width: '100%',
        maxWidth: MAX_W,
        minHeight: '100vh',
        position: 'relative',
        background: '#F3F4F6',
      }}
    >
      {children}

      {/* ── 전화번호 띠 — 정산 페이지 제외 ── */}
      {!isLoginPage && !pathname.startsWith('/billing') && (
        <div
          style={{
            position: 'fixed',
            top: 57,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: MAX_W,
            zIndex: 90,
            background: '#EFF6FF',
            borderBottom: '1px solid #BFDBFE',
            padding: '5px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', letterSpacing: '-0.2px' }}>
            📞 전화 예약/정산/변경 문의:&nbsp;
            <a href="tel:07080576783" style={{ color: '#2563EB', textDecoration: 'none' }}>070-8057-6783</a>
            &nbsp;/&nbsp;
            <a href="tel:01028978524" style={{ color: '#2563EB', textDecoration: 'none' }}>010-2897-8524</a>
          </span>
        </div>
      )}

      {/* ── 푸터 — 로그인, 예약 페이지 제외 ── */}
      {!isLoginPage && !isBookingPage && (
        <div
          style={{
            width: '100%',
            maxWidth: MAX_W,
            background: '#F9FAFB',
            borderTop: '1px solid #E5E7EB',
            padding: '20px 20px 180px',
            marginTop: 20,
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>스타일링소다</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { label: '대표', value: '박민지' },
                { label: '사업자등록번호', value: '[추후 기재]' },
                { label: '통신판매업 신고번호', value: '[추후 기재]' },
                { label: '주소', value: '[추후 기재]' },
                { label: '전화', value: '070-8057-6783 / 010-2897-8524' },
                { label: '이메일', value: 'easy.keep.kr@gmail.com' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', gap: 6 }}>
                  <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0, minWidth: 90 }}>{label}</span>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, borderTop: '1px solid #E5E7EB', paddingTop: 14 }}>
            <button
              onClick={() => router.push('/terms')}
              style={{ fontSize: 11, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
            >
              이용약관
            </button>
            <span style={{ fontSize: 11, color: '#D1D5DB' }}>|</span>
            <button
              onClick={() => router.push('/privacy')}
              style={{ fontSize: 11, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontWeight: 700 }}
            >
              개인정보처리방침
            </button>
          </div>

          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 10 }}>
            © 2026 스타일링소다. All rights reserved.
          </p>
        </div>
      )}

      {/* ── 하단 네비게이션 바 ── */}
      {!isLoginPage && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: MAX_W,
            zIndex: 100,
          }}
          className="flex h-14 items-center justify-around border-t border-gray-200 bg-white"
        >
          <NavBtn
            label="홈" emoji="🏠"
            active={pathname === '/dashboard'}
            onClick={() => router.push('/dashboard')}
          />
          <NavBtn
            label="내 보관함" emoji="📦"
            active={pathname.startsWith('/inventory')}
            onClick={() => router.push('/inventory')}
          />
          <NavBtn
            label="정산" emoji="💳"
            active={pathname.startsWith('/billing')}
            onClick={() => router.push('/billing')}
          />
          <NavBtn
            label="마이" emoji="👤"
            active={false}
            onClick={() => router.push('/dashboard')}
          />
        </div>
      )}
    </div>
  );
}

function NavBtn({
  label, emoji, active, onClick,
}: {
  label: string; emoji: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full flex-col items-center justify-center h-full gap-0.5 ${
        active ? 'text-blue-600 font-bold' : 'text-gray-400 font-medium'
      }`}
    >
      <span className="text-xl leading-none">{emoji}</span>
      <span className="text-[10px]">{label}</span>
      {active && <span className="mt-[-2px] h-1 w-1 rounded-full bg-blue-600" />}
    </button>
  );
}