import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, TrendingUp, User as UserIcon } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { THEME } from '@/constants';

/**
 * User profile page with personal settings and logout.
 */
export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser, addToast } = useAppStore();

  if (!user) return null;

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  const handleUpdatePreferences = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Placeholder: in a real app this would PATCH the user via an API
    addToast('success', 'Preferences saved!');
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12 max-w-5xl mx-auto space-y-10">
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tighter uppercase">
            User Profile
          </h3>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-2">
            Manage your productivity preferences
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500/20 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Avatar card */}
        <div
          className={`${THEME.card} lg:col-span-1 flex flex-col items-center justify-center text-center py-12`}
        >
          <div className="w-28 h-28 bg-pilot-orange/10 border-4 border-pilot-orange/20 rounded-full flex items-center justify-center text-pilot-orange mb-6 shadow-2xl shadow-pilot-orange/10">
            <UserIcon size={56} />
          </div>
          <h4 className="text-2xl font-black text-white tracking-tight uppercase">
            {user.name}
          </h4>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">
            {user.email}
          </p>
          <div className="mt-8 flex items-center gap-2 bg-pilot-orange px-6 py-2.5 rounded-full text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-pilot-orange/30">
            <TrendingUp size={16} /> {user.streak} Day Streak
          </div>
        </div>

        {/* Settings card */}
        <div className={`${THEME.card} lg:col-span-2 space-y-8`}>
          <h5 className="text-sm font-black text-white/40 uppercase tracking-widest border-b border-white/5 pb-4">
            Personal Settings
          </h5>

          <form className="space-y-8" onSubmit={handleUpdatePreferences}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className={THEME.label} htmlFor="startTime">
                  Start of Productive Day
                </label>
                <input
                  id="startTime"
                  type="time"
                  defaultValue={user.preferences.startTime}
                  className={`${THEME.input} w-full`}
                />
              </div>

              <div className="space-y-3">
                <label className={THEME.label} htmlFor="endTime">
                  End of Productive Day
                </label>
                <input
                  id="endTime"
                  type="time"
                  defaultValue={user.preferences.endTime}
                  className={`${THEME.input} w-full`}
                />
              </div>

              <div className="space-y-3">
                <label className={THEME.label} htmlFor="dailyGoal">
                  Daily Task Goal
                </label>
                <select
                  id="dailyGoal"
                  className={`${THEME.input} w-full`}
                  defaultValue={user.preferences.dailyGoal}
                >
                  {[3, 5, 8, 12].map((n) => (
                    <option key={n} value={n}>
                      {n} Tasks
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className={THEME.label} htmlFor="musicPreset">
                  Focus Music Preset
                </label>
                <select id="musicPreset" className={`${THEME.input} w-full`}>
                  <option>Lo-Fi Chill</option>
                  <option>Deep Jazz</option>
                  <option>Synth Focus</option>
                </select>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 flex justify-end">
              <button
                type="submit"
                className={`${THEME.buttonPrimary} px-12 py-3.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-pilot-orange/20`}
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
