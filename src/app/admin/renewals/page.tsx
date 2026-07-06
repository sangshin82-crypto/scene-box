'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

// ── 날짜 유틸 ──
const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const toDate = (s: string) => { const d = new Date(s); d.setHours(0,0,0,0); return d; };
const daysBetween = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / 86400000); // a - b (일)
const fmtDate = (d: Date) => `${d.getMonth()+1}/${d.getDate()}`;
const addMonths = (d: Date, m: number) => { const n = new Date(d); n.setMonth(n.getMonth()+m); return n; };

// 통합 항목 타입
type Item = {
  id: string;               // 고유키
  kind: 'personal' | 'business';
  category: 'renew' | 'unpaid' | 'billing_due'; // 재계약알림 / 미납 / 청구예정
  clientId: string;
  name: string;
  phone: string;
  detail: string;           // 계약 내용 요약
  amount: number;           // 금액(월/청구)
  dueDate: Date;            // 기준일(갱신일/청구일)
  dDay: number;             // 오늘 기준 D-day (음수=지남)
  urgent: boolean;          // 긴급(오늘·지남) 여부
  subId?: string;           // 개인 구독 id (결제확인용)
  planType?: string | null; // 개인 3month/1month
  nextPaymentDate?: string; // 개인 원본 날짜
};

const planLabel = (p: string | null | undefined) =>
  p === '3month' ? '3개월 약정' : p === '1month' ? '1개월' : '-';

export default function AdminRenewalsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'all'|'personal'|'business'>('all');
  const [processing, setProcessing] = useState<string | null>(null);

  async function fetchData() {
    setIsLoading(true);
    const now = today();
    const result: Item[] = [];

    // ══════════ 개인 구독 ══════════
    const { data: subs } = await supabase
      .from('personal_subscriptions')
      .select('id, client_id, plan_type, unit_count, monthly_fee, next_payment_date, last_paid_date, status, clients(name, contact_phone)')
      .eq('status', 'active');

    for (const s of (subs ?? []) as any[]) {
      if (!s.next_payment_date) continue;
      const due = toDate(s.next_payment_date);
      const dday = daysBetween(due, now); // due - today. 음수=지남
      const name = s.clients?.name ?? '고객';
      const phone = s.clients?.contact_phone ?? '-';
      const detail = `${planLabel(s.plan_type)} · ${s.unit_count ?? 1}칸 · 월 ${(s.monthly_fee ?? 0).toLocaleString()}원`;

      if (dday < 0) {
        // 미납: 결제일(next_payment_date)이 지남
        result.push({
          id: `p-unpaid-${s.id}`, kind: 'personal', category: 'unpaid',
          clientId: s.client_id, name, phone, detail, amount: s.monthly_fee ?? 0,
          dueDate: due, dDay: dday, urgent: true,
          subId: s.id, planType: s.plan_type, nextPaymentDate: s.next_payment_date,
        });
      } else if (dday <= 5) {
        // 재계약 알림: 5일 이내
        result.push({
          id: `p-renew-${s.id}`, kind: 'personal', category: 'renew',
          clientId: s.client_id, name, phone, detail, amount: s.monthly_fee ?? 0,
          dueDate: due, dDay: dday, urgent: dday === 0,
          subId: s.id, planType: s.plan_type, nextPaymentDate: s.next_payment_date,
        });
      }
    }

    // ══════════ 기업 (clients.billing_day + monthly_bills) ══════════
    const { data: bizClients } = await supabase
      .from('clients')
      .select('id, name, contact_name, contact_phone, billing_day')
      .eq('user_type', 'business')
      .eq('is_active', true);

    const y = now.getFullYear();
    const m = now.getMonth() + 1;

    for (const c of (bizClients ?? []) as any[]) {
      if (!c.billing_day) continue; // 청구일 설정된 기업만 (오프라인 예외는 제외)

      // 이번 달 청구일
      const billDay = Math.min(c.billing_day, 28); // 말일 이슈 방지 단순화
      const billDate = new Date(y, now.getMonth(), billDay); billDate.setHours(0,0,0,0);
      const ddayBill = daysBetween(billDate, now);

      // 이번 달 monthly_bills 조회
      const { data: bill } = await supabase
        .from('monthly_bills')
        .select('id, status, total_amount, storage_fee, transport_fee, disposal_fee')
        .eq('client_id', c.id)
        .eq('billing_year', y)
        .eq('billing_month', m)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const name = c.name ?? c.contact_name ?? '기업';
      const phone = c.contact_phone ?? '-';
      const billAmount = bill?.total_amount
        ?? ((bill?.storage_fee ?? 0) + (bill?.transport_fee ?? 0) + (bill?.disposal_fee ?? 0));

      const isPaid = bill?.status === 'paid';
      const isPending = bill && !isPaid; // pending 또는 processing

      if (isPending && ddayBill <= -3) {
        // 미납: 청구서 있고 미결제, 청구일+3일 경과
        result.push({
          id: `b-unpaid-${c.id}`, kind: 'business', category: 'unpaid',
          clientId: c.id, name, phone,
          detail: `청구서 발행됨 · 미결제`, amount: billAmount,
          dueDate: billDate, dDay: ddayBill, urgent: true,
        });
      } else if (!bill && ddayBill <= 5 && ddayBill >= -30) {
        // 청구 예정: 청구서 없음, 청구일 5일 이내(또는 막 지남)
        result.push({
          id: `b-due-${c.id}`, kind: 'business', category: 'billing_due',
          clientId: c.id, name, phone,
          detail: `이번 달 청구서 미발행`, amount: 0,
          dueDate: billDate, dDay: ddayBill, urgent: ddayBill <= 0,
        });
      } else if (isPending && ddayBill > -3 && ddayBill <= 5) {
        // 청구서는 있으나 아직 독촉 시점 전 (참고 표시: 미납 예비)
        result.push({
          id: `b-pending-${c.id}`, kind: 'business', category: 'billing_due',
          clientId: c.id, name, phone,
          detail: `청구서 발행됨 · 결제 대기`, amount: billAmount,
          dueDate: billDate, dDay: ddayBill, urgent: false,
        });
      }
    }

    // 정렬: 긴급 먼저, 그다음 dDay 오름차순(지난 것·임박한 것 위로)
    result.sort((a, b) => {
      if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
      return a.dDay - b.dDay;
    });

    setItems(result);
    setIsLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  // ── 개인 결제 확인 → 자동연장 ──
  const confirmPersonalPayment = async (item: Item) => {
    if (!item.subId || !item.nextPaymentDate) return;
    const period = item.planType === '3month' ? 3 : 1;
    const base = toDate(item.nextPaymentDate);       // 기존 next_payment_date 기준
    const newNext = addMonths(base, period);          // 기존 날짜 + 주기 (주기 유지)
    const todayStr = today().toISOString().slice(0,10);
    const newNextStr = newNext.toISOString().slice(0,10);

    const msg = `${item.name}님 결제 확인 처리\n\n` +
      `• 마지막 결제일: ${todayStr}\n` +
      `• 다음 결제일: ${item.nextPaymentDate} → ${newNextStr}\n\n` +
      `구독이 다음 주기로 자동 연장됩니다. 진행할까요?`;
    if (!window.confirm(msg)) return;

    setProcessing(item.id);
    const { error } = await supabase
      .from('personal_subscriptions')
      .update({
        last_paid_date: todayStr,
        next_payment_date: newNextStr,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.subId);
    setProcessing(null);

    if (error) { alert('처리 실패: ' + error.message); return; }
    alert('✅ 결제 확인 완료. 다음 주기로 연장되었습니다.');
    fetchData();
  };

  // ── 엑셀 내보내기 (CSV) ──
  const exportCsv = () => {
    const rows = filtered.map(it => ({
      구분: it.kind === 'personal' ? '개인' : '기업',
      유형: it.category === 'renew' ? '재계약 알림' : it.category === 'unpaid' ? '미납' : '청구 예정',
      고객명: it.name,
      전화번호: it.phone,
      계약내용: it.detail,
      금액: it.amount,
      기준일: fmtDate(it.dueDate),
      'D-day': it.dDay === 0 ? '오늘' : it.dDay > 0 ? `D-${it.dDay}` : `${-it.dDay}일 지남`,
    }));
    const headers = Object.keys(rows[0] ?? {구분:'',유형:'',고객명:'',전화번호:'',계약내용:'',금액:'',기준일:'','D-day':''});
    const csv = [headers.join(','),
      ...rows.map(r => headers.map(h => `"${String((r as any)[h] ?? '').replace(/"/g,'""')}"`).join(','))
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `갱신수금_${today().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = items.filter(it => tab === 'all' || it.kind === tab);
  const urgentItems = filtered.filter(it => it.urgent);
  const upcomingItems = filtered.filter(it => !it.urgent);

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
          <h1 className="text-lg font-bold text-gray-900">갱신·수금 관리</h1>
        </div>
        <button onClick={exportCsv} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">📥 엑셀</button>
      </div>

      {/* 탭 */}
      <div className="px-4 pt-4 flex gap-2">
        {([['all','전체'],['personal','개인'],['business','기업']] as const).map(([k,label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-lg text-sm font-bold ${tab===k ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* 긴급 (오늘·지남) */}
      <div className="p-4">
        <h3 className="text-sm font-bold text-red-600 mb-2 ml-1">🔴 오늘·지난 ({urgentItems.length})</h3>
        <div className="space-y-3">
          {urgentItems.length === 0 ? (
            <div className="bg-white p-4 rounded-xl text-center text-sm text-gray-400">긴급 항목 없음</div>
          ) : urgentItems.map(it => (
            <ItemCard key={it.id} item={it} processing={processing}
              onConfirm={confirmPersonalPayment} onBilling={() => router.push('/admin/billing')} />
          ))}
        </div>
      </div>

      {/* 예정 (5일 이내) */}
      <div className="px-4">
        <h3 className="text-sm font-bold text-yellow-600 mb-2 ml-1">🟡 예정 ({upcomingItems.length})</h3>
        <div className="space-y-3">
          {upcomingItems.length === 0 ? (
            <div className="bg-white p-4 rounded-xl text-center text-sm text-gray-400">예정 항목 없음</div>
          ) : upcomingItems.map(it => (
            <ItemCard key={it.id} item={it} processing={processing}
              onConfirm={confirmPersonalPayment} onBilling={() => router.push('/admin/billing')} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 항목 카드 ──
function ItemCard({ item, processing, onConfirm, onBilling }: {
  item: Item; processing: string | null;
  onConfirm: (i: Item) => void; onBilling: () => void;
}) {
  const catInfo = {
    renew:       { label: '재계약 알림', color: 'text-blue-600',   bg: 'bg-blue-50' },
    unpaid:      { label: '미납',       color: 'text-red-600',    bg: 'bg-red-50' },
    billing_due: { label: '청구 예정',   color: 'text-purple-600', bg: 'bg-purple-50' },
  }[item.category];

  const ddayText = item.dDay === 0 ? '오늘' : item.dDay > 0 ? `D-${item.dDay}` : `${-item.dDay}일 지남`;

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${catInfo.color} ${catInfo.bg} px-2 py-0.5 rounded`}>{catInfo.label}</span>
            <span className="text-xs font-bold text-gray-400">{item.kind === 'personal' ? '개인' : '기업'}</span>
          </div>
          <p className="font-bold text-gray-900 mt-1">{item.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{item.phone}</p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold ${item.dDay < 0 ? 'text-red-500' : item.dDay === 0 ? 'text-orange-500' : 'text-gray-600'}`}>{ddayText}</p>
          <p className="text-xs text-gray-400">{fmtDate(item.dueDate)}</p>
        </div>
      </div>

      <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5 mb-3">
        <p>{item.detail}</p>
        {item.amount > 0 && <p className="mt-1 font-bold text-gray-700">💰 {item.amount.toLocaleString()}원</p>}
      </div>

      {/* 액션 */}
      {item.kind === 'personal' ? (
        <button
          onClick={() => onConfirm(item)}
          disabled={processing === item.id}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-bold active:bg-blue-700 disabled:bg-gray-300">
          {processing === item.id ? '처리 중...' : '✅ 결제 확인 (다음 주기 연장)'}
        </button>
      ) : (
        <button
          onClick={onBilling}
          className="w-full bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-bold active:bg-gray-50">
          {item.category === 'billing_due' ? '📝 청구서 관리로 이동' : '💰 수금 처리 (청구 화면)'}
        </button>
      )}
    </div>
  );
}