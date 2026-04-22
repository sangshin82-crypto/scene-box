'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, X, CreditCard, Building2, Check, ShieldCheck } from "lucide-react";
import { supabase } from "@/app/lib/supabase";

const BLUE = "#2563EB";
const fmtWon = (n: number) => n.toLocaleString("ko-KR") + "원";

type CheckKey = "terms" | "liability" | "scope";

const sendTelegramNotification = async (message: string) => {
  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
  } catch (e) {
    console.error("텔레그램 알림 실패:", e);
  }
};

export default function BillingCheckoutPage() {
  const router = useRouter();

  const [bill, setBill]           = useState<any>(null);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [payMethod, setPayMethod] = useState<"card" | "bank">("card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientName, setClientName] = useState("");
  const [checks, setChecks] = useState<Record<CheckKey, boolean>>({
    terms: false, liability: false, scope: false,
  });

  const allChecked = checks.terms && checks.liability && checks.scope;
  const toggleCheck = (k: CheckKey) => setChecks(p => ({ ...p, [k]: !p[k] }));

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      const clientId = user?.id ?? "00000000-0000-0000-0000-000000000001";

      const { data: clientData } = await supabase
        .from("clients").select("name").eq("id", clientId).single();
      if (clientData) setClientName(clientData.name);

      const now = new Date();
      const { data: billData } = await supabase
        .from("monthly_bills").select("*")
        .eq("client_id", clientId)
        .eq("billing_year", now.getFullYear())
        .eq("billing_month", now.getMonth() + 1)
        .single();

      if (billData) {
        setBill(billData);
        const { data: items } = await supabase
          .from("bill_line_items").select("*").eq("bill_id", billData.id);
        setLineItems(items ?? []);
      }
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const subtotal = lineItems.reduce((sum, it) => sum + (it.amount ?? 0), 0);
  const vat      = bill?.vat_amount ?? Math.round(subtotal * 0.1);
  const total    = bill?.total_amount ?? subtotal + vat;

  const handlePayment = async () => {
    if (!allChecked || isSubmitting || !bill) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("monthly_bills")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", bill.id);
      if (error) throw new Error("결제 처리 실패");

      await sendTelegramNotification(
        `💳 <b>정산 결제 완료!</b>\n\n` +
        `👤 고객명: ${clientName}\n` +
        `💰 결제 금액: ${fmtWon(total)}\n` +
        `📅 결제일: ${new Date().toLocaleDateString("ko-KR")}`
      );

      alert("결제가 완료되었습니다! 🎉");
      router.push("/dashboard");
    } catch (err) {
      alert("처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
    }
    setIsSubmitting(false);
  };

  if (isLoading) return (
    <div className="flex min-h-screen w-full items-center justify-center" style={{ background: "#F0F7F4" }}>
      <p className="animate-pulse text-[14px] font-bold" style={{ color: "#94A3B8" }}>불러오는 중...</p>
    </div>
  );

  return (
    <div style={{ background: "#F0F7F4", minHeight: "100vh", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}
      className="flex justify-center">
      <div style={{ width: "100%", maxWidth: 430, minHeight: "100vh", paddingBottom: 140 }}>

        {/* 헤더 — billing은 전화번호 띠 없어서 top:0 */}
        <div style={{ background: "#fff", borderBottom: "0.5px solid #D1E8DF" }}
          className="sticky top-0 z-50 flex items-center justify-between px-4 py-4">
          <button type="button" className="p-1" onClick={() => router.back()}>
            <ChevronLeft size={23} color="#374151" strokeWidth={1.8} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>정산 결제</span>
          <button className="p-1" onClick={() => router.back()}>
            <X size={21} color="#374151" strokeWidth={1.8} />
          </button>
        </div>

        <div style={{ padding: "20px 16px 0", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* 금액 카드 */}
          <section>
            <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 1px 12px rgba(0,0,0,0.05)", overflow: "hidden", border: "0.5px solid #D1E8DF" }}>
              <div style={{ background: `linear-gradient(135deg, ${BLUE}, #3B82F6)`, padding: "16px 20px" }}>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 4 }}>최종 결제 금액 (VAT 포함)</p>
                <p style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>{fmtWon(total)}</p>
              </div>
              <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                {lineItems.map(it => (
                  <div key={it.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#94A3B8" }}>{it.description}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{fmtWon(it.amount)}</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px dashed #D1E8DF", paddingTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#94A3B8" }}>소계</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{fmtWon(subtotal)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#94A3B8" }}>부가세 (VAT 10%)</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{fmtWon(vat)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>최종 합계</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: BLUE }}>{fmtWon(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 결제 수단 */}
          <section>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>결제 수단 선택</p>
            <div style={{ display: "flex", background: "#E8F5F0", borderRadius: 14, padding: 4, marginBottom: 14 }}>
              {[
                { id: "card" as const, icon: CreditCard, label: "카드 결제" },
                { id: "bank" as const, icon: Building2, label: "무통장 입금" },
              ].map(({ id, icon: Icon, label }) => {
                const active = payMethod === id;
                return (
                  <button key={id} onClick={() => setPayMethod(id)}
                    style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", background: active ? "#fff" : "transparent", color: active ? BLUE : "#94A3B8", fontWeight: active ? 700 : 500, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s", boxShadow: active ? "0 1px 6px rgba(0,0,0,0.08)" : "none" }}>
                    <Icon size={15} strokeWidth={1.8} />{label}
                  </button>
                );
              })}
            </div>
            {payMethod === "card" && (
              <div style={{ background: "#EFF6FF", borderRadius: 16, padding: "16px 18px", border: "0.5px solid #BFDBFE" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <ShieldCheck size={19} color={BLUE} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: BLUE, marginBottom: 4 }}>안전한 외부 결제창으로 이동합니다</p>
                    <p style={{ fontSize: 12, color: "#60A5FA", lineHeight: 1.6 }}>결제하기 버튼을 누르면 PG사의 보안 결제창으로 연결됩니다.</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 약관 동의 */}
          <section>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>필수 약관 동의</p>
            <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 1px 10px rgba(0,0,0,0.05)", overflow: "hidden", border: "0.5px solid #D1E8DF" }}>
              <button
                onClick={() => setChecks(allChecked
                  ? { terms: false, liability: false, scope: false }
                  : { terms: true, liability: true, scope: true }
                )}
                style={{ width: "100%", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, background: allChecked ? "#EFF6FF" : "#F0F7F4", border: "none", borderBottom: "0.5px solid #D1E8DF", cursor: "pointer", textAlign: "left" }}>
                <CheckBox checked={allChecked} />
                <span style={{ fontSize: 14, fontWeight: 700, color: allChecked ? BLUE : "#374151" }}>전체 동의</span>
              </button>
              {[
                { key: "terms" as CheckKey,     label: "[필수] 서비스 이용 약관 및 개인정보 처리방침 동의",                                                              color: "#374151" },
                { key: "liability" as CheckKey, label: "[필수] 보관료 2개월 이상 연체 시, 적재물 직권 폐기 및 소유권 포기 동의",                                          color: "#DC2626" },
                { key: "scope" as CheckKey,     label: "[필수] 당사는 '보관 및 운송' 전용 서비스로, 현장 구조물 해체/철거 작업은 제공하지 않음에 동의합니다.",             color: "#374151" },
              ].map(({ key, label, color }) => (
                <button key={key} onClick={() => toggleCheck(key)}
                  style={{ width: "100%", padding: "13px 18px", display: "flex", alignItems: "flex-start", gap: 12, background: "none", border: "none", borderBottom: "0.5px solid #F0F7F4", cursor: "pointer", textAlign: "left" }}>
                  <CheckBox checked={checks[key]} />
                  <span style={{ fontSize: 12, color, lineHeight: 1.6 }}>{label}</span>
                </button>
              ))}
            </div>
          </section>

        </div>

        {/* 하단 버튼 */}
        <div style={{ position: "fixed", bottom: 56, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(240,247,244,0.95)", backdropFilter: "blur(12px)", borderTop: "0.5px solid #D1E8DF", padding: "14px 16px 20px", zIndex: 90, boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}>
          <button
            onClick={handlePayment}
            disabled={!allChecked || isSubmitting}
            style={{ width: "100%", padding: "15px 0", borderRadius: 14, border: "none", background: allChecked ? `linear-gradient(90deg, ${BLUE}, #3B82F6)` : "#E5E7EB", color: allChecked ? "#fff" : "#9CA3AF", fontSize: 15, fontWeight: 700, cursor: allChecked ? "pointer" : "not-allowed", transition: "all 0.2s", boxShadow: allChecked ? `0 4px 16px ${BLUE}44` : "none" }}>
            {isSubmitting ? "처리 중..." : allChecked ? `${fmtWon(total)} 결제하기` : "약관에 동의해주세요"}
          </button>
        </div>

      </div>
    </div>
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked ? BLUE : "#D1E8DF"}`, background: checked ? BLUE : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
      {checked && <Check size={12} color="#fff" strokeWidth={3} />}
    </div>
  );
}