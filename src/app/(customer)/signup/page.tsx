"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { ChevronLeft } from "lucide-react";

const BLUE = "#2563EB";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agree, setAgree] = useState(false);

  const update = (key: string, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSignup = async () => {
    // 유효성 검사
    if (!form.name.trim()) return alert("이름을 입력해주세요.");
    if (!form.email.trim()) return alert("이메일을 입력해주세요.");
    if (form.password.length < 6) return alert("비밀번호는 6자 이상이어야 합니다.");
    if (form.password !== form.passwordConfirm) return alert("비밀번호가 일치하지 않습니다.");
    if (!form.phone.trim()) return alert("전화번호를 입력해주세요.");
    if (!agree) return alert("이용약관에 동의해주세요.");

    setIsSubmitting(true);
    try {
      // 1) Supabase Auth 회원가입
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { name: form.name, phone: form.phone },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          alert("이미 가입된 이메일입니다. 로그인해주세요.");
        } else {
          alert("회원가입 실패: " + error.message);
        }
        setIsSubmitting(false);
        return;
      }

      // 2) clients 테이블에 고객 정보 저장
      if (data.user) {
        const { error: clientError } = await supabase.from("clients").insert({
          id: data.user.id,
          name: form.name,
          contact_name: form.name,
          contact_phone: form.phone,
          contact_email: form.email,
          is_active: true,
        });
        if (clientError) console.error("clients 저장 실패:", clientError.message);
      }

      alert(
        "회원가입 신청이 완료되었습니다! 📧\n\n" +
        form.email + " 로 인증 메일을 보냈습니다.\n" +
        "메일의 인증 링크를 클릭하신 후 로그인해주세요.\n\n" +
        "(메일이 안 보이면 스팸함을 확인해주세요)"
      );
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
          <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <ChevronLeft size={24} color="#374151" strokeWidth={1.8} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginLeft: 8 }}>회원가입</span>
        </div>

        {/* 폼 */}
        <div style={{ padding: "32px 24px", flex: 1 }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.5px", marginBottom: 8 }}>
              씬박스 시작하기
            </h1>
            <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.6 }}>
              가입 후 이메일 인증을 거쳐 이용하실 수 있습니다.
            </p>
          </div>

          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>이름</label>
          <input type="text" placeholder="이름 (또는 담당자명)" value={form.name}
            onChange={(e) => update("name", e.target.value)} style={inputStyle} />

          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>이메일</label>
          <input type="email" placeholder="이메일 주소" value={form.email}
            onChange={(e) => update("email", e.target.value)} style={inputStyle} />

          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>비밀번호</label>
          <input type="password" placeholder="비밀번호 (6자 이상)" value={form.password}
            onChange={(e) => update("password", e.target.value)} style={inputStyle} />

          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>비밀번호 확인</label>
          <input type="password" placeholder="비밀번호 다시 입력" value={form.passwordConfirm}
            onChange={(e) => update("passwordConfirm", e.target.value)} style={inputStyle} />

          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>전화번호</label>
          <input type="tel" placeholder="010-1234-5678" value={form.phone}
            onChange={(e) => update("phone", e.target.value)} style={inputStyle} />

          {/* 약관 동의 */}
          <button onClick={() => setAgree((p) => !p)}
            style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: "8px 0", marginTop: 4, marginBottom: 20 }}>
            <div style={{
              width: 20, height: 20, borderRadius: 6,
              border: `2px solid ${agree ? BLUE : "#D1D5DB"}`,
              background: agree ? BLUE : "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {agree && <span style={{ color: "#fff", fontSize: 12, fontWeight: 900 }}>✓</span>}
            </div>
            <span style={{ fontSize: 13, color: "#374151" }}>
              <a href="/terms" target="_blank" style={{ color: BLUE, textDecoration: "underline" }}>이용약관</a> 및{" "}
              <a href="/privacy" target="_blank" style={{ color: BLUE, textDecoration: "underline" }}>개인정보처리방침</a>에 동의합니다.
            </span>
          </button>

          <button onClick={handleSignup} disabled={isSubmitting}
            style={{
              width: "100%", padding: "15px 0", borderRadius: 14, border: "none",
              background: isSubmitting ? "#93C5FD" : BLUE, color: "#fff",
              fontSize: 15, fontWeight: 700, cursor: isSubmitting ? "not-allowed" : "pointer",
              boxShadow: "0 4px 16px rgba(37,99,235,0.3)", transition: "all 0.2s",
            }}>
            {isSubmitting ? "가입 처리 중..." : "가입하고 시작하기"}
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: "#94A3B8", marginTop: 16 }}>
            이미 계정이 있으신가요?{" "}
            <a href="/" style={{ color: BLUE, fontWeight: 600, textDecoration: "none" }}>로그인</a>
          </p>
        </div>
      </div>
    </div>
  );
}