'use client';

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function RefundPage() {
  const router = useRouter();

  return (
    <div style={{ background: "#F9FAFB", minHeight: "100vh", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
      <div style={{ maxWidth: 430, margin: "0 auto", paddingBottom: 60 }}>

        <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", padding: "16px" }}>
          <button onClick={() => router.back()} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", marginRight: 12 }}>
            <ChevronLeft size={24} color="#374151" />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>취소 및 환불 규정</span>
        </div>

        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 24 }}>
          <p style={{ fontSize: 12, color: "#9CA3AF" }}>시행일: 2026년 05월 11일</p>

          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 10 }}>환불 규정</h2>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#F0FDF4", borderRadius: 12, padding: "16px 18px", border: "1px solid #BBF7D0" }}>
                <p style={{ fontWeight: 700, color: "#15803D", marginBottom: 6 }}>✅ 이용 개시일 전 취소</p>
                <p>결제 후 창고 이용 개시일 전까지는 <strong>100% 전액 환불</strong>이 가능합니다.</p>
              </div>
              <div style={{ background: "#FFF7ED", borderRadius: 12, padding: "16px 18px", border: "1px solid #FED7AA" }}>
                <p style={{ fontWeight: 700, color: "#C2410C", marginBottom: 6 }}>⚠️ 이용 개시일 이후 중도 해지</p>
                <p>이용 개시일 이후 중도 해지 시에는 남은 보관 일수를 <strong>일할 계산</strong>하여 환불하되, 총 결제 금액의 <strong>10%를 위약금으로 공제</strong>한 후 환불해 드립니다.</p>
              </div>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 10 }}>환불 신청 방법</h2>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.8 }}>
              <p>아래 연락처로 환불 신청해 주시면 영업일 기준 3일 이내 처리됩니다.</p>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                <p>📞 070-8057-6783 / 010-2897-8524</p>
                <p>📧 easy.keep.kr@gmail.com</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}