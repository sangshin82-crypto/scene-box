'use client';

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function TermsPage() {
  const router = useRouter();

  return (
    <div style={{ background: "#F9FAFB", minHeight: "100vh", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
      <div style={{ maxWidth: 430, margin: "0 auto", paddingBottom: 60 }}>

        {/* 상단 헤더 */}
        <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", padding: "16px" }}>
          <button onClick={() => router.back()} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", marginRight: 12 }}>
            <ChevronLeft size={24} color="#374151" />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>씬박스 서비스 이용약관</span>
        </div>

        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 24 }}>

          <p style={{ fontSize: 12, color: "#9CA3AF" }}>시행일: 2026년 [추후 기재]일</p>

          <Section title="제1조 (목적 및 서비스의 성격)">
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>본 약관은 '씬박스(이하 "회사")'가 제공하는 B2B 화물 보관 및 공간 대여 서비스(이하 "서비스")의 이용 조건, 절차, 책임 및 면책 사항 등 회사와 이용자(이하 "고객") 간의 권리 및 의무를 명확히 규정함을 목적으로 합니다.</li>
              <li>회사가 제공하는 서비스는 화물의 보존 및 관리를 전적으로 책임지는 '수치인'으로서의 보관업이 아니며, 고객의 물품을 적재할 수 있는 <strong>'물리적 공간(Grid)을 제공하는 공간 임대업'</strong>에 한정됨을 명확히 합니다.</li>
            </ol>
          </Section>

          <Section title="제2조 (보관 불가 품목)">
            <p style={{ marginBottom: 10 }}>회사는 시설의 안전과 다른 고객의 화물 보호를 위해 다음 각 호의 물품에 대해 보관을 거절할 수 있으며, 고객이 이를 은폐하고 입고하여 당사 시설이나 타 고객에게 발생한 모든 직/간접적 피해는 해당 고객이 100% 변상해야 합니다.</p>
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>현금, 유가증권, 귀금속, 골동품 등 객관적 가치 산정이 어려운 고가의 물품</li>
              <li>부패, 변질, 부화 등의 우려가 있는 동/식물 및 음식물류</li>
              <li>폭발물, 인화성 물질(페인트, 시너 등), 유독성 가스 등 안전에 위협을 가할 수 있는 위험물</li>
              <li>불법 소지품 및 폐기물 등 법령에 의해 보관이나 이동이 금지된 물품</li>
              <li>기타 회사가 보관이 부적합하다고 판단하는 물품</li>
            </ol>
          </Section>

          <Section title="제3조 (입고 및 출고의 원칙)">
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <li>
                <strong>[입고]</strong> 입고 시 회사는 물품의 상태 확인을 위해 사진 촬영을 진행할 수 있으며, 이미 파손되거나 포장이 불량한 상태로 입고된 물품에 대해서는 파손 면책에 동의한 것으로 간주합니다.
              </li>
              <li>
                <strong>[출고 및 사전 예약]</strong> 원활한 현장 작업 및 동선 확보를 위해 반드시 출고 희망일 <strong>최소 1영업일(24시간) 전</strong>까지 회사의 공식 채널을 통해 예약을 확정해야 합니다.
              </li>
              <li>
                <strong>[당일 출고 불가]</strong> 사전 예약 없는 당일 현장 방문을 통한 즉시 출고 요구는 원칙적으로 거절되며, 이로 인한 고객의 업무 지연에 대해 회사는 책임지지 않습니다.
              </li>
            </ol>
          </Section>

          <Section title="제4조 (고객의 자체 보험 가입 의무)">
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>회사는 공간을 임대할 뿐, 고객 물품에 대한 화재, 도난, 파손 등을 담보하는 보관자배상책임보험을 제공하지 않습니다.</li>
              <li>고객은 입고하는 모든 자산에 대하여 <strong>고객 측의 비용과 책임으로 별도의 보험(제작 보험 등)에 가입한 후 입고</strong>해야 하며, 미가입 시 발생하는 모든 손해는 회사가 배상하지 않습니다.</li>
            </ol>
          </Section>

          <Section title="제5조 (면책 조항 및 손해배상 청구 불가)">
            <p style={{ marginBottom: 10 }}>회사는 다음 각 호의 사유로 발생한 화물의 멸실, 훼손, 파손에 대해 민·형사상 일체의 배상 책임을 지지 않으며, 고객은 회사에 손해배상을 청구할 수 없습니다.</p>
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li><strong>환경적 요인:</strong> 보관 시설의 환경적 특성(기온, 습도 변화 등)으로 인한 자연적인 훼손, 곰팡이, 부식, 변색 등</li>
              <li><strong>불가항력적 사고:</strong> 해충 및 조수해, 원인을 알 수 없는 화재, 도난, 외부 침입자에 의한 파손</li>
              <li><strong>운송 과실:</strong> 고객이 섭외한 탁송 기사의 상하차 과정에서 발생한 파손 및 출고 인계 이후 발생한 손해</li>
              <li>고객의 포장 불량이나 화물 자체의 자연적인 결함으로 인한 손해</li>
            </ol>
          </Section>

          <Section title="제6조 (요금 결제, 이행보증금 차감 및 연체 화물의 처분)">
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>서비스 이용 요금은 선결제를 원칙으로 합니다.</li>
              <li>요금 연체가 발생할 경우, 회사는 고객이 납부한 <strong>'이행보증금'에서 연체된 보관료를 우선적으로 차감</strong>합니다.</li>
              <li>보관 기간이 종료되었음에도 요금이 60일 이상 장기 연체될 경우, 회사는 고객에게 문자, 이메일, 메신저 등을 통해 <strong>사전 통보(안내)</strong>를 진행합니다.</li>
              <li>사전 통보 후에도 지정된 기한 내에 조치가 이루어지지 않거나 이행보증금이 전액 소진된 경우, 회사는 공간 확보를 위해 해당 화물을 임의로 반출, 매각, 또는 폐기 처분할 수 있습니다.</li>
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