import { AudioProvider, PlayerState, Track, PlayerEvent, PlayerEventCallback, PersistedPlayerState } from './musicPlayerTypes';
import { YouTubeProvider } from './youtubeProvider';
import { playlistManager } from './playlistManager';

const STORAGE_KEY = 'pacepilot_player_state';

class MusicPlayerService {
  private static instance: MusicPlayerService | null = null;

  private provider: AudioProvider;
  private state: PlayerState;
  private eventCallbacks: Map<string, Set<PlayerEventCallback>> = new Map();
  private timeUpdateInterval: number | null = null;

  private constructor() {
    // Initialize with YouTube provider
    this.provider = new YouTubeProvider();

    // Initialize state
    this.state = this.getInitialState();

    // Set up provider event listeners
    this.setupProviderListeners();

    // Load persisted state
    this.loadPersistedState();

    // Start time update interval
    this.startTimeUpdate();
  }

  static getInstance(): MusicPlayerService {
    if (!MusicPlayerService.instance) {
      MusicPlayerService.instance = new MusicPlayerService();
    }
    return MusicPlayerService.instance;
  }

  private getInitialState(): PlayerState {
    return {
      currentTrackIndex: 0,
      currentPlaylistId: 'focus-music',
      isPlaying: false,
      isMuted: false,
      volume: 70,
      currentTime: 0,
      duration: 0,
      buffered: 0,
      shuffle: false,
      repeat: 'none',
      error: null,
      isLoading: true,
    };
  }

  private setupProviderListeners(): void {
    this.provider.on('ready', () => {
      this.updateState({ isLoading: false, error: null });
      this.emitEvent({ type: 'ready' });
    });

    this.provider.on('play', () => {
      this.updateState({ isPlaying: true });
      this.emitEvent({ type: 'play' });
    });

    this.provider.on('pause', () => {
      this.updateState({ isPlaying: false });
      this.emitEvent({ type: 'pause' });
    });

    this.provider.on('ended', () => {
      this.handleTrackEnded();
    });

    this.provider.on('error', (event) => {
      this.updateState({ error: event.data, isPlaying: false });
      this.emitEvent(event);
    });

    this.provider.on('trackchange', (event) => {
      this.emitEvent(event);
    });

    this.provider.on('buffering', () => {
      this.emitEvent({ type: 'buffering' });
    });
  }

  private startTimeUpdate(): void {
    // Update time every 500ms
    this.timeUpdateInterval = window.setInterval(() => {
      if (this.state.isPlaying && this.provider.isReady()) {
        const currentTime = this.provider.getCurrentTime();
        const duration = this.provider.getDuration();
        const buffered = this.provider.getBuffered();

        this.updateState({ currentTime, duration, buffered }, false); // Don't persist
        this.emitEvent({ type: 'timeupdate', data: { currentTime, duration, buffered } });
      }
    }, 500);
  }

  private loadPersistedState(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const persisted: PersistedPlayerState = JSON.parse(stored);
        this.state = {
          ...this.state,
          volume: persisted.volume,
          currentPlaylistId: persisted.currentPlaylistId,
          currentTrackIndex: persisted.currentTrackIndex,
          shuffle: persisted.shuffle,
          repeat: persisted.repeat,
        };
      }
    } catch (error) {
      console.error('Failed to load persisted player state:', error);
    }
  }

  private persistState(): void {
    try {
      const persisted: PersistedPlayerState = {
        volume: this.state.volume,
        currentPlaylistId: this.state.currentPlaylistId,
        currentTrackIndex: this.state.currentTrackIndex,
        shuffle: this.state.shuffle,
        repeat: this.state.repeat,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch (error) {
      console.error('Failed to persist player state:', error);
    }
  }

  private updateState(updates: Partial<PlayerState>, persist: boolean = true): void {
    this.state = { ...this.state, ...updates };
    if (persist) {
      this.persistState();
    }
  }

  private emitEvent(event: PlayerEvent): void {
    const callbacks = this.eventCallbacks.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }
  }

  private handleTrackEnded(): void {
    this.updateState({ isPlaying: false });
    this.emitEvent({ type: 'ended' });

    // Handle repeat modes
    if (this.state.repeat === 'one') {
      // Replay current track
      this.play();
      return;
    }

    if (this.state.repeat === 'all' || this.canPlayNext()) {
      // Play next track
      this.next();
    }
  }

  private canPlayNext(): boolean {
    const playlist = playlistManager.getPlaylist(this.state.currentPlaylistId || '');
    if (!playlist) return false;

    if (this.state.shuffle) return true; // Can always play next with shuffle

    return this.state.currentTrackIndex < playlist.tracks.length - 1;
  }

  async initialize(): Promise<void> {
    try {
      await this.provider.initialize();
      this.provider.setVolume(this.state.volume);

      // Load current track
      const currentTrack = this.getCurrentTrack();
      if (currentTrack) {
        await this.provider.load(currentTrack);
      }
    } catch (error) {
      console.error('Failed to initialize music player:', error);
      this.updateState({ error: 'Failed to initialize player', isLoading: false });
    }
  }

  getCurrentTrack(): Track | null {
    if (!this.state.currentPlaylistId) return null;

    return playlistManager.getTrack(
      this.state.currentPlaylistId,
      this.state.currentTrackIndex
    );
  }

  getState(): PlayerState {
    return { ...this.state };
  }

  async play(): Promise<void> {
    try {
      await this.provider.play();
    } catch (error) {
      console.error('Play error:', error);
      this.updateState({ error: 'Failed to play', isPlaying: false });
    }
  }

  pause(): void {
    this.provider.pause();
  }

  async playPause(): Promise<void> {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      await this.play();
    }
  }

  async next(): Promise<void> {
    if (!this.state.currentPlaylistId) return;

    const nextIndex = playlistManager.getNextTrackIndex(
      this.state.currentPlaylistId,
      this.state.currentTrackIndex,
      this.state.shuffle
    );

    if (nextIndex === -1) return;

    await this.loadTrack(nextIndex);
  }

  async previous(): Promise<void> {
    if (!this.state.currentPlaylistId) return;

    // If we're more than 3 seconds into the track, restart it
    if (this.state.currentTime > 3) {
      this.seek(0);
      return;
    }

    const prevIndex = playlistManager.getPreviousTrackIndex(
      this.state.currentPlaylistId,
      this.state.currentTrackIndex
    );

    if (prevIndex === -1) return;

    await this.loadTrack(prevIndex);
  }

  async loadTrack(index: number): Promise<void> {
    if (!this.state.currentPlaylistId) return;

    const track = playlistManager.getTrack(this.state.currentPlaylistId, index);
    if (!track) return;

    const wasPlaying = this.state.isPlaying;

    try {
      this.updateState({ currentTrackIndex: index, isLoading: true });
      await this.provider.load(track);
      this.updateState({ isLoading: false });

      if (wasPlaying) {
        await this.play();
      }
    } catch (error) {
      console.error('Failed to load track:', error);
      this.updateState({ error: 'Failed to load track', isLoading: false });
    }
  }

  async setPlaylist(playlistId: string, startIndex: number = 0): Promise<void> {
    const playlist = playlistManager.getPlaylist(playlistId);
    if (!playlist || playlist.tracks.length === 0) return;

    this.updateState({ currentPlaylistId: playlistId, currentTrackIndex: startIndex });
    await this.loadTrack(startIndex);
  }

  seek(time: number): void {
    this.provider.seek(time);
    this.updateState({ currentTime: time }, false);
  }

  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(100, volume));
    this.provider.setVolume(clampedVolume);
    this.updateState({ volume: clampedVolume, isMuted: clampedVolume === 0 });
  }

  mute(): void {
    this.provider.mute();
    this.updateState({ isMuted: true });
  }

  unmute(): void {
    this.provider.unmute();
    this.updateState({ isMuted: false });
  }

  toggleMute(): void {
    if (this.state.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

  setShuffle(shuffle: boolean): void {
    this.updateState({ shuffle });
  }

  setRepeat(repeat: 'none' | 'one' | 'all'): void {
    this.updateState({ repeat });
  }

  on(event: string, callback: PlayerEventCallback): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }
    this.eventCallbacks.get(event)!.add(callback);
  }

  off(event: string, callback: PlayerEventCallback): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  destroy(): void {
    if (this.timeUpdateInterval !== null) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }

    this.provider.destroy();
    this.eventCallbacks.clear();
    MusicPlayerService.instance = null;
  }
}

// Export singleton instance
export const musicPlayerService = MusicPlayerService.getInstance();
