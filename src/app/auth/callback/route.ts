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

    // 전화번호 없으면 온보딩 페이지로 이동
    const { data: clientData } = await supabase
      .from("clients")
      .select("contact_phone")
      .eq("id", user.id)
      .single();

    if (!clientData?.contact_phone) {
      return NextResponse.redirect(new URL("/onboarding", requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
}