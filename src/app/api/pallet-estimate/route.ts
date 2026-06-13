// 씬박스 — 짐 부피(파렛트) 추정 API  /  POST /api/pallet-estimate
// PRD §4, §5. 짐 사진(multipart, 최대 5장)을 받아 Gemini 비전으로 파렛트 분량을 추정하고
// pallet_estimates 에 저장한 뒤 노출용 필드만 반환한다.
//
// 처리 순서: ① 토큰 검증(로그인 판별) → ② pe_uid 쿠키 확보 → ③ 레이트리밋 게이트(Gemini 호출 전)
//            → ④ 이미지 검증·리사이즈 → ⑤ Storage 업로드 → ⑥ Gemini 추정 → ⑦ DB 저장 → ⑧ 노출 필드 반환
//
// service-role 패턴은 api/confirm/route.ts 와 동일(라우트 내부에서 fresh client 생성, RLS 우회).

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { checkPalletQuota, clientIp, hashIp, PALLET_LIMITS } from '@/app/lib/pallet-rate-limit';
import { processPalletImages, ImageValidationError } from '@/app/lib/pallet-images';
import { estimatePallets } from '@/app/lib/gemini';

export const runtime = 'nodejs'; // sharp(네이티브) 사용 → Edge 불가

const STORAGE_BUCKET = 'pallet-estimates';
const PE_UID_COOKIE  = 'pe_uid';

// service-role 클라이언트 (RLS 우회). DB 쓰기·Storage 업로드·RPC 게이트 전용.
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

/** Authorization: Bearer <token> 검증 → 로그인 user id 또는 null. */
async function resolveUserId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization');
  const token = auth?.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  if (!token) return null;

  // anon 클라이언트로 토큰만 검증(세션 미유지). 사칭 방지를 위해 서버에서 직접 확인.
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function POST(req: NextRequest) {
  try {
    // ─── ① 로그인 판별 (토큰 서버검증) ───────────────────────────────────────
    const userId = await resolveUserId(req);

    // ─── ② pe_uid 쿠키 확보 (없으면 신규 발급, 응답에서 Set-Cookie) ────────────
    let uid = req.cookies.get(PE_UID_COOKIE)?.value ?? '';
    let issueCookie = false;
    if (!uid) {
      uid = crypto.randomUUID();
      issueCookie = true;
    }

    // ─── ③ 레이트리밋 게이트 (Gemini 호출 전에 원자적 증가) ────────────────────
    const ipHash = hashIp(clientIp(req.headers));
    const quota = await checkPalletQuota(admin, { userId, uid, ipHash });
    if (!quota.allowed) {
      const limit = PALLET_LIMITS.DAILY;
      const msg = quota.scope === 'ip'
        ? '오늘 이용량이 많아 잠시 후 다시 시도해주세요.'
        : `오늘 추정 횟수(${limit}회)를 모두 사용했습니다. 내일 다시 이용해주세요.`;
      return withCookie(
        NextResponse.json({ error: msg }, { status: 429 }),
        issueCookie ? uid : null
      );
    }

    // ─── ④ multipart 파싱 + 이미지 검증·리사이즈(최장변 1280px / JPEG 75%) ──────
    const form = await req.formData();
    const files = form.getAll('images').filter((v): v is File => v instanceof File);
    const a4_attached = form.get('a4_attached') === 'true';
    const size_hint   = (form.get('size_hint') as string | null) ?? undefined;
    const item_desc   = (form.get('item_desc') as string | null) ?? undefined;

    let images;
    try {
      images = await processPalletImages(files);
    } catch (e) {
      if (e instanceof ImageValidationError) {
        return withCookie(
          NextResponse.json({ error: e.message }, { status: 400 }),
          issueCookie ? uid : null
        );
      }
      throw e;
    }

    // ─── ⑤ Storage 업로드 (리사이즈된 JPEG만 저장) ────────────────────────────
    const prefix = userId ? `user-${userId}` : `uid-${uid}`;
    const stamp  = Date.now();
    const imageUrls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const path = `${prefix}/${stamp}-${i}.jpg`;
      const { error: upErr } = await admin.storage
        .from(STORAGE_BUCKET)
        .upload(path, images[i].buffer, { contentType: 'image/jpeg', upsert: false });
      if (upErr) {
        console.error('Storage 업로드 실패:', upErr);
      } else {
        imageUrls.push(path);
      }
    }

    // ─── ⑥ Gemini 추정 ───────────────────────────────────────────────────────
    let result;
    try {
      result = await estimatePallets(
        images.map((img) => ({ base64: img.base64, mime: img.mime })),
        { a4_attached, size_hint, item_desc }
      );
    } catch (e) {
      console.error('Gemini 추정 실패:', e);
      return withCookie(
        NextResponse.json(
          { error: '추정에 실패했습니다. 사진을 바꿔 다시 시도해주세요.' },
          { status: 502 }
        ),
        issueCookie ? uid : null
      );
    }

    const pallets_min = result.total_pallets_range?.min ?? null;
    const pallets_max = result.total_pallets_range?.max ?? null;

    // ─── ⑦ DB 저장 (전체 응답은 result_json, 노출값은 별도 컬럼) ────────────────
    const { error: insErr } = await admin.from('pallet_estimates').insert({
      user_id:     userId,
      image_urls:  imageUrls,
      a4_attached,
      size_hint:   size_hint || null,
      item_desc:   item_desc || null,
      a4_detected: result.a4_detected ?? null,
      result_json: result,
      pallets_min,
      pallets_max,
      confidence:  result.confidence ?? null,
    });
    if (insErr) {
      console.error('pallet_estimates 저장 실패:', insErr);
    }

    // ─── ⑧ 노출 필드만 반환 (reasoning·치수는 미노출, objects는 표시용만 추려서) ──
    // 물체별 분해 표시를 위해 objects 의 name·pallets·is_irregular 만 노출한다.
    const objects = (result.objects ?? []).map((o) => ({
      name:         o.name,
      pallets:      o.pallets ?? null,
      is_irregular: o.is_irregular ?? null,
    }));

    return withCookie(
      NextResponse.json({
        pallets_min,
        pallets_max,
        confidence:       result.confidence ?? null,
        advice_to_user:   result.advice_to_user ?? null,
        objects,
        reasoning:        result.reasoning ?? null,                 // 추정 근거(전문)
        loading_loss_pct: result.loading_loss_applied_pct ?? null,  // 적재 손실(%)
      }),
      issueCookie ? uid : null
    );

  } catch (error) {
    console.error('파렛트 추정 처리 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '추정 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/** 신규 pe_uid 가 있으면 httpOnly 쿠키를 응답에 심는다(1년, SameSite=Lax). */
function withCookie(res: NextResponse, uid: string | null): NextResponse {
  if (uid) {
    res.cookies.set(PE_UID_COOKIE, uid, {
      httpOnly: true,
      sameSite: 'lax',
      secure:   process.env.NODE_ENV === 'production',
      path:     '/',
      maxAge:   60 * 60 * 24 * 365,
    });
  }
  return res;
}
