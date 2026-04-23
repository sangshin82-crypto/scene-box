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
  const [licenseFile, setLicenseFile]   = useState<File | null>(null);
  const [checks, setChecks]             = useState<Record<CheckKey, boolean>>({
    terms: false, liability: false, scope: false, checkout: false,
  });
  const [expanded, setExpanded] = useState<Record<CheckKey, boolean>>({
    terms: false, liability: false, scope: false, checkout: false,
  });
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const allChecked = checks.terms && checks.liability && checks.scope && checks.checkout;

  const toggleCheck  = (k: CheckKey) => setChecks(p => ({ ...p, [k]: !p[k] }));
  const toggleExpand = (k: CheckKey) => setExpanded(p => ({ ...p, [k]: !p[k] }));

  const handlePayment = async () => {
    if (!allChecked || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const clientId = user?.id ?? "00000000-0000-0000-0000-000000000001";

      // 사업자등록증 업로드
      let uploadedUrl = null;
      if (licenseFile) {
        const fileExt = licenseFile.name.split('.').pop();
        const fileName = `${clientId}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('business_registrations')
          .upload(fileName, licenseFile);

        if (uploadError) throw new Error("사업자등록증 업로드 실패: " + uploadError.message);

        const { data: urlData } = supabase.storage
          .from('business_registrations')
          .getPublicUrl(fileName);

        uploadedUrl = urlData.publicUrl;

        await supabase
          .from("clients")
          .update({ business_license_url: uploadedUrl })
          .eq("id", clientId);
      }

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
        status:         "active",
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
        `🗓 시작일: ${fmtDate(startDate)}` +
        (uploadedUrl ? `\n📎 사업자등록증: 첨부됨` : "")
      );

      if (payMethod === "bank") {
        alert(`예약이 정상적으로 접수되었습니다!\n\n[입금 계좌 안내]\n기업은행 123-4567-8901 (주)씬박스\n입금 금액: ${fmt(grandTotal)}\n\n입금 확인이 완료되면 계약이 최종 확정됩니다.`);
      } else {
        alert("결제 및 예약이 완료되었습니다! 🎉\n대시보드에서 계약 현황을 확인하실 수 있습니다.");
      }

      router.push("/dashboard");
    } catch (err: any) {
      console.error("결제 처리 실패 상세:", err);
      alert(`[데이터베이스 처리 오류]\n원인: ${err.message || "알 수 없는 오류"}\n\n※ 이 메시지를 자비스에게 알려주세요!`);
    }
    setIsSubmitting(false);
  };

  return (
    <div style={{ background: "#F0F7F4", minHeight: "100vh", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}
      className="flex justify-center">
      <div style={{ width: "100%", maxWidth: 430, minHeight: "100vh", paddingBottom: 280 }}>

        {/* 헤더 */}
        <div style={{ background: "#fff", borderBottom: "0.5px solid #D1E8DF" }}
          className="sticky top-0 z-50 flex items-center justify-between px-4 py-4">
          <button type="button" className="p-1" onClick={() => router.back()}>
            <ChevronLeft size={23} color="#374151" strokeWidth={1.8} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>결제 및 증빙</span>
          <button className="p-1" onClick={() => router.back()}>
            <X size={21} color="#374151" strokeWidth={1.8} />
          </button>
        </div>

        <div className="flex flex-col gap-5 px-4" style={{ paddingTop: 56 }}>

          {/* STEP 1 */}
          <section>
            <StepLabel n={1} title="예약 내역 확인" />
            <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 1px 12px rgba(0,0,0,0.05)", overflow: "hidden", border: "0.5px solid #D1E8DF" }}>
              <div style={{ background: `linear-gradient(135deg, ${BLUE}, #3B82F6)`, padding: "16px 20px" }}>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 4 }}>
                  최종 결제 금액 (보관료 + 보증금)
                </p>
                <p style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>
                  {fmt(grandTotal)}
                </p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                  보관료 {fmt(totalAmt)} + 이행 보증금 {fmt(deposit)} (VAT 별도)
                </p>
              </div>
              <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "예약 공간",               value: `${gridList.join(", ")} (총 ${gridList.length} Grid)` },
                  { label: "층고",                    value: "10m 무제한 활용" },
                  { label: "이용 기간",                value: `${months}개월 (${fmtDate(startDate)} ~ ${fmtDate(endDate)})` },
                  { label: "월 보관료",                value: `${fmt(monthly)} (VAT 별도)` },
                  { label: `${months}개월 보관료 총액`, value: `${fmt(totalAmt)} (VAT 별도)` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#94A3B8", flexShrink: 0, marginRight: 12 }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", textAlign: "right" }}>{value}</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px dashed #D1E8DF", paddingTop: 12 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#94A3B8", flexShrink: 0, marginRight: 12 }}>이행 보증금</span>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{fmt(deposit)}</span>
                      <p style={{ fontSize: 11, color: "#60A5FA", marginTop: 3, fontWeight: 500, lineHeight: 1.6 }}>
                        2개월치 정상 보관료 기준<br />
                        <span style={{ color: "#94A3B8" }}>미납 요금(운송/폐기 등) 정산용 포괄 담보금</span><br />
                        <span style={{ color: "#94A3B8" }}>정상 퇴실 시 100% 환불</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* STEP 2 */}
          <section>
            <StepLabel n={2} title="결제 수단 선택" />
            <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 12, paddingLeft: 30 }}>결제 방식을 선택해주세요.</p>
            <div style={{ display: "flex", background: "#E8F5F0", borderRadius: 14, padding: 4, marginBottom: 14 }}>
              {[
                { id: "card" as const, icon: CreditCard, label: "카드 결제" },
                { id: "bank" as const, icon: Building2,  label: "무통장 입금" },
              ].map(({ id, icon: Icon, label }) => {
                const active = payMethod === id;
                return (
                  <button key={id} onClick={() => setPayMethod(id)}
                    style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", background: active ? "#fff" : "transparent", color: active ? BLUE : "#94A3B8", fontWeight: active ? 700 : 500, fontSize: 13, boxShadow: active ? "0 1px 6px rgba(0,0,0,0.08)" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s" }}>
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
                    <p style={{ fontSize: 12, color: "#60A5FA", lineHeight: 1.6 }}>
                      결제하기 버튼을 누르면 PG사의 보안 결제창으로 연결됩니다. 카드 정보는 당사 서버에 저장되지 않습니다.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {payMethod === "bank" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* 계좌번호 안내 */}
                <div style={{ background: "#F0F7F4", borderRadius: 14, padding: "16px 18px", border: "1px dashed #D1E8DF" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Lock size={15} color="#64748B" strokeWidth={1.8} />
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>입금 계좌 안내</p>
                  </div>
                  <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.7 }}>
                    입금하실 계좌번호는 <strong>하단 필수 약관 동의 후 [예약 확정] 버튼</strong>을 누르시면 안전하게 발급 및 안내됩니다.
                  </p>
                </div>

                {/* 세금계산서 */}
                <div style={{ background: "#fff", borderRadius: 16, padding: "16px 18px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)", border: "0.5px solid #D1E8DF" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <FileText size={15} color={BLUE} strokeWidth={1.8} />
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>세금계산서 발행 정보</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { key: "name"  as const, placeholder: "담당자 성함",                type: "text"  },
                      { key: "phone" as const, placeholder: "연락처 (예: 010-1234-5678)", type: "tel"   },
                      { key: "email" as const, placeholder: "이메일 (세금계산서 수신)",    type: "email" },
                    ].map(({ key, placeholder, type }) => (
                      <input key={key} type={type} placeholder={placeholder} value={form[key]}
                        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #D1E8DF", fontSize: 14, color: "#0F172A", background: "#F0F7F4", outline: "none", boxSizing: "border-box" }} />
                    ))}
                  </div>
                </div>

                {/* 사업자등록증 업로드 */}
                <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #D1E8DF", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
                  <div style={{ padding: "14px 18px", borderBottom: "0.5px solid #F0F7F4", display: "flex", alignItems: "center", gap: 8 }}>
                    <Camera size={16} color={BLUE} strokeWidth={1.8} />
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>사업자등록증 사본 첨부</p>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#EF4444", background: "#FEF2F2", padding: "2px 6px", borderRadius: 99 }}>필수</span>
                  </div>
                  <label style={{ display: "block", padding: "16px 18px", cursor: "pointer" }}>
                    <input
                      type="file"
                      accept="image/*, .pdf"
                      onChange={e => setLicenseFile(e.target.files?.[0] || null)}
                      style={{ display: "none" }}
                    />
                    {licenseFile ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#ECFDF5", borderRadius: 12, padding: "12px 14px" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Check size={18} color="#10B981" strokeWidth={2} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#059669" }}>파일 선택 완료</p>
                          <p style={{ fontSize: 11, color: "#6EE7B7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{licenseFile.name}</p>
                        </div>
                        <span style={{ fontSize: 11, color: "#10B981", fontWeight: 600, flexShrink: 0 }}>변경</span>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 0", border: "1.5px dashed #D1E8DF", borderRadius: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#F0F7F4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Camera size={22} color="#94A3B8" strokeWidth={1.5} />
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>파일을 선택해주세요</p>
                        <p style={{ fontSize: 11, color: "#94A3B8" }}>JPG, PNG, PDF 가능</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            )}
          </section>

          {/* STEP 3 */}
          <section>
            <StepLabel n={3} title="필수 약관 동의" />
            <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 1px 10px rgba(0,0,0,0.05)", overflow: "hidden", border: "0.5px solid #D1E8DF" }}>
              <button
                onClick={() => setChecks(allChecked
                  ? { terms: false, liability: false, scope: false, checkout: false }
                  : { terms: true, liability: true, scope: true, checkout: true }
                )}
                style={{ width: "100%", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, background: allChecked ? "#EFF6FF" : "#F0F7F4", borderBottom: "0.5px solid #D1E8DF", border: "none", cursor: "pointer", textAlign: "left" }}>
                <Checkbox checked={allChecked} />
                <span style={{ fontSize: 14, fontWeight: 700, color: allChecked ? BLUE : "#374151" }}>전체 동의</span>
              </button>
              <div style={{ padding: "4px 0" }}>
                <TermRow checked={checks.terms}     onToggle={() => toggleCheck("terms")}     onExpand={() => toggleExpand("terms")}     expanded={expanded.terms}
                  label="[필수] 본 서비스는 B2B 전용 '물리적 공간(Grid) 대여 서비스'이며, 보관 물품에 대한 훼손/파손 면책 조항에 동의합니다."
                  color={BLUE}
                  detail="씬박스는 보관업이 아닌 물리적 공간(Grid) 임대 서비스입니다. 화물의 보존은 고객의 자체 자산 보험으로 커버해야 하며, 당사는 환경적 요인 및 불가항력적 사고로 인한 훼손에 대해 배상 책임을 지지 않습니다." />
                <TermRow checked={checks.liability} onToggle={() => toggleCheck("liability")} onExpand={() => toggleExpand("liability")} expanded={expanded.liability}
                  label="[필수] 보관료 연체 시 이행보증금 우선 차감 및 장기 연체 화물의 임의 처분에 동의합니다."
                  color="#0F172A"
                  detail="요금 연체 시 납부한 이행보증금에서 미납금이 우선 차감되며, 60일 이상 장기 연체 시 당사는 사전 통보 후 공간 확보를 위해 해당 화물을 임의로 반출, 매각, 또는 폐기 처분할 수 있습니다." />
                <TermRow checked={checks.checkout}  onToggle={() => toggleCheck("checkout")}  onExpand={() => toggleExpand("checkout")}  expanded={expanded.checkout}
                  label="[필수] 화물 출고(부분 반환 포함) 시, 최소 1영업일(24시간) 전 사전 예약 필수 원칙에 동의합니다."
                  color="#0F172A"
                  detail="원활한 현장 작업 및 동선 확보를 위해 사전 예약 없는 당일 즉시 출고 요구는 원칙적으로 거절되며, 이로 인한 고객의 업무 지연에 대해 회사는 책임지지 않습니다." />
                <TermRow checked={checks.scope}     onToggle={() => toggleCheck("scope")}     onExpand={() => toggleExpand("scope")}     expanded={expanded.scope}
                  label="[필수] 당사는 '보관 및 운송' 전용 서비스로, 현장 구조물 해체/철거 작업은 제공하지 않음에 동의합니다."
                  color="#0F172A"
                  detail="씬박스는 보관 및 운송 전용 서비스입니다. 미술 세트나 구조물의 현장 해체, 철거, 분해 작업은 서비스 범위에 포함되지 않습니다." />
              </div>
            </div>
          </section>

        </div>

        {/* 하단 버튼 */}
        <div style={{ position: "fixed", bottom: 56, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(240,247,244,0.95)", backdropFilter: "blur(12px)", borderTop: "0.5px solid #D1E8DF", padding: "14px 16px 20px", boxShadow: "0 -4px 20px rgba(0,0,0,0.06)", zIndex: 90 }}>
          <button
            onClick={handlePayment}
            disabled={!allChecked || isSubmitting}
            style={{ width: "100%", padding: "15px 0", borderRadius: 14, border: "none", background: allChecked ? `linear-gradient(90deg, ${BLUE}, #3B82F6)` : "#E5E7EB", color: allChecked ? "#fff" : "#9CA3AF", fontSize: 15, fontWeight: 700, cursor: allChecked ? "pointer" : "not-allowed", boxShadow: allChecked ? `0 4px 16px ${BLUE}55` : "none", transition: "all 0.2s" }}>
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
      <div className="flex min-h-screen w-full items-center justify-center" style={{ background: "#F0F7F4" }}>
        <p className="animate-pulse text-[14px] font-bold" style={{ color: "#94A3B8" }}>불러오는 중...</p>
      </div>
    }>
      <CheckoutInner />
    </Suspense>
  );
}

function StepLabel({ n, title }: { n: number; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <span style={{ width: 22, height: 22, borderRadius: "50%", background: BLUE, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{n}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{title}</span>
    </div>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked ? BLUE : "#D1E8DF"}`, background: checked ? BLUE : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
      {checked && <Check size={12} color="#fff" strokeWidth={3} />}
    </div>
  );
}

function TermRow({ checked, onToggle, onExpand, expanded, label, color, detail }: {
  checked: boolean;
  onToggle: () => void;
  onExpand: () => void;
  expanded: boolean;
  label: string;
  color: string;
  detail: string;
}) {
  return (
    <div style={{ borderBottom: "0.5px solid #F0F7F4" }}>
      <div style={{ display: "flex", alignItems: "flex-start", padding: "13px 18px", gap: 12 }}>
        <button onClick={onToggle} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0, marginTop: 1 }}>
          <Checkbox checked={checked} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 12, color, lineHeight: 1.6, fontWeight: 600 }}>{label}</span>
          {expanded && (
            <div style={{ marginTop: 8, padding: "10px 12px", background: "#F0F7F4", borderRadius: 10, fontSize: 12, color: "#64748B", lineHeight: 1.7 }}>
              {detail}
            </div>
          )}
        </div>
        <button onClick={onExpand} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }}>
          <ChevronDown size={14} color="#94A3B8" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </button>
      </div>
    </div>
  );
}