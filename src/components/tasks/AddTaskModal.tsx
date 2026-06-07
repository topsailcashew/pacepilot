import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { ZONES, ZONE_KEYS, THEME } from '@/constants';
import { useAppStore } from '@/store/appStore';
import type { Task, TaskZone } from '@/types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-select a project */
  defaultProjectId?: string;
  /** Pre-fill due date (ISO string YYYY-MM-DD) */
  defaultDueDate?: string;
  /** Pre-select a zone */
  defaultZone?: TaskZone;
}

/**
 * Shared "Add Task" modal used across Workday, Planner, Projects, and the global TopBar shortcut.
 */
export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  defaultProjectId,
  defaultDueDate,
  defaultZone,
}) => {
  const { projects, addTask, addToast } = useAppStore();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = (fd.get('title') as string).trim();
    if (!title) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      description: (fd.get('description') as string).trim() || undefined,
      zone: (fd.get('zone') as TaskZone) || defaultZone || 'Green',
      isCompleted: false,
      createdAt: new Date().toISOString(),
      projectId: (fd.get('project') as string) || undefined,
      dueDate: (fd.get('dueDate') as string) || undefined,
    };

    addTask(newTask);
    addToast('success', `"${newTask.title}" added.`);
    onClose();
    (e.target as HTMLFormElement).reset();
  };

  const activeZone: TaskZone = defaultZone ?? 'Green';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Task">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Title */}
        <div className="space-y-2">
          <label className={THEME.label} htmlFor="at-title">Task Name</label>
          <input
            id="at-title"
            name="title"
            required
            placeholder="What needs doing?"
            autoFocus
            className={`${THEME.input} w-full`}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className={THEME.label} htmlFor="at-desc">Details <span className="text-white/20">(optional)</span></label>
          <textarea
            id="at-desc"
            name="description"
            rows={2}
            placeholder="Any extra notes…"
            className={`${THEME.input} w-full resize-none`}
          />
        </div>

        {/* Zone picker */}
        <div className="space-y-2">
          <label className={THEME.label}>Zone</label>
          <div className="grid grid-cols-1 gap-1.5">
            {ZONE_KEYS.map((z) => {
              const m = ZONES[z];
              return (
                <label
                  key={z}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all hover:brightness-110 ${m.chipBg} ${m.border}`}
                >
                  <input
                    type="radio"
                    name="zone"
                    value={z}
                    defaultChecked={z === activeZone}
                    className="sr-only"
                  />
                  <span className={`w-2 h-2 rounded-full shrink-0 ${m.bg}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${m.text}`}>{m.label}</span>
                  <span className="text-[10px] text-white/30">— {m.description}</span>
                  <span className="ml-auto text-[9px] text-white/20 tabular-nums">{m.hours}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Due date + Project */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={THEME.label} htmlFor="at-due">Due Date</label>
            <input
              id="at-due"
              name="dueDate"
              type="date"
              defaultValue={defaultDueDate ?? ''}
              className={`${THEME.input} w-full`}
            />
          </div>
          <div className="space-y-2">
            <label className={THEME.label} htmlFor="at-proj">Project</label>
            <select
              id="at-proj"
              name="project"
              defaultValue={defaultProjectId ?? ''}
              className={`${THEME.input} w-full`}
            >
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className={`${THEME.buttonPrimary} w-full py-4 text-xs font-black uppercase tracking-widest`}
        >
          Add Task
        </button>
      </form>
    </Modal>
  );
};
