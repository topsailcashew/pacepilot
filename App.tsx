import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Home,
  BarChart2,
  Layers,
  Calendar,
  Zap,
  CheckCircle2,
  Plus,
  TrendingUp,
  Brain,
  X,
  Loader2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Search,
  Bell,
  Target,
  Menu,
  MoreVertical,
  Play,
  SkipBack,
  SkipForward,
  Settings,
  Volume2,
  LayoutGrid,
  Clock,
  Briefcase,
  Folder,
  Check,
  GripVertical,
  CalendarDays,
  Filter,
  ArrowUpDown,
  PlusCircle,
  ExternalLink,
  MapPin,
  Sparkles,
  ArrowLeft,
  Users,
  PieChart as PieChartIcon,
  Activity,
  ChevronRightSquare,
  MoreHorizontal,
  Printer,
  Sun,
  Moon,
  Music
} from 'lucide-react';
import { EnergyLevel, Task, Project, DailyReport, AppState, CalendarEvent, RecurringTask, Subtask } from './types';
import { ENERGY_LEVELS, CATEGORIES } from './constants';
import { generateDailyReport, getWeeklyInsights } from './services/geminiService';
import notificationService from './services/notificationService';
import { firestoreService } from './services/firestoreService';
import PomodoroTimer from './components/PomodoroTimer';
import LoginPage from './components/LoginPage';
import LoadingScreen from './components/LoadingScreen';
import UserProfile from './components/UserProfile';
import { ToastContainer, useToast } from './components/Toast';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import MobileBottomNav from './components/MobileBottomNav';
import MusicPlayer from './components/MusicPlayer';
import AIPilot from './components/AIPilot';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

// --- Shared Design Constants ---
const THEME = {
  card: "bg-prussianblue border border-white/5 rounded-xl p-8 shadow-xl shadow-black/20",
  innerCard: "bg-white/[0.03] border border-white/5 rounded-lg p-5 transition-all duration-300",
  buttonPrimary: "bg-pilot-orange hover:bg-pilot-orange/90 text-white font-bold rounded-lg transition-all active:scale-[0.98]",
  buttonSecondary: "bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-bold rounded-lg transition-all",
  input: "bg-deepnavy border border-white/10 focus:border-pilot-orange/50 rounded-lg px-4 py-3 text-sm text-white focus:outline-none transition-all placeholder:text-white/10",
  heading: "font-black tracking-tight uppercase",
  label: "text-[10px] font-black uppercase tracking-[0.2em] text-white/30"
};

interface TaskItemProps {
  task: Task;
  projects: Project[];
  toggleTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  onFocus: (task: Task) => void;
  isFocusing: boolean;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

interface WorkdayPageProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  toggleTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  setEnergy: (level: EnergyLevel) => void;
  duplicateTask: (id: string) => void;
  deleteTask: (id: string) => void;
  searchQuery?: string;
}

// --- Sidebar Component ---

const Sidebar = ({ isCollapsed, isOpen, setIsOpen, toggleCollapse }: { isCollapsed: boolean; isOpen: boolean; setIsOpen: (v: boolean) => void; toggleCollapse: () => void }) => {
  const location = useLocation();
  
  const sections = [
    {
      title: 'Planning',
      items: [
        { icon: Home, label: 'Workday', path: '/' },
        { icon: LayoutGrid, label: 'Weekly Planner', path: '/planner' },
        { icon: Calendar, label: 'Calendar', path: '/calendar' },
      ]
    },
    {
      title: 'Tasks',
      items: [
        { icon: Layers, label: 'Projects', path: '/projects' },
        { icon: Briefcase, label: 'Ministries', path: '/ministries' },
        { icon: RefreshCw, label: 'Recurring', path: '/recurring' },
      ]
    },
    {
      title: 'Analytics',
      items: [
        { icon: BarChart2, label: 'Reports', path: '/reports' },
      ]
    }
  ];

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-deepnavy border-r border-white/5 flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}`}>
        <div className="p-8 flex flex-col h-full overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-pilot-orange p-1.5 rounded-lg text-white shadow-lg shadow-pilot-orange/20">
              <Zap size={20} fill="currentColor" />
            </div>
            {!isCollapsed && <h1 className="text-xl font-black tracking-tighter text-white whitespace-nowrap">PACE PILOT</h1>}
          </div>
          
          <div className="space-y-10 flex-1">
            {sections.map((section, idx) => (
              <div key={idx} className="space-y-4">
                {!isCollapsed && <p className={THEME.label}>{section.title}</p>}
                <nav className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || (item.path === '/projects' && location.pathname.startsWith('/projects'));
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} p-3.5 rounded-lg transition-all duration-200 group relative ${isActive ? 'bg-pilot-orange text-white' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon size={18} className={isActive ? 'text-white' : 'text-white/30 group-hover:text-white/50'} />
                        {!isCollapsed && <span className="text-sm font-bold">{item.label}</span>}
                        {isCollapsed && (
                          <span className="absolute left-full ml-4 px-3 py-1.5 bg-prussianblue border border-white/10 rounded-lg text-xs font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
                            {item.label}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {/* Collapse Toggle Button */}
          <div className="hidden lg:block mt-auto pt-4 border-t border-white/5">
            <button
              onClick={toggleCollapse}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-lg bg-pilot-orange/10 hover:bg-pilot-orange/20 border border-pilot-orange/20 text-pilot-orange hover:text-pilot-orange transition-all group relative`}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <>
                  <ChevronRight size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="absolute left-full ml-4 px-3 py-1.5 bg-prussianblue border border-white/10 rounded-lg text-xs font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
                    Expand
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs font-bold uppercase tracking-wider">Collapse</span>
                  <ChevronLeft size={18} className="group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

// --- Header Component ---

const TopBar = ({ toggleSidebar, onLogout, onShowProfile, user, focusMode, toggleFocusMode, searchQuery, setSearchQuery, theme, toggleTheme, onShowMusicPlayer }: { toggleSidebar: () => void; onLogout: () => void; onShowProfile: () => void; user: any; focusMode: boolean; toggleFocusMode: () => void; searchQuery: string; setSearchQuery: (q: string) => void; theme: 'light' | 'dark'; toggleTheme: () => void; onShowMusicPlayer: () => void }) => {
  const [time, setTime] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = time.toLocaleTimeString('en-US', { hour12: false });

  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 shrink-0">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="lg:hidden p-2.5 bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"><Menu size={24} /></button>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">MISSION PARAMETERS</h2>
          <p className="text-[10px] text-white/30 font-bold mt-1 uppercase tracking-[0.2em]">{dateStr} • {timeStr}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative group hidden lg:block">
          <button className={`${THEME.buttonSecondary} px-4 py-2.5 flex items-center gap-3 text-sm`}>
            <Layers size={14} className="text-white/40" />
            Active Context
            <ChevronDown size={14} className="text-white/20" />
          </button>
        </div>
        <div className="flex-1 lg:w-80 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            placeholder="QUICK SEARCH..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${THEME.input} w-full pl-11 py-2.5 font-bold uppercase tracking-widest`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button className="bg-prussianblue border border-white/10 p-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-pilot-orange rounded-full animate-pulse"></span>
        </button>
        <button
          onClick={toggleTheme}
          className="bg-prussianblue border border-white/10 p-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button
          onClick={onShowMusicPlayer}
          className="bg-prussianblue border border-white/10 p-2.5 rounded-lg text-white/40 hover:text-pilot-orange hover:bg-white/5 transition-all"
          title="Music Player"
        >
          <Music size={20} />
        </button>
        <button
          onClick={toggleFocusMode}
          className={`border p-2.5 rounded-lg transition-all ${
            focusMode
              ? 'bg-pilot-orange border-pilot-orange text-white'
              : 'bg-prussianblue border-white/10 text-white/40 hover:text-white hover:bg-white/5'
          }`}
          title={focusMode ? 'Exit Focus Mode (F)' : 'Enter Focus Mode (F)'}
        >
          <Target size={20} />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="bg-prussianblue border border-white/10 p-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
          >
            <Users size={20} />
          </button>
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-prussianblue border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
              <div className="p-3 border-b border-white/5 bg-white/5">
                <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Signed in as</p>
                <p className="text-sm font-bold text-white truncate">{user?.email || 'User'}</p>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onShowProfile();
                }}
                className="w-full text-left px-4 py-3 text-sm font-bold text-white/70 hover:text-pilot-orange hover:bg-white/5 transition-all flex items-center gap-2"
              >
                <Users size={14} />
                <span className="uppercase tracking-wider">View Profile</span>
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onLogout();
                }}
                className="w-full text-left px-4 py-3 text-sm font-bold text-white/70 hover:text-red-400 hover:bg-white/5 transition-all flex items-center gap-2 border-t border-white/5"
              >
                <ArrowLeft size={14} />
                <span className="uppercase tracking-wider">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// --- Modal Component ---

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children?: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-prussianblue border border-white/10 rounded-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <h3 className="text-lg font-black text-white uppercase tracking-widest">{title}</h3>
          <button onClick={onClose} className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-lg transition-all"><X size={24} /></button>
        </div>
        <div className="p-8 overflow-y-auto max-h-[80vh] custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

// --- Task Item Component ---

const TaskItem = ({ task, projects, toggleTask, updateTask, onFocus, isFocusing, onDuplicate, onDelete }: TaskItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStartTime, setTrackingStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCompleting(true);
    setTimeout(() => {
      toggleTask(task.id);
      setIsCompleting(false);
    }, 300);
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (newSubtaskTitle.trim()) {
      const newSubtask: Subtask = {
        id: Math.random().toString(36).substr(2, 9),
        title: newSubtaskTitle.trim(),
        isCompleted: false
      };
      const updatedSubtasks = [...(task.subtasks || []), newSubtask];
      updateTask(task.id, { subtasks: updatedSubtasks });
      setNewSubtaskTitle('');
    }
  };

  const handleToggleSubtask = (subtaskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSubtasks = (task.subtasks || []).map(st =>
      st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
    );
    updateTask(task.id, { subtasks: updatedSubtasks });
  };

  const handleDeleteSubtask = (subtaskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSubtasks = (task.subtasks || []).filter(st => st.id !== subtaskId);
    updateTask(task.id, { subtasks: updatedSubtasks });
  };

  const handleStartTracking = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTracking(true);
    setTrackingStartTime(Date.now());
    setElapsedTime(task.timeSpent || 0);
  };

  const handleStopTracking = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (trackingStartTime) {
      const additionalMinutes = Math.floor((Date.now() - trackingStartTime) / 60000);
      const totalMinutes = (task.timeSpent || 0) + additionalMinutes;
      updateTask(task.id, { timeSpent: totalMinutes });
      setElapsedTime(totalMinutes);
    }
    setIsTracking(false);
    setTrackingStartTime(null);
  };

  // Update elapsed time while tracking
  useEffect(() => {
    if (isTracking && trackingStartTime) {
      const interval = setInterval(() => {
        const additionalMinutes = Math.floor((Date.now() - trackingStartTime) / 60000);
        setElapsedTime((task.timeSpent || 0) + additionalMinutes);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isTracking, trackingStartTime, task.timeSpent]);

  const currentProject = projects.find(p => p.id === task.projectId);

  return (
    <div 
      onClick={() => setIsExpanded(!isExpanded)}
      className={`group bg-white/[0.02] border border-white/5 rounded-xl p-4 transition-all duration-300 hover:bg-white/[0.04] cursor-pointer ${isFocusing ? 'ring-1 ring-pilot-orange/40' : ''} ${isExpanded ? 'bg-white/[0.04]' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className="text-white/10 group-hover:text-white/30 transition-colors">
          <GripVertical size={16} />
        </div>
        
        <button 
          onClick={handleToggleComplete}
          className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${task.isCompleted ? 'bg-pilot-orange border-pilot-orange text-white' : 'border-white/10 group-hover:border-pilot-orange/50'} ${isCompleting ? 'animate-bounce-short scale-110' : ''}`}
        >
          {task.isCompleted && <Check size={12} strokeWidth={4} />}
        </button>
        
        <div className="flex-1 overflow-hidden">
          <h4 className={`text-sm font-bold transition-all truncate ${task.isCompleted ? 'line-through text-white/20' : 'text-white/80'}`}>{task.title}</h4>
          {!isExpanded && (
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-white/20">
                <Zap size={10} className="text-white/40" />
                <span className="text-[10px] font-black uppercase tracking-widest">{task.energyRequired}</span>
              </div>
              {currentProject && (
                <div className="flex items-center gap-1.5 text-white/20">
                  <Layers size={10} className="text-white/40" />
                  <span className="text-[10px] font-black uppercase tracking-widest truncate">{currentProject.name}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {!task.isCompleted && (
          <button 
            onClick={(e) => { e.stopPropagation(); onFocus(task); }} 
            className={`p-2 rounded-lg transition-all ${isFocusing ? 'text-pilot-orange bg-pilot-orange/10' : 'text-white/10 hover:text-pilot-orange hover:bg-white/5'}`}
          >
            <Target size={18} />
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-white/5 space-y-6 animate-in slide-in-from-top-2 duration-300" onClick={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className={THEME.label}>Context & Notes</label>
                <textarea
                  value={task.description || ''}
                  onChange={(e) => updateTask(task.id, { description: e.target.value })}
                  placeholder="NO DESCRIPTION..."
                  className="w-full bg-deepnavy border border-white/5 rounded-lg p-3 text-xs text-white/80 focus:outline-none h-24 resize-none placeholder:opacity-10"
                />
              </div>
              <div>
                <label className={THEME.label}>Collaboration</label>
                <input
                  type="text"
                  value={task.collaboration || ''}
                  onChange={(e) => updateTask(task.id, { collaboration: e.target.value })}
                  placeholder="WHO ARE YOU WORKING WITH..."
                  className="w-full bg-deepnavy border border-white/5 rounded-lg px-3 py-2.5 text-xs text-white/80 focus:outline-none placeholder:opacity-10"
                />
              </div>
            </div>
            <div className="space-y-4">
             <div>
              <label className={THEME.label}>Assignment</label>
              <div className="px-4 py-2.5 bg-deepnavy border border-white/5 rounded-lg text-xs font-bold text-white/60">
                {currentProject?.name || 'STANDALONE MISSION'}
              </div>
            </div>
            <div>
              <label className={THEME.label}>Vibe Requirement</label>
              <div className="px-4 py-2.5 bg-deepnavy border border-white/5 rounded-lg text-xs font-bold text-white/60">
                {task.energyRequired} INTENSITY
              </div>
            </div>
            <div>
              <label className={THEME.label}>Time Tracking</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-2.5 bg-deepnavy border border-white/5 rounded-lg flex items-center justify-between">
                  <span className="text-xs font-bold text-white/60">
                    {elapsedTime > 0 ? `${elapsedTime} min` : 'No time logged'}
                  </span>
                  {isTracking && (
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </div>
                {!isTracking ? (
                  <button
                    onClick={handleStartTracking}
                    className="px-4 py-2.5 bg-pilot-orange/10 hover:bg-pilot-orange/20 border border-pilot-orange/20 rounded-lg text-xs font-bold text-pilot-orange transition-all flex items-center gap-2"
                  >
                    <Play size={12} />
                    Start
                  </button>
                ) : (
                  <button
                    onClick={handleStopTracking}
                    className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-bold text-red-400 transition-all flex items-center gap-2"
                  >
                    <X size={12} />
                    Stop
                  </button>
                )}
              </div>
            </div>
          </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className={THEME.label}>Subtasks / Checklist</label>
              <span className="text-xs font-bold text-white/20">
                {task.subtasks?.filter(st => st.isCompleted).length || 0} / {task.subtasks?.length || 0}
              </span>
            </div>

            <div className="space-y-2 mb-3">
              {task.subtasks && task.subtasks.length > 0 ? (
                task.subtasks.map(subtask => (
                  <div key={subtask.id} className="flex items-center gap-3 p-3 bg-deepnavy border border-white/5 rounded-lg group hover:bg-white/[0.02] transition-all">
                    <button
                      onClick={(e) => handleToggleSubtask(subtask.id, e)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                        subtask.isCompleted
                          ? 'bg-pilot-orange border-pilot-orange'
                          : 'border-white/10 group-hover:border-pilot-orange/50'
                      }`}
                    >
                      {subtask.isCompleted && <Check size={10} strokeWidth={4} className="text-white" />}
                    </button>
                    <span className={`flex-1 text-xs font-bold transition-all ${
                      subtask.isCompleted ? 'line-through text-white/20' : 'text-white/60'
                    }`}>
                      {subtask.title}
                    </span>
                    <button
                      onClick={(e) => handleDeleteSubtask(subtask.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded transition-all"
                    >
                      <X size={12} className="text-red-400" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-white/20 text-center py-4 italic">No subtasks yet</p>
              )}
            </div>

            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="ADD SUBTASK..."
                className="flex-1 bg-deepnavy border border-white/5 rounded-lg px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-pilot-orange/50 transition-all placeholder:opacity-10"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-pilot-orange/10 hover:bg-pilot-orange/20 border border-pilot-orange/20 rounded-lg text-xs font-bold text-pilot-orange transition-all flex items-center gap-2"
              >
                <Plus size={14} />
                ADD
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(task.id);
              }}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white/70 hover:text-pilot-orange transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle size={14} />
              DUPLICATE
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="flex-1 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-bold text-red-400 hover:text-red-300 transition-all flex items-center justify-center gap-2"
            >
              <X size={14} />
              DELETE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Workday Page ---

const WorkdayPage = ({ state, setState, toggleTask, updateTask, setEnergy, duplicateTask, deleteTask, searchQuery = '' }: WorkdayPageProps) => {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const activeTask = useMemo(() => state.tasks.find(t => t.id === activeTaskId) || null, [state.tasks, activeTaskId]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportResult, setReportResult] = useState<string | null>(null);

  const [energyFilter, setEnergyFilter] = useState<EnergyLevel | 'All'>('All');

  const filteredTasks = useMemo(() => {
    let result = state.tasks.filter(t => !t.isCompleted);

    // Filter by energy
    if (energyFilter !== 'All') {
      result = result.filter(t => t.energyRequired === energyFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        state.projects.find(p => p.id === t.projectId)?.name.toLowerCase().includes(query)
      );
    }

    return result;
  }, [state.tasks, state.projects, energyFilter, searchQuery]);

  const handleEndDay = async () => {
    setIsGeneratingReport(true);
    const completedToday = state.tasks.filter(t => t.isCompleted);
    const report = await generateDailyReport(completedToday, "Focus was mostly on administrative stuff today.", state.energyLevel || 'Medium');
    setReportResult(report);
    setIsGeneratingReport(false);
  };

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: formData.get('title') as string,
      energyRequired: formData.get('energy') as EnergyLevel,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      projectId: formData.get('project') as string,
    };
    setState(prev => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
    setIsAddingTask(false);
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12 overflow-y-auto h-full no-scrollbar">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
        <div className="lg:col-span-7">
          <PomodoroTimer 
            activeTask={activeTask}
            isActive={isTimerActive}
            setIsActive={setIsTimerActive}
          />
        </div>

        <div className={`${THEME.card} lg:col-span-5 flex flex-col h-full`}>
          <h3 className="text-lg font-black text-white uppercase tracking-widest mb-6">Daily Snapshot</h3>
          <div className="mb-8">
            <p className={THEME.label}>Energy Selection</p>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {ENERGY_LEVELS.map(level => (
                <button 
                  key={level}
                  onClick={() => setEnergy(level)}
                  className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${state.energyLevel === level ? 'bg-pilot-orange/10 border-pilot-orange/30 text-pilot-orange' : 'bg-white/[0.02] border-white/5 text-white/20 hover:bg-white/5'}`}
                >
                  <Zap size={14} fill={state.energyLevel === level ? 'currentColor' : 'none'} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{level}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-lg p-5 mb-8 flex gap-3 shadow-inner">
            <Brain size={20} className="text-pilot-orange shrink-0" />
            <p className="text-xs text-white/50 leading-relaxed italic">
              Prioritise tasks aligned with your <span className="text-pilot-orange font-bold">"{state.energyLevel || 'vibe'}"</span> energy level to maintain maximum flow state.
            </p>
          </div>
          <div className="mt-auto pt-6 border-t border-white/5">
             <div className="flex items-center justify-between mb-6">
               <span className="text-sm font-black text-white/40 uppercase tracking-widest">Acoustic Shield</span>
               <Settings size={14} className="text-white/20 cursor-pointer hover:text-white transition-colors" />
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-10 mb-6">
                <SkipBack size={18} className="text-white/20 cursor-pointer hover:text-white" />
                <button className="bg-pilot-orange text-white p-4 rounded-lg shadow-xl shadow-pilot-orange/30 hover:scale-105 active:scale-95 transition-all"><Play size={20} fill="currentColor" /></button>
                <SkipForward size={18} className="text-white/20 cursor-pointer hover:text-white" />
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full relative">
                 <div className="absolute top-0 left-0 h-full w-[65%] bg-pilot-orange rounded-full shadow-[0_0_10px_rgba(243,115,36,0.5)]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={THEME.card}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-3">
            <Activity size={24} className="text-pilot-orange" />
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-widest">MISSION FEED</h3>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mt-1">{filteredTasks.length} PENDING OBJECTIVES</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-lg border border-white/5">
            <div className="flex items-center gap-2 px-4 border-r border-white/10 py-2">
              <Filter size={14} className="text-white/20" />
              <select 
                value={energyFilter}
                onChange={(e) => setEnergyFilter(e.target.value as any)}
                className="bg-transparent text-[10px] font-black uppercase tracking-widest text-white/60 focus:outline-none cursor-pointer"
              >
                <option value="All">ALL SPECTRA</option>
                {ENERGY_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
              </select>
            </div>
            <button 
              onClick={handleEndDay}
              disabled={isGeneratingReport}
              className={`${THEME.buttonPrimary} px-8 py-2.5 text-xs font-black uppercase tracking-widest flex items-center gap-2`}
            >
              {isGeneratingReport ? <Loader2 size={14} className="animate-spin" /> : 'DEBRIEF'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-3">
             <div className="flex items-center justify-between px-1 mb-2">
              <p className={THEME.label}>Mission Log</p>
              <button onClick={() => setIsAddingTask(true)} className="text-[10px] font-black uppercase tracking-widest text-pilot-orange flex items-center gap-1.5 hover:text-white transition-colors">
                <Plus size={14} /> New Entry
              </button>
            </div>
            {filteredTasks.length === 0 ? (
              <div className="text-center py-20 bg-white/[0.01] rounded-xl border border-dashed border-white/10">
                <Target size={40} className="mx-auto mb-4 text-white/5" />
                <p className="text-sm font-black text-white/20 uppercase tracking-widest">Area Secure • No pending tasks</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  projects={state.projects}
                  toggleTask={toggleTask}
                  updateTask={updateTask}
                  onFocus={(t) => setActiveTaskId(t.id)}
                  isFocusing={activeTaskId === task.id}
                  onDuplicate={duplicateTask}
                  onDelete={deleteTask}
                />
              ))
            )}
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
               <div className="flex items-center justify-between mb-8">
                  <h4 className="text-xs font-black text-white/40 flex items-center gap-2 uppercase tracking-widest"><Layers size={14} className="text-pilot-orange" /> Sector Progress</h4>
               </div>
               <div className="space-y-6">
                 {state.projects.map(p => {
                   const projectTasks = state.tasks.filter(t => t.projectId === p.id);
                   const completed = projectTasks.filter(t => t.isCompleted).length;
                   const progress = projectTasks.length ? Math.round((completed / projectTasks.length) * 100) : 0;
                   return (
                    <Link to={`/projects/${p.id}`} key={p.id} className="block group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-black text-white/80 group-hover:text-pilot-orange transition-colors uppercase tracking-tight">{p.name}</span>
                        <span className="text-[10px] font-black text-white/20 tabular-nums">{progress}%</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-pilot-orange transition-all duration-700" style={{ width: `${progress}%` }} />
                      </div>
                    </Link>
                   );
                 })}
               </div>
            </div>
            {reportResult && (
               <div className="bg-pilot-orange/5 border border-pilot-orange/20 rounded-xl p-6 animate-in slide-in-from-right-4 duration-500">
                 <div className="flex items-center gap-2 mb-4">
                   <Sparkles size={18} className="text-pilot-orange" />
                   <h4 className="text-xs font-black text-white uppercase tracking-widest">Pilot Insight</h4>
                 </div>
                 <p className="text-xs text-white/60 leading-relaxed italic">{reportResult}</p>
                 <button onClick={() => setReportResult(null)} className="mt-4 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors">Clear</button>
               </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isAddingTask} onClose={() => setIsAddingTask(false)} title="Mission Creation">
        <form onSubmit={handleAddTask} className="space-y-6">
          <div>
            <label className={THEME.label}>Objective Title</label>
            <input name="title" required placeholder="DEFINE MISSION..." className={`${THEME.input} w-full mt-2`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={THEME.label}>Energy Band</label>
              <select name="energy" className={`${THEME.input} w-full mt-2 cursor-pointer`}>
                <option value="Low">LOW INTENSITY</option>
                <option value="Medium">BALANCED</option>
                <option value="High">HIGH INTENSITY</option>
              </select>
            </div>
            <div>
              <label className={THEME.label}>Assigned Sector</label>
              <select name="project" className={`${THEME.input} w-full mt-2 cursor-pointer`}>
                <option value="">STANDALONE</option>
                {state.projects.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className={`${THEME.buttonPrimary} w-full py-4 text-xs font-black uppercase tracking-widest`}>AUTHORISE MISSION</button>
        </form>
      </Modal>
    </div>
  );
};

// --- Recurring Tasks Page ---

const RecurringTasksPage = ({ tasks, onToggle }: { tasks: RecurringTask[], onToggle: (id: string) => void }) => {
  const dailyTasks = tasks.filter(t => t.interval === 'Daily');
  const weeklyTasks = tasks.filter(t => t.interval === 'Weekly');
  const monthlyTasks = tasks.filter(t => t.interval === 'Monthly');

  const renderTaskTable = (title: string, taskList: RecurringTask[]) => (
    <div className="space-y-4">
      <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 flex items-center gap-3 px-2">
        <RefreshCw size={14} className="text-pilot-orange" /> {title}
      </h4>
      <div className="bg-prussianblue border border-white/5 rounded-xl overflow-hidden shadow-xl">
        {taskList.length === 0 ? (
          <div className="px-8 py-12 text-center text-xs text-white/10 italic font-medium">No cycles configured for this band.</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase text-white/20 border-b border-white/5 bg-white/[0.01]">
                <th className="px-8 py-5">Repetitive Objective</th>
                <th className="px-8 py-5">Current Status</th>
                <th className="px-8 py-5 text-right">Operational Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {taskList.map((item) => (
                <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-white/80 group-hover:text-white transition-colors tracking-tight uppercase">{item.task}</p>
                    <p className="text-[9px] text-white/20 mt-1 uppercase font-black tracking-[0.2em]">Last Cycle: {item.last}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[9px] font-black px-3 py-1 rounded-md uppercase tracking-[0.2em] border ${item.status === 'Completed' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-pilot-orange/10 border-pilot-orange/20 text-pilot-orange'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => onToggle(item.id)} 
                      className={`${item.status === 'Completed' ? THEME.buttonSecondary : THEME.buttonPrimary} px-6 py-2 text-[10px] font-black uppercase tracking-widest`}
                    >
                      {item.status === 'Completed' ? 'RESET' : 'CLOSE'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-12">
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tighter uppercase">RECURRING HABITS</h3>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-2">AUTOMATED FLOW CONTROL</p>
        </div>
      </div>
      
      {renderTaskTable("Daily Cycles", dailyTasks)}
      {renderTaskTable("Weekly Sequences", weeklyTasks)}
      {renderTaskTable("Monthly Milestones", monthlyTasks)}
    </div>
  );
};

// --- Weekly Planner Page ---

const WeeklyPlannerPage = ({ state, setState, toggleTask, updateTask }: { 
  state: AppState; 
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  toggleTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
}) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Generate current week dates
  const weekDates = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    const monday = new Date(today.setDate(diff));
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, []);

  const getDayTasks = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return state.tasks.filter(t => t.dueDate?.startsWith(dateString));
  };

  const handleAddTaskToDay = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedDay === null) return;
    
    const formData = new FormData(e.currentTarget);
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: formData.get('title') as string,
      energyRequired: formData.get('energy') as EnergyLevel,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      dueDate: weekDates[selectedDay].toISOString(),
      projectId: formData.get('project') as string,
    };
    setState(prev => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
    setIsAddingTask(false);
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-10">
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tighter uppercase">WEEKLY PLANNER</h3>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-2">SECTOR LOGISTICS & TEMPORAL MAPPING</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/5 border border-white/10 p-1.5 rounded-lg flex gap-1">
             <button className="p-2 text-white/20 hover:text-white transition-colors"><ChevronLeft size={16}/></button>
             <span className="px-4 py-2 text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center">Current Sequence</span>
             <button className="p-2 text-white/20 hover:text-white transition-colors"><ChevronRight size={16}/></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {weekDates.map((date, idx) => {
          const tasks = getDayTasks(date);
          const isToday = date.toDateString() === new Date().toDateString();
          const completed = tasks.filter(t => t.isCompleted).length;
          const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

          return (
            <div 
              key={idx} 
              className={`flex flex-col min-h-[500px] transition-all duration-500 ${isToday ? 'scale-[1.02] z-10' : 'opacity-80 hover:opacity-100'}`}
            >
              <div className={`p-5 rounded-t-xl border-t border-x border-white/5 flex flex-col gap-1 ${isToday ? 'bg-pilot-orange/10 border-pilot-orange/20' : 'bg-white/[0.02]'}`}>
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isToday ? 'text-pilot-orange' : 'text-white/20'}`}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-white">{date.getDate()}</span>
                  <button 
                    onClick={() => { setSelectedDay(idx); setIsAddingTask(true); }}
                    className="p-1.5 bg-white/5 hover:bg-pilot-orange hover:text-white rounded-md text-white/20 transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className={`flex-1 p-3 border-x border-white/5 bg-prussianblue flex flex-col gap-3 overflow-y-auto no-scrollbar ${isToday ? 'border-pilot-orange/10' : ''}`}>
                {tasks.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-5 text-white italic">
                    <Target size={24} className="mb-2" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Clear</span>
                  </div>
                ) : (
                  tasks.map(task => (
                    <div 
                      key={task.id} 
                      className={`p-3 rounded-lg border transition-all cursor-pointer group ${task.isCompleted ? 'bg-white/[0.01] border-white/5 opacity-40' : 'bg-white/[0.04] border-white/10 hover:border-pilot-orange/30 shadow-sm'}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`mt-1 shrink-0 w-2 h-2 rounded-sm ${task.energyRequired === 'High' ? 'bg-red-500' : task.energyRequired === 'Medium' ? 'bg-pilot-orange' : 'bg-blue-500'}`} />
                        <span className={`text-[10px] font-bold leading-tight ${task.isCompleted ? 'line-through' : 'text-white/80'}`}>{task.title}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className={`p-4 rounded-b-xl border-b border-x border-white/5 bg-white/[0.01] ${isToday ? 'border-pilot-orange/20' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                   <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{tasks.length} Missions</span>
                   <span className="text-[9px] font-black text-pilot-orange">{progress}%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-pilot-orange transition-all duration-700" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={THEME.card}>
        <div className="flex items-center gap-6">
           <div className="p-4 bg-pilot-orange/10 rounded-xl border border-pilot-orange/20">
              <Sparkles className="text-pilot-orange" size={32} />
           </div>
           <div>
              <h4 className="text-lg font-black text-white uppercase tracking-widest">Temporal Intelligence</h4>
              <p className="text-xs text-white/40 mt-1 max-w-2xl">
                 Your schedule indicates a heavy load on **Wednesday**. Consider shifting **Low Intensity** tasks to **Monday** to balance your daily energy expenditure.
              </p>
           </div>
           <button className={`${THEME.buttonSecondary} ml-auto px-8 py-3 text-[10px] font-black uppercase tracking-widest`}>
              Optimise Week
           </button>
        </div>
      </div>

      <Modal isOpen={isAddingTask} onClose={() => setIsAddingTask(false)} title={`Log Mission for ${selectedDay !== null ? weekDates[selectedDay].toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}`}>
        <form onSubmit={handleAddTaskToDay} className="space-y-6">
          <div>
            <label className={THEME.label}>Objective Name</label>
            <input name="title" required placeholder="DEFINE TARGET..." className={`${THEME.input} w-full mt-2`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={THEME.label}>Energy Band</label>
              <select name="energy" className={`${THEME.input} w-full mt-2 cursor-pointer`}>
                <option value="Low">LOW INTENSITY</option>
                <option value="Medium">BALANCED</option>
                <option value="High">HIGH INTENSITY</option>
              </select>
            </div>
            <div>
              <label className={THEME.label}>Assigned Sector</label>
              <select name="project" className={`${THEME.input} w-full mt-2 cursor-pointer`}>
                <option value="">STANDALONE</option>
                {state.projects.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className={`${THEME.buttonPrimary} w-full py-4 text-xs font-black uppercase tracking-widest`}>LOCK MISSION TO TIMELINE</button>
        </form>
      </Modal>
    </div>
  );
};

// --- Reports Page ---

const ReportsPage = ({ reports, tasks }: { reports: DailyReport[], tasks: Task[] }) => {
  const [selectedReportDate, setSelectedReportDate] = useState<string | null>(reports[reports.length - 1]?.date || null);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [flowInsights, setFlowInsights] = useState<string[]>([]);

  const selectedReport = useMemo(() =>
    reports.find(r => r.date === selectedReportDate),
    [reports, selectedReportDate]
  );

  // Get tasks completed today
  const todayTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(t => t.isCompleted && t.createdAt.startsWith(today));
  }, [tasks]);

  const weeklyChartData = [
    { day: 'SUN', v: 4 }, { day: 'MON', v: 3 }, { day: 'TUE', v: 7 }, { day: 'WED', v: 12 }, { day: 'THU', v: 10 }, { day: 'FRI', v: 6 }, { day: 'SAT', v: 0 },
  ];

  const categoryChartData = useMemo(() => {
    return [
      { name: 'ADMIN', value: 35 },
      { name: 'DEEP WORK', value: 45 },
      { name: 'STRATEGY', value: 20 }
    ];
  }, []);

  const COLORS = ['#F37324', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899'];

  const handleFlowAnalysis = async () => {
    setIsAnalyzing(true);
    setIsFlowModalOpen(true);
    const insights = await getWeeklyInsights(reports);
    setFlowInsights(insights);
    setIsAnalyzing(false);
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-12 relative print-container">
      <section className={THEME.card}>
        <div className="flex items-center gap-3 mb-10">
          <TrendingUp size={24} className="text-pilot-orange" />
          <h3 className="text-xl font-black text-white uppercase tracking-widest">PRODUCTIVITY OVERVIEW</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { l: 'Missions Completed', v: '158', i: CheckCircle2 },
            { l: 'Energy Peak', v: 'High', i: Zap },
            { l: 'Alignment', v: '94%', i: Target },
            { l: 'Pilot Streak', v: '12 Days', i: Clock },
          ].map((s, idx) => (
            <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-xl p-6 transition-all hover:bg-white/[0.04] group cursor-default">
              <p className={THEME.label}>{s.l}</p>
              <h4 className="text-3xl font-black text-white tracking-tighter mt-2 group-hover:text-pilot-orange transition-colors">{s.v}</h4>
            </div>
          ))}
        </div>
      </section>

      {/* Today's Tasks Table */}
      <section className={THEME.card}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={24} className="text-pilot-orange" />
            <h3 className="text-xl font-black text-white uppercase tracking-widest">Today's Completed Tasks</h3>
          </div>
          <div className="px-4 py-2 bg-pilot-orange/10 border border-pilot-orange/20 rounded-lg">
            <span className="text-xs font-black text-pilot-orange uppercase tracking-wider">{todayTasks.length} Tasks</span>
          </div>
        </div>

        {todayTasks.length > 0 ? (
          <div className="bg-white/[0.01] border border-white/5 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase text-white/20 border-b border-white/5 bg-white/[0.02]">
                  <th className="px-6 py-4">Task</th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Collaboration</th>
                  <th className="px-6 py-4">Energy</th>
                  <th className="px-6 py-4">Subtasks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {todayTasks.map((task) => (
                  <tr key={task.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white/80 group-hover:text-pilot-orange transition-colors">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-white/40 mt-1 line-clamp-1">{task.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-white/50">{task.projectId || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users size={12} className="text-white/20" />
                        <span className="text-xs font-bold text-white/50">{task.collaboration || 'Solo'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-black px-3 py-1 rounded-full ${
                        task.energyRequired === 'High' ? 'bg-red-500/20 text-red-400' :
                        task.energyRequired === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {task.energyRequired}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {task.subtasks && task.subtasks.length > 0 ? (
                        <span className="text-xs font-bold text-white/40">
                          {task.subtasks.filter(st => st.isCompleted).length}/{task.subtasks.length}
                        </span>
                      ) : (
                        <span className="text-xs text-white/20">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 bg-white/[0.01] border border-white/5 rounded-xl">
            <CheckCircle2 size={40} className="mx-auto mb-4 text-white/10" />
            <p className="text-sm font-bold text-white/30 uppercase tracking-wider">No tasks completed today yet</p>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h4 className={THEME.label}>Report Archive</h4>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/10 italic">Scroll horizontally to traverse time →</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar snap-x px-1">
          {reports.map((report) => {
            const dateObj = new Date(report.date);
            const isSelected = selectedReportDate === report.date;
            return (
              <button 
                key={report.date}
                onClick={() => setSelectedReportDate(report.date)}
                className={`snap-start shrink-0 w-48 bg-prussianblue border rounded-xl p-6 text-left transition-all duration-300 group ${isSelected ? 'border-pilot-orange shadow-2xl shadow-pilot-orange/10 scale-105 z-10' : 'border-white/5 hover:border-white/10 opacity-60 hover:opacity-100'}`}
              >
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest group-hover:text-pilot-orange transition-colors">
                  {dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                </p>
                <h5 className="text-xl font-black text-white mt-1 uppercase tracking-tighter">
                  {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                </h5>
                <div className="mt-8 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className={isSelected ? 'text-pilot-orange' : 'text-white/20'} />
                      <span className="text-xs font-black text-white/60 tabular-nums">{report.completedTaskIds.length}</span>
                   </div>
                   <div className="w-10 h-10 rounded-lg border border-white/5 flex items-center justify-center relative overflow-hidden bg-deepnavy shadow-inner">
                      <div className="absolute inset-0 bg-pilot-orange/20" style={{ height: `${report.momentumScore}%`, bottom: 0, top: 'auto' }} />
                      <span className="text-[10px] font-black text-white relative z-10 tabular-nums">{report.momentumScore}</span>
                   </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {selectedReport && (
        <section className="animate-in slide-in-from-bottom-6 duration-700 bg-prussianblue border border-white/5 rounded-xl overflow-hidden shadow-2xl">
          <div className="p-10 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-8">
               <div className="w-20 h-20 bg-pilot-orange/5 border border-pilot-orange/10 rounded-xl flex items-center justify-center text-pilot-orange shadow-inner">
                  <CalendarDays size={40} />
               </div>
               <div>
                 <h4 className="text-3xl font-black text-white uppercase tracking-tighter">
                  {new Date(selectedReport.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
                 </h4>
                 <div className="flex items-center gap-6 mt-2">
                   <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-2"><Zap size={10} className="text-pilot-orange" /> Energy Band: {selectedReport.energyLevel}</span>
                   <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-2"><TrendingUp size={10} className="text-pilot-orange" /> Momentum: {selectedReport.momentumScore}%</span>
                 </div>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="px-8 py-3 bg-white/[0.02] border border-white/5 rounded-lg flex items-center gap-3 shadow-inner">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  <span className="text-[11px] font-black text-white/60 uppercase tracking-widest">{selectedReport.completedTaskIds.length} Objectives Captured</span>
               </div>
            </div>
          </div>

          <div className="p-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4 space-y-10">
               <div>
                 <h5 className="text-[11px] font-black uppercase tracking-[0.4em] text-pilot-orange mb-8 px-1">Daily Directives</h5>
                 <div className="space-y-3">
                   {selectedReport.goals.map((goal, idx) => (
                     <div key={idx} className="bg-white/[0.02] border border-white/5 p-5 rounded-lg flex items-center gap-4 shadow-sm hover:bg-white/[0.04] transition-colors">
                        <div className="w-7 h-7 rounded-md bg-pilot-orange/10 border border-pilot-orange/20 flex items-center justify-center">
                           <Target size={14} className="text-pilot-orange" />
                        </div>
                        <span className="text-xs font-bold text-white/70 tracking-tight uppercase">{goal}</span>
                     </div>
                   ))}
                 </div>
               </div>
               <div className="bg-pilot-orange/[0.03] border border-pilot-orange/10 p-8 rounded-xl shadow-inner">
                  <h5 className="text-[11px] font-black uppercase tracking-[0.4em] text-pilot-orange mb-4 flex items-center gap-2"><Brain size={14} /> Neural Analysis</h5>
                  <p className="text-xs text-white/40 leading-relaxed italic font-medium">"{selectedReport.aiInsights}"</p>
               </div>
            </div>

            <div className="lg:col-span-8">
               <h5 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/20 mb-8 flex items-center gap-2 px-1"><Layers size={14} /> Mission Breakdown</h5>
               <div className="bg-white/[0.01] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                  <table className="w-full text-left">
                    <thead>
                       <tr className="text-[10px] font-black uppercase text-white/20 border-b border-white/5 bg-white/[0.02]">
                         <th className="px-8 py-6">Operational Objective</th>
                         <th className="px-8 py-6">Collab</th>
                         <th className="px-8 py-6">Window</th>
                         <th className="px-8 py-6">State</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {selectedReport.taskBreakdown.map((item, idx) => (
                         <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                            <td className="px-8 py-7">
                               <p className="text-sm font-black text-white/80 group-hover:text-pilot-orange transition-colors tracking-tight uppercase">{item.task}</p>
                            </td>
                            <td className="px-8 py-7">
                               <div className="flex items-center gap-2">
                                  <Users size={12} className="text-white/20" />
                                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{item.collaboration}</span>
                               </div>
                            </td>
                            <td className="px-8 py-7">
                               <span className="text-[10px] font-black text-pilot-orange bg-pilot-orange/10 border border-pilot-orange/10 px-4 py-1.5 rounded-md uppercase tracking-[0.1em]">{item.timeSpent}</span>
                            </td>
                            <td className="px-8 py-7 max-w-xs">
                               <p className="text-[11px] font-medium text-white/20 truncate group-hover:text-white/40 transition-all uppercase">{item.notes}</p>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className={THEME.card}>
            <div className="flex items-center justify-between mb-12">
               <h3 className="text-lg font-black text-white flex items-center gap-3 uppercase tracking-widest"><BarChart2 className="text-pilot-orange" /> Weekly Velocity</h3>
               <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-pilot-orange shadow-[0_0_8px_rgba(243,115,36,0.6)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Flow Rate</span>
                  </div>
               </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData}>
                  <CartesianGrid vertical={false} stroke="#ffffff05" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#ffffff22', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em' }} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: '#ffffff05' }} 
                    contentStyle={{ backgroundColor: '#11122C', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', padding: '12px' }} 
                    itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                  />
                  <Bar dataKey="v" fill="#F37324" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
        </section>

        <section className={THEME.card}>
            <div className="flex items-center justify-between mb-12">
               <h3 className="text-lg font-black text-white flex items-center gap-3 uppercase tracking-widest"><PieChartIcon className="text-pilot-orange" /> Sector Allocation</h3>
            </div>
            <div className="flex-1 w-full flex items-center justify-center min-h-[300px]">
               <div className="flex-1">
                 <ResponsiveContainer width="100%" height={300}>
                   <PieChart>
                     <Pie
                       data={categoryChartData}
                       cx="50%"
                       cy="50%"
                       innerRadius={70}
                       outerRadius={100}
                       paddingAngle={8}
                       dataKey="value"
                       stroke="none"
                     >
                       {categoryChartData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip 
                      contentStyle={{ backgroundColor: '#11122C', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px' }}
                      itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                     />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
               <div className="w-1/3 flex flex-col gap-5 pr-4">
                  {categoryChartData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-4 transition-all hover:translate-x-1">
                       <div className="w-4 h-1.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                       <div className="flex-1">
                          <p className="text-[10px] font-black text-white/80 uppercase tracking-widest leading-none">{item.name}</p>
                          <p className="text-[9px] font-bold text-white/20 uppercase tracking-tighter mt-1">{item.value}% SATURATION</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
        </section>
      </div>

      <button 
        onClick={handleFlowAnalysis}
        className="fixed bottom-12 right-12 z-40 bg-pilot-orange p-5 rounded-xl shadow-[0_20px_50px_rgba(243,115,36,0.4)] text-white hover:scale-110 active:scale-95 transition-all group flex items-center gap-3 border border-white/10 ring-4 ring-pilot-orange/10"
      >
        <Sparkles size={24} className="group-hover:rotate-12 transition-transform duration-500" />
        <span className="text-xs font-black uppercase tracking-widest pr-2 hidden group-hover:inline-block animate-in fade-in slide-in-from-right-2">Initialise Flow Analysis</span>
      </button>

      <Modal 
        isOpen={isFlowModalOpen} 
        onClose={() => setIsFlowModalOpen(false)} 
        title="Predictive Flow Analysis"
      >
        {isAnalyzing ? (
           <div className="py-24 flex flex-col items-center gap-8">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-pilot-orange animate-spin opacity-20" />
                <Activity className="w-8 h-8 text-pilot-orange animate-pulse absolute inset-0 m-auto" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white/20 animate-pulse text-center">Calibrating productivity metrics...</p>
           </div>
        ) : (
           <div className="space-y-10">
              <div className="bg-pilot-orange/5 border border-pilot-orange/20 p-8 rounded-xl shadow-inner">
                 <h4 className="text-[11px] font-black text-white flex items-center gap-3 mb-6 uppercase tracking-[0.4em]"><Brain size={16} className="text-pilot-orange" /> Neural Findings</h4>
                 <div className="space-y-5">
                    {flowInsights.map((insight, idx) => (
                      <div key={idx} className="flex gap-5 group">
                         <div className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-sm bg-pilot-orange shadow-[0_0_10px_rgba(243,115,36,0.4)] group-hover:rotate-45 transition-transform" />
                         <p className="text-xs text-white/60 leading-relaxed italic font-medium">"{insight}"</p>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="space-y-4 px-1">
                 <h4 className={THEME.label}>Sector Optimisation</h4>
                 <p className="text-xs text-white/50 leading-relaxed font-medium uppercase tracking-tight">
                    INTELLIGENCE SUGGESTS: SHIFT **DEEP WORK** PROTOCOLS TO **09:00 - 11:30 WINDOWS**. CURRENT DATA INDICATES HIGHEST ENERGY RETENTION DURING THIS PHASE.
                 </p>
              </div>
              <button 
                onClick={() => setIsFlowModalOpen(false)}
                className={`${THEME.buttonSecondary} w-full py-4 text-xs font-black uppercase tracking-widest`}
              >
                DISMISS ANALYSIS
              </button>
           </div>
        )}
      </Modal>
    </div>
  );
};

// --- Projects Page component ---
const ProjectsPage = ({ state, setState, toggleTask, updateTask, addProject, duplicateTask, deleteTask }: {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  toggleTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  addProject: (name: string) => void;
  duplicateTask: (id: string) => void;
  deleteTask: (id: string) => void;
}) => {
  const { projectId } = useParams<{ projectId?: string }>();
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [projectName, setProjectName] = useState("");

  const activeProject = state.projects.find(p => p.id === projectId) || null;
  const projectTasks = state.tasks.filter(t => t.projectId === (activeProject?.id || projectId));

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim()) {
      addProject(projectName);
      setProjectName("");
      setIsAddingProject(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tighter uppercase">
            {activeProject ? activeProject.name : "STRATEGIC SECTORS"}
          </h3>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-2">
            {activeProject ? "SECTOR ANALYSIS" : "PROJECT HUB"}
          </p>
        </div>
        <button 
          onClick={() => setIsAddingProject(true)}
          className={`${THEME.buttonPrimary} px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2`}
        >
          <Plus size={16} /> NEW SECTOR
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <p className={THEME.label}>Active Sectors</p>
          {state.projects.map(p => (
            <Link 
              key={p.id} 
              to={`/projects/${p.id}`}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${projectId === p.id ? 'bg-pilot-orange border-pilot-orange text-white' : 'bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/5'}`}
            >
              <div className="flex items-center gap-3">
                <Folder size={16} />
                <span className="text-sm font-bold uppercase">{p.name}</span>
              </div>
              <ChevronRight size={14} className="opacity-40" />
            </Link>
          ))}
        </div>

        <div className="lg:col-span-3">
          {activeProject && (
            <div className={`${THEME.card} mb-6`}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                    {activeProject.name}
                  </h3>
                  <p className={`${THEME.label}`}>Project Overview</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all">
                    <Settings size={16} className="text-white/40" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`${THEME.innerCard}`}>
                  <p className={`${THEME.label} mb-2`}>Total Tasks</p>
                  <p className="text-3xl font-black text-white">{projectTasks.length}</p>
                </div>
                <div className={`${THEME.innerCard}`}>
                  <p className={`${THEME.label} mb-2`}>Completed</p>
                  <p className="text-3xl font-black text-pilot-orange">
                    {projectTasks.filter(t => t.isCompleted).length}
                  </p>
                </div>
                <div className={`${THEME.innerCard}`}>
                  <p className={`${THEME.label} mb-2`}>In Progress</p>
                  <p className="text-3xl font-black text-white">
                    {projectTasks.filter(t => !t.isCompleted).length}
                  </p>
                </div>
                <div className={`${THEME.innerCard}`}>
                  <p className={`${THEME.label} mb-2`}>Progress</p>
                  <p className="text-3xl font-black text-pilot-orange">
                    {projectTasks.length > 0
                      ? Math.round((projectTasks.filter(t => t.isCompleted).length / projectTasks.length) * 100)
                      : 0}%
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pilot-orange to-pilot-orange/60 transition-all duration-500 rounded-full"
                    style={{
                      width: `${projectTasks.length > 0
                        ? (projectTasks.filter(t => t.isCompleted).length / projectTasks.length) * 100
                        : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className={THEME.card}>
            <h4 className="text-sm font-black text-white/40 uppercase tracking-widest mb-6">
              {activeProject ? `MISSIONS IN ${activeProject.name}` : "SELECT A SECTOR TO VIEW MISSIONS"}
            </h4>
            <div className="space-y-3">
              {projectTasks.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.01] rounded-xl border border-dashed border-white/10">
                  <Target size={40} className="mx-auto mb-4 text-white/5" />
                  <p className="text-sm font-black text-white/20 uppercase tracking-widest">Sector Scan Clean • No Missions</p>
                </div>
              ) : (
                projectTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    projects={state.projects}
                    toggleTask={toggleTask}
                    updateTask={updateTask}
                    onFocus={() => {}}
                    isFocusing={false}
                    onDuplicate={duplicateTask}
                    onDelete={deleteTask}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isAddingProject} onClose={() => setIsAddingProject(false)} title="New Sector Authorization">
        <form onSubmit={handleAddProject} className="space-y-6">
          <div>
            <label className={THEME.label}>Sector Name</label>
            <input 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required 
              placeholder="ENTER SECTOR NAME..." 
              className={`${THEME.input} w-full mt-2`} 
            />
          </div>
          <button type="submit" className={`${THEME.buttonPrimary} w-full py-4 text-xs font-black uppercase tracking-widest`}>AUTHORIZE SECTOR</button>
        </form>
      </Modal>
    </div>
  );
};

// --- Calendar Page component ---
const CalendarPage = ({ events, onAdd }: { events: CalendarEvent[], onAdd: (ev: CalendarEvent) => void }) => {
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tighter uppercase">CHRONO-NAVIGATOR</h3>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-2">TEMPORAL LOGISTICS</p>
        </div>
        <button 
          onClick={() => setIsAddingEvent(true)}
          className={`${THEME.buttonPrimary} px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2`}
        >
          <Plus size={16} /> LOG WINDOW
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-xl overflow-hidden shadow-2xl">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="bg-deepnavy p-4 text-center">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{d}</span>
          </div>
        ))}
        {days.map(day => {
          const dayEvents = events.filter(e => e.day === day);
          return (
            <div key={day} className="bg-prussianblue min-h-[140px] p-4 group hover:bg-white/[0.02] transition-colors relative">
              <span className="text-xs font-black text-white/10 group-hover:text-pilot-orange transition-colors">{day}</span>
              <div className="mt-2 space-y-1">
                {dayEvents.map(ev => (
                  <div key={ev.id} className="p-1.5 bg-pilot-orange/10 border-l-2 border-pilot-orange rounded text-[9px] font-bold text-white/70 truncate uppercase">
                    {ev.time} {ev.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={isAddingEvent} onClose={() => setIsAddingEvent(false)} title="Temporal Window Logging">
        <form className="space-y-6" onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          onAdd({
            id: Math.random().toString(36).substr(2, 9),
            day: Number(fd.get('day')),
            title: fd.get('title') as string,
            time: fd.get('time') as string,
            color: 'bg-pilot-orange',
            loc: fd.get('loc') as string || 'Remote'
          });
          setIsAddingEvent(false);
        }}>
          <div>
            <label className={THEME.label}>Objective Title</label>
            <input name="title" required className={`${THEME.input} w-full mt-2`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={THEME.label}>Cycle Day</label>
              <input name="day" type="number" min="1" max="31" required className={`${THEME.input} w-full mt-2`} />
            </div>
            <div>
              <label className={THEME.label}>Window (HH:MM)</label>
              <input name="time" type="time" required className={`${THEME.input} w-full mt-2`} />
            </div>
          </div>
          <button type="submit" className={`${THEME.buttonPrimary} w-full py-4 text-xs font-black uppercase tracking-widest`}>LOG WINDOW</button>
        </form>
      </Modal>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const { toasts, removeToast, success, error, info } = useToast();
  const [state, setState] = useState<AppState>({
    tasks: [],
    projects: [],
    calendarEvents: [],
    recurringTasks: [],
    energyLevel: 'Medium',
    dailyReports: [],
    currentStreak: 0,
  });

  // Undo/Redo history stack
  type HistoryAction = {
    type: 'task_delete' | 'task_update' | 'task_create' | 'task_toggle';
    data: any;
    timestamp: number;
  };
  const [history, setHistory] = useState<HistoryAction[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryAction[]>([]);

  useEffect(() => {
    const checkAuth = () => {
      // Check if user is already authenticated (e.g., from localStorage)
      const savedAuth = localStorage.getItem('isAuthenticated');
      if (savedAuth === 'true') {
        setIsAuthenticated(true);
        // Request notification permission after login
        setTimeout(() => {
          if (notificationService.isSupported() && !notificationService.hasPermission()) {
            notificationService.requestPermission();
          }
        }, 3000); // Wait 3 seconds after app loads
      }
      setLoading(false);
    };

    // Show loading screen for at least 2 seconds
    setTimeout(checkAuth, 2000);
  }, []);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('theme', theme);
    // Update document root class for theme
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !currentUser) return;

      try {
        info('Loading your data...');

        // Load all data from Firestore
        const [tasks, projects, calendarEvents, recurringTasks, dailyReports] = await Promise.all([
          firestoreService.getTasks(currentUser.uid),
          firestoreService.getProjects(currentUser.uid),
          firestoreService.getCalendarEvents(currentUser.uid),
          firestoreService.getRecurringTasks(currentUser.uid),
          firestoreService.getDailyReports(currentUser.uid),
        ]);

        setState(prev => ({
          ...prev,
          tasks: tasks.length > 0 ? tasks : prev.tasks,
          projects: projects.length > 0 ? projects : prev.projects,
          calendarEvents: calendarEvents.length > 0 ? calendarEvents : prev.calendarEvents,
          recurringTasks: recurringTasks.length > 0 ? recurringTasks : prev.recurringTasks,
          dailyReports: dailyReports.length > 0 ? dailyReports : prev.dailyReports,
          currentStreak: 12,
        }));

        success('Data loaded successfully!');
      } catch (error) {
        console.error("Failed to fetch data from Firestore:", error);
        error('Failed to load data. Using offline mode.');

        // Fallback to mock data if Firestore fails
        try {
          const response = await fetch('./Mockdata.json');
          const data = await response.json();
          setState(prev => ({
            ...prev,
            tasks: data.tasks,
            projects: data.projects,
            calendarEvents: data.calendarEvents,
            recurringTasks: data.recurringTasks,
            dailyReports: data.dailyReports,
            currentStreak: 12,
          }));
        } catch (fallbackError) {
          console.error("Failed to fetch mock data:", fallbackError);
        }
      }
    };
    fetchData();
  }, [isAuthenticated, currentUser]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Cmd/Ctrl+Z for Undo
      if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Cmd/Ctrl+Shift+Z for Redo
      if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }

      // ? key for Keyboard Shortcuts overlay
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setShowShortcuts(true);
      }

      // Esc key to close overlays
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showShortcuts) setShowShortcuts(false);
        if (showProfile) setShowProfile(false);
      }

      // F key for Focus Mode
      if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey && !showShortcuts && !showProfile) {
        e.preventDefault();
        setFocusMode(prev => !prev);
        info(focusMode ? 'Focus mode disabled' : 'Focus mode enabled');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [focusMode, info, showShortcuts, showProfile, history, redoStack]);

  const handleUndo = () => {
    if (history.length === 0) {
      info('Nothing to undo');
      return;
    }

    const lastAction = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    setRedoStack([...redoStack, lastAction]);

    // Reverse the action
    switch (lastAction.type) {
      case 'task_delete':
        // Restore deleted task
        setState(prev => ({ ...prev, tasks: [...prev.tasks, lastAction.data] }));
        success('Restored deleted task');
        break;
      case 'task_create':
        // Remove created task
        setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== lastAction.data.id) }));
        success('Undone task creation');
        break;
      case 'task_toggle':
        // Toggle back
        setState(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => t.id === lastAction.data.id ? lastAction.data : t)
        }));
        success('Undone task toggle');
        break;
      case 'task_update':
        // Restore previous state
        setState(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => t.id === lastAction.data.id ? lastAction.data : t)
        }));
        success('Undone task update');
        break;
    }
  };

  const handleRedo = () => {
    if (redoStack.length === 0) {
      info('Nothing to redo');
      return;
    }

    const lastRedo = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);
    setRedoStack(newRedoStack);
    setHistory([...history, lastRedo]);

    // Redo the action
    switch (lastRedo.type) {
      case 'task_delete':
        setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== lastRedo.data.id) }));
        success('Redone task deletion');
        break;
      case 'task_create':
        setState(prev => ({ ...prev, tasks: [...prev.tasks, lastRedo.data] }));
        success('Redone task creation');
        break;
      case 'task_toggle':
        setState(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => t.id === lastRedo.data.id ? { ...t, isCompleted: !t.isCompleted } : t)
        }));
        success('Redone task toggle');
        break;
      case 'task_update':
        setState(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => t.id === lastRedo.data.id ? lastRedo.data : t)
        }));
        success('Redone task update');
        break;
    }
  };

  const handleLogin = (user?: any) => {
    setIsAuthenticated(true);
    setCurrentUser(user || { email: 'demo@pacepilot.app', uid: 'demo-user', metadata: { creationTime: new Date().toISOString(), lastSignInTime: new Date().toISOString() } });
    localStorage.setItem('isAuthenticated', 'true');
    success('Welcome back to Pace Pilot!');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('isAuthenticated');
    info('Signed out successfully');
  };

  const toggleTask = async (id: string) => {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
      // Add to history before changing
      setHistory(prev => [...prev, { type: 'task_toggle', data: task, timestamp: Date.now() }]);
      setRedoStack([]); // Clear redo stack on new action

      // Update in Firestore
      if (currentUser) {
        await firestoreService.updateTask(id, { isCompleted: !task.isCompleted });
      }
    }
    setState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t) }));
    success('Task updated!');
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
      // Add to history before changing
      setHistory(prev => [...prev, { type: 'task_update', data: task, timestamp: Date.now() }]);
      setRedoStack([]); // Clear redo stack on new action

      // Update in Firestore
      if (currentUser) {
        await firestoreService.updateTask(id, updates);
      }
    }
    setState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates } : t) }));
  };

  const duplicateTask = async (id: string) => {
    const task = state.tasks.find(t => t.id === id);
    if (task && currentUser) {
      // Duplicate subtasks with new IDs
      const duplicatedSubtasks = task.subtasks?.map(st => ({
        id: Math.random().toString(36).substr(2, 9),
        title: st.title,
        isCompleted: false
      }));

      const newTaskData = {
        title: `${task.title} (Copy)`,
        description: task.description,
        category: task.category,
        projectId: task.projectId,
        energyRequired: task.energyRequired,
        isCompleted: false,
        dueDate: task.dueDate,
        createdAt: new Date().toISOString(),
        isRecurring: task.isRecurring,
        recurringInterval: task.recurringInterval,
        subtasks: duplicatedSubtasks
      };

      // Add to Firestore
      const newTaskId = await firestoreService.addTask(currentUser.uid, newTaskData);
      const newTask: Task = {
        id: String(newTaskId),
        title: newTaskData.title,
        description: newTaskData.description,
        category: newTaskData.category,
        projectId: newTaskData.projectId,
        energyRequired: newTaskData.energyRequired,
        isCompleted: newTaskData.isCompleted,
        dueDate: newTaskData.dueDate,
        createdAt: newTaskData.createdAt,
        isRecurring: newTaskData.isRecurring,
        recurringInterval: newTaskData.recurringInterval,
        subtasks: newTaskData.subtasks
      };

      // Add to history for undo
      setHistory(prev => [...prev, { type: 'task_create', data: newTask, timestamp: Date.now() }]);
      setRedoStack([]);
      setState(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
      success('Task duplicated!');
    }
  };

  const deleteTask = async (id: string) => {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
      // Add to history before deleting
      setHistory(prev => [...prev, { type: 'task_delete', data: task, timestamp: Date.now() }]);
      setRedoStack([]);

      // Delete from Firestore
      if (currentUser) {
        await firestoreService.deleteTask(id);
      }

      setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
      success('Task deleted!');
    }
  };

  const toggleRecurring = (id: string) => {
    setState(prev => ({ ...prev, recurringTasks: prev.recurringTasks.map(rt => rt.id === id ? { ...rt, status: rt.status === 'Completed' ? 'Pending' : 'Completed' } : rt) }));
  };

  const addCalendarEvent = (ev: CalendarEvent) => {
    setState(prev => ({ ...prev, calendarEvents: [...prev.calendarEvents, ev] }));
  };

  const setEnergy = (level: EnergyLevel) => {
    setState(prev => ({ ...prev, energyLevel: level }));
  };

  const addProject = (name: string) => {
    const newProject: Project = { id: Math.random().toString(36).substr(2, 9), name, color: 'bg-pilot-orange', icon: 'Folder' };
    setState(prev => ({ ...prev, projects: [...prev.projects, newProject] }));
  };

  const exportDataAsJSON = () => {
    const exportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      user: {
        email: currentUser?.email || 'unknown',
        uid: currentUser?.uid || 'unknown'
      },
      data: state
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `pace-pilot-export-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    success('Data exported successfully!');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    success(`${newTheme === 'light' ? 'Light' : 'Dark'} mode enabled`);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      {showProfile && currentUser && (
        <UserProfile user={currentUser} onClose={() => setShowProfile(false)} onLogout={handleLogout} onExport={exportDataAsJSON} />
      )}
      <KeyboardShortcuts isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <div className={`min-h-screen flex font-sans selection:bg-pilot-orange/30 ${focusMode ? 'focus-mode' : ''} ${theme === 'dark' ? 'bg-deepnavy text-white' : 'bg-gray-50 text-gray-900'}`}>
        {!focusMode && <Sidebar isCollapsed={isSidebarCollapsed} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />}
        <main className={`flex-1 transition-all duration-300 ease-in-out p-6 lg:p-12 ${!focusMode ? (isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72') : ''} flex flex-col h-screen overflow-hidden relative`}>
          {!focusMode && <TopBar toggleSidebar={() => setIsSidebarOpen(true)} onLogout={handleLogout} onShowProfile={() => setShowProfile(true)} user={currentUser} focusMode={focusMode} toggleFocusMode={() => setFocusMode(!focusMode)} searchQuery={searchQuery} setSearchQuery={setSearchQuery} theme={theme} toggleTheme={toggleTheme} onShowMusicPlayer={() => setShowMusicPlayer(true)} />}
          {focusMode && (
            <button
              onClick={() => setFocusMode(false)}
              className="fixed top-6 right-6 z-50 bg-pilot-orange hover:bg-pilot-orange/90 text-white p-3 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 group"
              title="Exit Focus Mode (F)"
            >
              <X size={24} />
              <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-prussianblue border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Exit Focus Mode (F)
              </span>
            </button>
          )}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-20 lg:pb-12">
            <Routes>
              <Route path="/" element={<WorkdayPage state={state} setState={setState} toggleTask={toggleTask} updateTask={updateTask} setEnergy={setEnergy} duplicateTask={duplicateTask} deleteTask={deleteTask} searchQuery={searchQuery} />} />
              <Route path="/planner" element={<WeeklyPlannerPage state={state} setState={setState} toggleTask={toggleTask} updateTask={updateTask} />} />
              <Route path="/projects" element={<ProjectsPage state={state} setState={setState} toggleTask={toggleTask} updateTask={updateTask} addProject={addProject} duplicateTask={duplicateTask} deleteTask={deleteTask} />} />
              <Route path="/projects/:projectId" element={<ProjectsPage state={state} setState={setState} toggleTask={toggleTask} updateTask={updateTask} addProject={addProject} duplicateTask={duplicateTask} deleteTask={deleteTask} />} />
              <Route path="/recurring" element={<RecurringTasksPage tasks={state.recurringTasks} onToggle={toggleRecurring} />} />
              <Route path="/reports" element={<ReportsPage reports={state.dailyReports} tasks={state.tasks} />} />
              <Route path="/calendar" element={<CalendarPage events={state.calendarEvents} onAdd={addCalendarEvent} />} />
              <Route path="*" element={<div className="flex flex-col items-center justify-center p-32 text-center opacity-10"><Clock size={120} strokeWidth={0.5} className="mb-10" /><h2 className="text-3xl font-black uppercase tracking-[1em]">OFF-GRID</h2><p className="text-[10px] font-bold tracking-[0.5em] mt-4">THIS SECTOR IS NOT YET MAPPED</p></div>} />
            </Routes>
          </div>
        </main>
        {!focusMode && <MobileBottomNav />}
      </div>
      {showMusicPlayer && <MusicPlayer onClose={() => setShowMusicPlayer(false)} />}
      <AIPilot
        taskCount={state.tasks.length}
        completedToday={state.tasks.filter(t => t.isCompleted && t.createdAt.startsWith(new Date().toISOString().split('T')[0])).length}
        energyLevel={state.energyLevel || 'Medium'}
      />
      <style>{`
        @keyframes bounce-short { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        .animate-bounce-short { animation: bounce-short 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        select option { background: #11122C; color: white; font-weight: bold; }
        .snap-x { scroll-snap-type: x mandatory; }
        .snap-start { scroll-snap-align: start; }
        input::placeholder { font-weight: 900; letter-spacing: 0.1em; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(243,115,36,0.3); }

        /* Light mode overrides */
        html.light {
          background: #f9fafb;
        }

        html.light .bg-prussianblue {
          background: white !important;
          border-color: rgba(0,0,0,0.15) !important;
        }

        html.light .bg-deepnavy {
          background: #f3f4f6 !important;
        }

        html.light .text-white {
          color: #111827 !important;
        }

        html.light .text-white\\/70 {
          color: #374151 !important;
        }

        html.light .text-white\\/40 {
          color: #6b7280 !important;
        }

        html.light .text-white\\/30 {
          color: #9ca3af !important;
        }

        html.light .text-white\\/20 {
          color: #d1d5db !important;
        }

        html.light .text-white\\/10 {
          color: #e5e7eb !important;
        }

        html.light .border-white\\/10 {
          border-color: rgba(0,0,0,0.15) !important;
        }

        html.light .border-white\\/5 {
          border-color: rgba(0,0,0,0.1) !important;
        }

        html.light .bg-white\\/5 {
          background: rgba(0,0,0,0.04) !important;
        }

        html.light .bg-white\\/10 {
          background: rgba(0,0,0,0.06) !important;
        }

        html.light .bg-white\\/\\[0.03\\] {
          background: rgba(0,0,0,0.03) !important;
        }

        html.light .bg-white\\/\\[0.02\\] {
          background: rgba(0,0,0,0.02) !important;
        }

        html.light .bg-white\\/\\[0.01\\] {
          background: rgba(0,0,0,0.01) !important;
        }

        html.light .bg-white\\/\\[0.04\\] {
          background: rgba(0,0,0,0.04) !important;
        }

        html.light select option {
          background: white;
          color: #111827;
        }

        html.light ::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.15);
        }

        html.light ::-webkit-scrollbar-thumb:hover {
          background: rgba(243,115,36,0.5);
        }

        html.light .hover\\:bg-white\\/5:hover {
          background: rgba(0,0,0,0.06) !important;
        }

        html.light .hover\\:bg-white\\/10:hover {
          background: rgba(0,0,0,0.08) !important;
        }

        html.light .hover\\:text-white:hover {
          color: #111827 !important;
        }

        html.light input::placeholder {
          color: rgba(0,0,0,0.3) !important;
        }

        html.light textarea::placeholder {
          color: rgba(0,0,0,0.3) !important;
        }
      `}</style>
    </HashRouter>
  );
}