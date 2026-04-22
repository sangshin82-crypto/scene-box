'use client';

import { useMemo, useState, useEffect } from "react";
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
  status: string;
  paid_at: string | null;
  admin_memo: string | null;
  vat_amount: number;
  total_amount: number;
};

export default function BillingPage() {
  const router = useRouter();

  const [bill, setBill]           = useState<MonthlyBill | null>(null);
  const [lineItems, setLineItems] = useState<BillLineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBillingData() {
      const { data: { user } } = await supabase.auth.getUser();
      const clientId = user?.id ?? "00000000-0000-0000-0000-000000000001";

      const now = new Date();
      const { data: billData, error: billError } = await supabase
        .from("monthly_bills")
        .select("*")
        .eq("client_id", clientId)
        .eq("billing_year", now.getFullYear())
        .eq("billing_month", now.getMonth() + 1)
        .single();

      if (billError) {
        console.error("청구서 로딩 실패:", billError);
        setIsLoading(false);
        return;
      }

      setBill(billData);

      const { data: itemsData, error: itemsError } = await supabase
        .from("bill_line_items")
        .select("*")
        .eq("bill_id", billData.id)
        .order("created_at", { ascending: true });

      if (itemsError) {
        console.error("항목 로딩 실패:", itemsError);
      } else {
        setLineItems(itemsData ?? []);
      }

      setIsLoading(false);
    }
    fetchBillingData();
  }, []);

  const subtotal = useMemo(() =>
    lineItems.reduce((sum, it) => sum + (it.amount ?? 0), 0),
  [lineItems]);

  const vat        = bill?.vat_amount ?? Math.round(subtotal * 0.1);
  const total      = bill?.total_amount ?? subtotal + vat;
  const isPaid     = bill?.status === "paid";
  const canCheckout = !isPaid && lineItems.length > 0;

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

      {/* 헤더 — billing은 전화번호 띠 없어서 top:0 */}
      <div style={{ background: "#fff", borderBottom: "0.5px solid #D1E8DF" }}
        className="sticky top-0 z-50 px-4 py-4">
        <h1 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.3px" }}>
          정산·청구 내역
        </h1>
      </div>

      <main style={{ padding: "20px 16px 0", display: "flex", flexDirection: "column", gap: 16 }}>

        <section>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 10 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>결제 예정 내역</h2>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8" }}>관리자 확정 항목</span>
          </div>

          <div style={{ background: "#fff", borderRadius: 20, border: "0.5px solid #D1E8DF", overflow: "hidden", boxShadow: "0 1px 12px rgba(0,0,0,0.05)" }}>
            {lineItems.length === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 13, color: "#94A3B8" }}>
                청구 예정 내역이 없습니다.
              </div>
            ) : (
              <>
                {lineItems.map((it, idx) => {
                  const confirmed = it.amount > 0;
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
                        {confirmed ? fmtWon(it.amount) : "—"}
                      </p>
                    </div>
                  );
                })}

                {/* 소계 */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px dashed #D1E8DF", background: "#F0F7F4", padding: "12px 18px" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>소계</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{fmtWon(subtotal)}</p>
                </div>

                {/* VAT */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px dashed #D1E8DF", background: "#F0F7F4", padding: "12px 18px" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>부가세 (VAT 10%)</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{fmtWon(vat)}</p>
                </div>

                {/* 합계 */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1.5px solid #D1E8DF", background: "#F0F7F4", padding: "14px 18px" }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#374151" }}>최종 합계 (VAT 포함)</p>
                  <p style={{ fontSize: 16, fontWeight: 900, color: BLUE, letterSpacing: "-0.4px" }}>
                    {fmtWon(total)}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* 관리자 메모 */}
          <div style={{ marginTop: 12, borderRadius: 16, border: "0.5px solid #BFDBFE", background: "#EFF6FF", padding: "14px 16px" }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: "#1E40AF", marginBottom: 4 }}>관리자 메모</p>
            <p style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.6, color: "#1E3A8A" }}>
              {bill?.admin_memo ?? "등록된 메모가 없습니다."}
            </p>
          </div>
        </section>

        {isPaid && (
          <section>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 10 }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>결제 완료 내역</h2>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8" }}>조회 전용</span>
            </div>
            <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #D1E8DF", padding: "16px 18px", opacity: 0.7 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>전체 청구 금액</p>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", marginTop: 4 }}>
                {bill?.paid_at ? fmtDate(bill.paid_at) : ""} 결제 완료
              </p>
            </div>
          </section>
        )}

      </main>

      {/* 하단 결제 바 */}
      <div style={{
        position: "fixed", bottom: 56, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430, zIndex: 90,
        background: "rgba(240,247,244,0.95)", backdropFilter: "blur(12px)",
        borderTop: "0.5px solid #D1E8DF", padding: "14px 16px 16px",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B" }}>최종 결제 금액 (VAT 포함)</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.4px" }}>
              {fmtWon(total)}
            </span>
          </div>
          <button
            type="button"
            disabled={!canCheckout}
            onClick={() => router.push("/billing/checkout")}
            style={{
              borderRadius: 14, padding: "12px 24px",
              fontSize: 15, fontWeight: 800,
              border: "none", cursor: canCheckout ? "pointer" : "not-allowed",
              background: canCheckout ? BLUE : "#E5E7EB",
              color: canCheckout ? "#fff" : "#9CA3AF",
              boxShadow: canCheckout ? `0 4px 16px ${BLUE}44` : "none",
              transition: "all 0.15s", flexShrink: 0,
            }}
          >
            결제하기
          </button>
        </div>
        {!canCheckout && (
          <p style={{ marginTop: 6, textAlign: "center", fontSize: 11, fontWeight: 600, color: "#94A3B8" }}>
            관리자가 금액을 확정하면 결제가 가능합니다.
          </p>
        )}
      </div>

    </div>
  );
}