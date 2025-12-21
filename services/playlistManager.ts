import { Playlist, Track } from './musicPlayerTypes';

const STORAGE_KEY = 'pacepilot_playlists';

// Default playlists
const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: 'focus-music',
    name: 'Focus Music',
    createdAt: new Date().toISOString(),
    tracks: [
      { id: 'j8L6IvuYGOQ', title: 'Deep Chill', genre: 'Ambient' },
      { id: 'qU8o3_T5y5M', title: 'Coffee Shop', genre: 'Lofi' },
      { id: 'am1VJP0RnmQ', title: 'Synthwave', genre: 'Electronic' },
    ],
  },
];

class PlaylistManager {
  private playlists: Playlist[] = [];

  constructor() {
    this.loadPlaylists();
  }

  private loadPlaylists(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.playlists = JSON.parse(stored);
      } else {
        // Initialize with default playlists
        this.playlists = DEFAULT_PLAYLISTS;
        this.savePlaylists();
      }
    } catch (error) {
      console.error('Failed to load playlists:', error);
      this.playlists = DEFAULT_PLAYLISTS;
    }
  }

  private savePlaylists(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.playlists));
    } catch (error) {
      console.error('Failed to save playlists:', error);
    }
  }

  getAllPlaylists(): Playlist[] {
    return [...this.playlists];
  }

  getPlaylist(id: string): Playlist | null {
    return this.playlists.find(p => p.id === id) || null;
  }

  createPlaylist(name: string, tracks: Track[] = []): Playlist {
    const newPlaylist: Playlist = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      tracks,
      createdAt: new Date().toISOString(),
    };

    this.playlists.push(newPlaylist);
    this.savePlaylists();
    return newPlaylist;
  }

  updatePlaylist(id: string, updates: Partial<Omit<Playlist, 'id' | 'createdAt'>>): Playlist | null {
    const index = this.playlists.findIndex(p => p.id === id);
    if (index === -1) return null;

    this.playlists[index] = {
      ...this.playlists[index],
      ...updates,
    };

    this.savePlaylists();
    return this.playlists[index];
  }

  deletePlaylist(id: string): boolean {
    const initialLength = this.playlists.length;
    this.playlists = this.playlists.filter(p => p.id !== id);

    if (this.playlists.length < initialLength) {
      this.savePlaylists();
      return true;
    }
    return false;
  }

  addTrackToPlaylist(playlistId: string, track: Track): boolean {
    const playlist = this.getPlaylist(playlistId);
    if (!playlist) return false;

    // Check if track already exists
    if (playlist.tracks.some(t => t.id === track.id)) {
      return false;
    }

    playlist.tracks.push(track);
    this.updatePlaylist(playlistId, { tracks: playlist.tracks });
    return true;
  }

  removeTrackFromPlaylist(playlistId: string, trackId: string): boolean {
    const playlist = this.getPlaylist(playlistId);
    if (!playlist) return false;

    const initialLength = playlist.tracks.length;
    playlist.tracks = playlist.tracks.filter(t => t.id !== trackId);

    if (playlist.tracks.length < initialLength) {
      this.updatePlaylist(playlistId, { tracks: playlist.tracks });
      return true;
    }
    return false;
  }

  getTrack(playlistId: string, trackIndex: number): Track | null {
    const playlist = this.getPlaylist(playlistId);
    if (!playlist || trackIndex < 0 || trackIndex >= playlist.tracks.length) {
      return null;
    }
    return playlist.tracks[trackIndex];
  }

  getNextTrackIndex(playlistId: string, currentIndex: number, shuffle: boolean): number {
    const playlist = this.getPlaylist(playlistId);
    if (!playlist || playlist.tracks.length === 0) return -1;

    if (shuffle) {
      // Random track, but not the current one
      let nextIndex = Math.floor(Math.random() * playlist.tracks.length);
      if (playlist.tracks.length > 1) {
        while (nextIndex === currentIndex) {
          nextIndex = Math.floor(Math.random() * playlist.tracks.length);
        }
      }
      return nextIndex;
    }

    return (currentIndex + 1) % playlist.tracks.length;
  }

  getPreviousTrackIndex(playlistId: string, currentIndex: number): number {
    const playlist = this.getPlaylist(playlistId);
    if (!playlist || playlist.tracks.length === 0) return -1;

    return (currentIndex - 1 + playlist.tracks.length) % playlist.tracks.length;
  }
}

// Singleton instance
export const playlistManager = new PlaylistManager();
