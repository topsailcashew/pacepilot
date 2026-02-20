import React, { useState } from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { PieChart as PieChartIcon } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAppStore } from '@/store/appStore';
import { getWeeklyInsights } from '@/services/geminiService';
import { THEME } from '@/constants';

const CHART_COLORS = ['#F37324', '#3B82F6', '#10B981'];

/**
 * Analytics / Insights page showing momentum trend, energy profile charts,
 * and AI-generated weekly insights.
 */
export const ReportsPage: React.FC = () => {
  const { dailyReports, addToast } = useAppStore();
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  const momentumData = dailyReports.map((r) => ({
    date: r.date.split('-')[2],
    score: r.momentumScore,
  }));

  const completionByEnergy = [
    {
      name: 'High',
      count: dailyReports.filter((r) => r.energyLevel === 'High').length,
    },
    {
      name: 'Med',
      count: dailyReports.filter((r) => r.energyLevel === 'Medium').length,
    },
    {
      name: 'Low',
      count: dailyReports.filter((r) => r.energyLevel === 'Low').length,
    },
  ];

  const handleFetchInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const result = await getWeeklyInsights(dailyReports);
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
        <div>
          <h3 className="text-3xl font-black text-white tracking-tighter uppercase">
            Insights
          </h3>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-2">
            Productivity analytics
          </p>
        </div>
        <button
          onClick={handleFetchInsights}
          disabled={isLoadingInsights}
          className={`${THEME.buttonSecondary} px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50`}
        >
          <RefreshCw size={16} className={isLoadingInsights ? 'animate-spin' : ''} />
          {isLoadingInsights ? 'Loading…' : 'AI Insights'}
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Momentum trend */}
        <div className={THEME.card}>
          <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-10 flex items-center gap-2">
            <TrendingUp size={16} className="text-pilot-orange" /> Momentum Trend
          </h4>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={momentumData}>
                <CartesianGrid vertical={false} stroke="#ffffff05" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#ffffff22', fontSize: 10, fontWeight: 900 }}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#11122C',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '10px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#F37324"
                  strokeWidth={4}
                  dot={{ fill: '#F37324', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Energy profile */}
        <div className={THEME.card}>
          <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-10 flex items-center gap-2">
            <PieChartIcon size={16} className="text-pilot-orange" /> Energy Profile
          </h4>
          <div className="h-[250px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={completionByEnergy}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="count"
                  stroke="none"
                >
                  {completionByEnergy.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI weekly insights */}
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
                <span className="text-pilot-orange font-black text-xs w-5 shrink-0">
                  {i + 1}.
                </span>
                <p className="text-xs text-white/60 leading-relaxed">{insight}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
