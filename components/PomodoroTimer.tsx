import React, { useState, useEffect, useCallback } from 'react';
import { Play, RotateCcw, Pause } from 'lucide-react';
import { Task } from '../types';

interface PomodoroTimerProps {
  onStart?: () => void;
  onStop?: () => void;
  activeTask: Task | null;
  isActive: boolean;
  setIsActive: (active: boolean) => void;
}

interface TimerState {
  endTime: number;
  duration: number;
  isActive: boolean;
}

const TIMER_STORAGE_KEY = 'pacepilot_pomodoro_timer';
const DEFAULT_DURATION = 25 * 60; // 25 minutes in seconds

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  onStart,
  onStop,
  activeTask,
  isActive,
  setIsActive
}) => {
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION);
  const [initialDuration, setInitialDuration] = useState(DEFAULT_DURATION);

  // Load timer state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(TIMER_STORAGE_KEY);
    if (savedState) {
      try {
        const state: TimerState = JSON.parse(savedState);
        const now = Date.now();

        if (state.isActive && state.endTime > now) {
          // Timer is still running
          const remaining = Math.floor((state.endTime - now) / 1000);
          setTimeLeft(remaining);
          setInitialDuration(state.duration);
          setIsActive(true);
        } else if (state.isActive && state.endTime <= now) {
          // Timer has finished while tab was inactive
          setTimeLeft(0);
          setIsActive(false);
          localStorage.removeItem(TIMER_STORAGE_KEY);
          // Notify user
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Pomodoro Complete!', {
              body: "Time's up! Take a break.",
              icon: '/favicon.ico'
            });
          }
        }
      } catch (e) {
        console.error('Error loading timer state:', e);
        localStorage.removeItem(TIMER_STORAGE_KEY);
      }
    }
  }, [setIsActive]);

  // Save timer state to localStorage
  const saveTimerState = useCallback((active: boolean, secondsLeft: number, duration: number) => {
    if (active) {
      const state: TimerState = {
        endTime: Date.now() + (secondsLeft * 1000),
        duration,
        isActive: true
      };
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    }
  }, []);

  // Update timer using timestamp-based calculation
  useEffect(() => {
    if (!isActive) return;

    // Request notification permission when timer starts
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Save initial state
    saveTimerState(true, timeLeft, initialDuration);

    if (onStart) onStart();

    const interval = setInterval(() => {
      const savedState = localStorage.getItem(TIMER_STORAGE_KEY);
      if (savedState) {
        try {
          const state: TimerState = JSON.parse(savedState);
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((state.endTime - now) / 1000));

          setTimeLeft(remaining);

          if (remaining <= 0) {
            setIsActive(false);
            localStorage.removeItem(TIMER_STORAGE_KEY);
            if (onStop) onStop();

            // Show notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Pomodoro Complete!', {
                body: "Time's up! Take a break.",
                icon: '/favicon.ico'
              });
            } else {
              alert("Time's up! Take a break.");
            }
          }
        } catch (e) {
          console.error('Error updating timer:', e);
        }
      }
    }, 100); // Update more frequently for smoother countdown

    return () => {
      clearInterval(interval);
    };
  }, [isActive, timeLeft, initialDuration, onStart, onStop, setIsActive, saveTimerState]);

  // Handle pause
  useEffect(() => {
    if (!isActive) {
      localStorage.removeItem(TIMER_STORAGE_KEY);
      if (onStop) onStop();
    }
  }, [isActive, onStop]);

  // Handle visibility change (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isActive) {
        // Tab became visible - recalculate time
        const savedState = localStorage.getItem(TIMER_STORAGE_KEY);
        if (savedState) {
          try {
            const state: TimerState = JSON.parse(savedState);
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((state.endTime - now) / 1000));
            setTimeLeft(remaining);

            if (remaining <= 0) {
              setIsActive(false);
              localStorage.removeItem(TIMER_STORAGE_KEY);
            }
          } catch (e) {
            console.error('Error on visibility change:', e);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, setIsActive]);

  const toggleTimer = () => {
    if (!isActive) {
      // Starting timer
      setInitialDuration(timeLeft);
      saveTimerState(true, timeLeft, timeLeft);
    } else {
      // Pausing timer
      saveTimerState(false, timeLeft, initialDuration);
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(DEFAULT_DURATION);
    setInitialDuration(DEFAULT_DURATION);
    localStorage.removeItem(TIMER_STORAGE_KEY);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = initialDuration > 0 ? ((initialDuration - timeLeft) / initialDuration) * 100 : 0;

  return (
    <div className="bg-prussianblue border border-white/5 rounded-xl p-8 h-full flex flex-col relative overflow-hidden">
      {/* Progress bar background */}
      <div
        className="absolute top-0 left-0 h-1 bg-pilot-orange transition-all duration-300 ease-linear"
        style={{ width: `${progress}%` }}
      />

      <div className="mb-6">
        <h3 className="text-lg font-bold text-white">Pomodoro Timer</h3>
        <p className="text-xs text-white/40 mt-1">
          {isActive ? '⏱️ Timer runs in background' : 'Select a task to focus on.'}
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-4">
          {isActive ? 'Focus Session Active' : 'Focus Session'}
        </span>
        <div className={`text-[100px] font-black leading-none tracking-tighter tabular-nums mb-12 transition-colors ${
          isActive ? 'text-pilot-orange' : 'text-white/40'
        }`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>

        <div className="flex gap-4 w-full max-w-[280px]">
          <button
            onClick={toggleTimer}
            className={`flex-1 py-4 rounded-lg font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${
              isActive
                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                : 'bg-pilot-orange/10 hover:bg-pilot-orange/20 text-pilot-orange border border-pilot-orange/20'
            }`}
          >
            {isActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            <span>{isActive ? 'Pause' : 'Start'}</span>
          </button>
          <button
            onClick={resetTimer}
            disabled={isActive}
            className="flex-1 bg-white/5 hover:bg-white/10 text-white/40 border border-white/10 py-4 rounded-lg font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
        </div>

        {isActive && (
          <div className="mt-6 px-4 py-2 bg-pilot-orange/5 border border-pilot-orange/20 rounded-lg">
            <p className="text-[10px] text-pilot-orange font-bold uppercase tracking-wider text-center">
              ✨ Timer persists across tabs
            </p>
          </div>
        )}
      </div>

      {activeTask && (
        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Current Objective</p>
          <p className="text-sm font-bold text-white truncate">{activeTask.title}</p>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;
