import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, Globe } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { THEME } from '@/constants';
import { User } from '@/types';

const DEMO_USER: User = {
  name: 'Nathaniel',
  email: 'hello@pacepilot.com',
  streak: 12,
  preferences: { startTime: '08:00', endTime: '18:00', dailyGoal: 8 },
};

/**
 * Authentication login page.
 * Currently uses a demo user for the Google OAuth simulation.
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setUser = useAppStore((s) => s.setUser);

  const handleAuth = () => {
    setUser(DEMO_USER);
    navigate('/');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 animate-in fade-in duration-700 bg-deepnavy">
      {/* Hero panel */}
      <div className="hidden lg:flex bg-pilot-orange flex-col justify-between p-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pilot-orange via-orange-600 to-deepnavy opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white mb-12">
            <Zap size={32} fill="currentColor" />
            <h1 className="text-2xl font-black tracking-tighter">PACE PILOT</h1>
          </div>
          <h2 className="text-6xl font-black text-white leading-none tracking-tighter max-w-md">
            FLOW WITH YOUR ENERGY.
          </h2>
          <p className="text-white/80 mt-6 text-lg max-w-sm">
            The intelligent productivity sidekick that helps you work smarter, not harder.
          </p>
        </div>
        <div className="relative z-10 text-white/60 text-sm font-bold tracking-widest uppercase">
          Empowering Focus • 2025
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h3 className="text-3xl font-black text-white tracking-tight uppercase">
              Welcome back
            </h3>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-2">
              Sign in to your dashboard
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleAuth();
            }}
          >
            <div className="space-y-2">
              <label className={THEME.label} htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                />
                <input
                  id="email"
                  type="email"
                  required
                  className={`${THEME.input} w-full pl-12`}
                  placeholder="YOUR@EMAIL.COM"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className={THEME.label} htmlFor="password">
                  Password
                </label>
                <button
                  type="button"
                  className="text-[9px] font-black text-pilot-orange uppercase tracking-widest hover:text-white"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                />
                <input
                  id="password"
                  type="password"
                  required
                  className={`${THEME.input} w-full pl-12`}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className={`${THEME.buttonPrimary} w-full py-4 text-xs font-black uppercase tracking-widest mt-4 shadow-lg shadow-pilot-orange/20`}
            >
              Sign In
            </button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="bg-deepnavy px-4 font-black text-white/20 uppercase tracking-widest">
                or continue with
              </span>
            </div>
          </div>

          <button
            onClick={handleAuth}
            className="w-full bg-white text-deepnavy font-black py-4 rounded-lg flex items-center justify-center gap-3 text-xs uppercase tracking-widest hover:bg-white/90 transition-all shadow-xl"
          >
            <Globe size={16} /> Google Account
          </button>

          <p className="text-center text-[10px] font-bold text-white/20 uppercase tracking-widest mt-6">
            New to Pace Pilot?{' '}
            <Link to="/signup" className="text-pilot-orange hover:text-white transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
