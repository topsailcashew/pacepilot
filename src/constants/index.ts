import type { EnergyLevel, User } from '@/types';

export const ENERGY_LEVELS: EnergyLevel[] = ['Low', 'Medium', 'High'];

export const DEMO_USER: User = {
  id: 'demo',
  name: 'Nathaniel (Demo)',
  email: 'demo@pacepilot.com',
  streak: 12,
  preferences: { startTime: '08:00', endTime: '18:00', dailyGoal: 8 },
};

/** Shared Tailwind class strings for consistent theming */
export const THEME = {
  card: 'bg-prussianblue border border-white/5 rounded-xl p-8 shadow-xl shadow-black/20',
  innerCard:
    'bg-white/[0.03] border border-white/5 rounded-lg p-5 transition-all duration-300',
  buttonPrimary:
    'bg-pilot-orange hover:bg-pilot-orange/90 text-white font-bold rounded-lg transition-all active:scale-[0.98]',
  buttonSecondary:
    'bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-bold rounded-lg transition-all',
  input:
    'bg-deepnavy border border-white/10 focus:border-pilot-orange/50 rounded-lg px-4 py-3 text-sm text-white focus:outline-none transition-all placeholder:text-white/10',
  label:
    'text-[10px] font-black uppercase tracking-[0.2em] text-white/30',
} as const;
