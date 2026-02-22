import React, { useState, useMemo } from 'react';
import {
  Plus,
  Activity,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { generateDailyReport } from '@/services/geminiService';
import { PomodoroTimer } from '@/components/timer/PomodoroTimer';
import { WhiteNoisePlayer } from '@/components/audio/WhiteNoisePlayer';
import { TaskItem } from '@/components/tasks/TaskItem';
import { Modal } from '@/components/ui/Modal';
import { ENERGY_LEVELS, THEME } from '@/constants';
import { EnergyLevel, Task } from '@/types';

/**
 * Main workday dashboard: Pomodoro timer, energy vibe selector, task list,
 * area progress sidebar, and end-of-day AI report generation.
 */
export const WorkdayPage: React.FC = () => {
  const {
    tasks,
    projects,
    energyLevel,
    setEnergy,
    addTask,
    addToast,
  } = useAppStore();

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportResult, setReportResult] = useState<string | null>(null);
  const [energyFilter, setEnergyFilter] = useState<EnergyLevel | 'All'>('All');

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeTaskId) ?? null,
    [tasks, activeTaskId]
  );

  /** Tasks created or due today */
  const dailyTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(
      (t) =>
        t.createdAt.startsWith(today) ||
        (t.dueDate && t.dueDate.startsWith(today))
    );
  }, [tasks]);

  /** Incomplete tasks, optionally filtered by energy requirement */
  const filteredTasks = useMemo(() => {
    const incomplete = tasks.filter((t) => !t.isCompleted);
    return energyFilter === 'All'
      ? incomplete
      : incomplete.filter((t) => t.energyRequired === energyFilter);
  }, [tasks, energyFilter]);

  const progress = useMemo(() => {
    if (dailyTasks.length === 0) return 0;
    const completed = dailyTasks.filter((t) => t.isCompleted).length;
    return Math.round((completed / dailyTasks.length) * 100);
  }, [dailyTasks]);

  const handleEndDay = async () => {
    setIsGeneratingReport(true);
    try {
      const completedToday = tasks.filter((t) => t.isCompleted);
      const report = await generateDailyReport(
        completedToday,
        'Focus was solid today.',
        energyLevel ?? 'Medium'
      );
      setReportResult(report);
    } catch {
      addToast('error', 'Failed to generate AI report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = fd.get('title') as string;
    if (!title.trim()) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      energyRequired: (fd.get('energy') as EnergyLevel) || 'Medium',
      isCompleted: false,
      createdAt: new Date().toISOString(),
      projectId: (fd.get('project') as string) || undefined,
    };

    addTask(newTask);
    setIsAddingTask(false);
    addToast('success', `"${newTask.title}" added to your list.`);
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-8 h-full overflow-y-auto custom-scrollbar no-scrollbar">
      {/* Top row: Pomodoro + Vibe card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <PomodoroTimer
            activeTask={activeTask}
            onSessionComplete={() =>
              addToast('success', "Pomodoro complete! Time for a break. ☕")
            }
          />
        </div>

        <div className={`${THEME.card} lg:col-span-5 space-y-8 flex flex-col h-full`}>
          {/* Energy selector */}
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-widest mb-4">
              Daily Vibe
            </h3>
            <p className={THEME.label}>How's your energy right now?</p>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {ENERGY_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setEnergy(level)}
                  className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                    energyLevel === level
                      ? 'bg-pilot-orange/10 border-pilot-orange/30 text-pilot-orange'
                      : 'bg-white/[0.02] border-white/5 text-white/20 hover:bg-white/5'
                  }`}
                >
                  <Zap
                    size={14}
                    fill={energyLevel === level ? 'currentColor' : 'none'}
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {level}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Acoustic Shield — procedural ambient noise */}
          <div className="pt-8 border-t border-white/5 flex-1">
            <span className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 px-1">
              Acoustic Shield
            </span>
            <WhiteNoisePlayer />
          </div>
        </div>
      </div>

      {/* Task list card */}
      <div className={THEME.card}>
        {/* Progress bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">
              Daily Momentum
            </h3>
            <span className="text-xs font-black text-pilot-orange tracking-widest">
              {progress}% Done
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner"
          >
            <div
              className="h-full bg-pilot-orange shadow-[0_0_15px_rgba(243,115,36,0.3)] transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Tasks header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <Activity size={24} className="text-pilot-orange" />
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-widest">
                Tasks for Today
              </h3>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mt-1">
                {filteredTasks.length} pending items
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/5 p-1 rounded-lg border border-white/10 flex items-center">
              <div className="px-4 py-2 border-r border-white/10">
                <select
                  value={energyFilter}
                  onChange={(e) =>
                    setEnergyFilter(e.target.value as EnergyLevel | 'All')
                  }
                  aria-label="Filter tasks by energy level"
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest text-white/60 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Energy</option>
                  {ENERGY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setIsAddingTask(true)}
                aria-label="Add new task"
                className="px-4 py-2 text-pilot-orange hover:text-white transition-all flex items-center gap-2"
              >
                <Plus size={14} />
              </button>
            </div>

            <button
              onClick={handleEndDay}
              disabled={isGeneratingReport}
              className={`${THEME.buttonPrimary} px-8 py-2.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-pilot-orange/10 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isGeneratingReport ? 'Generating…' : 'End Day'}
            </button>
          </div>
        </div>

        {/* Task list + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-20 bg-white/[0.01] rounded-xl border border-dashed border-white/10">
                <CheckCircle2 size={40} className="mx-auto mb-4 text-white/5" />
                <p className="text-sm font-black text-white/20 uppercase tracking-widest">
                  You're all caught up!
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  projects={projects}
                  onFocus={(t) => setActiveTaskId(t.id)}
                  isFocusing={activeTaskId === task.id}
                />
              ))
            )}
          </div>

          {/* Area progress + AI report */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
              <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-6">
                Area Progress
              </h4>
              <div className="space-y-6">
                {projects.map((p) => {
                  const projectTasks = tasks.filter((t) => t.projectId === p.id);
                  const completed = projectTasks.filter((t) => t.isCompleted).length;
                  const prog = projectTasks.length
                    ? Math.round((completed / projectTasks.length) * 100)
                    : 0;

                  return (
                    <div key={p.id}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-white/80 uppercase tracking-tight">
                          {p.name}
                        </span>
                        <span className="text-[10px] font-black text-white/20">
                          {prog}%
                        </span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-pilot-orange"
                          style={{ width: `${prog}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI end-of-day insight */}
            {reportResult && (
              <div className="bg-pilot-orange/5 border border-pilot-orange/20 rounded-xl p-6 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={18} className="text-pilot-orange" />
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">
                    End Day Insight
                  </h4>
                </div>
                <p className="text-xs text-white/60 leading-relaxed italic">
                  "{reportResult}"
                </p>
                <button
                  onClick={() => setReportResult(null)}
                  className="mt-4 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-all underline"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Task modal */}
      <Modal
        isOpen={isAddingTask}
        onClose={() => setIsAddingTask(false)}
        title="New Task"
      >
        <form className="space-y-6" onSubmit={handleAddTask}>
          <div className="space-y-2">
            <label className={THEME.label} htmlFor="task-title">
              Task Name
            </label>
            <input
              id="task-title"
              name="title"
              required
              placeholder="What needs doing?"
              className={`${THEME.input} w-full`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={THEME.label} htmlFor="task-energy">
                Energy Band
              </label>
              <select
                id="task-energy"
                name="energy"
                defaultValue="Medium"
                className={`${THEME.input} w-full`}
              >
                {ENERGY_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className={THEME.label} htmlFor="task-project">
                Project
              </label>
              <select
                id="task-project"
                name="project"
                className={`${THEME.input} w-full`}
              >
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className={`${THEME.buttonPrimary} w-full py-4 text-xs font-black uppercase tracking-widest shadow-lg shadow-pilot-orange/20`}
          >
            Add Task
          </button>
        </form>
      </Modal>
    </div>
  );
};
