import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Check, ArrowRight, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export const PricingView = () => {
  const { setCurrentView } = useApp();
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const plans = [
    {
      id: 'free',
      name: 'FREE TRIAL',
      price: '₹0',
      period: '/ 14 days',
      subhead: 'Explore every workflow risk-free',
      buttonText: 'Start free trial',
      buttonStyle: 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50',
      features: [
        '1 college workspace',
        '2 faculty, 50 students',
        '20 attendance sessions',
        'Basic QR attendance',
        '30-day history',
      ],
    },
    {
      id: 'basic',
      name: 'BASIC',
      price: billingCycle === 'annual' ? '₹399' : '₹499',
      period: '/mo',
      subhead: 'A single department starting out',
      buttonText: 'Choose Basic',
      buttonStyle: 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800',
      features: [
        '5 faculty, 200 students',
        '100 sessions / month',
        'Dynamic QR (15s rotation)',
        'PDF & CSV exports',
        '6-month history',
      ],
    },
    {
      id: 'pro',
      name: 'PRO',
      badge: 'Most popular',
      price: billingCycle === 'annual' ? '₹1,199' : '₹1,499',
      period: '/mo',
      subhead: 'The whole college, done properly',
      buttonText: 'Choose Pro',
      buttonStyle: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/30',
      features: [
        '25 faculty, 1,000 students',
        '1,000 sessions / month',
        'Advanced analytics',
        'Correction workflow',
        'Timetable, alerts',
        '2-year history',
      ],
    },
    {
      id: 'premium',
      name: 'PREMIUM',
      price: billingCycle === 'annual' ? '₹3,999' : '₹4,999',
      period: '/mo',
      subhead: 'Universities with multiple campuses',
      buttonText: 'Choose Premium',
      buttonStyle: 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800',
      features: [
        '100 faculty, 5,000 students',
        '10,000 sessions / month',
        'Advanced QR security',
        'Custom report branding',
        'Audit logs',
        'Priority support',
      ],
    },
  ];

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setCheckoutModal(true);
    setPaymentSuccess(false);
  };

  const handleSimulateRazorpay = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      setCheckoutModal(false);
      setPaymentSuccess(false);
      setCurrentView('admin');
    }, 1800);
  };

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      {/* Title */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
          <span>₹ Pricing in ₹ • GST extra</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Pick a plan. Scale a department.
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400">
          14 days free. Switch plans anytime. Enterprise? We'll build a quote.
        </p>

        {/* Monthly / Annual Toggle */}
        <div className="pt-4 flex items-center justify-center">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Annual</span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid matching Screenshot Pages 1, 13, 16 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {plans.map((p) => {
          const isPro = p.id === 'pro';
          return (
            <div
              key={p.id}
              className={`relative bg-white dark:bg-slate-900 rounded-3xl p-7 flex flex-col justify-between border transition-all ${
                isPro
                  ? 'border-indigo-500 shadow-xl shadow-indigo-500/10 scale-[1.02] ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md'
              }`}
            >
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm">
                  {p.badge}
                </div>
              )}

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {p.name}
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono">
                    {p.price}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{p.period}</span>
                </div>

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 min-h-[32px]">
                  {p.subhead}
                </p>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  {p.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4">
                <button
                  onClick={() => handleSelectPlan(p)}
                  className={`w-full py-3 rounded-xl text-xs font-bold transition-all ${p.buttonStyle}`}
                >
                  {p.buttonText}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enterprise Banner matching Screenshot Page 16 */}
      <div className="bg-slate-950 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-2xl">
          <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
            CUSTOM
          </div>
          <h3 className="text-2xl font-bold tracking-tight">
            Enterprise & multi-campus universities
          </h3>
          <p className="text-sm text-slate-400">
            10,000+ students, dedicated support, custom SLAs, on-premise option, SSO. Let's design the
            right fit.
          </p>
        </div>

        <button
          onClick={() => setCurrentView('contacts')}
          className="px-6 py-3 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl shrink-0 transition-colors shadow-sm"
        >
          Talk to sales
        </button>
      </div>

      {/* Checkout Modal Simulation with Razorpay */}
      {checkoutModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            {paymentSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Payment Verified!
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedPlan.name} plan activated for Pillai College of Engineering. Redirecting to workspace...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-slate-900 dark:text-white">
                      Razorpay Checkout
                    </span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded">
                      UPI • Cards • NetBanking
                    </span>
                  </div>
                  <button
                    onClick={() => setCheckoutModal(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Plan Selected:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedPlan.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Billing Cycle:</span>
                    <span className="font-semibold text-slate-900 dark:text-white capitalize">
                      {billingCycle}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-800 font-bold">
                    <span className="text-slate-900 dark:text-white">Total Amount:</span>
                    <span className="text-indigo-600 text-sm">{selectedPlan.price}</span>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl text-[11px] text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Secured by Razorpay India 256-bit payment gateway. Instant invoice generated.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setCheckoutModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSimulateRazorpay}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Pay {selectedPlan.price}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
