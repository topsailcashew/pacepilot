import React from 'react';
import { Loader2, Zap } from 'lucide-react';

/**
 * Full-screen loading overlay shown while initial app data is being fetched.
 */
export const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-deepnavy flex items-center justify-center font-sans">
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <Loader2 className="w-16 h-16 text-pilot-orange animate-spin" />
        <Zap
          className="w-6 h-6 text-pilot-orange absolute inset-0 m-auto animate-pulse"
          fill="currentColor"
        />
      </div>
      <p className="text-[12px] font-black uppercase tracking-[0.6em] text-white animate-pulse">
        Launching Pace Pilot
      </p>
    </div>
  </div>
);
