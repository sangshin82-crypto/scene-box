import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const sendTelegram = async (message: string) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    }),
  });
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type"); // 개인/기업 구분

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let user = null;

  if (code) {
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    user = data?.user;
  }

  if (user) {
    const isNew = user.created_at === user.last_sign_in_at;
    const name = user.user_metadata?.name ?? user.user_metadata?.full_name ?? "이름 없음";

    await sendTelegram(
      isNew
        ? `🆕 <b>신규 고객 가입!</b>\n\n👤 이름: ${name}\n🕐 가입일: ${new Date().toLocaleDateString("ko-KR")}`
        : `🔄 <b>기존 고객 로그인</b>\n\n👤 이름: ${name}\n🕐 로그인: ${new Date().toLocaleDateString("ko-KR")}`
    );

    const { data: clientData } = await supabase
      .from("clients")
      .select("contact_phone")
      .eq("id", user.id)
      .single();

    // 전화번호 없으면 온보딩으로
    if (!clientData?.contact_phone) {
      const onboardingPath = type === "personal" ? "/personal/onboarding" : "/onboarding";
      return NextResponse.redirect(new URL(onboardingPath, requestUrl.origin));
    }

    // 개인 입구(type=personal)로 들어오면 무조건 개인 대시보드로
    if (type === "personal") {
      return NextResponse.redirect(new URL("/personal/dashboard", requestUrl.origin));
    }

    // 그 외는 기업 대시보드로
    return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
  }

  // user 없음(로그인 실패 등) → 첫 화면으로
  return NextResponse.redirect(new URL("/", requestUrl.origin));
}