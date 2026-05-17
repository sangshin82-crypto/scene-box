'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, CreditCard, CheckCircle2, Clock, Building2,
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";

const BLUE  = "#2563EB";
const GREEN = "#10B981";

type Space = {
  id: string;
  plan_type: string;
  monthly_fee: number;
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

      // 1. 계약 현황
      const { data: spacesData } = await supabase
        .from("spaces")
        .select("id, plan_type, monthly_fee, start_date, end_date, status, grids(grid_number, zone)")
        .eq("client_id", clientId)
        .order("start_date", { ascending: false });

      setSpaces((spacesData ?? []) as unknown as Space[]);

      // 2. 결제 내역 (월별 청구서 + 항목)
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
              items.push({
                id:          item.id,
                description: item.description,
                amount:      item.amount,
                item_type:   item.item_type,
                bill_status: bill.status,
                bill_month:  bill.billing_month,
                bill_year:   bill.billing_year,
                paid_at:     bill.paid_at,
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
  const totalPaid    = payments.filter(p => p.bill_status === "paid").reduce((sum, p) => sum + p.amount, 0);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center" style={{ background: "#F0F7F4" }}>
        <p className="animate-pulse text-[14px] font-bold" style={{ color: "#94A3B8" }}>불러오는 중...</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#F0F7F4", minHeight: "100vh", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}
      className="relative w-full pb-[80px]">

      {/* 헤더 */}
      <header style={{ background: "#fff", borderBottom: "0.5px solid #D1E8DF" }}
        className="sticky top-0 z-50">
        <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" onClick={() => router.back()}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <ChevronLeft size={23} color="#374151" strokeWidth={1.8} />
          </button>
          <span style={{ fontSize: 19, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.5px" }}>
            내 보관함
          </span>
        </div>

        {/* 탭 */}
        <div style={{ display: "flex", borderTop: "0.5px solid #F0F7F4" }}>
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
      </header>

      <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>

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
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>누적 결제 금액</p>
              <p style={{ fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 4, letterSpacing: "-0.5px" }}>
                {fmt(totalPaid)}
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                총 {payments.length}건의 결제 내역
              </p>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {payments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#94A3B8" }}>
                <CreditCard size={36} color="#D1E8DF" style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: 14, fontWeight: 600 }}>결제 내역이 없습니다</p>
              </div>
            ) : (
              payments.map(payment => {
                const isPaid = payment.bill_status === "paid";
                const typeLabel: Record<string, string> = {
                  storage:   "보관료",
                  transport: "운송비",
                  disposal:  "폐기물 처리비",
                };
                return (
                  <div key={payment.id} style={{
                    background: "#fff", borderRadius: 16, border: "0.5px solid #D1E8DF",
                    padding: "14px 16px", boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
                    display: "flex", alignItems: "center", gap: 14,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      background: isPaid ? "#ECFDF5" : "#FFF7ED",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isPaid
                        ? <CheckCircle2 size={20} color={GREEN} strokeWidth={2} />
                        : <Clock size={20} color="#F97316" strokeWidth={2} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{payment.description}</p>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 99,
                          color: isPaid ? GREEN : "#F97316",
                          background: isPaid ? "#ECFDF5" : "#FFF7ED",
                          flexShrink: 0,
                        }}>
                          {isPaid ? "결제완료" : "미결제"}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: "#94A3B8" }}>
                        {payment.bill_year}년 {payment.bill_month}월 · {typeLabel[payment.item_type] ?? payment.item_type}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 800, color: isPaid ? "#0F172A" : "#F97316" }}>
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
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
}
