'use client';

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function PersonalTermsPage() {
  const router = useRouter();

  return (
    <div style={{ background: "#F9FAFB", minHeight: "100vh", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
      <div style={{ maxWidth: 430, margin: "0 auto", paddingBottom: 60 }}>

        <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", padding: "16px" }}>
          <button onClick={() => router.push('/personal')} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", marginRight: 12 }}>
            <ChevronLeft size={24} color="#374151" />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>개인 보관 서비스 이용약관</span>
        </div>

        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 24 }}>

          <p style={{ fontSize: 12, color: "#9CA3AF" }}>시행일: 2026년 06월 26일</p>

          <Section title="제1조 (목적 및 서비스의 성격)">
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>본 약관은 '씬박스(이하 "회사")'가 제공하는 개인 고객 대상 이사박스 보관 서비스(이하 "서비스")의 이용 조건, 절차, 책임 및 면책 사항 등 회사와 이용자(이하 "고객") 간의 권리 및 의무를 규정함을 목적으로 합니다.</li>
              <li>회사가 제공하는 서비스는 고객에게 규격 박스를 제공하고, 박스에 담긴 물품을 회사 시설에 보관하며, 수거 및 배송을 대행하는 <strong>박스 단위 보관 서비스</strong>입니다.</li>
            </ol>
          </Section>

          <Section title="제2조 (이용 요금 및 결제)">
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>보관 요금은 <strong>박스 1개당 월 10,000원</strong>이며, 최소 3개부터 신청할 수 있습니다.</li>
              <li>요금 결제는 회사가 안내하는 결제 수단(페이앱 등)을 통해 진행되며, 결제 완료 시점부터 보관이 개시됩니다.</li>
              <li>이용 요금은 월 단위 선결제를 원칙으로 합니다.</li>
            </ol>
          </Section>

          <Section title="제3조 (수거 및 배송)">
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>회사는 신규 보관 신청 시 빈 박스를 고객이 지정한 주소로 배송하며, 고객이 물품을 담아두면 정해진 일정에 회수하여 보관합니다.</li>
              <li>수거 및 배송은 회사가 지정한 <strong>정기 방문일(매주 월·목)</strong>에 이루어지며, 구체적 일정은 회사가 배정하여 별도 안내합니다.</li>
              <li>고객은 방문 예정일에 수거·배송이 원활히 이루어지도록 협조해야 하며, 고객 부재 등으로 방문이 무산될 경우 일정이 지연될 수 있습니다.</li>
            </ol>
          </Section>

          <Section title="제4조 (반출)">
            <p style={{ marginBottom: 10 }}>보관 중인 물품의 반출은 다음 세 가지 방식 중 선택할 수 있습니다.</p>
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li><strong>정기 반출(무료):</strong> 보관을 종료하고 전체 물품을 반환받는 방식입니다. 정기 방문일에 반환되며, <strong>보관 계약이 종료되고 잔여 이용 기간은 환불되지 않습니다.</strong></li>
              <li><strong>택배 반출(5,000원):</strong> 보관을 유지한 채 특정 물품만 택배로 받는 방식입니다.</li>
              <li><strong>긴급 반출(10,000원):</strong> 보관을 유지한 채 고객이 희망하는 날짜에 빠르게 직접 배송받는 방식입니다.</li>
            </ol>
          </Section>

          <Section title="제5조 (보관 불가 품목)">
            <p style={{ marginBottom: 10 }}>다음 각 호의 물품은 보관할 수 없으며, 고객이 이를 은폐하고 입고하여 발생한 모든 피해는 해당 고객이 변상해야 합니다.</p>
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>현금, 유가증권, 귀금속, 골동품 등 고가의 물품</li>
              <li>부패, 변질 우려가 있는 음식물 및 동·식물</li>
              <li>폭발물, 인화성 물질, 유독성 물질 등 위험물</li>
              <li>불법 소지품 및 법령상 보관·이동이 금지된 물품</li>
              <li>기타 회사가 보관이 부적합하다고 판단하는 물품</li>
            </ol>
          </Section>

          <Section title="제6조 (면책 조항)">
            <p style={{ marginBottom: 10 }}>회사는 다음 각 호의 사유로 발생한 물품의 손상에 대해 배상 책임을 지지 않습니다.</p>
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>보관 환경(기온, 습도 등)으로 인한 자연적 훼손, 곰팡이, 변색 등</li>
              <li>불가항력적 사고(천재지변, 원인불명 화재, 도난 등)</li>
              <li>고객의 포장 불량이나 물품 자체의 결함으로 인한 손해</li>
              <li>고객이 신고하지 않은 고가품의 분실·손상</li>
            </ol>
          </Section>

          <Section title="제7조 (요금 연체 및 물품 처분)">
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>요금이 장기 연체될 경우, 회사는 고객에게 문자·메신저 등으로 사전 통보를 진행합니다.</li>
              <li>사전 통보 후에도 상당 기간 내에 조치가 이루어지지 않을 경우, 회사는 보관 물품을 반출·처분할 수 있습니다.</li>
            </ol>
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