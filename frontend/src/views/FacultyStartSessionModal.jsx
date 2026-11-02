import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Play, QrCode, Shield, Clock, Users, X, MapPin } from 'lucide-react';

export const FacultyStartSessionModal = ({ isOpen, onClose }) => {
  const { startNewFacultySession, subjects, departments } = useApp();

  const [subjectName, setSubjectName] = useState(subjects[0]?.name || 'Advanced Java Programming');
  const [code, setCode] = useState(subjects[0]?.code || 'BCA501');
  const [department, setDepartment] = useState('Computer Applications');
  const [semester, setSemester] = useState('Semester 5');
  const [division, setDivision] = useState('Division A');
  const [room, setRoom] = useState('Lab 18');
  const [rotationIntervalSec, setRotationIntervalSec] = useState('15');
  const [totalEnrolled, setTotalEnrolled] = useState('48');

  if (!isOpen) return null;

  const handleSubjectSelect = (subName) => {
    setSubjectName(subName);
    const found = subjects.find((s) => s.name === subName);
    if (found) {
      setCode(found.code);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    startNewFacultySession({
      subjectName,
      code,
      department,
      semester,
      division,
      room,
      rotationIntervalSec: parseInt(rotationIntervalSec, 10),
      totalEnrolled: parseInt(totalEnrolled, 10),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
        >
          ✕
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Start Live Attendance Session
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Launch dynamic rotating QR code with campus geofence security
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          {/* Subject & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Course / Subject
              </label>
              <select
                value={subjectName}
                onChange={(e) => handleSubjectSelect(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {subjects.map((s) => (
                  <option key={s.code} value={s.name}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Course Code
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Department & Division */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
              >
                {departments.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Semester / Class
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
              >
                <option>Semester 1</option>
                <option>Semester 2</option>
                <option>Semester 3</option>
                <option>Semester 4</option>
                <option>Semester 5</option>
                <option>Semester 6</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Division
              </label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
              >
                <option>Division A</option>
                <option>Division B</option>
                <option>Division C</option>
              </select>
            </div>
          </div>

          {/* Room, Speed, and Enrolled Count */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Room / Lab
              </label>
              <input
                type="text"
                required
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. Lab 18"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                QR Rotation Speed
              </label>
              <select
                value={rotationIntervalSec}
                onChange={(e) => setRotationIntervalSec(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="10">10 seconds (Ultra-Fast)</option>
                <option value="15">15 seconds (Standard)</option>
                <option value="20">20 seconds (Balanced)</option>
                <option value="30">30 seconds (Relaxed)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Enrolled
              </label>
              <input
                type="number"
                min="5"
                max="300"
                required
                value={totalEnrolled}
                onChange={(e) => setTotalEnrolled(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Geofence notice */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span>Campus Geofence: 150m active around Pillai Campus</span>
            </div>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Enforced</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch Live Session</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
