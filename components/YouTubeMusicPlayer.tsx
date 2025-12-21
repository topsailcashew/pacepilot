import React, { useState, useEffect, useCallback } from 'react';
import { X, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Maximize2, Minimize2, AlertCircle, Repeat, Repeat1, Shuffle } from 'lucide-react';
import { EnergyLevel } from '../types';
import { musicPlayerService } from '../services/musicPlayerService';
import { playlistManager } from '../services/playlistManager';
import { PlayerState, Track, Playlist } from '../services/musicPlayerTypes';

interface YouTubeMusicPlayerProps {
  onClose: () => void;
  energyLevel?: EnergyLevel;
}

const YouTubeMusicPlayer: React.FC<YouTubeMusicPlayerProps> = ({ onClose, energyLevel = 'Medium' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [playerState, setPlayerState] = useState<PlayerState>(musicPlayerService.getState());
  const [playlists, setPlaylists] = useState<Playlist[]>(playlistManager.getAllPlaylists());

  // Initialize player
  useEffect(() => {
    musicPlayerService.initialize();

    // Subscribe to player state changes
    const handleStateUpdate = () => {
      setPlayerState(musicPlayerService.getState());
    };

    musicPlayerService.on('play', handleStateUpdate);
    musicPlayerService.on('pause', handleStateUpdate);
    musicPlayerService.on('timeupdate', handleStateUpdate);
    musicPlayerService.on('trackchange', handleStateUpdate);
    musicPlayerService.on('volumechange', handleStateUpdate);
    musicPlayerService.on('error', handleStateUpdate);
    musicPlayerService.on('ready', handleStateUpdate);
    musicPlayerService.on('ended', handleStateUpdate);
    musicPlayerService.on('buffering', handleStateUpdate);

    return () => {
      musicPlayerService.off('play', handleStateUpdate);
      musicPlayerService.off('pause', handleStateUpdate);
      musicPlayerService.off('timeupdate', handleStateUpdate);
      musicPlayerService.off('trackchange', handleStateUpdate);
      musicPlayerService.off('volumechange', handleStateUpdate);
      musicPlayerService.off('error', handleStateUpdate);
      musicPlayerService.off('ready', handleStateUpdate);
      musicPlayerService.off('ended', handleStateUpdate);
      musicPlayerService.off('buffering', handleStateUpdate);
    };
  }, []);

  const currentTrack = musicPlayerService.getCurrentTrack();
  const currentPlaylist = playerState.currentPlaylistId
    ? playlistManager.getPlaylist(playerState.currentPlaylistId)
    : null;

  const handlePlayPause = useCallback(() => {
    musicPlayerService.playPause();
  }, []);

  const handleNext = useCallback(() => {
    musicPlayerService.next();
  }, []);

  const handlePrevious = useCallback(() => {
    musicPlayerService.previous();
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    musicPlayerService.setVolume(newVolume);
  }, []);

  const handleMute = useCallback(() => {
    musicPlayerService.toggleMute();
  }, []);

  const handleSeek = useCallback((time: number) => {
    musicPlayerService.seek(time);
  }, []);

  const handleTrackSelect = useCallback((index: number) => {
    musicPlayerService.loadTrack(index);
  }, []);

  const handleToggleShuffle = useCallback(() => {
    musicPlayerService.setShuffle(!playerState.shuffle);
  }, [playerState.shuffle]);

  const handleToggleRepeat = useCallback(() => {
    const nextMode = playerState.repeat === 'none' ? 'all' : playerState.repeat === 'all' ? 'one' : 'none';
    musicPlayerService.setRepeat(nextMode);
  }, [playerState.repeat]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = playerState.duration > 0
    ? (playerState.currentTime / playerState.duration) * 100
    : 0;

  return (
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
                {currentTrack?.genre || 'Focus'} Music
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
          {(playerState.isLoading || playerState.error) && (
            <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl">
              {playerState.isLoading ? (
                <div className="flex items-center gap-3 text-white/60">
                  <div className="animate-spin">⚙️</div>
                  <p className="text-sm">Loading player...</p>
                </div>
              ) : playerState.error ? (
                <div className="flex items-center gap-3 text-red-400">
                  <AlertCircle size={18} />
                  <p className="text-sm">{playerState.error}</p>
                </div>
              ) : null}
            </div>
          )}

          {/* Now Playing */}
          <div className="mb-8 text-center">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-pilot-orange to-pilot-orange/70 rounded-2xl flex items-center justify-center shadow-2xl">
              <span className="text-6xl">{playerState.isPlaying ? '🎵' : '⏸️'}</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{currentTrack?.title || 'No Track'}</h3>
            <p className="text-sm text-white/40">{currentTrack?.genre || ''}</p>
            {!playerState.isLoading && !playerState.error && (
              <p className="text-xs text-green-400 mt-2">● Ready</p>
            )}
          </div>

          {/* Progress Bar with Seek */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs text-white/40 w-12 text-right">{formatTime(playerState.currentTime)}</span>
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="0"
                  max={playerState.duration || 100}
                  value={playerState.currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  disabled={playerState.isLoading || !playerState.duration}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: `linear-gradient(to right, rgb(243, 115, 36) 0%, rgb(243, 115, 36) ${progressPercent}%, rgba(255,255,255,0.1) ${progressPercent}%, rgba(255,255,255,0.1) 100%)`
                  }}
                />
                {/* Buffered indicator */}
                <div
                  className="absolute top-0 h-2 bg-white/20 rounded-lg pointer-events-none"
                  style={{ width: `${playerState.buffered}%` }}
                />
              </div>
              <span className="text-xs text-white/40 w-12">{formatTime(playerState.duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={handleToggleShuffle}
                className={`p-3 rounded-lg transition-all ${
                  playerState.shuffle
                    ? 'bg-pilot-orange text-white'
                    : 'bg-white/5 hover:bg-white/10 text-white/60'
                }`}
                title="Shuffle"
              >
                <Shuffle size={20} />
              </button>
              <button
                onClick={handlePrevious}
                disabled={playerState.isLoading}
                className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <SkipBack size={24} className="text-white/60" />
              </button>
              <button
                onClick={handlePlayPause}
                disabled={playerState.isLoading}
                className="p-8 bg-pilot-orange hover:bg-pilot-orange/90 rounded-full shadow-2xl shadow-pilot-orange/30 transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {playerState.isPlaying ? (
                  <Pause size={40} className="text-white" fill="white" />
                ) : (
                  <Play size={40} className="text-white" fill="white" />
                )}
              </button>
              <button
                onClick={handleNext}
                disabled={playerState.isLoading}
                className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <SkipForward size={24} className="text-white/60" />
              </button>
              <button
                onClick={handleToggleRepeat}
                className={`p-3 rounded-lg transition-all ${
                  playerState.repeat !== 'none'
                    ? 'bg-pilot-orange text-white'
                    : 'bg-white/5 hover:bg-white/10 text-white/60'
                }`}
                title={`Repeat: ${playerState.repeat}`}
              >
                {playerState.repeat === 'one' ? (
                  <Repeat1 size={20} />
                ) : (
                  <Repeat size={20} />
                )}
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-4 px-8">
              <button
                onClick={handleMute}
                disabled={playerState.isLoading}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
              >
                {playerState.isMuted || playerState.volume === 0 ? (
                  <VolumeX size={20} className="text-white/60" />
                ) : (
                  <Volume2 size={20} className="text-white/60" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={playerState.volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                disabled={playerState.isLoading}
                className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer disabled:opacity-30"
                style={{
                  background: `linear-gradient(to right, rgb(243, 115, 36) 0%, rgb(243, 115, 36) ${playerState.volume}%, rgba(255,255,255,0.1) ${playerState.volume}%, rgba(255,255,255,0.1) 100%)`
                }}
              />
              <span className="text-xs text-white/40 w-10 text-right">{playerState.volume}%</span>
            </div>

            {/* Track List */}
            {currentPlaylist && (
              <div className="mt-8">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 block">
                  {currentPlaylist.name}
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                  {currentPlaylist.tracks.map((track, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTrackSelect(idx)}
                      disabled={playerState.isLoading}
                      className={`w-full p-4 rounded-lg text-left transition-all disabled:opacity-30 ${
                        idx === playerState.currentTrackIndex
                          ? 'bg-pilot-orange/10 border border-pilot-orange/20'
                          : 'bg-white/5 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {idx === playerState.currentTrackIndex && playerState.isPlaying && (
                          <span className="text-pilot-orange">♪</span>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white/80">{track.title}</p>
                          <p className="text-xs text-white/40 mt-1">{track.genre}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Compact View */
        <div className="bg-prussianblue border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Album Art */}
          <div className="relative h-32 bg-gradient-to-br from-pilot-orange/20 to-deepnavy flex items-center justify-center">
            <span className="text-5xl">{playerState.isPlaying ? '🎵' : '⏸️'}</span>
            {!playerState.isLoading && !playerState.error && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full"></div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{currentTrack?.title || 'No Track'}</h4>
                <p className="text-xs text-white/40 mt-1">{currentTrack?.genre || ''}</p>
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
            {playerState.error && (
              <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                {playerState.error}
              </div>
            )}

            {/* Mini Progress Bar */}
            <div className="relative">
              <input
                type="range"
                min="0"
                max={playerState.duration || 100}
                value={playerState.currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                disabled={playerState.isLoading || !playerState.duration}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer disabled:opacity-30"
                style={{
                  background: `linear-gradient(to right, rgb(243, 115, 36) 0%, rgb(243, 115, 36) ${progressPercent}%, rgba(255,255,255,0.1) ${progressPercent}%, rgba(255,255,255,0.1) 100%)`
                }}
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-[9px] text-white/30">{formatTime(playerState.currentTime)}</span>
                <span className="text-[9px] text-white/30">{formatTime(playerState.duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handlePrevious}
                disabled={playerState.isLoading}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
              >
                <SkipBack size={16} className="text-white/60" />
              </button>
              <button
                onClick={handlePlayPause}
                disabled={playerState.isLoading}
                className="p-3 bg-pilot-orange hover:bg-pilot-orange/90 rounded-full shadow-lg shadow-pilot-orange/30 transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
              >
                {playerState.isPlaying ? (
                  <Pause size={20} className="text-white" fill="white" />
                ) : (
                  <Play size={20} className="text-white" fill="white" />
                )}
              </button>
              <button
                onClick={handleNext}
                disabled={playerState.isLoading}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
              >
                <SkipForward size={16} className="text-white/60" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleMute}
                disabled={playerState.isLoading}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
              >
                {playerState.isMuted || playerState.volume === 0 ? (
                  <VolumeX size={14} className="text-white/40" />
                ) : (
                  <Volume2 size={14} className="text-white/40" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={playerState.volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                disabled={playerState.isLoading}
                className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer disabled:opacity-30"
                style={{
                  background: `linear-gradient(to right, rgb(243, 115, 36) 0%, rgb(243, 115, 36) ${playerState.volume}%, rgba(255,255,255,0.1) ${playerState.volume}%, rgba(255,255,255,0.1) 100%)`
                }}
              />
              <span className="text-[9px] text-white/30 w-8 text-right">{playerState.volume}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeMusicPlayer;
