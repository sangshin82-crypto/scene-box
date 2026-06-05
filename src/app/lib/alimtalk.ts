import { SolapiMessageService } from "solapi";

const messageService = new SolapiMessageService(
  process.env.SOLAPI_API_KEY!,
  process.env.SOLAPI_API_SECRET!
);

const PFID = "KA01PF260605174630790MjAjYWxKfwC";
const FROM = "01028978524"; // 솔라피 등록 발신번호 (하이픈 없이)

// 알림톡 템플릿 코드
export const ALIMTALK_TEMPLATES = {
  RESERVATION:       "INXmLQvKHx", // 보관 예약 완료
  TRANSPORT_REQUEST: "kmJkowC02J", // 배차 신청 완료
  DISPOSAL_REQUEST:  "e30JXaWA4O", // 폐기 신청 완료
  TRANSPORT_DONE:    "gHVi3K7vP5", // 배차 완료
} as const;

type TemplateCode = (typeof ALIMTALK_TEMPLATES)[keyof typeof ALIMTALK_TEMPLATES];

/**
 * 카카오 알림톡 발송
 * @param to 수신자 휴대폰 번호 (하이픈 있어도 됨)
 * @param templateId 템플릿 코드 (ALIMTALK_TEMPLATES 참조)
 * @param variables 템플릿 변수 (예: { 고객명: "홍길동", 예약공간: "A존 A1" })
 */
export async function sendAlimtalk(
  to: string,
  templateId: TemplateCode,
  variables: Record<string, string>
) {
  try {
    // 변수 키를 #{키} 형식으로 변환
    const formattedVariables: Record<string, string> = {};
    for (const [key, value] of Object.entries(variables)) {
      formattedVariables[`#{${key}}`] = value ?? "";
    }

    const result = await messageService.send({
        to: to.replace(/[^0-9]/g, ""), // 숫자만 남김 (하이픈·공백 제거)
      from: FROM,
      kakaoOptions: {
        pfId: PFID,
        templateId,
        variables: formattedVariables,
      },
    });

    return { success: true, result };
  } catch (error) {
    console.error("알림톡 발송 실패:", error);
    return { success: false, error };
  }
}