-- 씬박스홈 — 개인(B2C) 보관 서비스 / DB 정합성 스프린트 (롤테이너 모델 전환)
-- 관련 화면: /personal/booking, /personal/retrieval, /personal/dashboard, /admin/personal
--
-- 이 프로젝트는 Supabase CLI 없이 대시보드 SQL Editor에서 수동 실행한다.
-- 적용: SceneBox Supabase 대시보드 → SQL Editor에 아래 전체를 붙여넣고 Run.
-- 쓰기/읽기는 기존 personal 테이블 관행과 동일(RLS 미사용, 기존 clients 방식 따름).
--
-- ────────────────────────────────────────────────────────────────────────────
-- 배경 / 왜 이렇게 바꿨는가
-- ────────────────────────────────────────────────────────────────────────────
-- 개인 보관 상품을 "이사박스(월 1만원, 최소 3개)" 모델에서
-- "롤테이너 칸 단위" 모델로 전환하면서 스키마를 재정의했다.
--   - 요금: 롤테이너 1칸(1.1×0.8×1.5m, 약 1,300L) 기준
--     · 3개월 약정: 월 33,000원 (수거·반출 무료)
--     · 1개월 이용: 44,000원 + 수거 25,000 + 반출 25,000 (왕복 배차비 5만원, 칸 수 무관 1회)
--   - 이용 유형(3개월/1개월)에 따라 요금·혜택이 갈리므로 plan_type 컬럼 신설.
--     (이전엔 memo에 "[3개월 약정]" 태그로 임시 저장했으나 관리자 요금계산을 위해 정식 컬럼화)
--
-- 컬럼 리네이밍 (옛 이름 → 새 이름):
--   box_count      → unit_count      (롤테이너 "칸" 수. box는 옛 이사박스 모델 잔재)
--   item_desc      → label_no        (반출 시 물건 설명 대신 라벨 번호만 받음. 창고를 뒤지지 않기 위함)
--   retrieval_type 값 'urgent' → 'oncall'  ("긴급" → "수시" 반출로 개념 변경)
--   (retrieval_type의 'regular'/'parcel'은 의미 불변이라 유지)
--
-- 신규 컬럼:
--   plan_type ('3month' | '1month')  — 요금 계산의 근거. requests·subscriptions 양쪽에.
--
-- 참고: 이 스프린트 시점엔 테스트 데이터만 있어 drop 후 재생성으로 처리했다.
--       운영 데이터가 있는 상태라면 drop 대신 ALTER로 보존해야 한다.
--
-- 관리자 요금 계산 (앱 코드 참조용, DB엔 결과만 저장):
--   요청 amount(예상 결제액):
--     3개월 = unit_count × 33,000 × 3
--     1개월 = unit_count × 44,000 + 50,000   (수거·반출 고정, 칸 수 무관)
--   구독 monthly_fee(보관료만, 수거·반출 제외):
--     3개월 = unit_count × 33,000
--     1개월 = unit_count × 44,000
--   ※ 수거·반출비(1개월 50,000)는 별도 컬럼에 저장하지 않고 plan_type으로 도출한다.
--
-- 구독 규칙:
--   같은 client + 같은 plan_type의 active 구독만 칸 수 합산.
--   다른 plan_type이면 별도 구독 행 생성(3개월 약정과 1개월 이용은 독립 계약).
-- ────────────────────────────────────────────────────────────────────────────


-- ────────────────────────────────────────────────────────────────────────────
-- 기존 테이블 제거 (테스트 데이터 전제. 운영 데이터 있으면 이 블록 실행 금지)
-- ────────────────────────────────────────────────────────────────────────────
drop table if exists public.personal_requests;
drop table if exists public.personal_subscriptions;


-- ────────────────────────────────────────────────────────────────────────────
-- 1) personal_requests — 보관/반출 요청 접수
-- ────────────────────────────────────────────────────────────────────────────
create table public.personal_requests (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients(id),
  request_type    text not null check (request_type in ('storage','retrieval')),
  plan_type       text check (plan_type in ('3month','1month')),                    -- 보관 유형(storage일 때)
  unit_count      integer,                                                          -- 롤테이너 칸 수
  retrieval_type  text check (retrieval_type in ('regular','parcel','oncall')),     -- 정기/택배/수시
  label_no        text,                                                             -- 반출 시 라벨 번호
  desired_date    date,
  address_detail  text not null,
  amount          integer not null default 0,                                       -- 예상 결제액(현장 확정 후 관리자 조정)
  memo            text,
  status          text not null default 'requested'
                    check (status in ('requested','confirmed','paid','completed','cancelled')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_personal_requests_client on public.personal_requests(client_id);
create index idx_personal_requests_status on public.personal_requests(status);


-- ────────────────────────────────────────────────────────────────────────────
-- 2) personal_subscriptions — 이용(구독) 현황
-- ────────────────────────────────────────────────────────────────────────────
create table public.personal_subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid not null references public.clients(id),
  plan_type          text check (plan_type in ('3month','1month')),   -- 요금 계산 근거
  unit_count         integer not null,                                -- 롤테이너 칸 수
  monthly_fee        integer not null,                                -- 보관료만(수거·반출 제외)
  start_date         date not null,
  next_payment_date  date,                                            -- 3개월=갱신 예정일 / 1개월=만료일
  status             text not null default 'active'
                       check (status in ('active','paused','ended')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index idx_personal_subscriptions_client on public.personal_subscriptions(client_id);
