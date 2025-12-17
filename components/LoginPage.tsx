import React, { useState } from 'react';
import { Zap, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';

interface LoginPageProps {
  onLogin: (user: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let result;
      if (isSignUp) {
        result = await authService.signUp(email, password);
      } else {
        result = await authService.signIn(email, password);
      }

      if (result.error) {
        setError(result.error);
      } else if (result.user) {
        onLogin(result.user);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      const result = await authService.signInWithGoogle();
      if (result.error) {
        setError(result.error);
      } else if (result.user) {
        onLogin(result.user);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-pilot-orange flex-col justify-between p-16">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="bg-white p-2 rounded-lg shadow-lg">
              <Zap size={32} className="text-pilot-orange" fill="currentColor" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-white">PACE PILOT</h1>
          </div>

          <div className="max-w-lg">
            <h2 className="text-6xl font-black text-white leading-tight mb-8 tracking-tight">
              FLOW WITH<br />YOUR ENERGY.
            </h2>
            <p className="text-xl text-white/90 leading-relaxed font-medium">
              The intelligent productivity sidekick that helps you work smarter, not harder.
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-black text-white/60 uppercase tracking-[0.3em]">
            EMPOWERING FOCUS • 2025
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 bg-deepnavy flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="bg-pilot-orange p-2 rounded-lg">
              <Zap size={24} className="text-white" fill="currentColor" />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white">PACE PILOT</h1>
          </div>

          <div className="mb-12">
            <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-3">
              {isSignUp ? 'CREATE ACCOUNT' : 'WELCOME BACK'}
            </h3>
            <p className="text-xs font-black text-white/30 uppercase tracking-[0.3em]">
              {isSignUp ? 'START YOUR JOURNEY' : 'SIGN IN TO YOUR DASHBOARD'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-400 font-medium">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-3">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="YOUR@EMAIL.COM"
                  className="w-full bg-prussianblue border border-white/10 rounded-lg px-4 py-4 text-sm text-white focus:outline-none focus:border-pilot-orange/50 transition-all placeholder:text-white/10 placeholder:font-bold placeholder:tracking-wider disabled:opacity-50"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-pilot-orange hover:text-white transition-colors"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-prussianblue border border-white/10 rounded-lg px-4 py-4 text-sm text-white focus:outline-none focus:border-pilot-orange/50 transition-all placeholder:text-white/10 disabled:opacity-50"
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>
              {isSignUp && (
                <p className="mt-2 text-[10px] text-white/30 font-medium">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-pilot-orange hover:bg-pilot-orange/90 text-white font-black py-4 rounded-lg transition-all active:scale-[0.98] text-xs uppercase tracking-[0.3em] shadow-lg shadow-pilot-orange/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>PROCESSING...</span>
                </>
              ) : (
                <span>{isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}</span>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-deepnavy px-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                Or continue with
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-white/90 text-deepnavy font-black py-4 rounded-lg transition-all active:scale-[0.98] text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google Account
          </button>

          <div className="mt-8 text-center">
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider">
              {isSignUp ? 'Already have an account?' : 'New to Pace Pilot?'}{' '}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-pilot-orange hover:text-white transition-colors font-black"
                disabled={isLoading}
              >
                {isSignUp ? 'SIGN IN' : 'CREATE AN ACCOUNT'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
