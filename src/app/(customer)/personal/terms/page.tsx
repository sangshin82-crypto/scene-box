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

        <p style={{ fontSize: 12, color: "#9CA3AF" }}>시행일: 2026년 7월 10일</p>

          <Section title="제1조 (목적 및 서비스의 성격)">
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>본 약관은 '씬박스(이하 "회사")'가 제공하는 개인 고객 대상 물품 보관 서비스 '씬박스홈'(이하 "서비스")의 이용 조건, 절차, 책임 및 면책 사항 등 회사와 이용자(이하 "고객") 간의 권리 및 의무를 규정함을 목적으로 합니다.</li>
              <li>회사가 제공하는 서비스는 고객이 직접 포장한 물품을 롤테이너(운반·보관 규격 단위)에 적재하여 회사 시설에 보관하며, 수거 및 반출을 대행하는 <strong>롤테이너 칸 단위 보관 서비스</strong>입니다.</li>
            </ol>
          </Section>

          <Section title="제2조 (이용 요금 및 결제)">
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            <li>서비스 이용은 다음 두 가지 유형으로 구분됩니다. (아래 표시 요금은 부가가치세가 포함된 금액이며, 롤테이너 1칸 기준입니다. 1칸 규격: 가로 1.1m × 세로 0.8m × 높이 1.5m, 약 1,300리터)
                <ul style={{ paddingLeft: 18, marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  <li><strong>가. 3개월 약정:</strong> 1칸당 월 33,000원(3개월 선결제)이며, <strong>최초 수거 및 약정 종료 시 정기 반출이 무료</strong>로 제공됩니다.</li>
                  <li><strong>나. 1개월 이용:</strong> 1칸당 44,000원이며, <strong>최초 수거 비용 25,000원 및 반출 비용 25,000원이 별도</strong>로 부과됩니다.</li>
                </ul>
              </li>
              <li>보관량이 1칸을 초과하는 경우 칸 수에 비례하여 요금이 부과됩니다. 수거 현장에서 실제 물량을 확인하여 필요한 칸 수를 산정하며, 신청 칸 수를 초과하는 경우 회사는 고객에게 추가 칸 요금을 안내하고 고객의 동의를 받은 후 보관을 진행합니다. 고객이 동의하지 않는 경우, 신청한 칸 수에 맞추어 물품 일부를 제외하고 수거할 수 있습니다.</li>
              <li>요금 결제는 회사가 안내하는 결제 수단(페이앱 등)을 통해 진행되며, 결제 완료 시점부터 보관이 개시됩니다.</li>
              <li>이용 요금은 선결제를 원칙으로 합니다.</li>
            </ol>
          </Section>

          <Section title="제3조 (포장, 수거 및 라벨링)">
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>고객은 보관할 물품을 직접 포장하며, 회사는 별도의 포장 용기를 제공하지 않습니다.</li>
              <li>회사는 수거 시 물품을 롤테이너에 적재하면서 물품(박스·포장 단위)별로 번호를 부여하고, 고객 확인을 거쳐 라벨링 및 사진 기록을 진행합니다.</li>
              <li>수거 및 반출은 회사가 지정하는 <strong>정기 방문일</strong>에 이루어지며, 구체적 일정은 회사가 배정하여 별도 안내합니다.</li>
              <li>고객은 방문 예정일에 수거·반출이 원활히 이루어지도록 협조해야 하며, 고객 부재 등으로 방문이 무산될 경우 일정이 지연될 수 있습니다.</li>
            </ol>
          </Section>

          <Section title="제4조 (반출)">
            <p style={{ marginBottom: 10 }}>보관 중인 물품의 반출은 다음 각 호의 방식 중 선택할 수 있으며, 반출은 회사가 지정하는 정기 방문일에 처리됩니다.</p>
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            <li><strong>정기 반출(무료):</strong> 3개월 약정을 정상 이행한 후 보관을 종료하며 전체 물품을 반출하는 방식으로, 무료로 제공됩니다. (1개월 이용의 경우 제2조 제1항 나목에 따라 반출 비용이 부과됩니다.) 정기 반출로 전체 물품을 반출할 경우 <strong>보관 계약이 종료</strong>됩니다.</li>
              <li><strong>택배 반출(5,000원):</strong> 보관을 유지한 채, 라벨 번호를 기준으로 특정 물품 중 택배 발송이 가능한 소형 물품을 택배로 받는 방식입니다.</li>
              <li><strong>수시 반출(15,000원):</strong> 보관을 유지한 채, 라벨 번호를 기준으로 특정 물품 중 택배가 어려운 대형 물품을 회사가 지정하는 정기 방문일에 직접 배송받는 방식입니다.</li>
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
              <li>제5조에 따라 보관이 금지된 물품을 고객이 은폐하고 입고하여 발생한 손해</li>
            </ol>
          </Section>

          <Section title="제7조 (계약 해지 및 환불)">
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>약정 기간을 정상 이행한 경우, 보관 종료 시 전체 물품의 반출은 무료(정기 반출)로 제공됩니다.</li>
              <li>약정 기간 중 고객의 사정으로 중도 해지하는 경우, 잔여 개월분은 월 단위로 환불합니다. 다만 약정 미이행에 따라 정기 반출(무료) 혜택은 적용되지 않으며, 중도 해지 시점에 전체 물품의 반출을 원하는 경우 <strong>차량 배차 비용 50,000원</strong>이 별도로 부과됩니다.</li>
            </ol>
          </Section>

          <Section title="제8조 (요금 연체·계약 종료 후 물품 처분)">
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>다음 각 호의 경우, 회사는 고객에게 문자·메신저 등으로 사전 통보를 진행합니다.
                <ul style={{ paddingLeft: 18, marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                  <li>가. 요금이 결제 예정일까지 납부되지 않은 경우(연체)</li>
                  <li>나. 약정 기간 만료 후 연장 또는 반출 신청 없이 물품이 방치된 경우</li>
                </ul>
              </li>
              <li>사전 통보일로부터 <strong>30일</strong>이 경과할 때까지 요금 납부, 연장, 반출 신청 등의 조치가 이루어지지 않을 경우, 회사는 보관 물품을 <strong>폐기</strong>할 수 있으며, 폐기에 소요된 비용을 고객에게 청구할 수 있습니다.</li>
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