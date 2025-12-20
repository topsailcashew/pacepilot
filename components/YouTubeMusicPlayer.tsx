import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Maximize2, Minimize2, AlertCircle } from 'lucide-react';
import { EnergyLevel } from '../types';

interface YouTubeMusicPlayerProps {
  onClose: () => void;
  energyLevel?: EnergyLevel;
}

// Curated tracks for focus and productivity
const MUSIC_TRACKS = [
  { id: 'j8L6IvuYGOQ', title: 'Deep Chill', genre: 'Ambient' },
  { id: 'qU8o3_T5y5M', title: 'Coffee Shop', genre: 'Lofi' },
  { id: 'am1VJP0RnmQ', title: 'Synthwave', genre: 'Electronic' },
];

const YouTubeMusicPlayer: React.FC<YouTubeMusicPlayerProps> = ({ onClose, energyLevel = 'Medium' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isExpanded, setIsExpanded] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const playerRef = useRef<any>(null);
  const playerDivRef = useRef<HTMLDivElement>(null);
  const initAttempted = useRef(false);

  // Handle next track
  const handleNext = useCallback(() => {
    console.log('Next track');
    setCurrentIndex((prev) => (prev + 1) % MUSIC_TRACKS.length);
  }, []);

  // Handle previous track
  const handlePrevious = useCallback(() => {
    console.log('Previous track');
    setCurrentIndex((prev) => (prev - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length);
  }, []);

  // Initialize YouTube IFrame API
  useEffect(() => {
    console.log('Loading YouTube IFrame API...');

    // Check if API is already loaded
    if ((window as any).YT && (window as any).YT.Player) {
      console.log('YouTube API already loaded');
      setApiLoaded(true);
      setIsLoading(false);
      return;
    }

    // Check if script is already in the document
    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (existingScript) {
      console.log('YouTube API script already added, waiting for load...');
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if ((window as any).YT && (window as any).YT.Player) {
          console.log('YouTube API loaded');
          setApiLoaded(true);
          setIsLoading(false);
          clearInterval(checkInterval);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (!apiLoaded) {
          setError('YouTube API failed to load. Please refresh the page.');
          setIsLoading(false);
        }
      }, 10000); // 10 second timeout

      return () => clearInterval(checkInterval);
    }

    // Load the API script
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    tag.onerror = () => {
      console.error('Failed to load YouTube IFrame API script');
      setError('Failed to load YouTube player. Check your internet connection.');
      setIsLoading(false);
    };

    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Set up callback for when API is ready
    (window as any).onYouTubeIframeAPIReady = () => {
      console.log('YouTube IFrame API Ready');
      setApiLoaded(true);
      setIsLoading(false);
    };

    // Timeout fallback
    const timeout = setTimeout(() => {
      if (!apiLoaded) {
        console.error('YouTube API load timeout');
        setError('YouTube API load timeout. Please refresh the page.');
        setIsLoading(false);
      }
    }, 10000);

    return () => {
      clearTimeout(timeout);
    };
  }, [apiLoaded]);

  // Initialize player when API is loaded
  useEffect(() => {
    if (!apiLoaded || !playerDivRef.current || initAttempted.current) {
      return;
    }

    initAttempted.current = true;
    console.log('Initializing YouTube player...');

    try {
      playerRef.current = new (window as any).YT.Player(playerDivRef.current, {
        height: '1',
        width: '1',
        videoId: MUSIC_TRACKS[currentIndex].id,
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
          onReady: (event: any) => {
            console.log('Player ready!');
            setPlayerReady(true);
            setError(null);
            event.target.setVolume(volume);
          },
          onStateChange: (event: any) => {
            console.log('Player state changed:', event.data);
            const playerState = (window as any).YT.PlayerState;

            if (event.data === playerState.ENDED) {
              console.log('Track ended, playing next');
              handleNext();
            } else if (event.data === playerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === playerState.PAUSED) {
              setIsPlaying(false);
            }
          },
          onError: (event: any) => {
            console.error('YouTube player error:', event.data);
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
            setError(errorMessage);
            setIsPlaying(false);
          },
        },
      });
    } catch (err) {
      console.error('Error creating YouTube player:', err);
      setError('Failed to create player. Please try again.');
    }

    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (err) {
          console.error('Error destroying player:', err);
        }
      }
    };
  }, [apiLoaded, volume, handleNext, currentIndex]);

  // Load new video when index changes
  useEffect(() => {
    if (!playerRef.current || !playerReady) return;

    console.log('Loading track:', MUSIC_TRACKS[currentIndex].title);

    try {
      const wasPlaying = isPlaying;
      playerRef.current.loadVideoById({
        videoId: MUSIC_TRACKS[currentIndex].id,
        startSeconds: 0,
      });

      if (wasPlaying) {
        // Wait a bit for the video to load before playing
        setTimeout(() => {
          if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
            playerRef.current.playVideo();
          }
        }, 500);
      }
    } catch (err) {
      console.error('Error loading video:', err);
      setError('Failed to load track');
    }
  }, [currentIndex, playerReady]);

  const handlePlayPause = useCallback(() => {
    if (!playerRef.current || !playerReady) {
      console.log('Player not ready');
      return;
    }

    console.log('Play/Pause clicked, current state:', isPlaying);

    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch (err) {
      console.error('Error toggling playback:', err);
      setError('Playback error. Please try again.');
    }
  }, [playerReady, isPlaying]);

  const handleMute = useCallback(() => {
    if (!playerRef.current || !playerReady) return;

    console.log('Mute toggled');

    try {
      if (isMuted) {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume);
      } else {
        playerRef.current.mute();
      }
      setIsMuted(!isMuted);
    } catch (err) {
      console.error('Error toggling mute:', err);
    }
  }, [playerReady, isMuted, volume]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!playerRef.current || !playerReady) return;

    console.log('Volume changed to:', newVolume);

    try {
      setVolume(newVolume);
      playerRef.current.setVolume(newVolume);

      if (newVolume === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
        playerRef.current.unMute();
      }
    } catch (err) {
      console.error('Error changing volume:', err);
    }
  }, [playerReady, isMuted]);

  const handleTrackSelect = useCallback((index: number) => {
    console.log('Track selected:', index);
    setCurrentIndex(index);
  }, []);

  const currentTrack = MUSIC_TRACKS[currentIndex];

  return (
    <>
      {/* Hidden YouTube player - MUST render before initialization */}
      <div
        ref={playerDivRef}
        style={{
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none'
        }}
      />

      <div
        className={`fixed ${
          isExpanded
            ? 'inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-8'
            : 'bottom-6 right-6 z-40 w-96'
        } animate-in slide-in-from-bottom-4 duration-300 transition-all`}
      >
        {isExpanded ? (
          /* Expanded View */
          <div className="w-full max-w-2xl bg-prussianblue border border-white/10 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-wider">Music Player</h2>
                <p className="text-xs text-white/40 uppercase tracking-widest mt-1">
                  {currentTrack.genre} Music
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-3 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Minimize2 size={18} className="text-white/60" />
                </button>
                <button
                  onClick={onClose}
                  className="p-3 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={18} className="text-white/60" />
                </button>
              </div>
            </div>

            {/* Error or Loading State */}
            {(isLoading || error) && (
              <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl">
                {isLoading ? (
                  <div className="flex items-center gap-3 text-white/60">
                    <div className="animate-spin">⚙️</div>
                    <p className="text-sm">Loading YouTube player...</p>
                  </div>
                ) : error ? (
                  <div className="flex items-center gap-3 text-red-400">
                    <AlertCircle size={18} />
                    <p className="text-sm">{error}</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Now Playing */}
            <div className="mb-8 text-center">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-pilot-orange to-pilot-orange/70 rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-6xl">{isPlaying ? '🎵' : '⏸️'}</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{currentTrack.title}</h3>
              <p className="text-sm text-white/40">{currentTrack.genre}</p>
              {playerReady && (
                <p className="text-xs text-green-400 mt-2">● Ready</p>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-6">
              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={handlePrevious}
                  disabled={!playerReady}
                  className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <SkipBack size={24} className="text-white/60" />
                </button>
                <button
                  onClick={handlePlayPause}
                  disabled={!playerReady || isLoading}
                  className="p-8 bg-pilot-orange hover:bg-pilot-orange/90 rounded-full shadow-2xl shadow-pilot-orange/30 transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlaying ? (
                    <Pause size={40} className="text-white" fill="white" />
                  ) : (
                    <Play size={40} className="text-white" fill="white" />
                  )}
                </button>
                <button
                  onClick={handleNext}
                  disabled={!playerReady}
                  className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <SkipForward size={24} className="text-white/60" />
                </button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-4 px-8">
                <button onClick={handleMute} disabled={!playerReady} className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30">
                  {isMuted || volume === 0 ? (
                    <VolumeX size={20} className="text-white/60" />
                  ) : (
                    <Volume2 size={20} className="text-white/60" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  disabled={!playerReady}
                  className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer disabled:opacity-30"
                  style={{
                    background: `linear-gradient(to right, rgb(243, 115, 36) 0%, rgb(243, 115, 36) ${volume}%, rgba(255,255,255,0.1) ${volume}%, rgba(255,255,255,0.1) 100%)`
                  }}
                />
                <span className="text-xs text-white/40 w-10 text-right">{volume}%</span>
              </div>

              {/* Track List */}
              <div className="mt-8">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 block">
                  Playlist
                </label>
                <div className="space-y-2">
                  {MUSIC_TRACKS.map((track, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTrackSelect(idx)}
                      disabled={!playerReady}
                      className={`w-full p-4 rounded-lg text-left transition-all disabled:opacity-30 ${
                        idx === currentIndex
                          ? 'bg-pilot-orange/10 border border-pilot-orange/20'
                          : 'bg-white/5 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {idx === currentIndex && isPlaying && <span className="text-pilot-orange">♪</span>}
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white/80">{track.title}</p>
                          <p className="text-xs text-white/40 mt-1">{track.genre}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Compact View */
          <div className="bg-prussianblue border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Album Art */}
            <div className="relative h-32 bg-gradient-to-br from-pilot-orange/20 to-deepnavy flex items-center justify-center">
              <span className="text-5xl">{isPlaying ? '🎵' : '⏸️'}</span>
              {playerReady && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full"></div>
              )}
            </div>

            {/* Controls */}
            <div className="p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{currentTrack.title}</h4>
                  <p className="text-xs text-white/40 mt-1">{currentTrack.genre}</p>
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Maximize2 size={14} className="text-white/40" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X size={14} className="text-white/40" />
                  </button>
                </div>
              </div>

              {/* Error State */}
              {error && (
                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                  {error}
                </div>
              )}

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handlePrevious}
                  disabled={!playerReady}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
                >
                  <SkipBack size={16} className="text-white/60" />
                </button>
                <button
                  onClick={handlePlayPause}
                  disabled={!playerReady || isLoading}
                  className="p-3 bg-pilot-orange hover:bg-pilot-orange/90 rounded-full shadow-lg shadow-pilot-orange/30 transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                >
                  {isPlaying ? (
                    <Pause size={20} className="text-white" fill="white" />
                  ) : (
                    <Play size={20} className="text-white" fill="white" />
                  )}
                </button>
                <button
                  onClick={handleNext}
                  disabled={!playerReady}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
                >
                  <SkipForward size={16} className="text-white/60" />
                </button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-3">
                <button onClick={handleMute} disabled={!playerReady} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30">
                  {isMuted || volume === 0 ? (
                    <VolumeX size={14} className="text-white/40" />
                  ) : (
                    <Volume2 size={14} className="text-white/40" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  disabled={!playerReady}
                  className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer disabled:opacity-30"
                  style={{
                    background: `linear-gradient(to right, rgb(243, 115, 36) 0%, rgb(243, 115, 36) ${volume}%, rgba(255,255,255,0.1) ${volume}%, rgba(255,255,255,0.1) 100%)`
                  }}
                />
                <span className="text-[9px] text-white/30 w-8 text-right">{volume}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default YouTubeMusicPlayer;
