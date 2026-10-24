import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';
import {
  Shield,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  FolderLock,
  FileText,
} from 'lucide-react';

interface RegisterRoleProps {
  role: 'OWNER' | 'VIEWER';
}

const COUNTRY_CODES = [
  { code: '+1', country: 'US / CA' },
  { code: '+44', country: 'UK' },
  { code: '+91', country: 'IN' },
  { code: '+49', country: 'DE' },
  { code: '+33', country: 'FR' },
  { code: '+61', country: 'AU' },
  { code: '+81', country: 'JP' },
  { code: '+65', country: 'SG' },
  { code: '+971', country: 'UAE' },
];

export const RegisterRolePage: React.FC<RegisterRoleProps> = ({ role }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite') || '';

  // Form details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // UI status
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Password strength calculation
  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };
  const strengthScore = calculateStrength(password);

  const getStrengthLabel = (score: number) => {
    if (score <= 1) return { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-400' };
    if (score <= 3) return { label: 'Medium', color: 'bg-amber-500', text: 'text-amber-400' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400' };
  };

  const fullPhoneNumber = `${countryCode} ${mobileNumber.trim()}`;

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid corporate email address.');
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.trim().length < 7) {
      setErrorMsg('Please provide a valid mobile number with country code.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your entries.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('You must acknowledge and accept TrustVault zero-trust terms.');
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: Dispatch Email OTP
      await authService.requestEmailOtp(email.trim().toLowerCase());

      // Store form registration cache in sessionStorage for the /verify-email screen
      sessionStorage.setItem(
        'trustvault_pending_reg',
        JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: fullPhoneNumber,
          password,
          role,
          inviteToken: inviteToken || undefined,
        })
      );

      showToast('OTP Dispatched', `Verification code sent to ${email}`, 'success');
      navigate(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}&role=${role}`);
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please check your details.';
      setErrorMsg(msg);
      showToast('Registration Error', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isOwner = role === 'OWNER';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0A0D14] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* LEFT BRANDING PANEL */}
      <div className="lg:w-5/12 bg-gradient-to-b from-[#0D121F] via-[#101726] to-[#0A0D14] p-8 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#151D30] relative overflow-hidden">
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-purple-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-all shadow-[0_0_25px_rgba(16,185,129,0.25)]">
              <Shield className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
                Trust<span className="text-emerald-400">Vault</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-emerald-400/80 block -mt-1 font-mono">
                Zero-Trust
              </span>
            </div>
          </Link>

          <div className="mt-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
              {isOwner ? <FolderLock className="w-3.5 h-3.5 text-emerald-400" /> : <Eye className="w-3.5 h-3.5 text-purple-400" />}
              <span>{isOwner ? 'Document Owner Registration' : 'Viewer Registration'}</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {isOwner ? (
                <>
                  Vault Sovereignty. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                    Admin Authorized.
                  </span>
                </>
              ) : (
                <>
                  Secure Access. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400">
                    Instant Viewing.
                  </span>
                </>
              )}
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              {isOwner
                ? 'Create a Document Owner account to upload documents, manage private vaults, and configure granular permissions. Requires Admin approval.'
                : 'Create a Viewer account for instant access to view documents explicitly shared with your verified identity.'}
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/80 flex flex-wrap gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span>Argon2id Salted Hashing</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Real Email OTP Verification</span>
          </div>
        </div>
      </div>

      {/* RIGHT REGISTRATION FORM */}
      <div className="lg:w-7/12 flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-[#080B12]">
        <div className="w-full max-w-xl">
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-5 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Choose a different role</span>
          </Link>

          {/* Role switcher toggle */}
          <div className="flex p-1 bg-[#0E1424] border border-slate-800 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => navigate('/register/owner')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isOwner
                  ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderLock className="w-3.5 h-3.5" />
              <span>Document Owner</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/register/viewer')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                !isOwner
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Viewer</span>
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Register as {isOwner ? 'Document Owner' : 'Viewer'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {isOwner
                ? 'Fill in your corporate details. A single-use email OTP will verify your address.'
                : 'Enter your credentials to begin receiving secure document grants.'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* FULL NAME */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Corporate Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* MOBILE NUMBER */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Mobile Number</label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-32 px-3 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                      {c.code} ({c.country})
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* PASSWORDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* STRENGTH */}
            {password && (
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Password Strength:</span>
                  <span className={`font-semibold text-[11px] ${getStrengthLabel(strengthScore).text}`}>
                    {getStrengthLabel(strengthScore).label}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex gap-1">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <div
                      key={idx}
                      className={`flex-1 h-full transition-all duration-300 ${
                        idx <= strengthScore ? getStrengthLabel(strengthScore).color : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* TERMS */}
            <div className="flex items-start gap-3 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 w-4 h-4 accent-emerald-500 bg-slate-900 border-slate-700 rounded"
              />
              <label htmlFor="terms" className="text-xs text-slate-400 leading-relaxed cursor-pointer">
                I acknowledge TrustVault's zero-trust access control, continuous audit logging, and terms.
              </label>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full mt-4 py-3.5 px-4 rounded-xl font-bold text-sm text-slate-950 shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer ${
                isOwner
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-purple-500/20'
              }`}
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Issuing Single-Use OTP...</span>
                </>
              ) : (
                <>
                  <span>Continue to Email Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-slate-400 pt-4 mt-6 border-t border-slate-800 flex items-center justify-between">
            <span>
              Already registered?{' '}
              <Link to="/login" className="text-emerald-400 hover:underline font-semibold">
                Sign in
              </Link>
            </span>
            <span>
              <Link to="/register" className="text-slate-400 hover:text-emerald-400 transition-colors">
                Change role
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
