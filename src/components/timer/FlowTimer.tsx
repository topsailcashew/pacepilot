import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { Task } from '@/types';
import { ZONES } from '@/constants';
import type { TaskZone } from '@/types';
import { fmtDuration } from '@/lib/fmt';

interface FlowTimerProps {
  activeTask: Task | null;
  currentZone: TaskZone;
  /** Called when user clicks "End & Log". Receives elapsed seconds. */
  onEnd: (elapsed: number) => void;
}

export const FlowTimer: React.FC<FlowTimerProps> = ({
  activeTask,
  currentZone,
  onEnd,
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);

  const stop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => {
    if (!isRunning) { stop(); return; }
    intervalRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    return stop;
  }, [isRunning, stop]);

  // Reset when task changes
  useEffect(() => {
    stop();
    setIsRunning(false);
    setElapsed(0);
  }, [activeTask?.id, stop]);

  const handleEnd = () => {
    stop();
    const logged = elapsedRef.current;
    setIsRunning(false);
    setElapsed(0);
    onEnd(logged);
  };

  const zoneMeta = ZONES[currentZone];

  const intensity =
    elapsed < 900  ? 'Warming up'   :
    elapsed < 2700 ? 'In the zone'  :
    elapsed < 5400 ? 'Deep focus'   : 'Extended flow';

  const intensityColor =
    elapsed < 900  ? 'text-white/30'      :
    elapsed < 2700 ? 'text-green-400'     :
    elapsed < 5400 ? 'text-pilot-orange'  : 'text-red-400';

  return (
    <div className="bg-prussianblue border border-white/5 rounded-xl p-8 h-full flex flex-col relative overflow-hidden">
      {/* Zone accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${zoneMeta.bg}`} />

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-widest">Flow Session</h3>
          <p className="text-xs text-white/30 mt-1">
            {activeTask ? activeTask.title : 'Select a task to begin'}
          </p>
        </div>
        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${zoneMeta.chipBg} ${zoneMeta.text} border ${zoneMeta.border}`}>
          {zoneMeta.description}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-4 gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
          Time in Flow
        </span>

        <div
          aria-live="polite"
          className="text-[80px] font-black text-pilot-orange leading-none tracking-tighter tabular-nums"
        >
          {fmtDuration(elapsed)}
        </div>

        <span className={`text-[10px] font-black uppercase tracking-widest ${intensityColor} transition-colors`}>
          {isRunning || elapsed > 0 ? intensity : 'Ready'}
        </span>

        {/* ── Controls ─────────────────────────────────────────────────────── */}
        <div className="flex gap-3 w-full max-w-[320px] mt-4">

          {/* Idle — single Start button */}
          {elapsed === 0 && !isRunning && (
            <button
              onClick={() => setIsRunning(true)}
              aria-label="Start flow session"
              className="flex-1 bg-pilot-orange hover:bg-pilot-orange/90 text-white py-3.5 rounded-lg font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-pilot-orange/20"
            >
              <Play size={16} fill="currentColor" />
              Start Session
            </button>
          )}

          {/* Running — Pause | End & Log */}
          {isRunning && (
            <>
              <button
                onClick={() => setIsRunning(false)}
                aria-label="Pause flow session"
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white py-3.5 rounded-lg font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Pause size={15} fill="currentColor" />
                Pause
              </button>
              <button
                onClick={handleEnd}
                aria-label="End session and log time"
                className="flex-1 bg-pilot-orange/10 hover:bg-pilot-orange/20 border border-pilot-orange/30 text-pilot-orange py-3.5 rounded-lg font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Square size={13} fill="currentColor" />
                End & Log
              </button>
            </>
          )}

          {/* Paused — Resume | End & Log */}
          {!isRunning && elapsed > 0 && (
            <>
              <button
                onClick={() => setIsRunning(true)}
                aria-label="Resume flow session"
                className="flex-1 bg-pilot-orange hover:bg-pilot-orange/90 text-white py-3.5 rounded-lg font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-pilot-orange/20"
              >
                <Play size={16} fill="currentColor" />
                Resume
              </button>
              <button
                onClick={handleEnd}
                aria-label="End session and log time"
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white py-3.5 rounded-lg font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Square size={13} fill="currentColor" />
                End & Log
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
