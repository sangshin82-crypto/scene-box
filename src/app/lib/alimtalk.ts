import { SolapiMessageService } from "solapi";

const messageService = new SolapiMessageService(
  process.env.SOLAPI_API_KEY!,
  process.env.SOLAPI_API_SECRET!
);

const PFID = "KA01PF260605174630790MjAjYWxKfwC";
const FROM = "01028978524"; // 솔라피 등록 발신번호 (하이픈 없이)

// 알림톡 템플릿 코드
export const ALIMTALK_TEMPLATES = {
  RESERVATION:       "KA01TP260605175843743wW0WAZNfyig", // 보관 예약 완료
  TRANSPORT_REQUEST: "KA01TP260605180121091ji097aBKJEs", // 배차 신청 완료
  DISPOSAL_REQUEST:  "KA01TP260605180221524pqnyEFGenB3", // 폐기 신청 완료
  TRANSPORT_DONE:    "KA01TP260605180341993HevZzFUfyJe", // 배차 완료
} as const;

export type TemplateKey = keyof typeof ALIMTALK_TEMPLATES;

/**
 * [서버 전용] 카카오 알림톡 발송 (solapi 직접 호출)
 */
export async function sendAlimtalk(
  to: string,
  templateId: string,
  variables: Record<string, string>
) {
  try {
    const formattedVariables: Record<string, string> = {};
    for (const [key, value] of Object.entries(variables)) {
      formattedVariables[`#{${key}}`] = value ?? "";
    }

    const result = await messageService.send({
      to: to.replace(/[^0-9]/g, ""), // 숫자만 남김
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
    return { success: false, error: String(error) };
  }
}