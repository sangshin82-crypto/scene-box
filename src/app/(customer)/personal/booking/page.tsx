"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minus, Plus, Package, MapPin } from "lucide-react";
import { supabase } from "@/app/lib/supabase";

const BLUE = "#2563EB";
const GREEN = "#10B981";

// 롤테이너 요금 (VAT 포함, 1칸 기준)
const PRICE_3M_MONTHLY = 33000;   // 3개월 약정 월 단가
const PRICE_1M = 44000;           // 1개월 이용 단가
const PICKUP_FEE = 25000;         // 1개월 최초 수거비
const RETRIEVAL_FEE = 25000;      // 1개월 반출비
const MIN_UNIT = 1;               // 최소 1칸

type PlanType = "3month" | "1month";

export default function PersonalBookingPage() {
  const router = useRouter();
  const [planType, setPlanType] = useState<PlanType>("3month"); // 3개월 기본 선택
  const [unitCount, setUnitCount] = useState(MIN_UNIT);
  const [address, setAddress]   = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [memo, setMemo]         = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreed, setAgreed]     = useState(false);
  const [error, setError]       = useState("");

  // 기존 주소 미리 채우기
  useEffect(() => {
    async function loadAddr() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }
      const { data } = await supabase
        .from("clients").select("address_detail").eq("id", user.id).single();
      if (data?.address_detail) setAddress(data.address_detail);
    }
    loadAddr();
  }, []);

  // 다음 우편번호 스크립트 로드
  useEffect(() => {
    const SCRIPT_SRC = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // 주소 검색 팝업 열기
  const openAddressSearch = () => {
    const daum = (window as any).daum;
    if (!daum || !daum.Postcode) {
      alert("주소 검색 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    new daum.Postcode({
      oncomplete: (data: any) => {
        setAddress(data.roadAddress || data.jibunAddress);
      },
    }).open();
  };

  // ── 금액 계산 (예상액) ──
  // 3개월 약정: 월 33,000 × 3개월 × 칸 = 선결제 총액. 수거·반출 무료.
  // 1개월 이용: 44,000 × 칸 + (수거 25,000 + 반출 25,000) × 칸.
  // 3개월: 보관료만(수거·반출 무료). 1개월: 보관료는 칸마다, 수거·반출비는 왕복 1회 고정(칸 무관).
  const total3m = PRICE_3M_MONTHLY * 3 * unitCount;
  const total1m = PRICE_1M * unitCount + (PICKUP_FEE + RETRIEVAL_FEE);
  const amount = planType === "3month" ? total3m : total1m;

  const handleSubmit = async () => {
    if (!address.trim())    { setError("주소를 검색해주세요."); return; }
    if (!addressDetail.trim()) { setError("상세주소(동·호수)를 입력해주세요."); return; }
    setIsSubmitting(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/"); return; }

    const { error: insErr } = await supabase.from("personal_requests").insert({
      client_id: user.id,
      request_type: "storage",
      plan_type: planType,    // '3month' | '1month'
      unit_count: unitCount,  // 롤테이너 칸 수
      address_detail: `${address.trim()} ${addressDetail.trim()}`,
      amount,                 // 예상액. 현장 칸 수 확정 후 관리자가 최종 조정.
      memo: memo.trim() || null,
      status: "requested",
    });

    if (insErr) {
      setError("신청 중 오류가 발생했습니다. 다시 시도해주세요.");
      setIsSubmitting(false);
      return;
    }
    alert("보관 예약이 접수되었습니다!\n회사가 지정하는 정기 방문일을 별도로 안내해 드립니다.");
    router.push("/personal/dashboard");
  };

  return (
    <div style={{ background: "#F0F7F4", minHeight: "100vh", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }} className="flex justify-center">
      <div style={{ width: "100%", maxWidth: 430, minHeight: "100vh", paddingBottom: 40 }}>

        {/* 헤더 */}
        <header style={{ background: "#fff", borderBottom: "0.5px solid #D1E8DF" }} className="sticky top-0 z-50 flex items-center gap-3 px-5 py-4">
          <button onClick={() => router.push("/personal/dashboard")} style={{ color: "#374151", background: "none", border: "none", cursor: "pointer" }}>
            <ArrowLeft size={22} strokeWidth={1.8} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>보관 예약</span>
        </header>

        <div className="flex flex-col gap-4" style={{ padding: "44px 16px 20px" }}>

          {/* 안내 — 롤테이너 소개 + 흐름 */}
          <div style={{ background: "linear-gradient(135deg, #EFF6FF, #F0F7F4)", borderRadius: 16, padding: "18px 18px", border: "0.5px solid #D1E8DF" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Package size={20} color={BLUE} strokeWidth={2} />
              <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>롤테이너 보관</span>
            </div>
            <p style={{ fontSize: 12.5, color: "#64748B", lineHeight: 1.7, marginBottom: 10 }}>
              <b>1칸 = 가로 1.1m × 세로 0.8m × 높이 1.5m (약 1,300L)</b><br />
              옷장 하나를 통째로 담을 수 있는 크기예요.
            </p>
            <p style={{ fontSize: 12.5, color: "#64748B", lineHeight: 1.7 }}>
              직접 포장해 두시면, 정기 방문일에 <b>현관 앞에서 수거</b>해 롤테이너에 적재·라벨링 후 보관합니다.
            </p>
          </div>

          {/* 약정 선택 */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 18px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 14 }}>이용 유형</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

              {/* 3개월 약정 */}
              <button
                onClick={() => setPlanType("3month")}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 16px", borderRadius: 14, cursor: "pointer", width: "100%",
                  border: planType === "3month" ? `2px solid ${GREEN}` : "1.5px solid #E5E7EB",
                  background: planType === "3month" ? "#ECFDF5" : "#fff",
                }}>
                <div style={{ textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>3개월 약정</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: GREEN, padding: "2px 7px", borderRadius: 99 }}>추천</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#64748B" }}>월 33,000원 · 수거·반출 무료</p>
                </div>
                <div style={{ width: 22, height: 22, borderRadius: "50%", border: planType === "3month" ? "none" : "1.5px solid #CBD5E1", background: planType === "3month" ? GREEN : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {planType === "3month" && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
                </div>
              </button>

              {/* 1개월 이용 */}
              <button
                onClick={() => setPlanType("1month")}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 16px", borderRadius: 14, cursor: "pointer", width: "100%",
                  border: planType === "1month" ? `2px solid ${BLUE}` : "1.5px solid #E5E7EB",
                  background: planType === "1month" ? "#EFF6FF" : "#fff",
                }}>
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 3 }}>1개월 이용</p>
                  <p style={{ fontSize: 12, color: "#64748B" }}>44,000원 · 수거·반출 각 25,000원 별도</p>
                </div>
                <div style={{ width: 22, height: 22, borderRadius: "50%", border: planType === "1month" ? "none" : "1.5px solid #CBD5E1", background: planType === "1month" ? BLUE : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {planType === "1month" && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
                </div>
              </button>

            </div>

            {/* 디코이 넛지 — 1개월 선택 시. 실제 선택 칸 수 기준 동적 계산 */}
            {planType === "1month" && (() => {
              const diff = total3m - total1m; // 3개월 총액 - 1개월 총액
              return (
                <div style={{ marginTop: 12, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "12px 14px" }}>
                  <p style={{ fontSize: 12, color: "#B45309", lineHeight: 1.6 }}>
                    1개월 이용은 수거·반출 비용이 별도라 <b>{unitCount}칸 기준 {total1m.toLocaleString()}원</b>입니다.
                    {diff >= 0 ? (
                      <>
                        {" "}단 <b>{diff.toLocaleString()}원</b>만 더하면 <b>3개월 약정({total3m.toLocaleString()}원)</b>으로 보관 기간이 3배가 돼요.
                      </>
                    ) : (
                      <>
                        {" "}<b>3개월 약정({total3m.toLocaleString()}원)</b>과 큰 차이 없이 보관 기간을 3배로 늘릴 수 있어요.
                      </>
                    )}
                  </p>
                </div>
              );
            })()}
          </div>

          {/* 칸 수 선택 */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 18px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 14 }}>롤테이너 칸 수</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
              <button
                onClick={() => setUnitCount((c) => Math.max(MIN_UNIT, c - 1))}
                style={{ width: 44, height: 44, borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#F9FAFB", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: unitCount <= MIN_UNIT ? "#D1D5DB" : "#374151" }}>
                <Minus size={20} strokeWidth={2} />
              </button>
              <div style={{ textAlign: "center", minWidth: 80 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: "#0F172A" }}>{unitCount}</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#94A3B8", marginLeft: 4 }}>칸</span>
              </div>
              <button
                onClick={() => setUnitCount((c) => c + 1)}
                style={{ width: 44, height: 44, borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#F9FAFB", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}>
                <Plus size={20} strokeWidth={2} />
              </button>
            </div>
            <p style={{ textAlign: "center", fontSize: 11, color: "#94A3B8", marginTop: 12, lineHeight: 1.6 }}>
              예상 칸 수입니다. 실제 칸 수는 수거 현장에서 확인 후 최종 산정됩니다.
            </p>
          </div>

          {/* 주소 */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 18px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>수거 주소</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div onClick={openAddressSearch}
                style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 14, border: "1.5px solid #D1E8DF", padding: "13px 14px", cursor: "pointer" }}>
                <MapPin size={17} color={BLUE} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14, color: address ? "#0F172A" : "#94A3B8" }}>
                  {address || "주소 검색"}
                </span>
              </div>
              <button type="button" onClick={openAddressSearch}
                style={{ flexShrink: 0, padding: "13px 14px", borderRadius: 14, border: "none", background: BLUE, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                검색
              </button>
            </div>
            {address && (
              <input
                type="text" value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)}
                placeholder="상세주소 입력 (동·호수 등)"
                style={{ width: "100%", marginTop: 8, padding: "13px 14px", borderRadius: 14, border: "1.5px solid #D1E8DF", fontSize: 14, color: "#0F172A", outline: "none", boxSizing: "border-box", background: "#fff", WebkitTextFillColor: "#0F172A" }}
              />
            )}
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", margin: "16px 0 8px" }}>요청사항 (선택)</label>
            <input
              type="text" value={memo} onChange={(e) => setMemo(e.target.value)}
              placeholder="예: 부재 시 경비실에 맡겨주세요"
              style={{ width: "100%", padding: "14px 16px", borderRadius: 14, border: "1.5px solid #D1E8DF", fontSize: 15, color: "#0F172A", outline: "none", boxSizing: "border-box", background: "#fff", WebkitTextFillColor: "#0F172A" }}
            />
          </div>

          {/* 예상 금액 */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "18px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>예상 결제 금액</span>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: BLUE }}>{amount.toLocaleString()}원</span>
                {planType === "3month" ? (
                  <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                    3개월 선결제 · 월 33,000원 × {unitCount}칸 · 카드 할부 가능
                  </p>
                ) : (
                  <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                    보관 44,000원 × {unitCount}칸 + 수거·반출 50,000원(1회)
                  </p>
                )}
              </div>
            </div>
          </div>

          <p style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.6, paddingLeft: 2 }}>
            ※ 위 금액은 예상액입니다. 실제 금액은 현장에서 칸 수 확정 후 페이앱 링크로 안내·결제됩니다.
          </p>

          {/* 약관 동의 */}
          <div onClick={() => setAgreed((v) => !v)} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#fff", borderRadius: 14, padding: "14px 16px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)", cursor: "pointer" }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, border: agreed ? "none" : "1.5px solid #CBD5E1", background: agreed ? BLUE : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
              {agreed && <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>✓</span>}
            </div>
            <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.6 }}>
              <a href="/personal/terms" target="_blank" onClick={(e) => e.stopPropagation()} style={{ color: BLUE, textDecoration: "underline" }}>이용약관</a>,{" "}
              <a href="/personal/refund" target="_blank" onClick={(e) => e.stopPropagation()} style={{ color: BLUE, textDecoration: "underline" }}>환불규정</a>,{" "}
              <a href="/personal/privacy" target="_blank" onClick={(e) => e.stopPropagation()} style={{ color: BLUE, textDecoration: "underline" }}>개인정보처리방침</a>에 동의합니다.
            </p>
          </div>

          {error && <p style={{ fontSize: 13, color: "#EF4444", textAlign: "center" }}>{error}</p>}

          <button
            onClick={handleSubmit} disabled={isSubmitting || !agreed}
            style={{ width: "100%", padding: "16px 0", borderRadius: 14, border: "none", background: (isSubmitting || !agreed) ? "#E5E7EB" : `linear-gradient(90deg, ${BLUE}, #3B82F6)`, color: (isSubmitting || !agreed) ? "#9CA3AF" : "#fff", fontSize: 16, fontWeight: 700, cursor: (isSubmitting || !agreed) ? "not-allowed" : "pointer" }}>
            {isSubmitting ? "접수 중..." : "예약 신청하기"}
          </button>
        </div>
      </div>
    </div>
  );
}