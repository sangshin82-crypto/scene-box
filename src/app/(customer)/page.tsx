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
    title: "규격화된 전용 Grid, 공간 효율 극대화",
    note: "",
    desc: "박스 적재부터 대형 세트장·비정형 화물까지 모두 수납 가능",
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
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN, display: "inline-block" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#059669", letterSpacing: "0.3px" }}>
              B2B 특수화물 전문 공유창고
            </span>
          </div>
          <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 38, fontWeight: 900, color: "#0A0A0A", letterSpacing: "-0.5px", fontFamily: "'Archivo','Apple SD Gothic Neo',sans-serif" }}>
              SCENE
            </span>
            <span style={{
              width: 26, height: 26,
              border: "3px solid #0A0A0A",
              display: "inline-block",
              borderRadius: 2,
            }} />
            <span style={{ fontSize: 38, fontWeight: 900, color: "#0A0A0A", letterSpacing: "-0.5px", fontFamily: "'Archivo','Apple SD Gothic Neo',sans-serif" }}>
              BOX
            </span>
          </div>
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#334155", letterSpacing: "6px" }}>
              씬박스
            </span>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 600, color: "#94A3B8",
            letterSpacing: "3px", textTransform: "uppercase", marginBottom: 24,
          }}>
            Move &amp; Keep
          </span>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", lineHeight: 1.75, letterSpacing: "-0.2px", margin: 0 }}>
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
          <div style={{ display: "flex", gap: 5, marginTop: 20 }}>
            {[{ w: 22, c: BLUE }, { w: 6, c: "#BFDBFE" }, { w: 6, c: "#D1FAE5" }].map((d, i) => (
              <div key={i} style={{ width: d.w, height: 5, borderRadius: 99, background: d.c }} />
            ))}
          </div>
        </div>

        {/* ── BOTTOM CTA ── */}
        <div style={{ padding: "32px 20px 0", flex: "1 0 auto" }}>
          {/* 카카오 로그인 (메인) */}
          <button
            onClick={handleKakaoLogin}
            style={{
              width: "100%",
              padding: "20px 0",
              borderRadius: 16,
              border: "none",
              background: "#FEE500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              cursor: "pointer",
              boxShadow: "0 6px 24px rgba(254,229,0,0.5)",
              transition: "all 0.2s",
            }}
            onMouseOver={e => (e.currentTarget.style.opacity = "0.9")}
            onMouseOut={e => (e.currentTarget.style.opacity = "1")}
          >
            <MessageCircle size={24} color="#191600" strokeWidth={2} fill="#191600" />
            <span style={{ fontSize: 17, fontWeight: 800, color: "#191600", letterSpacing: "-0.3px" }}>
              카카오로 1초 만에 시작하기
            </span>
          </button>
          <p style={{ textAlign: "center", fontSize: 11, color: "#94A3B8", marginTop: 10 }}>
            복잡한 정보 입력 없이 1초 만에 가입됩니다.
          </p>

          {/* 구분선 */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>또는</span>
            <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
          </div>

          {/* 이메일 로그인 박스 */}
          <div style={{
            background: "transparent",
            borderRadius: 16,
            border: "1px solid #E5E7EB",
            padding: "18px",
          }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", marginBottom: 12 }}>이메일로 로그인</p>
            <input
              id="email"
              type="email"
              placeholder="이메일"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid #E5E7EB",
                fontSize: 14,
                marginBottom: 8,
                boxSizing: "border-box",
                color: "#111827",
                background: "#F9FAFB",
              }}
            />
            <input
              id="password"
              type="password"
              placeholder="비밀번호"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid #E5E7EB",
                fontSize: 14,
                marginBottom: 8,
                boxSizing: "border-box",
                color: "#111827",
                background: "#F9FAFB",
              }}
            />
            <button
              onClick={async () => {
                const email = (document.getElementById("email") as HTMLInputElement).value;
                const password = (document.getElementById("password") as HTMLInputElement).value;
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) alert("로그인 실패: " + error.message);
                else window.location.href = "/dashboard";
              }}
              style={{
                width: "100%",
                padding: "13px 0",
                borderRadius: 12,
                border: "none",
                background: BLUE,
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
                cursor: "pointer",
              }}
            >
              로그인
            </button>
            <p style={{ textAlign: "right", fontSize: 12, color: "#94A3B8", marginTop: 10 }}>
              <a href="/forgot-password" style={{ color: "#6B7280", textDecoration: "none" }}>비밀번호를 잊으셨나요?</a>
            </p>
          </div>

          {/* 회원가입 링크 (1개만) */}
          <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", marginTop: 20 }}>
            카카오 계정이 없으신가요?{" "}
            <a href="/signup" style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none" }}>이메일로 회원가입</a>
          </p>
        </div>

        {/* ── FOOTER INFO ── */}
        <div style={{
          background: "#F0F7F4",
          borderTop: "0.5px solid #D1E8DF",
          padding: "32px 20px 40px",
          marginTop: 28,
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>씬박스(SceneBox)</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
            {[
              { label: "대표", value: "박민지" },
              { label: "사업자등록번호", value: "806-36-01589" },
              { label: "통신판매업 신고번호", value: "2026-용인처인-01107" },
              { label: "주소", value: "경기도 용인시 처인구 모현읍 곡현로 734" },
              { label: "전화", value: "070-8057-6783 / 010-2897-8524" },
              { label: "이메일", value: "easy.keep.kr@gmail.com" },
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
            <a href="/privacy" style={{ fontSize: 11, color: "#6B7280", textDecoration: "underline" }}>개인정보처리방침</a>
            <span style={{ fontSize: 11, color: "#D1D5DB" }}>|</span>
            <a href="/refund" style={{ fontSize: 11, color: "#6B7280", textDecoration: "underline", fontWeight: 700 }}>취소 및 환불 규정</a>
          </div>
          <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 10 }}>
            © 2026 씬박스(SceneBox). All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
}