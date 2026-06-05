// 클라이언트 컴포넌트에서 사용 (solapi 직접 import 금지, API 라우트만 호출)

export type TemplateKey =
  | "RESERVATION"
  | "TRANSPORT_REQUEST"
  | "DISPOSAL_REQUEST"
  | "TRANSPORT_DONE";

/**
 * [클라이언트용] API 라우트를 통해 알림톡 발송 요청
 */
export async function requestAlimtalk(
  to: string,
  templateKey: TemplateKey,
  variables: Record<string, string>
) {
  try {
    await fetch("/api/alimtalk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, templateKey, variables }),
    });
  } catch (e) {
    console.error("알림톡 요청 실패:", e);
  }
}