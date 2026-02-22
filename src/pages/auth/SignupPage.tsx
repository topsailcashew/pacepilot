import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Globe, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { THEME, DEMO_USER } from '@/constants';
import { isAppwriteConfigured } from '@/lib/appwrite';
import {
  signUp,
  getCurrentUser,
  loadUserPreferences,
  seedDefaultProjects,
  signInWithGoogle,
} from '@/services/appwriteService';

/**
 * Registration page.
 *
 * When Appwrite is configured: creates a real Appwrite account.
 * Otherwise: signs in as the demo user.
 */
export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, initializeData, addToast } = useAppStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDemoSignup = () => {
    setUser(DEMO_USER);
    navigate('/');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAppwriteConfigured()) { handleDemoSignup(); return; }

    setIsSubmitting(true);
    try {
      await signUp(name || email.split('@')[0], email, password);
      const appUser = await getCurrentUser();
      if (!appUser) throw new Error('Could not retrieve user after signup');

      const prefs = await loadUserPreferences();
      setUser({
        id: appUser.$id,
        name: appUser.name,
        email: appUser.email,
        avatar: prefs.avatar,
        streak: 0,
        preferences: {
          startTime: prefs.startTime,
          endTime: prefs.endTime,
          dailyGoal: prefs.dailyGoal,
        },
      });

      // Seed default projects for new account
      const projects = await seedDefaultProjects(appUser.$id);
      initializeData({ projects, tasks: [], calendarEvents: [], recurringTasks: [], dailyReports: [] });

      addToast('success', `Welcome to Pace Pilot, ${appUser.name}!`);
      navigate('/');
    } catch (err) {
      console.error('[SignupPage]', err);
      addToast('error', 'Could not create account. That email may already be in use.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-deepnavy p-8 animate-in zoom-in-95 duration-500">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="bg-pilot-orange p-2 rounded-lg text-white w-fit mx-auto mb-8 shadow-xl shadow-pilot-orange/20">
            <Zap size={24} fill="currentColor" />
          </div>
          <h3 className="text-3xl font-black text-white tracking-tight uppercase">
            Get Started
          </h3>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-2">
            Join Pace Pilot today
          </p>
          {!isAppwriteConfigured() && (
            <p className="mt-3 text-[10px] text-pilot-orange/80 font-bold uppercase tracking-widest bg-pilot-orange/5 border border-pilot-orange/20 rounded-lg px-3 py-2">
              ⚡ Demo mode — Appwrite not configured
            </p>
          )}
        </div>

        <form className="space-y-4" onSubmit={handleSignup}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={THEME.label} htmlFor="signup-name">
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`${THEME.input} w-full`}
                placeholder="NATHANIEL"
              />
            </div>
            <div className="space-y-2">
              <label className={THEME.label} htmlFor="signup-focus">
                Focus Area
              </label>
              <input
                id="signup-focus"
                type="text"
                className={`${THEME.input} w-full`}
                placeholder="CREATIVE"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={THEME.label} htmlFor="signup-email">
              Email Address
            </label>
            <input
              id="signup-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${THEME.input} w-full`}
              placeholder="HELLO@PACEPILOT.COM"
            />
          </div>

          <div className="space-y-2">
            <label className={THEME.label} htmlFor="signup-password">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${THEME.input} w-full`}
              placeholder="8+ CHARACTERS"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`${THEME.buttonPrimary} w-full py-4 text-xs font-black uppercase tracking-widest mt-4 shadow-lg shadow-pilot-orange/20 flex items-center justify-center gap-2 disabled:opacity-60`}
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {isSubmitting ? 'Creating Account…' : 'Create Account'}
          </button>
        </form>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5" />
          </div>
          <div className="relative flex justify-center text-[10px]">
            <span className="bg-deepnavy px-4 font-black text-white/20 uppercase tracking-widest">
              or sign up with
            </span>
          </div>
        </div>

        <button
          onClick={isAppwriteConfigured() ? signInWithGoogle : handleDemoSignup}
          className="w-full bg-white/5 border border-white/10 text-white font-black py-4 rounded-lg flex items-center justify-center gap-3 text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          <Globe size={16} />
          {isAppwriteConfigured() ? 'Google Account' : 'Continue as Demo'}
        </button>

        <p className="text-center text-[10px] font-bold text-white/20 uppercase tracking-widest mt-6">
          Already a member?{' '}
          <Link to="/login" className="text-pilot-orange hover:text-white transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
