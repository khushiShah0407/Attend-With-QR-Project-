import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  GraduationCap,
  Building,
  TrendingUp,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { validateRequiredText } from '../utils/validators';

export const AdminOverviewView = () => {
  const { departments, addDepartment, setCurrentView } = useApp();
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All departments');
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);

  // Add Department Form
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptHod, setDeptHod] = useState('');
  const [deptStudents, setDeptStudents] = useState('');
  const [deptFaculty, setDeptFaculty] = useState('');
  const [formError, setFormError] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);

  // Total Students & Faculty calculated live from departments
  const totalStudents = departments.reduce((acc, d) => acc + (d.studentsCount || 0), 0);
  const totalFaculty = departments.reduce((acc, d) => acc + (d.facultyCount || 0), 0);
  const avgAttendance = Math.round(
    departments.reduce((acc, d) => acc + (d.averageAttendance || 0), 0) / (departments.length || 1)
  );

  const handleAddDepartmentSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    const valName = validateRequiredText(deptName, 'Department Name', 3);
    if (!valName.isValid) {
      setFormError(valName.message);
      return;
    }

    const valCode = validateRequiredText(deptCode, 'Department Code', 2);
    if (!valCode.isValid) {
      setFormError(valCode.message);
      return;
    }

    const numStudents = parseInt(deptStudents, 10);
    const numFaculty = parseInt(deptFaculty, 10);
    if (isNaN(numStudents) || numStudents <= 0) {
      setFormError('Please enter a valid count of students.');
      return;
    }
    if (isNaN(numFaculty) || numFaculty <= 0) {
      setFormError('Please enter a valid count of faculty members.');
      return;
    }

    addDepartment({
      name: deptName.trim(),
      code: deptCode.trim().toUpperCase(),
      headOfDepartment: deptHod.trim() || 'Assigned HOD',
      studentsCount: numStudents,
      facultyCount: numFaculty,
      averageAttendance: 80,
    });

    setAddSuccess(true);
    setTimeout(() => {
      setAddSuccess(false);
      setIsAddDeptModalOpen(false);
      setDeptName('');
      setDeptCode('');
      setDeptHod('');
      setDeptStudents('');
      setDeptFaculty('');
    }, 1200);
  };

  // Stacked Bar Days data
  const weeklyDays = [
    { day: 'Mon', present: 85, late: 8, absent: 7 },
    { day: 'Tue', present: 88, late: 5, absent: 7 },
    { day: 'Wed', present: 82, late: 10, absent: 8 },
    { day: 'Thu', present: 86, late: 7, absent: 7 },
    { day: 'Fri', present: 80, late: 12, absent: 8 },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header matching Screenshot Pages 1 & 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            College Admin • Spring 2026
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            College Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pillai College of Engineering • Institutional Real-time Roll-Call
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddDeptModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards matching Screenshot Pages 1 & 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Students</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
            {totalStudents.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+42 this term</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Faculty</span>
            <GraduationCap className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
            {totalFaculty}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">
            Across {departments.length} departments
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Departments</span>
            <Building className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
            {departments.length}
          </div>
          <div className="mt-1 text-[11px] text-indigo-600 font-medium">
            Active programs
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Attendance</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
            {avgAttendance}%
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+2% vs college avg</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Weekly Attendance Stacked Bar + Alerts matching Screenshots */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Attendance Trend Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Weekly attendance trend
              </h3>
              <p className="text-xs text-slate-500">Live aggregated roll-calls Mon–Fri</p>
            </div>

            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option>All departments</option>
              {departments.map((d) => (
                <option key={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Stacked Bars Visualization */}
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-5 gap-3 sm:gap-6 h-56 items-end pb-4 border-b border-slate-100 dark:border-slate-800">
              {weeklyDays.map((d) => (
                <div key={d.day} className="flex flex-col items-center h-full justify-end group">
                  <div className="w-full max-w-[42px] flex flex-col rounded-lg overflow-hidden shadow-xs">
                    {/* Absent Red */}
                    <div
                      style={{ height: `${d.absent * 1.5}px` }}
                      className="bg-rose-500 hover:opacity-90 transition-opacity"
                      title={`Absent: ${d.absent}%`}
                    />
                    {/* Late Amber */}
                    <div
                      style={{ height: `${d.late * 1.5}px` }}
                      className="bg-amber-400 hover:opacity-90 transition-opacity"
                      title={`Late: ${d.late}%`}
                    />
                    {/* Present Green */}
                    <div
                      style={{ height: `${d.present * 1.5}px` }}
                      className="bg-emerald-500 hover:opacity-90 transition-opacity"
                      title={`Present: ${d.present}%`}
                    />
                  </div>
                  <span className="mt-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                    {d.day}
                  </span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Present</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Late</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Absent</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Column matching Screenshot (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Alerts
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Students below 75% threshold
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Operating Systems • Div A
                  </span>
                  <span className="text-[11px] font-mono font-bold text-rose-600">68%</span>
                </div>
                <div className="text-[11px] text-rose-700 dark:text-rose-300 mt-1 flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>Critical: 7 students below 75% exam cutoff</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    DBMS • Div B
                  </span>
                  <span className="text-[11px] font-mono font-bold text-amber-600">72%</span>
                </div>
                <div className="text-[11px] text-amber-700 dark:text-amber-300 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>Warning: 4 students close to threshold</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Mechanical Design • Div A
                  </span>
                  <span className="text-[11px] font-mono font-bold text-amber-600">74%</span>
                </div>
                <div className="text-[11px] text-amber-700 dark:text-amber-300 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>Warning: 4 students in danger zone</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setCurrentView('analytics')}
            className="w-full mt-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            View All Threshold Watchlists
          </button>
        </div>
      </div>

      {/* Departments Table & Subject Comparison Grid matching Screenshot Page 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Departments Table (8 Cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Departments
              </h3>
              <p className="text-xs text-slate-500">
                Official faculty assignments, student enrollment & semester averages
              </p>
            </div>

            <button
              onClick={() => setIsAddDeptModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add department</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 pl-2">Department</th>
                  <th className="pb-3 text-center">Students</th>
                  <th className="pb-3 text-center">Faculty</th>
                  <th className="pb-3 pr-2 text-right">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 pl-2">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        {dept.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Code: {dept.code}
                      </div>
                    </td>
                    <td className="py-3 text-center font-mono text-slate-700 dark:text-slate-300">
                      {dept.studentsCount}
                    </td>
                    <td className="py-3 text-center font-mono text-slate-700 dark:text-slate-300">
                      {dept.facultyCount}
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${dept.averageAttendance}%` }}
                            className={`h-full rounded-full ${
                              dept.averageAttendance >= 80
                                ? 'bg-emerald-500'
                                : dept.averageAttendance >= 75
                                ? 'bg-amber-400'
                                : 'bg-rose-500'
                            }`}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white w-8">
                          {dept.averageAttendance}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Subject Comparison Chart matching Screenshot Page 2 (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Subject comparison
              </h3>
              <span className="text-[10px] font-mono font-bold text-indigo-600">Cross-Division</span>
            </div>
            <p className="text-xs text-slate-500">Correlation across BCA semester subjects</p>

            {/* Line Graph SVG matching Screenshot Page 2 */}
            <div className="h-44 w-full pt-4">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120">
                <line x1="0" y1="30" x2="300" y2="30" stroke="#F1F5F9" strokeDasharray="3" strokeWidth="1" />
                <line x1="0" y1="60" x2="300" y2="60" stroke="#F1F5F9" strokeDasharray="3" strokeWidth="1" />
                <line x1="0" y1="90" x2="300" y2="90" stroke="#F1F5F9" strokeDasharray="3" strokeWidth="1" />

                <path
                  d="M10,95 L75,30 L150,75 L225,25 L290,45"
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="2.5"
                />

                {/* Data Points */}
                <circle cx="10" cy="95" r="3.5" fill="#4F46E5" />
                <circle cx="75" cy="30" r="3.5" fill="#4F46E5" />
                <circle cx="150" cy="75" r="3.5" fill="#4F46E5" />
                <circle cx="225" cy="25" r="3.5" fill="#4F46E5" />
                <circle cx="290" cy="45" r="3.5" fill="#4F46E5" />
              </svg>
            </div>

            <div className="flex justify-between text-[9px] font-mono text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>BCA501</span>
              <span>BCA502</span>
              <span>BCA503</span>
              <span>BCA504</span>
              <span>BCA505</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 mt-4">
            <span>Highest: Software Eng (94%)</span>
            <span className="text-rose-500 font-semibold">Lowest: OS (68%)</span>
          </div>
        </div>
      </div>

      {/* Add Department Modal with Strict Validation */}
      {isAddDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            {addSuccess ? (
              <div className="text-center py-6 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  Department Added!
                </h4>
                <p className="text-xs text-slate-500">
                  {deptName} saved into Cloud SQL and persisted.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAddDepartmentSubmit} className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    Add New Department
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddDeptModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ✕
                  </button>
                </div>

                {formError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department Name
                  </label>
                  <input
                    type="text"
                    required
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    placeholder="e.g. Artificial Intelligence & Data Science"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Code
                    </label>
                    <input
                      type="text"
                      required
                      value={deptCode}
                      onChange={(e) => setDeptCode(e.target.value)}
                      placeholder="e.g. AI-DS"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      HOD Name
                    </label>
                    <input
                      type="text"
                      value={deptHod}
                      onChange={(e) => setDeptHod(e.target.value)}
                      placeholder="Dr. S. Kulkarni"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Student Count
                    </label>
                    <input
                      type="number"
                      required
                      value={deptStudents}
                      onChange={(e) => setDeptStudents(e.target.value)}
                      placeholder="180"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Faculty Count
                    </label>
                    <input
                      type="number"
                      required
                      value={deptFaculty}
                      onChange={(e) => setDeptFaculty(e.target.value)}
                      placeholder="10"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddDeptModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Save Department
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
