/**
 * AmbiancePlayer — UI for the module-level ambianceStore singleton.
 *
 * Because audio state lives outside React, navigating away and back
 * never interrupts playback. The iframe on document.body persists for
 * the entire browser session.
 */

import React, { useSyncExternalStore } from 'react';
import { Volume2, Loader } from 'lucide-react';
import {
  SOUNDS,
  subscribe,
  getSnapshot,
  play,
  stop,
  setVolume,
} from '@/lib/ambianceStore';

export const AmbiancePlayer: React.FC = () => {
  const { activeId, volume, loading } = useSyncExternalStore(subscribe, getSnapshot);

  const handleSelect = (sound: typeof SOUNDS[number]) => {
    if (activeId === sound.id) {
      stop();
    } else {
      play(sound);
    }
  };

  const activeSound = SOUNDS.find((s) => s.id === activeId);

  return (
    <div className="space-y-4">

      {/* Sound grid */}
      <div className="grid grid-cols-4 gap-2">
        {SOUNDS.map((sound) => {
          const isActive = activeId === sound.id;
          const isLoading = isActive && loading;
          return (
            <button
              key={sound.id}
              onClick={() => handleSelect(sound)}
              aria-pressed={isActive}
              aria-label={`${isActive ? 'Stop' : 'Play'} ${sound.label} ambiance`}
              className={`relative flex flex-col items-center gap-1.5 py-3.5 rounded-xl border transition-all active:scale-95 ${
                isActive
                  ? 'bg-pilot-orange/10 border-pilot-orange/40 text-pilot-orange shadow-lg shadow-pilot-orange/10'
                  : 'bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/5 hover:text-white/70 hover:border-white/10'
              }`}
            >
              <span className="text-xl leading-none">{sound.emoji}</span>
              <span className="text-[8px] font-black uppercase tracking-widest leading-tight">
                {sound.label}
              </span>

              {/* Playing indicator / spinner */}
              {isActive && (
                <span className="absolute top-1.5 right-1.5">
                  {isLoading
                    ? <Loader size={8} className="animate-spin text-pilot-orange/60" />
                    : <span className="block w-1.5 h-1.5 rounded-full bg-pilot-orange animate-pulse" />
                  }
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Volume control */}
      <div className="flex items-center gap-3 px-1">
        <Volume2 size={13} className="text-white/30 shrink-0" />
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={volume}
          onChange={(e) => setVolume(parseInt(e.target.value))}
          aria-label="Volume"
          className="flex-1 h-0.5 appearance-none rounded-full cursor-pointer"
          style={{
            background: `linear-gradient(to right, #F37324 0%, #F37324 ${volume}%, rgba(255,255,255,0.08) ${volume}%, rgba(255,255,255,0.08) 100%)`,
          }}
        />
        <span className="text-[9px] text-white/20 font-bold w-7 text-right tabular-nums">
          {volume}%
        </span>
      </div>

      {/* Status */}
      <p className="text-[9px] text-white/20 uppercase tracking-widest text-center">
        {loading
          ? 'Loading…'
          : activeSound
          ? `▶ ${activeSound.label} — click to stop`
          : 'Select a sound to immerse'}
      </p>
    </div>
  );
};

// ── Compact mini-player for use outside WorkdayPage ────────────────────────────

export const AmbianceMiniPlayer: React.FC = () => {
  const { activeId, loading } = useSyncExternalStore(subscribe, getSnapshot);
  const activeSound = SOUNDS.find((s) => s.id === activeId);

  if (!activeSound) return null;

  return (
    <button
      onClick={stop}
      title="Stop ambiance"
      className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-pilot-orange/5 border border-pilot-orange/20 hover:bg-pilot-orange/10 transition-all group"
    >
      <span className="text-base leading-none">{activeSound.emoji}</span>
      <div className="flex-1 text-left min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-pilot-orange truncate">
          {activeSound.label}
        </p>
        <p className="text-[8px] text-white/20 uppercase tracking-widest">
          {loading ? 'Loading…' : 'Playing · tap to stop'}
        </p>
      </div>
      {loading
        ? <Loader size={10} className="animate-spin text-pilot-orange/50 shrink-0" />
        : <span className="block w-1.5 h-1.5 rounded-full bg-pilot-orange animate-pulse shrink-0" />
      }
    </button>
  );
};
