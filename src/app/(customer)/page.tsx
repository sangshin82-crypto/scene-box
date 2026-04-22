"use client";

import { useRouter } from "next/navigation";
import { Ruler, Truck, Scale, MessageCircle } from "lucide-react";
import { supabase } from "@/app/lib/supabase";

const BLUE = "#2563EB";

const benefits = [
  {
    icon: Ruler,
    color: BLUE,
    bg: "#EFF6FF",
    title: "규격화된 전용 Grid, 단일 품목 기준 최대 높이 10m",
    note: "*박스 적재는 높이 3m 기준",
    desc: "불규칙한 대형 소품과 세트장도 수직 공간을 100% 활용",
  },
  {
    icon: Truck,
    color: "#10B981",
    bg: "#ECFDF5",
    title: "전용 차량으로 원스톱 배차",
    note: "",
    desc: "입고부터 납품까지, 전화 한 통으로 해결",
  },
  {
    icon: Scale,
    color: "#7C3AED",
    bg: "#F5F3FF",
    title: "저울로 재는 투명한 폐기 정산",
    note: "",
    desc: "kg당 정량 계근, 눈 먼 폐기 비용은 없습니다",
  },
];

export default function LandingPage() {
  const router = useRouter();

  const handleKakaoLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `https://scene-box-flame.vercel.app/auth/callback`,
        scopes: "profile_nickname profile_image",
        queryParams: {
          scope: "profile_nickname profile_image",
        },
      },
    });
  };

  return (
    <div
      style={{
        background: "#F9FAFB",
        minHeight: "100vh",
        fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          paddingBottom: 152,
        }}
      >
        {/* ── HERO ── */}
        <div
          style={{
            flex: "0 0 auto",
            background: `linear-gradient(160deg, #EFF6FF 0%, #F9FAFB 55%)`,
            padding: "44px 24px 28px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#fff",
              border: `1.5px solid #BFDBFE`,
              borderRadius: 99,
              padding: "5px 14px",
              marginBottom: 18,
              boxShadow: "0 2px 8px rgba(37,99,235,0.1)",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: BLUE }}>B2B 특수화물 전문 공유창고</span>
          </div>

          {/* Logo */}
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 42, fontWeight: 900, color: "#111827", letterSpacing: "-1.5px", lineHeight: 1 }}>
              Scene<span style={{ color: BLUE }}>Box</span>
            </span>
          </div>

          {/* 국문 로고 */}
          <div style={{ marginBottom: 6 }}>
            <span style={{
              fontSize: 42,
              fontWeight: 900,
              color: "#111827",
              letterSpacing: "6px",
              fontFamily: "'Apple SD Gothic Neo','Pretendard',sans-serif",
            }}>
              씬박스
            </span>
          </div>

          <span style={{ fontSize: 14, fontWeight: 600, color: "#9CA3AF", letterSpacing: "3px", textTransform: "uppercase", marginBottom: 18 }}>
            Move &amp; Keep
          </span>

          {/* Copy */}
          <h1 style={{ fontSize: 18, fontWeight: 800, color: "#111827", lineHeight: 1.6, letterSpacing: "-0.3px", margin: 0 }}>
            촬영/프로모션/공연 미술팀의 영원한 숙제,<br />
            <span style={{ color: BLUE }}>비정형화된 소품/세트 보관부터 폐기까지</span><br />
            한 번에 해결하세요.
          </h1>

          {/* Dots */}
          <div style={{ display: "flex", gap: 6, marginTop: 18 }}>
            {[BLUE, "#BFDBFE", "#DBEAFE"].map((c, i) => (
              <div key={i} style={{ width: i === 0 ? 20 : 6, height: 6, borderRadius: 99, background: c, transition: "all 0.3s" }} />
            ))}
          </div>
        </div>

        {/* ── KEY BENEFITS ── */}
        <div style={{ padding: "22px 16px 0", flex: "1 0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", textAlign: "center", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 16 }}>
            Why Scene Box?
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {benefits.map(({ icon: Icon, color, bg, title, note, desc }) => (
              <div
                key={title}
                style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", padding: "16px 18px", display: "flex", alignItems: "center", gap: 16 }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={22} color={color} strokeWidth={1.8} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 3 }}>{title}</p>
                  {note && (
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 3 }}>{note}</p>
                  )}
                  <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM CTA — 네비 바로 위에 고정 ── */}
      <div
        style={{
          position: "fixed",
          bottom: 56,
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(100%, 430px)",
          zIndex: 100,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderTop: "1px solid #E5E7EB",
            padding: "10px 16px 12px",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.08)",
          }}
        >
          <button
            style={{
              width: "100%",
              padding: "13px 0",
              borderRadius: 14,
              border: "none",
              background: "#FEE500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(254,229,0,0.5)",
              transition: "opacity 0.15s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            onClick={handleKakaoLogin}
          >
            <MessageCircle size={21} color="#191600" strokeWidth={2} fill="#191600" />
            <span style={{ fontSize: 16, fontWeight: 800, color: "#191600", letterSpacing: "-0.3px" }}>
              카카오로 1초 만에 시작하기
            </span>
          </button>
          <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 6 }}>
            복잡한 정보 입력 없이 1초 만에 가입됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}