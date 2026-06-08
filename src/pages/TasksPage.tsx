import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  RefreshCw,
  Link2,
  Link2Off,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Loader,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { AddTaskModal } from '@/components/tasks/AddTaskModal';
import { ZONES, ZONE_KEYS, THEME } from '@/constants';
import type { Task, TaskZone } from '@/types';
import { fetchGoogleTasks } from '@/services/googleTasksService';

// ─── Zone chip ────────────────────────────────────────────────────────────────

const ZoneChip: React.FC<{ zone: TaskZone }> = ({ zone }) => {
  const m = ZONES[zone];
  return (
    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${m.chipBg} ${m.text} border ${m.border}`}>
      {m.description}
    </span>
  );
};

// ─── Single task row ──────────────────────────────────────────────────────────

interface TaskRowProps {
  task: Task;
  projects: { id: string; name: string; icon: string; color: string }[];
  onToggle: () => void;
  onAssign: (projectId: string) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, projects, onToggle, onAssign }) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const { updateTask, deleteTask, addToast } = useAppStore();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTask(task.id);
    addToast('info', `"${task.title}" removed.`);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const updates: Partial<Task> = {
      title: (fd.get('title') as string).trim(),
      description: (fd.get('description') as string).trim() || undefined,
      zone: fd.get('zone') as TaskZone,
      dueDate: (fd.get('dueDate') as string) || undefined,
      projectId: (fd.get('projectId') as string) || undefined,
    };
    if (!updates.title) return;
    await updateTask(task.id, updates);
    addToast('success', 'Task updated.');
    setEditing(false);
  };

  return (
    <div className={`rounded-xl border transition-all ${
      task.isCompleted
        ? 'bg-white/[0.01] border-white/5 opacity-50'
        : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
    }`}>
      {/* Main row */}
      <div
        className="group flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => { if (!editing) setExpanded((p) => !p); }}
      >
        {/* Completion toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          aria-label={task.isCompleted ? 'Mark incomplete' : 'Mark complete'}
          className="shrink-0 transition-colors text-white/20 hover:text-pilot-orange"
        >
          {task.isCompleted
            ? <CheckCircle2 size={18} className="text-green-500" />
            : <Circle size={18} />}
        </button>

        {/* Title */}
        <span className={`flex-1 text-sm font-bold truncate ${
          task.isCompleted ? 'line-through text-white/20' : 'text-white/80'
        }`}>
          {task.title}
        </span>

        {/* Zone chip */}
        {task.zone && <ZoneChip zone={task.zone} />}

        {/* Due date */}
        {task.dueDate && (
          <span className="text-[9px] font-bold text-white/30 hidden sm:block">
            {new Date(task.dueDate + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}

        {/* Sync indicator */}
        {task.googleTaskId
          ? <Link2 size={12} className="text-green-400/50 shrink-0" title="Synced with Google Tasks" />
          : <Link2Off size={12} className="text-white/10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        }

        {/* Edit / expand caret */}
        <span className="text-white/20 group-hover:text-white/40 transition-colors shrink-0">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div
          className="px-4 pb-4 border-t border-white/5 animate-in slide-in-from-top-1 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {editing ? (
            <form onSubmit={handleSave} className="space-y-3 pt-3">
              <div className="space-y-1">
                <label className={THEME.label}>Title</label>
                <input name="title" type="text" required defaultValue={task.title} autoFocus className={`${THEME.input} w-full`} />
              </div>
              <div className="space-y-1">
                <label className={THEME.label}>Details <span className="text-white/20">(optional)</span></label>
                <textarea name="description" rows={2} defaultValue={task.description ?? ''} placeholder="Notes…" className={`${THEME.input} w-full resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={THEME.label}>Zone</label>
                  <select name="zone" defaultValue={task.zone} className={`${THEME.input} w-full`}>
                    {ZONE_KEYS.map((z) => (
                      <option key={z} value={z}>{ZONES[z].label} — {ZONES[z].description}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={THEME.label}>Due Date</label>
                  <input name="dueDate" type="date" defaultValue={task.dueDate ?? ''} className={`${THEME.input} w-full`} />
                </div>
              </div>
              <div className="space-y-1">
                <label className={THEME.label}>Project</label>
                <select name="projectId" defaultValue={task.projectId ?? ''} className={`${THEME.input} w-full`}>
                  <option value="">No project</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className={`${THEME.buttonPrimary} px-5 py-2 text-[9px] font-black uppercase tracking-widest`}>Save</button>
                <button type="button" onClick={() => setEditing(false)} className={`${THEME.buttonSecondary} px-4 py-2 text-[9px] font-black uppercase tracking-widest`}>Cancel</button>
              </div>
            </form>
          ) : (
            <div className="pt-3 space-y-2">
              {task.description && (
                <p className="text-xs text-white/40 leading-relaxed">{task.description}</p>
              )}
              {task.dueDate && (
                <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">
                  Due: {new Date(task.dueDate + 'T12:00:00').toLocaleDateString()}
                </p>
              )}
              {!task.description && !task.dueDate && (
                <p className="text-[9px] text-white/20 italic">No details yet</p>
              )}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-white/50 hover:text-white"
                >
                  <Pencil size={11} /> Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-all text-red-400"
                >
                  <Trash2 size={11} /> Delete
                </button>
                {!task.projectId && (
                  <div className="relative ml-auto">
                    <select
                      onChange={(e) => { if (e.target.value) { onAssign(e.target.value); setExpanded(false); } }}
                      defaultValue=""
                      className={`${THEME.input} text-[9px] py-1.5 px-3 font-black uppercase tracking-widest`}
                    >
                      <option value="" disabled>Assign to project →</option>
                      {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                )}
                <button
                  onClick={() => setExpanded(false)}
                  className="ml-auto text-white/20 hover:text-white/50 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Project group ────────────────────────────────────────────────────────────

interface ProjectGroupProps {
  title: string;
  icon?: string;
  color?: string;
  tasks: Task[];
  projects: { id: string; name: string; icon: string; color: string }[];
  projectId?: string;
  onToggle: (id: string) => void;
  onAssign: (taskId: string, projectId: string) => void;
  onAddTask: () => void;
}

const ProjectGroup: React.FC<ProjectGroupProps> = ({
  title, icon, color, tasks, projects, onToggle, onAssign, onAddTask,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const done = tasks.filter((t) => t.isCompleted).length;
  const total = tasks.length;

  return (
    <div className="space-y-2">
      {/* Group header */}
      <button
        onClick={() => setCollapsed((p) => !p)}
        className="w-full flex items-center gap-3 px-2 py-1 group"
      >
        <span className="text-white/20 transition-transform" style={{ transform: collapsed ? 'rotate(0deg)' : undefined }}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </span>
        {icon && /\p{Emoji}/u.test(icon) && !/^[A-Za-z]+$/.test(icon.trim()) && (
          <span className="text-base leading-none">{icon}</span>
        )}
        {color && !icon && (
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        )}
        <span className="text-xs font-black text-white/60 uppercase tracking-widest group-hover:text-white transition-colors">
          {title}
        </span>
        <span className="text-[9px] font-bold text-white/20 ml-auto">
          {done}/{total}
        </span>
        {total > 0 && (
          <div className="w-16 h-0.5 bg-white/5 rounded-full overflow-hidden ml-2">
            <div
              className="h-full bg-pilot-orange rounded-full transition-all"
              style={{ width: `${total ? (done / total) * 100 : 0}%` }}
            />
          </div>
        )}
      </button>

      {/* Tasks */}
      {!collapsed && (
        <div className="space-y-1.5 pl-5">
          {tasks.length === 0 ? (
            <div
              onClick={onAddTask}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/5 text-white/20 hover:text-pilot-orange hover:border-pilot-orange/20 hover:bg-pilot-orange/5 cursor-pointer transition-all"
            >
              <Plus size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">Add first task</span>
            </div>
          ) : (
            <>
              {tasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  projects={projects}
                  onToggle={() => onToggle(t.id)}
                  onAssign={(pid) => onAssign(t.id, pid)}
                />
              ))}
              <button
                onClick={onAddTask}
                className="flex items-center gap-2 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-pilot-orange transition-colors"
              >
                <Plus size={11} /> Add task
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export const TasksPage: React.FC = () => {
  const {
    tasks, projects, googleAccessToken,
    toggleTask, updateTask, addToast, initializeData,
  } = useAppStore();

  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState<TaskZone | 'All'>('All');
  const [addModal, setAddModal] = useState<{ open: boolean; projectId?: string }>({ open: false });
  const [syncing, setSyncing] = useState(false);

  // ── Filtered task list ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = tasks;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q));
    }
    if (zoneFilter !== 'All') {
      list = list.filter((t) => t.zone === zoneFilter);
    }
    return list;
  }, [tasks, search, zoneFilter]);

  // ── Group by project ───────────────────────────────────────────────────────
  const groups = useMemo(() => {
    const projectGroups = projects.map((p) => ({
      project: p,
      tasks: filtered.filter((t) => t.projectId === p.id),
    }));
    const unassigned = filtered.filter((t) => !t.projectId);
    return { projectGroups, unassigned };
  }, [filtered, projects]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalTasks    = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const syncedTasks   = tasks.filter((t) => t.googleTaskId).length;

  // ── Assign task to project ─────────────────────────────────────────────────
  const handleAssign = async (taskId: string, projectId: string) => {
    await updateTask(taskId, { projectId });
    const p = projects.find((pr) => pr.id === projectId);
    addToast('success', `Task assigned to ${p?.name ?? 'project'}.`);
  };

  // ── Manual Google Tasks sync ───────────────────────────────────────────────
  const handleSync = async () => {
    if (!googleAccessToken) {
      addToast('error', 'No Google connection. Sign in with Google to sync.');
      return;
    }
    setSyncing(true);
    try {
      const googleTasks = await fetchGoogleTasks(googleAccessToken);
      const existingIds = new Set(tasks.map((t) => t.googleTaskId).filter(Boolean));
      const newOnes = googleTasks.filter((gt) => !existingIds.has(gt.googleTaskId));

      if (newOnes.length > 0) {
        const newTasks: Task[] = newOnes.map((gt) => ({
          id: crypto.randomUUID(),
          title: gt.title,
          zone: 'Green' as TaskZone,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          googleTaskId: gt.googleTaskId,
        }));
        initializeData({ tasks: [...tasks, ...newTasks] });
        addToast('success', `Imported ${newTasks.length} new task${newTasks.length > 1 ? 's' : ''} from Google Tasks.`);
      } else {
        addToast('info', 'All Google Tasks already imported — nothing new.');
      }
    } catch {
      addToast('error', 'Google Tasks sync failed. Try reconnecting Google.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 px-2">
        <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">
          {completedTasks}/{totalTasks} complete · {syncedTasks} synced with Google
        </p>
        <div className="flex items-center gap-3">
          {googleAccessToken && (
            <button
              onClick={handleSync}
              disabled={syncing}
              title="Sync from Google Tasks"
              className={`${THEME.buttonSecondary} flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest`}
            >
              {syncing
                ? <Loader size={13} className="animate-spin" />
                : <RefreshCw size={13} />}
              Sync Google
            </button>
          )}
          <button
            onClick={() => setAddModal({ open: true })}
            className={`${THEME.buttonPrimary} flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest`}
          >
            <Plus size={14} /> New Task
          </button>
        </div>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${THEME.input} w-full pl-9 py-2.5 text-sm`}
          />
        </div>

        {/* Zone filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setZoneFilter('All')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
              zoneFilter === 'All'
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-transparent border-white/5 text-white/30 hover:border-white/10 hover:text-white/50'
            }`}
          >
            All
          </button>
          {ZONE_KEYS.map((z) => {
            const m = ZONES[z];
            return (
              <button
                key={z}
                onClick={() => setZoneFilter(z === zoneFilter ? 'All' : z)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                  zoneFilter === z
                    ? `${m.chipBg} ${m.border} ${m.text}`
                    : 'bg-transparent border-white/5 text-white/30 hover:border-white/10'
                }`}
              >
                {m.description}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Task groups ────────────────────────────────────────────────────── */}
      <div className="space-y-8">
        {/* Project groups */}
        {groups.projectGroups.map(({ project, tasks: pts }) => (
          <ProjectGroup
            key={project.id}
            title={project.name}
            icon={project.icon}
            color={project.color}
            tasks={pts}
            projects={projects}
            projectId={project.id}
            onToggle={toggleTask}
            onAssign={handleAssign}
            onAddTask={() => setAddModal({ open: true, projectId: project.id })}
          />
        ))}

        {/* Unassigned group */}
        {(groups.unassigned.length > 0 || projects.length === 0) && (
          <ProjectGroup
            title="Unassigned"
            tasks={groups.unassigned}
            projects={projects}
            onToggle={toggleTask}
            onAssign={handleAssign}
            onAddTask={() => setAddModal({ open: true })}
          />
        )}

        {/* Empty state */}
        {filtered.length === 0 && tasks.length > 0 && (
          <div className="text-center py-16 border border-dashed border-white/5 rounded-xl">
            <p className="text-xs font-black text-white/20 uppercase tracking-widest">
              No tasks match your filter
            </p>
          </div>
        )}
        {tasks.length === 0 && (
          <div className="text-center py-24 border border-dashed border-white/5 rounded-xl">
            <CheckCircle2 size={40} className="mx-auto mb-4 text-white/5" />
            <p className="text-sm font-black text-white/20 uppercase tracking-widest mb-2">
              No tasks yet
            </p>
            <p className="text-xs text-white/10 mb-6">
              Add your first task or sync from Google Tasks
            </p>
            <button
              onClick={() => setAddModal({ open: true })}
              className={`${THEME.buttonPrimary} inline-flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest`}
            >
              <Plus size={14} /> Add Task
            </button>
          </div>
        )}
      </div>

      {/* ── Add Task Modal ──────────────────────────────────────────────────── */}
      <AddTaskModal
        isOpen={addModal.open}
        onClose={() => setAddModal({ open: false })}
        defaultProjectId={addModal.projectId}
      />
    </div>
  );
};
