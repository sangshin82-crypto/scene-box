'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

type Client = { id: string; name: string; };
type Bill = { id: string; status: string; transport_fee: number; disposal_fee: number; storage_fee: number; admin_memo: string | null; };

export default function AdminBilling() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [bill, setBill] = useState<Bill | null>(null);
  const [transportFee, setTransportFee] = useState('');
  const [disposalFee, setDisposalFee] = useState('');
  const [storageFee, setStorageFee] = useState('');
  const [memo, setMemo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 청구 월 선택 (기본값: 다음 달)
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [billingYear, setBillingYear]   = useState(nextMonth.getFullYear());
  const [billingMonth, setBillingMonth] = useState(nextMonth.getMonth() + 1);

  // 선택 가능한 월 목록 (현재 달 ~ 3개월 후)
  const monthOptions = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  useEffect(() => {
    async function fetchClients() {
      const { data } = await supabase.from('clients').select('id, name').order('name');
      setClients(data ?? []);
      if (data?.length) setSelectedClientId(data[0].id);
      setIsLoading(false);
    }
    fetchClients();
  }, []);

  useEffect(() => {
    if (!selectedClientId) return;
    async function fetchBill() {
      const { data } = await supabase
        .from('monthly_bills')
        .select('*')
        .eq('client_id', selectedClientId)
        .eq('billing_year', billingYear)
        .eq('billing_month', billingMonth)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setBill(data);
        setTransportFee(String(data.transport_fee ?? ''));
        setDisposalFee(String(data.disposal_fee ?? ''));
        setStorageFee(String(data.storage_fee ?? ''));
        setMemo(data.admin_memo ?? '');
      } else {
        setBill(null);
        setTransportFee('');
        setDisposalFee('');
        setStorageFee('');
        setMemo('');
      }
    }
    fetchBill();
  }, [selectedClientId, billingYear, billingMonth]);

  const handleSave = async () => {
    if (!selectedClientId || isSaving) return;

    // 결제 완료 상태인 경우 경고
    if (bill?.status === 'paid') {
      const confirmed = window.confirm(
        '⚠️ 이 고객은 해당 월 이미 결제를 완료했습니다.\n\n저장 시 재결제가 요청됩니다. 신규 청구가 맞습니까?'
      );
      if (!confirmed) return;
    }

    // 금액이 동일한 경우 중복 경고
    if (bill && bill.status === 'pending') {
      const prevTotal = (bill.transport_fee ?? 0) + (bill.disposal_fee ?? 0) + (bill.storage_fee ?? 0);
      const newTotal  = (Number(transportFee) || 0) + (Number(disposalFee) || 0) + (Number(storageFee) || 0);
      if (prevTotal === newTotal && prevTotal > 0) {
        const confirmed = window.confirm(
          '⚠️ 이전 청구와 동일한 금액입니다.\n\n중복 청구입니까, 신규 청구입니까?\n[확인] = 저장 진행  [취소] = 돌아가기'
        );
        if (!confirmed) return;
      }
    }

    setIsSaving(true);

    const transport = Number(transportFee) || 0;
    const disposal  = Number(disposalFee)  || 0;
    const storage   = Number(storageFee)   || 0;

    const updateData = {
      transport_fee: transport,
      disposal_fee:  disposal,
      storage_fee:   storage,
      admin_memo:    memo || null,
      status:        'pending' as const,
      paid_at:       null,
    };

    let billId = bill?.id;

    if (bill) {
      const { error } = await supabase.from('monthly_bills').update(updateData).eq('id', bill.id);
      if (error) { alert('업데이트 오류: ' + error.message); setIsSaving(false); return; }
    } else {
      const { data, error } = await supabase
        .from('monthly_bills')
        .insert({
          client_id:     selectedClientId,
          billing_year:  billingYear,
          billing_month: billingMonth,
          ...updateData,
        })
        .select()
        .single();
      if (error) { alert('생성 오류: ' + error.message); setIsSaving(false); return; }
      billId = data.id;
    }

    await supabase.from('bill_line_items').delete().eq('bill_id', billId);

    const lineItems = [
      { bill_id: billId, item_type: 'storage',  description: '보관료',        amount: storage   },
      { bill_id: billId, item_type: 'transport', description: '운송비',        amount: transport },
      { bill_id: billId, item_type: 'disposal',  description: '폐기물 처리비', amount: disposal  },
    ].filter(item => item.amount > 0);

    if (lineItems.length > 0) {
      const { error } = await supabase.from('bill_line_items').insert(lineItems);
      if (error) { alert('항목 저장 오류: ' + error.message); setIsSaving(false); return; }
    }

    setBill(prev => prev ? { ...prev, ...updateData } : null);
    alert(`${billingYear}년 ${billingMonth}월 청구서가 저장되었습니다! ✅`);
    setIsSaving(false);
  };

  if (isLoading) return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
      <p className="animate-pulse text-[14px] font-bold text-gray-500">불러오는 중...</p>
    </div>
  );

  return (
    <div className="relative mx-auto w-full max-w-md min-h-screen bg-gray-50 pb-[100px] shadow-xl">
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center">
        <button onClick={() => router.back()} className="text-gray-500 text-xl mr-3">{'<'}</button>
        <h1 className="text-lg font-bold text-gray-900">고객 청구 요금 입력</h1>
      </div>

      <div className="p-4 space-y-4">

        {/* 고객 선택 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-2">청구 대상 고객 선택</p>
          <select
            value={selectedClientId}
            onChange={e => setSelectedClientId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-500 text-gray-900 font-bold"
          >
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {bill && (
            <p className="text-xs text-green-600 mt-2 font-medium">
              ✅ {billingYear}년 {billingMonth}월 청구서 있음 (상태: {bill.status === 'pending' ? '미결제' : '결제완료'})
            </p>
          )}
          {!bill && selectedClientId && (
            <p className="text-xs text-orange-500 mt-2 font-medium">
              ⚠️ {billingYear}년 {billingMonth}월 청구서 없음 — 저장 시 새로 생성됩니다
            </p>
          )}
        </div>

        {/* 청구 월 선택 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-2">청구 월 선택</p>
          <select
            value={`${billingYear}-${billingMonth}`}
            onChange={e => {
              const [y, m] = e.target.value.split('-').map(Number);
              setBillingYear(y);
              setBillingMonth(m);
            }}
            className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-500 text-gray-900 font-bold"
          >
            {monthOptions.map(({ year, month }) => (
              <option key={`${year}-${month}`} value={`${year}-${month}`}>
                {year}년 {month}월
                {year === nextMonth.getFullYear() && month === nextMonth.getMonth() + 1 ? ' (다음 달)' : ''}
                {year === now.getFullYear() && month === now.getMonth() + 1 ? ' (이번 달)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* 금액 입력 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">보관료 (원)</label>
            <input type="number" placeholder="0" value={storageFee} onChange={e => setStorageFee(e.target.value)} className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-500 text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">운송료 (원)</label>
            <input type="number" placeholder="0" value={transportFee} onChange={e => setTransportFee(e.target.value)} className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-500 text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">폐기물 처리비 (원)</label>
            <input type="number" placeholder="0" value={disposalFee} onChange={e => setDisposalFee(e.target.value)} className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-500 text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">비고 / 메모</label>
            <textarea rows={3} placeholder="청구 사유나 특이사항을 메모해 주세요." value={memo} onChange={e => setMemo(e.target.value)} className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-500 text-gray-900" />
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <p className="text-sm text-blue-700 font-bold">
            총 청구액: {((Number(storageFee)||0)+(Number(transportFee)||0)+(Number(disposalFee)||0)).toLocaleString()}원
          </p>
          <p className="text-xs text-blue-500 mt-1">
            청구 대상: {billingYear}년 {billingMonth}월
          </p>
        </div>

        <button onClick={handleSave} disabled={isSaving} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-sm active:bg-blue-700 transition-colors">
          {isSaving ? '저장 중...' : `${billingYear}년 ${billingMonth}월 청구서 저장`}
        </button>
      </div>
    </div>
  );
}
