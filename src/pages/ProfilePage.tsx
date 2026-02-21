import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, TrendingUp, User as UserIcon, Camera, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { THEME } from '@/constants';
import { isAppwriteConfigured } from '@/lib/appwrite';
import {
  logOut,
  saveUserPreferences,
  updateUserName,
  uploadAvatar,
} from '@/services/appwriteService';

/**
 * User profile page with name editing, avatar upload, and preference settings.
 */
export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser, updateUser, addToast } = useAppStore();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    if (isAppwriteConfigured()) {
      try {
        await logOut();
      } catch (err) {
        console.error('[ProfilePage] logout error:', err);
      }
    }
    setUser(null);
    navigate('/login');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset so same file can be re-selected
    if (!file) return;
    if (!isAppwriteConfigured() || !user.id || user.id === 'demo') {
      addToast('info', 'Avatar upload requires a real account.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const url = await uploadAvatar(file, user.id);
      updateUser({ avatar: url });
      await saveUserPreferences({
        startTime: user.preferences.startTime,
        endTime: user.preferences.endTime,
        dailyGoal: user.preferences.dailyGoal,
        streak: user.streak,
        avatar: url,
      });
      addToast('success', 'Avatar updated!');
    } catch (err) {
      console.error('[ProfilePage] avatar upload:', err);
      addToast('error', 'Could not upload avatar. Check your Storage bucket is configured.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleUpdatePreferences = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newName = (fd.get('displayName') as string).trim();
    const prefs = {
      startTime: fd.get('startTime') as string,
      endTime: fd.get('endTime') as string,
      dailyGoal: Number(fd.get('dailyGoal')),
      streak: user.streak,
      avatar: user.avatar,
    };

    setIsSaving(true);
    try {
      if (isAppwriteConfigured()) {
        // Update name if changed
        if (newName && newName !== user.name && user.id !== 'demo') {
          await updateUserName(newName);
        }
        await saveUserPreferences(prefs);
      }
      if (newName && newName !== user.name) {
        updateUser({ name: newName });
      }
      updateUser({ preferences: { startTime: prefs.startTime, endTime: prefs.endTime, dailyGoal: prefs.dailyGoal } });
      addToast('success', 'Profile saved!');
    } catch (err) {
      console.error('[ProfilePage] savePrefs:', err);
      addToast('error', 'Could not save profile to server.');
    } finally {
      setIsSaving(false);
    }
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
          {/* Avatar image or placeholder */}
          <div className="relative mb-6">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-28 h-28 rounded-full object-cover border-4 border-pilot-orange/20 shadow-2xl shadow-pilot-orange/10"
              />
            ) : (
              <div className="w-28 h-28 bg-pilot-orange/10 border-4 border-pilot-orange/20 rounded-full flex items-center justify-center text-pilot-orange shadow-2xl shadow-pilot-orange/10">
                <UserIcon size={56} />
              </div>
            )}

            {/* Upload trigger — label is universally browser-safe */}
            <label
              htmlFor="avatar-file-input"
              aria-label="Upload avatar"
              className={`absolute bottom-0 right-0 w-9 h-9 bg-pilot-orange rounded-full flex items-center justify-center text-white shadow-lg hover:bg-orange-500 transition-colors cursor-pointer ${isUploadingAvatar ? 'opacity-60 pointer-events-none' : ''}`}
            >
              {isUploadingAvatar ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Camera size={14} />
              )}
            </label>
            <input
              id="avatar-file-input"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleAvatarChange}
              disabled={isUploadingAvatar}
            />
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
            {/* Display Name */}
            <div className="space-y-3">
              <label className={THEME.label} htmlFor="displayName">
                Display Name
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                defaultValue={user.name}
                className={`${THEME.input} w-full`}
                placeholder="YOUR NAME"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className={THEME.label} htmlFor="startTime">
                  Start of Productive Day
                </label>
                <input
                  id="startTime"
                  name="startTime"
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
                  name="endTime"
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
                  name="dailyGoal"
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
                disabled={isSaving}
                className={`${THEME.buttonPrimary} px-12 py-3.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-pilot-orange/20 flex items-center gap-2 disabled:opacity-60`}
              >
                {isSaving && <Loader2 size={14} className="animate-spin" />}
                {isSaving ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
