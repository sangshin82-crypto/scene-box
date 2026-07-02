'use client';

import { useState, useEffect } from "react";

const BLUE = "#1A36E8";
const BLUE_DEEP = "#0F1F8F";
const YELLOW = "#FDD706";
const INK = "#0A0A0A";

// 짐 규모 4단계 (보통 = 롤테이너 한 칸 기준)
const SIZES = [
  { value: "소량",     title: "박스 몇 개 정도",   sub: "캐리어·이사박스 2~3개 (한 칸 미만)" },
  { value: "보통",     title: "옷장 하나 가득",     sub: "롤테이너 한 칸 · 이사박스 약 15개", recommend: true },
  { value: "많음",     title: "작은방 절반 정도",   sub: "한 칸 반~두 칸" },
  { value: "아주많음", title: "작은방 하나 가득",   sub: "두 칸 이상 · 이사·대량" },
];

export default function QuickPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [size, setSize] = useState("");
  const [memo, setMemo] = useState("");
  const [source, setSource] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSource(params.get("from") || "");
  }, []);

  useEffect(() => {
    const SCRIPT_SRC = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
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

  const canSubmit = name.trim() && phone.trim() && size && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    const fullRegion = address
      ? `${address.trim()}${addressDetail.trim() ? " " + addressDetail.trim() : ""}`
      : "";

    try {
      const { supabase } = await import("@/app/lib/supabase");
      const { error } = await supabase.from("quick_requests").insert({
        name: name.trim(),
        phone: phone.trim(),
        region: fullRegion || null,
        size,
        memo: memo.trim() || null,
        source: source || null,
        status: "requested",
      });

      if (error) {
        console.error("저장 실패:", error);
        alert("신청 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.");
        setSubmitting(false);
        return;
      }

      try {
        const msg =
          `🏠 <b>씬박스홈 상담 신청</b>\n\n` +
          `👤 ${name.trim()}\n` +
          `📞 ${phone.trim()}\n` +
          `📍 ${fullRegion || "-"}\n` +
          `📦 짐 규모: ${size}\n` +
          `📝 메모: ${memo.trim() || "-"}\n` +
          `🔗 출처: ${source || "-"}`;
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg }),
        });
      } catch (e) {
        console.error("텔레그램 알림 실패:", e);
      }

      setDone(true);
    } catch (e) {
      console.error(e);
      alert("신청 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.");
      setSubmitting(false);
    }
  };

  const FONT = "'Gothic A1','Apple SD Gothic Neo',sans-serif";

  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: YELLOW, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: FONT }}>
        <div style={{ background: "#fff", borderRadius: 24, padding: "44px 30px", textAlign: "center", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
          <div style={{ width: 66, height: 66, borderRadius: "50%", background: BLUE, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 32, color: "#fff", fontWeight: 900 }}>✓</div>
          <h2 style={{ fontSize: 23, fontWeight: 900, color: INK, margin: "0 0 12px" }}>신청이 접수됐어요!</h2>
          <p style={{ fontSize: 15, color: "#555", lineHeight: 1.7, margin: 0 }}>
            빠른 시일 내에 <b>{name.trim()}</b>님께<br />연락드릴게요. 감사합니다 😊
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F5F4EF", padding: "0 0 90px", fontFamily: FONT }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@700;800;900&family=Gothic+A1:wght@400;500;700;800;900&display=swap');
        .qspin { animation: qspin 1s linear infinite; }
        @keyframes qspin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto" }}>

        {/* 헤더 — 노란 배경 + 파란 텍스트 */}
        <div style={{ background: YELLOW, padding: "34px 24px 30px" }}>
          <div style={{ fontFamily: "'Archivo',sans-serif", fontSize: 13, fontWeight: 900, letterSpacing: 2, color: BLUE, marginBottom: 12 }}>SCENE BOX HOME</div>
          <h1 style={{ fontSize: 23, fontWeight: 900, margin: 0, lineHeight: 1.45, color: INK, letterSpacing: "-0.5px" }}>
            씬박스홈을 만나면<br />
            <span style={{ color: BLUE }}>아이방</span>이 생기고,<br />
            <span style={{ color: BLUE }}>서재</span>가 새롭게 생겨납니다
          </h1>
          <p style={{ fontSize: 14, fontWeight: 700, color: BLUE_DEEP, margin: "14px 0 0", lineHeight: 1.5 }}>
            짐 때문에 고민일 땐, 씬박스홈을 만나세요
          </p>
        </div>

        {/* 오픈 이벤트 — 상단 강조 */}
        <div style={{ background: "#fff", margin: "16px 16px 0", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
          <div style={{ background: BLUE, padding: "11px 20px", textAlign: "center" }}>
            <span style={{ fontFamily: "'Archivo',sans-serif", fontSize: 13, fontWeight: 900, color: YELLOW, letterSpacing: 1 }}>🎉 OPEN EVENT</span>
          </div>
          <div style={{ padding: "24px 24px 26px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
              <RolltainerSVG />
            </div>
            <div style={{ textAlign: "center", fontSize: 12.5, color: "#666", fontWeight: 600, marginBottom: 18 }}>
              가로 1.1m × 세로 0.8m × 높이 1.5m
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, color: "#aaa", textDecoration: "line-through", marginBottom: 2 }}>정가 월 39,900원</div>
              <div style={{ fontSize: 34, fontWeight: 900, color: BLUE, lineHeight: 1.1, letterSpacing: "-1px" }}>월 29,900원</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: BLUE, marginTop: 6 }}>무료 방문 수거·반출</div>
            </div>
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #eee", fontSize: 13.5, color: "#555", lineHeight: 1.7, textAlign: "center" }}>
              <b style={{ color: INK }}>옷장 하나 가득 기준</b><br />
              <span style={{ fontSize: 12, color: "#94A3B8" }}>일반 이사박스(48×38×34cm, 약 62L) 기준 약 15개</span>
            </div>
            <div style={{ marginTop: 12, textAlign: "center" }}>
              <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600 }}>3개월 약정 시 혜택</span>
            </div>
          </div>
        </div>

        {/* 짐 규모 선택 */}
        <div style={{ padding: "26px 16px 0" }}>
          <SectionTitle text="맡기실 짐이 어느 정도인가요?" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SIZES.map((s) => {
              const active = size === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => setSize(s.value)}
                  style={{
                    textAlign: "left", padding: "15px 16px", borderRadius: 14, cursor: "pointer",
                    border: active ? `2.5px solid ${BLUE}` : "2px solid #E5E3DC",
                    background: active ? "#EEF1FE" : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                    transition: "all .15s", fontFamily: FONT,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 15.5, fontWeight: 800, color: INK, display: "flex", alignItems: "center", gap: 6 }}>
                      {s.title}
                      {s.recommend && (
                        <span style={{ fontSize: 11, fontWeight: 800, color: INK, background: YELLOW, padding: "2px 8px", borderRadius: 10 }}>많이 선택</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12.5, color: "#888", marginTop: 3, fontWeight: 500 }}>{s.sub}</div>
                  </div>
                  {/* 선택 표시 — 원형 라디오 + "선택" */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%",
                      border: active ? "none" : "2px solid #CBD5E1",
                      background: active ? BLUE : "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 15, fontWeight: 900,
                    }}>{active ? "✓" : ""}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: active ? BLUE : "#B0B0AC" }}>{active ? "선택됨" : "선택"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 입력 폼 */}
        <div style={{ padding: "26px 16px 0" }}>
          <SectionTitle text="연락처를 남겨주세요" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field placeholder="이름" value={name} onChange={setName} />
            <Field placeholder="연락처 (예: 010-1234-5678)" value={phone} onChange={setPhone} type="tel" />

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div onClick={openAddressSearch}
                style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 12, border: "1.5px solid #E5E3DC", padding: "13px 14px", cursor: "pointer" }}>
                <span style={{ flex: 1, fontSize: 14.5, color: address ? INK : "#B0B0AC" }}>{address || "주소 검색 (선택)"}</span>
              </div>
              <button type="button" onClick={openAddressSearch}
                style={{ flexShrink: 0, padding: "13px 16px", borderRadius: 12, border: "none", background: BLUE, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", fontFamily: FONT }}>
                검색
              </button>
            </div>
            {address && (
              <input
                type="text" value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)}
                placeholder="상세주소 (동·호수 등)"
                style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: 12, border: "1.5px solid #E5E3DC", fontSize: 14.5, background: "#fff", color: "#0A0A0A", WebkitTextFillColor: "#0A0A0A", fontFamily: FONT }}
              />
            )}

            <textarea
              placeholder="추가로 하고 싶은 말이 있으면 적어주세요 (선택)&#10;예: 이사 예정이라 급해요 / 3개월 정도 맡길 거예요"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: 12, border: "1.5px solid #E5E3DC", fontSize: 14.5, resize: "none", fontFamily: FONT, lineHeight: 1.5 }}
            />
          </div>
        </div>

        {/* 제출 버튼 */}
        <div style={{ padding: "26px 16px 0" }}>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              width: "100%", padding: "17px", borderRadius: 14, border: "none",
              fontSize: 16.5, fontWeight: 900, color: "#fff", cursor: canSubmit ? "pointer" : "not-allowed",
              background: canSubmit ? BLUE : "#D5D5D0", fontFamily: FONT,
              boxShadow: canSubmit ? "0 8px 24px rgba(26,54,232,0.3)" : "none",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {submitting ? <><span className="qspin" style={{ display: "inline-block" }}>◠</span> 신청 중…</> : "무료 상담 신청하기"}
          </button>
          <p style={{ fontSize: 12, color: "#aaa", textAlign: "center", marginTop: 12, lineHeight: 1.5, fontWeight: 500 }}>
          신청 후 담당자가 연락드려 짐 양과 일정을 확인해요.<br />상담은 무료이며, 신청만으로 요금이 발생하지 않아요.
          </p>
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <a href="https://scenebox.co.kr/" style={{ fontSize: 13.5, fontWeight: 700, color: "#1A36E8", textDecoration: "underline", textUnderlineOffset: 3 }}>
              씬박스홈 서비스 자세히 보기 →
            </a>
          </div>
        </div>
      </div>

      {/* 카카오톡 플로팅 버튼 */}
       <a
        href="http://pf.kakao.com/_ngBCX/chat"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1500,
          background: "#FEE500", borderRadius: 100, padding: "14px 20px",
          display: "flex", alignItems: "center", gap: 8, textDecoration: "none",
          boxShadow: "0 6px 20px rgba(0,0,0,0.18)", fontFamily: FONT,
        }}
      >
        <span style={{ fontSize: 18 }}>💬</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: "#191600", whiteSpace: "nowrap" }}>카카오톡 문의</span>
      </a>
    </div>
  );
}

/* ── 섹션 제목 ── */
function SectionTitle({ text }: { text: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <span style={{ fontSize: 16, fontWeight: 800, color: "#0A0A0A" }}>{text}</span>
    </div>
  );
}

/* ── 입력 필드 ── */
function Field({ placeholder, value, onChange, type = "text" }: {
  placeholder: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", boxSizing: "border-box", background: "#fff", border: "1.5px solid #E5E3DC", borderRadius: 12, padding: "13px 14px", fontSize: 14.5, outline: "none", color: "#0A0A0A", WebkitTextFillColor: "#0A0A0A", fontFamily: "'Gothic A1','Apple SD Gothic Neo',sans-serif" }}
    />
  );
}

/* ── 롤테이너 SVG 도식 ── */
function RolltainerSVG() {
  return (
    <svg width="180" height="200" viewBox="0 0 180 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="45" width="90" height="120" fill="#EEF1FE" stroke="#0A0A0A" strokeWidth="2.5" />
      <path d="M30 45 L55 25 L145 25 L120 45 Z" fill="#D8DEFB" stroke="#0A0A0A" strokeWidth="2.5" />
      <path d="M120 45 L145 25 L145 145 L120 165 Z" fill="#C3CCF7" stroke="#0A0A0A" strokeWidth="2.5" />
      <line x1="60" y1="45" x2="60" y2="165" stroke="#0A0A0A" strokeWidth="1" opacity="0.3" />
      <line x1="90" y1="45" x2="90" y2="165" stroke="#0A0A0A" strokeWidth="1" opacity="0.3" />
      <circle cx="45" cy="172" r="6" fill="#0A0A0A" />
      <circle cx="105" cy="172" r="6" fill="#0A0A0A" />
      
    </svg>
  );
}