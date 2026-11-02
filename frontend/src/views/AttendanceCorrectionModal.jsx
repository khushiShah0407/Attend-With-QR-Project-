import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HelpCircle, CheckCircle2, AlertCircle, Upload, ShieldCheck, FileText } from 'lucide-react';

export const AttendanceCorrectionModal = () => {
  const { isCorrectionModalOpen, setIsCorrectionModalOpen, submitCorrection, subjects, user } =
    useApp();

  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.name || 'Advanced Java Programming');
  const [sessionDate, setSessionDate] = useState('2026-10-24');
  const [reasonCategory, setReasonCategory] = useState('Camera malfunction');
  const [explanation, setExplanation] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isCorrectionModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!explanation.trim()) {
      setErrorMsg('Please describe the circumstance in detail.');
      return;
    }

    submitCorrection({
      subject: selectedSubject,
      date: sessionDate,
      reason: `${reasonCategory}: ${explanation.trim()}`,
      supportingDocument: documentName || 'Verified In-Person Attendance Slip',
    });

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setIsCorrectionModalOpen(false);
      setExplanation('');
      setDocumentName('');
    }, 1800);
  };

  const handleSimulatedFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentName(file.name);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <button
          onClick={() => setIsCorrectionModalOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
        >
          ✕
        </button>

        {isSubmitted ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Correction Request Submitted!
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your request for <strong>{selectedSubject}</strong> on {sessionDate} has been sent to
              faculty for digital review and approval.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>AICTE Compliant Workflow</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Smart Attendance Recovery
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Submit a verified exception request with institutional audit trail
              </p>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject / Lecture
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
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
                  Lecture Date
                </label>
                <input
                  type="date"
                  required
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category of Issue
              </label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
              >
                <option>Camera malfunction / optical blur</option>
                <option>Campus network connectivity failure</option>
                <option>Authorized medical leave certificate</option>
                <option>University Sports / Cultural Representation</option>
                <option>Faculty-approved classroom attendance exception</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Detailed Explanation
              </label>
              <textarea
                rows={3}
                required
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain the circumstance, classroom room number, and time..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Optional Supporting Document Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supporting Document (Medical certificate, slip, or note)
              </label>
              <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-3 text-center cursor-pointer transition-colors">
                <input
                  type="file"
                  onChange={handleSimulatedFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Upload className="w-4 h-4 text-indigo-500" />
                  <span>{documentName || 'Click or drag file to attach (PDF, PNG, JPG)'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCorrectionModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Submit Correction Request
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
