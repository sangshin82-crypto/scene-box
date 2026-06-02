"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase";

const BLUE = "#2563EB";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  // 메일 링크로 들어오면 Supabase가 세션을 자동 설정함
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    // 이미 세션이 있는 경우도 체크
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleUpdate = async () => {
    if (password.length < 6) return alert("비밀번호는 6자 이상이어야 합니다.");
    if (password !== passwordConfirm) return alert("비밀번호가 일치하지 않습니다.");

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        alert("오류가 발생했습니다: " + error.message);
        setIsSubmitting(false);
        return;
      }
      alert("비밀번호가 변경되었습니다! 새 비밀번호로 로그인해주세요.");
      window.location.href = "/";
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
    marginBottom: 12,
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
          <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>새 비밀번호 설정</span>
        </div>

        {/* 폼 */}
        <div style={{ padding: "32px 24px", flex: 1 }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.5px", marginBottom: 8 }}>
              새 비밀번호를 입력해주세요
            </h1>
            <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.6 }}>
              안전한 새 비밀번호를 설정해주세요.
            </p>
          </div>

          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>새 비밀번호</label>
          <input type="password" placeholder="새 비밀번호 (6자 이상)" value={password}
            onChange={(e) => setPassword(e.target.value)} style={inputStyle} />

          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>새 비밀번호 확인</label>
          <input type="password" placeholder="새 비밀번호 다시 입력" value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)} style={{ ...inputStyle, marginBottom: 20 }} />

          <button onClick={handleUpdate} disabled={isSubmitting || !ready}
            style={{
              width: "100%", padding: "15px 0", borderRadius: 14, border: "none",
              background: (isSubmitting || !ready) ? "#93C5FD" : BLUE, color: "#fff",
              fontSize: 15, fontWeight: 700, cursor: (isSubmitting || !ready) ? "not-allowed" : "pointer",
              boxShadow: "0 4px 16px rgba(37,99,235,0.3)", transition: "all 0.2s",
            }}>
            {isSubmitting ? "변경 중..." : !ready ? "링크 확인 중..." : "비밀번호 변경하기"}
          </button>

          {!ready && (
            <p style={{ textAlign: "center", fontSize: 12, color: "#94A3B8", marginTop: 12 }}>
              메일의 재설정 링크를 통해 접속해주세요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}