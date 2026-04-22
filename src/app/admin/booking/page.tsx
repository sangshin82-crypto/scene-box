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

type Transport = {
  id: string;
  client_id: string;
  origin_address: string | null;
  destination: string | null;
  scheduled_at: string;
  truck_type: string;
  helper_option: string | null;
  driver_note: string | null;
  confirmed_fare: number | null;
  management_fee: number | null;
  total_charge: number | null;
  status: string;
  created_at: string;
  clients: { name: string } | null;
};

type Disposal = {
  id: string;
  client_id: string;
  measured_weight_kg: number | null;
  unit_price_per_kg: number | null;
  disposal_charge: number | null;
  transport_fee: number | null;
  total_charge: number | null;
  status: string;
  created_at: string;
  clients: { name: string } | null;
};

type Tab = 'space' | 'transport' | 'disposal';

export default function BookingManagement() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('space');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [transports, setTransports] = useState<Transport[]>([]);
  const [disposals, setDisposals] = useState<Disposal[]>([]);

  useEffect(() => {
    async function fetchAll() {
      const [{ data: spacesData }, { data: transportsData }, { data: disposalsData }] = await Promise.all([
        supabase
          .from('spaces')
          .select('id, client_id, start_date, end_date, status, plan_type, monthly_fee, clients(name), grids(grid_number, zone)')
          .order('end_date', { ascending: true }),
        supabase
          .from('transport_requests')
          .select('id, client_id, origin_address, destination, scheduled_at, truck_type, helper_option, driver_note, confirmed_fare, management_fee, total_charge, status, created_at, clients(name)')
          .order('created_at', { ascending: false }),
        supabase
          .from('disposal_requests')
          .select('id, client_id, measured_weight_kg, unit_price_per_kg, disposal_charge, transport_fee, total_charge, status, created_at, clients(name)')
          .order('created_at', { ascending: false }),
      ]);

      setSpaces((spacesData ?? []) as unknown as Space[]);
      setTransports((transportsData ?? []) as unknown as Transport[]);
      setDisposals((disposalsData ?? []) as unknown as Disposal[]);
      setIsLoading(false);
    }
    fetchAll();
  }, []);

  const fmtDate = (d: string) => {
    const date = new Date(d);
    return `${date.getFullYear().toString().slice(2)}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const fmtDateTime = (d: string) => {
    const date = new Date(d);
    return `${date.getFullYear().toString().slice(2)}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getDday = (endDate: string) => Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const getSpaceBadge = (endDate: string, status: string) => {
    if (status !== 'active') return { label: '종료', color: 'text-gray-500', bg: 'bg-gray-50' };
    const dday = getDday(endDate);
    if (dday <= 7)  return { label: `만기임박 D-${dday}`, color: 'text-orange-600', bg: 'bg-orange-50' };
    if (dday <= 30) return { label: '만기예정',            color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { label: '이용중', color: 'text-blue-600', bg: 'bg-blue-50' };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':   return { label: '처리 대기', color: 'text-red-600',   bg: 'bg-red-50'   };
      case 'confirmed': return { label: '확정됨',   color: 'text-blue-600',  bg: 'bg-blue-50'  };
      case 'completed': return { label: '완료',     color: 'text-green-600', bg: 'bg-green-50' };
      case 'cancelled': return { label: '취소됨',   color: 'text-gray-500',  bg: 'bg-gray-100' };
      default:          return { label: status,     color: 'text-gray-500',  bg: 'bg-gray-100' };
    }
  };

  const helperLabel = (option: string | null) => {
    switch (option) {
      case 'none':   return null;
      case 'porter': return '👷 포터 동행';
      default:       return option ? `👷 ${option}` : null;
    }
  };

  const filteredSpaces = spaces.filter(s =>
    !query || (s.clients?.name ?? '').includes(query) || (s.grids?.grid_number ?? '').includes(query)
  );

  const filteredTransports = transports.filter(t =>
    !query ||
    (t.clients?.name ?? '').includes(query) ||
    (t.origin_address ?? '').includes(query) ||
    (t.destination ?? '').includes(query) ||
    (t.truck_type ?? '').includes(query)
  );

  const filteredDisposals = disposals.filter(d =>
    !query || (d.clients?.name ?? '').includes(query)
  );

  const pendingTransports = transports.filter(t => t.status === 'pending').length;
  const pendingDisposals = disposals.filter(d => d.status === 'pending').length;

  if (isLoading) return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
      <p className="animate-pulse text-[14px] font-bold text-gray-500">불러오는 중...</p>
    </div>
  );

  return (
    <div className="relative mx-auto w-full max-w-md min-h-screen bg-gray-50 pb-[100px] shadow-xl">

      {/* 헤더 */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-lg font-bold text-gray-900">예약 관리</h1>
          <span className="text-sm text-gray-400">
            {activeTab === 'space' ? filteredSpaces.length : activeTab === 'transport' ? filteredTransports.length : filteredDisposals.length}건
          </span>
        </div>
        <div className="bg-gray-100 rounded-lg flex items-center px-3 py-2">
          <span className="text-gray-400 mr-2">🔍</span>
          <input
            type="text"
            placeholder="이름 / 주소 검색"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm"
          />
        </div>
      </div>

      {/* 탭 */}
      <div className="bg-white border-b border-gray-200 flex">
        {([
          { key: 'space',     label: '📦 공간 계약', badge: 0 },
          { key: 'transport', label: '🚚 배차 신청', badge: pendingTransports },
          { key: 'disposal',  label: '🗑️ 폐기 신청', badge: pendingDisposals },
        ] as { key: Tab; label: string; badge: number }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setQuery(''); }}
            className={`relative flex-1 py-3 text-xs font-bold transition-colors ${
              activeTab === tab.key ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'
            }`}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span className="absolute top-1.5 right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 공간 계약 탭 */}
      {activeTab === 'space' && (
        <div className="p-4 space-y-3">
          {filteredSpaces.length === 0 ? (
            <div className="bg-white p-6 rounded-xl text-center text-sm text-gray-400">계약 내역이 없습니다.</div>
          ) : (
            filteredSpaces.map(space => {
              const { label, color, bg } = getSpaceBadge(space.end_date, space.status);
              const gridLabel = space.grids ? `${space.grids.zone}존 ${space.grids.grid_number}` : '—';
              return (
                <div key={space.id} onClick={() => router.push('/admin/billing')}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer active:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-gray-900">
                      {space.clients?.name ?? '고객'}
                      <span className="font-normal text-gray-500 text-sm ml-1">({gridLabel})</span>
                    </p>
                    <span className={`text-xs font-bold ${color} ${bg} px-2 py-1 rounded-md`}>{label}</span>
                  </div>
                  <p className="text-sm text-gray-500">{fmtDate(space.start_date)} ~ {fmtDate(space.end_date)}</p>
                  <p className="text-xs text-gray-400 mt-1">월 {space.monthly_fee.toLocaleString()}원 · {space.plan_type}</p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 배차 신청 탭 */}
      {activeTab === 'transport' && (
        <div className="p-4 space-y-3">
          {filteredTransports.length === 0 ? (
            <div className="bg-white p-6 rounded-xl text-center text-sm text-gray-400">배차 신청이 없습니다.</div>
          ) : (
            filteredTransports.map(t => {
              const { label, color, bg } = getStatusBadge(t.status);
              const helper = helperLabel(t.helper_option);
              return (
                <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <p className="font-bold text-gray-900">{t.clients?.name ?? '고객'}</p>
                    <span className={`text-xs font-bold ${color} ${bg} px-2 py-1 rounded-md`}>{label}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-gray-800">🚚 {t.truck_type}</span>
                    {helper && (
                      <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">{helper}</span>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-2 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-green-600 font-bold mt-0.5 shrink-0">출발</span>
                      <span className="text-xs text-gray-700">{t.origin_address ?? '—'}</span>
                    </div>
                    <div className="border-l-2 border-dashed border-gray-300 ml-[18px] h-2" />
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-blue-600 font-bold mt-0.5 shrink-0">도착</span>
                      <span className="text-xs text-gray-700">{t.destination ?? '—'}</span>
                    </div>
                  </div>

                  <p className="text-xs text-blue-500 font-medium mb-1">📅 {fmtDateTime(t.scheduled_at)}</p>

                  {t.driver_note && (
                    <p className="text-xs text-orange-600 bg-orange-50 rounded-md px-2 py-1.5 mb-2">
                      💬 {t.driver_note}
                    </p>
                  )}

                  {(t.confirmed_fare || t.management_fee || t.total_charge) && (
                    <div className="bg-blue-50 rounded-lg p-2.5 mb-2 space-y-1">
                      {t.confirmed_fare && <p className="text-xs text-gray-600">확정 요금: <span className="font-bold text-gray-900">{t.confirmed_fare.toLocaleString()}원</span></p>}
                      {t.management_fee && <p className="text-xs text-gray-600">관리 수수료: <span className="font-bold text-gray-900">{t.management_fee.toLocaleString()}원</span></p>}
                      {t.total_charge && <p className="text-xs text-blue-700 font-bold">총 청구액: {t.total_charge.toLocaleString()}원</p>}
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mb-2">신청일: {fmtDate(t.created_at)}</p>

                  {t.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          await supabase.from('transport_requests').update({ status: 'confirmed' }).eq('id', t.id);
                          setTransports(prev => prev.map(x => x.id === t.id ? { ...x, status: 'confirmed' } : x));
                        }}
                        className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold"
                      >✅ 확정</button>
                      <button
                        onClick={async () => {
                          await supabase.from('transport_requests').update({ status: 'cancelled' }).eq('id', t.id);
                          setTransports(prev => prev.map(x => x.id === t.id ? { ...x, status: 'cancelled' } : x));
                        }}
                        className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold"
                      >✕ 취소</button>
                    </div>
                  )}
                  {t.status === 'confirmed' && (
                    <button
                      onClick={async () => {
                        await supabase.from('transport_requests').update({ status: 'completed' }).eq('id', t.id);
                        setTransports(prev => prev.map(x => x.id === t.id ? { ...x, status: 'completed' } : x));
                      }}
                      className="w-full py-2 rounded-lg bg-green-500 text-white text-xs font-bold"
                    >🏁 완료 처리</button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 폐기 신청 탭 */}
      {activeTab === 'disposal' && (
        <div className="p-4 space-y-3">
          {filteredDisposals.length === 0 ? (
            <div className="bg-white p-6 rounded-xl text-center text-sm text-gray-400">폐기 신청이 없습니다.</div>
          ) : (
            filteredDisposals.map(d => {
              const { label, color, bg } = getStatusBadge(d.status);
              return (
                <div key={d.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <p className="font-bold text-gray-900">{d.clients?.name ?? '고객'}</p>
                    <span className={`text-xs font-bold ${color} ${bg} px-2 py-1 rounded-md`}>{label}</span>
                  </div>

                  {d.measured_weight_kg && (
                    <p className="text-xs text-gray-500 mb-1">⚖️ 실측 무게: <span className="font-bold text-gray-800">{d.measured_weight_kg}kg</span></p>
                  )}
                  {d.unit_price_per_kg && (
                    <p className="text-xs text-gray-500 mb-2">💵 kg당 단가: <span className="font-bold text-gray-800">{d.unit_price_per_kg.toLocaleString()}원</span></p>
                  )}

                  <div className="bg-blue-50 rounded-lg p-2.5 mb-2 space-y-1">
                    {d.disposal_charge
                      ? <p className="text-xs text-gray-600">폐기 비용: <span className="font-bold text-gray-900">{d.disposal_charge.toLocaleString()}원</span></p>
                      : <p className="text-xs text-orange-500">폐기 비용: 미입력</p>
                    }
                    {d.transport_fee
                      ? <p className="text-xs text-gray-600">운송비: <span className="font-bold text-gray-900">{d.transport_fee.toLocaleString()}원</span></p>
                      : <p className="text-xs text-gray-400">운송비: 없음</p>
                    }
                    {d.total_charge
                      ? <p className="text-xs text-blue-700 font-bold">총 청구액: {d.total_charge.toLocaleString()}원</p>
                      : <p className="text-xs text-orange-500 font-bold">총 청구액: 미입력</p>
                    }
                  </div>

                  <p className="text-xs text-gray-400 mb-2">신청일: {fmtDate(d.created_at)}</p>

                  {d.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          await supabase.from('disposal_requests').update({ status: 'confirmed' }).eq('id', d.id);
                          setDisposals(prev => prev.map(x => x.id === d.id ? { ...x, status: 'confirmed' } : x));
                        }}
                        className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold"
                      >✅ 확정</button>
                      <button
                        onClick={async () => {
                          await supabase.from('disposal_requests').update({ status: 'cancelled' }).eq('id', d.id);
                          setDisposals(prev => prev.map(x => x.id === d.id ? { ...x, status: 'cancelled' } : x));
                        }}
                        className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold"
                      >✕ 취소</button>
                    </div>
                  )}
                  {d.status === 'confirmed' && (
                    <button
                      onClick={async () => {
                        await supabase.from('disposal_requests').update({ status: 'completed' }).eq('id', d.id);
                        setDisposals(prev => prev.map(x => x.id === d.id ? { ...x, status: 'completed' } : x));
                      }}
                      className="w-full py-2 rounded-lg bg-green-500 text-white text-xs font-bold"
                    >🏁 완료 처리</button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

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
        <button onClick={() => router.push('/admin/clients')} className="flex flex-col items-center justify-center w-full h-full text-gray-400">
          <span className="text-xl mb-0.5">👥</span>
          <span className="text-[10px] font-medium">고객관리</span>
        </button>
      </div>
    </div>
  );
}