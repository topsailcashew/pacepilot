import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Pause } from 'lucide-react';
import { Task } from '@/types';

const DEFAULT_MINUTES = 25;

interface PomodoroTimerProps {
  activeTask: Task | null;
  /** Called when the session naturally completes (timer hits 0) */
  onSessionComplete?: () => void;
}

/**
 * A 25-minute Pomodoro focus timer with play/pause/reset controls.
 * Uses a ref-based interval to avoid stale closure issues and replaces
 * the prototype's `alert()` with a state-based completion notice.
 */
export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  activeTask,
  onSessionComplete,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES);
  const [seconds, setSeconds] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Store latest values in refs so the interval callback always reads current state
  const minutesRef = useRef(minutes);
  const secondsRef = useRef(seconds);

  useEffect(() => { minutesRef.current = minutes; }, [minutes]);
  useEffect(() => { secondsRef.current = seconds; }, [seconds]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleComplete = useCallback(() => {
    stopInterval();
    setIsActive(false);
    setIsComplete(true);
    onSessionComplete?.();
  }, [stopInterval, onSessionComplete]);

  useEffect(() => {
    if (!isActive) {
      stopInterval();
      return;
    }

    intervalRef.current = setInterval(() => {
      const s = secondsRef.current;
      const m = minutesRef.current;

      if (s > 0) {
        setSeconds((prev) => prev - 1);
      } else if (m > 0) {
        setMinutes((prev) => prev - 1);
        setSeconds(59);
      } else {
        handleComplete();
      }
    }, 1000);

    return stopInterval;
  }, [isActive, stopInterval, handleComplete]);

  // Reset state whenever a new task is selected
  useEffect(() => {
    resetTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTask?.id]);

  const toggleTimer = () => {
    setIsComplete(false);
    setIsActive((prev) => !prev);
  };

  function resetTimer() {
    stopInterval();
    setIsActive(false);
    setIsComplete(false);
    setMinutes(DEFAULT_MINUTES);
    setSeconds(0);
  }

  return (
    <div className="bg-prussianblue border border-white/5 rounded-xl p-8 h-full flex flex-col relative overflow-hidden">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white">Pomodoro Timer</h3>
        <p className="text-xs text-white/40 mt-1">
          {activeTask ? 'Session in progress' : 'Select a task to focus on.'}
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-4">
          Focus Session
        </span>

        {/* Countdown display */}
        <div
          aria-live="polite"
          aria-label={`${String(minutes).padStart(2, '0')} minutes and ${String(seconds).padStart(2, '0')} seconds remaining`}
          className="text-[100px] font-black text-pilot-orange leading-none tracking-tighter tabular-nums mb-4"
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>

        {/* Session complete notice */}
        {isComplete && (
          <p className="text-xs font-black text-green-400 uppercase tracking-widest mb-6 animate-in fade-in duration-500">
            Session complete — take a break! ☕
          </p>
        )}

        {/* Controls */}
        <div className="flex gap-4 w-full max-w-[280px] mt-6">
          <button
            onClick={toggleTimer}
            aria-label={isActive ? 'Pause timer' : 'Start timer'}
            className="flex-1 bg-pilot-orange/10 hover:bg-pilot-orange/20 text-pilot-orange border border-pilot-orange/20 py-4 rounded-lg font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {isActive ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" />
            )}
            <span>{isActive ? 'Pause' : 'Start'}</span>
          </button>

          <button
            onClick={resetTimer}
            aria-label="Reset timer"
            className="flex-1 bg-white/5 hover:bg-white/10 text-white/40 border border-white/10 py-4 rounded-lg font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Active task footer */}
      {activeTask && (
        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">
            Current Objective
          </p>
          <p className="text-sm font-bold text-white truncate">{activeTask.title}</p>
        </div>
      )}
    </div>
  );
};
