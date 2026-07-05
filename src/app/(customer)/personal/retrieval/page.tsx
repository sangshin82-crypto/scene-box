"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, PackageOpen, AlertTriangle, Check } from "lucide-react";
import { supabase } from "@/app/lib/supabase";

const BLUE = "#2563EB";
const GREEN = "#10B981";

// DB의 retrieval_type 값은 'urgent' 유지(런칭 전 DB 정합성 스프린트에서 리네이밍 예정).
// 화면 라벨/금액만 약관 4조에 맞춰 수시 반출 15,000원으로 표시.
const OPTIONS = [
  { id: "regular", label: "정기 반출", price: 0,     desc: "약정 종료 후 전체 짐을 돌려받습니다 (계약 종료)", color: GREEN },
  { id: "parcel",  label: "택배 반출", price: 5000,  desc: "라벨 번호 기준 소형 물품을 택배로 받습니다 (보관 유지)", color: BLUE },
  { id: "urgent",  label: "수시 반출", price: 15000, desc: "라벨 번호 기준 대형 물품을 정기 방문일에 직접 받습니다 (보관 유지)", color: "#F59E0B" },
];

export default function PersonalRetrievalPage() {
  const router = useRouter();
  const [type, setType]         = useState("regular");
  const [itemDesc, setItemDesc] = useState("");
  const [address, setAddress]   = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [desiredDate, setDesiredDate]     = useState("");
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [agreed, setAgreed]     = useState(false);
  const [error, setError]       = useState("");

  // 기존 주소 + 다음 우편번호 스크립트
  useEffect(() => {
    async function loadAddr() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }
      const { data } = await supabase
        .from("clients").select("address_detail").eq("id", user.id).single();
      if (data?.address_detail) setAddress(data.address_detail);
    }
    loadAddr();

    const SCRIPT_SRC = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const openAddressSearch = () => {
    const daum = (window as any).daum;
    if (!daum || !daum.Postcode) {
      alert("주소 검색 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    new daum.Postcode({
      oncomplete: (data: any) => setAddress(data.roadAddress || data.jibunAddress),
    }).open();
  };

  const selected = OPTIONS.find((o) => o.id === type)!;
  const amount = selected.price;
  const needItem = type === "parcel" || type === "urgent";
  const needDate = type === "urgent";

  const handleSubmit = async () => {
    if (needItem && !itemDesc.trim()) { setError("찾으실 라벨 번호를 입력해주세요."); return; }
    if (!address.trim())              { setError("주소를 검색해주세요."); return; }
    if (!addressDetail.trim())        { setError("상세주소(동·호수)를 입력해주세요."); return; }
    if (needDate && !desiredDate)     { setError("희망일을 선택해주세요."); return; }
    setIsSubmitting(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/"); return; }

    const { error: insErr } = await supabase.from("personal_requests").insert({
      client_id: user.id,
      request_type: "retrieval",
      retrieval_type: type,
      item_desc: needItem ? itemDesc.trim() : null,
      desired_date: needDate ? desiredDate : null,
      address_detail: `${address.trim()} ${addressDetail.trim()}`,
      amount,
      status: "requested",
    });

    if (insErr) {
      setError("신청 중 오류가 발생했습니다. 다시 시도해주세요.");
      setIsSubmitting(false);
      return;
    }
    alert("반출 신청이 접수되었습니다!\n회사가 지정하는 정기 방문일을 별도로 안내해 드립니다.");
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
          <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>반출 신청</span>
        </header>

        <div className="flex flex-col gap-4" style={{ padding: "52px 16px 20px" }}>

          {/* 반출 종류 선택 */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 12, paddingLeft: 2 }}>반출 방법</p>
            <div className="flex flex-col gap-3">
              {OPTIONS.map((o) => {
                const active = type === o.id;
                return (
                  <button key={o.id} onClick={() => setType(o.id)}
                    style={{ background: "#fff", borderRadius: 14, border: `2px solid ${active ? o.color : "#D1E8DF"}`, padding: "16px 18px", cursor: "pointer", textAlign: "left", boxShadow: active ? `0 2px 12px ${o.color}22` : "0 1px 6px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: active ? `${o.color}18` : "#F0F7F4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <PackageOpen size={21} color={active ? o.color : "#94A3B8"} strokeWidth={1.6} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: active ? o.color : "#0F172A" }}>{o.label}</p>
                        <span style={{ fontSize: 13, fontWeight: 800, color: active ? o.color : "#94A3B8" }}>
                          {o.price === 0 ? "무료" : `${o.price.toLocaleString()}원`}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>{o.desc}</p>
                    </div>
                    {active && (
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: o.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Check size={11} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 정기 반출 경고 — 약관 7조 정합(약정 이행 / 중도 해지 구분) */}
          {type === "regular" && (
            <div style={{ background: "#FEF2F2", borderRadius: 14, border: "1.5px solid #FECACA", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <AlertTriangle size={17} color="#DC2626" strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#DC2626", marginBottom: 4 }}>보관이 종료됩니다</p>
                  <p style={{ fontSize: 12, color: "#991B1B", lineHeight: 1.6 }}>
                    정기 반출은 <b>전체 짐을 회수하고 보관을 종료</b>합니다. 3개월 약정을 정상 이행한 경우 무료이나, <b>약정 기간 중 중도 해지</b> 시에는 무료 반출 혜택이 적용되지 않으며 <b>차량 배차 비용(50,000원)</b>이 별도로 부과됩니다. 일부 물품만 필요하시면 택배·수시 반출을 이용해주세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 찾을 라벨 번호 (택배·수시) */}
          {needItem && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "20px 18px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>찾으실 라벨 번호</label>
              <input
                type="text" value={itemDesc} onChange={(e) => setItemDesc(e.target.value)}
                placeholder="박스/포장 라벨 번호 (예: 3번, 7번)"
                style={{ width: "100%", padding: "14px 16px", borderRadius: 14, border: "1.5px solid #D1E8DF", fontSize: 15, color: "#0F172A", outline: "none", boxSizing: "border-box", background: "#fff", WebkitTextFillColor: "#0F172A" }}
              />
              <p style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.6, marginTop: 8 }}>
                수거 시 안내받은 라벨 번호를 적어주세요. 반출은 라벨 번호 기준으로만 처리됩니다.
              </p>
            </div>
          )}

          {/* 희망일 (수시) */}
          {needDate && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "20px 18px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>희망 배송일</label>
              <input
                type="date" value={desiredDate} onChange={(e) => setDesiredDate(e.target.value)}
                style={{ width: "100%", padding: "14px 16px", borderRadius: 14, border: "1.5px solid #D1E8DF", fontSize: 15, color: desiredDate ? "#0F172A" : "#94A3B8", outline: "none", boxSizing: "border-box", background: "#fff" }}
              />
              <p style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.6, marginTop: 8 }}>
                희망일을 참고해 회사가 지정하는 정기 방문일에 배송해 드립니다.
              </p>
            </div>
          )}

          {/* 주소 */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 18px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
              {type === "regular" ? "회수 주소" : "배송 주소"}
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div onClick={openAddressSearch}
                style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 14, border: "1.5px solid #D1E8DF", padding: "13px 14px", cursor: "pointer" }}>
                <MapPin size={17} color={BLUE} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14, color: address ? "#0F172A" : "#94A3B8" }}>{address || "주소 검색"}</span>
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
          </div>

          {/* 금액 */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "18px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>결제 금액</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: amount === 0 ? GREEN : BLUE }}>
              {amount === 0 ? "무료" : `${amount.toLocaleString()}원`}
            </span>
          </div>

          {amount > 0 && (
            <p style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.6, paddingLeft: 2 }}>
              ※ 결제는 페이앱 링크로 진행됩니다.
            </p>
          )}

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
            {isSubmitting ? "접수 중..." : "반출 신청하기"}
          </button>
        </div>
      </div>
    </div>
  );
}