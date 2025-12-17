import React from 'react';
import { Zap } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-deepnavy flex items-center justify-center overflow-hidden">
      <div className="flex flex-col items-center gap-12">
        {/* Animated Logo */}
        <div className="relative">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 w-32 h-32 border-4 border-pilot-orange/20 rounded-full animate-spin-slow" />

          {/* Middle rotating ring */}
          <div className="absolute inset-2 w-28 h-28 border-4 border-pilot-orange/40 rounded-full animate-spin-reverse" />

          {/* Inner glowing circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-pilot-orange/10 rounded-full blur-xl animate-pulse" />
          </div>

          {/* Logo */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="bg-pilot-orange p-4 rounded-2xl shadow-2xl shadow-pilot-orange/50 animate-pulse-slow">
              <Zap size={48} className="text-white" fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <h2 className="text-xl font-black uppercase tracking-[0.5em] text-white mb-4 animate-pulse">
            LAUNCHING PACE PILOT
          </h2>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-pilot-orange animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-pilot-orange animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-pilot-orange animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>

        {/* Subtle background glow effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pilot-orange/5 rounded-full blur-3xl animate-pulse" />
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .animate-spin-reverse {
          animation: spin-reverse 2s linear infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
