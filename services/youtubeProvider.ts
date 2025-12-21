import { AudioProvider, Track, PlayerEventType, PlayerEventCallback, PlayerEvent } from './musicPlayerTypes';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export class YouTubeProvider implements AudioProvider {
  private player: any = null;
  private playerDiv: HTMLDivElement | null = null;
  private ready: boolean = false;
  private apiLoaded: boolean = false;
  private currentTrack: Track | null = null;
  private eventCallbacks: Map<PlayerEventType, Set<PlayerEventCallback>> = new Map();
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
    // Load YouTube IFrame API if not already loaded
    if (window.YT && window.YT.Player) {
      this.apiLoaded = true;
      this.createPlayer();
      return;
    }

    return new Promise((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');

      if (existingScript) {
        // Wait for API to load
        const checkInterval = setInterval(() => {
          if (window.YT && window.YT.Player) {
            clearInterval(checkInterval);
            this.apiLoaded = true;
            this.createPlayer();
            resolve();
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('YouTube API load timeout'));
        }, 10000);
        return;
      }

      // Load the API script
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.onerror = () => reject(new Error('Failed to load YouTube API'));

      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      // Set up callback
      window.onYouTubeIframeAPIReady = () => {
        this.apiLoaded = true;
        this.createPlayer();
        resolve();
      };

      // Timeout
      setTimeout(() => {
        reject(new Error('YouTube API load timeout'));
      }, 10000);
    });
  }

  private createPlayer(): void {
    // Create hidden div for player
    this.playerDiv = document.createElement('div');
    this.playerDiv.style.position = 'absolute';
    this.playerDiv.style.top = '-9999px';
    this.playerDiv.style.left = '-9999px';
    this.playerDiv.style.width = '1px';
    this.playerDiv.style.height = '1px';
    this.playerDiv.style.opacity = '0';
    this.playerDiv.style.pointerEvents = 'none';
    document.body.appendChild(this.playerDiv);

    this.player = new window.YT.Player(this.playerDiv, {
      height: '1',
      width: '1',
      videoId: '',
      playerVars: {
        autoplay: 0,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        fs: 0,
        playsinline: 1,
      },
      events: {
        onReady: this.handleReady.bind(this),
        onStateChange: this.handleStateChange.bind(this),
        onError: this.handleError.bind(this),
      },
    });
  }

  private handleReady(): void {
    this.ready = true;
    this.emit({ type: 'ready' });
  }

  private handleStateChange(event: any): void {
    const PlayerState = window.YT.PlayerState;

    switch (event.data) {
      case PlayerState.PLAYING:
        this.emit({ type: 'play' });
        break;
      case PlayerState.PAUSED:
        this.emit({ type: 'pause' });
        break;
      case PlayerState.ENDED:
        this.emit({ type: 'ended' });
        break;
      case PlayerState.BUFFERING:
        this.emit({ type: 'buffering' });
        break;
    }
  }

  private handleError(event: any): void {
    let errorMessage = 'Failed to play video';
    switch (event.data) {
      case 2:
        errorMessage = 'Invalid video ID';
        break;
      case 5:
        errorMessage = 'HTML5 player error';
        break;
      case 100:
        errorMessage = 'Video not found';
        break;
      case 101:
      case 150:
        errorMessage = 'Video not allowed to be embedded';
        break;
    }
    this.emit({ type: 'error', data: errorMessage });
  }

  async load(track: Track): Promise<void> {
    if (!this.ready) {
      throw new Error('Player not ready');
    }

    this.currentTrack = track;

    return new Promise((resolve, reject) => {
      try {
        this.player.loadVideoById({
          videoId: track.id,
          startSeconds: 0,
        });

        // Wait a bit for the video to load
        setTimeout(() => {
          this.emit({ type: 'trackchange', data: track });
          resolve();
        }, 500);
      } catch (err) {
        reject(err);
      }
    });
  }

  async play(): Promise<void> {
    if (!this.ready) {
      throw new Error('Player not ready');
    }

    return new Promise((resolve, reject) => {
      try {
        this.player.playVideo();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  pause(): void {
    if (!this.ready) return;
    try {
      this.player.pauseVideo();
    } catch (err) {
      console.error('Pause error:', err);
    }
  }

  seek(time: number): void {
    if (!this.ready) return;
    try {
      this.player.seekTo(time, true);
    } catch (err) {
      console.error('Seek error:', err);
    }
  }

  setVolume(volume: number): void {
    if (!this.ready) return;
    try {
      this.player.setVolume(volume);
      this.emit({ type: 'volumechange', data: volume });
    } catch (err) {
      console.error('Volume error:', err);
    }
  }

  mute(): void {
    if (!this.ready) return;
    try {
      this.player.mute();
    } catch (err) {
      console.error('Mute error:', err);
    }
  }

  unmute(): void {
    if (!this.ready) return;
    try {
      this.player.unMute();
    } catch (err) {
      console.error('Unmute error:', err);
    }
  }

  getCurrentTime(): number {
    if (!this.ready) return 0;
    try {
      return this.player.getCurrentTime() || 0;
    } catch {
      return 0;
    }
  }

  getDuration(): number {
    if (!this.ready) return 0;
    try {
      return this.player.getDuration() || 0;
    } catch {
      return 0;
    }
  }

  getBuffered(): number {
    if (!this.ready) return 0;
    try {
      const loaded = this.player.getVideoLoadedFraction();
      return loaded * 100;
    } catch {
      return 0;
    }
  }

  isReady(): boolean {
    return this.ready;
  }

  on(event: PlayerEventType, callback: PlayerEventCallback): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }
    this.eventCallbacks.get(event)!.add(callback);
  }

  off(event: PlayerEventType, callback: PlayerEventCallback): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emit(event: PlayerEvent): void {
    const callbacks = this.eventCallbacks.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }
  }

  destroy(): void {
    if (this.player && typeof this.player.destroy === 'function') {
      try {
        this.player.destroy();
      } catch (err) {
        console.error('Error destroying player:', err);
      }
    }

    if (this.playerDiv && this.playerDiv.parentNode) {
      this.playerDiv.parentNode.removeChild(this.playerDiv);
    }

    this.player = null;
    this.playerDiv = null;
    this.ready = false;
    this.currentTrack = null;
    this.eventCallbacks.clear();
  }
}
