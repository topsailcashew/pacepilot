import React, { useState } from 'react';
import { User, Mail, Calendar, Zap, Settings as SettingsIcon, Shield, Bell, Palette, Keyboard, LogOut, Download } from 'lucide-react';

interface UserProfileProps {
  user: any;
  onClose: () => void;
  onLogout: () => void;
  onExport?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onClose, onLogout, onExport }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'preferences'>('profile');

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'settings' as const, label: 'Settings', icon: SettingsIcon },
    { id: 'preferences' as const, label: 'Preferences', icon: Palette },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-prussianblue border border-white/10 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">User Profile</h2>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-pilot-orange/20 border-2 border-pilot-orange flex items-center justify-center">
              <User size={40} className="text-pilot-orange" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                {user?.displayName || user?.email?.split('@')[0] || 'User'}
              </h3>
              <p className="text-sm text-white/50 flex items-center gap-2">
                <Mail size={14} />
                {user?.email || 'No email'}
              </p>
              <p className="text-xs text-white/30 flex items-center gap-2 mt-2">
                <Calendar size={12} />
                Member since {new Date(user?.metadata?.creationTime || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
                    activeTab === tab.id
                      ? 'bg-pilot-orange text-white'
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
          {activeTab === 'profile' && <ProfileTab user={user} />}
          {activeTab === 'settings' && <SettingsTab onExport={onExport} />}
          {activeTab === 'preferences' && <PreferencesTab />}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex items-center justify-between">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all font-bold text-sm"
          >
            <LogOut size={16} />
            Sign Out
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-pilot-orange hover:bg-pilot-orange/90 text-white font-bold text-sm transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfileTab: React.FC<{ user: any }> = ({ user }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-white/30 mb-4">Account Information</h3>
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <label className="text-xs font-bold uppercase tracking-wider text-white/40 block mb-2">Email</label>
            <p className="text-white font-medium">{user?.email || 'No email'}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <label className="text-xs font-bold uppercase tracking-wider text-white/40 block mb-2">User ID</label>
            <p className="text-white/70 font-mono text-xs">{user?.uid || 'N/A'}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <label className="text-xs font-bold uppercase tracking-wider text-white/40 block mb-2">Account Created</label>
            <p className="text-white font-medium">
              {new Date(user?.metadata?.creationTime || Date.now()).toLocaleString()}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <label className="text-xs font-bold uppercase tracking-wider text-white/40 block mb-2">Last Sign In</label>
            <p className="text-white font-medium">
              {new Date(user?.metadata?.lastSignInTime || Date.now()).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-white/30 mb-4">Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-pilot-orange/10 border border-pilot-orange/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-pilot-orange" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/40">Energy</span>
            </div>
            <p className="text-2xl font-black text-pilot-orange">Medium</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-white/40" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/40">Streak</span>
            </div>
            <p className="text-2xl font-black text-white">12 days</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsTab: React.FC<{ onExport?: () => void }> = ({ onExport }) => {
  return (
    <div className="space-y-6">
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
                  <p className="text-xs text-white/40 mt-1">Download all your data</p>
                </div>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-pilot-orange"
              >
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-white/30 mb-4">Security</h3>
        <div className="space-y-3">
          <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 text-left transition-all flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-white/40 group-hover:text-pilot-orange transition-colors" />
              <div>
                <p className="text-white font-bold text-sm">Two-Factor Authentication</p>
                <p className="text-xs text-white/40 mt-1">Add an extra layer of security</p>
              </div>
            </div>
            <span className="text-xs text-white/30 font-bold">Coming Soon</span>
          </button>

          <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 text-left transition-all flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <SettingsIcon size={20} className="text-white/40 group-hover:text-pilot-orange transition-colors" />
              <div>
                <p className="text-white font-bold text-sm">Change Password</p>
                <p className="text-xs text-white/40 mt-1">Update your password</p>
              </div>
            </div>
            <span className="text-xs text-white/30 font-bold">Coming Soon</span>
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-white/30 mb-4">Notifications</h3>
        <div className="space-y-3">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-white/40" />
                <div>
                  <p className="text-white font-bold text-sm">Desktop Notifications</p>
                  <p className="text-xs text-white/40 mt-1">Get notified about tasks and reminders</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pilot-orange"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PreferencesTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-white/30 mb-4">Appearance</h3>
        <div className="space-y-3">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Palette size={20} className="text-white/40" />
                <div>
                  <p className="text-white font-bold text-sm">Theme</p>
                  <p className="text-xs text-white/40 mt-1">Choose your preferred theme</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button className="bg-pilot-orange/20 border-2 border-pilot-orange rounded-lg p-3 text-center">
                <div className="w-full h-12 bg-deepnavy rounded mb-2"></div>
                <p className="text-xs font-bold text-pilot-orange">Dark</p>
              </button>
              <button className="bg-white/5 border-2 border-white/10 rounded-lg p-3 text-center opacity-50">
                <div className="w-full h-12 bg-white rounded mb-2"></div>
                <p className="text-xs font-bold text-white/40">Light</p>
                <p className="text-[10px] text-white/30 mt-1">Soon</p>
              </button>
              <button className="bg-white/5 border-2 border-white/10 rounded-lg p-3 text-center opacity-50">
                <div className="w-full h-12 bg-gradient-to-r from-deepnavy to-white rounded mb-2"></div>
                <p className="text-xs font-bold text-white/40">Auto</p>
                <p className="text-[10px] text-white/30 mt-1">Soon</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-white/30 mb-4">Productivity</h3>
        <div className="space-y-3">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm">Focus Mode</p>
                <p className="text-xs text-white/40 mt-1">Hide distractions when timer is active</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pilot-orange"></div>
              </label>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm">Keyboard Shortcuts</p>
                <p className="text-xs text-white/40 mt-1">Enable keyboard shortcuts (press ? to see all)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pilot-orange"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-white/30 mb-4">Keyboard Shortcuts</h3>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <Keyboard size={20} className="text-white/40" />
            <p className="text-white font-bold text-sm">Available Shortcuts</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/70">Quick add task</span>
              <kbd className="px-2 py-1 bg-deepnavy rounded text-xs font-mono text-white/70 border border-white/10">N</kbd>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/70">Search</span>
              <kbd className="px-2 py-1 bg-deepnavy rounded text-xs font-mono text-white/70 border border-white/10">⌘ K</kbd>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-white/70">Show shortcuts</span>
              <kbd className="px-2 py-1 bg-deepnavy rounded text-xs font-mono text-white/70 border border-white/10">?</kbd>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-white/70">Toggle focus mode</span>
              <kbd className="px-2 py-1 bg-deepnavy rounded text-xs font-mono text-white/70 border border-white/10">F</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
