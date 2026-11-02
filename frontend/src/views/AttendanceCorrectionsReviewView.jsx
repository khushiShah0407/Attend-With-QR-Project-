import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Search,
  Filter,
  ShieldCheck,
  AlertCircle,
  Eye,
  Check,
  X,
  Calendar,
  User,
  GraduationCap,
} from 'lucide-react';

export const AttendanceCorrectionsReviewView = () => {
  const { corrections, approveCorrection, rejectCorrection, user } = useApp();
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'Pending' | 'Approved' | 'Rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCorrection, setSelectedCorrection] = useState(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [targetRejectId, setTargetRejectId] = useState(null);

  const pendingCount = corrections.filter((c) => c.status === 'Pending').length;
  const approvedCount = corrections.filter((c) => c.status === 'Approved').length;
  const rejectedCount = corrections.filter((c) => c.status === 'Rejected').length;

  const filteredCorrections = corrections.filter((c) => {
    const matchesStatus =
      filterStatus === 'ALL' || c.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch =
      c.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleOpenRejectModal = (id) => {
    setTargetRejectId(id);
    setRejectReasonInput('Insufficient attendance justification / outside permitted grace period');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = (e) => {
    e.preventDefault();
    if (targetRejectId) {
      rejectCorrection(targetRejectId, rejectReasonInput);
      setIsRejectModalOpen(false);
      setTargetRejectId(null);
      setRejectReasonInput('');
    }
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Digital Governance & AICTE Audit Trail</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Attendance Corrections Review
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Evaluate student exception claims, medical leave, camera errors, and approve or reject with institutional records
          </p>
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs">
            <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>{pendingCount} Pending Review</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Status Tab Pills */}
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {[
            { id: 'ALL', label: 'All', count: corrections.length },
            { id: 'Pending', label: 'Pending', count: pendingCount },
            { id: 'Approved', label: 'Approved', count: approvedCount },
            { id: 'Rejected', label: 'Rejected', count: rejectedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filterStatus === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filterStatus === tab.id
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student or roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Corrections List */}
      {filteredCorrections.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No exception requests found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All attendance recovery requests have been resolved.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCorrections.map((item) => {
            const isPending = item.status === 'Pending';
            const isApproved = item.status === 'Approved';
            const isRejected = item.status === 'Rejected';

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-all hover:border-indigo-200 dark:hover:border-indigo-900"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Student & Class Info */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-sm flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900">
                      {item.studentName?.slice(0, 2).toUpperCase() || 'ST'}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {item.studentName}
                        </span>
                        <span className="font-mono text-xs text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                          {item.rollNumber}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isPending
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : isApproved
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {item.subject}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          {item.date}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 pt-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Reason: </span>
                        {item.reason}
                      </p>

                      {item.supportingDocument && (
                        <div className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium pt-0.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Attachment: {item.supportingDocument}</span>
                        </div>
                      )}

                      {item.reviewedBy && (
                        <div className="text-[10px] text-slate-400 pt-1">
                          Reviewed by <strong>{item.reviewedBy}</strong> on {item.reviewedAt || 'Today'}
                          {item.rejectionReason && ` — Reason: "${item.rejectionReason}"`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons for Faculty/Admin */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => approveCorrection(item.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve Present</span>
                        </button>

                        <button
                          onClick={() => handleOpenRejectModal(item.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                        {isApproved ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500" />
                        )}
                        <span>Audit Saved</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Reason Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Reject Attendance Exception
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Provide an official institutional rationale for why this attendance request is being turned down.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4 mt-4">
              <textarea
                rows={3}
                required
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
