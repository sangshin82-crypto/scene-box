'use client';

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function PersonalRefundPage() {
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
          <p style={{ fontSize: 12, color: "#9CA3AF" }}>시행일: 2026년 06월 26일</p>

          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 10 }}>보관 예약 취소 및 환불</h2>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#F0FDF4", borderRadius: 12, padding: "16px 18px", border: "1px solid #BBF7D0" }}>
                <p style={{ fontWeight: 700, color: "#15803D", marginBottom: 6 }}>✅ 보관 시작 전 취소</p>
                <p>결제 후 박스 수거(보관 개시) 전까지는 <strong>100% 전액 환불</strong>이 가능합니다. 빈 박스를 이미 수령하신 경우 박스 반납 후 환불됩니다.</p>
              </div>
              <div style={{ background: "#FEF2F2", borderRadius: 12, padding: "16px 18px", border: "1px solid #FECACA" }}>
                <p style={{ fontWeight: 700, color: "#B91C1C", marginBottom: 6 }}>⚠️ 보관 중 정기 반출(계약 종료)</p>
                <p>보관 개시 후 <strong>정기 반출(무료)로 전체 짐을 반환받고 보관을 종료</strong>하는 경우, 이미 결제된 해당 월의 이용 요금은 <strong>잔여 기간이 남아 있어도 환불되지 않습니다.</strong> 월 단위로 이용 요금이 부과되기 때문입니다.</p>
              </div>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 10 }}>반출 요금 안내</h2>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.8 }}>
              <p style={{ marginBottom: 8 }}>반출 방식에 따라 요금이 다르며, 결제 완료 후 처리됩니다.</p>
              <ul style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
                <li><strong>정기 반출:</strong> 무료 (보관 종료, 정기 방문일 반환)</li>
                <li><strong>택배 반출:</strong> 5,000원 (특정 물건 택배 발송)</li>
                <li><strong>긴급 반출:</strong> 10,000원 (희망일 직접 배송)</li>
              </ul>
              <p style={{ marginTop: 10, fontSize: 12, color: "#6B7280" }}>※ 택배·긴급 반출은 결제 후 처리가 시작되며, 처리 착수 후에는 환불이 제한될 수 있습니다.</p>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 10 }}>회사 사유로 인한 환불</h2>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.8 }}>
              <p>회사의 사정으로 서비스를 제공할 수 없게 된 경우, 잔여 이용 기간에 대해 일할 계산하여 전액 환불해 드립니다.</p>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 10 }}>환불 신청 방법</h2>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.8 }}>
              <p>아래 연락처 또는 카카오톡으로 신청해 주시면 영업일 기준 3일 이내 처리됩니다.</p>
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