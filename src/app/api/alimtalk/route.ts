import { NextRequest, NextResponse } from "next/server";
import { sendAlimtalk, ALIMTALK_TEMPLATES, TemplateKey } from "@/app/lib/alimtalk";

export async function POST(req: NextRequest) {
  try {
    const { to, templateKey, variables } = await req.json() as {
      to: string;
      templateKey: TemplateKey;
      variables: Record<string, string>;
    };

    if (!to || !templateKey || !ALIMTALK_TEMPLATES[templateKey]) {
      return NextResponse.json({ error: "필수 파라미터 누락 또는 잘못된 템플릿" }, { status: 400 });
    }

    const templateId = ALIMTALK_TEMPLATES[templateKey];
    const result = await sendAlimtalk(to, templateId, variables);

    return NextResponse.json(result);
  } catch (error) {
    console.error("알림톡 API 오류:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}