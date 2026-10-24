import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Shield,
  ShieldCheck,
  FileText,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { getRoleLandingRoute } from '../../types';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  // Math CAPTCHA
  const [captchaA, setCaptchaA] = useState(0);
  const [captchaB, setCaptchaB] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaError, setCaptchaError] = useState(false);

  const generateCaptcha = useCallback(() => {
    setCaptchaA(Math.floor(Math.random() * 9) + 1);
    setCaptchaB(Math.floor(Math.random() * 9) + 1);
    setCaptchaAnswer('');
    setCaptchaError(false);
  }, []);

  useEffect(() => { generateCaptcha(); }, [generateCaptcha]);

  const executeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showToast('Missing Credentials', 'Please enter your corporate email address and password.', 'warning');
      return;
    }

    // CAPTCHA validation
    if (parseInt(captchaAnswer) !== captchaA + captchaB) {
      setCaptchaError(true);
      generateCaptcha();
      showToast('Security Check Failed', 'Please solve the math challenge correctly.', 'error');
      return;
    }
    setCaptchaError(false);

    setLoading(true);
    setErrorMsg('');
    setIsPendingApproval(false);
    try {
      const loggedUser = await login(email.trim().toLowerCase(), password, rememberMe);
      const targetRoute = getRoleLandingRoute(loggedUser.role, loggedUser.status);
      showToast(
        'Authentication Successful',
        `Authenticated as ${loggedUser.name} (${loggedUser.role}). Redirecting...`,
        'success',
        2000
      );
      navigate(targetRoute);
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please verify your credentials.';
      setErrorMsg(msg);
      if (msg.toLowerCase().includes('pending approval') || msg.toLowerCase().includes('pending authorization')) {
        setIsPendingApproval(true);
      }
      showToast('Authentication Notice', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page min-h-screen bg-[#0A0D14] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 relative overflow-hidden">
      
      {/* Background Ambient Glow Orbs */}
      <div className="login-orb login-orb-blue absolute top-1/4 -left-48 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="login-orb login-orb-indigo absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Split Authentication Container */}
      <div className="login-card w-full max-w-4xl bg-[#101522] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-emerald-950/40 relative z-10 backdrop-blur-md">
        
        {/* Left Side: Dark Charcoal & Emerald Brand Panel */}
        <div className="login-brand-panel w-full md:w-[48%] bg-gradient-to-b from-[#0D121F] via-[#101726] to-[#0A0D14] p-8 sm:p-10 lg:p-12 text-white flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-emerald-950/30">
          
          {/* Subtle interior glow */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Logo & Title */}
          <div className="relative z-10">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="login-emblem w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-purple-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0 relative">
                <Shield className="w-6 h-6 text-emerald-400 stroke-[2.2]" />
                <Lock className="w-3.5 h-3.5 text-emerald-300 absolute bottom-2 right-2 drop-shadow" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-white block">
                  Trust<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Vault</span>
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400/80 block -mt-0.5">
                  Enterprise Zero-Trust
                </span>
              </div>
            </div>

            <div className="mt-6">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
                Your documents. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                  Your control.
                </span>
              </h1>
              <p className="text-xs sm:text-sm font-normal text-slate-400 mt-2 leading-relaxed">
                Hardware-grade protection for confidential files with granular document permissions and verifiable audit trails.
              </p>
            </div>
          </div>

          {/* Animated Center Shield Illustration */}
          <div className="my-6 md:my-8 relative z-10 flex items-center justify-center">
            <div className="relative w-48 h-36 flex items-center justify-center">
              {/* Outer Pulse Rings */}
              <div className="absolute inset-0 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xs flex items-center justify-center animate-pulse" />
              <div className="absolute w-36 h-28 rounded-xl border border-teal-400/30 bg-slate-950/60 flex items-center justify-center shadow-inner" />
              
              {/* Center Graphic */}
              <div className="relative flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 border border-emerald-400/40 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                  <KeyRound className="w-7 h-7 text-slate-950 stroke-[2.4]" />
                </div>
                <div className="mt-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[10px] text-emerald-300 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  SCRYPT • ZERO-TRUST
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-3 relative z-10 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white block">Document-Level Authorization</span>
                <span className="text-[11px] text-slate-400 leading-tight">Explicit cryptographic grants with immediate revocation.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white block">Immutable Audit Ledger</span>
                <span className="text-[11px] text-slate-400 leading-tight">Every view, download, and permission change is recorded.</span>
              </div>
            </div>
          </div>

          {/* Bottom Security Badge */}
          <div className="relative z-10 pt-4 mt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1 text-slate-400">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Zero-Trust Enterprise</span>
            </span>
            <span className="text-emerald-400 font-mono text-[10px]">High Assurance</span>
          </div>
        </div>

        {/* Right Side: Sleek Charcoal Login Form Panel */}
        <div className="login-form-panel w-full md:w-[52%] bg-[#0E1422] p-8 sm:p-10 lg:p-12 flex flex-col justify-between text-white">
          <div>
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Sign in securely to access your authorized document vault.
              </p>
            </div>

            {/* Pending Approval Notice Banner */}
            {isPendingApproval && (
              <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1.5 animate-in fade-in">
                <div className="font-bold flex items-center gap-1.5 text-amber-400">
                  <Clock className="w-4 h-4" />
                  <span>Awaiting Administrator Approval</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Your Document Owner account was successfully registered, but must be approved by an Administrator before you can log in. An Admin can authorize your account in the Admin Dashboard.
                </p>
              </div>
            )}

            {errorMsg && !isPendingApproval && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={executeLogin} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Corporate Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Math CAPTCHA Challenge */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    Security Verification
                  </label>
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    className="text-slate-500 hover:text-emerald-400 transition-colors p-1 rounded-lg hover:bg-slate-800"
                    title="Generate new challenge"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="px-4 py-2.5 bg-gradient-to-br from-emerald-900/50 to-teal-900/40 border border-emerald-700/40 rounded-xl text-center font-mono font-extrabold text-xl text-emerald-300 min-w-[3.2rem] shadow-inner">
                    {captchaA}
                  </div>
                  <span className="text-xl font-bold text-slate-500">+</span>
                  <div className="px-4 py-2.5 bg-gradient-to-br from-purple-900/50 to-indigo-900/40 border border-purple-700/40 rounded-xl text-center font-mono font-extrabold text-xl text-purple-300 min-w-[3.2rem] shadow-inner">
                    {captchaB}
                  </div>
                  <span className="text-xl font-bold text-slate-500">=</span>
                  <input
                    type="number"
                    value={captchaAnswer}
                    onChange={(e) => { setCaptchaAnswer(e.target.value); setCaptchaError(false); }}
                    placeholder="?"
                    className={`w-20 py-2.5 text-center font-mono font-bold text-lg bg-slate-950 border rounded-xl text-white placeholder-slate-600 focus:outline-none transition-all ${captchaError ? 'border-rose-500 ring-1 ring-rose-500/40 text-rose-300' : 'border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40'}`}
                  />
                </div>
                {captchaError && (
                  <p className="text-xs text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Incorrect answer — a new challenge has been generated.
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 bg-slate-900 border-slate-700 rounded"
                  />
                  <span>Remember this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Signing in securely...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in securely</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <span>Don't have an account?</span>
            <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold underline-offset-4 hover:underline flex items-center gap-1">
              <span>Register</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
