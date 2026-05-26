'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

type Client = { id: string; name: string; };
type Bill = { id: string; status: string; transport_fee: number; disposal_fee: number; storage_fee: number; admin_memo: string | null; };
type BillLineItem = { id: string; description: string; amount: number; item_type: string; };
type AllBill = Bill & { billing_year: number; billing_month: number; paid_at: string | null; lineItems: BillLineItem[]; };

export default function AdminBilling() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [bill, setBill] = useState<Bill | null>(null);
  const [transportFee, setTransportFee] = useState('');
  const [disposalFee, setDisposalFee] = useState('');
  const [storageFee, setStorageFee] = useState('');

  // 천원단위 콤마 포맷
  const fmtInput = (val: string) => {
    const num = val.replace(/[^0-9]/g, '');
    return num ? Number(num).toLocaleString('ko-KR') : '';
  };
  const parseInput = (val: string) => Number(val.replace(/[^0-9]/g, '')) || 0;
  const [memo, setMemo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [allBills, setAllBills] = useState<AllBill[]>([]);

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
    setBill(null);
    setTransportFee('');
    setDisposalFee('');
    setStorageFee('');
    setMemo('');

    async function fetchAllBills() {
      const { data: billsData } = await supabase
        .from('monthly_bills')
        .select('*')
        .eq('client_id', selectedClientId)
        .order('billing_year', { ascending: false })
        .order('billing_month', { ascending: false });

      if (billsData) {
        const withItems = await Promise.all(
          billsData.map(async (b) => {
            const { data: itemsData } = await supabase
              .from('bill_line_items')
              .select('*')
              .eq('bill_id', b.id)
              .neq('item_type', 'deposit')
              .order('created_at', { ascending: true });
            const filtered = (itemsData ?? []).filter(
              (item: any) => !item.description.startsWith('월 보관료')
            );
            return { ...b, lineItems: filtered };
          })
        );
        setAllBills(withItems.filter(b => b.lineItems.length > 0));
      }
    }
    fetchAllBills();

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
        setTransportFee(data.transport_fee ? Number(data.transport_fee).toLocaleString('ko-KR') : '');
        setDisposalFee(data.disposal_fee ? Number(data.disposal_fee).toLocaleString('ko-KR') : '');
        setStorageFee(data.storage_fee ? Number(data.storage_fee).toLocaleString('ko-KR') : '');
        setMemo(data.admin_memo ?? '');
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

    

    setIsSaving(true);

    const transport = parseInput(transportFee);
    const disposal  = parseInput(disposalFee);
    const storage   = parseInput(storageFee);

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

    

    // VAT 포함 금액으로 저장 (입력값 × 1.1)
    const lineItems = [
      { bill_id: billId, item_type: 'storage',  description: '보관료',        amount: Math.round(storage * 1.1)   },
      { bill_id: billId, item_type: 'transport', description: '운송비',        amount: Math.round(transport * 1.1) },
      { bill_id: billId, item_type: 'disposal',  description: '폐기물 처리비', amount: Math.round(disposal * 1.1)  },
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
              ✅ {billingYear}년 {billingMonth}월 청구서 있음 (상태: {bill.status === 'pending' ? '미결제' : bill.status === 'processing' ? '결제 진행 중' : '결제완료'})
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
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-700 font-bold">⚠️ VAT 별도 금액으로 입력해주세요</p>
            <p className="text-xs text-yellow-600 mt-1">예: 운송비 50,000원 → 50,000 입력 (VAT 10% 자동 계산)</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">보관료 (원, VAT 별도)</label>
            <input type="text" inputMode="numeric" placeholder="0" value={storageFee}
              onChange={e => setStorageFee(fmtInput(e.target.value))}
              className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-500 text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">운송료 (원, VAT 별도)</label>
            <input type="text" inputMode="numeric" placeholder="0" value={transportFee}
              onChange={e => setTransportFee(fmtInput(e.target.value))}
              className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-500 text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">폐기물 처리비 (원, VAT 별도)</label>
            <input type="text" inputMode="numeric" placeholder="0" value={disposalFee}
              onChange={e => setDisposalFee(fmtInput(e.target.value))}
              className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-500 text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">비고 / 메모</label>
            <textarea rows={3} placeholder="청구 사유나 특이사항을 메모해 주세요." value={memo} onChange={e => setMemo(e.target.value)} className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-500 text-gray-900" />
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <p className="text-sm text-blue-700 font-bold">
            총 청구액 (VAT 포함): {Math.round((parseInput(storageFee)+parseInput(transportFee)+parseInput(disposalFee)) * 1.1).toLocaleString()}원
          </p>
          <p className="text-xs text-blue-500 mt-1">
            공급가 {(parseInput(storageFee)+parseInput(transportFee)+parseInput(disposalFee)).toLocaleString()}원 + VAT {Math.round((parseInput(storageFee)+parseInput(transportFee)+parseInput(disposalFee)) * 0.1).toLocaleString()}원
          </p>
          <p className="text-xs text-blue-400 mt-1">청구 대상: {billingYear}년 {billingMonth}월</p>
        </div>

        <button onClick={handleSave} disabled={isSaving} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-sm active:bg-blue-700 transition-colors">
          {isSaving ? '저장 중...' : `${billingYear}년 ${billingMonth}월 청구서 저장`}
        </button>

        {/* 전체 청구 히스토리 */}
        {allBills.length > 0 && (
          <div className="space-y-4 mt-2">
            <p className="text-sm font-bold text-gray-700">📋 전체 청구 내역</p>
            {allBills.map(b => {
              const subtotal = b.lineItems.reduce((sum, it) => sum + (it.amount ?? 0), 0);
              const statusLabel = b.status === 'paid' ? '✅ 결제완료' : b.status === 'processing' ? '🔵 결제 진행 중' : '🟠 미결제';
              const statusColor = b.status === 'paid' ? 'text-green-600 bg-green-50' : b.status === 'processing' ? 'text-blue-600 bg-blue-50' : 'text-orange-500 bg-orange-50';
              return (
                <div key={b.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* 월 헤더 */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900">{b.billing_year}년 {b.billing_month}월</p>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColor}`}>{statusLabel}</span>
                  </div>
                  {/* 항목 */}
                  {b.lineItems.map((it, idx) => (
                    <div key={it.id} className={`flex justify-between items-center px-4 py-3 ${idx !== 0 ? 'border-t border-gray-50' : ''}`}>
                      <p className="text-sm text-gray-700">{it.description}</p>
                      <p className="text-sm font-bold text-gray-900">{Math.round(it.amount / 1.1).toLocaleString()}원</p>
                    </div>
                  ))}
                  {/* 합계 */}
                  <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs text-gray-500">VAT 포함 합계</p>
                    <p className="text-sm font-bold text-blue-600">{subtotal.toLocaleString()}원</p>
                  </div>
                  {/* 메모 */}
                  {b.admin_memo && (
                    <div className="px-4 py-2 bg-blue-50 border-t border-blue-100">
                      <p className="text-xs text-blue-600">📝 {b.admin_memo}</p>
                    </div>
                  )}
                  {/* 결제 완료 처리 버튼 */}
                  {b.status === 'processing' && (
                    <div className="px-4 py-3 border-t border-gray-100">
                      <button
                        onClick={async () => {
                          const confirmed = window.confirm(`⚠️ ${b.billing_year}년 ${b.billing_month}월 청구서를 결제 완료 처리하시겠습니까?`);
                          if (!confirmed) return;
                          const { error } = await supabase
                            .from('monthly_bills')
                            .update({ status: 'paid', paid_at: new Date().toISOString() })
                            .eq('id', b.id);
                          if (error) {
                            alert('처리 실패: ' + error.message);
                          } else {
                            setAllBills(prev => prev.map(x => x.id === b.id ? { ...x, status: 'paid' } : x));
                            if (bill?.id === b.id) setBill(prev => prev ? { ...prev, status: 'paid' } : null);
                            alert('✅ 결제 완료 처리되었습니다!');
                          }
                        }}
                        className="w-full bg-green-600 text-white text-sm font-bold py-2 rounded-lg active:bg-green-700 transition-colors"
                      >
                        ✅ 결제 완료 처리
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        
      </div>
    </div>
  );
}
