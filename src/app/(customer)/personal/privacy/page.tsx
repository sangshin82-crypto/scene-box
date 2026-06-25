'use client';

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function PersonalPrivacyPage() {
  const router = useRouter();

  return (
    <div style={{ background: "#F9FAFB", minHeight: "100vh", fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
      <div style={{ maxWidth: 430, margin: "0 auto", paddingBottom: 60 }}>

        <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", padding: "16px" }}>
          <button onClick={() => router.push('/personal')} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", marginRight: 12 }}>
            <ChevronLeft size={24} color="#374151" />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>개인정보처리방침</span>
        </div>

        <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 24 }}>

          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 6, letterSpacing: "-0.5px" }}>
              개인정보 처리방침
            </h1>
            <p style={{ fontSize: 12, color: "#9CA3AF" }}>시행일: 2026년 6월 26일</p>
          </div>

          <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: "16px 18px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8", marginBottom: 10 }}>📌 주요 내용 요약</p>
            <ul style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#374151", lineHeight: 1.7 }}>
              <li><strong>수집 항목</strong>: 성명, 휴대전화, 주소</li>
              <li><strong>이용 목적</strong>: 보관 예약·관리, 박스 수거·배송, 결제, 안내 발송</li>
              <li><strong>보유 기간</strong>: 관계 법령에 따라 최대 5년</li>
              <li><strong>제3자 제공</strong>: 원칙적으로 제공하지 않음</li>
              <li><strong>처리 위탁 및 국외 이전</strong>: 결제·데이터 저장·메시지 발송 업무 위탁(아래 참조)</li>
            </ul>
            <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 10, lineHeight: 1.6 }}>
              위 내용은 처리방침의 주요 사항을 알기 쉽게 표기한 것입니다. 자세한 내용은 아래 전문을 확인하시기 바랍니다.
            </p>
          </div>

          <Section title="1. 개인정보의 수집 및 이용 목적">
            <p style={{ marginBottom: 10 }}>씬박스(이하 "회사")는 개인 보관 서비스 제공을 위해 아래 목적으로 개인정보를 수집·이용합니다.</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li><strong>보관 예약 및 관리</strong>, 박스 수거·배송, 반출 처리, 고객 상담</li>
              <li>서비스 이용 <strong>요금 결제</strong> 및 정산</li>
              <li>방문 일정, 변경 사항 등 <strong>안내 메시지(카카오 알림톡, 이메일 등) 발송</strong></li>
            </ul>
          </Section>

          <Section title="2. 수집하는 개인정보 항목">
            <p style={{ marginBottom: 10 }}>회사는 서비스 예약 및 결제 과정에서 아래의 최소한의 정보를 수집합니다.</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li><strong>필수 항목:</strong> 성명, 휴대전화 번호, 수거·배송 주소(상세주소 포함)</li>
              <li><strong>결제 관련 항목:</strong> 결제 및 정산 정보. 단, 카드번호 등 결제수단 정보는 결제대행 페이지에서 처리되며 <strong>회사가 직접 저장하지 않습니다.</strong></li>
              <li><strong>카카오 로그인 시:</strong> 카카오 계정 프로필(닉네임, 프로필 이미지)</li>
              <li><strong>서비스 이용 과정에서 자동 수집:</strong> 접속 IP, 서비스 이용 기록</li>
            </ul>
          </Section>

          <Section title="3. 개인정보의 보유 및 이용 기간">
            <p style={{ marginBottom: 10 }}>원칙적으로 수집·이용 목적이 달성된 후에는 지체 없이 파기합니다. 단, 관계 법령에 의해 보존이 필요한 경우 아래와 같이 보관합니다.</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>계약 또는 청약철회 등에 관한 기록: <strong>5년</strong> (전자상거래법)</li>
              <li>대금 결제 및 재화 등의 공급에 관한 기록: <strong>5년</strong> (전자상거래법)</li>
              <li>소비자의 불만 또는 분쟁 처리에 관한 기록: <strong>3년</strong> (전자상거래법)</li>
            </ul>
          </Section>

          <Section title="4. 개인정보 처리의 위탁">
            <p style={{ marginBottom: 10 }}>회사는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리 업무를 위탁하고 있습니다.</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li><strong>페이앱(PayApp):</strong> 결제 처리 및 결제 정보 검증</li>
              <li><strong>Supabase:</strong> 서비스 데이터 저장 및 관리(클라우드 인프라)</li>
              <li><strong>카카오:</strong> 카카오 로그인 및 카카오 채널을 통한 고객 상담·알림</li>
            </ul>
          </Section>

          <Section title="5. 개인정보의 국외 이전">
            <p style={{ marginBottom: 10 }}>회사는 서비스 운영을 위해 아래와 같이 개인정보를 국외로 이전(보관·처리)하고 있습니다. 정보주체는 국외 이전을 거부할 수 있으며, 거부 시 일부 서비스 이용이 제한될 수 있습니다.</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li><strong>Supabase Inc.:</strong> 회원·예약 데이터 저장 / 서비스 이용 시 / 위 보유기간과 동일</li>
              <li><strong>Vercel Inc.:</strong> 접속 로그·IP 등 / 서비스 접속 시 / 처리 목적 달성 시 파기</li>
              <li><strong>Telegram:</strong> 관리자 알림용 예약·결제 정보 / 예약·결제 발생 시 / 알림 목적 달성 후 파기</li>
            </ul>
          </Section>

          <Section title="6. 개인정보의 제3자 제공">
            회사는 정보주체의 개인정보를 본 방침에서 고지한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우를 제외하고는 개인정보를 제3자에게 제공하지 않습니다.
          </Section>

          <Section title="7. 정보주체의 권리·의무 및 행사 방법">
            <p style={{ marginBottom: 10 }}>정보주체는 회사에 대해 언제든지 다음의 권리를 행사할 수 있습니다.</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>개인정보 <strong>열람</strong> 요구</li>
              <li>오류 등이 있을 경우 <strong>정정</strong> 요구</li>
              <li>개인정보 <strong>삭제</strong> 요구</li>
              <li>개인정보 <strong>처리정지</strong> 요구</li>
            </ul>
            <p style={{ marginTop: 10 }}>위 권리 행사는 서면, 이메일 등을 통하여 하실 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.</p>
          </Section>

          <Section title="8. 개인정보의 안전성 확보 조치">
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li><strong>관리적 조치:</strong> 개인정보 취급 담당자 최소화 및 접근 권한 관리</li>
              <li><strong>기술적 조치:</strong> 처리시스템 접근 권한 관리, 데이터 전송 구간 암호화(SSL)</li>
            </ul>
          </Section>

          <Section title="9. 개인정보의 파기 절차 및 방법">
            종이에 출력된 개인정보는 분쇄 또는 소각을 통해 파기하며, 전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법으로 삭제합니다.
          </Section>

          <Section title="10. 개인정보 보호 책임자">
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <li><strong>성명:</strong> 박민지</li>
              <li><strong>소속/직위:</strong> 씬박스 대표</li>
              <li><strong>연락처:</strong> 070-8057-6783 / 010-2897-8524</li>
              <li><strong>이메일:</strong> easy.keep.kr@gmail.com</li>
            </ul>
            <p style={{ marginTop: 10 }}>정보주체는 개인정보 침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터(국번없이 118) 등에 상담을 신청할 수 있습니다.</p>
          </Section>

          <Section title="11. 개인정보 처리방침의 변경">
            이 개인정보 처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경 내용의 추가·삭제·정정이 있는 경우 변경사항 시행 전부터 공지사항을 통하여 고지합니다.
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