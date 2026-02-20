<div align="center">
<img width="1200" height="475" alt="Pace Pilot Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Pace Pilot — Energy-Driven Productivity

An AI-powered productivity app that aligns your task list with your current energy level, powered by **Google Gemini** for AI insights, **Appwrite** for auth + persistent storage, and deployed via **Appwrite Sites** (hosting).

---

## Features

- **Energy-based task filtering** — see only tasks that match your current vibe (Low / Medium / High)
- **Pomodoro Timer** — distraction-free 25-minute focus sessions
- **End-of-Day AI Report** — Gemini generates a personalised daily summary
- **Weekly AI Insights** — trend analysis across momentum reports
- **Projects** — categorise tasks, track per-project completion
- **Weekly Planner** — 7-day task calendar view
- **Calendar** — monthly event overview
- **Recurring Habits** — daily / weekly / monthly habit tracker
- **Real Auth** — Appwrite email/password accounts (with demo mode for local dev)
- **Persistent Data** — all tasks, projects, and habits stored in Appwrite Database
- **Toast notifications** — non-blocking feedback for every user action
- **Error Boundary** — graceful fallback UI for uncaught render errors

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + React Router 7 |
| Language | TypeScript (strict mode) |
| State | Zustand (optimistic updates) |
| Styling | Tailwind CSS v3 (npm) |
| Charts | Recharts |
| Icons | Lucide React |
| AI | Google Gemini SDK (`@google/genai`) |
| Backend / Auth | Appwrite Cloud |
| Hosting | Appwrite Sites |
| Build | Vite 6 |

---

## Project Structure

```
src/
├── components/
│   ├── layout/          # Sidebar, TopBar
│   ├── tasks/           # TaskItem
│   ├── timer/           # PomodoroTimer
│   └── ui/              # ErrorBoundary, LoadingSpinner, Modal, ToastContainer, ProtectedRoute
├── constants/           # THEME, ENERGY_LEVELS, MUSIC_TRACKS
├── hooks/               # useClock, useDataLoader
├── lib/
│   └── appwrite.ts      # Appwrite client, collection IDs, helpers
├── pages/
│   ├── auth/            # LoginPage, SignupPage
│   ├── WorkdayPage.tsx
│   ├── WeeklyPlannerPage.tsx
│   ├── ProjectsPage.tsx
│   ├── CalendarPage.tsx
│   ├── RecurringTasksPage.tsx
│   ├── ReportsPage.tsx
│   └── ProfilePage.tsx
├── services/
│   ├── appwriteService.ts   # All Appwrite DB + Auth CRUD
│   └── geminiService.ts     # Gemini AI calls
├── store/               # Zustand appStore (optimistic mutations)
├── types/               # Shared TypeScript interfaces
├── App.tsx              # Router + shell layout
├── index.css            # Tailwind directives + global styles
└── main.tsx             # React DOM entry point
public/
└── Mockdata.json        # Seed data for demo / development mode
appwrite.json            # Appwrite Sites deployment config
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Google Gemini API key — [get one free](https://aistudio.google.com/app/apikey)
- An Appwrite Cloud project — [sign up free](https://cloud.appwrite.io) *(optional for local dev)*

### 1 — Clone and install

```bash
git clone <repo-url>
cd pacepilot
npm install
```

### 2 — Configure environment

```bash
cp .env.example .env
# Edit .env and fill in your keys (see sections below)
```

### 3 — Run locally

```bash
npm run dev
# → http://localhost:3000
```

> **No Appwrite?** Leave `VITE_APPWRITE_PROJECT_ID` empty and the app runs in **demo mode** — real UI with mock data, no account required.

---

## Appwrite Setup

### A — Create a project

1. Go to [cloud.appwrite.io](https://cloud.appwrite.io) → **Create Project**
2. Copy the **Project ID** → set `VITE_APPWRITE_PROJECT_ID`

### B — Register your web platform

In your project → **Overview → Add Platform → Web**
- Set **hostname** to `localhost` for development, and your Appwrite Site domain for production.

### C — Create a database

**Databases → Create Database** → copy the **Database ID** → set `VITE_APPWRITE_DATABASE_ID`

### D — Create collections

Create each collection below with **Document Security** enabled.

#### `tasks`
| Attribute | Type | Required |
|---|---|---|
| title | String (255) | ✅ |
| description | String (1000) | |
| category | String (100) | |
| projectId | String (36) | |
| energyRequired | String (10) | ✅ |
| isCompleted | Boolean | ✅ |
| dueDate | String (30) | |
| createdAt | String (30) | ✅ |
| isRecurring | Boolean | |
| recurringInterval | String (10) | |
| eisenhower | String (50) | |
| userId | String (36) | ✅ |

#### `projects`
| Attribute | Type | Required |
|---|---|---|
| name | String (100) | ✅ |
| color | String (50) | ✅ |
| icon | String (50) | ✅ |
| userId | String (36) | ✅ |

#### `calendar_events`
| Attribute | Type | Required |
|---|---|---|
| day | Integer | ✅ |
| title | String (255) | ✅ |
| color | String (50) | ✅ |
| time | String (20) | ✅ |
| loc | String (255) | |
| userId | String (36) | ✅ |

#### `recurring_tasks`
| Attribute | Type | Required |
|---|---|---|
| task | String (255) | ✅ |
| status | String (20) | ✅ |
| last | String (50) | ✅ |
| interval | String (20) | ✅ |
| userId | String (36) | ✅ |

#### `daily_reports`
| Attribute | Type | Required |
|---|---|---|
| date | String (20) | ✅ |
| energyLevel | String (10) | ✅ |
| notes | String (2000) | |
| momentumScore | Integer | ✅ |
| aiInsights | String (2000) | |
| completedTaskIds | String[] (36 each) | |
| goals | String[] (255 each) | |
| taskBreakdown | String (5000) | |
| userId | String (36) | ✅ |

Copy each collection ID to `VITE_APPWRITE_*_COLLECTION_ID` in your `.env`.

### E — Set collection IDs

```env
VITE_APPWRITE_TASKS_COLLECTION_ID=<your-tasks-collection-id>
VITE_APPWRITE_PROJECTS_COLLECTION_ID=<your-projects-collection-id>
VITE_APPWRITE_CALENDAR_COLLECTION_ID=<your-calendar-collection-id>
VITE_APPWRITE_RECURRING_COLLECTION_ID=<your-recurring-collection-id>
VITE_APPWRITE_REPORTS_COLLECTION_ID=<your-reports-collection-id>
```

---

## Deploying to Appwrite Sites

### 1 — Install the Appwrite CLI

```bash
npm install -g appwrite-cli
```

### 2 — Login

```bash
appwrite login
```

### 3 — Link project

Edit `appwrite.json` and set `"projectId"` to your Appwrite Project ID.

### 4 — Deploy

```bash
appwrite deploy site
```

The CLI will build the app, upload the `dist/` folder, and give you a live URL.

#### Set production environment variables

In **Appwrite Console → Sites → your site → Settings → Environment Variables**, add the same variables from your `.env` file.

---

## Build locally

```bash
npm run build      # creates dist/
npm run preview    # preview the production bundle at http://localhost:4173
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `VITE_GEMINI_API_KEY` | Yes | Google Gemini API key |
| `VITE_APPWRITE_ENDPOINT` | No | Default: `https://cloud.appwrite.io/v1` |
| `VITE_APPWRITE_PROJECT_ID` | No* | Appwrite Project ID. Omit for demo mode. |
| `VITE_APPWRITE_DATABASE_ID` | No* | Appwrite Database ID |
| `VITE_APPWRITE_TASKS_COLLECTION_ID` | No* | Tasks collection ID |
| `VITE_APPWRITE_PROJECTS_COLLECTION_ID` | No* | Projects collection ID |
| `VITE_APPWRITE_CALENDAR_COLLECTION_ID` | No* | Calendar events collection ID |
| `VITE_APPWRITE_RECURRING_COLLECTION_ID` | No* | Recurring tasks collection ID |
| `VITE_APPWRITE_REPORTS_COLLECTION_ID` | No* | Daily reports collection ID |

*Required when running with Appwrite. Omit all Appwrite vars to run in demo mode.

> **Security note:** Vite embeds `VITE_*` variables into the client bundle. For production, proxy Gemini calls through a server-side function to keep that key private.
