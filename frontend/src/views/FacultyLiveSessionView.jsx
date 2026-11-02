import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { QRCodeDisplay } from '../components/QRCodeDisplay.jsx';
import {
  Users,
  Clock,
  AlertTriangle,
  UserCheck,
  Download,
  Plus,
  Maximize2,
  StopCircle,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

import { FacultyStartSessionModal } from './FacultyStartSessionModal.jsx';

export const FacultyLiveSessionView = () => {
  const {
    liveSession,
    setLiveSession,
    sessionRemainingSec,
    currentQrToken,
    setCurrentView,
  } = useApp();

  const [rotationSpeed, setRotationSpeed] = useState(liveSession.rotationIntervalSec || 15);
  const [filterQuery, setFilterQuery] = useState('');
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [startSessionModalOpen, setStartSessionModalOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualRoll, setManualRoll] = useState('');
  const [manualReason, setManualReason] = useState('Camera malfunction');
  const [manualSuccess, setManualSuccess] = useState(false);
  const [exportNotice, setExportNotice] = useState('');

  // Calculate live session metrics
  const totalEnrolled = liveSession.totalEnrolled || 48;
  const checkedInCount = liveSession.checkIns.length;
  const onTimeCount = liveSession.checkIns.filter((c) => c.status === 'Present').length;
  const lateCount = liveSession.checkIns.filter((c) => c.status === 'Late').length;
  const pendingCount = Math.max(0, totalEnrolled - checkedInCount);
  const checkedInPercent = Math.round((checkedInCount / totalEnrolled) * 100);

  const filteredCheckIns = liveSession.checkIns.filter(
    (c) =>
      c.studentName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.rollNumber.toLowerCase().includes(filterQuery.toLowerCase())
  );

  // Handle Rotation Speed Change
  const handleSpeedChange = (speed) => {
    setRotationSpeed(speed);
    setLiveSession((prev) => ({ ...prev, rotationIntervalSec: speed }));
  };

  // Handle Manual Student Override
  const handleManualCheckIn = (e) => {
    e.preventDefault();
    if (!manualName.trim() || !manualRoll.trim()) return;

    const timeString = new Date().toTimeString().split(' ')[0];
    const initials = manualName
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newRecord = {
      id: `chk-manual-${Date.now()}`,
      studentName: manualName.trim(),
      rollNumber: manualRoll.trim().toUpperCase(),
      timeString,
      status: 'Present',
      avatarInitials: initials,
      method: `Manual Override (${manualReason})`,
      coordinatesVerified: true,
    };

    setLiveSession((prev) => ({
      ...prev,
      checkIns: [newRecord, ...prev.checkIns],
    }));

    setManualSuccess(true);
    setTimeout(() => {
      setManualSuccess(false);
      setManualModalOpen(false);
      setManualName('');
      setManualRoll('');
    }, 1200);
  };

  // Real CSV / PDF Export simulation
  const handleExport = (format) => {
    setExportNotice(`Exported ${liveSession.checkIns.length} records to ${format.toUpperCase()}`);
    setTimeout(() => setExportNotice(''), 3000);

    if (format === 'csv') {
      const headers = 'Roll Number,Student Name,Check-in Time,Status,Method\n';
      const rows = liveSession.checkIns
        .map((c) => `"${c.rollNumber}","${c.studentName}","${c.timeString}","${c.status}","${c.method}"`)
        .join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Attendance_${liveSession.subjectCode}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Session Banner matching Screenshot Pages 3 & 10 */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              Session Live Broadcast
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Live Session • {liveSession.subjectName}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {liveSession.program} {liveSession.semester} - {liveSession.division} • Room: {liveSession.classroom}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setStartSessionModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Session</span>
          </button>

          <button
            onClick={() => setManualModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Manual Check-in</span>
          </button>

          <button
            onClick={() => setCurrentView('projector')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Projector Mode</span>
          </button>

          <button
            onClick={() => setCurrentView('admin')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
          >
            <StopCircle className="w-4 h-4" />
            <span>End Session</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Metrics Row matching Screenshot Page 3 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Checked In</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
            {checkedInCount} / {totalEnrolled}
          </div>
          <div className="mt-1 text-[11px] text-indigo-600 font-bold">
            {checkedInPercent}% attendance
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">On Time</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">
            {onTimeCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">First 10 mins</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Late</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-500 font-mono">
            {lateCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Grace period</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending</span>
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-400 font-mono">
            {pendingCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Yet to scan</div>
        </div>
      </div>

      {/* Main Split: QR Generator (Left) vs Live Check-Ins Feed (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left QR Generator Card (5 Cols) matching Screenshot Pages 3 & 10 */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Session QR
              </span>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {liveSession.subjectCode} • {liveSession.classroom}
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              • LIVE
            </span>
          </div>

          <div className="flex justify-center py-2">
            <QRCodeDisplay
              value={currentQrToken}
              size={210}
              remainingSec={sessionRemainingSec}
              totalSec={rotationSpeed}
              onOpenProjector={() => setCurrentView('projector')}
            />
          </div>

          {/* Configurable Rotation Interval */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                Rotation Interval:
              </span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {rotationSpeed} seconds
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[10, 15, 20, 30].map((sec) => (
                <button
                  key={sec}
                  onClick={() => handleSpeedChange(sec)}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    rotationSpeed === sec
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Live Check-Ins Table (7 Cols) matching Screenshot Pages 3 & 10 */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Live check-ins
              </h3>
              <p className="text-xs text-slate-500">
                Showing {filteredCheckIns.length} of {totalEnrolled} enrolled, {pendingCount} yet to scan
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search roll / name..."
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleExport('csv')}
                  title="Export to CSV"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>

                <button
                  onClick={() => handleExport('pdf')}
                  title="Export to PDF"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Check-ins Table matching Screenshot */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 pl-2">Student</th>
                  <th className="pb-3 text-center">Roll No.</th>
                  <th className="pb-3 text-center">Time</th>
                  <th className="pb-3 pr-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredCheckIns.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 pl-2 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {item.avatarInitials || 'ST'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.studentName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.method || 'Dynamic QR'}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-center font-mono text-slate-700 dark:text-slate-300">
                      {item.rollNumber}
                    </td>
                    <td className="py-3 text-center font-mono text-slate-500">
                      {item.timeString}
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.status === 'Present'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manual Check-In Override Modal */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            {manualSuccess ? (
              <div className="text-center py-6 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  Student Marked Present!
                </h4>
                <p className="text-xs text-slate-500">
                  {manualName} ({manualRoll}) added to active session roll-call.
                </p>
              </div>
            ) : (
              <form onSubmit={handleManualCheckIn} className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    Manual Attendance Override
                  </h4>
                  <button
                    type="button"
                    onClick={() => setManualModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="e.g. Siddharth Joshi"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Roll Number / Enrollment ID
                  </label>
                  <input
                    type="text"
                    required
                    value={manualRoll}
                    onChange={(e) => setManualRoll(e.target.value)}
                    placeholder="e.g. 22BCA052"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reason for Override
                  </label>
                  <select
                    value={manualReason}
                    onChange={(e) => setManualReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option>Camera malfunction / hardware error</option>
                    <option>Low phone battery</option>
                    <option>Authorized physical verification by Dr. R. Kulkarni</option>
                    <option>Medical exception</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setManualModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Authorize Check-In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Start Session Modal */}
      <FacultyStartSessionModal
        isOpen={startSessionModalOpen}
        onClose={() => setStartSessionModalOpen(false)}
      />
    </div>
  );
};
