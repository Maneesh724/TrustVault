import React, { useState } from 'react';
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
  UserCheck,
  AlertCircle,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { getRoleLandingRoute } from '../../types';

export const LoginPage: React.FC = () => {
  const { login, allUsers } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@trustvault.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [showSampleEmail, setShowSampleEmail] = useState(false);

  const executeLogin = async (loginEmail: string) => {
    setLoading(true);
    setErrorMsg('');
    setIsPendingApproval(false);
    try {
      const loggedUser = await login(loginEmail);
      const targetRoute = getRoleLandingRoute(loggedUser.role);
      showToast(
        'Authentication Succeeded',
        `Authenticated as ${loggedUser.name} (${loggedUser.role}). Redirecting to concurrent ${loggedUser.role} workspace...`,
        'success',
        2500
      );
      navigate(targetRoute);
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please verify credentials.';
      setErrorMsg(msg);
      if (msg.includes('Pending Authorization')) {
        setIsPendingApproval(true);
        showToast('Authorization Required', 'Your registration is awaiting approval by an Administrator or Document Owner.', 'warning', 5000);
      } else {
        showToast('Authentication Blocked', msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Email Required', 'Please enter your corporate email address.', 'warning');
      return;
    }
    executeLogin(email);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Main Split Authentication Container */}
      <div className="w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-slate-200/80">
        
        {/* Left Side: Deep Navy Blue Brand Panel */}
        <div className="w-full md:w-[48%] bg-[#081B36] p-8 sm:p-10 lg:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background curved decorative glow */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Logo & Title */}
          <div className="relative z-10">
            <div className="flex items-center gap-3.5 mb-2">
              {/* Shield Logo with Padlock */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0 relative">
                <Shield className="w-6 h-6 text-white" />
                <Lock className="w-3 h-3 text-white absolute bottom-2.5 right-2.5 drop-shadow" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">TrustVault</span>
            </div>

            <div className="mt-4">
              <h2 className="text-sm sm:text-base font-normal text-slate-300 leading-snug">
                Secure Document Sharing
              </h2>
              <p className="text-sm sm:text-base font-normal text-slate-300 leading-snug">
                With a Real Audit Trail
              </p>
            </div>
          </div>

          {/* 3 Core Security Feature Callouts */}
          <div className="space-y-6 my-8 md:my-12 relative z-10">
            {/* Feature 1 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wide">Controlled Access</h3>
                <p className="text-xs text-slate-300/80 mt-0.5 leading-relaxed">
                  Only the right people can see your documents.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wide">Full Audit Trail</h3>
                <p className="text-xs text-slate-300/80 mt-0.5 leading-relaxed">
                  Know who accessed what, and when.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wide">Enterprise Security</h3>
                <p className="text-xs text-slate-300/80 mt-0.5 leading-relaxed">
                  Your data, your control.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Security Badge */}
          <div className="relative z-10 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Zero-Trust Architecture</span>
            <span className="text-blue-400 font-mono">SHA-256 Verified</span>
          </div>
        </div>

        {/* Right Side: Clean White Login Form Panel */}
        <div className="w-full md:w-[52%] bg-white p-8 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Welcome Back
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Sign in to your TrustVault account
              </p>
            </div>

            {isPendingApproval ? (
              <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 animate-in fade-in space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-800 text-xs">Account Registration Pending Approval</div>
                    <p className="text-amber-700 mt-1 leading-relaxed text-[11px]">
                      Your account has been registered, but requires authorization from an <strong>Administrator</strong> or <strong>Document Owner</strong> before you can log in.
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-[11px]">
                  <span className="text-amber-700 flex items-center gap-1 font-medium">
                    <Mail className="w-3.5 h-3.5 text-amber-600" /> Notification sent via email upon approval
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSampleEmail(true)}
                    className="font-semibold text-blue-700 hover:text-blue-800 underline cursor-pointer"
                  >
                    View Status Email
                  </button>
                </div>
              </div>
            ) : errorMsg ? (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@trustvault.com"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                  <span className="text-slate-700 font-medium">Remember me</span>
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    showToast('Enterprise Reset', 'Password recovery tokens require Security Admin approval.', 'info');
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Forgot password?
                </a>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white text-sm font-semibold shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Sign in'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-white px-3 text-xs text-slate-400 font-medium">or</span>
            </div>

            {/* Register Link */}
            <div className="text-center text-xs text-slate-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Create Account
              </Link>
            </div>
          </div>

          {/* Clean Enterprise Footer (Unnecessary quick buttons removed) */}
          <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
            <p>TrustVault Zero-Trust Gatekeeper • Dynamic Grant Enforcement</p>
          </div>
        </div>

      </div>

      {/* Simulated Email Modal */}
      {showSampleEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Email Notification Preview</h4>
                  <p className="text-[10px] text-slate-500">Zero-Trust Access Request Dispatch</p>
                </div>
              </div>
              <button
                onClick={() => setShowSampleEmail(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3.5 text-xs">
              <div className="space-y-1 pb-3 border-b border-slate-100 font-mono text-[11px] text-slate-500 bg-slate-50/70 p-2.5 rounded-xl border">
                <div><strong className="text-slate-700">From:</strong> compliance@trustvault.internal</div>
                <div><strong className="text-slate-700">To:</strong> {email || 'user@company.com'}</div>
                <div><strong className="text-slate-700">Subject:</strong> [TrustVault] Access Request Awaiting Authorization</div>
              </div>
              <div className="text-slate-700 leading-relaxed space-y-2 text-xs">
                <p>Hello,</p>
                <p>
                  Your registration with verified mobile OTP has been successfully submitted to TrustVault.
                </p>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <Clock className="w-3.5 h-3.5" /> Next Steps: Authorization Required
                  </div>
                  <p>
                    An <strong>Administrator</strong> or <strong>Document Owner</strong> must authorize your account. Once access has been granted, you will receive an automated activation email allowing you to log in.
                  </p>
                </div>
                <p className="text-[11px] text-slate-500">
                  If this request was not initiated by you, please report it immediately to security@trustvault.internal.
                </p>
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowSampleEmail(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
