'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarClock, DollarSign, Users, Map } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';

const ADMIN_EMAIL = 'easy.keep.kr@gmail.com';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();

      if (pathname === '/admin/login') {
        setIsChecking(false);
        return;
      }

      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/admin/login');
        return;
      }

      setIsChecking(false);
    }
    checkAuth();
  }, [pathname, router]);

  if (isChecking) return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
      <p className="animate-pulse text-[14px] font-bold text-gray-500">확인 중...</p>
    </div>
  );

  return (
    <>
      {children}

      {pathname !== '/admin/login' && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 430, background: '#fff',
          borderTop: '0.5px solid #E5E7EB', zIndex: 100,
          display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: 56,
        }}>
          <NavBtn
            icon={LayoutDashboard}
            label="대시보드"
            active={pathname === '/admin'}
            onClick={() => router.push('/admin')}
          />
          <NavBtn
            icon={CalendarClock}
            label="예약관리"
            active={pathname.startsWith('/admin/booking')}
            onClick={() => router.push('/admin/booking')}
          />
          <NavBtn
            icon={Map}
            label="공간현황"
            active={pathname.startsWith('/admin/reservation')}
            onClick={() => router.push('/admin/reservation')}
          />
          <NavBtn
            icon={DollarSign}
            label="정산"
            active={pathname.startsWith('/admin/billing')}
            onClick={() => router.push('/admin/billing')}
          />
          <NavBtn
            icon={Users}
            label="고객관리"
            active={pathname.startsWith('/admin/clients')}
            onClick={() => router.push('/admin/clients')}
          />
        </div>
      )}
    </>
  );
}

function NavBtn({ icon: Icon, label, active, onClick }: {
  icon: React.ElementType; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      width: '100%', height: '100%', gap: 3,
      background: 'none', border: 'none', cursor: 'pointer',
      color: active ? '#2563EB' : '#9CA3AF',
    }}>
      <Icon size={19} strokeWidth={active ? 2 : 1.5} />
      <span style={{ fontSize: 9, fontWeight: active ? 700 : 400 }}>{label}</span>
      {active && <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#2563EB', marginTop: -2 }} />}
    </button>
  );
}