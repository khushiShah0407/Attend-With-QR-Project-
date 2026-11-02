import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowRight,
  QrCode,
  ShieldCheck,
  Zap,
  Users,
  ChevronDown,
  Sparkles,
  Smartphone,
  BarChart3,
  Building2,
  FileSpreadsheet,
  Lock,
} from 'lucide-react';

export const LandingView = () => {
  const { setCurrentView } = useApp();
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    {
      q: 'How does the rotating QR work?',
      a: 'Server-validated rotating QR attendance is not implemented yet. The app does not currently record attendance, and the QR preview shown in early prototypes is not a valid attendance credential.',
    },
    {
      q: 'Does this work for Indian colleges and universities?',
      a: 'The registration form includes a curated directory of Indian institutions, but it is not an authoritative list and does not verify affiliation. Organization invitations, academic records, and institution-specific policy configuration are not available yet.',
    },
    {
      q: 'Can students mark attendance for a friend (proxy)?',
      a: 'Attendance check-in is not available yet. The current app does not perform classroom, enrollment, or location verification, so it makes no anti-proxy guarantee.',
    },
    {
      q: 'What happens if the internet drops mid-lecture?',
      a: 'Offline attendance is not supported. Check-ins are unavailable until server-side validation and database persistence are implemented. The app will not confirm an offline check-in.',
    },
    {
      q: 'Can we export attendance for the semester?',
      a: 'Attendance reports and PDF, XLSX, and CSV exports are not connected to persisted attendance records yet.',
    },
  ];

  return (
    <div className="space-y-12 py-6 sm:space-y-16 sm:py-8 lg:space-y-20">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-8 sm:gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Hero Text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
              <span>🎓 Built for Indian colleges & universities</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.12]">
              Smart attendance <br className="hidden sm:inline" />
              starts with a <span className="text-indigo-600 dark:text-indigo-500">scan.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              Attend With QR is under active development. Student registration and secure
              session sign-in are connected; attendance sessions, verified QR check-ins, and live
              reports are not available yet.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setCurrentView('register')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
              >
                <span>Get started free</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentView('projector')}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <span>Launch projector mode</span>
              </button>
            </div>

            {/* Implemented foundation indicators */}
            <div className="pt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Student registration API</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-indigo-500" />
                <span>HttpOnly session cookies</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-cyan-500" />
                <span>Unverified institution claims</span>
              </div>
            </div>
          </div>

          {/* Explicitly non-live status panel */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-3xl blur-xl opacity-20 -z-10" />

              <div className="flex min-h-[22rem] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:min-h-[26rem] sm:p-9">
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  Not a live attendance session
                </span>
                <div className="mt-7 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
                  <QrCode className="h-10 w-10" />
                </div>
                <h2 className="mt-5 text-xl font-extrabold text-slate-900 dark:text-white">
                  Attendance features are not connected
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
                  No sample check-ins, live counters, or generated QR credentials are shown here. The next step is a database-backed session and verification workflow.
                </p>
                <div className="mt-6 grid w-full grid-cols-2 gap-3 text-left">
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Account</p>
                    <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">Student signup enabled</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Attendance</p>
                    <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">Not available yet</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Platform: Everything a Department Actually Needs (Matching Screenshot Page 15) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            PRODUCT ROADMAP
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Built toward a connected attendance platform.
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400">
            The capabilities below describe the product direction, not completed functionality.
            In this build, student account registration and email/password sessions are connected;
            attendance, reporting, and the remaining modules are still under development.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {/* Card 1 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Dynamic rotating QR
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Tokens signed server-side rotate every 10–30s. Screenshots and forwarded images die at the door.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950 flex items-center justify-center text-cyan-600 mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Live faculty feed
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              See every check-in the moment it lands. No refreshes, no proxy wars, and instantaneous export.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Insights that matter
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              75% threshold alerts, subject-wise trends, streaks, and smart exam-eligibility projections.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Anti-proxy by design
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Optional GPS radius (Google Maps platform), device checks, and campus network rules.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600 mb-4">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Report-ready
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              PDF, CSV, Excel with college branding, date range filters, and signature lines baked in.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 mb-4">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Multi-tenant safe
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Every query is organization-scoped. College A never sees College B’s student records.
            </p>
          </div>
        </div>
      </section>

      {/* Three Dashboards. Zero Confusion (Matching Screenshot Page 14) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight text-center mb-10">
          Three dashboards. Zero confusion.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Students */}
          <div className="bg-white dark:bg-slate-900 p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-4">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Students</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Create a student account and view the profile details saved by the registration API. Attendance records and schedules are not connected yet.
              </p>
            </div>
            <button
              onClick={() => setCurrentView('register')}
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
            >
              <span>Create student account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Faculty */}
          <div className="bg-white dark:bg-slate-900 p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Faculty</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Faculty accounts and attendance session workflows are not enabled. Staff access requires an authorized invitation workflow that is not available yet.
              </p>
            </div>
            <span className="mt-6 text-xs font-bold text-slate-500">Unavailable — invitation workflow pending</span>
          </div>

          {/* Admins */}
          <div className="bg-white dark:bg-slate-900 p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Admins</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Organization administration, memberships, and institutional data workflows are not enabled yet.
              </p>
            </div>
            <span className="mt-6 text-xs font-bold text-slate-500">Unavailable — administrator provisioning pending</span>
          </div>
        </div>
      </section>

      {/* From Chaos to Roll-Call in 3 Steps (Matching Screenshot Page 14) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-12">
          Planned attendance workflow
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="text-4xl font-extrabold text-indigo-600 font-mono">01</div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Faculty starts session</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Planned: authorized faculty select a scheduled class and create a server-managed attendance session.
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-4xl font-extrabold text-cyan-600 font-mono">02</div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Students scan</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Planned: the server validates student enrollment and a short-lived session token before saving a check-in.
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-4xl font-extrabold text-emerald-600 font-mono">03</div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reports write themselves</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Planned: attendance history, analytics, and report exports calculated from saved attendance records.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section (Matching Screenshot Page 13) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight text-center mb-8">
          Questions, answered.
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 dark:text-white text-sm"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Banner (Matching Screenshot Pages 12 & 13) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-600 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="max-w-2xl space-y-4 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Start marking attendance smarter today.
            </h2>
            <p className="text-indigo-100 text-sm sm:text-base">
              14-day free trial. One college workspace. No credit card required.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-4">
              <button
                onClick={() => setCurrentView('register')}
                className="px-6 py-3 rounded-xl font-bold text-xs bg-white text-indigo-900 hover:bg-indigo-50 shadow-md transition-colors"
              >
                Create your workspace
              </button>
              <button
                onClick={() => setCurrentView('scan')}
                className="px-5 py-3 rounded-xl font-semibold text-xs bg-indigo-800/60 hover:bg-indigo-800 text-white border border-indigo-400/30 transition-colors"
              >
                Try the scanner
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
