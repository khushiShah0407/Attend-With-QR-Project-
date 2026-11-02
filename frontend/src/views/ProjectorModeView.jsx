import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { QRCodeDisplay } from '../components/QRCodeDisplay.jsx';
import { ArrowLeft, Maximize2, Minimize2, Users, Clock, ShieldCheck } from 'lucide-react';

export const ProjectorModeView = () => {
  const { liveSession, sessionRemainingSec, currentQrToken, setCurrentView, user } = useApp();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const totalEnrolled = liveSession.totalEnrolled || 48;
  const checkedInCount = liveSession.checkIns.length;
  const checkedInPercent = Math.round((checkedInCount / totalEnrolled) * 100);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-white flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Top Header Bar matching Screenshot Page 9 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-800/80 pb-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <button
            onClick={() => setCurrentView('faculty')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span className="block truncate">{user.collegeName}</span>
            </div>
            <div className="break-words text-sm sm:text-lg font-extrabold text-white leading-snug">
              {liveSession.program} - {liveSession.semester} - {liveSession.division} • Room: {liveSession.classroom}
            </div>
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
          <span className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            LIVE BROADCAST
          </span>

          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Center Hero: Massive Scannable Dynamic QR + Live Countdown & Progress */}
      <div className="max-w-5xl mx-auto w-full my-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-slate-900/60 p-8 sm:p-12 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md">
          {/* Giant Dynamic QR Container (6 Cols) */}
          <div className="md:col-span-6 flex justify-center">
            <div className="relative p-5 bg-white rounded-3xl shadow-2xl shadow-indigo-500/10">
              <QRCodeDisplay
                value={currentQrToken}
                size={300}
                remainingSec={sessionRemainingSec}
                totalSec={liveSession.rotationIntervalSec || 15}
                darkDisplay={false}
              />
            </div>
          </div>

          {/* Right Metrics & Countdown (6 Cols) matching Screenshot Page 9 */}
          <div className="md:col-span-6 space-y-6">
            {/* Countdown Box */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                  Rotation Timer
                </span>
                <div className="text-xs text-slate-500 mt-0.5">
                  Dynamic cryptographic salt refreshes
                </div>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl sm:text-5xl font-extrabold text-indigo-400 font-mono">
                  {sessionRemainingSec}
                </span>
                <span className="text-sm font-bold text-slate-400">sec</span>
              </div>
            </div>

            {/* Attendance Count Progress Box */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                    Attendance Progress
                  </span>
                  <div className="text-2xl font-extrabold text-white font-mono mt-0.5">
                    {checkedInCount} / {totalEnrolled}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  style={{ width: `${checkedInPercent}%` }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                />
              </div>

              <div className="flex justify-between text-xs text-slate-400">
                <span>{checkedInPercent}% of students in room</span>
                <span className="text-emerald-400 font-bold">On track</span>
              </div>
            </div>

            {/* Session Info */}
            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <div className="text-[11px] font-mono text-indigo-400 font-bold">
                SESSION: {liveSession.code}
              </div>
              <div className="text-sm font-bold text-white">
                {liveSession.subjectName}
              </div>
              <div className="text-slate-400 text-xs">
                Faculty: {liveSession.facultyName} • {liveSession.startedAt} - {liveSession.endsAt}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Notice */}
      <div className="text-center pt-4 border-t border-slate-900 text-xs text-slate-500 flex items-center justify-center gap-3">
        <ShieldCheck className="w-4 h-4 text-indigo-400" />
        <span>
          Point your phone camera at the QR. Each code expires in {liveSession.rotationIntervalSec || 15}s.
          Proxy screenshots are automatically rejected.
        </span>
      </div>
    </div>
  );
};
