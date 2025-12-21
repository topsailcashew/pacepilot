// Music Player Service Types

export interface Track {
  id: string;
  title: string;
  genre: string;
  artist?: string;
  duration?: number; // in seconds
  artwork?: string;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: string;
}

export interface PlayerState {
  currentTrackIndex: number;
  currentPlaylistId: string | null;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number; // 0-100
  currentTime: number; // in seconds
  duration: number; // in seconds
  buffered: number; // percentage 0-100
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  error: string | null;
  isLoading: boolean;
}

export interface PlaybackPosition {
  currentTime: number;
  duration: number;
  buffered: number;
}

export type PlayerEventType =
  | 'play'
  | 'pause'
  | 'trackchange'
  | 'timeupdate'
  | 'volumechange'
  | 'error'
  | 'ready'
  | 'ended'
  | 'buffering';

export interface PlayerEvent {
  type: PlayerEventType;
  data?: any;
}

export type PlayerEventCallback = (event: PlayerEvent) => void;

// Audio Provider Interface - allows swapping between YouTube, HTML5, Spotify, etc.
export interface AudioProvider {
  initialize(): Promise<void>;
  load(track: Track): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  seek(time: number): void;
  setVolume(volume: number): void;
  mute(): void;
  unmute(): void;
  destroy(): void;
  getCurrentTime(): number;
  getDuration(): number;
  getBuffered(): number;
  isReady(): boolean;
  on(event: PlayerEventType, callback: PlayerEventCallback): void;
  off(event: PlayerEventType, callback: PlayerEventCallback): void;
}

export interface PersistedPlayerState {
  volume: number;
  currentPlaylistId: string | null;
  currentTrackIndex: number;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
}
