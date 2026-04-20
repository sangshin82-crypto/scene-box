'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

const ADMIN_EMAIL = 'easy.keep.kr@gmail.com';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 z-[100] flex justify-around items-center h-14">
          <button onClick={() => router.push('/admin')}
            className={`flex flex-col items-center justify-center w-full h-full ${pathname === '/admin' ? 'text-blue-600 font-bold' : 'text-gray-400 font-medium'}`}>
            <span className="text-xl mb-0.5">📊</span>
            <span className="text-[10px]">대시보드</span>
          </button>

          <button onClick={() => router.push('/admin/booking')}
            className={`flex flex-col items-center justify-center w-full h-full ${pathname.startsWith('/admin/booking') ? 'text-blue-600 font-bold' : 'text-gray-400 font-medium'}`}>
            <span className="text-xl mb-0.5">📦</span>
            <span className="text-[10px]">예약관리</span>
          </button>

          <button onClick={() => router.push('/admin/billing')}
            className={`flex flex-col items-center justify-center w-full h-full ${pathname.startsWith('/admin/billing') ? 'text-blue-600 font-bold' : 'text-gray-400 font-medium'}`}>
            <span className="text-xl mb-0.5">💲</span>
            <span className="text-[10px]">정산</span>
          </button>

          <button onClick={() => router.push('/admin/clients')}
            className={`flex flex-col items-center justify-center w-full h-full ${pathname.startsWith('/admin/clients') ? 'text-blue-600 font-bold' : 'text-gray-400 font-medium'}`}>
            <span className="text-xl mb-0.5">👥</span>
            <span className="text-[10px]">고객관리</span>
          </button>
        </div>
      )}
    </>
  );
}