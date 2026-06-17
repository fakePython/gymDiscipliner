# Discipliner

A React + TypeScript monthly calendar app for tracking daily habits across multiple custom-named trackers. Each "discipliner" (tab) has its own fields, its own calendar, and its own data — fully isolated. Includes an admin dashboard for monitoring all users.

## Features

- **Multi-tab**: switch between Gym, Learning, and up to 3 custom discipliners (5 total)
- **Custom discipliners**: create with a tab name and 1–5 field names; edit names; delete entirely
- **Per-discipliner calendar**: tap any day to set green / yellow / red status for each field
- **Fully isolated data**: each tab has its own Firestore subcollection and localStorage key
- **Presets**: Gym (locked) and Learning (editable name + fields, not deletable)
- **Dark mode** toggle with system preference detection
- **Google Sign-In**: data syncs per user via Firestore; falls back to localStorage offline
- **Admin dashboard**: role-protected `/admin` route with user list, global stats, and per-user analytics

## Tech Stack

| Layer | Tech |
|---|---|
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`, CSS-based config) |
| Routing | react-router-dom v7 |
| Backend | Firebase Firestore (optional) + localStorage fallback |
| Auth | Firebase Auth — Google Sign-In |
| Build | Vite 8 |
| Deploy | GitHub Pages via GitHub Actions |

## Architecture

### Component Tree

```
BrowserRouter (basename=/gymDiscipliner)
├── / → App
│   ├── [header]  <h1>Discipliner</h1>  +  UserMenu
│   │
│   ├── DisciplinerTabs
│   │   ├── [tab button] Gym            (no edit icon — fully locked)
│   │   ├── [tab button] Learning  ✏   (edit icon — name+fields editable)
│   │   ├── [tab button] <custom>  ✏   (edit icon — full edit + delete)
│   │   └── [+]  Add discipliner        (hidden when 5 tabs exist)
│   │
│   ├── CalendarHeader
│   │   └── ← June 2026 →  +  🌙 dark mode toggle
│   │
│   ├── Calendar
│   │   └── DayCell ×28-31
│   │       └── N dynamic color stripes (one per field)
│   │
│   ├── StatusModal?             — day detail: field rows × 3 color buttons
│   ├── CreateDisciplinerModal?  — tab name + 1-5 field names
│   └── EditDisciplinerModal?    — rename, add/remove fields, delete discipliner
│
└── /admin → AdminGuard → AdminPage
    ├── GlobalStatsCards         — total users, total entries, top discipliners
    ├── UserListTable            — all users with join date + last active
    └── UserDetailDrawer         — per-user field analytics + streaks
```

### Data Flow

```
useDiscipliners(uid)
  └─ merges: [GYM_PRESET, LEARNING_PRESET+overrides, ...config.custom]
  └─ persists DisciplinerConfig → Firestore + localStorage

        ↓ activeDiscipliner

useMonthData(disciplinerId, year, month, uid)
  └─ Firestore: users/{uid}/discipliners/{id}/days/{YYYY-MM-DD}
  └─ localStorage: discipliner_{id}_days
  └─ returns: Map<dateStr, DayEntry>  +  updateStatus(dateStr, fieldId, status)

        ↓

Calendar(fields, data) → DayCell(fields, entry)
StatusModal(discipliner, entry, onUpdate)

useAdminData()  [admin only]
  └─ collectionGroup('profile')       → user list
  └─ collectionGroup('days')          → total entry count
  └─ collectionGroup('disciplinerConfig') → top discipliner names
```

### Storage Layout

```
Firestore
└── users/{uid}/
    ├── profile/v1                    ← { role, createdAt, displayName, email }
    ├── disciplinerConfig/v1          ← DisciplinerConfig (tab names, field labels, custom list)
    └── discipliners/
        ├── gym/days/{YYYY-MM-DD}     ← { gym, diet, sleep }
        ├── learning/days/{YYYY-MM-DD}
        └── {uuid}/days/{YYYY-MM-DD} ← custom discipliners

localStorage
├── discipliner_config               ← DisciplinerConfig (offline fallback)
├── discipliner_gym_days             ← { [YYYY-MM-DD]: DayEntry }
├── discipliner_learning_days
├── discipliner_{uuid}_days
└── discipliner_theme                ← 'light' | 'dark'
```

### Key Types

```typescript
type Status = 'green' | 'yellow' | 'red' | 'none';
type DayEntry = Record<string, Status>;  // { [fieldId]: status }

interface DisciplinerField {
  id: string;     // stable UUID — never changes even when label is renamed
  label: string;  // display name (editable for non-Gym presets)
}

interface Discipliner {
  id: string;            // 'gym' | 'learning' | uuid
  name: string;          // tab label
  fields: DisciplinerField[];  // max 5
  isPreset: boolean;
  nameEditable: boolean;
  fieldsEditable: boolean;
}

interface DisciplinerConfig {
  learningOverride?: { name?: string; fields?: DisciplinerField[] };
  custom: Discipliner[];
}
```

### Key Files

```
src/
├── App.tsx                          # Top-level routing + state + layout orchestration
├── types.ts                         # All shared types
├── firebase.ts                      # Firebase init + isFirebaseConfigured flag
│
├── hooks/
│   ├── useDiscipliners.ts           # Config persistence; discipliner CRUD
│   ├── useMonthData.ts              # Per-discipliner calendar data (Firestore + localStorage)
│   ├── useAuth.ts                   # Firebase Google Auth + profile seeding
│   ├── useTheme.ts                  # Dark mode toggle
│   ├── useAdminRole.ts              # Reads users/{uid}/profile/v1 → isAdmin
│   └── useAdminData.ts              # Fetches all users' data for admin dashboard
│
├── components/
│   ├── DisciplinerTabs.tsx          # Tab bar + "+" button
│   ├── CreateDisciplinerModal.tsx   # Create new discipliner
│   ├── EditDisciplinerModal.tsx     # Edit/delete discipliner
│   ├── Calendar.tsx                 # 7-col month grid
│   ├── CalendarHeader.tsx           # Month nav + theme toggle
│   ├── DayCell.tsx                  # Dynamic N-stripe day cell
│   ├── StatusModal.tsx              # Per-day status picker
│   ├── UserMenu.tsx                 # Sign in/out
│   └── admin/
│       ├── AdminGuard.tsx           # Route guard — 403 for non-admins
│       ├── GlobalStats.tsx          # Stat cards: users, entries, top discipliners
│       ├── UserListTable.tsx        # Sortable table of all users
│       └── UserDetailDrawer.tsx     # Per-user field analytics + streak
│
├── pages/
│   └── AdminPage.tsx                # /admin route — assembles admin components
│
└── utils/
    ├── constants.ts                 # STATUS_COLORS, STATUS_LABELS, GYM_PRESET, LEARNING_PRESET
    └── dateHelpers.ts               # toDateStr, getDaysInMonth, getFirstDayOfWeek, isToday
```

### Preset Rules

| Discipliner | Delete | Rename tab | Edit fields |
|---|---|---|---|
| Gym | ✗ | ✗ | ✗ |
| Learning | ✗ | ✓ | ✓ |
| Custom | ✓ | ✓ | ✓ |

## Admin Dashboard

The `/admin` route is protected by `AdminGuard` — only users with `role: 'admin'` in their Firestore profile can access it.

### Promoting a user to admin

1. Sign in to the app at least once (this creates `users/{uid}/profile/v1`)
2. In the Firebase console → Firestore → `users/{uid}/profile/v1`, set `role` to `"admin"`

### Firestore Security Rules

Two things to enforce: (1) users can only read/write their own data, and (2) the `role` field can never be written by the client. The admin dashboard's user listing uses a `collectionGroup('profile')` query, which requires a recursive-wildcard rule on the `profile` collection name.

The `users/{uid}/days/...` rule is for **v1 legacy data** — `useMonthData` still reads/writes that path during the lazy v1→v2 migration. Keep this rule until you're sure no users have legacy data left.

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // v1 legacy path — read/write needed for the lazy migration in useMonthData.
    match /users/{userId}/days/{dateStr} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // v2 day data. Admin gets read access so the dashboard can compute stats.
    match /users/{userId}/discipliners/{disciplinerId}/days/{dateStr} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)/profile/v1).data.role == 'admin';
    }

    // Discipliner config. Admin gets read access for the user-detail drawer
    // and top-discipliners aggregation.
    match /users/{userId}/disciplinerConfig/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)/profile/v1).data.role == 'admin';
    }

    // Profile / role storage.
    match /users/{userId}/profile/{docId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      // Profile is writable by the user, but `role` is not.
      // resource == null covers first-time creation by useAuth.
      allow write: if request.auth != null
        && request.auth.uid == userId
        && (resource == null || !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']));
    }

    // Admin user listing — authorizes collectionGroup('profile').
    // The admin dashboard no longer uses collectionGroup for `days` or
    // `disciplinerConfig` (it iterates per user), so only `profile` needs
    // a recursive rule here.
    match /{path=**}/profile/{docId} {
      allow read: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)/profile/v1).data.role == 'admin';
    }
  }
}
```

**Why the recursive rule is required.** A normal `match /users/{userId}/profile/{docId}` rule only authorizes path-based reads (`doc(...)` or `getDocs(collection(...))`). It does NOT authorize `collectionGroup('profile')`. For that, Firestore needs a rule whose path is `match /{path=**}/profile/{docId}` — same final segment, parent wildcard.

**When to drop the v1 `users/{userId}/days` rule.** Once every active user's localStorage carries the per-month migration flags (`discipliner_gym_migrated_YYYY-MM`) for every month they had data, the v1 collection in Firestore is empty and the rule can be removed. Until then, removing the rule will silently break the migration: `useMonthData` reads from v1 to copy into v2, that read fails with `permission-denied`, and existing users see empty calendars for unmigrated months.

### Profile auto-creation

`useAuth` seeds `users/{uid}/profile/v1` on the user's first sign-in (when `getDoc(...).exists()` is false). Subsequent sign-ins only refresh `displayName`/`email` via a merge write that excludes `role` and `createdAt`. This means:
- Users who signed in before this profile system was added get a profile created the next time they log in (with `role: 'user'`).
- An admin promoted via the Firebase console stays an admin — the client never overwrites `role`.

## Commands

```bash
npm run dev      # Vite dev server with HMR (http://localhost:5173/)
npm run build    # Type-check (tsc -b) then Vite build
npm run lint     # ESLint
npm run preview  # Serve production build locally
```

### Local dev without Firebase

Navigate to `http://localhost:5173/admin?admin=1` to bypass the auth guard and preview the admin UI with empty data. This bypass is only active when Firebase env vars are absent — it is inert in production.

## Environment Variables

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

All optional — app falls back to localStorage-only mode when absent.

## Deployment

Deployed via **Vercel**. On every push to `main`, Vercel automatically builds and deploys. Routes work natively — no hacks needed.

The `vercel.json` rewrite rule serves `index.html` for all paths, enabling client-side routing:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

The old GitHub Pages workflow (`.github/workflows/deploy.yml`) is kept in the repo but disabled. The `gh-pages` branch serves a redirect page pointing to the Vercel URL so old bookmarks continue to work.

### Why Vercel instead of GitHub Pages

GitHub Pages is a static file server — it returns 404 for any path that doesn't map to a physical file. This breaks client-side routing: visiting `/admin` directly or refreshing on any non-root route fails. The common workaround (copying `index.html` → `404.html`) is fragile and causes real 404s to silently return 200. Vercel handles SPA routing natively with a single rewrite rule, gives preview deployments per PR, and has no meaningful cost for personal projects.

### Reverting to GitHub Pages

If Vercel is ever abandoned, here's everything needed to go back:

1. **`vite.config.ts`** — restore `base: '/gymDiscipliner/'`
2. **`src/main.tsx`** — restore `basename="/gymDiscipliner/"` on `<BrowserRouter>`
3. **`src/components/admin/AdminGuard.tsx`** — change `href="/"` back to `href="/gymDiscipliner/"`
4. **`src/pages/AdminPage.tsx`** — change `href="/"` back to `href="/gymDiscipliner/"`
5. **`vite.config.ts`** — add the 404.html copy plugin to handle client-side routing:
   ```ts
   import { resolve } from 'path'
   import { copyFileSync } from 'fs'
   // inside plugins array:
   {
     name: 'copy-404',
     closeBundle() {
       copyFileSync(resolve(__dirname, 'dist/index.html'), resolve(__dirname, 'dist/404.html'));
     },
   }
   ```
6. **`.github/workflows/deploy.yml`** — remove the `if: false` line from the deploy job
7. **`vercel.json`** — can be deleted or left (ignored when repo is disconnected from Vercel)

## Migration

Existing gym data (from v1) is migrated automatically on first access:
- **localStorage**: `gymDescipliner_days` → `discipliner_gym_days`
- **Firestore**: `users/{uid}/days/*` → `users/{uid}/discipliners/gym/days/*` (lazy, per month, with a localStorage flag to prevent re-runs)

## Archives

- [`archives/README_v1.md`](archives/README_v1.md) — original gymDiscipliner (single tracker, v1)
- [`archives/README_v2.md`](archives/README_v2.md) — multi-tab discipliner, GitHub Pages deployment, no admin dashboard
