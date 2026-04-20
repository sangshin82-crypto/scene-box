'use client';

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function TermsPage() {
  const router = useRouter();

  return (
    <div style={{ background: "#F9FAFB", minHeight: "100vh", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
      <div style={{ maxWidth: 430, margin: "0 auto", paddingBottom: 60 }}>

        <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", padding: "16px" }}>
          <button onClick={() => router.back()} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", marginRight: 12 }}>
            <ChevronLeft size={24} color="#374151" />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>씬박스 서비스 이용약관</span>
        </div>

        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 24 }}>

          <p style={{ fontSize: 12, color: "#9CA3AF" }}>시행일: 2026년 [추후 기재]일</p>

          <Section title="제1조 (목적)">
            본 약관은 스타일링소다(이하 "회사")가 제공하는 씬박스 보관 서비스(이하 "서비스")의 이용 조건, 절차, 책임 및 면책 사항 등 회사와 이용자(이하 "고객") 간의 권리 및 의무를 명확히 규정함을 목적으로 합니다.
          </Section>

          <Section title="제2조 (보관 불가 품목)">
            <p style={{ marginBottom: 10 }}>회사는 창고의 안전과 다른 고객의 화물 보호를 위해 다음 각 호의 물품에 대해 보관을 거절할 수 있으며, 고객이 이를 은폐하고 입고하여 발생한 모든 직/간접적 손해는 고객이 배상해야 합니다.</p>
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>현금, 유가증권, 귀금속, 골동품 등 객관적 가치 산정이 어려운 고가의 물품</li>
              <li>부패, 변질, 부화 등의 우려가 있는 동/식물 및 음식물류</li>
              <li>폭발물, 인화성 물질, 유독성 가스 등 안전에 위협을 가할 수 있는 위험물</li>
              <li>불법 소지품 및 법령에 의해 보관이나 이동이 금지된 물품</li>
              <li>기타 회사가 보관이 부적합하다고 판단하는 물품</li>
            </ol>
          </Section>

          <Section title="제3조 (입고 및 출고의 원칙)">
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <li>
                <strong>[입고]</strong> 입고 시 회사는 물품의 외관 상태를 확인하고 사진 촬영을 진행할 수 있으며, 이미 파손되거나 포장이 불량한 상태로 입고된 물품에 대해서는 파손 면책에 동의한 것으로 간주합니다.
              </li>
              <li>
                <strong>[출고 및 사전 예약]</strong> 고객이 보관 중인 물품을 출고(부분 반환 포함)하고자 할 경우, 원활한 현장 작업 및 동선 확보를 위해 반드시 출고 희망일 최소 1영업일(24시간) 전까지 회사의 공식 채널(대표전화, 웹사이트, 이메일, 공식 메신저 등)을 통해 출고 예약을 확정해야 합니다.
              </li>
              <li>
                <strong>[당일 출고 불가]</strong> 사전 예약 없이 당일 현장 방문을 통한 즉시 출고 요구는 원칙적으로 거절되며, 이로 인한 고객의 업무 지연에 대해 회사는 책임지지 않습니다.
              </li>
            </ol>
          </Section>

          <Section title="제4조 (회사의 책임과 면책 규정)">
            <p style={{ marginBottom: 10 }}>회사는 고객의 물품을 선량한 관리자의 주의 의무를 다하여 보관합니다. 단, 다음 각 호의 사유로 발생한 화물의 멸실, 훼손, 파손에 대해서는 배상 책임을 지지 않습니다.</p>
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>고객의 포장 불량이나 화물 자체의 자연적인 결함, 부패, 변질로 인한 손해</li>
              <li>전쟁, 테러, 폭동, 지진, 태풍, 홍수 등 불가항력적인 자연재해로 인한 손해</li>
              <li>고객이 제2조(보관 불가 품목)를 위반하여 보관한 물품에 발생한 손해</li>
              <li>출고 완료 후 고객 또는 고객이 지정한 대리인(운송기사 등)에게 물품이 인계된 이후 발생한 손해</li>
            </ol>
          </Section>

          <Section title="제5조 (요금 결제 및 연체)">
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>서비스 이용 요금은 선결제를 원칙으로 합니다.</li>
              <li>보관 기간이 종료되었음에도 연장 결제 또는 물품 반환이 이루어지지 않고 요금이 60일 이상 장기 연체될 경우, 회사는 사전 통지 후 임의로 화물을 처분하여 연체 보관료에 충당할 수 있습니다.</li>
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