"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { ChevronLeft } from "lucide-react";

const BLUE = "#2563EB";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) return alert("이메일을 입력해주세요.");

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        alert("오류가 발생했습니다: " + error.message);
        setIsSubmitting(false);
        return;
      }
      setSent(true);
    } catch (err: any) {
      alert("처리 중 오류가 발생했습니다: " + err.message);
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "13px 16px",
    borderRadius: 12,
    border: "1px solid #E5E7EB",
    fontSize: 14,
    marginBottom: 16,
    boxSizing: "border-box" as const,
    color: "#111827",
    background: "#fff",
    outline: "none",
  };

  return (
    <div style={{
      background: "#F0F7F4",
      minHeight: "100vh",
      fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif",
      display: "flex",
      justifyContent: "center",
    }}>
      <div style={{ width: "100%", maxWidth: 430, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* 헤더 */}
        <div style={{ background: "#fff", borderBottom: "0.5px solid #D1E8DF" }}
          className="flex items-center px-4 py-4">
          <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <ChevronLeft size={24} color="#374151" strokeWidth={1.8} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginLeft: 8 }}>비밀번호 찾기</span>
        </div>

        {/* 폼 */}
        <div style={{ padding: "32px 24px", flex: 1 }}>
          {!sent ? (
            <>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.5px", marginBottom: 8 }}>
                  비밀번호를 잊으셨나요?
                </h1>
                <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.6 }}>
                  가입하신 이메일을 입력하시면<br />
                  비밀번호 재설정 링크를 보내드립니다.
                </p>
              </div>

              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>이메일</label>
              <input type="email" placeholder="가입하신 이메일 주소" value={email}
                onChange={(e) => setEmail(e.target.value)} style={inputStyle} />

              <button onClick={handleReset} disabled={isSubmitting}
                style={{
                  width: "100%", padding: "15px 0", borderRadius: 14, border: "none",
                  background: isSubmitting ? "#93C5FD" : BLUE, color: "#fff",
                  fontSize: 15, fontWeight: 700, cursor: isSubmitting ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 16px rgba(37,99,235,0.3)", transition: "all 0.2s",
                }}>
                {isSubmitting ? "발송 중..." : "재설정 링크 받기"}
              </button>

              <p style={{ textAlign: "center", fontSize: 13, color: "#94A3B8", marginTop: 16 }}>
                <a href="/" style={{ color: BLUE, fontWeight: 600, textDecoration: "none" }}>로그인으로 돌아가기</a>
              </p>
            </>
          ) : (
            <div style={{ textAlign: "center", paddingTop: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 12 }}>
                메일을 확인해주세요
              </h1>
              <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, marginBottom: 28 }}>
                <strong style={{ color: "#0F172A" }}>{email}</strong> 으로<br />
                비밀번호 재설정 링크를 보냈습니다.<br />
                메일의 링크를 눌러 새 비밀번호를 설정해주세요.<br /><br />
                <span style={{ fontSize: 13, color: "#94A3B8" }}>(메일이 안 보이면 스팸함을 확인해주세요)</span>
              </p>
              <a href="/" style={{
                display: "inline-block", padding: "13px 32px", borderRadius: 12,
                background: BLUE, color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none",
              }}>
                로그인으로 돌아가기
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}