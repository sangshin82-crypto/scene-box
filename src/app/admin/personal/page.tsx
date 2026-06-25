'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

type Req = {
  id: string;
  client_id: string;
  request_type: string;
  retrieval_type: string | null;
  box_count: number | null;
  item_desc: string | null;
  desired_date: string | null;
  address_detail: string;
  amount: number;
  memo: string | null;
  status: string;
  created_at: string;
  clients: { name: string; contact_phone: string } | null;
};

const NEXT_STATUS: Record<string, { next: string; label: string }> = {
  requested: { next: 'confirmed', label: '확인 처리' },
  confirmed: { next: 'paid', label: '결제완료 처리' },
  paid: { next: 'completed', label: '완료 처리' },
};

const statusInfo = (s: string) => {
  switch (s) {
    case 'requested': return { label: '접수됨', color: 'text-red-500', bg: 'bg-red-50' };
    case 'confirmed': return { label: '확인됨', color: 'text-blue-500', bg: 'bg-blue-50' };
    case 'paid': return { label: '결제완료', color: 'text-purple-600', bg: 'bg-purple-50' };
    case 'completed': return { label: '완료', color: 'text-green-600', bg: 'bg-green-50' };
    case 'cancelled': return { label: '취소됨', color: 'text-gray-500', bg: 'bg-gray-100' };
    default: return { label: s, color: 'text-gray-500', bg: 'bg-gray-50' };
  }
};

const fmtDate = (d: string) => {
  const date = new Date(d);
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const reqTitle = (r: Req) => {
  if (r.request_type === 'storage') return `📦 보관 ${r.box_count ?? ''}개`;
  const t = r.retrieval_type === 'urgent' ? '긴급' : r.retrieval_type === 'parcel' ? '택배' : '정기';
  return `📤 반출 (${t})`;
};

export default function AdminPersonalPage() {
  const router = useRouter();
  const [reqs, setReqs] = useState<Req[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('active'); // active = 진행중, all = 전체

  async function fetchReqs() {
    setIsLoading(true);
    let query = supabase
      .from('personal_requests')
      .select('*, clients(name, contact_phone)')
      .order('created_at', { ascending: false });

    if (filter === 'active') {
      query = query.in('status', ['requested', 'confirmed', 'paid']);
    }
    const { data } = await query;
    setReqs((data as Req[]) ?? []);
    setIsLoading(false);
  }

  useEffect(() => { fetchReqs(); }, [filter]);

  const updateStatus = async (id: string, next: string) => {
    if (!window.confirm(`상태를 변경하시겠어요?`)) return;
    const { error } = await supabase
      .from('personal_requests')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) { alert('변경 실패: ' + error.message); return; }
    fetchReqs();
  };

  const cancelReq = async (id: string) => {
    if (!window.confirm('이 요청을 취소 처리하시겠어요?')) return;
    const { error } = await supabase
      .from('personal_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) { alert('취소 실패: ' + error.message); return; }
    fetchReqs();
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
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/admin')} className="text-gray-500 text-lg">←</button>
          <h1 className="text-lg font-bold text-gray-900">개인 보관 요청</h1>
        </div>
        <button onClick={fetchReqs} className="text-gray-500 text-sm">새로고침</button>
      </div>

      {/* 필터 */}
      <div className="px-4 pt-4 flex gap-2">
        <button onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg text-sm font-bold ${filter === 'active' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
          진행 중
        </button>
        <button onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-bold ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
          전체
        </button>
      </div>

      {/* 요청 목록 */}
      <div className="p-4 space-y-3">
        {reqs.length === 0 ? (
          <div className="bg-white p-6 rounded-xl text-center text-sm text-gray-400">요청이 없습니다.</div>
        ) : (
          reqs.map((r) => {
            const si = statusInfo(r.status);
            const action = NEXT_STATUS[r.status];
            return (
              <div key={r.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-gray-900">{reqTitle(r)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.clients?.name ?? '고객'} · {r.clients?.contact_phone ?? '-'}</p>
                  </div>
                  <span className={`text-xs font-bold ${si.color} ${si.bg} px-2.5 py-1 rounded-md`}>{si.label}</span>
                </div>

                <div className="text-xs text-gray-600 space-y-1 mb-3 bg-gray-50 rounded-lg p-3">
                  <p>📍 {r.address_detail}</p>
                  {r.item_desc && <p>🔍 찾을 물건: {r.item_desc}</p>}
                  {r.desired_date && <p>📅 희망일: {r.desired_date}</p>}
                  {r.memo && <p>📝 {r.memo}</p>}
                  <p>💰 {r.amount === 0 ? '무료' : `${r.amount.toLocaleString()}원`}</p>
                  <p className="text-gray-400">접수: {fmtDate(r.created_at)}</p>
                </div>

                {/* 액션 버튼 */}
                {r.status !== 'completed' && r.status !== 'cancelled' && (
                  <div className="flex gap-2">
                    {action && (
                      <button onClick={() => updateStatus(r.id, action.next)}
                        className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-bold active:bg-blue-700">
                        {action.label}
                      </button>
                    )}
                    <button onClick={() => cancelReq(r.id)}
                      className="px-4 bg-white border border-gray-200 text-gray-500 py-2.5 rounded-lg text-sm font-bold active:bg-gray-50">
                      취소
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}