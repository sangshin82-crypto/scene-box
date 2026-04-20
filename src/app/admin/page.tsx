'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();

  const [totalGrids, setTotalGrids] = useState(0);
  const [usedGrids, setUsedGrids] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [unpaidAmount, setUnpaidAmount] = useState(0);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // 1. 전체 Grid 수
      const { count: total } = await supabase
        .from('grids')
        .select('*', { count: 'exact', head: true });
      setTotalGrids(total ?? 0);

      // 2. 사용 중인 Grid 수
      const { count: used } = await supabase
        .from('spaces')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      setUsedGrids(used ?? 0);

      // 3. 이번 달 예상 매출
      const now = new Date();
      const { data: bills } = await supabase
        .from('monthly_bills')
        .select('storage_fee, transport_fee, disposal_fee, status')
        .eq('billing_year', now.getFullYear())
        .eq('billing_month', now.getMonth() + 1);

      if (bills) {
        const revenue = bills.reduce((sum, b) =>
          sum + (b.storage_fee ?? 0) + (b.transport_fee ?? 0) + (b.disposal_fee ?? 0), 0);
        const unpaid = bills
          .filter(b => b.status === 'pending')
          .reduce((sum, b) =>
            sum + (b.storage_fee ?? 0) + (b.transport_fee ?? 0) + (b.disposal_fee ?? 0), 0);
        setMonthlyRevenue(revenue);
        setUnpaidAmount(unpaid);
      }

      // 4. 최근 배차/폐기 요청
      const { data: transports } = await supabase
        .from('transport_requests')
        .select('id, client_id, truck_type, status, created_at, clients(name)')
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: disposals } = await supabase
        .from('disposal_requests')
        .select('id, client_id, status, created_at, clients(name)')
        .order('created_at', { ascending: false })
        .limit(3);

      const combined = [
        ...(transports ?? []).map(t => ({
          id: t.id,
          name: (t.clients as any)?.name ?? '고객',
          desc: `${t.truck_type} 배차 요청`,
          status: t.status,
          type: 'transport',
        })),
        ...(disposals ?? []).map(d => ({
          id: d.id,
          name: (d.clients as any)?.name ?? '고객',
          desc: '폐기 정산 요청',
          status: d.status,
          type: 'disposal',
        })),
      ].slice(0, 5);

      setRecentRequests(combined);
      setIsLoading(false);
    }

    fetchData();
  }, []);

  const occupancyRate = totalGrids > 0 ? Math.round((usedGrids / totalGrids) * 100) : 0;

  const statusLabel = (status: string) => {
    switch (status) {
      case 'pending':   return { label: '처리 대기', color: 'text-red-500',    bg: 'bg-red-50'    };
      case 'confirmed': return { label: '확정됨',   color: 'text-blue-500',   bg: 'bg-blue-50'   };
      case 'completed': return { label: '완료',     color: 'text-green-600',  bg: 'bg-green-50'  };
      default:          return { label: status,     color: 'text-gray-500',   bg: 'bg-gray-50'   };
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
        <p className="animate-pulse text-[14px] font-bold text-gray-500">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-md min-h-screen bg-gray-50 pb-[120px] shadow-xl">

      {/* 헤더 */}
      <div className="flex justify-between items-center bg-white px-4 py-3 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900">관리 대시보드</h1>
        <button className="text-gray-500 text-xl">🔔</button>
      </div>

      {/* 핵심 지표 카드 */}
      <div className="p-4 space-y-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-sm font-medium text-gray-500 mb-2">창고 가동률</h2>
          <div className="flex justify-between items-end mb-3">
            <span className="text-3xl font-bold text-blue-600">{occupancyRate}%</span>
            <span className="text-sm text-gray-400 font-medium">{usedGrids}/{totalGrids} Grid 사용 중</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${occupancyRate}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-sm font-medium text-gray-500 mb-2">이번 달 예상 매출</h2>
          <p className="text-2xl font-bold text-gray-900">{monthlyRevenue.toLocaleString()}원</p>
          {unpaidAmount > 0 && (
            <p className="text-xs text-red-500 mt-2 font-medium bg-red-50 inline-block px-2 py-1 rounded">
              미결제 {unpaidAmount.toLocaleString()}원 포함
            </p>
          )}
        </div>
      </div>

      {/* 퀵 메뉴 */}
      <div className="px-4 mb-6 flex gap-3">
        <button
          onClick={() => router.push('/admin/booking')}
          className="flex-1 bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-sm active:bg-blue-700"
        >
          📦 예약 관리
        </button>
        <button
          onClick={() => router.push('/admin/billing')}
          className="flex-1 bg-white border border-gray-200 text-gray-800 py-3.5 rounded-xl font-bold shadow-sm active:bg-gray-50"
        >
          💰 요금 청구
        </button>
      </div>

      {/* 실시간 현황 */}
      <div className="px-4">
        <h3 className="text-sm font-bold text-gray-800 mb-3 ml-1">최근 요청 현황</h3>
        <div className="space-y-3">
          {recentRequests.length === 0 ? (
            <div className="bg-white p-4 rounded-xl text-center text-sm text-gray-400">
              최근 요청이 없습니다.
            </div>
          ) : (
            recentRequests.map(req => {
              const { label, color, bg } = statusLabel(req.status);
              return (
                <div
                  key={req.id}
                  onClick={() => router.push(req.type === 'transport' ? '/admin/booking' : '/admin/billing')}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer"
                >
                  <div>
                    <p className="font-bold text-gray-900">{req.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{req.desc}</p>
                  </div>
                  <span className={`text-xs font-bold ${color} ${bg} px-2.5 py-1 rounded-md`}>
                    {label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}