import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';
import { Shield, KeyRound, Mail, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, RefreshCw, Lock } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Wizard state: 'request' -> 'reset' -> 'success'
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');

  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [devTokenNotice, setDevTokenNotice] = useState<string | null>(null);

  // Handle Request Reset Token
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid corporate email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.requestPasswordReset(email.trim().toLowerCase());
      showToast('Instructions Sent', 'If an eligible account matches this email, reset instructions have been issued.', 'info');
      
      // If dev token is provided by offline backend test mode
      if ((res as any).devResetToken) {
        setResetToken((res as any).devResetToken);
        setDevTokenNotice((res as any).devResetToken);
      }
      setStep('reset');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process recovery request.');
      showToast('Request Failed', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password Submission
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!resetToken.trim()) {
      setErrorMsg('Please enter the cryptographic recovery token.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(resetToken.trim(), newPassword);
      setStep('success');
      showToast('Password Updated', 'Your master password has been successfully reset.', 'success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update master password. The token may be expired or already consumed.');
      showToast('Reset Failed', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#070A13] text-white">
      {/* ------------------------------------------------------------------ */}
      {/* LEFT BRANDING PANEL */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:w-5/12 bg-gradient-to-br from-[#080D1A] via-[#0D1526] to-[#070A13] p-8 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#161F33] relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
              <Shield className="w-6 h-6 fill-emerald-500/20" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                Trust<span className="text-emerald-400">Vault</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-slate-400 block -mt-1 font-mono">
                Zero-Trust Platform
              </span>
            </div>
          </Link>

          <div className="mt-14 space-y-4">
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Cryptographic <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                Account Recovery.
              </span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              Securely regain access to your vault using single-use cryptographic recovery tokens. Protects against enumeration and brute-force attacks.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Argon2id Hash Upgrades • Single-Use 15-Minute TTL</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RIGHT INTERACTIVE FORM PANEL */}
      {/* ------------------------------------------------------------------ */}
      <div className="lg:w-7/12 flex items-center justify-center p-6 sm:p-12 bg-[#090D18]">
        <div className="w-full max-w-md">
          {/* STEP 1: REQUEST TOKEN */}
          {step === 'request' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Recover password</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Enter your registered corporate email. We'll issue a cryptographic recovery token.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Corporate Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Recovery Token...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Recovery Token</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-800">
                Remember your credentials?{' '}
                <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold">
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}

          {/* STEP 2: RESET PASSWORD */}
          {step === 'reset' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Set new password</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Enter the recovery token issued for <span className="font-semibold text-white">{email}</span> and establish your new master password.
                </p>
              </div>

              {devTokenNotice && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                  <div className="font-semibold">Local Test Mode:</div>
                  <p>
                    Token:{' '}
                    <span className="font-mono font-bold text-white bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/50 break-all">
                      {devTokenNotice}
                    </span>
                  </p>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Cryptographic Reset Token</label>
                  <input
                    type="text"
                    required
                    placeholder="Paste your reset token"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full px-4 py-2.5 font-mono text-xs bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">New Master Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
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
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Establish New Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <button
                type="button"
                onClick={() => setStep('request')}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-200"
              >
                ← Back to email input
              </button>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'success' && (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Password Updated</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-2">
                  Your master password has been successfully re-encrypted with Argon2id. You may now sign in to your vault.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Sign In to TrustVault</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
