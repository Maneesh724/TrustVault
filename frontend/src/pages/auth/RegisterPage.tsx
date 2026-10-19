import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { authService, SendOtpResponse } from '../../services/authService';
import { UserRole } from '../../types';
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
  Clock,
  ArrowRight,
  ShieldAlert,
  Send,
  Building,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Enterprise Security');
  const [role, setRole] = useState<UserRole>('VIEWER');
  const [adminToken, setAdminToken] = useState('');

  // Mobile number & OTP state
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpVerificationToken, setOtpVerificationToken] = useState('');
  const [otpResponseInfo, setOtpResponseInfo] = useState<SendOtpResponse | null>(null);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  // Password & confirm password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Submission & UI status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [registeredSuccessData, setRegisteredSuccessData] = useState<any | null>(null);

  // OTP resend cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  // Password strength calculation
  const calculatePasswordStrength = (pwd: string): number => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = calculatePasswordStrength(password);
  const fullPhoneNumber = `${countryCode} ${mobileNumber.trim()}`;

  // --------------------------------------------------------------------------
  // OTP Dispatch Handler
  // --------------------------------------------------------------------------
  const handleSendOtp = async () => {
    if (!mobileNumber.trim() || mobileNumber.trim().length < 7) {
      showToast('Mobile Number Required', 'Please enter a valid mobile number.', 'warning');
      return;
    }

    setOtpSending(true);
    setErrorMsg('');
    try {
      const res = await authService.requestOtp(fullPhoneNumber, role);
      setOtpResponseInfo(res);
      setIsOtpSent(true);
      setOtpCooldown(30); // 30-second cooldown for resend
      if (res.isDevelopmentMode && res.devOtp) {
        showToast(
          'Development Mode OTP',
          `Live SMS provider not configured. Your single-use test OTP is: ${res.devOtp}`,
          'info',
          7000
        );
      } else {
        showToast('OTP Dispatched', `Verification code sent to ${fullPhoneNumber}`, 'success');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch OTP.');
      showToast('OTP Request Failed', err.message, 'error');
    } finally {
      setOtpSending(false);
    }
  };

  // --------------------------------------------------------------------------
  // OTP Verification Handler
  // --------------------------------------------------------------------------
  const handleVerifyOtp = async () => {
    if (!otpInput.trim() || otpInput.trim().length !== 6) {
      showToast('Invalid OTP', 'Please enter the 6-digit verification code.', 'warning');
      return;
    }

    setOtpVerifying(true);
    setErrorMsg('');
    try {
      const res = await authService.verifyOtp(fullPhoneNumber, otpInput.trim());
      setIsOtpVerified(true);
      setOtpVerificationToken(res.verificationToken);
      showToast('Mobile Verified', 'Mobile number cryptographically verified.', 'success');
    } catch (err: any) {
      setErrorMsg(err.message || 'OTP verification failed.');
      showToast('Verification Failed', err.message, 'error');
    } finally {
      setOtpVerifying(false);
    }
  };

  // --------------------------------------------------------------------------
  // Account Creation Submission
  // --------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Frontend validations
    if (!name.trim() || !email.trim() || !password) {
      showToast('Missing Fields', 'Please fill in all mandatory fields.', 'warning');
      return;
    }

    if (!isOtpVerified || !otpVerificationToken) {
      showToast('Mobile Verification Required', 'You must verify your mobile number via OTP before creating an account.', 'warning');
      setErrorMsg('Mobile OTP verification is required to complete registration.');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Password Mismatch', 'Password and confirm password do not match.', 'error');
      setErrorMsg('Passwords do not match. Please verify your entries.');
      return;
    }

    if (strength < 2) {
      showToast('Weak Password', 'Password must meet enterprise complexity standards (at least 8 chars with numbers/symbols).', 'warning');
      return;
    }

    if (role === 'ADMIN' && !adminToken.trim()) {
      showToast('Provisioning Passcode Required', 'Administrator accounts cannot be self-registered without a provisioning passcode.', 'error');
      setErrorMsg('Privilege Escalation Blocked: Administrator accounts require a valid Enterprise Provisioning Passcode.');
      return;
    }

    if (!agreeTerms) {
      showToast('Terms Required', 'Please accept the zero-trust data governance policy.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.register({
        name: name.trim(),
        email: email.trim(),
        phone: fullPhoneNumber,
        role,
        password,
        department: department.trim(),
        otpVerificationToken,
        adminProvisioningToken: role === 'ADMIN' ? adminToken.trim() : undefined,
      });

      setRegisteredSuccessData(result);
      showToast(
        'Registration Submitted',
        'Account registered with status PENDING_APPROVAL. Awaiting administrator or document owner authorization.',
        'success',
        6000
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
      showToast('Registration Blocked', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Render Post-Registration Pending Approval Screen
  // --------------------------------------------------------------------------
  if (registeredSuccessData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 sm:p-10 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center gap-3.5 mb-6 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 shrink-0">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Registration Submitted — Awaiting Approval
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                TrustVault Zero-Trust Governance • Account Status: <span className="font-semibold text-amber-700">PENDING_APPROVAL</span>
              </p>
            </div>
          </div>

          {/* Details Card */}
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">User Identity</span>
                <span className="font-bold text-slate-900 text-sm">{registeredSuccessData.user.name}</span>
                <span className="text-slate-500 block truncate">{registeredSuccessData.user.email}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">Requested Role</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {registeredSuccessData.user.role}
                </span>
                <span className="text-emerald-700 block text-[11px] font-medium mt-1">
                  ✓ Mobile Verified ({registeredSuccessData.user.phone})
                </span>
              </div>
            </div>

            {/* Authorization Rule Callout */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 space-y-1.5">
              <div className="font-bold flex items-center gap-2 text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Zero-Trust Gatekeeping Policy
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                {registeredSuccessData.approvalNotice}
              </p>
            </div>

            {/* Simulated Email Confirmation Box */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  Automated Notification Dispatched
                </span>
                <span className="font-mono text-slate-400">SMTP: 250 OK</span>
              </div>
              <div className="p-4 bg-white space-y-2 text-[11px]">
                <div className="font-mono text-slate-500 border-b border-slate-100 pb-2 space-y-0.5">
                  <div><strong>To:</strong> {registeredSuccessData.emailDispatched.to}</div>
                  <div><strong>Subject:</strong> {registeredSuccessData.emailDispatched.subject}</div>
                </div>
                <p className="text-slate-600 pt-1 leading-relaxed">
                  {registeredSuccessData.emailDispatched.preview}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">
              Need access urgently? Contact your security administrator.
            </span>
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              Return to Login
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Render Registration Form
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Main Split Container */}
      <div className="w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-slate-200/80">
        
        {/* Left Side: Deep Navy Blue Brand Panel */}
        <div className="w-full md:w-[42%] bg-[#081B36] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Logo & Title */}
          <div className="relative z-10">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0 relative">
                <Shield className="w-6 h-6 text-white" />
                <Lock className="w-3 h-3 text-white absolute bottom-2.5 right-2.5 drop-shadow" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">TrustVault</span>
            </div>

            <div className="mt-4">
              <h2 className="text-sm font-semibold text-slate-200">
                Zero-Trust Enrollment
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Cryptographic authentication, mobile verification, and mandatory administrator authorization.
              </p>
            </div>
          </div>

          {/* Core Requirements Bulletins */}
          <div className="space-y-5 my-8 relative z-10">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white">Mobile OTP Verification</h3>
                <p className="text-[11px] text-slate-300/80 mt-0.5 leading-relaxed">
                  Single-use 5-minute code validated on the server before registration.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white">Account Approval Gate</h3>
                <p className="text-[11px] text-slate-300/80 mt-0.5 leading-relaxed">
                  Accounts are saved as PENDING_APPROVAL until verified by authorized personnel.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white">Role-Based Security</h3>
                <p className="text-[11px] text-slate-300/80 mt-0.5 leading-relaxed">
                  Public self-registration for Administrators is blocked to prevent privilege escalation.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="relative z-10 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>STRIDE Protected</span>
            <span className="text-blue-400 font-mono">Argon2id / Scrypt</span>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="w-full md:w-[58%] bg-white p-7 sm:p-9 lg:p-10 flex flex-col justify-between">
          <div>
            <div className="mb-5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Create TrustVault Account
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Enter your details to initiate your zero-trust access request.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Legal Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jordan Mitchell"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Email Address & Department Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Corporate Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jordan@company.com"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Compliance"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Requested Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 font-medium cursor-pointer"
                >
                  <option value="VIEWER">Viewer (Access & Download Shared Documents)</option>
                  <option value="OWNER">Document Owner (Upload & Manage Protected Documents)</option>
                  <option value="ADMIN">Administrator (Platform & Identity Governance)</option>
                </select>

                {/* Role Specific Explanations & Security Warnings */}
                {role === 'ADMIN' && (
                  <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-2">
                    <div className="font-bold flex items-center gap-1.5 text-amber-800">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      Privilege Escalation Protection
                    </div>
                    <p className="leading-relaxed text-amber-800">
                      Administrator accounts cannot be created via public self-registration. An enterprise provisioning passcode is required.
                    </p>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                        Admin Provisioning Passcode *
                      </label>
                      <input
                        type="password"
                        value={adminToken}
                        onChange={(e) => setAdminToken(e.target.value)}
                        placeholder="Enter provisioning secret (e.g. TV-ADMIN-PROVISION-2026)"
                        className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                )}
                {role === 'OWNER' && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    ℹ️ Document Owner accounts require Administrator authorization prior to activation.
                  </p>
                )}
                {role === 'VIEWER' && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    ℹ️ Viewer accounts require Document Owner or Administrator authorization.
                  </p>
                )}
              </div>

              {/* Mobile Number with Country Code (+91) & Send OTP */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    disabled={isOtpVerified}
                    className="w-24 bg-white border border-slate-300 rounded-xl px-2 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium cursor-pointer"
                  >
                    <option value="+91">+91 (IN)</option>
                    <option value="+1">+1 (US)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+61">+61 (AU)</option>
                    <option value="+49">+49 (DE)</option>
                  </select>

                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      disabled={isOtpVerified}
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="9876543210"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 disabled:bg-slate-50"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpSending || otpCooldown > 0 || isOtpVerified}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {otpSending ? 'Sending...' : otpCooldown > 0 ? `Resend (${otpCooldown}s)` : 'Send OTP'}
                    <Send className="w-3 h-3" />
                  </button>
                </div>

                {isOtpVerified && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Mobile Number Verified
                  </div>
                )}
              </div>

              {/* Clearly Labelled Development Mode Notice (when live SMS credentials not present) */}
              {isOtpSent && otpResponseInfo?.isDevelopmentMode && !isOtpVerified && (
                <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950 text-[11px] space-y-1 animate-in fade-in">
                  <div className="font-bold flex items-center justify-between text-blue-900">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-blue-600" />
                      DEVELOPMENT MODE: SMS Provider Not Configured
                    </span>
                    <span className="font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px]">
                      Single-Use Code
                    </span>
                  </div>
                  <p className="text-blue-800 leading-relaxed">
                    Live SMS credentials (Twilio/AWS SNS) are not set in environment variables.
                    Your server-generated 5-minute verification code is:
                  </p>
                  <div className="pt-1 flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-blue-700 tracking-widest bg-white px-2.5 py-0.5 rounded-lg border border-blue-200">
                      {otpResponseInfo.devOtp}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtpInput(otpResponseInfo.devOtp || '')}
                      className="text-[11px] text-blue-700 font-semibold underline hover:text-blue-900"
                    >
                      Autofill OTP
                    </button>
                  </div>
                </div>
              )}

              {/* OTP Input & Verify OTP Button (Shown after sending until verified) */}
              {isOtpSent && !isOtpVerified && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 animate-in fade-in">
                  <label className="block text-xs font-semibold text-slate-700">
                    Enter 6-Digit OTP *
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        maxLength={6}
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="6-digit code"
                        className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-mono tracking-widest text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpVerifying || otpInput.length !== 6}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-xs"
                    >
                      {otpVerifying ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Codes expire strictly after 5 minutes. Rate limits apply to invalid attempts.
                  </span>
                </div>
              )}

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Master Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Match & Strength Indicators */}
              {password && (
                <div className="space-y-1 pt-0.5">
                  <div className="flex gap-1 h-1.5 w-full">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`flex-1 rounded-full transition-all ${
                          strength >= step
                            ? strength <= 1
                              ? 'bg-rose-500'
                              : strength <= 2
                              ? 'bg-amber-500'
                              : strength <= 3
                              ? 'bg-blue-500'
                              : 'bg-emerald-500'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-medium">
                      {strength <= 1 ? 'Too weak' : strength === 2 ? 'Fair' : strength === 3 ? 'Good' : 'Strong enterprise password'}
                    </span>
                    {confirmPassword && (
                      <span className={password === confirmPassword ? 'text-emerald-600 font-semibold' : 'text-rose-500 font-medium'}>
                        {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Terms and Conditions Checkbox */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agree"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-blue-600 rounded cursor-pointer"
                />
                <label htmlFor="agree" className="text-[11px] text-slate-600 leading-tight cursor-pointer">
                  I agree to TrustVault's cryptographic data governance and zero-trust audit monitoring policy.
                </label>
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={loading || !agreeTerms || !isOtpVerified}
                className="w-full mt-3 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Submitting Registration...' : 'Create Account'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Return to Login Link */}
            <div className="mt-5 text-center text-xs text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Sign in to vault
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
