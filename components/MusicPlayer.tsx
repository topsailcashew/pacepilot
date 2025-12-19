import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, X } from 'lucide-react';
import { MusicGenre } from '../types';

interface MusicPlayerProps {
  onClose: () => void;
}

// Music tracks by genre (using royalty-free music URLs or placeholders)
const MUSIC_TRACKS: Record<MusicGenre, string> = {
  'Lo-Fi': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'Jazz': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'Synth Wave': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'Chill Trap': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
};

const MusicPlayer: React.FC<MusicPlayerProps> = ({ onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<MusicGenre>('Lo-Fi');
  const [isMinimized, setIsMinimized] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = MUSIC_TRACKS[selectedGenre];
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [selectedGenre]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="p-4 bg-pilot-orange hover:bg-pilot-orange/90 text-white rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95"
        >
          <Music size={24} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-prussianblue border border-white/10 rounded-xl shadow-2xl p-6 w-80 animate-in slide-in-from-bottom-4 duration-300">
      <audio ref={audioRef} loop />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Music size={20} className="text-pilot-orange" />
          <h3 className="text-sm font-black uppercase tracking-wider text-white">Ambient Music</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 hover:bg-white/5 rounded transition-colors"
          >
            <Music size={16} className="text-white/40" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/5 rounded transition-colors"
          >
            <X size={16} className="text-white/40" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 block">
          Genre
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['Lo-Fi', 'Jazz', 'Synth Wave', 'Chill Trap'] as MusicGenre[]).map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                selectedGenre === genre
                  ? 'bg-pilot-orange text-white'
                  : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-pilot-orange hover:bg-pilot-orange/90 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg"
        >
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
        </button>

        <div className="flex-1 flex items-center gap-3">
          <button onClick={toggleMute} className="text-white/40 hover:text-white transition-colors">
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #F37324 0%, #F37324 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.1) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.1) 100%)`
            }}
          />
        </div>
      </div>

      <p className="text-[9px] text-white/20 text-center mt-4 uppercase tracking-wider">
        Now Playing: {selectedGenre}
      </p>
    </div>
  );
};

export default MusicPlayer;
