-- 씬박스 — 짐 부피(파렛트) 추정 기능 / 2단계 DB 마이그레이션
-- PRD: docs/scenebox_pallet_feature_PRD.md §7
--
-- 이 프로젝트는 Supabase CLI 없이 대시보드 SQL Editor에서 수동 실행한다.
-- 적용: SceneBox Supabase 대시보드 → SQL Editor에 아래 전체를 붙여넣고 Run.
-- 쓰기/읽기는 모두 서버 라우트가 service-role 키로 수행한다(RLS 우회).
-- 따라서 RLS는 켜되 공개 정책은 두지 않는다.

-- ────────────────────────────────────────────────────────────────────────────
-- 1) 테이블: pallet_estimates
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.pallet_estimates (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        references auth.users (id) on delete set null,  -- 로그인 시 연결, 비로그인 허용 시 null
  created_at     timestamptz not null default now(),

  -- 사용자 입력
  image_urls     text[],                 -- Supabase Storage 경로 배열
  a4_attached    boolean,                -- A4 부착 여부
  size_hint      text,                   -- 크기 힌트(선택)
  item_desc      text,                   -- 보관 물품 설명(선택)

  -- Gemini 응답
  a4_detected    boolean,                -- Gemini가 A4를 인식했는지
  result_json    jsonb,                  -- 전체 응답(objects/reasoning 등)
  pallets_min    numeric,                -- 노출값
  pallets_max    numeric,                -- 노출값
  confidence     text,                   -- 높음/중/낮음

  -- 검증 루프(이번 단계는 컬럼만 준비, 운영자가 추후 채움)
  actual_pallets numeric,                -- 실제 보관 시 입력 → 추정 vs 실제
  verified_at    timestamptz             -- 실제값 입력 시각
);

-- 조회/통계용 보조 인덱스
create index if not exists pallet_estimates_created_at_idx
  on public.pallet_estimates (created_at desc);
create index if not exists pallet_estimates_user_id_idx
  on public.pallet_estimates (user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 2) RLS: 켜되 공개 정책 없음 → anon/authenticated 키로는 접근 불가.
--    모든 접근은 service-role(서버 라우트)로만. 운영자 조회 화면은 PRD §9(범위 밖).
-- ────────────────────────────────────────────────────────────────────────────
alter table public.pallet_estimates enable row level security;

-- ────────────────────────────────────────────────────────────────────────────
-- 3) Storage 버킷: pallet-estimates (Private)
--    업로드/조회를 service-role로만 하므로 storage.objects 공개 정책은 두지 않는다.
-- ────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('pallet-estimates', 'pallet-estimates', false)
on conflict (id) do nothing;
