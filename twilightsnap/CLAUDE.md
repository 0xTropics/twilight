# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server on localhost:3000
npm run build    # Production build (also runs TypeScript + ESLint checks)
npm run lint     # ESLint only
```

There are no tests configured. `npm run build` is the primary verification step.

## Architecture

**TwilightSnap** is a SaaS app that converts daytime real estate photos into blue-hour/twilight shots using OpenAI's `gpt-image-1` image editing API. Built with Next.js 14 App Router, TypeScript (strict), Tailwind CSS v3, and Supabase.

### Route Groups

- `(auth)` — Login, signup, OAuth callback. Public pages.
- `(dashboard)` — Protected user pages (convert, gallery, credits, dashboard). Auth gate in layout via `supabase.auth.getUser()`, redirects to `/login`.
- `(admin)` — Admin panel. Auth gate checks `profiles.role = 'admin'`, silently redirects non-admins to `/dashboard`.

### Supabase Clients (4 variants in `src/lib/supabase/`)

- `client.ts` — Browser client (`createBrowserClient`) for client components
- `server.ts` — Server client (`createServerClient` from `@supabase/ssr`) with cookie handling for server components/actions
- `middleware.ts` — Session refresh client used by root middleware
- `admin.ts` — Service role client (`SUPABASE_SERVICE_ROLE_KEY`) that bypasses RLS. Used by API routes and admin queries.

### Key Data Flow

**Conversion pipeline** (`/api/convert`): Auth → validate file → check credits → upload original to Supabase Storage → create conversion record (status: processing) → call OpenAI `images.edit` → upload result → update record to completed → deduct credit → log transaction + API call. Credits only deducted after successful conversion.

**Payment flow** (`/api/stripe/*`): Client POST to `/checkout` → Stripe Checkout Session created → redirect to Stripe → webhook (`checkout.session.completed`) fulfills credits → redirect back to `/credits?session_id=` → `/verify` endpoint ensures credits are added even if webhook is delayed. Idempotency via `stripe_payment_intent_id` check.

### Database Tables (public schema, RLS enabled)

- `profiles` — User info, `role` enum (`user`/`admin`)
- `credits` — Per-user `balance` and `lifetime_purchased`
- `transactions` — Credit ledger: `type` enum (`purchase`/`usage`/`refund`/`bonus`)
- `conversions` — Conversion records with `status` enum, image URLs, processing metadata
- `api_logs` — OpenAI API call tracking (latency, cost, errors)

Type definitions: `src/types/database.ts`. Convenience aliases: `Profile`, `Credits`, `Transaction`, `Conversion`, `ApiLog`.

### Admin API Pattern

All admin API routes (`/api/admin/*`) use `verifyAdmin()` from `src/lib/admin/verify.ts` which checks auth + admin role. Admin pages are client components that fetch from these API routes.

## Conventions

- **Dark-only theme**: bg `#020617`, card `#1E293B`, border `#334155`, primary `#F59E0B` (amber), text `#F8FAFC`. No light mode.
- **Tailwind v3** with `tailwindcss-animate` plugin. CSS variables defined in `globals.css`. Do NOT use Tailwind v4 syntax.
- **shadcn/ui**: new-york style, slate base. Only `button.tsx` is installed — use it via `class-variance-authority`.
- **`@supabase/supabase-js`** pinned to v2.49.4 for compatibility with `@supabase/ssr` v0.9.0. Do not upgrade without testing `.from()` type resolution.
- **TypeScript strict**: No `any` types. Use `Array.from(new Set(...))` instead of `[...new Set(...)]` (tsconfig target doesn't support Set spreading).
- **Path alias**: `@/*` maps to `./src/*`.
- Images stored in Supabase Storage bucket `images`, public URLs: `${SUPABASE_URL}/storage/v1/object/public/images/${path}`.
- OpenAI prompt lives in `src/lib/openai/client.ts` as `TWILIGHT_PROMPT` constant.
- Credit packs configured in `src/lib/stripe/config.ts`.

## Environment Variables

Required in `.env.local` (see `.env.local.example`):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET` (optional for local dev — webhook skips signature verification if empty)
- `NEXT_PUBLIC_APP_URL` (defaults to request origin if not set)
