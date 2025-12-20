import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
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
  const playerRef = useRef<any>(null);
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    // Load YouTube IFrame API
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Initialize player when API is ready
    (window as any).onYouTubeIframeAPIReady = () => {
      if (!playerRef.current) {
        playerRef.current = new (window as any).YT.Player('youtube-player-hidden', {
          height: '0',
          width: '0',
          videoId: MUSIC_TRACKS[currentIndex].id,
          playerVars: {
            autoplay: 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
          },
          events: {
            onReady: (event: any) => {
              console.log('YouTube player ready');
              setPlayerReady(true);
              event.target.setVolume(volume);
            },
            onStateChange: (event: any) => {
              if (event.data === (window as any).YT.PlayerState.ENDED) {
                handleNext();
              }
              if (event.data === (window as any).YT.PlayerState.PLAYING) {
                setIsPlaying(true);
              }
              if (event.data === (window as any).YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              }
            },
          },
        });
      }
    };

    // If YT is already loaded
    if ((window as any).YT && (window as any).YT.Player) {
      (window as any).onYouTubeIframeAPIReady();
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Load new video when index changes
    if (playerRef.current && playerRef.current.loadVideoById && playerReady) {
      playerRef.current.loadVideoById(MUSIC_TRACKS[currentIndex].id);
      if (isPlaying) {
        setTimeout(() => {
          playerRef.current.playVideo();
        }, 100);
      }
    }
  }, [currentIndex, playerReady]);

  const handlePlayPause = () => {
    if (!playerRef.current || !playerReady) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % MUSIC_TRACKS.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length);
  };

  const handleMute = () => {
    if (!playerRef.current || !playerReady) return;

    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume);
    } else {
      playerRef.current.mute();
    }
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!playerRef.current || !playerReady) return;

    setVolume(newVolume);
    playerRef.current.setVolume(newVolume);

    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
      playerRef.current.unMute();
    }
  };

  const currentTrack = MUSIC_TRACKS[currentIndex];

  return (
    <>
      {/* Hidden YouTube player */}
      <div id="youtube-player-hidden" style={{ display: 'none' }} />

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

            {/* Now Playing */}
            <div className="mb-8 text-center">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-pilot-orange to-pilot-orange/70 rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-6xl">🎵</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{currentTrack.title}</h3>
              <p className="text-sm text-white/40">{currentTrack.genre}</p>
            </div>

            {/* Controls */}
            <div className="space-y-6">
              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={handlePrevious}
                  className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all hover:scale-110 active:scale-95"
                >
                  <SkipBack size={24} className="text-white/60" />
                </button>
                <button
                  onClick={handlePlayPause}
                  disabled={!playerReady}
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
                  className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all hover:scale-110 active:scale-95"
                >
                  <SkipForward size={24} className="text-white/60" />
                </button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-4 px-8">
                <button onClick={handleMute} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
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
                  className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
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
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-full p-4 rounded-lg text-left transition-all ${
                        idx === currentIndex
                          ? 'bg-pilot-orange/10 border border-pilot-orange/20'
                          : 'bg-white/5 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <p className="text-sm font-bold text-white/80">{track.title}</p>
                      <p className="text-xs text-white/40 mt-1">{track.genre}</p>
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
              <span className="text-5xl">🎵</span>
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

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handlePrevious}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <SkipBack size={16} className="text-white/60" />
                </button>
                <button
                  onClick={handlePlayPause}
                  disabled={!playerReady}
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
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <SkipForward size={16} className="text-white/60" />
                </button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-3">
                <button onClick={handleMute} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
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
                  className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
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
