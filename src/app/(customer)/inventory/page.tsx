'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CreditCard, CheckCircle2, Clock, Building2, Lock } from "lucide-react";
import { supabase } from "@/app/lib/supabase";

const BLUE  = "#2563EB";
const GREEN = "#10B981";

type Space = {
  id: string;
  plan_type: string;
  monthly_fee: number;
  deposit_amount: number;
  start_date: string;
  end_date: string;
  status: string;
  grids: { grid_number: string; zone: string } | null;
};

type PaymentItem = {
  id: string;
  description: string;
  amount: number;
  item_type: string;
  bill_status: string;
  bill_month: number;
  bill_year: number;
  paid_at: string | null;
  created_at: string;
};

const fmt = (n: number) => n.toLocaleString("ko-KR") + "원";
const fmtDate = (d: string) => {
  const date = new Date(d);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

type Tab = "contracts" | "payments";

export default function InventoryPage() {
  const router = useRouter();
  const [tab, setTab]           = useState<Tab>("contracts");
  const [spaces, setSpaces]     = useState<Space[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      const clientId = user?.id ?? "00000000-0000-0000-0000-000000000001";

      const { data: spacesData } = await supabase
        .from("spaces")
        .select("id, plan_type, monthly_fee, deposit_amount, start_date, end_date, status, grids(grid_number, zone)")
        .eq("client_id", clientId)
        .order("start_date", { ascending: false });

      setSpaces((spacesData ?? []) as unknown as Space[]);

      const { data: billsData } = await supabase
        .from("monthly_bills")
        .select("id, billing_year, billing_month, status, paid_at, created_at, bill_line_items(id, description, amount, item_type, created_at)")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (billsData) {
        const items: PaymentItem[] = [];
        billsData.forEach((bill: any) => {
          ((bill.bill_line_items ?? []) as any[]).forEach((item: any) => {
            if (item.amount > 0) {
              // 예약 시 자동 생성된 보관료와 이행보증금은 paid로 간주
              const isBookingItem = item.description.startsWith("월 보관료") || item.item_type === "deposit";
              items.push({
                id:          item.id,
                description: item.description,
                amount:      item.amount,
                item_type:   item.item_type,
                bill_status: isBookingItem ? "paid" : bill.status,
                bill_month:  bill.billing_month,
                bill_year:   bill.billing_year,
                paid_at:     bill.paid_at ?? item.created_at,
                created_at:  item.created_at,
              });
            }
          });
        });
        setPayments(items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }

      setIsLoading(false);
    }
    fetchData();
  }, []);

  const activeSpaces = spaces.filter(s => s.status === "active");
  const totalDeposit = activeSpaces.reduce((sum, s) => sum + (s.deposit_amount ?? 0), 0);
  const totalPaid    = payments.filter(p => p.bill_status === "paid").reduce((sum, p) => sum + p.amount, 0);

  // 월별 그룹핑
  const grouped = payments.reduce((acc, p) => {
    const key = `${p.bill_year}-${String(p.bill_month).padStart(2, "0")}`;
    if (!acc[key]) acc[key] = { year: p.bill_year, month: p.bill_month, items: [] };
    acc[key].items.push(p);
    return acc;
  }, {} as Record<string, { year: number; month: number; items: PaymentItem[] }>);

  const groupedList = Object.values(grouped).sort((a, b) =>
    b.year !== a.year ? b.year - a.year : b.month - a.month
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center" style={{ background: "#F0F7F4" }}>
        <p className="animate-pulse text-[14px] font-bold" style={{ color: "#94A3B8" }}>불러오는 중...</p>
      </div>
    );
  }

  // 헤더 높이: 메인헤더(57) + 전화번호띠(32) + 내보관함헤더(약 90) = 179px
  const HEADER_OFFSET = 179;

  return (
    <div style={{ background: "#F0F7F4", minHeight: "100vh", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}
      className="relative w-full pb-[80px]">

      {/* 제목 바 — sticky top:0 (다른 페이지와 동일) */}
      <div style={{
        background: "#fff",
        borderBottom: "0.5px solid #F0F7F4",
        position: "sticky",
        top: 0,
        zIndex: 50,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
      }}>
        <button type="button" onClick={() => router.back()}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}>
          <ChevronLeft size={23} color="#374151" strokeWidth={1.8} />
        </button>
        <span style={{ flex: 1, textAlign: "center", fontSize: 19, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.5px" }}>
          내 보관함
        </span>
        <div style={{ width: 31, flexShrink: 0 }} />
      </div>

      {/* 탭 바 — sticky top:89 (전화번호 띠 아래) */}
      <div style={{
        background: "#fff",
        borderBottom: "0.5px solid #D1E8DF",
        position: "sticky",
        top: 89,
        zIndex: 45,
        display: "flex",
      }}>
        {([
          { key: "contracts" as Tab, label: "📦 계약 현황", count: activeSpaces.length },
          { key: "payments"  as Tab, label: "💳 결제 내역", count: payments.length     },
        ]).map(({ key, label, count }) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              flex: 1, padding: "12px 0", border: "none", background: "none", cursor: "pointer",
              fontSize: 13, fontWeight: tab === key ? 700 : 500,
              color: tab === key ? BLUE : "#94A3B8",
              borderBottom: tab === key ? `2px solid ${BLUE}` : "2px solid transparent",
              transition: "all 0.15s",
            }}>
            {label}
            {count > 0 && (
              <span style={{
                marginLeft: 6, fontSize: 11, fontWeight: 700,
                color: tab === key ? "#fff" : "#94A3B8",
                background: tab === key ? BLUE : "#E5E7EB",
                padding: "1px 6px", borderRadius: 99,
              }}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 콘텐츠 — 전화번호띠(32px) + 여백(16px) = 48px */}
      <div style={{ padding: "48px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* 요약 카드 */}
        <div style={{ background: `linear-gradient(120deg, ${BLUE} 0%, #3B82F6 100%)`, borderRadius: 20, padding: "20px", boxShadow: `0 4px 20px ${BLUE}33` }}>
          {tab === "contracts" ? (
            <>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>현재 계약 현황</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 8, letterSpacing: "-0.5px" }}>
                {activeSpaces.length > 0 ? `${activeSpaces.length}개 공간 계약 중 🔒` : "계약 중인 공간 없음"}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {activeSpaces.map(s => (
                  <span key={s.id} style={{ fontSize: 12, fontWeight: 700, color: BLUE, background: "#fff", padding: "4px 12px", borderRadius: 99 }}>
                    {s.grids ? `${s.grids.zone}존 ${s.grids.grid_number}` : "—"}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* 1차 합계 */}
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 2 }}>
                1차 합계 (보관료/운송료/폐기료)
              </p>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 12, letterSpacing: "-0.5px" }}>
                {fmt(payments.filter(p => p.item_type !== "deposit").reduce((sum, p) => sum + p.amount, 0))} <span style={{ fontSize: 11, fontWeight: 500 }}>(VAT 포함)</span>
              </p>
              {/* 2차 합계 */}
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 14px", marginBottom: 10 }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginBottom: 2 }}>
                  2차 합계 (이행보증금)
                </p>
                <p style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
                  {fmt(payments.filter(p => p.item_type === "deposit").reduce((sum, p) => sum + p.amount, 0))} <span style={{ fontSize: 11, fontWeight: 500 }}>(VAT 없음)</span>
                </p>
              </div>
              {/* 총 합계 */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.3)", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>총 합계</p>
                <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>
                  {fmt(payments.reduce((sum, p) => sum + p.amount, 0))}
                </p>
              </div>
            </>
          )}
        </div>

        {/* 계약 현황 탭 */}
        {tab === "contracts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {spaces.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#94A3B8" }}>
                <Building2 size={36} color="#D1E8DF" style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: 14, fontWeight: 600 }}>계약 내역이 없습니다</p>
              </div>
            ) : (
              spaces.map(space => {
                const isActive  = space.status === "active";
                const gridLabel = space.grids ? `${space.grids.zone}존 ${space.grids.grid_number}` : "—";
                const dday      = Math.ceil((new Date(space.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={space.id} style={{
                    background: "#fff", borderRadius: 18,
                    border: `0.5px solid ${isActive ? "#BFDBFE" : "#E5E7EB"}`,
                    padding: "16px 18px", boxShadow: "0 1px 10px rgba(0,0,0,0.05)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: isActive ? BLUE : "#94A3B8" }}>
                        {gridLabel}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99,
                        color: isActive ? "#fff" : "#9CA3AF",
                        background: isActive ? GREEN : "#E5E7EB",
                      }}>
                        {isActive ? "계약중" : "종료"}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, color: "#94A3B8" }}>이용 기간</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                          {fmtDate(space.start_date)} ~ {fmtDate(space.end_date)}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, color: "#94A3B8" }}>월 보관료</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                          {fmt(space.monthly_fee)} (VAT 별도)
                        </span>
                      </div>
                      {isActive && (
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 12, color: "#94A3B8" }}>계약 만료</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: dday <= 7 ? "#F97316" : "#374151" }}>
                            D-{dday}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 결제 내역 탭 */}
        {tab === "payments" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {groupedList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#94A3B8" }}>
                <CreditCard size={36} color="#D1E8DF" style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: 14, fontWeight: 600 }}>결제 내역이 없습니다</p>
              </div>
            ) : (
              groupedList.map(group => {
                const groupTotal    = group.items.reduce((sum, p) => sum + p.amount, 0);
                const allPaid       = group.items.every(p => p.bill_status === "paid");

                // 이 달의 이행보증금 (spaces에서 해당 월에 시작한 계약의 보증금)
                const monthDeposit = spaces
                  .filter(s => {
                    const start = new Date(s.start_date);
                    return start.getFullYear() === group.year && start.getMonth() + 1 === group.month;
                  })
                  .reduce((sum, s) => sum + (s.deposit_amount ?? 0), 0);

                const typeLabel: Record<string, string> = {
                  storage:   "보관료",
                  transport: "운송비",
                  disposal:  "폐기물 처리비",
                  deposit:   "이행보증금",
                };

                // 1차 항목 (보관료/운송료/폐기료)
                const firstItems  = group.items.filter(p => p.item_type !== "deposit");
                // 2차 항목 (이행보증금)
                const depositItems = group.items.filter(p => p.item_type === "deposit");
                const firstTotal   = firstItems.reduce((sum, p) => sum + p.amount, 0);
                const depositTotal = depositItems.reduce((sum, p) => sum + p.amount, 0);

                return (
                  <div key={`${group.year}-${group.month}`}>
                    {/* 월 헤더 */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, paddingLeft: 2 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                        {group.year}년 {group.month}월
                      </p>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                        color: allPaid ? GREEN : "#F97316",
                        background: allPaid ? "#ECFDF5" : "#FFF7ED",
                      }}>
                        {allPaid ? "결제완료" : "미결제"}
                      </span>
                    </div>

                    {/* 항목 + 소계 카드 */}
                    <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #D1E8DF", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>

                      {/* 항목들 */}
                      {group.items.map((payment) => {
                        const isPaid    = payment.bill_status === "paid";
                        const isDeposit = payment.item_type === "deposit";
                        return (
                          <div key={payment.id} style={{
                            padding: "14px 16px",
                            borderBottom: "0.5px solid #F0F7F4",
                            display: "flex", alignItems: "center", gap: 12,
                            background: isDeposit ? "#F8FAFF" : "#fff",
                          }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                              background: isDeposit ? "#EFF6FF" : isPaid ? "#ECFDF5" : "#FFF7ED",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              {isDeposit
                                ? <Lock size={16} color={BLUE} strokeWidth={2} />
                                : isPaid
                                  ? <CheckCircle2 size={18} color={GREEN} strokeWidth={2} />
                                  : <Clock size={18} color="#F97316" strokeWidth={2} />
                              }
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 2 }}>
                                {payment.description}
                              </p>
                              <p style={{ fontSize: 11, color: "#94A3B8" }}>
                                {typeLabel[payment.item_type] ?? payment.item_type}
                                {isDeposit ? " · VAT 없음 · 퇴실 시 환불" : " · VAT 포함"}
                              </p>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <p style={{ fontSize: 14, fontWeight: 800, color: isDeposit ? BLUE : isPaid ? "#0F172A" : "#F97316" }}>
                                {fmt(payment.amount)}
                              </p>
                              {isPaid && payment.paid_at && (
                                <p style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>
                                  {fmtDate(payment.paid_at)}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* 소계 */}
                      <div style={{ padding: "12px 16px", background: "#F0F7F4", borderTop: "1px dashed #D1E8DF", display: "flex", flexDirection: "column", gap: 6 }}>
                        {/* 1차 합계 */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B" }}>
                            1차 합계 (보관료/운송료/폐기료, VAT 포함)
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: BLUE }}>
                            {fmt(firstTotal)}
                          </span>
                        </div>
                        {/* 2차 합계 */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B" }}>
                            2차 합계 (이행보증금, VAT 없음)
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: depositTotal > 0 ? "#374151" : "#CBD5E1" }}>
                            {depositTotal > 0 ? fmt(depositTotal) : "없음"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
