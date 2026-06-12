# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

씬박스(SceneBox) is a Korean storage-rental service. Customers reserve grid-based storage
"spaces", pay online, request transport/disposal of their items, and settle monthly bills.
An admin console manages reservations, space inventory, billing, and clients. The UI is
mobile-first (most layouts are capped at `maxWidth: 430px`) and entirely in Korean.

Stack: Next.js 14 (App Router) · React 18 · TypeScript (strict) · Tailwind · Supabase
(Postgres + Auth) · deployed on Vercel.

## Commands

```bash
npm run dev      # local dev server (next dev)
npm run build    # production build
npm run start    # serve production build
npm run lint     # eslint (next lint)
```

There is no test suite. Verification is done by running the app.

## Architecture

### Route groups (`src/app/`)
- `(customer)/` — customer-facing app. The route group's `layout.tsx` injects the bottom
  nav bar, phone-contact strip, and footer; pages opt out via pathname checks in that layout.
  Key flows: `onboarding` → `dashboard` → `booking` → `checkout` → `success`,
  plus `inventory`, `transport`, `disposal`, `billing/*`.
- `admin/` — admin console (separate `layout.tsx` with its own bottom nav). Access is
  gated **client-side** by comparing the Supabase user's email to a hardcoded
  `ADMIN_EMAIL` constant in `admin/layout.tsx` — there is no server-side admin guard.
- `landing/`, `terms/`, `privacy/`, `refund/` — static marketing/legal pages.
- `api/` — server route handlers (see below).
- `auth/callback/route.ts` — OAuth code exchange; redirects to `/onboarding` if the
  client has no `contact_phone`, else `/dashboard`.

### Supabase clients — two distinct patterns
- **Browser / client components:** import the shared anon-key client from
  `@/app/lib/supabase` (`supabase`). Used for auth and most reads/writes under RLS.
- **Privileged server routes:** construct a fresh client *inside the route* with
  `SUPABASE_SERVICE_ROLE_KEY` (see `api/confirm/route.ts`). This bypasses RLS — only do
  this in server code that has already verified payment/authorization.

Core tables (referenced across the app): `clients`, `grids`, `spaces`, `monthly_bills`,
`bill_line_items`, `transport_requests`, `disposal_requests`, `business_registrations`.
A reservation moves `spaces.status` pending→active and `grids.status`→occupied, then
upserts a `monthly_bills` row + `bill_line_items`.

### Payments — PortOne V2 is live, Toss is dormant
`api/confirm/route.ts` is the active reservation-payment confirmation path: it verifies a
**PortOne V2** payment by fetching `https://api.portone.io/payments/{paymentId}`, checks
`status === 'PAID'` and that the amount matches (anti-tamper), then runs the DB updates.
The old **Toss Payments** flow is commented out in the same file but kept as reference —
`api/billing-confirm/route.ts` (monthly-bill settlement) still uses Toss live. When
touching payments, confirm which provider a given route targets before editing.

### Notifications — two channels, fired from server routes after success
- **Kakao 알림talk (Solapi):** `@/app/lib/alimtalk` (`sendAlimtalk`, `ALIMTALK_TEMPLATES`)
  is **server-only** — never import `solapi` into a client component. Client components
  call `requestAlimtalk` from `@/app/lib/alimtalk-client`, which POSTs to `/api/alimtalk`.
  Template IDs and the Solapi PFID/sender number are hardcoded in `alimtalk.ts`.
- **Telegram:** ops alerts (new signup, payment completed) are sent directly via the
  Telegram Bot API; `api/notify` is a thin relay used by some routes.

### Path alias
`@/*` → `./src/*` (tsconfig). Import app code as `@/app/...`.

## Environment variables

Stored in `.env.local` (gitignored). `NEXT_PUBLIC_*` are exposed to the browser; the rest
are server-only.

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_PORTONE_STORE_ID`, `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`, `PORTONE_API_SECRET`
- `NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY` (dormant reservation flow / live billing)
- `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- `GEMINI_API_KEY` (pallet-volume estimate; server-only), `PALLET_IP_SALT` (optional — IP-hash salt; falls back to service-role key)

## Conventions

- Styling is mostly **inline `style={{}}` objects** with hardcoded hex colors (mint/green
  theme, `#2563EB` blue accent), not Tailwind classes — match the surrounding file.
- Comments, UI copy, and commit messages are in **Korean**.
- Git (per `docs/`): stage files individually with quoted paths (`git add "path"`);
  do **not** use `git add .`. Present changes in 찾기→변경 (find→replace) form, and plan
  before editing.

## Notes

`docs/scenebox_pallet_feature_PRD.md` specs a planned AI pallet-volume-estimate feature
(Gemini vision + a new `/api/pallet-estimate` route). It is **not yet implemented** — treat
it as a forward spec, not existing behavior.
