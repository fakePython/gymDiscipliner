# gymDiscipliner — v1 Archive

> This document captures the original gymDiscipliner app before it was refactored into the multi-tab **Discipliner** app.

## Overview

A React + TypeScript monthly calendar app to track three daily habits: **Gym**, **Diet**, and **Sleep**. Each day is tapped to set each category to one of three color-coded statuses.

## Tech Stack

| Layer | Tech |
|---|---|
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v4 (CSS-based config, `@tailwindcss/vite` plugin) |
| Backend | Firebase Firestore (optional) + localStorage fallback |
| Auth | Firebase Auth (Google Sign-In) |
| Build | Vite |
| Deploy | GitHub Pages via GitHub Actions |

## Features

- Monthly calendar view with previous/next month navigation
- Tap any day to open a status modal and set Gym / Diet / Sleep
- Three status colors: **Green** (Done), **Yellow** (Partial), **Red** (Skipped)
- Each day cell shows three color strips side-by-side
- Dark mode toggle (persists via `gymDescipliner_theme` in localStorage)
- Google Sign-In (when Firebase is configured); data syncs per user
- Graceful offline-first fallback to localStorage when Firebase is absent

## Architecture

```
App
├── CalendarHeader          — month nav (< >) + dark mode toggle
├── Calendar                — 7-col grid of DayCells
│   └── DayCell (×28-31)   — 3 fixed color stripes: gym | diet | sleep
├── StatusModal (conditional) — set status per category for a selected day
└── UserMenu                — Google Sign-In / Sign-Out
```

### Data Types

```typescript
type Status   = 'green' | 'yellow' | 'red' | 'none';
type Category = 'gym' | 'diet' | 'sleep';

interface DayEntry {
  gym:   Status;
  diet:  Status;
  sleep: Status;
}
```

### Storage

| Store | Key / Path | Contents |
|---|---|---|
| localStorage | `gymDescipliner_days` | `{ [YYYY-MM-DD]: DayEntry }` |
| localStorage | `gymDescipliner_theme` | `'light' \| 'dark'` |
| Firestore | `users/{uid}/days/{YYYY-MM-DD}` | `DayEntry` fields |

### Key Files

```
src/
├── App.tsx                     # Top-level state + layout
├── types.ts                    # Status, Category, DayEntry
├── firebase.ts                 # Firebase init + isFirebaseConfigured flag
├── hooks/
│   ├── useMonthData.ts         # Dual-backend data hook (Firestore + localStorage)
│   ├── useAuth.ts              # Firebase Google Auth
│   └── useTheme.ts             # Dark mode toggle
├── components/
│   ├── Calendar.tsx            # 7-col grid
│   ├── CalendarHeader.tsx      # Month nav + theme toggle
│   ├── DayCell.tsx             # Single day with 3 hardcoded stripes
│   ├── StatusModal.tsx         # Status picker modal (3 categories × 3 buttons)
│   └── UserMenu.tsx            # Sign in/out
└── utils/
    ├── constants.ts            # STATUS_COLORS, STATUS_LABELS, CATEGORIES, CATEGORY_LABELS
    └── dateHelpers.ts          # toDateStr, getDaysInMonth, getFirstDayOfWeek, isToday
```

## Commands

```bash
npm run dev      # Vite dev server with HMR
npm run build    # tsc -b && vite build
npm run lint     # ESLint
npm run preview  # Serve production build locally
```

## Environment Variables

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

All optional — app falls back to localStorage when absent.

## Deployment

GitHub Pages via `.github/workflows/deploy.yml`. Vite `base` is set to `/gymDiscipliner/` to match the repo name.
