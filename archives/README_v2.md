# Discipliner

A React + TypeScript monthly calendar app for tracking daily habits across multiple custom-named trackers. Each "discipliner" (tab) has its own fields, its own calendar, and its own data — fully isolated.

## Features

- **Multi-tab**: switch between Gym, Learning, and up to 3 custom discipliners (5 total)
- **Custom discipliners**: create with a tab name and 1–5 field names; edit names; delete entirely
- **Per-discipliner calendar**: tap any day to set green / yellow / red status for each field
- **Fully isolated data**: each tab has its own Firestore subcollection and localStorage key
- **Presets**: Gym (locked) and Learning (editable name + fields, not deletable)
- **Dark mode** toggle with system preference detection
- **Google Sign-In**: data syncs per user via Firestore; falls back to localStorage offline

## Tech Stack

| Layer | Tech |
|---|---|
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`, CSS-based config) |
| Backend | Firebase Firestore (optional) + localStorage fallback |
| Auth | Firebase Auth — Google Sign-In |
| Build | Vite 8 |
| Deploy | GitHub Pages via GitHub Actions |

## Architecture

### Component Tree

```
App
├── [header]  <h1>Discipliner</h1>  +  UserMenu
│
├── DisciplinerTabs
│   ├── [tab button] Gym            (no edit icon — fully locked)
│   ├── [tab button] Learning  ✏   (edit icon — name+fields editable)
│   ├── [tab button] <custom>  ✏   (edit icon — full edit + delete)
│   └── [+]  Add discipliner        (hidden when 5 tabs exist)
│
├── CalendarHeader
│   └── ← June 2026 →  +  🌙 dark mode toggle
│
├── Calendar
│   └── DayCell ×28-31
│       └── N dynamic color stripes (one per field)
│
├── StatusModal?          — day detail: field rows × 3 color buttons
├── CreateDisciplinerModal?  — tab name + 1-5 field names
└── EditDisciplinerModal?    — rename, add/remove fields, delete discipliner
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
```

### Storage Layout

```
Firestore
└── users/{uid}/
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
├── App.tsx                          # Top-level state + layout orchestration
├── types.ts                         # All shared types
├── firebase.ts                      # Firebase init + isFirebaseConfigured flag
│
├── hooks/
│   ├── useDiscipliners.ts           # Config persistence; discipliner CRUD
│   ├── useMonthData.ts              # Per-discipliner calendar data (Firestore + localStorage)
│   ├── useAuth.ts                   # Firebase Google Auth
│   └── useTheme.ts                  # Dark mode toggle
│
├── components/
│   ├── DisciplinerTabs.tsx          # Tab bar + "+" button
│   ├── CreateDisciplinerModal.tsx   # Create new discipliner
│   ├── EditDisciplinerModal.tsx     # Edit/delete discipliner
│   ├── Calendar.tsx                 # 7-col month grid
│   ├── CalendarHeader.tsx           # Month nav + theme toggle
│   ├── DayCell.tsx                  # Dynamic N-stripe day cell
│   ├── StatusModal.tsx              # Per-day status picker
│   └── UserMenu.tsx                 # Sign in/out
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

## Commands

```bash
npm run dev      # Vite dev server with HMR (http://localhost:5173)
npm run build    # Type-check (tsc -b) then Vite build
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

All optional — app falls back to localStorage-only mode when absent.

## Deployment

GitHub Pages via `.github/workflows/deploy.yml`. Vite `base` is set to `/gymDiscipliner/` to match the repo name.

## Migration

Existing gym data (from v1) is migrated automatically on first access:
- **localStorage**: `gymDescipliner_days` → `discipliner_gym_days`
- **Firestore**: `users/{uid}/days/*` → `users/{uid}/discipliners/gym/days/*` (lazy, per month, with a localStorage flag to prevent re-runs)

## Archives

- [`archives/README_v1.md`](archives/README_v1.md) — original gymDiscipliner (single tracker, v1)
