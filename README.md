<div align="center">
<img width="1200" height="475" alt="Pace Pilot Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Pace Pilot — Energy-Driven Productivity

An AI-powered productivity app that aligns your task list with your current energy level, powered by Google Gemini and built with React + TypeScript.

---

## Features

- **Energy-based task filtering** — see only tasks that match your current vibe (Low / Medium / High)
- **Pomodoro Timer** — distraction-free 25-minute focus sessions with state-based completion notice
- **End-of-Day AI Report** — Gemini generates a personalised, encouraging daily summary
- **Weekly AI Insights** — trend analysis across your daily momentum reports
- **Projects** — categorise tasks and track per-project completion rates
- **Weekly Planner** — 7-day task calendar
- **Calendar** — monthly event overview
- **Recurring Habits** — track daily / weekly / monthly habits
- **Toast notifications** — non-blocking feedback for all user actions
- **Error Boundary** — graceful fallback UI for uncaught render errors

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + React Router 7 |
| Language | TypeScript (strict mode) |
| State | Zustand |
| Styling | Tailwind CSS v3 (npm, not CDN) |
| Charts | Recharts |
| Icons | Lucide React |
| AI | Google Gemini SDK (`@google/genai`) |
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
├── constants/           # Theme classes, energy levels, music tracks
├── hooks/               # useClock, useDataLoader
├── pages/
│   ├── auth/            # LoginPage, SignupPage
│   ├── WorkdayPage.tsx
│   ├── WeeklyPlannerPage.tsx
│   ├── ProjectsPage.tsx
│   ├── CalendarPage.tsx
│   ├── RecurringTasksPage.tsx
│   ├── ReportsPage.tsx
│   └── ProfilePage.tsx
├── services/            # geminiService (AI API calls)
├── store/               # Zustand appStore
├── types/               # Shared TypeScript interfaces
├── App.tsx              # Router + shell layout
├── index.css            # Tailwind directives + global styles
└── main.tsx             # React DOM entry point
public/
└── Mockdata.json        # Seed data (replace with a real API in production)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Google Gemini API key — [get one free at Google AI Studio](https://aistudio.google.com/app/apikey)

### Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd pacepilot

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and set VITE_GEMINI_API_KEY=your_key_here

# 4. Start development server
npm run dev
# → http://localhost:3000
```

### Build for production

```bash
npm run build
npm run preview   # preview the production bundle locally
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_GEMINI_API_KEY` | Yes | Google Gemini API key |

> **Security note:** Vite embeds `VITE_*` variables into the client bundle at build time — your key is visible in the built JavaScript. For a production deployment, proxy Gemini API calls through a server-side backend to keep the key private.

---

## Development Notes

- **Mock data** is loaded from `public/Mockdata.json`. Replace `src/hooks/useDataLoader.ts` with real API calls when connecting a backend.
- **Auth** is simulated (demo user is hardcoded). Integrate a real auth provider (e.g. Supabase, Firebase, NextAuth) before shipping.
- **Gemini models** used: `gemini-2.0-flash` (task suggestions + daily reports) and `gemini-1.5-pro` (weekly insights).
