import { EnergyLevel, MusicGenre, Project } from '@/types';

export const ENERGY_LEVELS: EnergyLevel[] = ['Low', 'Medium', 'High'];

export const PROJECTS: Project[] = [
  { id: 'p1', name: 'Work', color: 'bg-prussianblue', icon: 'Briefcase' },
  { id: 'p2', name: 'Personal', color: 'bg-blue-500', icon: 'User' },
  { id: 'p3', name: 'Health', color: 'bg-green-500', icon: 'Activity' },
  { id: 'p4', name: 'Learning', color: 'bg-purple-500', icon: 'BookOpen' },
];

export const MUSIC_TRACKS: Record<MusicGenre, { name: string; url: string }> = {
  'Lo-Fi': {
    name: 'Sunset Chill',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  Jazz: {
    name: 'Midnight Coffee',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  'Synth Wave': {
    name: 'Neon Horizon',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  'Chill Trap': {
    name: 'Urban Echo',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
};

export const CATEGORIES = [
  'Admin',
  'Deep Work',
  'Quick Win',
  'Call',
  'Meeting',
  'Errand',
] as const;

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
