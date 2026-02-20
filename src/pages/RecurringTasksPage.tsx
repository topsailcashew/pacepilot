import React from 'react';
import { PlusCircle } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { THEME } from '@/constants';

/**
 * Habits / recurring task tracker displayed as a sortable table.
 */
export const RecurringTasksPage: React.FC = () => {
  const { recurringTasks, toggleRecurringTask } = useAppStore();

  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-10">
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tighter uppercase">
            Consistent Habits
          </h3>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-2">
            Automated progress trackers
          </p>
        </div>
        <button
          className={`${THEME.buttonPrimary} px-6 py-3 text-xs font-black uppercase tracking-widest shadow-lg shadow-pilot-orange/20 flex items-center gap-2`}
        >
          <PlusCircle size={16} /> New Habit
        </button>
      </div>

      <div className={`${THEME.card} overflow-x-auto no-scrollbar`}>
        <table className="w-full text-left min-w-[600px]">
          <thead>
            <tr className="border-b border-white/5">
              {['Habit Name', 'Cycle', 'Status', 'Actions'].map((col) => (
                <th
                  key={col}
                  className={`pb-4 text-[10px] font-black text-white/20 uppercase tracking-widest ${
                    col === 'Actions' ? 'text-right' : ''
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {recurringTasks.map((rt) => (
              <tr key={rt.id} className="group hover:bg-white/[0.01]">
                <td className="py-5">
                  <p className="text-sm font-bold text-white/80 uppercase">
                    {rt.task}
                  </p>
                  <p className="text-[9px] text-white/20 mt-1 uppercase">
                    Last Checked: {rt.last}
                  </p>
                </td>

                <td className="py-5">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                    {rt.interval}
                  </span>
                </td>

                <td className="py-5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        rt.status === 'Completed'
                          ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                          : 'bg-pilot-orange animate-pulse'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest ${
                        rt.status === 'Completed'
                          ? 'text-green-500'
                          : 'text-pilot-orange'
                      }`}
                    >
                      {rt.status}
                    </span>
                  </div>
                </td>

                <td className="py-5 text-right">
                  <button
                    onClick={() => toggleRecurringTask(rt.id)}
                    className="text-[10px] font-black text-white/20 hover:text-white uppercase tracking-widest transition-all"
                  >
                    {rt.status === 'Completed' ? 'Reset' : 'Complete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
