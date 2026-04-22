'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

const BLUE = "#2563EB";
const GREEN = "#10B981";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) { setError("이름을 입력해주세요."); return; }
    if (!phone.trim()) { setError("휴대폰 번호를 입력해주세요."); return; }
    setIsSubmitting(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/"); return; }

    const { error: upsertError } = await supabase
      .from("clients")
      .upsert({
        id: user.id,
        name: name.trim(),
        contact_phone: phone,
      }, { onConflict: "id" });

    if (upsertError) {
      setError("저장 중 오류가 발생했습니다. 다시 시도해주세요.");
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(165deg, #E8F5F0 0%, #F0F7F4 40%, #EEF4FF 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif",
      padding: "0 24px",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* 로고 */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: 99,
            padding: "6px 16px",
            marginBottom: 20,
            boxShadow: "0 2px 12px rgba(16,185,129,0.12)",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN, display: "inline-block" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#059669" }}>B2B 특수화물 전문 공유창고</span>
          </div>
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: "#0F172A", letterSpacing: "-1.5px" }}>
              Scene<span style={{ color: BLUE }}>Box</span>
            </span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", marginTop: 16 }}>
            안녕하세요! 👋
          </p>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 6, lineHeight: 1.7 }}>
            서비스 이용을 위해<br />정보를 입력해주세요.
          </p>
        </div>

        {/* 폼 카드 */}
        <div style={{
          background: "#fff",
          borderRadius: 24,
          padding: "32px 24px",
          boxShadow: "0 2px 24px rgba(0,0,0,0.07)",
          border: "0.5px solid #D1E8DF",
        }}>

          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
            이름
          </label>
          <input
            type="text"
            placeholder="이름을 입력해주세요"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 14,
              border: "1.5px solid #D1E8DF",
              fontSize: 15,
              color: "#0F172A",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 20,
              background: "#fff",
              WebkitTextFillColor: "#0F172A",
              transition: "border-color 0.15s",
            }}
          />

          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
            휴대폰 번호
          </label>
          <input
            type="tel"
            placeholder="휴대폰 번호를 입력해주세요"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 14,
              border: "1.5px solid #D1E8DF",
              fontSize: 15,
              color: "#0F172A",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 8,
              background: "#fff",
              WebkitTextFillColor: "#0F172A",
              transition: "border-color 0.15s",
            }}
          />
          <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 24, lineHeight: 1.5 }}>
            관리자 상담 및 서비스 안내에 활용됩니다.
          </p>

          {error && (
            <p style={{ fontSize: 13, color: "#EF4444", marginBottom: 16, textAlign: "center" }}>{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              width: "100%",
              padding: "15px 0",
              borderRadius: 14,
              border: "none",
              background: isSubmitting ? "#E5E7EB" : `linear-gradient(90deg, ${BLUE}, #3B82F6)`,
              color: isSubmitting ? "#9CA3AF" : "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: isSubmitting ? "none" : `0 4px 16px ${BLUE}44`,
            }}
          >
            {isSubmitting ? "저장 중..." : "시작하기"}
          </button>
        </div>

      </div>
    </div>
  );
}