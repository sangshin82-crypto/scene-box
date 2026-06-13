// 씬박스 — 파렛트 추정 남용방지(레이트리밋) 헬퍼  /  서버 전용
// PRD §4. Gemini 호출 전에 일일 횟수를 원자적으로 증가시켜 게이트한다.
//   · 일일 한도: uid:<쿠키> 또는 user:<uuid>   3회/일  (로그인·비로그인 동일)
//   · 백스톱:    ip:<sha256>                   9회/일  (신원 게이트 통과 후 IP 단위로 한 번 더)
// 날짜 경계는 KST(UTC+9) 기준. 모든 카운트는 service-role 클라이언트로만 기록한다.

import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

// 일일 한도 상수 (한 곳에서 관리)
export const PALLET_LIMITS = {
  DAILY: 3,   // 일일 한도 — 로그인/비로그인 동일 (uid 쿠키 또는 user_id 기준)
  IP:    9,   // IP 백스톱 (우회 방지 상한)
} as const;

/** KST(UTC+9) 기준 오늘 날짜를 YYYY-MM-DD 문자열로 반환. */
export function kstDay(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10); // UTC로 +9 시프트했으므로 날짜 부분이 KST 날짜
}

/** 요청 IP를 솔트와 함께 sha256 해시 (원문 IP는 저장하지 않는다). */
export function hashIp(ip: string): string {
  const salt = process.env.PALLET_IP_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  return crypto.createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}

/** x-forwarded-for / x-real-ip 에서 첫 번째 클라이언트 IP를 추출. */
export function clientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return headers.get('x-real-ip')?.trim() || 'unknown';
}

/**
 * 단일 신원 게이트: increment_pallet_usage RPC 호출.
 * @returns true = 허용(한도 내), false = 초과(차단)
 */
async function gate(
  admin: SupabaseClient,
  identity: string,
  day: string,
  limit: number
): Promise<boolean> {
  const { data, error } = await admin.rpc('increment_pallet_usage', {
    p_identity: identity,
    p_day:      day,
    p_limit:    limit,
  });
  if (error) {
    // RPC 자체가 실패하면 게이트를 통과시키지 않는다(보수적으로 차단).
    console.error('increment_pallet_usage 실패:', error);
    return false;
  }
  // 행이 반환되면(=count 숫자) 허용, NULL이면 한도 도달로 차단.
  return data !== null && data !== undefined;
}

/**
 * 신원 게이트(비로그인 uid 또는 로그인 user) → 통과 시 IP 백스톱 게이트.
 * 어느 하나라도 초과면 allowed:false.
 */
export async function checkPalletQuota(
  admin: SupabaseClient,
  opts: { userId: string | null; uid: string; ipHash: string }
): Promise<{ allowed: boolean; scope?: 'identity' | 'ip' }> {
  const day = kstDay();

  // 카운트 키는 로그인 여부로 구분(user/uid)하되, 한도는 동일하게 적용한다.
  const identity = opts.userId ? `user:${opts.userId}` : `uid:${opts.uid}`;

  if (!(await gate(admin, identity, day, PALLET_LIMITS.DAILY))) {
    return { allowed: false, scope: 'identity' };
  }
  if (!(await gate(admin, `ip:${opts.ipHash}`, day, PALLET_LIMITS.IP))) {
    return { allowed: false, scope: 'ip' };
  }
  return { allowed: true };
}
