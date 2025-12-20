import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, SkipForward, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { EnergyLevel } from '../types';

interface YouTubeMusicPlayerProps {
  onClose: () => void;
  energyLevel?: EnergyLevel;
}

// Curated playlists/videos for different energy levels
const ENERGY_PLAYLISTS = {
  High: [
    { id: 'jfKfPfyJRdk', title: 'Lofi Hip Hop - Beats to Focus/Study', genre: 'Focus' },
    { id: '5qap5aO4i9A', title: 'Deep Focus - Productivity Music', genre: 'Deep Work' },
    { id: 'lTRiuFIWV54', title: 'Electronic Focus Music', genre: 'Electronic' },
  ],
  Medium: [
    { id: 'DWcJFNfaw9c', title: 'Lofi Chill Beats', genre: 'Chill' },
    { id: '4xDzrJKXOOY', title: 'Calm Study Music', genre: 'Ambient' },
    { id: 'lP26UCnoH9s', title: 'Peaceful Piano', genre: 'Piano' },
  ],
  Low: [
    { id: 'lTRiuFIWV54', title: 'Ambient Relaxation', genre: 'Ambient' },
    { id: '2OEL4P1Rz04', title: 'Soft Jazz Instrumental', genre: 'Jazz' },
    { id: 'n61ULEU7CO0', title: 'Nature Sounds & Calm Music', genre: 'Nature' },
  ],
};

const YouTubeMusicPlayer: React.FC<YouTubeMusicPlayerProps> = ({ onClose, energyLevel = 'Medium' }) => {
  const [currentPlaylist, setCurrentPlaylist] = useState(ENERGY_PLAYLISTS[energyLevel]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Update playlist when energy level changes
    setCurrentPlaylist(ENERGY_PLAYLISTS[energyLevel]);
    setCurrentIndex(0);
  }, [energyLevel]);

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
      playerRef.current = new (window as any).YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: currentPlaylist[currentIndex].id,
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
          },
          onStateChange: (event: any) => {
            if (event.data === (window as any).YT.PlayerState.ENDED) {
              handleNext();
            }
          },
        },
      });
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    // Load new video when index changes
    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(currentPlaylist[currentIndex].id);
      if (isPlaying) {
        playerRef.current.playVideo();
      }
    }
  }, [currentIndex]);

  const handlePlayPause = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % currentPlaylist.length);
  };

  const handleMute = () => {
    if (!playerRef.current) return;

    if (isMuted) {
      playerRef.current.unMute();
    } else {
      playerRef.current.mute();
    }
    setIsMuted(!isMuted);
  };

  const handleEnergyChange = (energy: EnergyLevel) => {
    setCurrentPlaylist(ENERGY_PLAYLISTS[energy]);
    setCurrentIndex(0);
  };

  const currentTrack = currentPlaylist[currentIndex];

  return (
    <div
      ref={containerRef}
      className={`fixed ${
        isExpanded
          ? 'inset-0 z-50 bg-black/95 backdrop-blur-xl p-8'
          : 'bottom-6 right-6 z-40 w-96'
      } animate-in slide-in-from-bottom-4 duration-300 transition-all`}
    >
      {isExpanded ? (
        /* Expanded View */
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider">Music Player</h2>
              <p className="text-xs text-white/40 uppercase tracking-widest mt-1">
                {energyLevel} Energy • {currentTrack.genre}
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

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Video Player */}
            <div className="flex flex-col justify-center">
              <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
                <div id="youtube-player" className="w-full h-full" />
              </div>
            </div>

            {/* Controls & Info */}
            <div className="flex flex-col justify-center space-y-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{currentTrack.title}</h3>
                <p className="text-sm text-white/40">{currentTrack.genre} Music</p>
              </div>

              {/* Energy Level Selector */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 block">
                  Energy Mode
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Low', 'Medium', 'High'] as EnergyLevel[]).map((energy) => (
                    <button
                      key={energy}
                      onClick={() => handleEnergyChange(energy)}
                      className={`p-4 rounded-lg border transition-all ${
                        energyLevel === energy
                          ? 'bg-pilot-orange/20 border-pilot-orange text-pilot-orange'
                          : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-xs font-black uppercase">{energy}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={handleMute}
                  className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all"
                >
                  {isMuted ? (
                    <VolumeX size={20} className="text-white/60" />
                  ) : (
                    <Volume2 size={20} className="text-white/60" />
                  )}
                </button>
                <button
                  onClick={handlePlayPause}
                  className="p-6 bg-pilot-orange hover:bg-pilot-orange/90 rounded-full shadow-2xl shadow-pilot-orange/30 transition-all hover:scale-110 active:scale-95"
                >
                  {isPlaying ? (
                    <Pause size={32} className="text-white" fill="white" />
                  ) : (
                    <Play size={32} className="text-white" fill="white" />
                  )}
                </button>
                <button
                  onClick={handleNext}
                  className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all"
                >
                  <SkipForward size={20} className="text-white/60" />
                </button>
              </div>

              {/* Playlist */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 block">
                  Up Next
                </label>
                <div className="space-y-2">
                  {currentPlaylist.map((track, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
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
        </div>
      ) : (
        /* Compact View */
        <div className="bg-prussianblue border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Video Preview */}
          <div className="relative aspect-video bg-black">
            <div id="youtube-player" className="w-full h-full opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-prussianblue to-transparent" />
          </div>

          {/* Controls */}
          <div className="p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{currentTrack.title}</h4>
                <p className="text-xs text-white/40 mt-1">{currentTrack.genre} • {energyLevel} Energy</p>
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

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleMute}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {isMuted ? (
                  <VolumeX size={16} className="text-white/40" />
                ) : (
                  <Volume2 size={16} className="text-white/40" />
                )}
              </button>
              <button
                onClick={handlePlayPause}
                className="p-3 bg-pilot-orange hover:bg-pilot-orange/90 rounded-full shadow-lg shadow-pilot-orange/30 transition-all hover:scale-110 active:scale-95"
              >
                {isPlaying ? (
                  <Pause size={18} className="text-white" fill="white" />
                ) : (
                  <Play size={18} className="text-white" fill="white" />
                )}
              </button>
              <button
                onClick={handleNext}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <SkipForward size={16} className="text-white/40" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeMusicPlayer;
