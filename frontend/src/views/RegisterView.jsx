import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { AttendQRLogo } from '../components/AttendQRLogo.jsx';
import {
  GraduationCap,
  Briefcase,
  Building,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  validateEmail,
  validatePassword,
  validateRequiredText,
} from '../utils/validators';
import { apiRequest } from '../utils/api.js';
import {
  getAllIndianColleges,
  registerCustomCollege,
  STANDARD_DEPARTMENTS,
} from '../data/indianColleges';

export const RegisterView = () => {
  const { completeAuthentication, setCurrentView, setIsAuthModalOpen, theme } = useApp();

  const [step, setStep] = useState(1); // 1: Role, 2: Account, 3: College

  // Step 1: Role
  const [selectedRole, setSelectedRole] = useState('student'); // 'student' | 'faculty' | 'admin'

  // Step 2: Account
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Step 3: College & Department (All Over India + Custom option)
  const [allColleges, setAllColleges] = useState(() => getAllIndianColleges());
  const [collegeSearch, setCollegeSearch] = useState('');
  const [selectedCollegeName, setSelectedCollegeName] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [rollNumber, setRollNumber] = useState('');

  // Custom College Modal
  const [isCustomCollegeOpen, setIsCustomCollegeOpen] = useState(false);
  const [customClgName, setCustomClgName] = useState('');
  const [customClgCity, setCustomClgCity] = useState('');
  const [customClgState, setCustomClgState] = useState('');
  const [customClgCode, setCustomClgCode] = useState('');

  // Custom Department Modal
  const [isCustomDeptOpen, setIsCustomDeptOpen] = useState(false);
  const [customDeptName, setCustomDeptName] = useState('');

  // Error & Success
  const [errorMsg, setErrorMsg] = useState('');
  const [successFinish, setSuccessFinish] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const selectedCollege = allColleges.find((college) => college.name === selectedCollegeName);
  const availableDepartments = useMemo(
    () => [...new Set([...(selectedCollege?.departments ?? []), ...STANDARD_DEPARTMENTS])],
    [selectedCollege]
  );
  const matchingColleges = useMemo(() => {
    const query = collegeSearch.trim().toLowerCase();
    return allColleges.filter((college) =>
      `${college.name} ${college.city} ${college.state}`.toLowerCase().includes(query)
    );
  }, [allColleges, collegeSearch]);
  const filteredColleges = useMemo(() => {
    if (
      selectedCollege &&
      !matchingColleges.some((college) => college.name === selectedCollege.name)
    ) {
      return [selectedCollege, ...matchingColleges];
    }
    return matchingColleges;
  }, [matchingColleges, selectedCollege]);

  const openCustomCollege = () => {
    setCustomClgName(collegeSearch.trim());
    setIsCustomCollegeOpen(true);
  };

  // Advance Step 1 -> Step 2
  const handleStep1Continue = () => {
    setErrorMsg('');
    if (selectedRole !== 'student') {
      setErrorMsg('Faculty and administrator accounts require an authorized college invitation. Student self-registration is available now.');
      return;
    }
    setStep(2);
  };

  // Advance Step 2 -> Step 3
  const handleStep2Continue = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const valName = validateRequiredText(fullName, 'Full name', 3);
    if (!valName.isValid || fullName.trim().length > 120) {
      setErrorMsg(valName.message || 'Full name must be 120 characters or fewer.');
      return;
    }

    const valEmail = validateEmail(email);
    if (!valEmail.isValid || email.length > 254) {
      setErrorMsg(valEmail.message || 'Email must be 254 characters or fewer.');
      return;
    }

    if (phone.length > 20) {
      setErrorMsg('Phone number must be 20 characters or fewer.');
      return;
    }
    if (phone.trim() && !/^(?:\+?91[\s-]?)?[6-9]\d{9}$/.test(phone.replace(/[\s()-]/g, ''))) {
      setErrorMsg('Enter a valid Indian mobile number or leave the optional field empty.');
      return;
    }

    const valPass = validatePassword(password);
    if (!valPass.isValid || password.length < 12 || new TextEncoder().encode(password).length > 128) {
      setErrorMsg('Use a password between 12 and 128 bytes.');
      return;
    }

    setStep(3);
  };

  // Create Custom College
  const handleSaveCustomCollege = (e) => {
    e.preventDefault();
    if (!customClgName.trim()) return;

    const existingCollege = allColleges.find(
      (college) => college.name.trim().toLowerCase() === customClgName.trim().toLowerCase()
    );
    if (existingCollege) {
      setSelectedCollegeName(existingCollege.name);
      setSelectedDept('');
      setCollegeSearch('');
      setIsCustomCollegeOpen(false);
      return;
    }

    const newClg = registerCustomCollege({
      name: customClgName.trim(),
      city: customClgCity.trim(),
      state: customClgState.trim(),
      code: customClgCode.trim(),
    });

    setAllColleges((prev) => [newClg, ...prev]);
    setSelectedCollegeName(newClg.name);
    setSelectedDept('');
    setCollegeSearch('');
    setIsCustomCollegeOpen(false);
    setCustomClgName('');
    setCustomClgCity('');
    setCustomClgState('');
  };

  // Create Custom Department
  const handleSaveCustomDept = (e) => {
    e.preventDefault();
    const departmentName = customDeptName.trim();
    if (!departmentName) return;
    setSelectedDept(departmentName);
    setIsCustomDeptOpen(false);
    setCustomDeptName('');
  };

  const handleCollegeSelection = (collegeName) => {
    const college = allColleges.find((item) => item.name === collegeName);
    setSelectedCollegeName(collegeName);
    setSelectedDept('');
  };

  // Final Step: Complete Registration
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (selectedRole !== 'student') {
      setErrorMsg('Faculty and administrator accounts can only be created through an authorized invitation.');
      return;
    }

    if (!selectedCollegeName.trim() || selectedCollegeName.length > 160) {
      setErrorMsg('Choose a valid college or university name.');
      return;
    }
    if (!selectedDept.trim() || selectedDept.length > 120) {
      setErrorMsg('Enter a department name with 120 characters or fewer.');
      return;
    }
    if (!selectedProgram.trim() || selectedProgram.trim().length > 120) {
      setErrorMsg('Enter a degree program with 120 characters or fewer.');
      return;
    }
    if (rollNumber.trim().length > 32) {
      setErrorMsg('Enrollment number must be 32 characters or fewer.');
      return;
    }

    setIsRegistering(true);
    try {
      const { user: createdUser } = await apiRequest('/auth/register', {
        method: 'POST',
        body: {
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim(),
          institutionName: selectedCollegeName,
          department: selectedDept,
          program: selectedProgram.trim(),
          enrollmentNumber: rollNumber.trim().toUpperCase(),
        },
      });
      completeAuthentication(createdUser);
      setSuccessFinish(true);
      window.setTimeout(() => {
        setSuccessFinish(false);
        setCurrentView('student');
      }, 900);
    } catch (requestError) {
      setErrorMsg(requestError.message);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-between max-w-xl mx-auto px-4 py-8">
      {/* Top Header matching Screenshot Pages 11 & 12 */}
      <div className="flex w-full min-w-0 flex-col items-stretch gap-3 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <AttendQRLogo theme={theme} size="sm" showTagline={false} />

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs sm:justify-end">
          <span className="leading-5 text-slate-500">Already have an account?</span>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="shrink-0 font-bold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Sign in
          </button>
        </div>
      </div>

      {/* Step Indicator Progress matching Screenshot Pages 11 & 12 */}
      <div className="flex items-center justify-center gap-3 py-4 text-xs font-semibold text-slate-400">
        <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-indigo-600 font-bold' : ''}`}>
          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
            1
          </span>
          <span>Role</span>
        </div>
        <span className="w-6 h-0.5 bg-slate-200 dark:bg-slate-800" />
        <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-indigo-600 font-bold' : ''}`}>
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}
          >
            2
          </span>
          <span>Account</span>
        </div>
        <span className="w-6 h-0.5 bg-slate-200 dark:bg-slate-800" />
        <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-indigo-600 font-bold' : ''}`}>
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}
          >
            3
          </span>
          <span>College</span>
        </div>
      </div>

      {errorMsg && (
        <div className="my-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Role Selection matching Screenshot Page 12 */}
      {step === 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Who are you signing up as?
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
            Student accounts are self-registered. Staff roles require a verified invitation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Student Card */}
            <div
              onClick={() => setSelectedRole('student')}
              className={`p-5 rounded-2xl border-2 text-center cursor-pointer transition-all ${
                selectedRole === 'student'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900 text-indigo-600 mx-auto flex items-center justify-center mb-3">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Student</h3>
              <p className="text-[11px] text-slate-500 mt-1">Scan QRs, track attendance</p>
            </div>

            {/* Faculty Card */}
            <div
              onClick={() => setSelectedRole('faculty')}
              className={`p-5 rounded-2xl border-2 text-center cursor-pointer transition-all ${
                selectedRole === 'faculty'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900 text-cyan-600 mx-auto flex items-center justify-center mb-3">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Faculty</h3>
              <p className="text-[11px] text-slate-500 mt-1">Start sessions, mark classes</p>
            </div>

            {/* College Admin Card */}
            <div
              onClick={() => setSelectedRole('admin')}
              className={`p-5 rounded-2xl border-2 text-center cursor-pointer transition-all ${
                selectedRole === 'admin'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900 text-purple-600 mx-auto flex items-center justify-center mb-3">
                <Building className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">College Admin</h3>
              <p className="text-[11px] text-slate-500 mt-1">Setup the whole workspace</p>
            </div>
          </div>

          <button
            onClick={handleStep1Continue}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 2: Account Creation matching Screenshot Page 11 */}
      {step === 2 && (
        <form
          onSubmit={handleStep2Continue}
          noValidate
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
        >
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Create your account
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Account details are securely stored. Email verification is required to create an institution workspace.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full name
            </label>
            <input
              type="text"
              required
              autoComplete="name"
              minLength={2}
              maxLength={120}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Aarav Mehta"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Phone (India)
                </label>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional, e.g. +91 98765 43210"
                autoComplete="tel"
                maxLength={20}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">
            Phone is optional and is not verified. Do not rely on it for account recovery.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="12–128 characters"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: Where do you study/teach? matching Screenshot Page 11 */}
      {step === 3 && (
        <form
          onSubmit={handleCompleteRegistration}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
        >
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Where do you study/teach?
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your details as they appear in your institution's records.
            </p>
          </div>

          {/* National institution directory with a custom-entry path for unlisted campuses. */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                College / University
              </label>
              <button
                type="button"
                onClick={openCustomCollege}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Your College</span>
              </button>
            </div>

            <div className="relative mb-2">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={collegeSearch}
                onChange={(e) => setCollegeSearch(e.target.value)}
                placeholder="Search by institution, city, or state"
                aria-label="Search colleges and universities by name, city, or state"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <select
              value={selectedCollegeName}
              onChange={(e) => handleCollegeSelection(e.target.value)}
              aria-label="Select your college or university"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>
                Select your college or university
              </option>
              {filteredColleges.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} ({c.city}, {c.state})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
              This curated directory is not exhaustive. If yours is missing, add its name and
              location.
            </p>
            {collegeSearch.trim() && matchingColleges.length === 0 && (
              <button
                type="button"
                onClick={openCustomCollege}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                <Plus className="h-3.5 w-3.5" />
                Add “{collegeSearch.trim()}” as your institution
              </button>
            )}
          </div>

          {/* Department & Program Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Department
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomDeptOpen(true)}
                  disabled={!selectedCollegeName}
                  className="text-[10px] font-bold text-indigo-600 hover:underline"
                >
                  + Add Dept
                </button>
              </div>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                disabled={!selectedCollegeName}
                aria-label="Select your department"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="" disabled>
                  Select your department
                </option>
                {[
                  ...availableDepartments,
                  ...(availableDepartments.includes(selectedDept) ? [] : [selectedDept]),
                ].map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Degree Program
              </label>
              <input
                type="text"
                required
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                maxLength={120}
                placeholder="e.g. BCA, B.Tech, MCA"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">
            Institution and enrollment details are saved as unverified profile claims. They do
            not confirm enrollment or grant access to college records.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Roll number / Employee ID
            </label>
            <input
              type="text"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="Optional"
              maxLength={32}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={isRegistering}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 disabled:cursor-wait disabled:opacity-60"
            >
              <span>{isRegistering ? 'Creating account…' : 'Create account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Success Modal Confirmation */}
      {successFinish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Account Created
            </h3>
            <p className="text-xs text-slate-500">
              Welcome, {fullName}. Your selected institution and department were saved to your profile.
            </p>
          </div>
        </div>
      )}

      {/* Custom college entry for institutions not in the curated directory. */}
      {isCustomCollegeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="custom-college-title"
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h4 id="custom-college-title" className="font-bold text-slate-900 dark:text-white text-base">
                Add Custom College / Institution
              </h4>
              <button
                type="button"
                onClick={() => setIsCustomCollegeOpen(false)}
                aria-label="Close add college dialog"
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomCollege} className="space-y-3">
              <div>
                <label
                  htmlFor="custom-college-name"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Full College / University Name
                </label>
                <input
                  id="custom-college-name"
                  type="text"
                  required
                  maxLength={150}
                  value={customClgName}
                  onChange={(e) => setCustomClgName(e.target.value)}
                  placeholder="e.g. Thakur College of Engineering & Technology"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="custom-college-city"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    City
                  </label>
                  <input
                    id="custom-college-city"
                    type="text"
                    required
                    maxLength={100}
                    value={customClgCity}
                    onChange={(e) => setCustomClgCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="custom-college-state"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    State
                  </label>
                  <input
                    id="custom-college-state"
                    type="text"
                    required
                    maxLength={100}
                    value={customClgState}
                    onChange={(e) => setCustomClgState(e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="custom-college-code"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  College Code (Optional)
                </label>
                <input
                  id="custom-college-code"
                  type="text"
                  value={customClgCode}
                  onChange={(e) => setCustomClgCode(e.target.value)}
                  placeholder="e.g. TCET"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none font-mono uppercase"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomCollegeOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl"
                >
                  Save & Select College
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom department entry for programmes not in the common catalogue. */}
      {isCustomDeptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="custom-department-title"
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              <span id="custom-department-title">Add Custom Department</span>
            </h4>
            <form onSubmit={handleSaveCustomDept} className="space-y-3">
              <label
                htmlFor="custom-department-name"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Department or programme name
              </label>
              <input
                id="custom-department-name"
                type="text"
                required
                maxLength={100}
                value={customDeptName}
                onChange={(e) => setCustomDeptName(e.target.value)}
                placeholder="e.g. Data Science & Cyber Security"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomDeptOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl"
                >
                  Add Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="text-center text-[11px] text-slate-400 py-2">
        AttendQR Multi-Tenant Institutional Directory • India
      </div>
    </div>
  );
};
