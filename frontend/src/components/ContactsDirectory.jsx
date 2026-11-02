import React, { useState } from 'react';
import { CAMPUS_CONTACTS } from '../data/mockData.js';
import { Search, Mail, Phone, Clock, MapPin, Send, CheckCircle2 } from 'lucide-react';

export const ContactsDirectory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [inquiryContact, setInquiryContact] = useState(null);
  const [inquirySubject, setInquirySubject] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySent, setInquirySent] = useState(false);

  const departments = [
    'All',
    'Computer Applications',
    'Information Technology',
    'Administration',
    'Academic Office',
  ];

  const filtered = CAMPUS_CONTACTS.filter((c) => {
    const matchesDept =
      selectedDept === 'All' || c.department.toLowerCase() === selectedDept.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleSendInquiry = (e) => {
    e.preventDefault();
    if (!inquirySubject.trim() || !inquiryMessage.trim()) return;
    setInquirySent(true);
    setTimeout(() => {
      setInquirySent(false);
      setInquiryContact(null);
      setInquirySubject('');
      setInquiryMessage('');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Campus Contacts & Faculty Directory
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Official contact cell, Head of Departments, subject professors & attendance officers
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search professor, HOD, cabin..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Department Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {departments.map((dept) => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedDept === dept
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Contacts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((contact) => (
          <div
            key={contact.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start gap-4">
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-indigo-100 dark:border-indigo-900/50 shadow-xs"
                />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {contact.name}
                  </h3>
                  <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    {contact.role}
                  </div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {contact.department}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <a
                    href={`mailto:${contact.email}`}
                    className="hover:text-indigo-600 transition-colors truncate"
                  >
                    {contact.email}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{contact.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{contact.cabin}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Hours: {contact.hours}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Available on campus
              </span>
              <button
                onClick={() => setInquiryContact(contact)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300 transition-colors"
              >
                Send Message
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Message Modal */}
      {inquiryContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            {inquirySent ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  Message Delivered!
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Sent directly to {inquiryContact.name} ({inquiryContact.email})
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    Message to {inquiryContact.name}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setInquiryContact(null)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject / Reason
                  </label>
                  <input
                    type="text"
                    value={inquirySubject}
                    onChange={(e) => setInquirySubject(e.target.value)}
                    placeholder="e.g. Attendance exception for Lab 18"
                    required
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="Provide roll number and details..."
                    required
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setInquiryContact(null)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send In-App Memo
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
