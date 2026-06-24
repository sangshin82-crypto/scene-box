"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minus, Plus, Package, MapPin } from "lucide-react";
import { supabase } from "@/app/lib/supabase";

const BLUE = "#2563EB";
const BOX_PRICE = 10000;
const MIN_BOX = 3;

export default function PersonalBookingPage() {
  const router = useRouter();
  const [boxCount, setBoxCount] = useState(MIN_BOX);
  const [address, setAddress]   = useState("");
  const [memo, setMemo]         = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const amount = boxCount * BOX_PRICE;

  const handleSubmit = async () => {
    if (boxCount < MIN_BOX) { setError(`최소 ${MIN_BOX}개부터 신청 가능합니다.`); return; }
    if (!address.trim())    { setError("주소를 입력해주세요."); return; }
    setIsSubmitting(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/"); return; }

    const { error: insErr } = await supabase.from("personal_requests").insert({
      client_id: user.id,
      request_type: "storage",
      box_count: boxCount,
      address_detail: address.trim(),
      amount,
      memo: memo.trim() || null,
      status: "requested",
    });

    if (insErr) {
      setError("신청 중 오류가 발생했습니다. 다시 시도해주세요.");
      setIsSubmitting(false);
      return;
    }
    alert("보관 예약이 접수되었습니다!\n관리자가 가까운 월요일 방문 일정을 안내해 드립니다.");
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

        <div className="flex flex-col gap-4" style={{ padding: "52px 16px 20px" }}>

          {/* 안내 */}
          <div style={{ background: "linear-gradient(135deg, #EFF6FF, #F0F7F4)", borderRadius: 16, padding: "18px 18px", border: "0.5px solid #D1E8DF" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Package size={20} color={BLUE} strokeWidth={2} />
              <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>이사박스 보관</span>
            </div>
            <p style={{ fontSize: 12.5, color: "#64748B", lineHeight: 1.7 }}>
              박스 1개당 월 10,000원 (최소 3개)<br />
              신청하시면 가까운 <b>월요일에 빈 박스를 배송</b>하고,<br />
              채워두시면 <b>목요일에 회수</b>해 보관합니다.
            </p>
          </div>

          {/* 박스 수 선택 */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 18px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 14 }}>박스 개수</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
              <button
                onClick={() => setBoxCount((c) => Math.max(MIN_BOX, c - 1))}
                style={{ width: 44, height: 44, borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#F9FAFB", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: boxCount <= MIN_BOX ? "#D1D5DB" : "#374151" }}>
                <Minus size={20} strokeWidth={2} />
              </button>
              <div style={{ textAlign: "center", minWidth: 80 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: "#0F172A" }}>{boxCount}</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#94A3B8", marginLeft: 4 }}>개</span>
              </div>
              <button
                onClick={() => setBoxCount((c) => c + 1)}
                style={{ width: 44, height: 44, borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#F9FAFB", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151" }}>
                <Plus size={20} strokeWidth={2} />
              </button>
            </div>
            <p style={{ textAlign: "center", fontSize: 11, color: "#94A3B8", marginTop: 12 }}>최소 3개부터 신청 가능합니다</p>
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
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", margin: "16px 0 8px" }}>요청사항 (선택)</label>
            <input
              type="text" value={memo} onChange={(e) => setMemo(e.target.value)}
              placeholder="예: 부재 시 경비실에 맡겨주세요"
              style={{ width: "100%", padding: "14px 16px", borderRadius: 14, border: "1.5px solid #D1E8DF", fontSize: 15, color: "#0F172A", outline: "none", boxSizing: "border-box", background: "#fff", WebkitTextFillColor: "#0F172A" }}
            />
          </div>

          {/* 금액 */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "18px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>월 이용료</span>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: BLUE }}>{amount.toLocaleString()}원</span>
              <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>박스 {boxCount}개 × 10,000원</p>
            </div>
          </div>

          <p style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.6, paddingLeft: 2 }}>
            ※ 결제는 관리자 방문 수거 후 페이앱 링크로 진행됩니다.
          </p>

          {error && <p style={{ fontSize: 13, color: "#EF4444", textAlign: "center" }}>{error}</p>}

          <button
            onClick={handleSubmit} disabled={isSubmitting}
            style={{ width: "100%", padding: "16px 0", borderRadius: 14, border: "none", background: isSubmitting ? "#E5E7EB" : `linear-gradient(90deg, ${BLUE}, #3B82F6)`, color: isSubmitting ? "#9CA3AF" : "#fff", fontSize: 16, fontWeight: 700, cursor: isSubmitting ? "not-allowed" : "pointer" }}>
            {isSubmitting ? "접수 중..." : "예약하기"}
          </button>
        </div>
      </div>
    </div>
  );
}