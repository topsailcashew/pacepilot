import { Project, EnergyLevel, MusicGenre } from './types';

export const ENERGY_LEVELS: EnergyLevel[] = ['Low', 'Medium', 'High'];

export const PROJECTS: Project[] = [
  { id: 'p1', name: 'Work', color: 'bg-prussianblue', icon: 'Briefcase' },
  { id: 'p2', name: 'Personal', color: 'bg-goldenearth', icon: 'User' },
  { id: 'p3', name: 'Health', color: 'bg-goldenearth', icon: 'Activity' },
  { id: 'p4', name: 'Learning', color: 'bg-prussianblue', icon: 'BookOpen' },
];

export const MUSIC_TRACKS: Record<MusicGenre, { name: string; url: string }> = {
  'Lo-Fi': { name: 'Sunset Chill', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  'Jazz': { name: 'Midnight Coffee', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  'Synth Wave': { name: 'Neon Horizon', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  'Chill Trap': { name: 'Urban Echo', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
};

export const CATEGORIES = ['Admin', 'Deep Work', 'Quick Win', 'Call', 'Meeting', 'Errand'];