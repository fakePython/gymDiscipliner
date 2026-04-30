# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — type-check with `tsc -b` then build with Vite
- `npm run lint` — ESLint across the project
- `npm run preview` — serve the production build locally

## Architecture

A React + TypeScript habit tracker (gym, diet, sleep) displayed as a monthly calendar. Users tap a day to set each category to green/yellow/red.

**Data layer:** `useMonthData` hook reads/writes to Firebase Firestore (`days` collection, document ID = `YYYY-MM-DD`). Falls back to localStorage when Firebase env vars are absent — this makes local dev work without any backend setup.

**Firebase config:** All credentials come from `VITE_FIREBASE_*` env vars (see `src/firebase.ts`). The app gracefully degrades to localStorage-only mode when these are missing.

**Styling:** Tailwind CSS v4 via the `@tailwindcss/vite` plugin — no `tailwind.config` file; configuration is in `src/index.css` using the new CSS-based config.

**Deployment:** GitHub Pages via Actions (`.github/workflows/deploy.yml`). The Vite `base` is set to `/gymDiscipliner/` to match the repo name.

## Key Conventions

- Date strings are formatted as `YYYY-MM-DD` everywhere (see `toDateStr` in `src/utils/dateHelpers.ts`)
- Status type is `'green' | 'yellow' | 'red' | 'none'`; categories are `'gym' | 'diet' | 'sleep'`
- Dark mode uses Tailwind's `dark:` variant toggled by a class on `<html>`
- localStorage keys are prefixed with `gymDescipliner_`
