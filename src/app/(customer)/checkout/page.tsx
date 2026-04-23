'use client';

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft, X, CreditCard, Building2, Camera,
  Check, FileText, ShieldCheck, ChevronDown, Lock
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";

const BLUE = "#2563EB";

type CheckKey = "terms" | "liability" | "scope" | "checkout";

const fmt     = (n: number) => n.toLocaleString("ko-KR") + "원";
const fmtDate = (d: Date) =>
  `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;

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

function CheckoutInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const gridStr  = searchParams.get("grids")   ?? "";
  const planId   = searchParams.get("plan")    ?? "3m";
  const totalAmt = Number(searchParams.get("total")   ?? 0);
  const monthly  = Number(searchParams.get("monthly") ?? 0);
  const months   = Number(searchParams.get("months")  ?? 1);

  const gridList   = gridStr ? gridStr.split(",") : [];
  const deposit    = monthly * 2;
  const grandTotal = totalAmt + deposit;

  const startDate = new Date();
  const endDate   = new Date();
  endDate.setMonth(endDate.getMonth() + months);

  const [payMethod, setPayMethod]       = useState<"card" | "bank">("card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checks, setChecks]             = useState<Record<CheckKey, boolean>>({
    terms: false, liability: false, scope: false, checkout: false,
  });
  const [expanded, setExpanded] = useState<Record<CheckKey, boolean>>({
    terms: false, liability: false, scope: false, checkout: false,
  });
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const allChecked = checks.terms && checks.liability && checks.scope && checks.checkout;

  const toggleCheck = (k: CheckKey) => setChecks(p => ({ ...p, [k]: !p[k] }));
  const toggleExpand = (k: CheckKey) => setExpanded(p => ({ ...p, [k]: !p[k] }));

  const handlePayment = async () => {
    if (!allChecked || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const clientId = user?.id ?? "00000000-0000-0000-0000-000000000001";

      const { data: clientData } = await supabase
        .from("clients")
        .select("name")
        .eq("id", clientId)
        .single();
      const clientName = clientData?.name ?? "고객";

      const { data: gridsData, error: gridsError } = await supabase
        .from("grids")
        .select("id, grid_number")
        .in("grid_number", gridList);
      if (gridsError || !gridsData?.length) throw new Error("Grid 조회 실패");

      const spaceRows = gridsData.map(g => ({
        client_id:      clientId,
        grid_id:        g.id,
        plan_type:      planId,
        monthly_fee:    monthly,
        deposit_amount: deposit,
        start_date:     startDate.toISOString().split("T")[0],
        end_date:       endDate.toISOString().split("T")[0],
        status:         "active", // 무통장/카드 상관없이 공간 계약은 우선 'active'로 확정하여 자리 선점
      }));
      const { error: spacesError } = await supabase.from("spaces").insert(spaceRows);
if (spacesError) throw new Error("계약 저장 실패: " + spacesError.message);

      await supabase.from("grids").update({ status: "occupied" }).in("grid_number", gridList);

      const { data: billData, error: billError } = await supabase
        .from("monthly_bills")
        .insert({
          client_id:     clientId,
          billing_year:  startDate.getFullYear(),
          billing_month: startDate.getMonth() + 1,
          storage_fee:   totalAmt,
          transport_fee: 0,
          disposal_fee:  0,
          status:        "pending",
        })
        .select()
        .single();
      
      // 에러의 진짜 얼굴을 화면에 띄웁니다!
      if (billError) throw new Error("청구서 생성 실패: " + billError.message);
      if (!billData) throw new Error("청구서 생성 실패: 데이터가 반환되지 않음");

      await supabase.from("bill_line_items").insert({
        bill_id:     billData.id,
        item_type:   "storage",
        description: `월 보관료 (${gridList.join(", ")})`,
        amount:      totalAmt,
      });

      await sendTelegramNotification(
        `🎉 <b>그리드 예약 접수 (${payMethod === "bank" ? "무통장" : "카드"})</b>\n\n` +
        `👤 고객명: ${clientName}\n` +
        `📦 예약 공간: ${gridList.join(", ")} (${gridList.length} Grid)\n` +
        `📅 이용 기간: ${months}개월\n` +
        `💰 결제 금액: ${fmt(grandTotal)}\n` +
        `🗓 시작일: ${fmtDate(startDate)}`
      );

      // 결제 수단에 따른 안내 메시지 분기 처리
      if (payMethod === "bank") {
        alert(`예약이 정상적으로 접수되었습니다!\n\n[입금 계좌 안내]\n기업은행 123-4567-8901 (주)씬박스\n입금 금액: ${fmt(grandTotal)}\n\n입금 확인이 완료되면 계약이 최종 확정됩니다.`);
      } else {
        alert("결제 및 예약이 완료되었습니다! 🎉\n대시보드에서 계약 현황을 확인하실 수 있습니다.");
      }
      
      router.push("/dashboard");
    } catch (err: any) {
      console.error("결제 처리 실패 상세:", err);
      // 어떤 에러인지 화면에 정확하게 띄워줍니다
      alert(`[데이터베이스 처리 오류]\n원인: ${err.message || "알 수 없는 오류"}\n\n※ 이 메시지를 자비스에게 알려주세요!`);
    }
    setIsSubmitting(false);
  };

  return (
    <div style={{ background: "#F3F4F6", minHeight: "100vh", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}
      className="flex justify-center">
      <div style={{ width: "100%", maxWidth: 430, minHeight: "100vh", paddingBottom: 280 }}>

        <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB" }}
          className="sticky top-0 z-50 flex items-center justify-between px-4 py-4">
          <button type="button" className="p-1" onClick={() => router.back()}>
            <ChevronLeft size={24} color="#374151" />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>결제 및 증빙</span>
          <button className="p-1"><X size={22} color="#374151" /></button>
        </div>

        <div className="flex flex-col gap-5 px-4 pt-5">

          <section>
            <StepLabel n={1} title="예약 내역 확인" />
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}>
              <div style={{ background: BLUE, padding: "14px 18px" }}>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 2 }}>
                  최종 결제 금액 (보관료 + 보증금)
                </p>
                <p style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
                  {fmt(grandTotal)}
                </p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                  보관료 {fmt(totalAmt)} + 이행 보증금 {fmt(deposit)} (VAT 별도)
                </p>
              </div>
              <div style={{ padding: "16px 18px" }} className="flex flex-col gap-3">
                {[
                  { label: "예약 공간",              value: `${gridList.join(", ")} (총 ${gridList.length} Grid)` },
                  { label: "층고",                   value: "10m 무제한 활용" },
                  { label: "이용 기간",               value: `${months}개월 (${fmtDate(startDate)} ~ ${fmtDate(endDate)})` },
                  { label: "월 보관료",               value: `${fmt(monthly)} (VAT 별도)` },
                  { label: `${months}개월 보관료 총액`, value: `${fmt(totalAmt)} (VAT 별도)` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between">
                    <span style={{ fontSize: 13, color: "#9CA3AF", flexShrink: 0, marginRight: 12 }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1F2937", textAlign: "right" }}>{value}</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px dashed #E5E7EB", paddingTop: 12 }}>
                  <div className="flex items-start justify-between">
                    <span style={{ fontSize: 13, color: "#9CA3AF", flexShrink: 0, marginRight: 12 }}>이행 보증금</span>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1F2937" }}>{fmt(deposit)}</span>
                      <p style={{ fontSize: 11, color: "#60A5FA", marginTop: 3, fontWeight: 500, lineHeight: 1.6 }}>
                        2개월치 정상 보관료 기준<br />
                        <span style={{ color: "#9CA3AF" }}>미납 요금(운송/폐기 등) 정산용 포괄 담보금</span><br />
                        <span style={{ color: "#9CA3AF" }}>정상 퇴실 시 100% 환불</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <StepLabel n={2} title="결제 수단 선택" />
            <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 12, paddingLeft: 30 }}>결제 방식을 선택해주세요.</p>
            <div style={{ display: "flex", background: "#E5E7EB", borderRadius: 12, padding: 4, marginBottom: 14 }}>
              {[
                { id: "card" as const, icon: CreditCard, label: "카드 결제" },
                { id: "bank" as const, icon: Building2,  label: "무통장 입금" },
              ].map(({ id, icon: Icon, label }) => {
                const active = payMethod === id;
                return (
                  <button key={id} onClick={() => setPayMethod(id)}
                    style={{ flex: 1, padding: "10px 0", borderRadius: 9, border: "none", cursor: "pointer", background: active ? "#fff" : "transparent", color: active ? BLUE : "#9CA3AF", fontWeight: active ? 700 : 500, fontSize: 14, boxShadow: active ? "0 1px 6px rgba(0,0,0,0.1)" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s" }}>
                    <Icon size={16} strokeWidth={2} />{label}
                  </button>
                );
              })}
            </div>

            {payMethod === "card" && (
              <div style={{ background: "#EFF6FF", borderRadius: 14, padding: "18px", border: "1px solid #BFDBFE" }}>
                <div className="flex items-start gap-3">
                  <ShieldCheck size={20} color={BLUE} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: BLUE, marginBottom: 4 }}>안전한 외부 결제창으로 이동합니다</p>
                    <p style={{ fontSize: 12, color: "#60A5FA", lineHeight: 1.6 }}>
                      결제하기 버튼을 누르면 PG사의 보안 결제창으로 연결됩니다. 카드 정보는 당사 서버에 저장되지 않습니다.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {payMethod === "bank" && (
              <div className="flex flex-col gap-3">
                {/* 계좌번호 숨김 처리 영역 */}
                <div style={{ background: "#F9FAFB", borderRadius: 14, padding: "18px", border: "1px dashed #D1D5DB" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Lock size={16} color="#6B7280" />
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>입금 계좌 안내</p>
                  </div>
                  <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
                    입금하실 계좌번호는 <strong>하단 필수 약관 동의 후 [예약 확정] 버튼</strong>을 누르시면 안전하게 발급 및 안내됩니다.
                  </p>
                </div>

                <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div className="mb-3 flex items-center gap-2">
                    <FileText size={16} color={BLUE} />
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>세금계산서 발행 정보</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    {[
                      { key: "name"  as const, placeholder: "담당자 성함",                type: "text"  },
                      { key: "phone" as const, placeholder: "연락처 (예: 010-1234-5678)", type: "tel"   },
                      { key: "email" as const, placeholder: "이메일 (세금계산서 수신)",    type: "email" },
                    ].map(({ key, placeholder, type }) => (
                      <input key={key} type={type} placeholder={placeholder} value={form[key]}
                        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 14, color: "#111827", background: "#F9FAFB", outline: "none", boxSizing: "border-box" }} />
                    ))}
                  </div>
                </div>

                <button style={{ width: "100%", padding: "22px 0", borderRadius: 14, border: "2px dashed #D1D5DB", background: "#FAFAFA", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Camera size={22} color="#9CA3AF" />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>사업자등록증 사본 첨부</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>필수 · JPG, PNG, PDF 가능</p>
                </button>
              </div>
            )}
          </section>

          <section>
            <StepLabel n={3} title="필수 약관 동의" />
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", overflow: "hidden" }}>
              <button
                onClick={() => setChecks(allChecked
                  ? { terms: false, liability: false, scope: false, checkout: false }
                  : { terms: true, liability: true, scope: true, checkout: true }
                )}
                style={{ width: "100%", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, background: allChecked ? "#EFF6FF" : "#F9FAFB", borderBottom: "1px solid #F3F4F6", border: "none", cursor: "pointer", textAlign: "left" }}>
                <Checkbox checked={allChecked} />
                <span style={{ fontSize: 14, fontWeight: 700, color: allChecked ? BLUE : "#374151" }}>전체 동의</span>
              </button>
              <div style={{ padding: "4px 0" }}>

                <TermRow
                  checked={checks.terms}
                  onToggle={() => toggleCheck("terms")}
                  onExpand={() => toggleExpand("terms")}
                  expanded={expanded.terms}
                  label="[필수] 본 서비스는 B2B 전용 '물리적 공간(Grid) 대여 서비스'이며, 보관 물품에 대한 훼손/파손 면책 조항에 동의합니다."
                  color={BLUE}
                  detail="씬박스는 보관업이 아닌 물리적 공간(Grid) 임대 서비스입니다. 화물의 보존은 고객의 자체 자산 보험으로 커버해야 하며, 당사는 환경적 요인 및 불가항력적 사고로 인한 훼손에 대해 배상 책임을 지지 않습니다."
                />

                <TermRow
                  checked={checks.liability}
                  onToggle={() => toggleCheck("liability")}
                  onExpand={() => toggleExpand("liability")}
                  expanded={expanded.liability}
                  label="[필수] 보관료 연체 시 이행보증금 우선 차감 및 장기 연체 화물의 임의 처분에 동의합니다."
                  color="#111827"
                  detail="요금 연체 시 납부한 이행보증금에서 미납금이 우선 차감되며, 60일 이상 장기 연체 시 당사는 사전 통보 후 공간 확보를 위해 해당 화물을 임의로 반출, 매각, 또는 폐기 처분할 수 있습니다."
                />

                <TermRow
                  checked={checks.checkout}
                  onToggle={() => toggleCheck("checkout")}
                  onExpand={() => toggleExpand("checkout")}
                  expanded={expanded.checkout}
                  label="[필수] 화물 출고(부분 반환 포함) 시, 최소 1영업일(24시간) 전 사전 예약 필수 원칙에 동의합니다."
                  color="#111827"
                  detail="원활한 현장 작업 및 동선 확보를 위해 사전 예약 없는 당일 즉시 출고 요구는 원칙적으로 거절되며, 이로 인한 고객의 업무 지연에 대해 회사는 책임지지 않습니다."
                />

                <TermRow
                  checked={checks.scope}
                  onToggle={() => toggleCheck("scope")}
                  onExpand={() => toggleExpand("scope")}
                  expanded={expanded.scope}
                  label="[필수] 당사는 '보관 및 운송' 전용 서비스로, 현장 구조물 해체/철거 작업은 제공하지 않음에 동의합니다."
                  color="#111827"
                  detail="씬박스는 보관 및 운송 전용 서비스입니다. 미술 세트나 구조물의 현장 해체, 철거, 분해 작업은 서비스 범위에 포함되지 않습니다."
                />

              </div>
            </div>
          </section>
        </div>

        <div style={{ position: "fixed", bottom: 56, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#fff", borderTop: "1px solid #E5E7EB", padding: "14px 16px 20px", boxShadow: "0 -4px 20px rgba(0,0,0,0.08)", zIndex: 90 }}>
          <button
            onClick={handlePayment}
            disabled={!allChecked || isSubmitting}
            style={{ width: "100%", padding: "16px 0", borderRadius: 14, border: "none", background: allChecked ? `linear-gradient(90deg, ${BLUE}, #3B82F6)` : "#E5E7EB", color: allChecked ? "#fff" : "#9CA3AF", fontSize: 16, fontWeight: 700, cursor: allChecked ? "pointer" : "not-allowed", boxShadow: allChecked ? `0 4px 16px ${BLUE}55` : "none", transition: "all 0.2s" }}>
            {isSubmitting ? "처리 중..." : !allChecked ? "약관에 동의해주세요" : (payMethod === "card" ? `${fmt(grandTotal)} 결제하기` : "예약 확정 및 입금 계좌 확인")}
          </button>
        </div>

      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
        <p className="animate-pulse text-[14px] font-bold text-gray-500">불러오는 중...</p>
      </div>
    }>
      <CheckoutInner />
    </Suspense>
  );
}

function StepLabel({ n, title }: { n: number; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span style={{ width: 22, height: 22, borderRadius: "50%", background: BLUE, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{n}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{title}</span>
    </div>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked ? BLUE : "#D1D5DB"}`, background: checked ? BLUE : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
      {checked && <Check size={12} color="#fff" strokeWidth={3} />}
    </div>
  );
}

function TermRow({ checked, onToggle, onExpand, expanded, label, color, icon, detail }: {
  checked: boolean;
  onToggle: () => void;
  onExpand: () => void;
  expanded: boolean;
  label: string;
  color: string;
  icon?: React.ReactNode;
  detail: string;
}) {
  return (
    <div style={{ borderBottom: "1px solid #F9FAFB" }}>
      <div style={{ display: "flex", alignItems: "flex-start", padding: "13px 18px", gap: 12 }}>
        <button onClick={onToggle} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0, marginTop: 1 }}>
          <Checkbox checked={checked} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-start gap-1.5">
            {icon}
            <span style={{ fontSize: 13, color, lineHeight: 1.5, fontWeight: 600 }}>{label}</span>
          </div>
          {expanded && (
            <div style={{ marginTop: 8, padding: "10px 12px", background: "#F9FAFB", borderRadius: 8, fontSize: 12, color: "#6B7280", lineHeight: 1.7 }}>
              {detail}
            </div>
          )}
        </div>
        <button onClick={onExpand} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }}>
          <ChevronDown size={14} color="#9CA3AF" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </button>
      </div>
    </div>
  );
}