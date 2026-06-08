/**
 * ProfilePage — comprehensive settings hub.
 *
 * Sections:
 *  1. Account (avatar, name, email)
 *  2. Appearance (theme, accent)
 *  3. Working Hours & Daily Goal
 *  4. Zone Schedule (view/edit ZONE_RANGES)
 *  5. Google Integration status
 *  6. Notifications (placeholder toggles)
 *  7. Danger Zone (logout, delete)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, TrendingUp, User as UserIcon, Camera, Loader2,
  Sun, Moon, Palette, Clock, Bell, ShieldAlert,
  CheckCircle2, XCircle, RefreshCw, CalendarDays, HardDrive,
  Mail,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { THEME, ZONES, ZONE_KEYS } from '@/constants';
import { isAppwriteConfigured } from '@/lib/appwrite';
import {
  logOut,
  saveUserPreferences,
  updateUserName,
  uploadAvatar,
  signInWithGoogle,
} from '@/services/appwriteService';

// ── Small section wrapper ─────────────────────────────────────────────────────

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  title, icon, children
}) => (
  <div className={THEME.card + ' space-y-6'}>
    <div className="flex items-center gap-3 pb-4 border-b border-white/5">
      <span className="text-pilot-orange">{icon}</span>
      <h3 className="text-[11px] font-black text-white/50 uppercase tracking-[0.2em]">{title}</h3>
    </div>
    {children}
  </div>
);

// ── Toggle row ────────────────────────────────────────────────────────────────

const Toggle: React.FC<{ label: string; description?: string; value: boolean; onChange: (v: boolean) => void }> = ({
  label, description, value, onChange
}) => (
  <div className="flex items-center justify-between gap-4 py-1">
    <div>
      <p className="text-sm font-bold text-white/70">{label}</p>
      {description && <p className="text-[10px] text-white/20 mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-checked={value}
      role="switch"
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-pilot-orange/50 ${value ? 'bg-pilot-orange' : 'bg-white/10'}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${value ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  </div>
);

// ── Integration status row ────────────────────────────────────────────────────

const IntegrationRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  description: string;
  connected: boolean;
}> = ({ icon, label, description, connected }) => (
  <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40 shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-white/70">{label}</p>
      <p className="text-[10px] text-white/20">{description}</p>
    </div>
    {connected ? (
      <div className="flex items-center gap-1.5 shrink-0">
        <CheckCircle2 size={14} className="text-green-400" />
        <span className="text-[9px] font-black uppercase tracking-widest text-green-400">Active</span>
      </div>
    ) : (
      <div className="flex items-center gap-1.5 shrink-0">
        <XCircle size={14} className="text-white/20" />
        <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Not connected</span>
      </div>
    )}
  </div>
);

// ── Page component ────────────────────────────────────────────────────────────

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser, updateUser, addToast, theme, toggleTheme, googleAccessToken } = useAppStore();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Notification toggles (UI only — no backend yet)
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [notifOverdue,  setNotifOverdue]  = useState(true);
  const [notifEvents,   setNotifEvents]   = useState(true);
  const [notifStreak,   setNotifStreak]   = useState(true);
  const [notifReport,   setNotifReport]   = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    if (isAppwriteConfigured()) {
      try { await logOut(); } catch (err) { console.error('[ProfilePage] logout:', err); }
    }
    setUser(null);
    navigate('/login');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!isAppwriteConfigured() || !user.id || user.id === 'demo') {
      addToast('info', 'Avatar upload requires a real account.');
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const url = await uploadAvatar(file, user.id);
      updateUser({ avatar: url });
      await saveUserPreferences({ ...user.preferences, streak: user.streak, avatar: url });
      addToast('success', 'Avatar updated!');
    } catch (err) {
      console.error('[ProfilePage] avatar:', err);
      addToast('error', 'Could not upload avatar.');
    } finally { setIsUploadingAvatar(false); }
  };

  /**
   * Sign out of Appwrite, then immediately redirect to Google OAuth.
   * This forces Google to show the consent screen (fresh session = fresh grant).
   */
  const handleForceReconnect = async () => {
    setIsReconnecting(true);
    try {
      if (isAppwriteConfigured()) await logOut();
    } catch { /* ignore */ }
    // Small delay so Appwrite session is cleared before redirect
    setTimeout(() => {
      setUser(null);
      signInWithGoogle(); // full redirect — page will reload on return
    }, 300);
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
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
        if (newName && newName !== user.name && user.id !== 'demo') await updateUserName(newName);
        await saveUserPreferences(prefs);
      }
      if (newName && newName !== user.name) updateUser({ name: newName });
      updateUser({ preferences: { startTime: prefs.startTime, endTime: prefs.endTime, dailyGoal: prefs.dailyGoal } });
      addToast('success', 'Settings saved!');
    } catch (err) {
      console.error('[ProfilePage] save:', err);
      addToast('error', 'Could not save to server.');
    } finally { setIsSaving(false); }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12 max-w-4xl mx-auto space-y-8">

      {/* ── 1. Account ────────────────────────────────────────────────────── */}
      <Section title="Account" icon={<UserIcon size={16} />}>
        <div className="flex flex-col sm:flex-row gap-8 items-start">
          {/* Avatar */}
          <div className="relative shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-pilot-orange/20"
              />
            ) : (
              <div className="w-24 h-24 bg-pilot-orange/10 border-2 border-pilot-orange/20 rounded-2xl flex items-center justify-center text-pilot-orange">
                <UserIcon size={40} />
              </div>
            )}
            <label
              htmlFor="avatar-file-input"
              className={`absolute -bottom-2 -right-2 w-8 h-8 bg-pilot-orange rounded-xl flex items-center justify-center text-white shadow-lg hover:bg-orange-500 cursor-pointer transition-colors ${isUploadingAvatar ? 'opacity-60 pointer-events-none' : ''}`}
            >
              {isUploadingAvatar ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
            </label>
            <input id="avatar-file-input" type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} disabled={isUploadingAvatar} />
          </div>

          {/* Name / email */}
          <div className="flex-1 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className={THEME.label} htmlFor="displayName">Display Name</label>
                <input id="displayName" name="displayName" type="text" defaultValue={user.name} form="profile-form" className={`${THEME.input} w-full`} />
              </div>
              <div className="space-y-2">
                <label className={THEME.label}>Email</label>
                <input type="email" readOnly value={user.email} className={`${THEME.input} w-full opacity-40 cursor-not-allowed`} />
              </div>
            </div>

            {/* Streak badge */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-pilot-orange/10 border border-pilot-orange/20 px-4 py-2 rounded-xl text-pilot-orange">
                <TrendingUp size={14} />
                <span className="text-[11px] font-black uppercase tracking-widest">{user.streak}-Day Streak</span>
              </div>
              <span className="text-[10px] text-white/20 uppercase tracking-widest">Keep it up!</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 2. Appearance ─────────────────────────────────────────────────── */}
      <Section title="Appearance" icon={<Palette size={16} />}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white/70">Theme</p>
            <p className="text-[10px] text-white/20 mt-0.5">Switch between dark and light mode</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border transition-all font-black text-xs uppercase tracking-widest ${
              theme === 'dark'
                ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                : 'bg-slate-800 border-slate-700 text-white/80 hover:bg-slate-700'
            }`}
          >
            {theme === 'dark' ? <><Sun size={15} /> Light Mode</> : <><Moon size={15} /> Dark Mode</>}
          </button>
        </div>
      </Section>

      {/* ── 3. Working Hours ──────────────────────────────────────────────── */}
      <Section title="Working Hours & Goals" icon={<Clock size={16} />}>
        <form id="profile-form" onSubmit={handleSaveProfile}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className={THEME.label} htmlFor="startTime">Day Starts</label>
              <input id="startTime" name="startTime" type="time" defaultValue={user.preferences.startTime} className={`${THEME.input} w-full`} />
            </div>
            <div className="space-y-2">
              <label className={THEME.label} htmlFor="endTime">Day Ends</label>
              <input id="endTime" name="endTime" type="time" defaultValue={user.preferences.endTime} className={`${THEME.input} w-full`} />
            </div>
            <div className="space-y-2">
              <label className={THEME.label} htmlFor="dailyGoal">Daily Task Goal</label>
              <select id="dailyGoal" name="dailyGoal" defaultValue={user.preferences.dailyGoal} className={`${THEME.input} w-full`}>
                {[3, 5, 8, 12, 15, 20].map((n) => (
                  <option key={n} value={n}>{n} Tasks</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              form="profile-form"
              className={`${THEME.buttonPrimary} px-8 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-60`}
            >
              {isSaving && <Loader2 size={13} className="animate-spin" />}
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Section>

      {/* ── 4. Zone Schedule ─────────────────────────────────────────────── */}
      <Section title="Energy Zone Schedule" icon={<CalendarDays size={16} />}>
        <p className="text-[10px] text-white/20 uppercase tracking-widest -mt-2">
          Your daily rhythm — when each zone activates
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ZONE_KEYS.map((z) => {
            const meta = ZONES[z];
            return (
              <div key={z} className={`rounded-xl border ${meta.border} ${meta.chipBg} px-4 py-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${meta.bg}`} />
                  <span className={`text-[11px] font-black uppercase tracking-widest ${meta.text}`}>
                    {meta.label}
                  </span>
                </div>
                <p className="text-[10px] text-white/40 font-bold">{meta.description}</p>
                <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-1">
                  <Clock size={9} className="inline mr-1" />{meta.hours}
                </p>
              </div>
            );
          })}
        </div>
        <p className="text-[9px] text-white/15 uppercase tracking-widest">
          Zone times are automatically detected from your system clock. Manual override is available on the Workday page.
        </p>
      </Section>

      {/* ── 5. Google Integration ─────────────────────────────────────────── */}
      <Section title="Google Integration" icon={<RefreshCw size={16} />}>

        {/* Service status rows */}
        <div className="space-y-3">
          <IntegrationRow
            icon={<CalendarDays size={16} />}
            label="Google Calendar"
            description="Sync events from your Google Calendar"
            connected={!!googleAccessToken}
          />
          <IntegrationRow
            icon={<HardDrive size={16} />}
            label="Google Drive"
            description="Browse files directly in PacePilot"
            connected={!!googleAccessToken}
          />
          <IntegrationRow
            icon={<Mail size={16} />}
            label="Gmail"
            description="Read and label emails in the Mail section"
            connected={!!googleAccessToken}
          />
        </div>

        {googleAccessToken ? (
          <p className="text-[10px] text-green-400/60 uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 size={13} /> Google session active
          </p>
        ) : (
          <button
            onClick={handleForceReconnect}
            disabled={isReconnecting}
            className={`${THEME.buttonPrimary} flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest disabled:opacity-60`}
          >
            {isReconnecting ? (
              <><Loader2 size={13} className="animate-spin" /> Signing out…</>
            ) : (
              <><RefreshCw size={13} /> Connect Google</>
            )}
          </button>
        )}
      </Section>

      {/* ── 6. Notifications ──────────────────────────────────────────────── */}
      <Section title="Notifications" icon={<Bell size={16} />}>
        <div className="space-y-4 divide-y divide-white/5">
          <Toggle
            label="Overdue task alerts"
            description="Notify when tasks are past their due date"
            value={notifOverdue}
            onChange={setNotifOverdue}
          />
          <div className="pt-4">
            <Toggle
              label="Upcoming event reminders"
              description="Alert 15 minutes before calendar events"
              value={notifEvents}
              onChange={setNotifEvents}
            />
          </div>
          <div className="pt-4">
            <Toggle
              label="Streak reminders"
              description="Daily nudge to maintain your productivity streak"
              value={notifStreak}
              onChange={setNotifStreak}
            />
          </div>
          <div className="pt-4">
            <Toggle
              label="End-of-day report"
              description="Prompt to generate AI daily insight at end of day"
              value={notifReport}
              onChange={setNotifReport}
            />
          </div>
        </div>
        <p className="text-[9px] text-white/10 uppercase tracking-widest">
          Browser push notifications must be granted. Changes take effect on next session.
        </p>
      </Section>

      {/* ── 7. Danger Zone ────────────────────────────────────────────────── */}
      <Section title="Danger Zone" icon={<ShieldAlert size={16} />}>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
            <div>
              <p className="text-sm font-bold text-red-400">Sign out</p>
              <p className="text-[10px] text-white/30 mt-0.5">End your current session and return to login</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all shrink-0"
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>
      </Section>

    </div>
  );
};
