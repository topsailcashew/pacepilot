import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { TaskItem } from '@/components/tasks/TaskItem';
import { THEME } from '@/constants';

/**
 * Projects view: sidebar of project links and a task list for the selected project.
 * Uses URL param `:projectId`; defaults to the first project when none is selected.
 */
export const ProjectsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { tasks, projects } = useAppStore();

  const activeProject =
    projects.find((p) => p.id === projectId) ?? projects[0];

  const projectTasks = tasks.filter((t) => t.projectId === activeProject?.id);

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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Project list */}
        <div className="lg:col-span-1 space-y-2">
          {projects.map((p) => (
            <Link
              key={p.id}
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
          ))}
        </div>

        {/* Task list for selected project */}
        <div className="lg:col-span-3">
          <div className={THEME.card}>
            <h4 className={THEME.label}>Tasks in {activeProject?.name}</h4>
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
          </div>
        </div>
      </div>
    </div>
  );
};
