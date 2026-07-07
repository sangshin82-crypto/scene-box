'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

// 날짜 유틸
const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const toDate = (s: string) => { const d = new Date(s); d.setHours(0,0,0,0); return d; };
const daysBetween = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / 86400000);

export default function AdminDashboard() {
  const router = useRouter();

  // 오늘 처리할 일 카운트
  const [personalReqCount, setPersonalReqCount] = useState(0);   // 개인 요청(requested)
  const [pendingBookingCount, setPendingBookingCount] = useState(0); // 대기 예약(waiting)
  const [renewalCount, setRenewalCount] = useState(0);           // 갱신·수금(5일내+미납)
  const [bizRequestCount, setBizRequestCount] = useState(0);     // 기업 배차·폐기(pending)
  const [quickCount, setQuickCount] = useState(0);               // 씬박스홈 상담(requested)

  // 매출
  const [personalRevenue, setPersonalRevenue] = useState(0);     // 개인 구독 월 매출
  const [bizRevenue, setBizRevenue] = useState(0);               // 기업 이번달 청구
  const [unpaidAmount, setUnpaidAmount] = useState(0);

  // 기업 가동률
  const [totalGrids, setTotalGrids] = useState(0);
  const [usedGrids, setUsedGrids] = useState(0);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const now = today();
      const y = now.getFullYear();
      const m = now.getMonth() + 1;

      // ─── 개인 요청(requested) 카운트 ───
      const { count: pReq } = await supabase
        .from('personal_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'requested');
      setPersonalReqCount(pReq ?? 0);

      // ─── 대기 예약(pending_bookings waiting) 카운트 ───
      const { count: pending } = await supabase
        .from('pending_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waiting');
      setPendingBookingCount(pending ?? 0);

      // ─── 씬박스홈 상담(quick_requests requested) 카운트 ───
      const { count: quick } = await supabase
        .from('quick_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'requested');
      setQuickCount(quick ?? 0);

      // ─── 개인 구독: 매출 + 갱신·수금 카운트 ───
      const { data: subs } = await supabase
        .from('personal_subscriptions')
        .select('monthly_fee, next_payment_date, status')
        .eq('status', 'active');

      let pRev = 0, renewCnt = 0;
      for (const s of (subs ?? []) as any[]) {
        pRev += s.monthly_fee ?? 0;
        if (s.next_payment_date) {
          const dday = daysBetween(toDate(s.next_payment_date), now);
          if (dday < 0 || dday <= 5) renewCnt++; // 미납 or 5일내 갱신
        }
      }
      setPersonalRevenue(pRev);

      // ─── 기업 청구: 매출 + 미납 + 갱신(청구일 임박·미납) 카운트 ───
      const { data: bills } = await supabase
        .from('monthly_bills')
        .select('storage_fee, transport_fee, disposal_fee, total_amount, status')
        .eq('billing_year', y)
        .eq('billing_month', m);

      let bRev = 0, unpaid = 0;
      for (const b of (bills ?? []) as any[]) {
        const amt = b.total_amount ?? ((b.storage_fee ?? 0) + (b.transport_fee ?? 0) + (b.disposal_fee ?? 0));
        bRev += amt;
        if (b.status !== 'paid') unpaid += amt;
      }
      setBizRevenue(bRev);
      setUnpaidAmount(unpaid);

      // 기업 갱신·수금(billing_day 설정된 기업의 청구 임박/미납) - 간이 카운트
      const { data: bizClients } = await supabase
        .from('clients')
        .select('id, billing_day')
        .eq('user_type', 'business')
        .eq('is_active', true)
        .not('billing_day', 'is', null);
      let bizRenew = 0;
      for (const c of (bizClients ?? []) as any[]) {
        const billDay = Math.min(c.billing_day, 28);
        const billDate = new Date(y, now.getMonth(), billDay); billDate.setHours(0,0,0,0);
        const dday = daysBetween(billDate, now);
        const { data: bill } = await supabase
          .from('monthly_bills')
          .select('status')
          .eq('client_id', c.id).eq('billing_year', y).eq('billing_month', m)
          .order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (!bill && dday <= 5 && dday >= -30) bizRenew++;               // 청구 예정
        else if (bill && bill.status !== 'paid' && dday <= -3) bizRenew++; // 미납
      }
      // 갱신·수금 통합 카운트 = 개인 + 기업
      setRenewalCount(renewCnt + bizRenew);

      // ─── 기업 배차·폐기 요청(pending) 카운트 ───
      const { count: tCount } = await supabase
        .from('transport_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      const { count: dCount } = await supabase
        .from('disposal_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      setBizRequestCount((tCount ?? 0) + (dCount ?? 0));

      // ─── 가동률 ───
      const { count: total } = await supabase.from('grids').select('*', { count: 'exact', head: true });
      const { count: used } = await supabase.from('spaces').select('*', { count: 'exact', head: true }).eq('status', 'active');
      setTotalGrids(total ?? 0);
      setUsedGrids(used ?? 0);

      setIsLoading(false);
    }
    fetchData();
  }, []);

  const totalRevenue = personalRevenue + bizRevenue;
  const occupancyRate = totalGrids > 0 ? Math.round((usedGrids / totalGrids) * 100) : 0;
  const totalTodo = personalReqCount + pendingBookingCount + renewalCount + bizRequestCount + quickCount;

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
        <button onClick={() => router.push('/admin/renewals')} className="text-gray-500 text-xl">🔔</button>
      </div>

      <div className="p-4 space-y-4">

        {/* ─── 오늘 처리할 일 (통합 요약) ─── */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-800">📋 오늘 처리할 일</h2>
            <span className="text-xs font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full">총 {totalTodo}건</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TodoCell label="상담 신청" desc="신규 문의" count={quickCount} color="text-teal-600" onClick={() => router.push('/admin/quick')} />
            <TodoCell label="개인 요청" desc="기존 고객 보관·반출" count={personalReqCount} color="text-blue-600" onClick={() => router.push('/admin/personal')} />
            <TodoCell label="대기 예약" desc="전화 예약 대기" count={pendingBookingCount} color="text-indigo-600" onClick={() => router.push('/admin/personal')} />
            <TodoCell label="갱신·수금" desc="갱신·미납" count={renewalCount} color="text-orange-600" onClick={() => router.push('/admin/renewals')} />
            <TodoCell label="기업 배차" desc="배차·폐기" count={bizRequestCount} color="text-purple-600" onClick={() => router.push('/admin/booking')} />
          </div>
        </div>

        {/* ─── 이번 달 매출 (통합) ─── */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-sm font-medium text-gray-500 mb-2">이번 달 매출 (개인+기업)</h2>
          <p className="text-2xl font-bold text-gray-900">{totalRevenue.toLocaleString()}원</p>
          <div className="flex gap-3 mt-2 text-xs">
            <span className="text-gray-500">개인 <b className="text-gray-700">{personalRevenue.toLocaleString()}</b></span>
            <span className="text-gray-500">기업 <b className="text-gray-700">{bizRevenue.toLocaleString()}</b></span>
          </div>
          {unpaidAmount > 0 && (
            <p className="text-xs text-red-500 mt-2 font-medium bg-red-50 inline-block px-2 py-1 rounded">
              기업 미결제 {unpaidAmount.toLocaleString()}원 포함
            </p>
          )}
        </div>

        {/* ─── 갱신·수금 관리 진입 ─── */}
        <button onClick={() => router.push('/admin/renewals')}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-2xl shadow-sm active:opacity-90 flex items-center justify-between">
          <div className="text-left">
            <p className="font-bold">🔔 갱신·수금 관리</p>
            <p className="text-xs opacity-90 mt-0.5">오늘 처리할 갱신·미납 {renewalCount}건</p>
          </div>
          <span className="text-xl">→</span>
        </button>

        {/* ─── 개인 영역 ─── */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm font-bold text-gray-800 mb-3">👤 개인 보관</p>
          <div className="flex gap-2">
            <button onClick={() => router.push('/admin/personal')}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold active:bg-blue-700">
              개인 관리
              {personalReqCount > 0 && <span className="ml-1 text-xs">({personalReqCount})</span>}
            </button>
            <button onClick={() => router.push('/admin/quick')}
              className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-bold active:bg-gray-50">
              🏠 씬박스홈 상담
            </button>
          </div>
        </div>

        {/* ─── 기업 영역 ─── */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-800">🏢 기업 물류</p>
            <span className="text-xs text-gray-400">가동률 {occupancyRate}% ({usedGrids}/{totalGrids})</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
            <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${occupancyRate}%` }}></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push('/admin/booking')}
              className="flex-1 bg-purple-600 text-white py-3 rounded-xl text-sm font-bold active:bg-purple-700">
              📦 예약 관리
              {bizRequestCount > 0 && <span className="ml-1 text-xs">({bizRequestCount})</span>}
            </button>
            <button onClick={() => router.push('/admin/billing')}
              className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-bold active:bg-gray-50">
              💰 요금 청구
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// 오늘 처리할 일 셀
function TodoCell({ label, desc, count, color, onClick }: {
  label: string; desc?: string; count: number; color: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={`text-left p-3 rounded-xl border ${count > 0 ? 'border-gray-200 bg-gray-50' : 'border-gray-100 bg-white'} active:bg-gray-100`}>
      <p className="text-xs font-medium text-gray-600">{label}</p>
      {desc && <p className="text-[10px] text-gray-400 mb-0.5">{desc}</p>}
      <p className={`text-xl font-bold ${count > 0 ? color : 'text-gray-300'}`}>{count}</p>
    </button>
  );
}