import React, { useState, useEffect } from 'react';
import { X, Zap, Target, Calendar, BarChart2, Layers } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface AIPilotProps {
  taskCount?: number;
  completedToday?: number;
  energyLevel?: string;
}

interface TipMessage {
  message: string;
  icon: typeof Zap;
  mood: 'encouraging' | 'neutral' | 'excited' | 'focused';
}

const AIPilot: React.FC<AIPilotProps> = ({ taskCount = 0, completedToday = 0, energyLevel = 'Medium' }) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentTip, setCurrentTip] = useState<TipMessage | null>(null);
  const location = useLocation();

  // Tips based on context
  const tips: Record<string, TipMessage[]> = {
    '/': [
      { message: "Hey pilot! Match your tasks to your energy level - work smarter, not harder.", icon: Zap, mood: 'encouraging' },
      { message: "Feeling low energy? Tackle those easy wins first. Build momentum!", icon: Target, mood: 'focused' },
      { message: "Pro tip: Your energy fluctuates. Plan heavy tasks when you're at your peak.", icon: Zap, mood: 'neutral' },
      { message: `${completedToday} tasks done today! Keep the streak alive.`, icon: Target, mood: 'excited' },
      { message: "Break big tasks into smaller chunks. Your future self will thank you!", icon: Layers, mood: 'encouraging' },
    ],
    '/planner': [
      { message: "Planning ahead is a superpower. Map out your week!", icon: Calendar, mood: 'focused' },
      { message: "Balance is key - don't overload any single day.", icon: Target, mood: 'neutral' },
      { message: "Thursday afternoon slump is real. Plan lighter tasks then!", icon: Zap, mood: 'encouraging' },
    ],
    '/projects': [
      { message: "Group similar tasks together. Context switching drains energy fast.", icon: Layers, mood: 'focused' },
      { message: "Each project needs its own vibe. Match tasks to your energy zones.", icon: Zap, mood: 'neutral' },
      { message: "Stuck on a project? Sometimes stepping away brings clarity.", icon: Target, mood: 'encouraging' },
    ],
    '/reports': [
      { message: "Data tells the story - use it to optimize your flow state.", icon: BarChart2, mood: 'focused' },
      { message: "Notice patterns in your energy peaks? Schedule crucial tasks there!", icon: Zap, mood: 'encouraging' },
      { message: "Celebrate wins, even small ones. Progress is progress!", icon: Target, mood: 'excited' },
    ],
    '/calendar': [
      { message: "Time blocking works wonders. Block focus time like it's a meeting!", icon: Calendar, mood: 'focused' },
      { message: "Leave buffer time between tasks. Your brain needs to shift gears.", icon: Zap, mood: 'neutral' },
    ],
  };

  // Select contextual tip based on current page
  useEffect(() => {
    const pageTips = tips[location.pathname] || tips['/'];
    const randomTip = pageTips[Math.floor(Math.random() * pageTips.length)];
    setCurrentTip(randomTip);
    setIsDismissed(false);
  }, [location.pathname]);

  // Rotate tips every 20 seconds
  useEffect(() => {
    if (isDismissed) return;

    const interval = setInterval(() => {
      const pageTips = tips[location.pathname] || tips['/'];
      const randomTip = pageTips[Math.floor(Math.random() * pageTips.length)];
      setCurrentTip(randomTip);
    }, 20000);

    return () => clearInterval(interval);
  }, [location.pathname, isDismissed]);

  if (isDismissed || !currentTip) return null;

  const moodStyles = {
    encouraging: 'from-green-500/20 to-green-500/5 border-green-500/30',
    neutral: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
    excited: 'from-pilot-orange/20 to-pilot-orange/5 border-pilot-orange/30',
    focused: 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
  };

  const Icon = currentTip.icon;

  return (
    <div className="fixed bottom-24 right-6 z-40 animate-in slide-in-from-bottom-4 duration-500">
      {/* Pilot Character */}
      <div className="relative">
        {/* Speech Bubble */}
        <div className={`mb-4 mr-4 max-w-xs bg-gradient-to-br ${moodStyles[currentTip.mood]} backdrop-blur-sm border rounded-2xl p-4 shadow-2xl relative animate-in fade-in duration-300`}>
          <button
            onClick={() => setIsDismissed(true)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors group"
          >
            <X size={12} className="text-white/40 group-hover:text-white/70" />
          </button>

          <div className="flex gap-3">
            <Icon size={18} className="text-white/60 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-white/90 leading-relaxed">
              {currentTip.message}
            </p>
          </div>

          {/* Speech bubble arrow */}
          <div className="absolute -bottom-2 right-8 w-4 h-4 bg-gradient-to-br from-white/10 to-transparent border-r border-b border-white/20 rotate-45" />
        </div>

        {/* Pilot Avatar */}
        <div className="ml-auto w-16 h-16 bg-gradient-to-br from-pilot-orange to-pilot-orange/70 rounded-full flex items-center justify-center shadow-2xl shadow-pilot-orange/20 border-4 border-white/10 animate-float">
          <div className="text-2xl">✈️</div>
        </div>

        {/* Pulsing ring */}
        <div className="absolute inset-0 w-16 h-16 ml-auto bg-pilot-orange/30 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
      </div>
    </div>
  );
};

export default AIPilot;
