# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See `README.md` for the full architecture diagram, storage layout, and preset rules. This file covers what's not in the README.

## Commands

- `npm run dev` — Vite dev server with HMR (http://localhost:5173/)
- `npm run build` — `tsc -b` then `vite build` (type-check is part of build, not a separate script)
- `npm run lint` — ESLint
- `npm run preview` — serve the production build locally

There is no test runner configured.

## Architecture

A React 19 + TypeScript habit tracker. Each user has multiple "discipliners" (tabs); each discipliner has 1–5 fields and its own monthly calendar. Each day per field is `green | yellow | red | none`.

**Two parallel data paths.** `useMonthData` and `useDiscipliners` both read/write Firestore when `isFirebaseConfigured` is true (env vars present + `db` initialized) and fall back to localStorage otherwise. Firestore uses `onSnapshot` for live updates; the local path is a plain state read. Both paths must stay in sync — any new mutation has to write to both. Look at `useMonthData.updateStatus` for the pattern.

**Firestore layout** (per user): `users/{uid}/discipliners/{disciplinerId}/days/{YYYY-MM-DD}` for day data, `users/{uid}/disciplinerConfig/v1` for tab/field config, `users/{uid}/profile/v1` for `{ role, displayName, email, createdAt }`. The admin dashboard reads across users via `collectionGroup`, so Firestore security rules must restrict those reads to admins.

**Admin route.** `/admin` is gated by `AdminGuard`, which reads `users/{uid}/profile/v1.role`. Promotion happens manually in the Firebase console — the app never writes the `role` field, and the recommended security rule (in README) blocks user writes to it.

**Routing.** `react-router-dom` v7 with no `basename` (Vercel serves from root). `vercel.json` rewrites all paths to `index.html` so deep links work.

**Lazy migration from v1.** First-time users who had data in the old single-tracker schema get migrated automatically: `gymDescipliner_days` → `discipliner_gym_days` (localStorage, runs once via `discipliner_ls_migrated` flag) and `users/{uid}/days/*` → `users/{uid}/discipliners/gym/days/*` (Firestore, per-month, flagged in localStorage to avoid re-runs). Don't remove this until you're sure no v1 users remain.

**Styling.** Tailwind CSS v4 via `@tailwindcss/vite`. There is no `tailwind.config` file — config lives in `src/index.css`. Dark mode is a class on `<html>` toggled by `useTheme`.

## Conventions

- Date strings are `YYYY-MM-DD` everywhere; `toDateStr(year, month, day)` in `src/utils/dateHelpers.ts` is the only formatter. `month` is 0-indexed (JS `Date` convention).
- localStorage keys use the `discipliner_` prefix (e.g. `discipliner_gym_days`, `discipliner_config`, `discipliner_theme`). The legacy `gymDescipliner_` prefix only appears in the v1 migration path.
- `DisciplinerField.id` is a stable UUID. The `label` is what the user sees and can rename freely; never use `label` as a key — day entries are keyed by `id`.
- The Gym preset (`id: 'gym'`) is fully locked: no rename, no field edits, no delete. Learning is rename/field-editable but not deletable. Custom discipliners are fully editable. See `GYM_PRESET` and `LEARNING_PRESET` in `src/utils/constants.ts`; the merge logic is in `useDiscipliners`.
- Max 5 discipliners total, max 5 fields per discipliner (`MAX_DISCIPLINERS`, `MAX_FIELDS`).

## Deployment

Vercel, auto-deploys on push to `main`. The old GitHub Pages workflow at `.github/workflows/deploy.yml` is intentionally kept but disabled (`if: false`); the README has a step-by-step revert procedure if Vercel is ever abandoned. Do not re-enable the workflow or add `base` to `vite.config.ts` without following that procedure.

## Local dev without Firebase

When the `VITE_FIREBASE_*` env vars are absent, the app runs in localStorage-only mode. As an admin-UI escape hatch, `http://localhost:5173/admin?admin=1` bypasses `AdminGuard` and renders the dashboard with empty data. This bypass is inert in production (only active when Firebase is unconfigured).
