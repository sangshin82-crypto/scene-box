'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

// 롤테이너 요금 (VAT 포함, 1칸 기준)
const PRICE_3M_MONTHLY = 33000;  // 3개월 약정 월 단가
const PRICE_1M = 44000;          // 1개월 보관 단가
const PICKUP_RETRIEVAL_FEE = 50000; // 1개월 수거+반출 고정(왕복 1회)

type Req = {
  id: string;
  client_id: string;
  request_type: string;
  plan_type: string | null;        // '3month' | '1month'
  retrieval_type: string | null;   // 'regular' | 'parcel' | 'oncall'
  unit_count: number | null;
  label_no: string | null;
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

const planLabel = (p: string | null) =>
  p === '3month' ? '3개월 약정' : p === '1month' ? '1개월' : '-';

const reqTitle = (r: Req) => {
  if (r.request_type === 'storage') return `📦 보관 ${r.unit_count ?? ''}칸`;
  const t = r.retrieval_type === 'oncall' ? '수시' : r.retrieval_type === 'parcel' ? '택배' : '정기';
  return `📤 반출 (${t})`;
};

// storage 요청의 예상 결제액 계산 (booking과 동일 공식)
const calcAmount = (planType: string | null, units: number) => {
  if (planType === '3month') return PRICE_3M_MONTHLY * 3 * units;
  return PRICE_1M * units + PICKUP_RETRIEVAL_FEE; // 1month
};

// 구독 월 요금 = 보관료만 (수거·반출 제외)
const calcMonthlyFee = (planType: string | null, units: number) =>
  (planType === '3month' ? PRICE_3M_MONTHLY : PRICE_1M) * units;

export default function AdminPersonalPage() {
  const router = useRouter();
  const [reqs, setReqs] = useState<Req[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('active');
  const [editId, setEditId] = useState<string | null>(null);   // 칸 수 편집 중인 요청 id
  const [editUnits, setEditUnits] = useState<number>(1);        // 편집 중 칸 수

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

  // ── 칸 수 현장 수정 (storage만) ──
  const startEdit = (r: Req) => {
    setEditId(r.id);
    setEditUnits(r.unit_count ?? 1);
  };
  const cancelEdit = () => { setEditId(null); };

  const saveEdit = async (r: Req) => {
    const newAmount = calcAmount(r.plan_type, editUnits);
    const { error } = await supabase
      .from('personal_requests')
      .update({ unit_count: editUnits, amount: newAmount, updated_at: new Date().toISOString() })
      .eq('id', r.id);
    if (error) { alert('수정 실패: ' + error.message); return; }
    setEditId(null);
    fetchReqs();
  };

  const updateStatus = async (id: string, next: string, req: Req) => {
    if (!window.confirm(`상태를 변경하시겠어요?`)) return;

    const { error } = await supabase
      .from('personal_requests')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) { alert('변경 실패: ' + error.message); return; }

    // 보관 요청이 결제완료되면 구독 생성/갱신 (확정된 칸 수·plan_type 기준)
    if (next === 'paid' && req.request_type === 'storage' && req.unit_count) {
      await applySubscription(req.client_id, req.plan_type, req.unit_count);
    }

    fetchReqs();
  };

  // 구독 생성 또는 칸 수 추가
  const applySubscription = async (clientId: string, planType: string | null, addUnits: number) => {
    // 같은 plan_type의 active 구독만 찾아 합산. 다른 유형이면 새 행 생성.
    const { data: existing } = await supabase
      .from('personal_subscriptions')
      .select('id, unit_count')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .eq('plan_type', planType)
      .maybeSingle();

    // 약정 유형에 따른 다음 결제일: 3개월 약정=3개월 후, 1개월=1개월 후
    const nextPay = new Date();
    nextPay.setMonth(nextPay.getMonth() + (planType === '3month' ? 3 : 1));
    const nextPayStr = nextPay.toISOString().slice(0, 10);

    if (existing) {
      const newCount = existing.unit_count + addUnits;
      const { error } = await supabase
        .from('personal_subscriptions')
        .update({
          unit_count: newCount,
          monthly_fee: calcMonthlyFee(planType, newCount),
          plan_type: planType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      if (error) alert('구독 갱신 실패: ' + error.message);
    } else {
      const { error } = await supabase
        .from('personal_subscriptions')
        .insert({
          client_id: clientId,
          plan_type: planType,
          unit_count: addUnits,
          monthly_fee: calcMonthlyFee(planType, addUnits),
          start_date: new Date().toISOString().slice(0, 10),
          next_payment_date: nextPayStr,
          status: 'active',
        });
      if (error) alert('구독 생성 실패: ' + error.message);
    }
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
            const isStorage = r.request_type === 'storage';
            const editable = isStorage && r.status !== 'completed' && r.status !== 'cancelled';
            const isEditing = editId === r.id;
            return (
              <div key={r.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-gray-900">{reqTitle(r)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {r.clients?.name ?? '고객'} · {r.clients?.contact_phone ?? '-'}
                      {isStorage && <> · {planLabel(r.plan_type)}</>}
                    </p>
                  </div>
                  <span className={`text-xs font-bold ${si.color} ${si.bg} px-2.5 py-1 rounded-md`}>{si.label}</span>
                </div>

                <div className="text-xs text-gray-600 space-y-1 mb-3 bg-gray-50 rounded-lg p-3">
                  <p>📍 {r.address_detail}</p>
                  {r.label_no && <p>🔍 라벨 번호: {r.label_no}</p>}
                  {r.desired_date && <p>📅 희망일: {r.desired_date}</p>}
                  {r.memo && <p>📝 {r.memo}</p>}
                  <p>💰 {r.amount === 0 ? '무료' : `${r.amount.toLocaleString()}원`}</p>
                  <p className="text-gray-400">접수: {fmtDate(r.created_at)}</p>
                </div>

                {/* 칸 수 현장 수정 (storage만) */}
                {editable && !isEditing && (
                  <button onClick={() => startEdit(r)}
                    className="mb-2 w-full border border-gray-200 text-gray-600 py-2 rounded-lg text-xs font-bold active:bg-gray-50">
                    ✏️ 현장 칸 수 수정 (현재 {r.unit_count}칸)
                  </button>
                )}
                {editable && isEditing && (
                  <div className="mb-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-600">실제 칸 수</span>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setEditUnits((c) => Math.max(1, c - 1))}
                          className="w-8 h-8 rounded-lg border border-gray-300 bg-white font-bold text-gray-600">−</button>
                        <span className="text-lg font-bold text-gray-900 w-8 text-center">{editUnits}</span>
                        <button onClick={() => setEditUnits((c) => c + 1)}
                          className="w-8 h-8 rounded-lg border border-gray-300 bg-white font-bold text-gray-600">+</button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      예상 금액: <b>{calcAmount(r.plan_type, editUnits).toLocaleString()}원</b>
                      {r.plan_type === '1month' && ' (보관료 + 수거·반출 50,000원)'}
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(r)}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-bold active:bg-blue-700">저장</button>
                      <button onClick={cancelEdit}
                        className="px-4 bg-white border border-gray-200 text-gray-500 py-2 rounded-lg text-xs font-bold active:bg-gray-50">취소</button>
                    </div>
                  </div>
                )}

                {/* 상태 액션 버튼 */}
                {r.status !== 'completed' && r.status !== 'cancelled' && !isEditing && (
                  <div className="flex gap-2">
                    {action && (
                      <button onClick={() => updateStatus(r.id, action.next, r)}
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