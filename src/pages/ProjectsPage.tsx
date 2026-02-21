import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { TaskItem } from '@/components/tasks/TaskItem';
import { Modal } from '@/components/ui/Modal';
import { THEME } from '@/constants';
import type { Project } from '@/types';

const COLOR_OPTIONS = [
  { label: 'Orange', value: 'bg-pilot-orange' },
  { label: 'Blue', value: 'bg-blue-500' },
  { label: 'Green', value: 'bg-green-500' },
  { label: 'Purple', value: 'bg-purple-500' },
  { label: 'Pink', value: 'bg-pink-500' },
  { label: 'Teal', value: 'bg-teal-500' },
];

const ICON_OPTIONS = ['Briefcase', 'User', 'Activity', 'Star', 'Zap', 'Globe', 'Code', 'Heart'];

interface ProjectFormState {
  name: string;
  color: string;
  icon: string;
}

const DEFAULT_FORM: ProjectFormState = { name: '', color: 'bg-pilot-orange', icon: 'Briefcase' };

/**
 * Projects view: sidebar of project links and a task list for the selected project.
 * Supports creating, editing, and deleting projects.
 */
export const ProjectsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { tasks, projects, addProject, updateProject, deleteProject, addToast } = useAppStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectFormState>(DEFAULT_FORM);

  const activeProject =
    projects.find((p) => p.id === projectId) ?? projects[0];

  const projectTasks = tasks.filter((t) => t.projectId === activeProject?.id);

  const openCreate = () => {
    setEditingProject(null);
    setForm(DEFAULT_FORM);
    setModalOpen(true);
  };

  const openEdit = (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProject(project);
    setForm({ name: project.name, color: project.color, icon: project.icon });
    setModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete "${project.name}"? Tasks in this project will remain but become unassigned.`)) return;
    deleteProject(project.id);
    addToast('info', `"${project.name}" deleted.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editingProject) {
      await updateProject(editingProject.id, form);
      addToast('success', 'Project updated.');
    } else {
      const project: Project = { id: crypto.randomUUID(), ...form };
      await addProject(project);
      addToast('success', `"${form.name}" created.`);
    }
    setModalOpen(false);
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-10">
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tighter uppercase">
            Projects
          </h3>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-2">
            Focused areas of work
          </p>
        </div>
        <button
          onClick={openCreate}
          className={`${THEME.buttonPrimary} px-6 py-3 text-xs font-black uppercase tracking-widest shadow-lg shadow-pilot-orange/20 flex items-center gap-2`}
        >
          <PlusCircle size={16} /> New Project
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Project list */}
        <div className="lg:col-span-1 space-y-2">
          {projects.map((p) => (
            <div key={p.id} className="relative group">
              <Link
                to={`/projects/${p.id}`}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  activeProject?.id === p.id
                    ? 'bg-pilot-orange border-pilot-orange text-white'
                    : 'bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/5'
                }`}
              >
                <span className="text-sm font-bold uppercase">{p.name}</span>
                <ChevronRight size={14} className="opacity-30" />
              </Link>
              {/* Edit / Delete controls shown on hover */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-deepnavy/90 rounded-lg p-1">
                <button
                  onClick={(e) => openEdit(e, p)}
                  aria-label={`Edit ${p.name}`}
                  className="p-1.5 text-white/40 hover:text-white transition-colors rounded"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={(e) => handleDelete(e, p)}
                  aria-label={`Delete ${p.name}`}
                  className="p-1.5 text-white/40 hover:text-red-400 transition-colors rounded"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <p className="text-xs text-white/20 font-bold uppercase tracking-widest py-4 text-center">
              No projects yet.
            </p>
          )}
        </div>

        {/* Task list for selected project */}
        <div className="lg:col-span-3">
          <div className={THEME.card}>
            {activeProject ? (
              <>
                <h4 className={THEME.label}>Tasks in {activeProject.name}</h4>
                <div className="space-y-4 mt-6">
                  {projectTasks.length === 0 ? (
                    <p className="text-xs text-white/20 font-bold uppercase tracking-widest py-10 text-center">
                      No tasks yet in this project.
                    </p>
                  ) : (
                    projectTasks.map((t) => (
                      <TaskItem
                        key={t.id}
                        task={t}
                        projects={projects}
                        onFocus={() => {}}
                        isFocusing={false}
                      />
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="py-16 text-center">
                <p className="text-xs text-white/20 font-bold uppercase tracking-widest">
                  Create a project to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create / Edit Project Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProject ? 'Edit Project' : 'New Project'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className={THEME.label} htmlFor="proj-name">Project Name</label>
            <input
              id="proj-name"
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={`${THEME.input} w-full`}
              placeholder="E.G. LAUNCH CAMPAIGN"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className={THEME.label}>Color</label>
            <div className="flex gap-3 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                  aria-label={c.label}
                  className={`w-8 h-8 rounded-full ${c.value} transition-all ${
                    form.color === c.value
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-deepnavy scale-110'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className={THEME.label} htmlFor="proj-icon">Icon</label>
            <select
              id="proj-icon"
              value={form.icon}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              className={`${THEME.input} w-full`}
            >
              {ICON_OPTIONS.map((icon) => (
                <option key={icon} value={icon}>{icon}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className={`${THEME.buttonPrimary} flex-1 py-3 text-xs font-black uppercase tracking-widest`}
            >
              {editingProject ? 'Save Changes' : 'Create Project'}
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className={`${THEME.buttonSecondary} px-6 py-3 text-xs font-black uppercase tracking-widest`}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
