"use client";

import { MessageCircle, Home, Truck, Sparkles } from "lucide-react";
import { supabase } from "@/app/lib/supabase";

const BLUE = "#2563EB";
const GREEN = "#10B981";

export default function PersonalLandingPage() {
  // 카카오 로그인 — type=personal 달고 callback으로
  const handleKakaoLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `https://scene-box-flame.vercel.app/auth/callback?type=personal`,
        scopes: "profile_nickname profile_image",
        queryParams: { scope: "profile_nickname profile_image" },
      },
    });
  };

  // 이메일 로그인 — 성공 후 전화번호 유무로 분기
  const handleEmailLogin = async () => {
    const email = (document.getElementById("personal-email") as HTMLInputElement).value;
    const password = (document.getElementById("personal-password") as HTMLInputElement).value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert("로그인 실패: " + error.message);
      return;
    }

    // 전화번호 있으면 대시보드, 없으면 개인 온보딩
    const userId = data.user?.id;
    if (userId) {
      const { data: clientData } = await supabase
        .from("clients")
        .select("contact_phone")
        .eq("id", userId)
        .single();

      if (!clientData?.contact_phone) {
        window.location.href = "/personal/onboarding";
        return;
      }
    }
    window.location.href = "/dashboard";
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
          padding: "36px 24px 28px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
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
              우리 집 전용 개인 창고
            </span>
          </div>

          <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 38, fontWeight: 900, color: "#0A0A0A", letterSpacing: "-0.5px", fontFamily: "'Archivo','Apple SD Gothic Neo',sans-serif" }}>
              SCENE
            </span>
            <span style={{ width: 26, height: 26, border: "3px solid #0A0A0A", display: "inline-block", borderRadius: 2 }} />
            <span style={{ fontSize: 38, fontWeight: 900, color: "#0A0A0A", letterSpacing: "-0.5px", fontFamily: "'Archivo','Apple SD Gothic Neo',sans-serif" }}>
              BOX
            </span>
          </div>

          <p style={{ fontSize: 18, fontWeight: 700, color: "#334155", lineHeight: 1.7, margin: "20px 0 0" }}>
            안 쓰는 짐은 맡기고,<br />우리 집 공간을 넓게 쓰세요.
          </p>
        </div>

        {/* ── 혜택 3가지 ── */}
        <div style={{ padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { icon: Home, color: BLUE, bg: "#EFF6FF", title: "월 5만원, 우리 집 추가 창고", desc: "파레트 1칸 (박스 30개 분량) 공간을 내 창고처럼" },
            { icon: Truck, color: GREEN, bg: "#ECFDF5", title: "문 앞에서 수거·배송", desc: "직접 안 옮기셔도 돼요. 매주 월·목 방문" },
            { icon: Sparkles, color: "#7C3AED", bg: "#F5F3FF", title: "기업 화물 전문 시설에서 안전 관리", desc: "전문 보관시설 씬박스가 직접 관리합니다" },
          ].map(({ icon: Icon, color, bg, title, desc }, i) => (
            <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "#fff", borderRadius: 16, padding: "16px 18px", border: "0.5px solid #D1E8DF" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={20} color={color} strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 3 }}>{title}</p>
                <p style={{ fontSize: 12.5, color: "#64748B", lineHeight: 1.6 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── CTA: 카카오 ── */}
        <div style={{ padding: "28px 20px 0" }}>
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
            }}
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

          {/* 이메일 로그인 */}
          <div style={{
            background: "transparent",
            borderRadius: 16,
            border: "1px solid #E5E7EB",
            padding: "18px",
          }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", marginBottom: 12 }}>이메일로 로그인</p>
            <input
              id="personal-email"
              type="email"
              placeholder="이메일"
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 12,
                border: "1px solid #E5E7EB", fontSize: 14, marginBottom: 8,
                boxSizing: "border-box", color: "#111827", background: "#F9FAFB",
              }}
            />
            <input
              id="personal-password"
              type="password"
              placeholder="비밀번호"
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 12,
                border: "1px solid #E5E7EB", fontSize: 14, marginBottom: 8,
                boxSizing: "border-box", color: "#111827", background: "#F9FAFB",
              }}
            />
            <button
              onClick={handleEmailLogin}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
                background: BLUE, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer",
              }}
            >
              로그인
            </button>
            <p style={{ textAlign: "right", fontSize: 12, color: "#94A3B8", marginTop: 10 }}>
              <a href="/forgot-password" style={{ color: "#6B7280", textDecoration: "none" }}>비밀번호를 잊으셨나요?</a>
            </p>
          </div>

          {/* 회원가입 링크 */}
          <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", marginTop: 20 }}>
            처음이신가요?{" "}
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
          </div>
          <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 10 }}>
            © 2026 씬박스(SceneBox). All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
}