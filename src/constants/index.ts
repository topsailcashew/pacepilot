import type { TaskZone, User } from '@/types';

export const DEMO_USER: User = {
  id: 'demo',
  name: 'Nathaniel (Demo)',
  email: 'demo@pacepilot.com',
  streak: 12,
  preferences: { startTime: '08:00', endTime: '18:00', dailyGoal: 8 },
};

export interface ZoneMeta {
  label: string;
  description: string;
  hours: string;
  /** Tailwind bg class for filled/active state */
  bg: string;
  /** Tailwind text class */
  text: string;
  /** Tailwind border class */
  border: string;
  /** Tailwind subtle bg for chips/badges */
  chipBg: string;
}

export const ZONES: Record<TaskZone, ZoneMeta> = {
  Blue: {
    label: 'Blue Zone',
    description: 'My Passions',
    hours: '04:00–07:00',
    bg: 'bg-blue-500',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    chipBg: 'bg-blue-500/10',
  },
  Green: {
    label: 'Green Zone',
    description: 'High Impact',
    hours: '07:00–11:00',
    bg: 'bg-green-500',
    text: 'text-green-400',
    border: 'border-green-500/30',
    chipBg: 'bg-green-500/10',
  },
  Grey: {
    label: 'Grey Zone',
    description: 'Collab Tasks',
    hours: '11:00–13:00',
    bg: 'bg-slate-400',
    text: 'text-slate-400',
    border: 'border-slate-400/30',
    chipBg: 'bg-slate-400/10',
  },
  Yellow: {
    label: 'Yellow Zone',
    description: 'Low Impact',
    hours: '13:00–17:00',
    bg: 'bg-yellow-400',
    text: 'text-yellow-400',
    border: 'border-yellow-400/30',
    chipBg: 'bg-yellow-400/10',
  },
  Red: {
    label: 'Red Zone',
    description: 'Other',
    hours: '17:00–21:00',
    bg: 'bg-red-500',
    text: 'text-red-400',
    border: 'border-red-500/30',
    chipBg: 'bg-red-500/10',
  },
};

export const ZONE_KEYS: TaskZone[] = ['Blue', 'Green', 'Grey', 'Yellow', 'Red'];

/** Shared Tailwind class strings for consistent theming */
export const THEME = {
  card: 'bg-prussianblue border border-white/5 rounded-xl p-8 shadow-xl shadow-black/20',
  innerCard:
    'bg-white/[0.03] border border-white/5 rounded-lg p-5 transition-all duration-300',
  buttonPrimary:
    'bg-pilot-orange hover:bg-pilot-orange/90 text-white font-bold rounded-lg transition-all active:scale-[0.98]',
  buttonSecondary:
    'bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-bold rounded-lg transition-all',
  buttonDestructive:
    'bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-lg hover:bg-red-500/20 transition-all',
  input:
    'bg-deepnavy border border-white/10 focus:border-pilot-orange/50 rounded-lg px-4 py-3 text-sm text-white focus:outline-none transition-all placeholder:text-white/10',
  label:
    'text-[10px] font-black uppercase tracking-[0.2em] text-white/30',
} as const;
