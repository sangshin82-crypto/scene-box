'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

type Space = {
  id: string;
  client_id: string;
  start_date: string;
  end_date: string;
  status: string;
  plan_type: string;
  monthly_fee: number;
  clients: { name: string } | null;
  grids: { grid_number: string; zone: string } | null;
};

export default function BookingManagement() {
  const router = useRouter();

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [filtered, setFiltered] = useState<Space[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSpaces() {
      const { data, error } = await supabase
        .from('spaces')
        .select('id, client_id, start_date, end_date, status, plan_type, monthly_fee, clients(name), grids(grid_number, zone)')
        .order('end_date', { ascending: true });

      if (error) {
        console.error('예약 로딩 실패:', error);
      } else {
        setSpaces((data ?? []) as unknown as Space[]);
        setFiltered((data ?? []) as unknown as Space[]);
      }
      setIsLoading(false);
    }
    fetchSpaces();
  }, []);

  useEffect(() => {
    if (!query) {
      setFiltered(spaces);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(spaces.filter(s =>
      (s.clients?.name ?? '').toLowerCase().includes(q) ||
      (s.grids?.grid_number ?? '').toLowerCase().includes(q) ||
      (s.grids?.zone ?? '').toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q)
    ));
  }, [query, spaces]);

  const getDday = (endDate: string) => {
    const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusBadge = (endDate: string, status: string) => {
    if (status !== 'active') return { label: '종료', color: 'text-gray-500', bg: 'bg-gray-50' };
    const dday = getDday(endDate);
    if (dday <= 7)  return { label: `만기임박 D-${dday}`, color: 'text-orange-600', bg: 'bg-orange-50' };
    if (dday <= 30) return { label: '만기예정',           color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { label: '이용중', color: 'text-blue-600', bg: 'bg-blue-50' };
  };

  const fmtDate = (d: string) => {
    const date = new Date(d);
    return `${date.getFullYear().toString().slice(2)}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
        <p className="animate-pulse text-[14px] font-bold text-gray-500">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-md min-h-screen bg-gray-50 pb-[100px] shadow-xl">

      {/* 헤더 */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-lg font-bold text-gray-900">예약 관리</h1>
          <span className="text-sm text-gray-400">{filtered.length}건</span>
        </div>
        <div className="bg-gray-100 rounded-lg flex items-center px-3 py-2">
          <span className="text-gray-400 mr-2">🔍</span>
          <input
            type="text"
            placeholder="이름/Grid/상태 검색"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm"
          />
        </div>
      </div>

      {/* 계약 리스트 */}
      <div className="p-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white p-6 rounded-xl text-center text-sm text-gray-400">
            계약 내역이 없습니다.
          </div>
        ) : (
          filtered.map(space => {
            const { label, color, bg } = getStatusBadge(space.end_date, space.status);
            const gridLabel = space.grids
              ? `${space.grids.zone}존 ${space.grids.grid_number}`
              : '—';
            return (
              <div
                key={space.id}
                onClick={() => router.push('/admin/billing')}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer active:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-gray-900">
                    {space.clients?.name ?? '고객'}
                    <span className="font-normal text-gray-500 text-sm ml-1">({gridLabel})</span>
                  </p>
                  <span className={`text-xs font-bold ${color} ${bg} px-2 py-1 rounded-md`}>
                    {label}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {fmtDate(space.start_date)} ~ {fmtDate(space.end_date)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  월 {space.monthly_fee.toLocaleString()}원 · {space.plan_type}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 z-[100] flex justify-around items-center h-14">
        <button onClick={() => router.push('/admin')} className="flex flex-col items-center justify-center w-full h-full text-gray-400">
          <span className="text-xl mb-0.5">📊</span>
          <span className="text-[10px] font-medium">대시보드</span>
        </button>
        <button className="flex flex-col items-center justify-center w-full h-full text-blue-600">
          <span className="text-xl mb-0.5">📦</span>
          <span className="text-[10px] font-bold">예약관리</span>
        </button>
        <button onClick={() => router.push('/admin/billing')} className="flex flex-col items-center justify-center w-full h-full text-gray-400">
          <span className="text-xl mb-0.5">💲</span>
          <span className="text-[10px] font-medium">정산</span>
        </button>
        <button className="flex flex-col items-center justify-center w-full h-full text-gray-400">
          <span className="text-xl mb-0.5">⚙️</span>
          <span className="text-[10px] font-medium">설정</span>
        </button>
      </div>
    </div>
  );
}