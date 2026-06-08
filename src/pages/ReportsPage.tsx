import React, { useMemo, useState } from 'react';
import { TrendingUp, RefreshCw, AlertTriangle, CheckCircle2, Zap, Activity } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { computeProjectInsights, computeTaskMomentum } from '@/services/insightsService';
import { MiniLineChart } from '@/components/ui/MiniLineChart';
import { THEME } from '@/constants';

// ── Gemini is large (~268 KB) — import dynamically only when the user clicks ──
async function fetchAiInsights(dailyReports: import('@/types').DailyReport[]): Promise<string[]> {
  const { getWeeklyInsights } = await import('@/services/geminiService');
  return getWeeklyInsights(dailyReports);
}

export const ReportsPage: React.FC = () => {
  const { dailyReports, tasks, projects, addToast } = useAppStore();
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  const momentumData = dailyReports.map((r) => ({
    label: r.date.split('-')[2],
    value: r.momentumScore,
  }));

  const projectInsights = useMemo(
    () => computeProjectInsights(projects, tasks),
    [projects, tasks]
  );

  const momentum = useMemo(
    () => computeTaskMomentum(tasks, dailyReports),
    [tasks, dailyReports]
  );

  const handleFetchInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const result = await fetchAiInsights(dailyReports);
      setInsights(result);
    } catch {
      addToast('error', 'Could not load AI insights. Please try again.');
    } finally {
      setIsLoadingInsights(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-10">
      <div className="flex items-center justify-between px-2">
        <button
          onClick={handleFetchInsights}
          disabled={isLoadingInsights}
          className={`${THEME.buttonSecondary} px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50`}
        >
          <RefreshCw size={16} className={isLoadingInsights ? 'animate-spin' : ''} />
          {isLoadingInsights ? 'Loading…' : 'AI Insights'}
        </button>
      </div>

      {/* ── Task Momentum Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className={`${THEME.card} flex flex-col gap-2`}>
          <div className="flex items-center gap-2 text-pilot-orange">
            <Zap size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Completed</span>
          </div>
          <p className="text-4xl font-black text-white">{momentum.totalCompleted}</p>
          <p className="text-[9px] text-white/20 uppercase tracking-widest">Total tasks done</p>
        </div>

        <div className={`${THEME.card} flex flex-col gap-2`}>
          <div className="flex items-center gap-2 text-blue-400">
            <Activity size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Active</span>
          </div>
          <p className="text-4xl font-black text-white">{momentum.activeCount}</p>
          <p className="text-[9px] text-white/20 uppercase tracking-widest">Tasks in progress</p>
        </div>

        <div className={`${THEME.card} flex flex-col gap-2`}>
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle2 size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Completion Rate</span>
          </div>
          <p className="text-4xl font-black text-white">
            {momentum.completionRate}<span className="text-xl text-white/40">%</span>
          </p>
          <p className="text-[9px] text-white/20 uppercase tracking-widest">Of all tasks</p>
        </div>

        <div className={`${THEME.card} flex flex-col gap-2 ${momentum.overdueCount > 0 ? 'border-red-500/20' : ''}`}>
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Overdue</span>
          </div>
          <p className={`text-4xl font-black ${momentum.overdueCount > 0 ? 'text-red-400' : 'text-white'}`}>
            {momentum.overdueCount}
          </p>
          <p className="text-[9px] text-white/20 uppercase tracking-widest">Past due, not completed</p>
        </div>
      </div>

      {/* ── Momentum Trend Chart ────────────────────────────────────────────── */}
      <div className={THEME.card}>
        <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-8 flex items-center gap-2">
          <TrendingUp size={16} className="text-pilot-orange" /> Momentum Trend
        </h4>
        {momentumData.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-xs text-white/20 font-bold uppercase tracking-widest text-center">
              No data yet — complete a day report to see your momentum trend.
            </p>
          </div>
        ) : (
          <MiniLineChart data={momentumData} height={200} color="#F37324" domain={[0, 100]} />
        )}
      </div>

      {/* ── Project Completion Breakdown ───────────────────────────────────── */}
      {projectInsights.length > 0 && (
        <div className={THEME.card}>
          <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-8 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-pilot-orange" /> Project Completion
          </h4>
          <div className="space-y-5">
            {projectInsights.map(({ project, total, completed, rate, overdue }) => (
              <div key={project.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                    <span className="text-xs font-bold text-white/70 uppercase">{project.name}</span>
                    {overdue > 0 && (
                      <span className="text-[9px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                        {overdue} overdue
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-black text-white/40 uppercase">
                    <span>{completed}/{total} tasks</span>
                    <span className="text-white/60">{rate}%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${rate}%`, backgroundColor: project.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AI Weekly Insights ─────────────────────────────────────────────── */}
      {insights.length > 0 && (
        <div className={THEME.card}>
          <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-6">
            Weekly AI Insights
          </h4>
          <ul className="space-y-4">
            {insights.map((insight, i) => (
              <li
                key={i}
                className="flex items-start gap-4 p-4 bg-pilot-orange/5 border border-pilot-orange/10 rounded-xl animate-in fade-in duration-500"
              >
                <span className="text-pilot-orange font-black text-xs w-5 shrink-0">{i + 1}.</span>
                <p className="text-xs text-white/60 leading-relaxed">{insight}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
