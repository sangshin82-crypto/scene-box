"use client";

import { useRouter } from "next/navigation";
import { Ruler, Truck, Scale, MessageCircle } from "lucide-react";
import { supabase } from "@/app/lib/supabase";

const BLUE = "#2563EB";
const GREEN = "#10B981";

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
    color: GREEN,
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
  const handleKakaoLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `https://scene-box-flame.vercel.app/auth/callback`,
        scopes: "profile_nickname profile_image",
        queryParams: { scope: "profile_nickname profile_image" },
      },
    });
  };

  return (
    <div style={{
      background: "#F0F7F4",
      minHeight: "100vh",
      fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif",
      display: "flex",
      justifyContent: "center",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 430,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        paddingBottom: 152,
      }}>

        {/* ── HERO ── */}
        <div style={{
          flex: "0 0 auto",
          background: "linear-gradient(165deg, #E8F5F0 0%, #F0F7F4 40%, #EEF4FF 100%)",
          padding: "52px 24px 36px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>

          {/* Badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: 99,
            padding: "6px 16px",
            marginBottom: 24,
            boxShadow: "0 2px 12px rgba(16,185,129,0.12)",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: GREEN, display: "inline-block",
            }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#059669", letterSpacing: "0.3px" }}>
              B2B 특수화물 전문 공유창고
            </span>
          </div>

          {/* 로고 영문 */}
          <div style={{ marginBottom: 6 }}>
            <span style={{
              fontSize: 44, fontWeight: 900, color: "#0F172A",
              letterSpacing: "-2px", lineHeight: 1,
            }}>
              Scene<span style={{ color: BLUE }}>Box</span>
            </span>
          </div>

          {/* 로고 국문 */}
          <div style={{ marginBottom: 10 }}>
            <span style={{
              fontSize: 28, fontWeight: 700, color: "#334155",
              letterSpacing: "8px",
            }}>
              씬박스
            </span>
          </div>

          <span style={{
            fontSize: 11, fontWeight: 600, color: "#94A3B8",
            letterSpacing: "3px", textTransform: "uppercase", marginBottom: 24,
          }}>
            Move &amp; Keep
          </span>

          {/* Copy */}
          <h1 style={{
            fontSize: 16, fontWeight: 700, color: "#1E293B",
            lineHeight: 1.75, letterSpacing: "-0.2px", margin: 0,
          }}>
            촬영/프로모션/공연 미술팀의 영원한 숙제,<br />
            <span style={{
              background: "linear-gradient(135deg, #2563EB, #0EA5E9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              비정형화된 소품/세트 보관부터 폐기까지
            </span><br />
            한 번에 해결하세요.
          </h1>

          {/* Dots */}
          <div style={{ display: "flex", gap: 5, marginTop: 20 }}>
            {[{ w: 22, c: BLUE }, { w: 6, c: "#BFDBFE" }, { w: 6, c: "#D1FAE5" }].map((d, i) => (
              <div key={i} style={{ width: d.w, height: 5, borderRadius: 99, background: d.c }} />
            ))}
          </div>
        </div>

        {/* ── BENEFITS ── */}
        <div style={{ padding: "28px 16px 0", flex: "1 0 auto" }}>
          <p style={{
            fontSize: 11, fontWeight: 600, color: "#94A3B8",
            textAlign: "center", letterSpacing: "2px",
            textTransform: "uppercase", marginBottom: 16,
          }}>
            Why Scene Box?
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {benefits.map(({ icon: Icon, color, bg, title, note, desc }) => (
              <div key={title} style={{
                background: "#fff",
                borderRadius: 20,
                boxShadow: "0 1px 12px rgba(0,0,0,0.05)",
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}>
                {/* 아이콘 + 제목 */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 14,
                    background: bg, display: "flex",
                    alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Icon size={21} color={color} strokeWidth={1.6} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", lineHeight: 1.4 }}>
                    {title}
                  </p>
                </div>
                {/* 노트 + 설명 */}
                <div style={{ paddingLeft: 58 }}>
                  {note && (
                    <p style={{ fontSize: 10, color: "#94A3B8", marginBottom: 3 }}>{note}</p>
                  )}
                  <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM CTA ── */}
      <div style={{
        position: "fixed",
        bottom: 56,
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(100%, 430px)",
        zIndex: 100,
      }}>
        <div style={{
          background: "rgba(240,247,244,0.95)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(16,185,129,0.12)",
          padding: "14px 20px 20px",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.06)",
        }}>
          <button
            onClick={handleKakaoLogin}
            style={{
              width: "100%",
              padding: "15px 0",
              borderRadius: 16,
              border: "none",
              background: "#FEE500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(254,229,0,0.4)",
              transition: "all 0.2s",
            }}
            onMouseOver={e => (e.currentTarget.style.opacity = "0.9")}
            onMouseOut={e => (e.currentTarget.style.opacity = "1")}
          >
            <MessageCircle size={20} color="#191600" strokeWidth={2} fill="#191600" />
            <span style={{ fontSize: 15, fontWeight: 800, color: "#191600", letterSpacing: "-0.3px" }}>
              카카오로 1초 만에 시작하기
            </span>
          </button>
          <p style={{ textAlign: "center", fontSize: 11, color: "#94A3B8", marginTop: 8 }}>
            복잡한 정보 입력 없이 1초 만에 가입됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}