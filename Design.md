# PacePilot Design System

This document is the authoritative reference for UI consistency. All new components and edits to existing components must follow these rules. When in doubt, check here first.

---

## 1. Theme Constants (`src/constants/index.ts`)

All shared styles live in the `THEME` object. **Never** hardcode a class string that duplicates or approximates a THEME value. Import from `@/constants`.

### Current constants

| Key | Value |
|---|---|
| `THEME.card` | `bg-prussianblue border border-white/5 rounded-xl p-8 shadow-xl shadow-black/20` |
| `THEME.innerCard` | `bg-white/[0.03] border border-white/5 rounded-lg p-5 transition-all duration-300` |
| `THEME.buttonPrimary` | `bg-pilot-orange hover:bg-pilot-orange/90 text-white font-bold rounded-lg transition-all active:scale-[0.98]` |
| `THEME.buttonSecondary` | `bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-bold rounded-lg transition-all` |
| `THEME.input` | `bg-deepnavy border border-white/10 focus:border-pilot-orange/50 rounded-lg px-4 py-3 text-sm text-white focus:outline-none transition-all placeholder:text-white/10` |
| `THEME.label` | `text-[10px] font-black uppercase tracking-[0.2em] text-white/30` |

### Required additions to `THEME`

Add the following constants to `src/constants/index.ts` to eliminate hardcoded semantic colors:

```ts
buttonDestructive:
  'bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-lg hover:bg-red-500/20 transition-all',
statusSuccess: 'text-green-400',
statusSuccessBg: 'bg-green-500',
statusError: 'text-red-400',
statusErrorBg: 'bg-red-500/10',
statusInfo: 'text-blue-400',
statusInfoBg: 'bg-blue-500/10',
progressBar: 'h-1.5 bg-white/5 rounded-full overflow-hidden',
emptyState: 'flex flex-col items-center justify-center gap-3 py-12 text-center',
emptyStateIcon: 'text-white/10',
emptyStateText: 'text-xs font-black uppercase tracking-widest text-white/20',
```

---

## 2. Colors

### Brand palette

| Token | Usage |
|---|---|
| `bg-deepnavy` | Page/app background |
| `bg-prussianblue` | Card surfaces |
| `bg-pilot-orange` | Primary actions, active states, highlights |
| `text-white` | Primary text |
| `text-white/60` | Secondary text |
| `text-white/30` | Muted/label text |
| `text-white/20` | Very muted, empty states |
| `text-white/10` | Placeholder / near-invisible detail |

### Semantic colors

Use these exact values everywhere. Do not deviate by shade (e.g., don't mix `red-400` and `red-500` for the same semantic meaning).

| Meaning | Text | Background | Border |
|---|---|---|---|
| **Destructive / Error** | `text-red-400` | `bg-red-500/10` | `border-red-500/20` |
| **Success / Complete** | `text-green-400` | `bg-green-500` | — |
| **Info / Calendar event** | `text-blue-400` | `bg-blue-500/10` | — |
| **Warning / Overdue** | `text-red-400` | `bg-red-500/10` | — |

**Rule:** All semantic color usage must map to `THEME.statusSuccess`, `THEME.statusError`, `THEME.statusInfo`, etc. once those constants are added (see §1).

### Project/event accent colors

The following palette is allowed for user-assigned colors on projects and calendar events. These are _intentionally_ raw Tailwind values because they are user-facing labels, not semantic UI states:

`bg-pilot-orange`, `bg-blue-500`, `bg-green-500`, `bg-purple-500`, `bg-pink-500`, `bg-teal-500`

---

## 3. Buttons

### Primary

```tsx
<button className={`${THEME.buttonPrimary} px-4 py-2 text-sm`}>
  Label
</button>
```

### Secondary

```tsx
<button className={`${THEME.buttonSecondary} px-4 py-2 text-sm`}>
  Label
</button>
```

### Destructive

```tsx
<button className={`${THEME.buttonDestructive} px-4 py-2 text-sm flex items-center gap-2`}>
  <Trash2 size={14} />
  Delete
</button>
```

**Rules:**
- Always use `THEME.buttonDestructive` for any red/delete button. No one-off styles.
- Icon buttons (icon-only, no label) still use the base class but remove padding and sizing is `p-1.5` or `p-2`.
- Border-radius is always `rounded-lg` from the theme string. Never override to `rounded` or `rounded-xl` on buttons.

### Loading state in buttons

Use **Pattern B** everywhere (icon + text):

```tsx
<button disabled={isLoading} className={`${THEME.buttonPrimary} px-4 py-2 text-sm flex items-center gap-2`}>
  {isLoading && <Loader2 size={14} className="animate-spin" />}
  {isLoading ? 'Saving…' : 'Save'}
</button>
```

Never use text-only loading (Pattern A — no spinner). The `WorkdayPage` energy filter button is a known exception pending fix.

---

## 4. Cards & Surfaces

### Top-level card

```tsx
<div className={THEME.card}>…</div>
```

### Nested / inner card

```tsx
<div className={THEME.innerCard}>…</div>
```

### Ad-hoc surface (use sparingly)

When a surface doesn't fit `card` or `innerCard` (e.g., a table row hover, a subtle section divider), use:

```
bg-white/[0.02] border border-white/5 rounded-xl
```

**Never** use `bg-white/[0.03]` directly — that's `THEME.innerCard`. Don't inline it.

### Modal container

```tsx
<div className="bg-deepnavy border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
  {/* header */}
  <div className="p-6 border-b border-white/5 bg-prussianblue/50">…</div>
  {/* body */}
  <div className="p-8 max-h-[80vh] overflow-y-auto">…</div>
</div>
```

### Modal backdrop

Always use `bg-black/80 backdrop-blur-sm`. The Sidebar overlay that currently uses `bg-black/60` should be updated to match.

---

## 5. Form Inputs

### Text input / textarea / select

```tsx
<input className={`${THEME.input} w-full`} />
<textarea className={`${THEME.input} w-full resize-none`} />
<select className={`${THEME.input} w-full`} />
```

All form controls use `THEME.input`. No exceptions. The `WorkdayPage` energy filter dropdown currently uses custom styling and should be migrated.

### Label

```tsx
<label className={THEME.label}>Field Name</label>
```

---

## 6. Typography

| Use | Classes |
|---|---|
| Page title | `text-3xl font-black tracking-tighter uppercase` |
| Section heading | `text-lg font-black text-white uppercase` |
| Sub-header / table heading | `text-xs font-black text-white/40 uppercase tracking-widest` |
| Body text | `text-sm text-white/60` |
| Small/muted detail | `text-xs text-white/30` |
| Empty state text | `text-xs font-black uppercase tracking-widest text-white/20` |
| Label | Use `THEME.label` |

**Muted text opacity rules** (pick the right level; don't mix arbitrarily):

| Level | Value | Meaning |
|---|---|---|
| Secondary | `text-white/60` | Supporting body copy |
| Muted | `text-white/30` | Labels, metadata |
| Very muted | `text-white/20` | Empty states, hints |
| Near-invisible | `text-white/10` | Placeholders, decorative dividers |

---

## 7. Progress Bars

Use `THEME.progressBar` as the track, with an inner fill div:

```tsx
<div className={THEME.progressBar}>
  <div
    className="h-full bg-pilot-orange rounded-full transition-all duration-500"
    style={{ width: `${pct}%` }}
  />
</div>
```

**Rules:**
- Track is always `h-1.5`. Never `h-1` or `h-3` unless it's the prominent workday hero bar (which uses `h-3` intentionally — the one exception).
- The hero workday bar (`WorkdayPage.tsx:174`) is the only `h-3` bar. It may keep `border border-white/5 shadow-inner`.
- Never add `border` or `shadow-inner` to secondary progress bars.

---

## 8. Empty States

Use the `THEME.emptyState` pattern consistently:

```tsx
<div className={THEME.emptyState}>
  <SomeIcon size={32} className={THEME.emptyStateIcon} />
  <p className={THEME.emptyStateText}>No items yet</p>
</div>
```

**Rules:**
- Always include an icon. Use a contextually relevant Lucide icon.
- Icon size is 32. Color is `THEME.emptyStateIcon` (`text-white/10`).
- Text is `THEME.emptyStateText`.
- Never use a plain table row or bare paragraph as an empty state (see `RecurringTasksPage.tsx:139` and `ProjectsPage.tsx:138` — both should be updated).

---

## 9. Icons

- **Library:** `lucide-react` only. No other icon libraries.
- **Sizing scale:**

| Context | Size |
|---|---|
| Inline / badge | 12–14 |
| Button icon | 16 |
| Standard UI | 18–20 |
| Section icon | 24 |
| Empty state / hero | 32–40 |

- **Colors:** Use semantic THEME constants or brand tokens (`text-pilot-orange`, `text-white/30`). Don't hardcode `text-red-400` etc. outside of the THEME constants.

---

## 10. Transitions & Animations

| Use | Classes |
|---|---|
| Color/bg hover | `transition-colors` |
| General interactive | `transition-all duration-300` |
| Fast micro-interaction | `transition-all duration-200` |
| Page-level / slow | `transition-all duration-500` |

**Rule:** Never mix `transition-colors` and `transition-all` on the same element. Pick one. Default to `transition-all duration-300` when unsure.

---

## 11. Known Issues (Fix Backlog)

These are confirmed inconsistencies not yet corrected in code. Address them when touching the relevant file.

| File | Issue |
|---|---|
| `src/constants/index.ts` | Add `buttonDestructive`, `statusSuccess/Error/Info`, `progressBar`, `emptyState*` constants |
| `src/pages/WorkdayPage.tsx` | Energy filter `<select>` uses custom styling — migrate to `THEME.input` |
| `src/pages/WorkdayPage.tsx` | `WorkdayPage:282` secondary progress bar uses `h-1`, should be `h-1.5` |
| `src/pages/RecurringTasksPage.tsx:139` | Empty state is a bare table row — convert to `THEME.emptyState` pattern |
| `src/pages/ProjectsPage.tsx:138` | Empty state is bare text — convert to `THEME.emptyState` pattern |
| `src/pages/CalendarPage.tsx:140` | Empty state has no icon/structure — convert to `THEME.emptyState` pattern |
| `src/components/tasks/TaskItem.tsx:106` | Checkbox uses `bg-green-500 border-green-500` — use `THEME.statusSuccessBg` once added |
| `src/components/tasks/TaskItem.tsx:286` | Delete button is custom — replace with `THEME.buttonDestructive` |
| `src/components/layout/Sidebar.tsx:43` | Backdrop uses `bg-black/60` — change to `bg-black/80` |
| `src/pages/RecurringTasksPage.tsx:130` | Delete button is custom — replace with `THEME.buttonDestructive` |
| `src/pages/CalendarPage.tsx:90` | Delete button is custom — replace with `THEME.buttonDestructive` |
| `src/pages/ProfilePage.tsx:113` | Logout button uses `text-red-500` — change to `text-red-400` (use `THEME.buttonDestructive`) |
| `src/pages/WeeklyPlannerPage.tsx:141` | Event chip text uses `text-blue-300` — align to `text-blue-400` (use `THEME.statusInfo`) |
| `src/pages/WorkdayPage.tsx` | Button loading states use text-only (Pattern A) — migrate to Pattern B (icon + text) |
