'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

const BLUE = "#2563EB";

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
      background: "#F9FAFB",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif",
      padding: "0 24px",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: "#111827", letterSpacing: "-1px" }}>
            Scene<span style={{ color: BLUE }}>Box</span>
          </span>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginTop: 12 }}>
            안녕하세요! 👋
          </p>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 6, lineHeight: 1.6 }}>
            서비스 이용을 위해<br />정보를 입력해주세요.
          </p>
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: "32px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          
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
              borderRadius: 12,
              border: "1.5px solid #E5E7EB",
              fontSize: 16,
              color: "#111827",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 20,
              background: "#fff",
              WebkitTextFillColor: "#111827",
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
              borderRadius: 12,
              border: "1.5px solid #E5E7EB",
              fontSize: 16,
              color: "#111827",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 8,
              background: "#fff",
              WebkitTextFillColor: "#111827",
            }}
          />
          <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 20 }}>
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
              borderRadius: 12,
              border: "none",
              background: isSubmitting ? "#E5E7EB" : BLUE,
              color: isSubmitting ? "#9CA3AF" : "#fff",
              fontSize: 16,
              fontWeight: 700,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {isSubmitting ? "저장 중..." : "시작하기"}
          </button>
        </div>
      </div>
    </div>
  );
}