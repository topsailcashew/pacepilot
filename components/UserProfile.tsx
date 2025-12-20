import React, { useState, useEffect, useMemo } from 'react';
import {
  User, Mail, Calendar, Zap, Settings as SettingsIcon, Shield, Bell, Palette,
  Keyboard, LogOut, Download, Trophy, Target, TrendingUp, Award, Edit2, Check, X as XIcon
} from 'lucide-react';

interface UserProfileProps {
  user: any;
  onClose: () => void;
  onLogout: () => void;
  onExport?: () => void;
  tasks?: any[];
  energyLevel?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onClose, onLogout, onExport, tasks = [], energyLevel = 'Medium' }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'achievements'>('profile');
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || user?.email?.split('@')[0] || 'User');

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'achievements' as const, label: 'Achievements', icon: Trophy },
    { id: 'settings' as const, label: 'Settings', icon: SettingsIcon },
  ];

  const handleSaveName = () => {
    // Save to localStorage for now
    localStorage.setItem('userDisplayName', displayName);
    setIsEditingName(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-prussianblue border border-white/10 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-8 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">User Profile</h2>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
            >
              <XIcon size={20} />
            </button>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pilot-orange to-pilot-orange/60 border-4 border-pilot-orange/20 flex items-center justify-center shadow-2xl">
              <User size={48} className="text-white" />
            </div>
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xl font-bold text-white focus:outline-none focus:border-pilot-orange"
                    autoFocus
                  />
                  <button onClick={handleSaveName} className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors">
                    <Check size={20} />
                  </button>
                  <button onClick={() => setIsEditingName(false)} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                    <XIcon size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-white">
                    {localStorage.getItem('userDisplayName') || displayName}
                  </h3>
                  <button onClick={() => setIsEditingName(true)} className="p-1.5 text-white/40 hover:text-pilot-orange transition-colors">
                    <Edit2 size={16} />
                  </button>
                </div>
              )}
              <p className="text-sm text-white/50 flex items-center gap-2">
                <Mail size={14} />
                {user?.email || 'No email'}
              </p>
              <p className="text-xs text-white/30 flex items-center gap-2 mt-2">
                <Calendar size={12} />
                Pilot since {new Date(user?.metadata?.creationTime || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
                    activeTab === tab.id
                      ? 'bg-pilot-orange text-white shadow-lg'
                      : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'profile' && <ProfileTab user={user} tasks={tasks} energyLevel={energyLevel} />}
          {activeTab === 'achievements' && <AchievementsTab tasks={tasks} />}
          {activeTab === 'settings' && <SettingsTab onExport={onExport} />}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all font-bold text-sm border border-red-500/20"
          >
            <LogOut size={16} />
            Sign Out
          </button>
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-lg bg-pilot-orange hover:bg-pilot-orange/90 text-white font-bold text-sm transition-all shadow-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfileTab: React.FC<{ user: any; tasks: any[]; energyLevel: string }> = ({ user, tasks, energyLevel }) => {
  // Calculate dynamic statistics
  const stats = useMemo(() => {
    const totalCompleted = tasks.filter(t => t.isCompleted).length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

    // Calculate streak
    let streak = 0;
    const today = new Date();
    const completedDates = new Set(
      tasks.filter(t => t.isCompleted).map(t => t.createdAt.split('T')[0])
    );

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      if (completedDates.has(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Get today's completed tasks
    const todayStr = today.toISOString().split('T')[0];
    const todayCompleted = tasks.filter(t => t.isCompleted && t.createdAt.startsWith(todayStr)).length;

    // Average tasks per day
    const daysActive = completedDates.size || 1;
    const avgPerDay = (totalCompleted / daysActive).toFixed(1);

    return {
      totalCompleted,
      completionRate,
      streak,
      todayCompleted,
      avgPerDay
    };
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-white/30 mb-4">Your Productivity</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-pilot-orange/20 to-pilot-orange/5 border border-pilot-orange/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={16} className="text-pilot-orange" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/40">Completed</span>
            </div>
            <p className="text-3xl font-black text-pilot-orange">{stats.totalCompleted}</p>
            <p className="text-[10px] text-white/30 mt-1 uppercase">All time</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-green-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/40">Success Rate</span>
            </div>
            <p className="text-3xl font-black text-green-400">{stats.completionRate}%</p>
            <p className="text-[10px] text-white/30 mt-1 uppercase">Completion</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-yellow-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/40">Streak</span>
            </div>
            <p className="text-3xl font-black text-yellow-400">{stats.streak}</p>
            <p className="text-[10px] text-white/30 mt-1 uppercase">Days</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/40">Daily Avg</span>
            </div>
            <p className="text-3xl font-black text-blue-400">{stats.avgPerDay}</p>
            <p className="text-[10px] text-white/30 mt-1 uppercase">Tasks/day</p>
          </div>
        </div>
      </div>

      {/* Current Energy */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-white/30 mb-4">Current State</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={18} className="text-pilot-orange" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/40">Energy Level</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                energyLevel === 'High' ? 'bg-red-500' :
                energyLevel === 'Medium' ? 'bg-yellow-500' :
                'bg-green-500'
              }`} />
              <p className="text-2xl font-black text-white">{energyLevel}</p>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target size={18} className="text-white/40" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/40">Today</span>
            </div>
            <p className="text-2xl font-black text-white">{stats.todayCompleted} <span className="text-sm text-white/40">tasks</span></p>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-white/30 mb-4">Account Details</h3>
        <div className="space-y-3">
          <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
            <label className="text-xs font-bold uppercase tracking-wider text-white/40 block mb-2">Email</label>
            <p className="text-white font-medium">{user?.email || 'No email'}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
            <label className="text-xs font-bold uppercase tracking-wider text-white/40 block mb-2">User ID</label>
            <p className="text-white/70 font-mono text-xs break-all">{user?.uid || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
              <label className="text-xs font-bold uppercase tracking-wider text-white/40 block mb-2">Joined</label>
              <p className="text-white font-medium text-sm">
                {new Date(user?.metadata?.creationTime || Date.now()).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
              <label className="text-xs font-bold uppercase tracking-wider text-white/40 block mb-2">Last Active</label>
              <p className="text-white font-medium text-sm">
                {new Date(user?.metadata?.lastSignInTime || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AchievementsTab: React.FC<{ tasks: any[] }> = ({ tasks }) => {
  const achievements = useMemo(() => {
    const completed = tasks.filter(t => t.isCompleted).length;
    const total = tasks.length;

    // Calculate streak
    let streak = 0;
    const today = new Date();
    const completedDates = new Set(
      tasks.filter(t => t.isCompleted).map(t => t.createdAt.split('T')[0])
    );

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      if (completedDates.has(dateStr)) streak++;
      else if (i > 0) break;
    }

    // Check for tasks with high energy
    const highEnergyCompleted = tasks.filter(t => t.isCompleted && t.energyRequired === 'High').length;

    return [
      {
        id: 'first_task',
        title: 'First Steps',
        description: 'Complete your first task',
        icon: '🎯',
        unlocked: completed >= 1,
        progress: Math.min(completed, 1),
        max: 1,
      },
      {
        id: 'ten_tasks',
        title: 'Getting Started',
        description: 'Complete 10 tasks',
        icon: '🚀',
        unlocked: completed >= 10,
        progress: Math.min(completed, 10),
        max: 10,
      },
      {
        id: 'fifty_tasks',
        title: 'Productive Pilot',
        description: 'Complete 50 tasks',
        icon: '⭐',
        unlocked: completed >= 50,
        progress: Math.min(completed, 50),
        max: 50,
      },
      {
        id: 'hundred_tasks',
        title: 'Century Club',
        description: 'Complete 100 tasks',
        icon: '💯',
        unlocked: completed >= 100,
        progress: Math.min(completed, 100),
        max: 100,
      },
      {
        id: 'week_streak',
        title: 'Consistent',
        description: '7 day streak',
        icon: '🔥',
        unlocked: streak >= 7,
        progress: Math.min(streak, 7),
        max: 7,
      },
      {
        id: 'month_streak',
        title: 'Dedicated',
        description: '30 day streak',
        icon: '💪',
        unlocked: streak >= 30,
        progress: Math.min(streak, 30),
        max: 30,
      },
      {
        id: 'high_energy',
        title: 'Peak Performer',
        description: 'Complete 20 high-energy tasks',
        icon: '⚡',
        unlocked: highEnergyCompleted >= 20,
        progress: Math.min(highEnergyCompleted, 20),
        max: 20,
      },
      {
        id: 'early_adopter',
        title: 'Early Adopter',
        description: 'Join Pace Pilot',
        icon: '✈️',
        unlocked: true,
        progress: 1,
        max: 1,
      },
    ];
  }, [tasks]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-pilot-orange/10 to-purple-500/10 border border-pilot-orange/20 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-white mb-2">Your Achievements</h3>
            <p className="text-sm text-white/60">
              Unlocked {unlockedCount} of {achievements.length} achievements
            </p>
          </div>
          <div className="text-5xl">{unlockedCount === achievements.length ? '🏆' : '🎖️'}</div>
        </div>
        <div className="mt-4 bg-white/5 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pilot-orange to-purple-500 transition-all duration-500"
            style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`p-5 rounded-xl border transition-all ${
              achievement.unlocked
                ? 'bg-gradient-to-br from-pilot-orange/10 to-pilot-orange/5 border-pilot-orange/30 shadow-lg'
                : 'bg-white/[0.02] border-white/5 opacity-60'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`text-4xl ${!achievement.unlocked && 'grayscale opacity-50'}`}>
                {achievement.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-bold text-white text-sm">{achievement.title}</h4>
                  {achievement.unlocked && (
                    <Award size={16} className="text-pilot-orange shrink-0" />
                  )}
                </div>
                <p className="text-xs text-white/50 mb-3">{achievement.description}</p>

                {!achievement.unlocked && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-white/40">Progress</span>
                      <span className="text-white/40">{achievement.progress}/{achievement.max}</span>
                    </div>
                    <div className="bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-pilot-orange/50 transition-all"
                        style={{ width: `${(achievement.progress / achievement.max) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {achievement.unlocked && (
                  <div className="text-[10px] text-pilot-orange font-bold uppercase tracking-wider">
                    ✓ Unlocked
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SettingsTab: React.FC<{ onExport?: () => void }> = ({ onExport }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('notificationsEnabled') !== 'false';
  });

  const [focusModeEnabled, setFocusModeEnabled] = useState(() => {
    return localStorage.getItem('focusModeEnabled') === 'true';
  });

  const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] = useState(() => {
    return localStorage.getItem('keyboardShortcutsEnabled') !== 'false';
  });

  const handleNotificationToggle = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    localStorage.setItem('notificationsEnabled', String(newValue));

    // Request notification permission if enabling
    if (newValue && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const handleFocusModeToggle = () => {
    const newValue = !focusModeEnabled;
    setFocusModeEnabled(newValue);
    localStorage.setItem('focusModeEnabled', String(newValue));
  };

  const handleKeyboardShortcutsToggle = () => {
    const newValue = !keyboardShortcutsEnabled;
    setKeyboardShortcutsEnabled(newValue);
    localStorage.setItem('keyboardShortcutsEnabled', String(newValue));
  };

  return (
    <div className="space-y-6">
      {/* Data Management */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-white/30 mb-4">Data Management</h3>
        <div className="space-y-3">
          {onExport && (
            <button
              onClick={onExport}
              className="w-full bg-pilot-orange/10 hover:bg-pilot-orange/20 border border-pilot-orange/20 rounded-lg p-4 text-left transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Download size={20} className="text-pilot-orange" />
                <div>
                  <p className="text-white font-bold text-sm">Export Data as JSON</p>
                  <p className="text-xs text-white/40 mt-1">Download all your tasks and settings</p>
                </div>
              </div>
              <div className="text-pilot-orange">→</div>
            </button>
          )}
        </div>
      </div>

      {/* Productivity Settings */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-white/30 mb-4">Productivity</h3>
        <div className="space-y-3">
          <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm">Desktop Notifications</p>
                <p className="text-xs text-white/40 mt-1">Get notified when Pomodoro timer completes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notificationsEnabled}
                  onChange={handleNotificationToggle}
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pilot-orange"></div>
              </label>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm">Auto Focus Mode</p>
                <p className="text-xs text-white/40 mt-1">Hide distractions when Pomodoro timer starts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={focusModeEnabled}
                  onChange={handleFocusModeToggle}
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pilot-orange"></div>
              </label>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm">Keyboard Shortcuts</p>
                <p className="text-xs text-white/40 mt-1">Enable keyboard shortcuts (press ? to see all)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={keyboardShortcutsEnabled}
                  onChange={handleKeyboardShortcutsToggle}
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pilot-orange"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Reference */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-white/30 mb-4">Keyboard Shortcuts</h3>
        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <Keyboard size={20} className="text-white/40" />
            <p className="text-white font-bold text-sm">Available Shortcuts</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/70">Quick add task</span>
              <kbd className="px-2.5 py-1 bg-deepnavy rounded text-xs font-mono text-white/70 border border-white/10">N</kbd>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/70">Search</span>
              <kbd className="px-2.5 py-1 bg-deepnavy rounded text-xs font-mono text-white/70 border border-white/10">⌘ K</kbd>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/70">Show shortcuts</span>
              <kbd className="px-2.5 py-1 bg-deepnavy rounded text-xs font-mono text-white/70 border border-white/10">?</kbd>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-white/70">Toggle focus mode</span>
              <kbd className="px-2.5 py-1 bg-deepnavy rounded text-xs font-mono text-white/70 border border-white/10">F</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Preview */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-white/30 mb-4">Appearance</h3>
        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <Palette size={20} className="text-white/40" />
            <div>
              <p className="text-white font-bold text-sm">Theme</p>
              <p className="text-xs text-white/40 mt-1">Currently using Dark theme</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-pilot-orange/20 border-2 border-pilot-orange rounded-lg p-3 text-center">
              <div className="w-full h-12 bg-deepnavy rounded mb-2"></div>
              <p className="text-xs font-bold text-pilot-orange">Dark</p>
              <p className="text-[10px] text-white/30 mt-1">Active</p>
            </div>
            <div className="bg-white/5 border-2 border-white/10 rounded-lg p-3 text-center opacity-50">
              <div className="w-full h-12 bg-white rounded mb-2"></div>
              <p className="text-xs font-bold text-white/40">Light</p>
              <p className="text-[10px] text-white/30 mt-1">Coming</p>
            </div>
            <div className="bg-white/5 border-2 border-white/10 rounded-lg p-3 text-center opacity-50">
              <div className="w-full h-12 bg-gradient-to-r from-deepnavy to-white rounded mb-2"></div>
              <p className="text-xs font-bold text-white/40">Auto</p>
              <p className="text-[10px] text-white/30 mt-1">Coming</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
