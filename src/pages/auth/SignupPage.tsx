import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Globe } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { THEME } from '@/constants';
import { User } from '@/types';

const NEW_USER: User = {
  name: 'Nathaniel',
  email: 'hello@pacepilot.com',
  streak: 0,
  preferences: { startTime: '08:00', endTime: '18:00', dailyGoal: 5 },
};

/**
 * Registration page. Simulates OAuth sign-up with a demo account.
 */
export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const setUser = useAppStore((s) => s.setUser);

  const handleAuth = () => {
    setUser(NEW_USER);
    navigate('/');
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
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleAuth();
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={THEME.label} htmlFor="firstName">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                required
                className={`${THEME.input} w-full`}
                placeholder="NATHANIEL"
              />
            </div>
            <div className="space-y-2">
              <label className={THEME.label} htmlFor="focus">
                Focus Area
              </label>
              <input
                id="focus"
                type="text"
                className={`${THEME.input} w-full`}
                placeholder="CREATIVE"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={THEME.label} htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              className={`${THEME.input} w-full`}
              placeholder="HELLO@PACEPILOT.COM"
            />
          </div>

          <div className="space-y-2">
            <label className={THEME.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              className={`${THEME.input} w-full`}
              placeholder="8+ CHARACTERS"
            />
          </div>

          <button
            type="submit"
            className={`${THEME.buttonPrimary} w-full py-4 text-xs font-black uppercase tracking-widest mt-4 shadow-lg shadow-pilot-orange/20`}
          >
            Create Account
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
          onClick={handleAuth}
          className="w-full bg-white/5 border border-white/10 text-white font-black py-4 rounded-lg flex items-center justify-center gap-3 text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          <Globe size={16} /> Google Account
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
