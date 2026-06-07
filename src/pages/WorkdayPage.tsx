import React, { useState, useMemo } from 'react';
import {
  Plus, CheckCircle2, Sparkles, Clock, CalendarDays,
  AlertTriangle, ListTodo, CalendarClock,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { generateDailyReport } from '@/services/geminiService';
import { FlowTimer } from '@/components/timer/FlowTimer';
import { AmbiancePlayer } from '@/components/audio/AmbiancePlayer';
import { TaskItem } from '@/components/tasks/TaskItem';
import { AddTaskModal } from '@/components/tasks/AddTaskModal';
import { ZONES, ZONE_KEYS, THEME } from '@/constants';
import { TaskZone } from '@/types';
import { detectActiveZone } from '@/lib/zoneDetection';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0];

/** True if the string is an emoji (not a plain ASCII word like "User") */
function isEmoji(s?: string): boolean {
  if (!s) return false;
  return /\p{Emoji}/u.test(s) && !/^[A-Za-z]+$/.test(s.trim());
}

function isOverdue(dueDate?: string) {
  return dueDate && dueDate < TODAY;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const WorkdayPage: React.FC = () => {
  const { tasks, projects, calendarEvents, addToast } = useAppStore();

  // ── Zone state — auto-detected but manually overridable ───────────────────
  const autoZone = useMemo(detectActiveZone, []);
  const [currentZone, setCurrentZone] = useState<TaskZone>(autoZone);
  const [zoneManual, setZoneManual] = useState(false);

  const handleZoneClick = (z: TaskZone) => {
    setCurrentZone(z);
    setZoneManual(z !== autoZone);
  };

  const [zoneFilter, setZoneFilter] = useState<TaskZone | 'All'>(autoZone);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportResult, setReportResult] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeTaskId) ?? null,
    [tasks, activeTaskId],
  );

  // ── Agenda: overdue, today-pending, upcoming events ───────────────────────

  const overdueTasks = useMemo(
    () => tasks.filter((t) => !t.isCompleted && isOverdue(t.dueDate)),
    [tasks],
  );

  const todayPendingTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          !t.isCompleted &&
          !isOverdue(t.dueDate) &&
          (t.dueDate === TODAY ||
            t.createdAt.startsWith(TODAY) ||
            (!t.dueDate && t.zone === currentZone)),
      ),
    [tasks, currentZone],
  );

  const upNext = useMemo(() => {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    // Events today + next 2 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 3);
    const cutoffIso = cutoff.toISOString().split('T')[0];

    return calendarEvents
      .filter((e) => e.eventDate >= TODAY && e.eventDate <= cutoffIso)
      .map((e) => {
        const [h, m] = (e.time || '00:00').split(':').map(Number);
        const totalMins = h * 60 + m;
        const isToday = e.eventDate === TODAY;
        const isPast = isToday && totalMins < nowMinutes - 15;
        return { ...e, totalMins, isToday, isPast };
      })
      .filter((e) => !e.isPast)
      .sort((a, b) => {
        if (a.eventDate !== b.eventDate) return a.eventDate < b.eventDate ? -1 : 1;
        return a.totalMins - b.totalMins;
      });
  }, [calendarEvents]);

  // ── Zone-filtered task feed ───────────────────────────────────────────────

  const filteredTasks = useMemo(() => {
    const incomplete = tasks.filter((t) => !t.isCompleted);
    return zoneFilter === 'All' ? incomplete : incomplete.filter((t) => t.zone === zoneFilter);
  }, [tasks, zoneFilter]);

  // ── Daily progress ────────────────────────────────────────────────────────

  const dailyTasks = useMemo(() => {
    return tasks.filter(
      (t) => t.createdAt.startsWith(TODAY) || (t.dueDate && t.dueDate.startsWith(TODAY)),
    );
  }, [tasks]);

  const progress = useMemo(() => {
    if (!dailyTasks.length) return 0;
    return Math.round(
      (dailyTasks.filter((t) => t.isCompleted).length / dailyTasks.length) * 100,
    );
  }, [dailyTasks]);

  const handleEndSession = (elapsed: number) => {
    const mins = Math.round(elapsed / 60);
    if (mins > 0) {
      addToast('success', `Session logged — ${mins}m in ${ZONES[currentZone].label}.`);
    }
  };

  const handleEndDay = async () => {
    setIsGeneratingReport(true);
    try {
      const report = await generateDailyReport(
        tasks.filter((t) => t.isCompleted),
        'Focus was solid today.',
      );
      setReportResult(report);
    } catch {
      addToast('error', 'Failed to generate AI report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const zoneMeta = ZONES[currentZone];

  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-6 h-full overflow-y-auto custom-scrollbar no-scrollbar">

      {/* ── Active Zone Banner ─────────────────────────────────────────── */}
      <div
        className={`rounded-xl px-6 py-4 border ${zoneMeta.border} ${zoneMeta.chipBg} flex items-center justify-between`}
      >
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${zoneMeta.bg} shadow-[0_0_8px_currentColor]`} />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
                Active Zone
              </p>
              {zoneManual && (
                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/10 text-white/30">
                  MANUAL
                </span>
              )}
              {!zoneManual && (
                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/5 text-white/20">
                  AUTO
                </span>
              )}
            </div>
            <p className={`text-sm font-black uppercase tracking-widest ${zoneMeta.text}`}>
              {zoneMeta.label} — {zoneMeta.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-white/20">
            <Clock size={12} />
            <span className="text-[10px] font-bold tabular-nums">{zoneMeta.hours}</span>
          </div>

          {/* Zone dot switcher — click to switch active zone */}
          <div className="hidden md:flex items-center gap-2">
            {ZONE_KEYS.map((z) => (
              <button
                key={z}
                onClick={() => handleZoneClick(z)}
                title={`Switch to ${ZONES[z].label}`}
                className={`transition-all ${
                  currentZone === z
                    ? `w-4 h-4 rounded-full ${ZONES[z].bg} ring-2 ring-white/30 ring-offset-1 ring-offset-transparent scale-110`
                    : `w-2.5 h-2.5 rounded-full ${ZONES[z].bg} opacity-40 hover:opacity-80 hover:scale-110`
                }`}
              />
            ))}
            {zoneManual && (
              <button
                onClick={() => { setCurrentZone(autoZone); setZoneManual(false); setZoneFilter(autoZone); }}
                className="text-[8px] font-black uppercase tracking-widest text-white/20 hover:text-pilot-orange transition-colors ml-1"
                title="Reset to auto-detected zone"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Flow Timer + Acoustic Shield ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <FlowTimer
            activeTask={activeTask}
            currentZone={currentZone}
            onEnd={handleEndSession}
          />
        </div>

        <div className={`${THEME.card} lg:col-span-5 flex flex-col gap-0`}>
          {/* Acoustic Shield */}
          <div className="pb-5 border-b border-white/5">
            <span className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">
              Acoustic Shield
            </span>
            <AmbiancePlayer />
          </div>

          {/* Up Next — upcoming events strip */}
          <div className="pt-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays size={14} className="text-white/30" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Up Next</span>
            </div>
            {upNext.length === 0 ? (
              <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
                No upcoming events
              </p>
            ) : (
              <div className="space-y-1.5">
                {upNext.slice(0, 3).map((ev) => {
                  const isToday = ev.eventDate === TODAY;
                  return (
                    <div
                      key={ev.id}
                      className="flex items-center gap-3 bg-white/[0.02] rounded-lg px-3 py-2.5 border border-white/5"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: ev.color || '#f37324' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-white/70 truncate">{ev.title}</p>
                        {!isToday && (
                          <p className="text-[9px] text-white/20 uppercase tracking-widest">
                            {new Date(ev.eventDate + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </div>
                      <span className="text-[9px] font-black text-white/20 tabular-nums shrink-0">
                        {ev.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Overdue alert ─────────────────────────────────────────────── */}
      {overdueTasks.length > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-red-400 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
              {overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-2">
            {overdueTasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2.5"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${ZONES[task.zone]?.bg ?? 'bg-white/20'} shrink-0`} />
                <span className="text-xs font-bold text-white/60 flex-1 truncate">{task.title}</span>
                <span className="text-[9px] text-red-400/60 font-black uppercase tracking-widest shrink-0">
                  Due {task.dueDate}
                </span>
              </div>
            ))}
            {overdueTasks.length > 5 && (
              <p className="text-[9px] text-white/20 uppercase tracking-widest text-center">
                +{overdueTasks.length - 5} more
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Today's Agenda ────────────────────────────────────────────── */}
      {todayPendingTasks.length > 0 && (
        <div className={THEME.card}>
          <div className="flex items-center gap-2 mb-5">
            <ListTodo size={16} className="text-pilot-orange" />
            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">
              Today's Agenda
            </h4>
            <span className="text-[9px] text-white/20 font-bold ml-auto">
              {todayPendingTasks.filter((t) => t.isCompleted).length}/{todayPendingTasks.length} done
            </span>
          </div>
          <div className="space-y-2">
            {todayPendingTasks.slice(0, 8).map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${ZONES[task.zone]?.bg ?? 'bg-white/20'}`} />
                <span className="flex-1 text-sm font-bold text-white/70 truncate">{task.title}</span>
                {task.dueDate && (
                  <span className="text-[9px] font-black text-white/20 shrink-0 uppercase tracking-widest">
                    <CalendarClock size={10} className="inline mr-1" />{task.dueDate}
                  </span>
                )}
                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${ZONES[task.zone]?.chipBg ?? 'bg-white/5'} ${ZONES[task.zone]?.text ?? 'text-white/30'}`}>
                  {ZONES[task.zone]?.description ?? task.zone}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Zone Task Feed ────────────────────────────────────────────── */}
      <div className={THEME.card}>
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Daily Momentum</span>
            <span className="text-[10px] font-black text-pilot-orange">{progress}% Done</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-pilot-orange shadow-[0_0_12px_rgba(243,115,36,0.4)] transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-widest">Tasks</h3>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mt-1">
              {zoneFilter === 'All' ? 'All zones' : ZONES[zoneFilter].label} · {filteredTasks.length} pending
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value as TaskZone | 'All')}
                className="bg-transparent text-[10px] font-black uppercase tracking-widest text-white/60 focus:outline-none cursor-pointer"
              >
                <option value="All">All Zones</option>
                {ZONE_KEYS.map((z) => (
                  <option key={z} value={z}>{ZONES[z].label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsAddingTask(true)}
              className={`${THEME.buttonPrimary} px-4 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2`}
            >
              <Plus size={14} /> Add Task
            </button>

            <button
              onClick={handleEndDay}
              disabled={isGeneratingReport}
              className={`${THEME.buttonSecondary} px-5 py-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-50`}
            >
              {isGeneratingReport ? 'Generating…' : 'End Day'}
            </button>
          </div>
        </div>

        {/* Task list + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-16 rounded-xl border border-dashed border-white/10">
                <CheckCircle2 size={32} className="mx-auto mb-3 text-white/5" />
                <p className="text-xs font-black text-white/20 uppercase tracking-widest">
                  {zoneFilter === 'All' ? "You're all caught up!" : `No ${ZONES[zoneFilter as TaskZone].label} tasks`}
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
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
              <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-5">
                Area Progress
              </h4>
              <div className="space-y-5">
                {projects.map((p) => {
                  const pt = tasks.filter((t) => t.projectId === p.id);
                  const prog = pt.length
                    ? Math.round((pt.filter((t) => t.isCompleted).length / pt.length) * 100)
                    : 0;
                  return (
                    <div key={p.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          {isEmoji(p.icon) && <span>{p.icon}</span>}
                          <span className="text-[10px] font-black text-white/70 uppercase tracking-tight">
                            {p.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-black text-white/20">{prog}%</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-pilot-orange transition-all duration-700"
                          style={{ width: `${prog}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {reportResult && (
              <div className="bg-pilot-orange/5 border border-pilot-orange/20 rounded-xl p-5 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-pilot-orange" />
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest">
                    End Day Insight
                  </h4>
                </div>
                <p className="text-xs text-white/50 leading-relaxed italic">"{reportResult}"</p>
                <button
                  onClick={() => setReportResult(null)}
                  className="mt-3 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-all underline"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddTaskModal
        isOpen={isAddingTask}
        onClose={() => setIsAddingTask(false)}
        defaultZone={currentZone}
      />
    </div>
  );
};
