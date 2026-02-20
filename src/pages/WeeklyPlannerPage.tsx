import React from 'react';
import { ChevronLeft, ChevronRight, ListTodo } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { THEME } from '@/constants';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Seven-day planner view showing tasks grouped by due date.
 */
export const WeeklyPlannerPage: React.FC = () => {
  const tasks = useAppStore((s) => s.tasks);

  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tighter uppercase">
            Weekly Planner
          </h3>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-2">
            Map out the week ahead
          </p>
        </div>
        <div className="flex gap-2">
          <button
            aria-label="Previous week"
            className={`${THEME.buttonSecondary} p-3 rounded-lg text-white/40 hover:text-white`}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            aria-label="Next week"
            className={`${THEME.buttonSecondary} p-3 rounded-lg text-white/40 hover:text-white`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {DAYS.map((day, idx) => {
          const d = new Date();
          d.setDate(d.getDate() + idx);
          const dateStr = d.toISOString().split('T')[0];

          // Tasks due on this day; tasks without a due date appear on Monday
          const dayTasks = tasks.filter(
            (t) =>
              t.dueDate === dateStr || (idx === 0 && !t.dueDate)
          );

          return (
            <div key={day} className="flex flex-col h-[500px]">
              {/* Day header */}
              <div className="p-4 bg-white/[0.02] border-t border-x border-white/5 rounded-t-xl text-center">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-1">
                  {day}
                </span>
                <span className="text-xl font-black text-white">{d.getDate()}</span>
              </div>

              {/* Task list */}
              <div className="flex-1 bg-prussianblue/40 border-x border-b border-white/5 rounded-b-xl p-3 space-y-3 overflow-y-auto no-scrollbar shadow-inner">
                {dayTasks.map((t) => (
                  <div
                    key={t.id}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      t.isCompleted
                        ? 'bg-white/[0.01] border-white/5 opacity-30'
                        : 'bg-white/[0.03] border-white/10 hover:border-pilot-orange/30 shadow-sm'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold leading-tight uppercase ${
                        t.isCompleted ? 'line-through' : 'text-white/70'
                      }`}
                    >
                      {t.title}
                    </span>
                    <div className="mt-2 flex gap-1">
                      <div
                        className={`w-1 h-1 rounded-full ${
                          t.energyRequired === 'High'
                            ? 'bg-pilot-orange'
                            : t.energyRequired === 'Medium'
                            ? 'bg-blue-500'
                            : 'bg-green-500'
                        }`}
                      />
                    </div>
                  </div>
                ))}

                {dayTasks.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-5">
                    <ListTodo size={24} />
                    <span className="text-[8px] font-black uppercase tracking-widest mt-2">
                      Open
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
