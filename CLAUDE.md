# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start local dev server (http://localhost:3000)
- `npm run build` — Production build (used by Vercel)
- `npm run lint` — ESLint
- `vercel --prod --yes` — Deploy to production (https://badge-app-ten.vercel.app)

## Architecture

**BadgeBoard** is a gamified community badge app where interns earn badges for new experiences, share learnings, and compete on a sash-based leaderboard.

**Stack:** Next.js 16 (App Router, Turbopack) + Tailwind CSS v4 + Supabase (Postgres, Auth, Storage) + Google Gemini 2.5 Flash for AI badge image generation. Deployed on Vercel.

### Two Supabase Client Pattern

- `src/lib/supabase/server.ts` — Server Components and Server Actions. Uses `await cookies()` (async, Next.js 15+).
- `src/lib/supabase/client.ts` — Client Components (`"use client"`). Browser-side, synchronous.
- `src/lib/supabase/middleware.ts` — Session refresh + auth redirect logic. Public routes: `/`, `/login`, `/join`, `/auth`, `/api`, `/spectate`.

Always import from `@/lib/supabase/server` in Server Components and `@/lib/supabase/client` in Client Components. Never mix them.

### Route Group: `(authenticated)`

All protected pages live under `src/app/(authenticated)/`. The group layout (`layout.tsx`) checks auth, fetches admin status, and renders the shared `<Nav>` bar. The parentheses mean the folder name doesn't appear in URLs — `/dashboard`, not `/(authenticated)/dashboard`.

### AI Badge Image Generation

`src/app/api/generate-badge/route.ts` — POST endpoint. Uses `@google/genai` SDK (NOT the deprecated `@google/generative-ai`). Model: `gemini-2.5-flash-image`. Clients (Gemini + Supabase admin) are **lazy-initialized** to avoid build-time crashes when env vars aren't available.

The Supabase admin client uses `createClient` without generic DB types, so `.from()` returns `never`. Use `as any` cast for mutations — this is intentional since it bypasses RLS with the service role key.

Image generation is **fire-and-forget** from the earn page — the badge is awarded instantly, image generates async in background.

### Database Schema

Defined in `supabase/schema.sql`. Four tables:
- `profiles` — auto-created via trigger from `auth.users`, has `display_name`, `is_admin`
- `badges` — shared definitions (name, task, image_url)
- `user_badges` — who earned what + personal `learning` text. UNIQUE(user_id, badge_id).
- `spectator_links` — shareable codes for read-only public access. Admin-only CRUD via RLS.

Two views: `leaderboard` (profiles + badge count DESC), `recent_activity` (last 50 awards with joins).

RLS is enabled on all tables. Users can update their own profile/user_badges, admins can delete anything.

### Theme System

`globals.css` uses CSS custom properties (`--background`, `--accent`, `--muted-foreground`, etc.) registered in a Tailwind v4 `@theme inline` block. Dark forest green (#1a2e1a) background, gold (#d4a843) accents. Use `text-muted-foreground` (not `text-muted`) for readable secondary text.

### Key Components

- `SashBoard` — Signature leaderboard. Vertical sash strips with height proportional to badge count.
- `BadgePin` — Individual badge on a sash. Deterministic rotation from ID hash. Hover tooltip.
- `BadgeModal` — Badge detail popup. Shows all earners' learnings.

### Spectator Mode

`/spectate/[code]` — Public read-only view of the leaderboard. No auth required. Uses a lazy-initialized service-role Supabase client to bypass RLS. The `spectator_links` table stores codes with optional labels and expiry dates. Admins create/delete links from the admin dashboard. `SashBoard` accepts a `spectatorMode` prop to disable profile links.

## Environment Variables

Required in `.env.local` (and Vercel dashboard):
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Public anon key (safe for browser)
- `SUPABASE_SERVICE_ROLE_KEY` — Server-only, bypasses RLS
- `GEMINI_API_KEY` — Google AI Studio key

## Deployment Notes

- Vercel project: `isiras-projects-e2c957ad/badge-app`
- Supabase project: `jazkqllvlmibegifnptb`
- Auth uses Gmail SMTP for magic links (configured in Supabase dashboard, not in code)
- The `middleware` convention triggers a Next.js 16 deprecation warning — harmless, still works
- First admin must be set manually in Supabase Table Editor (`profiles.is_admin = true`)
