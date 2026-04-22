'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, X, Phone, Scale, CreditCard,
  CheckCircle2, AlertTriangle, Check, Trash2,
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";

const BLUE = "#2563EB";

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

export default function DisposalPage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!agreed || isSubmitting) return;
    setIsSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    const clientId = user?.id ?? "00000000-0000-0000-0000-000000000001";

    const { data: clientData } = await supabase
      .from("clients")
      .select("name, contact_phone")
      .eq("id", clientId)
      .single();
    const clientName = clientData?.name ?? "고객";
    const clientPhone = clientData?.contact_phone ?? "번호 없음";

    const { error } = await supabase
      .from("disposal_requests")
      .insert({
        client_id: clientId,
        unit_price_per_kg: 500,
        transport_fee: 0,
        status: "pending",
      });

    if (error) {
      alert("요청 중 오류가 발생했습니다. 다시 시도해 주세요.");
      setIsSubmitting(false);
      return;
    }

    await sendTelegramNotification(
      `🗑 <b>폐기 상담 요청!</b>\n\n` +
      `👤 고객명: ${clientName}\n` +
      `📞 연락처: ${clientPhone}\n` +
      `📅 요청일: ${new Date().toLocaleDateString("ko-KR")}\n\n` +
      `📌 고객에게 전화 상담을 진행해주세요.`
    );

    alert("폐기 요청이 접수되었습니다!\n담당자가 곧 연락드릴 예정입니다.");
    router.push("/dashboard");
    setIsSubmitting(false);
  };

  return (
    <div style={{ background: "#F0F7F4", minHeight: "100vh", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 430, minHeight: "100vh", paddingBottom: 130 }}>

        {/* 헤더 */}
        <div style={{ background: "#fff", borderBottom: "0.5px solid #D1E8DF", position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px" }}>
          <button type="button" onClick={() => router.back()} style={{ padding: 4, background: "none", border: "none", cursor: "pointer" }}>
            <ChevronLeft size={23} color="#374151" strokeWidth={1.8} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>폐기 정산 요청</span>
          <button onClick={() => router.back()} style={{ padding: 4, background: "none", border: "none", cursor: "pointer" }}>
            <X size={21} color="#374151" strokeWidth={1.8} />
          </button>
        </div>

        {/* 전화번호 띠 높이(32px) + 기존 패딩(20px) */}
        <div style={{ padding: "56px 16px 0", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* STEP 1 */}
          <section>
            <StepLabel n={1} title="폐기 진행 프로세스 안내" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

              <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #D1E8DF", padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 14, boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Phone size={19} color={BLUE} strokeWidth={1.6} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>① 전화 상담</p>
                  <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.7 }}>
                    폐기 요청 접수 후 담당자가 직접 연락드립니다.<br />
                    폐기할 물품의 종류와 수량을 상담을 통해 확인합니다.
                  </p>
                </div>
              </div>

              <div style={{ textAlign: "center", color: "#CBD5E1", fontSize: 18 }}>↓</div>

              <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #D1E8DF", padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 14, boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Scale size={19} color="#7C3AED" strokeWidth={1.6} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>② 무게 측정 및 단가 확인</p>
                  <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.7 }}>
                    창고 내 계근대(저울)로 폐기물 무게를 정확히 측정합니다.<br />
                    <span style={{ fontWeight: 600, color: "#7C3AED" }}>기본 단가: 1kg당 500원</span> (혼합 폐기물은 별도 협의)
                  </p>
                </div>
              </div>

              <div style={{ textAlign: "center", color: "#CBD5E1", fontSize: 18 }}>↓</div>

              <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #D1E8DF", padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 14, boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckCircle2 size={19} color="#10B981" strokeWidth={1.6} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>③ 최종 고객 확인</p>
                  <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.7 }}>
                    측정된 무게와 최종 폐기 비용을 고객님께 안내 후<br />
                    동의를 받아 폐기를 진행합니다.
                  </p>
                </div>
              </div>

              <div style={{ textAlign: "center", color: "#CBD5E1", fontSize: 18 }}>↓</div>

              <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #D1E8DF", padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 14, boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CreditCard size={19} color="#D97706" strokeWidth={1.6} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>④ 정산 탭에서 결제</p>
                  <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.7 }}>
                    폐기 완료 후 앱 하단 <span style={{ fontWeight: 700, color: "#D97706" }}>정산 탭</span>에서<br />
                    최종 청구서 확인 및 결제가 진행됩니다.
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* STEP 2 */}
          <section>
            <StepLabel n={2} title="필수 확인 사항" />
            <div style={{ background: "#FEF2F2", borderRadius: 18, border: "1.5px solid #FECACA", padding: "18px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <AlertTriangle size={17} color="#DC2626" strokeWidth={1.8} style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: "#DC2626" }}>폐기 후 복구는 불가능합니다</p>
              </div>
              <button onClick={() => setAgreed(p => !p)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1, border: `2px solid ${agreed ? "#DC2626" : "#FCA5A5"}`, background: agreed ? "#DC2626" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                  {agreed && <Check size={12} color="#fff" strokeWidth={3} />}
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#991B1B", lineHeight: 1.6 }}>
                  [필수] 폐기 처리가 시작된 적재물은 즉시 파기되며 절대 복구할 수 없음에 동의합니다.
                </p>
              </button>
              <p style={{ fontSize: 11, color: "#EF4444", marginTop: 12, lineHeight: 1.6, paddingLeft: 32 }}>
                * 요청 접수 후 담당자가 직접 연락드립니다.<br />
                * 최종 폐기 비용은 정산 탭을 통해 청구됩니다.
              </p>
            </div>
          </section>

        </div>

        {/* 하단 버튼 */}
        <div style={{ position: "fixed", bottom: 56, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(240,247,244,0.95)", backdropFilter: "blur(12px)", borderTop: "0.5px solid #D1E8DF", padding: "14px 16px 20px", boxShadow: "0 -4px 20px rgba(0,0,0,0.06)", zIndex: 90 }}>
          <button
            onClick={handleSubmit}
            disabled={!agreed || isSubmitting}
            style={{ width: "100%", padding: "15px 0", borderRadius: 14, border: "none", background: agreed ? `linear-gradient(90deg, ${BLUE}, #3B82F6)` : "#E5E7EB", color: agreed ? "#fff" : "#9CA3AF", fontSize: 15, fontWeight: 700, cursor: agreed ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: agreed ? `0 4px 16px ${BLUE}55` : "none", transition: "all 0.2s" }}>
            {isSubmitting ? "요청 중..." : agreed
              ? <><Trash2 size={17} color="#fff" strokeWidth={2} />폐기 확인 요청하기</>
              : "위 내용에 동의해주세요"
            }
          </button>
          <p style={{ textAlign: "center", fontSize: 11, color: "#94A3B8", marginTop: 8 }}>
            요청 접수 후 담당자가 연락드립니다
          </p>
        </div>

      </div>
    </div>
  );
}

function StepLabel({ n, title }: { n: number; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <span style={{ width: 22, height: 22, borderRadius: "50%", background: BLUE, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {n}
      </span>
      <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{title}</span>
    </div>
  );
}