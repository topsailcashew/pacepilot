
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import { 
  Home, 
  BarChart2, 
  Layers, 
  Calendar as CalendarIcon, 
  Zap, 
  CheckCircle2, 
  Plus, 
  TrendingUp,
  Brain,
  X,
  Loader2,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Search,
  Bell,
  Target,
  Menu,
  Play,
  SkipBack,
  SkipForward,
  Settings,
  LayoutGrid,
  Clock,
  Briefcase,
  Folder,
  Check,
  GripVertical,
  CalendarDays,
  Filter,
  PlusCircle,
  Sparkles,
  Users,
  PieChart as PieChartIcon,
  Activity,
  User as UserIcon,
  LogOut,
  Mail,
  Lock,
  Globe,
  Coffee,
  CheckCircle,
  ListTodo
} from 'lucide-react';
import { EnergyLevel, Task, Project, DailyReport, AppState, CalendarEvent, RecurringTask, User } from './types';
import { ENERGY_LEVELS } from './constants';
import { generateDailyReport, getWeeklyInsights } from './services/geminiService';
import PomodoroTimer from './components/PomodoroTimer';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

// --- Shared Design Constants ---
const THEME = {
  card: "bg-prussianblue border border-white/5 rounded-xl p-8 shadow-xl shadow-black/20",
  innerCard: "bg-white/[0.03] border border-white/5 rounded-lg p-5 transition-all duration-300",
  buttonPrimary: "bg-pilot-orange hover:bg-pilot-orange/90 text-white font-bold rounded-lg transition-all active:scale-[0.98]",
  buttonSecondary: "bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-bold rounded-lg transition-all",
  input: "bg-deepnavy border border-white/10 focus:border-pilot-orange/50 rounded-lg px-4 py-3 text-sm text-white focus:outline-none transition-all placeholder:text-white/10",
  label: "text-[10px] font-black uppercase tracking-[0.2em] text-white/30"
};

// --- Prop Interfaces ---

// Added TaskItemProps to fix "Cannot find name 'TaskItemProps'"
interface TaskItemProps {
  task: Task;
  projects: Project[];
  toggleTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  onFocus: (task: Task) => void;
  isFocusing: boolean;
}

// Added WorkdayPageProps to fix "Cannot find name 'WorkdayPageProps'"
interface WorkdayPageProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  toggleTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  setEnergy: (level: EnergyLevel) => void;
}

// --- Protected Route ---
const ProtectedRoute = ({ children, user }: { children: React.ReactNode, user: User | null }) => {
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// --- Modal Component ---
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-deepnavy border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-prussianblue/50">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">{title}</h3>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-1">Action Panel</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Authentication Pages ---

const LoginPage = ({ onLogin }: { onLogin: (u: User) => void }) => {
  const navigate = useNavigate();
  const handleGoogleAuth = () => {
    onLogin({
      name: 'Nathaniel',
      email: 'hello@pacepilot.com',
      streak: 12,
      preferences: { startTime: '08:00', endTime: '18:00', dailyGoal: 8 }
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 animate-in fade-in duration-700 bg-deepnavy">
      <div className="hidden lg:flex bg-pilot-orange flex-col justify-between p-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pilot-orange via-orange-600 to-deepnavy opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white mb-12">
            <Zap size={32} fill="currentColor" />
            <h1 className="text-2xl font-black tracking-tighter">PACE PILOT</h1>
          </div>
          <h2 className="text-6xl font-black text-white leading-none tracking-tighter max-w-md">FLOW WITH YOUR ENERGY.</h2>
          <p className="text-white/80 mt-6 text-lg max-w-sm">The intelligent productivity sidekick that helps you work smarter, not harder.</p>
        </div>
        <div className="relative z-10 text-white/60 text-sm font-bold tracking-widest uppercase">Empowering Focus • 2025</div>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h3 className="text-3xl font-black text-white tracking-tight uppercase">Welcome back</h3>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-2">Sign in to your dashboard</p>
          </div>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleGoogleAuth(); }}>
            <div className="space-y-2">
              <label className={THEME.label}>Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                <input type="email" required className={`${THEME.input} w-full pl-12`} placeholder="YOUR@EMAIL.COM" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className={THEME.label}>Password</label>
                <button type="button" className="text-[9px] font-black text-pilot-orange uppercase tracking-widest hover:text-white">Forgot?</button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                <input type="password" required className={`${THEME.input} w-full pl-12`} placeholder="••••••••" />
              </div>
            </div>
            <button type="submit" className={`${THEME.buttonPrimary} w-full py-4 text-xs font-black uppercase tracking-widest mt-4 shadow-lg shadow-pilot-orange/20`}>Sign In</button>
          </form>
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-[10px]"><span className="bg-deepnavy px-4 font-black text-white/20 uppercase tracking-widest">or continue with</span></div>
          </div>
          <button onClick={handleGoogleAuth} className="w-full bg-white text-deepnavy font-black py-4 rounded-lg flex items-center justify-center gap-3 text-xs uppercase tracking-widest hover:bg-white/90 transition-all shadow-xl">
            <Globe size={16} /> Google Account
          </button>
          <p className="text-center text-[10px] font-bold text-white/20 uppercase tracking-widest mt-6">
            New to Pace Pilot? <Link to="/signup" className="text-pilot-orange hover:text-white transition-colors">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const SignupPage = ({ onSignup }: { onSignup: (u: User) => void }) => {
  const navigate = useNavigate();
  const handleGoogleAuth = () => {
    onSignup({
      name: 'Nathaniel',
      email: 'hello@pacepilot.com',
      streak: 0,
      preferences: { startTime: '08:00', endTime: '18:00', dailyGoal: 5 }
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-deepnavy p-8 animate-in zoom-in-95 duration-500">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="bg-pilot-orange p-2 rounded-lg text-white w-fit mx-auto mb-8 shadow-xl shadow-pilot-orange/20">
            <Zap size={24} fill="currentColor" />
          </div>
          <h3 className="text-3xl font-black text-white tracking-tight uppercase">Get Started</h3>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-2">Join Pace Pilot today</p>
        </div>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleGoogleAuth(); }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={THEME.label}>First Name</label>
              <input type="text" required className={`${THEME.input} w-full`} placeholder="NATHANIEL" />
            </div>
            <div className="space-y-2">
              <label className={THEME.label}>Focus Area</label>
              <input type="text" className={`${THEME.input} w-full`} placeholder="CREATIVE" />
            </div>
          </div>
          <div className="space-y-2">
            <label className={THEME.label}>Email Address</label>
            <input type="email" required className={`${THEME.input} w-full`} placeholder="HELLO@PACEPILOT.COM" />
          </div>
          <div className="space-y-2">
            <label className={THEME.label}>Password</label>
            <input type="password" required className={`${THEME.input} w-full`} placeholder="8+ CHARACTERS" />
          </div>
          <button type="submit" className={`${THEME.buttonPrimary} w-full py-4 text-xs font-black uppercase tracking-widest mt-4 shadow-lg shadow-pilot-orange/20`}>Create Account</button>
        </form>
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
          <div className="relative flex justify-center text-[10px]"><span className="bg-deepnavy px-4 font-black text-white/20 uppercase tracking-widest">or sign up with</span></div>
        </div>
        <button onClick={handleGoogleAuth} className="w-full bg-white/5 border border-white/10 text-white font-black py-4 rounded-lg flex items-center justify-center gap-3 text-xs uppercase tracking-widest hover:bg-white/10 transition-all">
          <Globe size={16} /> Google Account
        </button>
        <p className="text-center text-[10px] font-bold text-white/20 uppercase tracking-widest mt-6">
          Already a member? <Link to="/login" className="text-pilot-orange hover:text-white transition-colors">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

// --- Profile Page ---

const ProfilePage = ({ user, onLogout, onUpdate }: { user: User, onLogout: () => void, onUpdate: (u: Partial<User>) => void }) => {
  const navigate = useNavigate();
  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12 max-w-5xl mx-auto space-y-10">
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tighter uppercase">User Profile</h3>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-2">Manage your productivity preferences</p>
        </div>
        <button onClick={handleLogout} className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500/20 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
          <LogOut size={16} /> Logout Terminal
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className={`${THEME.card} lg:col-span-1 flex flex-col items-center justify-center text-center py-12`}>
          <div className="w-28 h-28 bg-pilot-orange/10 border-4 border-pilot-orange/20 rounded-full flex items-center justify-center text-pilot-orange mb-6 shadow-2xl shadow-pilot-orange/10">
            <UserIcon size={56} />
          </div>
          <h4 className="text-2xl font-black text-white tracking-tight uppercase">{user.name}</h4>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">{user.email}</p>
          <div className="mt-8 flex items-center gap-2 bg-pilot-orange px-6 py-2.5 rounded-full text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-pilot-orange/30">
            <TrendingUp size={16} /> {user.streak} Day Streak
          </div>
        </div>

        <div className={`${THEME.card} lg:col-span-2 space-y-8`}>
          <h5 className="text-sm font-black text-white/40 uppercase tracking-widest border-b border-white/5 pb-4">Personal Settings</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className={THEME.label}>Start of Productive Day</label>
              <input type="time" defaultValue={user.preferences.startTime} className={THEME.input + " w-full"} />
            </div>
            <div className="space-y-3">
              <label className={THEME.label}>End of Productive Day</label>
              <input type="time" defaultValue={user.preferences.endTime} className={THEME.input + " w-full"} />
            </div>
            <div className="space-y-3">
              <label className={THEME.label}>Daily Task Goal</label>
              <select className={THEME.input + " w-full"} defaultValue={user.preferences.dailyGoal}>
                <option value={3}>3 Tasks</option>
                <option value={5}>5 Tasks</option>
                <option value={8}>8 Tasks</option>
                <option value={12}>12 Tasks</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className={THEME.label}>Focus Music Preset</label>
              <select className={THEME.input + " w-full"}>
                <option>Lo-Fi Chill</option>
                <option>Deep Jazz</option>
                <option>Synth Focus</option>
              </select>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex justify-end">
            <button className={`${THEME.buttonPrimary} px-12 py-3.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-pilot-orange/20`}>Update Biometrics</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Task Item Component ---

const TaskItem = ({ task, projects, toggleTask, updateTask, onFocus, isFocusing }: TaskItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.isCompleted) {
      setIsCompleting(true);
      setTimeout(() => {
        toggleTask(task.id);
        setIsCompleting(false);
      }, 500);
    } else {
      toggleTask(task.id);
    }
  };

  const currentProject = projects.find(p => p.id === task.projectId);

  return (
    <div 
      onClick={() => setIsExpanded(!isExpanded)}
      className={`group relative bg-white/[0.02] border border-white/5 rounded-xl p-4 transition-all duration-300 hover:bg-white/[0.04] cursor-pointer ${isFocusing ? 'ring-1 ring-pilot-orange/40' : ''} ${isExpanded ? 'bg-white/[0.04]' : ''} ${task.isCompleted ? 'opacity-50' : ''} ${isCompleting ? 'scale-105 bg-pilot-orange/5 border-pilot-orange/30' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className="text-white/10 group-hover:text-white/30 transition-colors">
          <GripVertical size={16} />
        </div>
        
        <button 
          onClick={handleToggleComplete}
          className={`w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center ${task.isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-white/10 group-hover:border-pilot-orange/50'} ${isCompleting ? 'animate-success-pop' : ''}`}
        >
          {task.isCompleted && <Check size={14} strokeWidth={4} />}
        </button>
        
        <div className="flex-1 overflow-hidden">
          <h4 className={`text-sm font-bold transition-all truncate ${task.isCompleted ? 'line-through text-white/20' : 'text-white/80'}`}>{task.title}</h4>
          {!isExpanded && (
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1.5 text-white/20">
                <Zap size={10} className={task.energyRequired === 'High' ? 'text-pilot-orange' : 'text-white/40'} />
                <span className="text-[10px] font-black uppercase tracking-widest">{task.energyRequired} Energy</span>
              </div>
              {currentProject && (
                <div className="flex items-center gap-1.5 text-white/20">
                  <Folder size={10} className="text-white/40" />
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
        <div className="mt-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-300" onClick={(e) => e.stopPropagation()}>
           <p className="text-xs text-white/50 leading-relaxed">
             {task.description || "No specific details provided."}
           </p>
           <div className="mt-4 flex gap-3">
             <button className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-white/5 rounded hover:bg-white/10 transition-all">Edit</button>
             <button className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-all">Delete</button>
           </div>
        </div>
      )}
    </div>
  );
};

// --- Workday Page ---

const WorkdayPage = ({ state, setState, toggleTask, updateTask, setEnergy }: WorkdayPageProps) => {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const activeTask = useMemo(() => state.tasks.find(t => t.id === activeTaskId) || null, [state.tasks, activeTaskId]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportResult, setReportResult] = useState<string | null>(null);
  const [energyFilter, setEnergyFilter] = useState<EnergyLevel | 'All'>('All');

  const dailyTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return state.tasks.filter(t => t.createdAt.startsWith(today) || (t.dueDate && t.dueDate.startsWith(today)));
  }, [state.tasks]);

  const filteredTasks = useMemo(() => {
    let result = state.tasks.filter(t => !t.isCompleted);
    if (energyFilter !== 'All') {
      result = result.filter(t => t.energyRequired === energyFilter);
    }
    return result;
  }, [state.tasks, energyFilter]);

  const progress = useMemo(() => {
    if (dailyTasks.length === 0) return 0;
    const completed = dailyTasks.filter(t => t.isCompleted).length;
    return Math.round((completed / dailyTasks.length) * 100);
  }, [dailyTasks]);

  const handleEndDay = async () => {
    setIsGeneratingReport(true);
    const completedToday = state.tasks.filter(t => t.isCompleted);
    const report = await generateDailyReport(completedToday, "Focus was solid today.", state.energyLevel || 'Medium');
    setReportResult(report);
    setIsGeneratingReport(false);
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-8 h-full overflow-y-auto custom-scrollbar no-scrollbar">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <PomodoroTimer activeTask={activeTask} isActive={isTimerActive} setIsActive={setIsTimerActive} />
        </div>

        <div className={`${THEME.card} lg:col-span-5 space-y-8 flex flex-col h-full`}>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-widest mb-4">Daily Vibe</h3>
            <div className="space-y-4">
              <p className={THEME.label}>How's your energy right now?</p>
              <div className="grid grid-cols-3 gap-3">
                {ENERGY_LEVELS.map(level => (
                  <button 
                    key={level}
                    onClick={() => setEnergy(level)}
                    className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${state.energyLevel === level ? 'bg-pilot-orange/10 border-pilot-orange/30 text-pilot-orange' : 'bg-white/[0.02] border-white/5 text-white/20 hover:bg-white/5'}`}
                  >
                    <Zap size={14} fill={state.energyLevel === level ? 'currentColor' : 'none'} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{level}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex-1">
             <div className="flex items-center justify-between mb-4 px-1">
               <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Acoustic Shield</span>
               <button className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-pilot-orange transition-all"><Settings size={14}/></button>
            </div>
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-8">
                <SkipBack size={18} className="text-white/20 cursor-pointer hover:text-white" />
                <button className="bg-pilot-orange text-white p-4 rounded-full shadow-xl shadow-pilot-orange/30 hover:scale-105 active:scale-95 transition-all"><Play size={20} fill="currentColor" /></button>
                <SkipForward size={18} className="text-white/20 cursor-pointer hover:text-white" />
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full relative">
                 <div className="absolute top-0 left-0 h-full w-[65%] bg-pilot-orange rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={THEME.card}>
        <div className="mb-10">
           <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Daily Momentum</h3>
              <span className="text-xs font-black text-pilot-orange tracking-widest">{progress}% Done</span>
           </div>
           <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
              <div className="h-full bg-pilot-orange shadow-[0_0_15px_rgba(243,115,36,0.3)] transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
           </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <Activity size={24} className="text-pilot-orange" />
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-widest">Tasks for Today</h3>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mt-1">{filteredTasks.length} pending items</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/5 p-1 rounded-lg border border-white/10 flex items-center">
              <div className="px-4 py-2 border-r border-white/10">
                <select value={energyFilter} onChange={(e) => setEnergyFilter(e.target.value as any)} className="bg-transparent text-[10px] font-black uppercase tracking-widest text-white/60 focus:outline-none cursor-pointer">
                  <option value="All">All Energy</option>
                  {ENERGY_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                </select>
              </div>
              <button onClick={() => setIsAddingTask(true)} className="px-4 py-2 text-pilot-orange hover:text-white transition-all flex items-center gap-2"><Plus size={14} /></button>
            </div>
            <button onClick={handleEndDay} disabled={isGeneratingReport} className={`${THEME.buttonPrimary} px-8 py-2.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-pilot-orange/10`}>End Day</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-20 bg-white/[0.01] rounded-xl border border-dashed border-white/10">
                <CheckCircle2 size={40} className="mx-auto mb-4 text-white/5" />
                <p className="text-sm font-black text-white/20 uppercase tracking-widest">You're all caught up!</p>
              </div>
            ) : (
              filteredTasks.map((task) => <TaskItem key={task.id} task={task} projects={state.projects} toggleTask={toggleTask} updateTask={updateTask} onFocus={(t) => setActiveTaskId(t.id)} isFocusing={activeTaskId === task.id} />)
            )}
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
               <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-6">Area Progress</h4>
               <div className="space-y-6">
                 {state.projects.map(p => {
                   const projectTasks = state.tasks.filter(t => t.projectId === p.id);
                   const completed = projectTasks.filter(t => t.isCompleted).length;
                   const prog = projectTasks.length ? Math.round((completed / projectTasks.length) * 100) : 0;
                   return (
                    <div key={p.id}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-white/80 uppercase tracking-tight">{p.name}</span>
                        <span className="text-[10px] font-black text-white/20">{prog}%</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-pilot-orange" style={{ width: `${prog}%` }} /></div>
                    </div>
                   );
                 })}
               </div>
            </div>
            {reportResult && (
               <div className="bg-pilot-orange/5 border border-pilot-orange/20 rounded-xl p-6 animate-in slide-in-from-right-4 duration-500">
                 <div className="flex items-center gap-2 mb-4"><Sparkles size={18} className="text-pilot-orange" /><h4 className="text-xs font-black text-white uppercase tracking-widest">End Day Insight</h4></div>
                 <p className="text-xs text-white/60 leading-relaxed italic">"{reportResult}"</p>
                 <button onClick={() => setReportResult(null)} className="mt-4 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-all underline">Dismiss</button>
               </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isAddingTask} onClose={() => setIsAddingTask(false)} title="New Task">
        <form className="space-y-6" onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const newTask: Task = {
            id: Math.random().toString(36).substr(2, 9),
            title: fd.get('title') as string,
            energyRequired: fd.get('energy') as EnergyLevel,
            isCompleted: false,
            createdAt: new Date().toISOString(),
            projectId: fd.get('project') as string,
          };
          setState(prev => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
          setIsAddingTask(false);
        }}>
          <div className="space-y-2">
            <label className={THEME.label}>Task Name</label>
            <input name="title" required placeholder="What needs doing?" className={`${THEME.input} w-full`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className={THEME.label}>Energy Band</label><select name="energy" className={`${THEME.input} w-full`}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></div>
            <div className="space-y-2"><label className={THEME.label}>Project</label><select name="project" className={`${THEME.input} w-full`}><option value="">None</option>{state.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          </div>
          <button type="submit" className={`${THEME.buttonPrimary} w-full py-4 text-xs font-black uppercase tracking-widest shadow-lg shadow-pilot-orange/20`}>Add Task</button>
        </form>
      </Modal>
    </div>
  );
};

// --- Recurring / Planner / Reports / Sidebar Components ---

const Sidebar = ({ isOpen, setIsOpen, user }: { isOpen: boolean, setIsOpen: (o: boolean) => void, user: User | null }) => {
  const location = useLocation();
  const navItems = [
    { icon: <Home size={20} />, label: 'Workday', path: '/' },
    { icon: <CalendarDays size={20} />, label: 'Planner', path: '/planner' },
    { icon: <Briefcase size={20} />, label: 'Projects', path: '/projects' },
    { icon: <CalendarIcon size={20} />, label: 'Calendar', path: '/calendar' },
    { icon: <RefreshCw size={20} />, label: 'Recurring', path: '/recurring' },
    { icon: <BarChart2 size={20} />, label: 'Insights', path: '/reports' },
  ];

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)} />
      <aside className={`fixed top-0 left-0 z-50 h-full w-72 bg-prussianblue border-r border-white/5 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 border-b border-white/5 bg-deepnavy/50">
          <div className="flex items-center gap-3 text-pilot-orange mb-2"><Zap size={24} fill="currentColor" /><h1 className="text-xl font-black tracking-tighter text-white uppercase">PACE PILOT</h1></div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Productivity Sidekick</p>
        </div>
        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)} className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group ${isActive ? 'bg-pilot-orange/10 text-pilot-orange' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                <div className={`${isActive ? 'text-pilot-orange' : 'text-white/20 group-hover:text-white/40'} transition-colors`}>{item.icon}</div>
                <span className={`text-[11px] font-black uppercase tracking-widest ${isActive ? 'text-white' : ''}`}>{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-pilot-orange shadow-[0_0_8px_rgba(243,115,36,0.5)]" />}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 mt-auto border-t border-white/5">
          <Link to="/profile" onClick={() => setIsOpen(false)} className={`flex items-center gap-4 p-4 rounded-xl transition-all ${location.pathname === '/profile' ? 'bg-white/5' : 'hover:bg-white/5'}`}>
            <div className="w-10 h-10 rounded-full bg-pilot-orange/10 flex items-center justify-center text-pilot-orange border border-pilot-orange/20"><UserIcon size={20} /></div>
            <div className="flex-1 overflow-hidden text-left"><p className="text-[11px] font-black text-white uppercase truncate">{user?.name || 'Guest'}</p><p className="text-[9px] font-bold text-white/30 uppercase tracking-widest truncate">{user?.streak || 0} Day Streak</p></div>
          </Link>
        </div>
      </aside>
    </>
  );
};

const TopBar = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <header className="flex items-center justify-between mb-10 px-2 shrink-0">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="lg:hidden p-2 text-white/40 hover:text-white bg-white/5 rounded-lg border border-white/10"><Menu size={20} /></button>
        <div><h2 className="text-2xl font-black text-white tracking-tight uppercase">Daily Dashboard</h2><p className="text-[10px] text-white/30 font-bold mt-1 uppercase tracking-[0.2em]">{time.toLocaleDateString()} • {time.toLocaleTimeString()}</p></div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full hidden sm:flex"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">System Ready</span></div>
        <button className="text-white/20 hover:text-white transition-colors relative"><Bell size={20} /><div className="absolute -top-1 -right-1 w-2 h-2 bg-pilot-orange rounded-full border-2 border-deepnavy" /></button>
      </div>
    </header>
  );
};

// --- RecurringTasksPage ---
const RecurringTasksPage = ({ recurringTasks, onToggle }: { recurringTasks: RecurringTask[], onToggle: (id: string) => void }) => (
  <div className="animate-in fade-in duration-500 pb-12 space-y-10">
    <div className="flex items-center justify-between px-2">
      <div><h3 className="text-3xl font-black text-white tracking-tighter uppercase">Consistent Habits</h3><p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-2">Automated progress trackers</p></div>
      <button className={`${THEME.buttonPrimary} px-6 py-3 text-xs font-black uppercase tracking-widest shadow-lg shadow-pilot-orange/20 flex items-center gap-2`}><PlusCircle size={16} /> New Habit</button>
    </div>
    <div className={THEME.card + " overflow-x-auto no-scrollbar"}>
      <table className="w-full text-left min-w-[600px]">
        <thead><tr className="border-b border-white/5"><th className="pb-4 text-[10px] font-black text-white/20 uppercase tracking-widest">Habit Name</th><th className="pb-4 text-[10px] font-black text-white/20 uppercase tracking-widest">Cycle</th><th className="pb-4 text-[10px] font-black text-white/20 uppercase tracking-widest">Status</th><th className="pb-4 text-[10px] font-black text-white/20 uppercase tracking-widest text-right">Actions</th></tr></thead>
        <tbody className="divide-y divide-white/5">
          {recurringTasks.map((rt) => (
            <tr key={rt.id} className="group hover:bg-white/[0.01]">
              <td className="py-5"><p className="text-sm font-bold text-white/80 uppercase">{rt.task}</p><p className="text-[9px] text-white/20 mt-1 uppercase">Last Checked: {rt.last}</p></td>
              <td className="py-5"><span className="text-[10px] font-black text-white/40 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">{rt.interval}</span></td>
              <td className="py-5"><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${rt.status === 'Completed' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-pilot-orange animate-pulse'}`} /><span className={`text-[10px] font-black uppercase tracking-widest ${rt.status === 'Completed' ? 'text-green-500' : 'text-pilot-orange'}`}>{rt.status}</span></div></td>
              <td className="py-5 text-right"><button onClick={() => onToggle(rt.id)} className="text-[10px] font-black text-white/20 hover:text-white uppercase tracking-widest transition-all">{rt.status === 'Completed' ? 'Reset' : 'Complete'}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// --- WeeklyPlannerPage ---
const WeeklyPlannerPage = ({ tasks }: { tasks: Task[] }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-10">
      <div className="flex items-center justify-between px-2">
        <div><h3 className="text-3xl font-black text-white tracking-tighter uppercase">Weekly Planner</h3><p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-2">Map out the week ahead</p></div>
        <div className="flex gap-2"><button className={`${THEME.buttonSecondary} p-3 rounded-lg text-white/40 hover:text-white`}><ChevronLeft size={20}/></button><button className={`${THEME.buttonSecondary} p-3 rounded-lg text-white/40 hover:text-white`}><ChevronRight size={20}/></button></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {days.map((day, idx) => {
          const d = new Date(); d.setDate(d.getDate() + idx);
          const dateStr = d.toISOString().split('T')[0];
          const dayTasks = tasks.filter(t => t.dueDate === dateStr || (idx === 0 && !t.dueDate));
          return (
            <div key={day} className="flex flex-col h-[500px]">
              <div className="p-4 bg-white/[0.02] border-t border-x border-white/5 rounded-t-xl text-center"><span className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-1">{day}</span><span className="text-xl font-black text-white">{d.getDate()}</span></div>
              <div className="flex-1 bg-prussianblue/40 border-x border-b border-white/5 rounded-b-xl p-3 space-y-3 overflow-y-auto no-scrollbar shadow-inner">
                {dayTasks.map(t => (
                  <div key={t.id} className={`p-3 rounded-lg border text-left transition-all ${t.isCompleted ? 'bg-white/[0.01] border-white/5 opacity-30' : 'bg-white/[0.03] border-white/10 hover:border-pilot-orange/30 shadow-sm'}`}><span className={`text-[10px] font-bold leading-tight uppercase ${t.isCompleted ? 'line-through' : 'text-white/70'}`}>{t.title}</span><div className="mt-2 flex gap-1"><div className={`w-1 h-1 rounded-full ${t.energyRequired === 'High' ? 'bg-pilot-orange' : t.energyRequired === 'Medium' ? 'bg-blue-500' : 'bg-green-500'}`} /></div></div>
                ))}
                {dayTasks.length === 0 && <div className="h-full flex flex-col items-center justify-center opacity-5"><ListTodo size={24} /><span className="text-[8px] font-black uppercase tracking-widest mt-2">Open</span></div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- ReportsPage ---
const ReportsPage = ({ reports }: { reports: DailyReport[] }) => {
  const momentumData = reports.map(r => ({ date: r.date.split('-')[2], score: r.momentumScore }));
  const completionByEnergy = [{ name: 'High', count: reports.filter(r => r.energyLevel === 'High').length },{ name: 'Med', count: reports.filter(r => r.energyLevel === 'Medium').length },{ name: 'Low', count: reports.filter(r => r.energyLevel === 'Low').length }];
  const COLORS = ['#F37324', '#3B82F6', '#10B981'];
  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-10">
      <div className="flex items-center justify-between px-2"><div><h3 className="text-3xl font-black text-white tracking-tighter uppercase">Insights</h3><p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-2">Productivity analytics</p></div><button className={`${THEME.buttonSecondary} px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2`}><RefreshCw size={16} /> Refresh</button></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={THEME.card}><h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-10 flex items-center gap-2"><TrendingUp size={16} className="text-pilot-orange" /> Momentum Trend</h4><div className="h-[250px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={momentumData}><CartesianGrid vertical={false} stroke="#ffffff05" /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#ffffff22', fontSize: 10, fontWeight: 900}} /><YAxis hide domain={[0, 100]} /><Tooltip contentStyle={{backgroundColor: '#11122C', border: 'none', borderRadius: '12px', fontSize: '10px'}} /><Line type="monotone" dataKey="score" stroke="#F37324" strokeWidth={4} dot={{fill: '#F37324', strokeWidth: 2, r: 4}} activeDot={{r: 8}} /></LineChart></ResponsiveContainer></div></div>
        <div className={THEME.card}><h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-10 flex items-center gap-2"><PieChartIcon size={16} className="text-pilot-orange" /> Energy Profile</h4><div className="h-[250px] w-full flex items-center justify-center"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={completionByEnergy} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="count" stroke="none">{completionByEnergy.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></div>
      </div>
    </div>
  );
};

// --- CalendarPage ---
const CalendarPage = ({ events }: { events: CalendarEvent[] }) => {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-10">
      <div className="flex items-center justify-between px-2"><div><h3 className="text-3xl font-black text-white tracking-tighter uppercase">Calendar</h3><p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-2">Temporal view of commitments</p></div><button className={`${THEME.buttonPrimary} px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2`}><Plus size={16} /> Add Event</button></div>
      <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-xl overflow-hidden shadow-2xl">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (<div key={d} className="bg-deepnavy p-4 text-center border-b border-white/5"><span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{d}</span></div>))}
        {days.map(day => {
          const dayEvents = events.filter(e => e.day === day);
          return (
            <div key={day} className={`bg-prussianblue min-h-[140px] p-3 group hover:bg-white/[0.02] transition-colors relative border-r border-b border-white/5`}>
              <span className={`text-xs font-black text-white/20 group-hover:text-pilot-orange`}>{day}</span>
              <div className="mt-2 space-y-1">{dayEvents.map(ev => (<div key={ev.id} className="p-1.5 bg-pilot-orange/10 border-l-2 border-pilot-orange rounded text-[8px] font-bold text-white/70 truncate uppercase">{ev.title}</div>))}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- ProjectsPage ---
const ProjectsPage = ({ state, toggleTask, updateTask }: { state: AppState, toggleTask: any, updateTask: any }) => {
  const { projectId } = useParams();
  const activeProject = state.projects.find(p => p.id === projectId) || state.projects[0];
  const projectTasks = state.tasks.filter(t => t.projectId === activeProject?.id);
  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-10">
      <div className="flex items-center justify-between px-2"><div><h3 className="text-3xl font-black text-white tracking-tighter uppercase">Projects</h3><p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-2">Focused areas of work</p></div></div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-2">{state.projects.map(p => (<Link key={p.id} to={`/projects/${p.id}`} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${activeProject?.id === p.id ? 'bg-pilot-orange border-pilot-orange text-white' : 'bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/5'}`}><span className="text-sm font-bold uppercase">{p.name}</span><ChevronRight size={14} className="opacity-30" /></Link>))}</div>
        <div className="lg:col-span-3"><div className={THEME.card}><h4 className={THEME.label}>Tasks in {activeProject?.name}</h4><div className="space-y-4 mt-6">{projectTasks.map(t => <TaskItem key={t.id} task={t} projects={state.projects} toggleTask={toggleTask} updateTask={updateTask} onFocus={() => {}} isFocusing={false} />)}</div></div></div>
      </div>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<AppState>({
    tasks: [],
    projects: [],
    calendarEvents: [],
    recurringTasks: [],
    energyLevel: 'Medium',
    dailyReports: [],
    currentStreak: 0,
    user: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
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
      } catch (error) { console.error("Failed to fetch mock data:", error); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleLogin = (user: User) => setState(prev => ({ ...prev, user }));
  const handleLogout = () => setState(prev => ({ ...prev, user: null }));
  const handleUpdateUser = (updates: Partial<User>) => setState(prev => ({ ...prev, user: prev.user ? { ...prev.user, ...updates } : null }));

  if (loading) {
    return (
      <div className="min-h-screen bg-deepnavy flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-6">
          <div className="relative"><Loader2 className="w-16 h-16 text-pilot-orange animate-spin" /><Zap className="w-6 h-6 text-pilot-orange absolute inset-0 m-auto animate-pulse" fill="currentColor" /></div>
          <p className="text-[12px] font-black uppercase tracking-[0.6em] text-white animate-pulse">Launching Pace Pilot</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-deepnavy flex text-white font-sans selection:bg-pilot-orange/30 overflow-hidden">
        {state.user && <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} user={state.user} />}
        <main className={`flex-1 transition-all duration-300 ease-in-out flex flex-col h-screen overflow-hidden relative ${state.user ? 'lg:ml-72 p-6 lg:p-12' : ''}`}>
          {state.user && <TopBar toggleSidebar={() => setIsSidebarOpen(true)} />}
          <div className="flex-1 overflow-y-auto custom-scrollbar no-scrollbar pr-2">
            <Routes>
              <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
              <Route path="/signup" element={<SignupPage onSignup={handleLogin} />} />
              <Route path="/" element={<ProtectedRoute user={state.user}><WorkdayPage state={state} setState={setState} toggleTask={(id) => setState(p => ({...p, tasks: p.tasks.map(t => t.id === id ? {...t, isCompleted: !t.isCompleted} : t)}))} updateTask={(id, u) => setState(p => ({...p, tasks: p.tasks.map(t => t.id === id ? {...t, ...u} : t)}))} setEnergy={(l) => setState(p => ({...p, energyLevel: l}))} /></ProtectedRoute>} />
              <Route path="/planner" element={<ProtectedRoute user={state.user}><WeeklyPlannerPage tasks={state.tasks} /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute user={state.user}><ProjectsPage state={state} toggleTask={(id) => {}} updateTask={(id, u) => {}} /></ProtectedRoute>} />
              <Route path="/projects/:projectId" element={<ProtectedRoute user={state.user}><ProjectsPage state={state} toggleTask={(id) => {}} updateTask={(id, u) => {}} /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute user={state.user}><CalendarPage events={state.calendarEvents} /></ProtectedRoute>} />
              <Route path="/recurring" element={<ProtectedRoute user={state.user}><RecurringTasksPage recurringTasks={state.recurringTasks} onToggle={(id) => setState(p => ({...p, recurringTasks: p.recurringTasks.map(rt => rt.id === id ? {...rt, status: rt.status === 'Completed' ? 'Pending' : 'Completed'} : rt)}))} /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute user={state.user}><ReportsPage reports={state.dailyReports} /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute user={state.user}><ProfilePage user={state.user!} onLogout={handleLogout} onUpdate={handleUpdateUser} /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
      <style>{`
        @keyframes success-pop { 0% { transform: scale(1); } 50% { transform: scale(1.3); filter: brightness(1.5); } 100% { transform: scale(1); } }
        .animate-success-pop { animation: success-pop 0.4s ease-out; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
      `}</style>
    </HashRouter>
  );
}
