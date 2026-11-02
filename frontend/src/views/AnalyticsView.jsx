import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  Target,
  ArrowUpRight,
  Calendar,
  Layers,
} from 'lucide-react';

export const AnalyticsView = () => {
  const { subjects, user } = useApp();
  const [activeRange, setActiveRange] = useState('Month'); // 'Week' | 'Month' | 'Semester'

  // 12-week heatmap grid simulation (7 days x 12 weeks = 84 cells)
  const heatmapData = Array.from({ length: 84 }, (_, i) => {
    // Generate realistic attendance intensity (0: absent, 1: light, 2: medium, 3: full present)
    if (i % 7 === 6) return 0; // Sundays off
    if (i === 12 || i === 25 || i === 48 || i === 71) return 1; // Late
    if (i === 19 || i === 33 || i === 60) return 0; // Absent
    return 3; // Present
  });

  const getHeatmapColor = (val) => {
    if (val === 0) return 'bg-slate-200 dark:bg-slate-800';
    if (val === 1) return 'bg-amber-300 dark:bg-amber-600';
    if (val === 2) return 'bg-indigo-300 dark:bg-indigo-700';
    return 'bg-indigo-600 dark:bg-indigo-500';
  };

  const watchlist = subjects.filter((s) => s.percentage < 75);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header matching Screenshot Page 8 & 9 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {user.collegeName} • Spring Semester 2026
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Attendance Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Deep insights across subjects, attendance streaks, and semester cutoff projections
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          {['Week', 'Month', 'Semester'].map((range) => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                activeRange === range
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 KPI Metrics Cards matching Screenshot Page 9 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Overall</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
            82%
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+3% this period</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">To Reach 85%</span>
            <Target className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
            4 lectures
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Consecutive attendance
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Late Arrivals</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-500 font-mono">
            7
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Within grace window
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Below 75%</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-rose-600 font-mono">
            {watchlist.length} subjects
          </div>
          <div className="mt-1 text-[11px] text-rose-600 font-semibold">
            Action required
          </div>
        </div>
      </div>

      {/* Row 2: Attendance Over Time Area + Donut Breakdown matching Screenshot Page 9 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Over Time Area (8 Cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Attendance over time
              </h3>
              <p className="text-xs text-slate-500">Daily roll-call percentage over {activeRange.toLowerCase()}</p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600">Avg: 82.4%</span>
          </div>

          <div className="h-56 w-full pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 600 160">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="40" x2="600" y2="40" stroke="#E2E8F0" strokeDasharray="4" strokeWidth="1" />
              <line x1="0" y1="80" x2="600" y2="80" stroke="#E2E8F0" strokeDasharray="4" strokeWidth="1" />
              <line x1="0" y1="120" x2="600" y2="120" stroke="#E2E8F0" strokeDasharray="4" strokeWidth="1" />
              <path
                d="M0,90 Q75,50 150,70 T300,40 T450,60 T600,35 L600,160 L0,160 Z"
                fill="url(#areaGrad)"
              />
              <path
                d="M0,90 Q75,50 150,70 T300,40 T450,60 T600,35"
                fill="none"
                stroke="#4F46E5"
                strokeWidth="3"
              />
            </svg>
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Day 1</span>
            <span>Day 5</span>
            <span>Day 10</span>
            <span>Day 15</span>
            <span>Day 20</span>
            <span>Day 25</span>
            <span>Day 30</span>
          </div>
        </div>

        {/* Donut Chart: Present / Late / Absent (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Present / Late / Absent
            </h3>
            <p className="text-xs text-slate-500">Overall ratio across semester</p>

            {/* Donut SVG */}
            <div className="relative w-44 h-44 mx-auto my-6 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 42 42">
                <circle
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke="#EF4444"
                  strokeWidth="5"
                  strokeDasharray="8 92"
                  strokeDashoffset="0"
                />
                <circle
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke="#F59E0B"
                  strokeWidth="5"
                  strokeDasharray="10 90"
                  strokeDashoffset="-8"
                />
                <circle
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke="#10B981"
                  strokeWidth="5"
                  strokeDasharray="82 18"
                  strokeDashoffset="-18"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                  82%
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Present</span>
              </div>
            </div>
          </div>

          {/* Legend matching Screenshot Page 9 */}
          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Present 82%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Late 10%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Absent 8%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: 12-Week Heatmap Grid matching Screenshot Page 8 */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              12-week attendance heatmap
            </h3>
            <p className="text-xs text-slate-500">
              Daily visual streak and physical presence records
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Less</span>
            <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-800" />
            <span className="w-3 h-3 rounded bg-amber-400" />
            <span className="w-3 h-3 rounded bg-indigo-300" />
            <span className="w-3 h-3 rounded bg-indigo-600" />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="grid grid-rows-7 grid-flow-col gap-1.5 w-max">
            {heatmapData.map((val, idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-xs transition-colors ${getHeatmapColor(val)}`}
                title={`Day ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
          <span>12 weeks ago</span>
          <span>This week</span>
        </div>
      </div>

      {/* Row 4: Watchlist Table - Below 75% Threshold matching Screenshot Page 8 */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Watchlist — below 75% threshold
            </h3>
            <p className="text-xs text-slate-500">
              Official recovery plan to secure semester end exam hall ticket
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            {watchlist.length} Flagged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 pl-2">Subject</th>
                <th className="pb-3">Faculty</th>
                <th className="pb-3 text-center">Attended</th>
                <th className="pb-3 text-center">%</th>
                <th className="pb-3 pr-2 text-right">Required to reach 75%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {watchlist.map((sub) => (
                <tr key={sub.code} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 pl-2 font-bold text-slate-900 dark:text-white">
                    {sub.name}
                  </td>
                  <td className="py-3.5 text-slate-600 dark:text-slate-300">
                    {sub.faculty}
                  </td>
                  <td className="py-3.5 text-center font-mono text-slate-700 dark:text-slate-300">
                    {sub.attended}/{sub.total}
                  </td>
                  <td className="py-3.5 text-center font-mono font-bold text-rose-600">
                    {sub.percentage}%
                  </td>
                  <td className="py-3.5 pr-2 text-right text-rose-600 font-bold">
                    Attend next {sub.recoveryLecturesNeeded} lectures in a row
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
