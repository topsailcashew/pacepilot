import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Pause } from 'lucide-react';
import { Task } from '../types';

interface PomodoroTimerProps {
  onStart?: () => void;
  onStop?: () => void;
  activeTask: Task | null;
  isActive: boolean;
  setIsActive: (active: boolean) => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ 
  onStart, 
  onStop, 
  activeTask,
  isActive,
  setIsActive
}) => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      if (onStart) onStart();
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          setIsActive(false);
          if (onStop) onStop();
          alert("Time's up! Take a break.");
        }
      }, 1000);
    } else {
      if (onStop) onStop();
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, minutes, seconds, onStart, onStop, setIsActive]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setMinutes(25);
    setSeconds(0);
  };

  return (
    <div className="bg-prussianblue border border-white/5 rounded-xl p-8 h-full flex flex-col relative overflow-hidden">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white">Pomodoro Timer</h3>
        <p className="text-xs text-white/40 mt-1">Select a task to focus on.</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-4">Focus Session</span>
        <div className="text-[100px] font-black text-pilot-orange leading-none tracking-tighter tabular-nums mb-12">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        
        <div className="flex gap-4 w-full max-w-[280px]">
          <button 
            onClick={toggleTimer}
            className="flex-1 bg-pilot-orange/10 hover:bg-pilot-orange/20 text-pilot-orange border border-pilot-orange/20 py-4 rounded-lg font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {isActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            <span>{isActive ? 'Pause' : 'Start'}</span>
          </button>
          <button 
            onClick={resetTimer}
            className="flex-1 bg-white/5 hover:bg-white/10 text-white/40 border border-white/10 py-4 rounded-lg font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
        </div>
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