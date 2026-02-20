import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, Globe, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { THEME } from '@/constants';
import { isAppwriteConfigured } from '@/lib/appwrite';
import {
  logIn,
  getCurrentUser,
  loadUserData,
  loadUserPreferences,
  seedDefaultProjects,
} from '@/services/appwriteService';
import type { User, AppState } from '@/types';

const DEMO_USER: User = {
  name: 'Nathaniel (Demo)',
  email: 'demo@pacepilot.com',
  streak: 12,
  preferences: { startTime: '08:00', endTime: '18:00', dailyGoal: 8 },
};

/**
 * Login page.
 *
 * When Appwrite is configured: uses real email/password sessions.
 * Otherwise: bypasses auth and signs in with the demo user.
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, initializeData, addToast } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDemoLogin = () => {
    setUser(DEMO_USER);
    navigate('/');
  };

  /** Resolve user + data after a session is established. */
  const afterLogin = async () => {
    const appUser = await getCurrentUser();
    if (!appUser) return;

    const prefs = await loadUserPreferences();
    setUser({
      name: appUser.name,
      email: appUser.email,
      streak: prefs.streak,
      preferences: {
        startTime: prefs.startTime,
        endTime: prefs.endTime,
        dailyGoal: prefs.dailyGoal,
      },
    });

    let data = await loadUserData(appUser.$id);
    if (!data.projects?.length) {
      const projects = await seedDefaultProjects(appUser.$id);
      data = { ...data, projects } as Partial<AppState>;
    }
    initializeData({ ...data, currentStreak: prefs.streak });
    navigate('/');
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAppwriteConfigured()) { handleDemoLogin(); return; }

    setIsSubmitting(true);
    try {
      await logIn(email, password);
      await afterLogin();
    } catch (err) {
      console.error('[LoginPage]', err);
      addToast('error', 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
            {!isAppwriteConfigured() && (
              <p className="mt-3 text-[10px] text-pilot-orange/80 font-bold uppercase tracking-widest bg-pilot-orange/5 border border-pilot-orange/20 rounded-lg px-3 py-2">
                ⚡ Demo mode — Appwrite not configured
              </p>
            )}
          </div>

          <form className="space-y-4" onSubmit={handleEmailLogin}>
            <div className="space-y-2">
              <label className={THEME.label} htmlFor="login-email">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${THEME.input} w-full pl-12`}
                  placeholder="YOUR@EMAIL.COM"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className={THEME.label} htmlFor="login-password">
                  Password
                </label>
                <button type="button" className="text-[9px] font-black text-pilot-orange uppercase tracking-widest hover:text-white">
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${THEME.input} w-full pl-12`}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`${THEME.buttonPrimary} w-full py-4 text-xs font-black uppercase tracking-widest mt-4 shadow-lg shadow-pilot-orange/20 flex items-center justify-center gap-2 disabled:opacity-60`}
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isSubmitting ? 'Signing In…' : 'Sign In'}
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
            onClick={handleDemoLogin}
            className="w-full bg-white text-deepnavy font-black py-4 rounded-lg flex items-center justify-center gap-3 text-xs uppercase tracking-widest hover:bg-white/90 transition-all shadow-xl"
          >
            <Globe size={16} />
            {isAppwriteConfigured() ? 'Google Account' : 'Continue as Demo'}
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
