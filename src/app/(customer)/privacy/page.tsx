'use client';

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div style={{ background: "#F9FAFB", minHeight: "100vh", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
      <div style={{ maxWidth: 430, margin: "0 auto", paddingBottom: 60 }}>

        <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", padding: "16px" }}>
          <button onClick={() => router.back()} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", marginRight: 12 }}>
            <ChevronLeft size={24} color="#374151" />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>개인정보처리방침</span>
        </div>

        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 24 }}>

          <p style={{ fontSize: 12, color: "#9CA3AF" }}>시행일: 2026년 [추후 기재]일</p>

          <Section title="1. 개인정보의 수집 및 이용 목적">
            <p style={{ marginBottom: 10 }}>씬박스(이하 "회사")는 서비스 제공을 위해 아래와 같은 목적으로 개인정보를 수집하고 이용합니다.</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>보관 서비스 예약, 화물 입/출고 관리, 고객 상담 및 클레임 대응</li>
              <li>서비스 이용 요금 결제, 청구서 및 세금계산서 발급</li>
              <li>서비스 변경 사항, 긴급 공지 등 안내 메시지(카카오톡, 텔레그램, 이메일 등) 발송</li>
            </ul>
          </Section>

          <Section title="2. 수집하는 개인정보 항목">
            <p style={{ marginBottom: 10 }}>회사는 홈페이지 예약 및 결제 과정에서 아래의 최소한의 정보를 수집합니다.</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li><strong>필수 항목:</strong> 회사명(또는 의뢰인명), 담당자 성명, 휴대전화 번호, 이메일 주소</li>
              <li><strong>결제 시 수집 항목:</strong> 토스페이먼츠 등 PG사 페이지에서 수집되는 카드 정보 등은 회사가 직접 저장하지 않습니다.</li>
            </ul>
          </Section>

          <Section title="3. 개인정보의 보유 및 이용 기간">
            <p style={{ marginBottom: 10 }}>원칙적으로 개인정보의 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계 법령에 의해 보존할 필요가 있는 경우 아래와 같이 일정 기간 보관합니다.</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>계약 또는 청약철회 등에 관한 기록: <strong>5년</strong> (전자상거래 등에서의 소비자보호에 관한 법률)</li>
              <li>대금 결제 및 재화 등의 공급에 관한 기록: <strong>5년</strong> (전자상거래 등에서의 소비자보호에 관한 법률)</li>
              <li>소비자의 불만 또는 분쟁 처리에 관한 기록: <strong>3년</strong> (전자상거래 등에서의 소비자보호에 관한 법률)</li>
            </ul>
          </Section>

          <Section title="4. 개인정보의 파기 절차 및 방법">
            종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기하며, 전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.
          </Section>

          <Section title="5. 개인정보 보호 책임자">
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li><strong>성명:</strong> 박민지</li>
              <li><strong>소속/직위:</strong> 씬박스 대표</li>
              <li><strong>연락처:</strong> 070-8057-6783 / 010-2897-8524</li>
              <li><strong>이메일:</strong> easy.keep.kr@gmail.com</li>
            </ul>
          </Section>

        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 10 }}>{title}</h2>
      <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.8 }}>
        {children}
      </div>
    </div>
  );
}