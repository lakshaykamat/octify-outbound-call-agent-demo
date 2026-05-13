# Xylo Portal

Read-only client UI for Xylo voice agent calls. Standalone Next.js app — not part of the groovo-platform pnpm workspace. Move freely.

## Stack

- Next.js 16 (App Router, Turbopack)
- Tailwind v4 + shadcn/ui (Neutral base, defaults)
- TanStack Query + Zod
- Auth via api-gateway JWT cookie (shared on `.groovo.com`)

## Setup

```bash
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL to your api-gateway origin

pnpm install
pnpm dev
```

Open http://localhost:3000.

## Pages

- `/login` — email + password (hits `POST /auth/login` on api-gateway)
- `/calls` — KPI strip, calls table, detail drawer, CSV export

## Auth flow

1. `proxy.ts` checks `token` cookie on every request.
2. Validates via `GET /auth/session` on the api-gateway.
3. Unauthed → `/login`. Authed visiting `/login` → `/calls`.

The api-gateway JWT scopes all `/xylo/*` reads to the user's `organizationId`, so there's no client-side authorization logic to maintain.

## Backend endpoints used

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/auth/login` | Sets `token` cookie |
| `POST` | `/auth/logout` | Clears `token` cookie |
| `GET`  | `/auth/session` | Session validation (used by `proxy.ts`) |
| `GET`  | `/xylo/calls` | Paginated calls list |
| `GET`  | `/xylo/calls/:id` | Call detail + transcript + analysis |
| `GET`  | `/xylo/calls/:id/recording` | Recording URL |
| `GET`  | `/xylo/analytics` | KPI roll-up |

All responses are unwrapped from the api-gateway `{ statusCode, success, message, data }` envelope in `lib/api/xylo.ts`.

## CSV export

Client-side — `buildCallsCsv` walks the paginated `/xylo/calls` endpoint (200 per page, 50-page cap) and assembles a CSV blob in the browser. No backend change required.

## Security

- `proxy.ts` redirects unauthed traffic before any page renders.
- `next.config.ts` ships CSP, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options`.
- Phone numbers are masked in the table; full number shows only in the detail drawer.
- The portal is read-only — no write endpoints exposed.
- Cookie is set by the api-gateway (`HttpOnly; Secure; SameSite=Lax`); JS never touches it.

## Scripts

- `pnpm dev` — dev server
- `pnpm build` — production build
- `pnpm start` — run production build
- `pnpm lint` — ESLint
