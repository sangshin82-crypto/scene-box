'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

type QuickReq = {
  id: string;
  name: string;
  phone: string;
  region: string | null;
  size: string;
  memo: string | null;
  source: string | null;
  status: string;
  consult_memo: string | null;
  created_at: string;
};

const NEXT_STATUS: Record<string, { next: string; label: string }> = {
  requested: { next: 'contacted', label: '연락완료 처리' },
  contacted: { next: 'converted', label: '예약전환 처리' },
};

const statusInfo = (s: string) => {
  switch (s) {
    case 'requested': return { label: '신규', color: 'text-red-500', bg: 'bg-red-50' };
    case 'contacted': return { label: '연락완료', color: 'text-blue-500', bg: 'bg-blue-50' };
    case 'converted': return { label: '예약전환', color: 'text-green-600', bg: 'bg-green-50' };
    case 'hold': return { label: '보류', color: 'text-gray-500', bg: 'bg-gray-100' };
    default: return { label: s, color: 'text-gray-500', bg: 'bg-gray-50' };
  }
};

const fmtDate = (d: string) => {
  const date = new Date(d);
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

export default function AdminQuickPage() {
  const router = useRouter();
  const [reqs, setReqs] = useState<QuickReq[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('active');

  async function fetchReqs() {
    setIsLoading(true);
    let query = supabase
      .from('quick_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter === 'active') {
      query = query.in('status', ['requested', 'contacted']);
    }
    const { data } = await query;
    setReqs((data as QuickReq[]) ?? []);
    setIsLoading(false);
  }

  useEffect(() => { fetchReqs(); }, [filter]);

  const updateStatus = async (id: string, next: string) => {
    if (!window.confirm('상태를 변경하시겠어요?')) return;
    const { error } = await supabase
      .from('quick_requests')
      .update({ status: next, converted: next === 'converted' })
      .eq('id', id);
    if (error) { alert('변경 실패: ' + error.message); return; }
    fetchReqs();
  };

  const holdReq = async (id: string) => {
    if (!window.confirm('이 신청을 보류 처리하시겠어요?')) return;
    const { error } = await supabase
      .from('quick_requests')
      .update({ status: 'hold' })
      .eq('id', id);
    if (error) { alert('보류 실패: ' + error.message); return; }
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
          <h1 className="text-lg font-bold text-gray-900">씬박스홈 상담 신청</h1>
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

      {/* 신청 목록 */}
      <div className="p-4 space-y-3">
        {reqs.length === 0 ? (
          <div className="bg-white p-6 rounded-xl text-center text-sm text-gray-400">신청이 없습니다.</div>
        ) : (
          reqs.map((r) => {
            const si = statusInfo(r.status);
            const action = NEXT_STATUS[r.status];
            return (
              <div key={r.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-gray-900">📦 {r.size}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.name} · {r.phone}</p>
                  </div>
                  <span className={`text-xs font-bold ${si.color} ${si.bg} px-2.5 py-1 rounded-md`}>{si.label}</span>
                </div>

                <div className="text-xs text-gray-600 space-y-1 mb-3 bg-gray-50 rounded-lg p-3">
                  {r.region && <p>📍 {r.region}</p>}
                  {r.memo && <p>📝 {r.memo}</p>}
                  {r.source && <p>🔗 출처: {r.source}</p>}
                  <p className="text-gray-400">접수: {fmtDate(r.created_at)}</p>
                </div>

                {/* 연락 버튼 3종 */}
                <div className="flex gap-2 mb-2">
                  <a href={`tel:${r.phone}`}
                    className="flex-1 text-center bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-bold active:bg-gray-200">
                    📞 전화
                  </a>
                  <a href={`sms:${r.phone}`}
                    className="flex-1 text-center bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-bold active:bg-gray-200">
                    💬 문자
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(r.phone);
                      alert(`번호를 복사했어요: ${r.phone}`);
                    }}
                    className="flex-1 text-center bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-bold active:bg-gray-200">
                    📋 번호복사
                  </button>
                </div>

                {/* 액션 버튼 */}
                {r.status !== 'converted' && r.status !== 'hold' && (
                  <div className="flex gap-2">
                    {action && (
                      <button onClick={() => updateStatus(r.id, action.next)}
                        className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-bold active:bg-blue-700">
                        {action.label}
                      </button>
                    )}
                    <button onClick={() => holdReq(r.id)}
                      className="px-4 bg-white border border-gray-200 text-gray-500 py-2.5 rounded-lg text-sm font-bold active:bg-gray-50">
                      보류
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