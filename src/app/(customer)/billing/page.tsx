'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/app/lib/supabase";

const BLUE = "#2563EB";
const fmtWon = (n: number) => `${n.toLocaleString("ko-KR")}원`;
const fmtDate = (d: string) => {
  const date = new Date(d);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

type BillLineItem = {
  id: string;
  description: string;
  amount: number;
  item_type: string;
};

type MonthlyBill = {
  id: string;
  billing_year: number;
  billing_month: number;
  status: string;
  paid_at: string | null;
  admin_memo: string | null;
  vat_amount: number;
  total_amount: number;
  lineItems: BillLineItem[];
};

export default function BillingPage() {
  const router = useRouter();
  const [bills, setBills] = useState<MonthlyBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBillingData() {
      const { data: { user } } = await supabase.auth.getUser();
      const clientId = user?.id ?? "00000000-0000-0000-0000-000000000001";

      // 미결제(pending) 청구서 전체 조회
      const { data: billsData, error: billsError } = await supabase
        .from("monthly_bills")
        .select("*")
        .eq("client_id", clientId)
        .in("status", ["pending", "processing", "paid"])
        .order("billing_year", { ascending: true })
        .order("billing_month", { ascending: true });

      if (billsError) {
        console.error("청구서 로딩 실패:", billsError);
        setIsLoading(false);
        return;
      }

      if (!billsData || billsData.length === 0) {
        setBills([]);
        setIsLoading(false);
        return;
      }

      // 각 청구서의 line_items 조회
      const billsWithItems = await Promise.all(
        billsData.map(async (bill) => {
          const { data: itemsData } = await supabase
            .from("bill_line_items")
            .select("*")
            .eq("bill_id", bill.id)
            .neq("item_type", "deposit")
            .order("created_at", { ascending: true });

          const filtered = (itemsData ?? []).filter(
            item => !item.description.startsWith("월 보관료")
          );

          return { ...bill, lineItems: filtered };
        })
      );

      // lineItems가 있는 청구서만 표시
      setBills(billsWithItems.filter(b => b.lineItems.length > 0));
      setIsLoading(false);
    }
    fetchBillingData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center" style={{ background: "#F0F7F4" }}>
        <p className="animate-pulse text-[14px] font-bold" style={{ color: "#94A3B8" }}>
          데이터를 불러오는 중입니다...
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: "#F0F7F4", minHeight: "100vh", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}
      className="relative w-full pb-[110px]">

      {/* 헤더 */}
      <div style={{ background: "#fff", borderBottom: "0.5px solid #D1E8DF" }}
        className="sticky top-0 z-50 px-4 py-4">
        <h1 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.3px", textAlign: "center" }}>
          정산·청구 내역
        </h1>
      </div>

      <main style={{ padding: "20px 16px 0", display: "flex", flexDirection: "column", gap: 20 }}>

        {bills.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 20, border: "0.5px solid #D1E8DF", padding: "32px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#94A3B8", fontWeight: 600 }}>청구 예정 내역이 없습니다.</p>
            <p style={{ fontSize: 12, color: "#CBD5E1", marginTop: 6 }}>관리자가 금액을 확정하면 결제가 가능합니다.</p>
          </div>
        ) : (
          bills.map(bill => {
            const subtotal    = bill.lineItems.reduce((sum, it) => sum + (it.amount ?? 0), 0);
            const total       = subtotal; // lineItems에 이미 VAT 포함 금액으로 저장됨
            const canCheckout = bill.lineItems.length > 0;

            return (
              <section key={bill.id}>
                {/* 월 라벨 */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                    {bill.billing_year}년 {bill.billing_month}월 청구
                  </h2>
                  <span style={{ fontSize: 11, fontWeight: 600, 
                    color: bill.status === "paid" ? "#10B981" : bill.status === "processing" ? "#2563EB" : "#F97316", 
                    background: bill.status === "paid" ? "#ECFDF5" : bill.status === "processing" ? "#EFF6FF" : "#FFF7ED", 
                    padding: "2px 8px", borderRadius: 99 }}>
                    {bill.status === "paid" ? "✅ 결제 완료" : bill.status === "processing" ? "결제 진행 중" : "미결제"}
                  </span>
                </div>

                {/* 항목 카드 */}
                <div style={{ background: "#fff", borderRadius: 20, border: "0.5px solid #D1E8DF", overflow: "hidden", boxShadow: "0 1px 12px rgba(0,0,0,0.05)" }}>
                  {bill.lineItems.map((it, idx) => {
                    const confirmed = it.amount > 0;
                    const amountExVat = Math.round(it.amount / 1.1); // VAT 별도 금액
                    return (
                      <div key={it.id} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        gap: 12, padding: "16px 18px",
                        borderTop: idx !== 0 ? "0.5px solid #F0F7F4" : "none",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {confirmed
                            ? <CheckCircle2 size={17} color="#10B981" strokeWidth={1.8} />
                            : <Clock size={17} color="#F97316" strokeWidth={1.8} />
                          }
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{it.description}</p>
                            <p style={{ fontSize: 11, fontWeight: 600, color: confirmed ? "#94A3B8" : "#F97316", marginTop: 2 }}>
                              {confirmed ? "금액 확정" : "관리자 입력 대기 중"}
                            </p>
                          </div>
                        </div>
                        <p style={{ flexShrink: 0, fontSize: 13, fontWeight: 800, color: confirmed ? "#0F172A" : "#CBD5E1" }}>
                          {confirmed ? fmtWon(amountExVat) : "—"}
                        </p>
                      </div>
                    );
                  })}

                  {/* 소계 (VAT 별도) */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px dashed #D1E8DF", background: "#F0F7F4", padding: "12px 18px" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>소계</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{fmtWon(Math.round(subtotal / 1.1))}</p>
                  </div>

                  {/* VAT */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px dashed #D1E8DF", background: "#F0F7F4", padding: "12px 18px" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>부가세 (VAT 10%)</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{fmtWon(subtotal - Math.round(subtotal / 1.1))}</p>
                  </div>

                  {/* 최종 합계 */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1.5px solid #D1E8DF", background: "#F0F7F4", padding: "14px 18px" }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#374151" }}>최종 합계 (VAT 포함)</p>
                    <p style={{ fontSize: 16, fontWeight: 900, color: BLUE, letterSpacing: "-0.4px" }}>
                      {fmtWon(total)}
                    </p>
                  </div>
                </div>

                {/* 관리자 메모 */}
                {bill.admin_memo && (
                  <div style={{ marginTop: 8, borderRadius: 16, border: "0.5px solid #BFDBFE", background: "#EFF6FF", padding: "14px 16px" }}>
                    <p style={{ fontSize: 12, fontWeight: 800, color: "#1E40AF", marginBottom: 4 }}>관리자 메모</p>
                    <p style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.6, color: "#1E3A8A" }}>{bill.admin_memo}</p>
                  </div>
                )}

                {/* 결제 버튼 */}
                <button
                  type="button"
                  disabled={!canCheckout || bill.status === "processing" || bill.status === "paid"}
                  onClick={() => bill.status !== "processing" && bill.status !== "paid" && router.push(`/billing/checkout?billId=${bill.id}`)}
                  style={{
                    width: "100%", marginTop: 12, padding: "15px 0", borderRadius: 14, border: "none",
                    background: bill.status === "paid" ? "#ECFDF5" : canCheckout ? `linear-gradient(90deg, ${BLUE}, #3B82F6)` : "#E5E7EB",
                    color: bill.status === "paid" ? "#10B981" : canCheckout ? "#fff" : "#9CA3AF",
                    fontSize: 15, fontWeight: 700,
                    cursor: canCheckout ? "pointer" : "not-allowed",
                    boxShadow: canCheckout ? `0 4px 16px ${BLUE}44` : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {bill.status === "paid" ? "✅ 결제 완료" : bill.status === "processing" ? "결제 진행 중..." : `${fmtWon(total)} 결제하기`}
                </button>
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}
