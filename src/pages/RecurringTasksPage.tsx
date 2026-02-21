import React, { useState } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Modal } from '@/components/ui/Modal';
import { THEME } from '@/constants';
import type { RecurringInterval, RecurringTask } from '@/types';

/**
 * Habits / recurring task tracker displayed as a sortable table.
 * Supports creating and deleting habits in addition to toggling completion.
 */
export const RecurringTasksPage: React.FC = () => {
  const { recurringTasks, toggleRecurringTask, addRecurringTask, deleteRecurringTask, addToast } =
    useAppStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [habitInterval, setHabitInterval] = useState<RecurringInterval>('Daily');

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    const rt: RecurringTask = {
      id: crypto.randomUUID(),
      task: habitName.trim(),
      status: 'Pending',
      last: '',
      interval: habitInterval,
    };

    await addRecurringTask(rt);
    addToast('success', `"${rt.task}" added to habits.`);
    setHabitName('');
    setHabitInterval('Daily');
    setModalOpen(false);
  };

  const handleDelete = (rt: RecurringTask) => {
    if (!window.confirm(`Delete habit "${rt.task}"?`)) return;
    deleteRecurringTask(rt.id);
    addToast('info', `"${rt.task}" removed.`);
  };

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
          onClick={() => setModalOpen(true)}
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
                    {rt.last ? `Last Checked: ${rt.last}` : 'Not yet checked'}
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
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => toggleRecurringTask(rt.id)}
                      className="text-[10px] font-black text-white/20 hover:text-white uppercase tracking-widest transition-all"
                    >
                      {rt.status === 'Completed' ? 'Reset' : 'Complete'}
                    </button>
                    <button
                      onClick={() => handleDelete(rt)}
                      aria-label={`Delete ${rt.task}`}
                      className="p-1.5 text-white/20 hover:text-red-400 transition-colors rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {recurringTasks.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-xs text-white/20 font-bold uppercase tracking-widest">
                  No habits yet — add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* New Habit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Habit">
        <form onSubmit={handleAddHabit} className="space-y-6">
          <div className="space-y-2">
            <label className={THEME.label} htmlFor="habit-name">Habit Name</label>
            <input
              id="habit-name"
              type="text"
              required
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              className={`${THEME.input} w-full`}
              placeholder="E.G. MORNING WORKOUT"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className={THEME.label} htmlFor="habit-interval">Frequency</label>
            <select
              id="habit-interval"
              value={habitInterval}
              onChange={(e) => setHabitInterval(e.target.value as RecurringInterval)}
              className={`${THEME.input} w-full`}
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className={`${THEME.buttonPrimary} flex-1 py-3 text-xs font-black uppercase tracking-widest`}
            >
              Add Habit
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
