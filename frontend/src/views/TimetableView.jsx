import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, MapPin, User, Calendar, QrCode } from 'lucide-react';

export const TimetableView = () => {
  const { timetable, user, setCurrentView } = useApp();
  const [selectedSlot, setSelectedSlot] = useState(null);

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const times = ['09:00', '10:30', '12:30', '14:00', '15:30'];
  const sortedTimetable = [...timetable].sort(
    (first, second) =>
      days.indexOf(first.day) - days.indexOf(second.day) ||
      times.indexOf(first.timeSlot) - times.indexOf(second.timeSlot)
  );

  const colorStyles = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200',
    teal: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200',
    blue: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200',
    indigo: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200',
    amber: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200',
    cyan: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200',
    sky: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200',
    rose: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header matching Screenshot Page 7 & 8 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Timetable
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {user.collegeName} • {user.program} {user.semester} - {user.division}
          </p>
        </div>

        {timetable.length > 0 && (
          <button
            onClick={() => setCurrentView('scan')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
          >
            <QrCode className="h-4 w-4" />
            <span>Scan Current Lecture</span>
          </button>
        )}
      </div>

      {/* Responsive Timetable Grid matching Screenshot Pages 7 & 8 */}
      {timetable.length === 0 ? (
        <section role="status" className="rounded-3xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900 sm:p-10">
          <Calendar className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">No published timetable</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">
            Timetable entries are not connected to the database yet. This view will remain empty until your institution publishes real schedule data.
          </p>
        </section>
      ) : (
      <>
        <div className="space-y-4 xl:hidden">
          {days.map((day) => {
            const daySlots = sortedTimetable.filter((slot) => slot.day === day);
            if (daySlots.length === 0) return null;

            return (
              <section
                key={day}
                aria-label={`${day} classes`}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <h2 className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200">
                  {day}
                </h2>
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {daySlots.map((slot) => {
                    const colorClass = colorStyles[slot.color] || colorStyles.indigo;
                    return (
                      <li key={`${slot.day}-${slot.timeSlot}-${slot.subjectCode}`}>
                        <button
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`flex min-h-20 w-full min-w-0 items-center gap-3 p-4 text-left ${colorClass}`}
                        >
                          <span className="flex w-16 shrink-0 flex-col items-center gap-1 text-[11px] font-bold">
                            <Clock className="h-4 w-4" aria-hidden="true" />
                            {slot.timeSlot}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[10px] font-bold uppercase tracking-wide opacity-75">
                              {slot.subjectCode}
                            </span>
                            <span className="mt-0.5 block break-words text-sm font-bold leading-snug">
                              {slot.subjectName}
                            </span>
                            <span className="mt-1 flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-xs opacity-80">
                              <span className="inline-flex min-w-0 items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                <span className="break-words">{slot.room}</span>
                              </span>
                              <span className="inline-flex min-w-0 items-center gap-1">
                                <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                <span className="break-words">{slot.facultyName}</span>
                              </span>
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>

        <div className="hidden overflow-x-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6 xl:block">
          <div className="min-w-[800px]">
          {/* Day Headers Row */}
          <div className="grid grid-cols-7 gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-center">
            <div className="text-[11px] font-bold text-slate-400 uppercase py-2">
              Time
            </div>
            {days.map((day) => (
              <div
                key={day}
                className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Time Slot Rows */}
          <div className="space-y-3 pt-3">
            {times.map((timeSlot) => (
              <div key={timeSlot} className="grid grid-cols-7 gap-2 items-stretch">
                {/* Time Label */}
                <div className="flex items-center justify-center font-mono text-xs font-bold text-slate-400 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl">
                  {timeSlot}
                </div>

                {/* Day Cells */}
                {days.map((day) => {
                  const match = timetable.find(
                    (slot) => slot.day === day && slot.timeSlot === timeSlot
                  );

                  if (!match) {
                    return (
                      <div
                        key={`${day}-${timeSlot}`}
                        className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-2 text-center text-[11px] text-slate-400 flex items-center justify-center min-h-[88px]"
                      >
                        —
                      </div>
                    );
                  }

                  const colorClass = colorStyles[match.color] || colorStyles.indigo;

                  return (
                    <div
                      key={`${day}-${timeSlot}`}
                      onClick={() => setSelectedSlot(match)}
                      className={`rounded-2xl border p-2.5 text-left cursor-pointer transition-all hover:scale-[1.02] shadow-xs flex flex-col justify-between min-h-[96px] ${colorClass}`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/60 dark:bg-slate-900/60">
                            {match.subjectCode}
                          </span>
                        </div>
                        <div className="font-bold text-[11px] line-clamp-2 leading-tight">
                          {match.subjectName}
                        </div>
                      </div>

                      <div className="mt-2 text-[10px] opacity-80 flex items-center justify-between">
                        <span>{match.room}</span>
                        <span className="truncate max-w-[65px]">{match.facultyName}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        </div>
      </>
      )}

      {/* Selected Lecture Details Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-sm space-y-4 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                {selectedSlot.subjectCode}
              </span>
              <button
                onClick={() => setSelectedSlot(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {selectedSlot.subjectName}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Scheduled weekly on {selectedSlot.day} at {selectedSlot.timeSlot}
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Time: {selectedSlot.timeSlot} (60 min)</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>Classroom: {selectedSlot.room}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span>Faculty: {selectedSlot.facultyName}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedSlot(null);
                setCurrentView('scan');
              }}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              Scan for this lecture
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
