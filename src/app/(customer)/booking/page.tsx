'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, X, Check } from "lucide-react";
import { supabase } from "@/app/lib/supabase";

const BLUE  = "#2563EB";
const GREEN = "#10B981";

const ZONES: Record<string, string[][]> = {
  A: [
    ["A1","A2","A3","A4","A5"],
    ["A6","A7","A8","A9","A10"],
    ["A11","A12","A13","A14","A15"],
  ],
  B: [
    ["B1","B2","B3","B4"],
    ["B5","B6","B7","B8"],
    ["B9","B10","B11","B12"],
  ],
};

const PLANS = [
  { id: "1m", label: "1개월 단기", badge: null,       monthly: 120000, months: 1, discount: 0   },
  { id: "3m", label: "3개월 장기", badge: "10% 할인", monthly: 120000, months: 3, discount: 0.1 },
  { id: "6m", label: "6개월 장기", badge: "20% 할인", monthly: 120000, months: 6, discount: 0.2 },
];

const fmt = (n: number) => n.toLocaleString("ko-KR") + "원";

export default function BookingPage() {
  const router = useRouter();

  const [unavailable, setUnavailable] = useState<Set<string>>(new Set());
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [plan, setPlan]               = useState("3m");
  const [isLoading, setIsLoading]     = useState(true);

  useEffect(() => {
    async function fetchOccupied() {
      const { data, error } = await supabase
        .from("spaces")
        .select("grids(grid_number)")
        .eq("status", "active");

      if (error) {
        console.error("공간 현황 로딩 실패:", error);
      } else if (data) {
        const occupied = new Set(
          data.map((s: any) => s.grids?.grid_number).filter(Boolean) as string[]
        );
        setUnavailable(occupied);
      }
      setIsLoading(false);
    }
    fetchOccupied();
  }, []);

  const toggle = (id: string) => {
    if (unavailable.has(id)) return;
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const chosenPlan     = PLANS.find(p => p.id === plan) ?? PLANS[0];
  const gridCount      = selected.size;
  const monthlyPerGrid = 120000;
  const monthly        = monthlyPerGrid * gridCount;
  const discounted     = Math.round(monthly * (1 - chosenPlan.discount));
  const total          = discounted * chosenPlan.months;

  const selList = [...selected].sort();
  const zones: Record<string, string[]> = {};
  selList.forEach(id => {
    const z = id[0];
    (zones[z] = zones[z] || []).push(id);
  });
  const selSummary = Object.entries(zones)
    .map(([z, ids]) => `${z}존 - ${ids.join(", ")}`)
    .join(" / ");

  const handleCheckout = () => {
    if (gridCount === 0) return;
    const params = new URLSearchParams({
      grids:   selList.join(","),
      plan:    plan,
      total:   String(total),
      monthly: String(discounted),
      months:  String(chosenPlan.months),
    });
    router.push(`/checkout?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center" style={{ background: "#F0F7F4" }}>
        <p className="animate-pulse text-[14px] font-bold" style={{ color: "#94A3B8" }}>공간 현황 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#F0F7F4", minHeight: "100vh", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}
      className="flex justify-center">
      <div style={{ width: "100%", maxWidth: 430, background: "#F0F7F4" }}>

        {/* 헤더 */}
        <header style={{ background: "#fff", borderBottom: "0.5px solid #D1E8DF" }}
          className="sticky top-0 z-50 flex items-center justify-between px-4 py-4">
          <button type="button" className="p-1" onClick={() => router.back()}>
            <ChevronLeft size={23} color="#374151" strokeWidth={1.8} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>공간 예약</span>
          <button type="button" className="p-1" onClick={() => router.back()}>
            <X size={21} color="#374151" strokeWidth={1.8} />
          </button>
        </header>

        {/* 전화번호 띠(32px) + 기존 패딩(24px) */}
        <div className="flex flex-col gap-6 px-4" style={{ paddingTop: 56 }}>

          {/* STEP 1 */}
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: BLUE, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>1</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>공간(Grid) 선택</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, paddingLeft: 30, marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>예약할 공간을 선택해주세요. (1 Grid = 약 1.2평)</p>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: BLUE, padding: "3px 8px", borderRadius: 99, whiteSpace: "nowrap" }}>
                층고 10m 무제한 활용
              </span>
            </div>

            {/* 범례 */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, paddingLeft: 4, marginBottom: 12 }}>
              {[
                { color: "#F0F7F4", border: "#D1E8DF", label: "사용중" },
                { color: "#fff",    border: "#CBD5E1", label: "선택 가능" },
                { color: BLUE,      border: BLUE,      label: "선택됨" },
              ].map(({ color, border, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 4, background: color, border: `1.5px solid ${border}` }} />
                  <span style={{ fontSize: 11, color: "#64748B" }}>{label}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 1px 12px rgba(0,0,0,0.05)", padding: "18px 14px" }}>
              {Object.entries(ZONES).map(([zone, rows]) => (
                <div key={zone} style={{ marginBottom: zone === "A" ? 20 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: zone === "A" ? BLUE : GREEN, padding: "2px 10px", borderRadius: 99 }}>
                      {zone}존
                    </span>
                    <div style={{ flex: 1, height: 1, background: "#F0F7F4" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {rows.map((row, ri) => (
                      <div key={ri} style={{ display: "flex", gap: 6 }}>
                        {row.map(id => {
                          const unavail = unavailable.has(id);
                          const sel     = selected.has(id);
                          return (
                            <button key={id} onClick={() => toggle(id)}
                              style={{
                                flex: 1, height: 50, borderRadius: 10,
                                border: sel ? `2px solid ${BLUE}` : unavail ? `1.5px solid #D1E8DF` : "1.5px solid #CBD5E1",
                                background: sel ? BLUE : unavail ? "#F0F7F4" : "#fff",
                                cursor: unavail ? "not-allowed" : "pointer",
                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                gap: 2, transition: "all 0.15s",
                                boxShadow: sel ? `0 2px 8px ${BLUE}33` : "none",
                              }}>
                              {sel
                                ? <Check size={17} color="#fff" strokeWidth={2.5} />
                                : <span style={{ fontSize: 11, fontWeight: 600, color: unavail ? "#CBD5E1" : "#374151" }}>{id}</span>
                              }
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 16, padding: "10px 14px", background: "#F0F7F4", borderRadius: 12, border: "0.5px solid #D1E8DF" }}>
                <span style={{ fontSize: 12, color: "#64748B" }}>현재 선택: </span>
                {gridCount > 0
                  ? <span style={{ fontSize: 12, fontWeight: 700, color: BLUE }}>{selSummary} (총 {gridCount} Grid)</span>
                  : <span style={{ fontSize: 12, color: "#CBD5E1" }}>선택된 공간 없음</span>
                }
              </div>
            </div>
          </section>

          {/* STEP 2 */}
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: BLUE, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>2</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>이용 기간 선택</span>
            </div>
            <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 14, paddingLeft: 30 }}>얼마나 보관하시겠어요?</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {PLANS.map(p => {
                const active = plan === p.id;
                const m = Math.round(monthlyPerGrid * gridCount * (1 - p.discount));
                const t = m * p.months;
                return (
                  <button key={p.id} onClick={() => setPlan(p.id)}
                    style={{ background: "#fff", borderRadius: 16, border: active ? `2px solid ${BLUE}` : "0.5px solid #D1E8DF", padding: "16px 18px", cursor: "pointer", textAlign: "left", boxShadow: active ? `0 2px 12px ${BLUE}22` : "0 1px 6px rgba(0,0,0,0.04)", transition: "all 0.15s" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", border: active ? `5px solid ${BLUE}` : "2px solid #D1E8DF", background: "#fff", flexShrink: 0, transition: "all 0.15s" }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: active ? BLUE : "#0F172A" }}>{p.label}</span>
                        {p.badge && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: active ? "#fff" : GREEN, background: active ? BLUE : "#ECFDF5", padding: "2px 8px", borderRadius: 99 }}>
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: active ? BLUE : "#374151" }}>월 {fmt(m)}</p>
                        <p style={{ fontSize: 11, color: "#94A3B8" }}>
                          {p.months > 1 ? `총 ${fmt(t)} ` : ""}(VAT 별도)
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 푸터 */}
          <div style={{ background: "#F0F7F4", borderTop: "0.5px solid #D1E8DF", padding: "20px 0 200px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>스타일링소다</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
              {[
                { label: "대표",               value: "박민지" },
                { label: "사업자등록번호",     value: "[추후 기재]" },
                { label: "통신판매업 신고번호", value: "[추후 기재]" },
                { label: "주소",               value: "[추후 기재]" },
                { label: "전화",               value: "070-8057-6783 / 010-2897-8524" },
                { label: "이메일",             value: "easy.keep.kr@gmail.com" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", gap: 6 }}>
                  <span style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0, minWidth: 90 }}>{label}</span>
                  <span style={{ fontSize: 11, color: "#6B7280" }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, borderTop: "0.5px solid #D1E8DF", paddingTop: 14 }}>
              <a href="/terms" style={{ fontSize: 11, color: "#6B7280", textDecoration: "underline" }}>이용약관</a>
              <span style={{ fontSize: 11, color: "#D1D5DB" }}>|</span>
              <a href="/privacy" style={{ fontSize: 11, color: "#6B7280", textDecoration: "underline", fontWeight: 700 }}>개인정보처리방침</a>
            </div>
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 10 }}>
              © 2026 스타일링소다. All rights reserved.
            </p>
          </div>

        </div>

        {/* 하단 고정 바 */}
        <div style={{ position: "fixed", bottom: 56, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(240,247,244,0.95)", backdropFilter: "blur(12px)", borderTop: "0.5px solid #D1E8DF", padding: "14px 16px 16px", zIndex: 90, boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, paddingLeft: 4 }}>
            <span style={{ fontSize: 13, color: "#64748B" }}>총 {gridCount} Grid / {chosenPlan.months}개월</span>
            <div style={{ textAlign: "right" }}>
              {chosenPlan.discount > 0 && (
                <p style={{ fontSize: 12, color: "#94A3B8", textDecoration: "line-through" }}>월 {fmt(monthly)}</p>
              )}
              <p style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>
                월 {fmt(discounted)} → <span style={{ color: BLUE }}>총 {fmt(total)}</span>
                <span style={{ fontSize: 11, fontWeight: 400, color: "#94A3B8" }}> (VAT 별도)</span>
              </p>
            </div>
          </div>
          <button type="button" disabled={gridCount === 0} onClick={handleCheckout}
            style={{ width: "100%", padding: "15px 0", borderRadius: 14, border: "none", background: gridCount === 0 ? "#E5E7EB" : `linear-gradient(90deg, ${BLUE}, #3B82F6)`, color: gridCount === 0 ? "#9CA3AF" : "#fff", fontSize: 15, fontWeight: 700, cursor: gridCount === 0 ? "not-allowed" : "pointer", boxShadow: gridCount > 0 ? `0 4px 16px ${BLUE}55` : "none", transition: "all 0.15s" }}>
            {gridCount === 0 ? "공간을 선택해주세요" : "예약 및 결제하기 →"}
          </button>
        </div>

      </div>
    </div>
  );
}