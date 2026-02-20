import React, { useState } from 'react';
import { GripVertical, Zap, Folder, Target, Check } from 'lucide-react';
import { Task, Project } from '@/types';
import { useAppStore } from '@/store/appStore';

interface TaskItemProps {
  task: Task;
  projects: Project[];
  /** Called when the user clicks the focus (target) icon */
  onFocus: (task: Task) => void;
  /** Whether this task is the currently focused/active Pomodoro task */
  isFocusing: boolean;
}

/**
 * A single task row with expand/collapse detail panel, completion toggle,
 * and focus-session trigger.
 */
export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  projects,
  onFocus,
  isFocusing,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const { toggleTask, updateTask, deleteTask, addToast } = useAppStore();

  const currentProject = projects.find((p) => p.id === task.projectId);

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.isCompleted) {
      // Brief visual animation before marking complete
      setIsCompleting(true);
      setTimeout(() => {
        toggleTask(task.id);
        setIsCompleting(false);
      }, 500);
    } else {
      toggleTask(task.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTask(task.id);
    addToast('info', `"${task.title}" removed.`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Placeholder — a real implementation would open an edit modal
    addToast('info', 'Edit functionality coming soon!');
  };

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && setIsExpanded(!isExpanded)}
      aria-expanded={isExpanded}
      className={[
        'group relative bg-white/[0.02] border border-white/5 rounded-xl p-4',
        'transition-all duration-300 hover:bg-white/[0.04] cursor-pointer',
        isFocusing ? 'ring-1 ring-pilot-orange/40' : '',
        isExpanded ? 'bg-white/[0.04]' : '',
        task.isCompleted ? 'opacity-50' : '',
        isCompleting ? 'scale-105 bg-pilot-orange/5 border-pilot-orange/30' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-center gap-4">
        {/* Drag handle (visual only) */}
        <div className="text-white/10 group-hover:text-white/30 transition-colors" aria-hidden="true">
          <GripVertical size={16} />
        </div>

        {/* Completion checkbox */}
        <button
          onClick={handleToggleComplete}
          aria-label={task.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          className={[
            'w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center shrink-0',
            task.isCompleted
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-white/10 group-hover:border-pilot-orange/50',
            isCompleting ? 'animate-success-pop' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {task.isCompleted && <Check size={14} strokeWidth={4} />}
        </button>

        {/* Task info */}
        <div className="flex-1 overflow-hidden">
          <h4
            className={`text-sm font-bold transition-all truncate ${
              task.isCompleted
                ? 'line-through text-white/20'
                : 'text-white/80'
            }`}
          >
            {task.title}
          </h4>

          {!isExpanded && (
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1.5 text-white/20">
                <Zap
                  size={10}
                  className={
                    task.energyRequired === 'High'
                      ? 'text-pilot-orange'
                      : 'text-white/40'
                  }
                />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {task.energyRequired} Energy
                </span>
              </div>
              {currentProject && (
                <div className="flex items-center gap-1.5 text-white/20">
                  <Folder size={10} className="text-white/40" />
                  <span className="text-[10px] font-black uppercase tracking-widest truncate">
                    {currentProject.name}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Focus button */}
        {!task.isCompleted && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFocus(task);
            }}
            aria-label={isFocusing ? 'Stop focusing on this task' : 'Focus on this task'}
            className={`p-2 rounded-lg transition-all ${
              isFocusing
                ? 'text-pilot-orange bg-pilot-orange/10'
                : 'text-white/10 hover:text-pilot-orange hover:bg-white/5'
            }`}
          >
            <Target size={18} />
          </button>
        )}
      </div>

      {/* Expanded detail panel */}
      {isExpanded && (
        <div
          className="mt-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs text-white/50 leading-relaxed">
            {task.description || 'No specific details provided.'}
          </p>
          {task.dueDate && (
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-2">
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </p>
          )}
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleEdit}
              className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-white/5 rounded hover:bg-white/10 transition-all"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
