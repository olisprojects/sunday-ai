@AGENTS.md

# Sunday.ai — Project Guide for Claude

## What this is

A production Vercel-hosted weekly planning assistant for a parent friend group. Features: AI-powered dashboard (natural language routing), grocery price comparison (Woolworths), to-do lists, email reminders, and a calendar. Individual user accounts via Clerk. Data persisted in Neon Postgres via Drizzle ORM.

## How to run

```bash
npm run dev          # localhost only — requires env vars below
npm run build
npm run start
```

## Stack & versions

| Package | Version | Notes |
|---|---|---|
| Next.js | 16.2.9 | App Router. **Read `node_modules/next/dist/docs/` before making changes.** |
| React | 19.2.4 | — |
| Tailwind CSS | v4 | CSS-based config — no `tailwind.config.ts`. Uses `@import "tailwindcss"` in `globals.css`. |
| Framer Motion | v12 | Only 2-keyframe arrays work with spring/inertia. Use `type:'tween'` for 3+ keyframes. |
| `@clerk/nextjs` | latest | Auth — email/password individual accounts |
| `@neondatabase/serverless` + `drizzle-orm` | latest | Postgres via Neon HTTP driver |
| `@anthropic-ai/sdk` | latest | Claude claude-haiku-4-5 for AI intent routing |
| `resend` | latest | Email delivery for reminders |
| `canvas-confetti` | ^1.9 | Results screen only |

## Required environment variables

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY   — from Clerk dashboard
CLERK_SECRET_KEY                    — from Clerk dashboard
DATABASE_URL                        — from Neon (Vercel Marketplace integration)
ANTHROPIC_API_KEY                   — from Anthropic console
RESEND_API_KEY                      — from Resend dashboard
CRON_SECRET                         — any random string (protects /api/cron/reminders)
```

Set in Vercel dashboard under Project → Settings → Environment Variables. For local dev: `cp .env.local.example .env.local` and fill in values.

## File map

```
app/
  layout.tsx            — ClerkProvider wrapper, viewport meta, Geist font
  page.tsx              — renders <Dashboard />
  middleware.ts         — Clerk auth guard (protects all feature routes + APIs)
  (auth)/
    sign-in/[[...sign-in]]/page.tsx  — Clerk hosted sign-in
    sign-up/[[...sign-up]]/page.tsx  — Clerk hosted sign-up
  grocery/
    page.tsx            — renders <GroceryApp />
  todo/page.tsx         — to-do list UI (client, fetches /api/todo)
  reminders/page.tsx    — reminders UI (client, fetches /api/reminders)
  calendar/page.tsx     — month grid calendar UI (client, fetches /api/calendar)
  api/
    intent/route.ts     — POST: Claude haiku classifies query → { route, prefill }
    grocery/compare/route.ts  — POST: Woolworths price search, returns CompareResult
    todo/route.ts       — GET/POST/PATCH/DELETE todos
    reminders/route.ts  — GET/POST/DELETE reminders
    calendar/route.ts   — GET/POST/DELETE calendar events
    cron/reminders/route.ts  — GET: hourly cron, sends Resend emails for due reminders
  globals.css           — Tailwind import + global mobile-touch CSS + keyframes

components/
  Dashboard.tsx         — search bar + 4 feature cards (uses Clerk useUser/UserButton)
  GroceryApp.tsx        — 4-step grocery flow (no Framer Motion on interactive elements)
  StepBrainDump.tsx     — item input + quick-add chips
  StepConfirmItems.tsx  — confirm each item (CSS transitions only)
  StepLoading.tsx       — loading screen (Framer Motion OK — cosmetic only)
  StepResults.tsx       — Woolworths prices + shopping list (Coles "coming soon")

lib/
  woolworths-api.ts     — inline Woolworths search: GET /apis/ui/Search/products
  db/
    schema.ts           — Drizzle schema: todos, reminders, calendarEvents, grocerySessions
    index.ts            — Neon DB connection via drizzle-orm/neon-http
  types.ts              — CompareResult, CompareItem interfaces

vercel.json             — hourly cron for /api/cron/reminders
drizzle.config.ts       — Drizzle Kit migration config
```

## Woolworths pricing (inline fetch)

No MCP subprocess on Vercel. Direct API call:
```
GET https://www.woolworths.com.au/apis/ui/Search/products?searchTerm={query}&pageSize=5
Headers: { Accept: 'application/json', User-Agent: '...Chrome...' }
No auth, no CSRF, public endpoint.
```
Response: `data.Products[].Products[].{ DisplayName||Name, Price||InstorePrice, PackageSize }`

Implemented in `lib/woolworths-api.ts` → `searchItem(query)`.

## Coles pricing

Coles is blocked by Imperva/Incapsula on all serverless environments (TLS fingerprinting + JS challenge). Deferred to Phase 2 — will use a separate Railway microservice with headless Chrome.

Phase 1 `StepResults.tsx` shows Woolworths-only results. The Coles `StoreCompareCard` shows "Coming soon" badge when `storeName === 'coles'` and no data.

**Do not try to add fetch/axios/got calls to coles.com.au** — Incapsula will block them regardless of headers.

## AI intent routing

`POST /api/intent` uses `claude-haiku-4-5-20251001` to classify natural language queries into one of four routes: `/grocery`, `/todo`, `/reminders`, `/calendar`. Returns `{ route, prefill? }` where `prefill` is passed as a URL query param to pre-fill forms.

## Database migrations

```bash
# Generate migration after schema change
npx drizzle-kit generate

# Apply migrations to Neon
npx drizzle-kit migrate
```

Schema file: `lib/db/schema.ts`. Config: `drizzle.config.ts`.

## Cron job

`vercel.json` configures an hourly cron at `GET /api/cron/reminders`. The endpoint is protected by `Authorization: Bearer {CRON_SECRET}` header (Vercel sends this automatically if `CRON_SECRET` env var is set in the project). It:
1. Queries `reminders` where `remind_at <= now() AND sent = false`
2. Sends email via Resend
3. Marks reminder as `sent = true`

## Clerk auth

- Routes protected by `middleware.ts` using `clerkMiddleware()` + `createRouteMatcher`
- Cron route `/api/cron/reminders` is NOT protected by Clerk (uses `CRON_SECRET` bearer token instead)
- User email for reminders is fetched via `currentUser()` at reminder creation time and stored in the `reminders.email` column — no Clerk API call needed at send time

## Mobile-specific rules (important)

**touch-action: manipulation**
Set globally in `globals.css`. Do not remove.

**No backdrop-filter on sticky elements**
`backdrop-filter: blur()` on a `sticky` element swallows all touch events on Android Chrome. Never add `backdrop-blur-*` to any sticky header.

**No maximumScale in viewport**
The viewport export must stay as `{ width: "device-width", initialScale: 1 }`.

**Clipboard fallback**
`navigator.clipboard` requires HTTPS. All clipboard writes use the `execCopy` fallback pattern in `StepResults.tsx`.

**Framer Motion restrictions**
- Never use `whileTap` — conflicts with Android touch routing
- Never use `layout` prop on list items — composited layers intercept touch
- Never use `AnimatePresence` on step-level transitions
- Safe: cosmetic animations on non-interactive elements (loading screen, collapsible height)

## Framer Motion v12 gotchas

- 3-keyframe springs crash: use `type:'tween'` with `repeatType:'mirror'` or 2-keyframe arrays only
- `AnimatePresence` + `initial={false}` needed on mobile for animations to fire during hydration

## TypeScript gotchas

- Drizzle query results are typed via schema inference — avoid `as any`
- Clerk `auth()` returns `{ userId: string | null }` — always check for null before DB queries
- `currentUser()` is async and calls the Clerk API — only use it where needed (e.g. reminder creation to fetch email)

## CSS / Tailwind v4 notes

- No `tailwind.config.ts` — all theme tokens go in `@theme inline {}` block in `globals.css`
- `active:scale-95` is the preferred tap feedback on buttons — pure CSS, no JS layer
