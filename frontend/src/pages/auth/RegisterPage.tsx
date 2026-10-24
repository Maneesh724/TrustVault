import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { authService, InvitationInfo } from '../../services/authService';
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
  ShieldCheck,
  RefreshCw,
  UserCheck,
  Check,
  FileKey,
  Sparkles,
  Clock,
  SendHorizonal,
  MailCheck,
} from 'lucide-react';

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

export const RegisterPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite') || '';

  // Current view: 'form' | 'owner-pending' | 'viewer-ready'
  const [viewState, setViewState] = useState<'form' | 'owner-pending' | 'viewer-ready'>('form');

  // Invitation info
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null);
  const [verifyingInvite, setVerifyingInvite] = useState(false);

  // Form details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'OWNER' | 'VIEWER'>('OWNER');
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
  const [createdUser, setCreatedUser] = useState<any | null>(null);

  // Email OTP state
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpDigits, setEmailOtpDigits] = useState(['', '', '', '', '', '']);
  const [emailOtpToken, setEmailOtpToken] = useState('');
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [emailOtpSending, setEmailOtpSending] = useState(false);
  const [emailOtpVerifying, setEmailOtpVerifying] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState('');
  const [emailCooldown, setEmailCooldown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check invitation token on mount
  useEffect(() => {
    if (inviteToken) {
      setVerifyingInvite(true);
      authService.verifyInvitation(inviteToken).then((info) => {
        setInvitationInfo(info);
        if (info.valid && info.email) {
          setEmail(info.email);
        }
        if (info.valid && info.role) {
          setRole(info.role === 'OWNER' ? 'OWNER' : 'VIEWER');
        }
        setVerifyingInvite(false);
      });
    }
  }, [inviteToken]);

  // Cooldown countdown timer for OTP resend
  useEffect(() => {
    if (emailCooldown > 0) {
      const t = setTimeout(() => setEmailCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [emailCooldown]);

  // Reset OTP state when email changes
  useEffect(() => {
    setEmailOtpSent(false);
    setEmailOtpVerified(false);
    setEmailOtpDigits(['', '', '', '', '', '']);
    setEmailOtpToken('');
    setEmailOtpError('');
  }, [email]);

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

  // OTP digit input helpers
  const handleOtpDigitChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...emailOtpDigits];
    newDigits[idx] = val.slice(-1);
    setEmailOtpDigits(newDigits);
    if (val && idx < 5) otpInputRefs.current[idx + 1]?.focus();
  };
  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !emailOtpDigits[idx] && idx > 0) otpInputRefs.current[idx - 1]?.focus();
  };
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) { setEmailOtpDigits(pasted.split('')); e.preventDefault(); }
  };

  // Send email OTP
  const handleSendEmailOtp = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address before sending OTP.');
      return;
    }
    setEmailOtpSending(true);
    setEmailOtpError('');
    try {
      const res = await authService.requestEmailOtp(email.trim().toLowerCase());
      setEmailOtpSent(true);
      setEmailCooldown(60);
      setEmailOtpDigits(['', '', '', '', '', '']);
      setEmailOtpVerified(false);
      showToast('OTP Sent', `Verification code sent to ${email}`, 'success');
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setEmailOtpError(err.message || 'Failed to send OTP. Please try again.');
      showToast('OTP Error', err.message, 'error');
    } finally {
      setEmailOtpSending(false);
    }
  };

  // Verify email OTP
  const handleVerifyEmailOtp = async () => {
    const code = emailOtpDigits.join('');
    if (code.length !== 6) { setEmailOtpError('Please enter the complete 6-digit code.'); return; }
    setEmailOtpVerifying(true);
    setEmailOtpError('');
    try {
      const res = await authService.verifyEmailOtp(email.trim().toLowerCase(), code);
      setEmailOtpToken(res.verificationToken);
      setEmailOtpVerified(true);
      showToast('Email Verified ✓', 'Email address verified successfully.', 'success');
    } catch (err: any) {
      setEmailOtpError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setEmailOtpVerifying(false);
    }
  };

  // Form submission (Direct registration without OTP)
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

    if (!emailOtpVerified) {
      setErrorMsg('Please verify your email address using the OTP before completing registration.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: fullPhoneNumber,
        password,
        role: role,
        department: role === 'OWNER' ? 'Document Vault Operations' : 'Document Review',
        emailVerificationToken: emailOtpToken,
        inviteToken: inviteToken || undefined,
      });

      setCreatedUser(res.user);

      if (role === 'OWNER') {
        setViewState('owner-pending');
        showToast('Account Created', 'Document Owner account awaiting Administrator approval.', 'info', 4000);
      } else {
        setViewState('viewer-ready');
        showToast('Account Created', 'Viewer account active. You can now sign in.', 'success', 3500);
      }
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please check your details.';
      setErrorMsg(msg);
      showToast('Registration Error', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0A0D14] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* ------------------------------------------------------------------ */}
      {/* LEFT BRANDING PANEL - Obsidian Charcoal with Cyber Emerald & Violet Glow */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:w-5/12 bg-gradient-to-b from-[#0D121F] via-[#101726] to-[#0A0D14] p-8 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-emerald-950/40 relative overflow-hidden">
        
        {/* Animated Glow Elements */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Logo & Value Proposition */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3.5 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-purple-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-all duration-300 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
              <Shield className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
                Trust<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Vault</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-emerald-400/80 block -mt-1">
                Zero-Trust Security
              </span>
            </div>
          </Link>

          <div className="mt-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Role-Enforced Document Security</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Your Documents. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-purple-400">
                Your Control.
              </span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              TrustVault establishes absolute document sovereignty with hardware-grade zero-trust access control, continuous audit tracking, and dynamic watermarking.
            </p>
          </div>
        </div>

        {/* Center: Architecture Callouts */}
        <div className="my-10 relative z-10 space-y-3 max-w-sm">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-2">
              <FileKey className="w-4 h-4 text-emerald-400" />
              <span>Document Owner Workflow</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Registers publicly &bull; Awaits Administrator approval &bull; Once approved, gains full vault ownership, drag-and-drop uploads, and dynamic granular sharing.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-400" />
              <span>Document Viewer Workflow</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Registers publicly &bull; Immediate active access &bull; Can sign in and securely inspect permitted documents with dynamic digital watermarking.
            </p>
          </div>
        </div>

        {/* Bottom Security Tags */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-wrap gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400/90 font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Argon2id Salted Hashing</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-400/90 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Admin-Enforced Approval</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RIGHT INTERACTIVE FORM PANEL */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:w-7/12 flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-[#080B12] relative overflow-hidden">
        
        {/* Subtle background ambient blur */}
        <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-xl relative z-10">

          {/* Invitation banner if valid token */}
          {inviteToken && (
            <div className="mb-6 p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-start gap-3 shadow-lg shadow-purple-900/10">
              <UserCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                {verifyingInvite ? (
                  <span className="text-slate-300">Validating invitation token...</span>
                ) : invitationInfo?.valid ? (
                  <div>
                    <span className="font-semibold text-purple-200">Authorized Invitation Detected</span>
                    <p className="text-slate-300 mt-0.5">
                      Invited as <span className="font-bold text-emerald-400">{invitationInfo.role || 'VIEWER'}</span> by{' '}
                      <span className="font-bold text-white">{invitationInfo.inviterName || 'Administrator'}</span>.
                    </p>
                  </div>
                ) : (
                  <div>
                    <span className="font-semibold text-rose-400">Invitation Expired</span>
                    <p className="text-slate-300 mt-0.5">
                      This token has expired. You may still proceed with standard registration.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* VIEW: MAIN REGISTRATION FORM (NO OTP) */}
          {/* ---------------------------------------------------------------- */}
          {viewState === 'form' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  Create your account
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Select your role and complete form details to register with TrustVault.
                </p>
              </div>

              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                
                {/* 1. ROLE SELECTION CARDS (Document Owner vs Viewer) */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                    Account Role
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    
                    {/* Option 1: Document Owner */}
                    <button
                      type="button"
                      onClick={() => setRole('OWNER')}
                      className={`p-4 rounded-2xl border text-left transition-all duration-300 relative group ${
                        role === 'OWNER'
                          ? 'bg-gradient-to-br from-emerald-950/60 via-slate-900 to-emerald-900/30 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-1 ring-emerald-400/50'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                            role === 'OWNER'
                              ? 'bg-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <FileKey className="w-5 h-5" />
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            role === 'OWNER'
                              ? 'border-emerald-400 bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/40'
                              : 'border-slate-700 bg-slate-800'
                          }`}
                        >
                          {role === 'OWNER' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                      <div className="font-bold text-sm text-white">Document Owner</div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Encrypt & manage vaults, upload documents, grant and revoke access permissions. (Requires Admin approval).
                      </p>
                    </button>

                    {/* Option 2: Viewer */}
                    <button
                      type="button"
                      onClick={() => setRole('VIEWER')}
                      className={`p-4 rounded-2xl border text-left transition-all duration-300 relative group ${
                        role === 'VIEWER'
                          ? 'bg-gradient-to-br from-purple-950/60 via-slate-900 to-purple-900/30 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.25)] ring-1 ring-purple-400/50'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                            role === 'VIEWER'
                              ? 'bg-purple-500/20 text-purple-400 shadow-sm shadow-purple-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Eye className="w-5 h-5" />
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            role === 'VIEWER'
                              ? 'border-purple-400 bg-purple-500 text-slate-950 shadow-sm shadow-purple-500/40'
                              : 'border-slate-700 bg-slate-800'
                          }`}
                        >
                          {role === 'VIEWER' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                      <div className="font-bold text-sm text-white">Viewer</div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Securely inspect permitted documents with real-time audit logs and watermarking. (Instant login).
                      </p>
                    </button>
                  </div>
                </div>

                {/* 2. FULL NAME */}
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
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                {/* 3. CORPORATE EMAIL + OTP VERIFICATION */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Corporate Email Address</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                      {emailOtpVerified && <MailCheck className="w-4 h-4 text-emerald-400 absolute right-3.5 top-3.5" />}
                      <input
                        type="email"
                        required
                        placeholder="name@company.com"
                        value={email}
                        disabled={Boolean((inviteToken && invitationInfo?.valid && invitationInfo?.email) || emailOtpVerified)}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-10 ${emailOtpVerified ? 'pr-10' : 'pr-4'} py-2.5 bg-slate-900/80 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-all disabled:opacity-60 ${emailOtpVerified ? 'border-emerald-500/70 ring-1 ring-emerald-500/20' : 'border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'}`}
                      />
                    </div>
                    {!emailOtpVerified && (
                      <button
                        type="button"
                        onClick={handleSendEmailOtp}
                        disabled={emailOtpSending || emailCooldown > 0 || !email.includes('@')}
                        className="px-3 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white border border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap flex items-center gap-1.5 shadow-md shadow-purple-500/20"
                      >
                        {emailOtpSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <SendHorizonal className="w-3.5 h-3.5" />}
                        {emailCooldown > 0 ? `${emailCooldown}s` : emailOtpSent ? 'Resend' : 'Send OTP'}
                      </button>
                    )}
                    {emailOtpVerified && (
                      <div className="flex items-center gap-1.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold whitespace-nowrap">
                        <CheckCircle2 className="w-4 h-4" />
                        Verified
                      </div>
                    )}
                  </div>

                  {/* OTP Entry Panel */}
                  {emailOtpSent && !emailOtpVerified && (
                    <div className="mt-3 p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <p className="text-xs text-slate-300">Enter the 6-digit code sent to <span className="text-white font-semibold">{email}</span></p>
                      <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                        {emailOtpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={el => { otpInputRefs.current[idx] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={e => handleOtpDigitChange(idx, e.target.value)}
                            onKeyDown={e => handleOtpKeyDown(idx, e)}
                            className="w-10 h-12 text-center text-lg font-bold bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 transition-all"
                          />
                        ))}
                      </div>
                      {emailOtpError && (
                        <p className="text-xs text-rose-400 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {emailOtpError}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={handleVerifyEmailOtp}
                        disabled={emailOtpVerifying || emailOtpDigits.join('').length !== 6}
                        className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        {emailOtpVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <MailCheck className="w-3.5 h-3.5" />}
                        {emailOtpVerifying ? 'Verifying...' : 'Verify Email OTP'}
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. MOBILE NUMBER WITH COUNTRY CODE */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Mobile Number</label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-32 px-3 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
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
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. PASSWORDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Master Password */}
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
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
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
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password Strength Indicator */}
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

                {/* Terms Acknowledgement */}
                <div className="flex items-start gap-3 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-emerald-500 bg-slate-900 border-slate-700 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="terms" className="text-xs text-slate-400 leading-relaxed cursor-pointer">
                    I acknowledge TrustVault's zero-trust access control, continuous tamper-evident audit logging, and
                    data governance terms.
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-4 py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-800">
                Already registered with TrustVault?{' '}
                <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold underline-offset-4 hover:underline">
                  Sign in securely
                </Link>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* VIEW: DOCUMENT OWNER PENDING APPROVAL SCREEN */}
          {/* ---------------------------------------------------------------- */}
          {viewState === 'owner-pending' && createdUser && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/20">
                <Clock className="w-8 h-8 stroke-[2.2]" />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
                  <span>Awaiting Administrator Authorization</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Registration Received
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  Your Document Owner account for <span className="text-white font-semibold">{createdUser.email}</span> has been securely created and assigned status <span className="text-amber-400 font-bold uppercase">PENDING APPROVAL</span>.
                </p>
              </div>

              {/* Account Details Box */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] block font-semibold">
                      Full Name
                    </span>
                    <span className="font-bold text-white text-sm">{createdUser.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] block font-semibold">
                      Account Role
                    </span>
                    <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded font-bold text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Document Owner
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-1 text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Account Status:</span>
                    <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      PENDING_APPROVAL
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Login Policy:</span>
                    <span className="text-slate-300">Blocked until Admin approval</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 leading-relaxed">
                <p>
                  Per zero-trust security policy, pending Document Owners cannot access protected APIs or log in until an authorized Administrator approves the account in the Admin Dashboard.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center gap-2 transition-all duration-200"
                >
                  <span>Return to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* VIEW: VIEWER IMMEDIATE ACTIVE CONFIRMATION */}
          {/* ---------------------------------------------------------------- */}
          {viewState === 'viewer-ready' && createdUser && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-3xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-xl shadow-purple-500/20">
                <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-2">
                  <span>Account Active &bull; Instant Login Eligible</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Viewer Account Initialized
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  Your Viewer account has been created with status <span className="text-emerald-400 font-bold uppercase">ACTIVE</span>. You can sign in immediately to access documents explicitly shared with you.
                </p>
              </div>

              {/* Account Details Box */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] block font-semibold">
                      Full Name
                    </span>
                    <span className="font-bold text-white text-sm">{createdUser.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] block font-semibold">
                      Assigned Role
                    </span>
                    <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded font-bold text-xs bg-purple-500/15 text-purple-400 border border-purple-500/30">
                      Viewer
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-1 text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Account Status:</span>
                    <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      ACTIVE
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Corporate Email:</span>
                    <span className="text-white font-mono">{createdUser.email}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.01]"
                >
                  <span>Sign in as Viewer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
