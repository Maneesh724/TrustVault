import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';
import {
  Shield,
  Mail,
  RefreshCw,
  MailCheck,
  AlertCircle,
  ArrowRight,
  SendHorizonal,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const emailParam = searchParams.get('email') || '';
  const roleParam = (searchParams.get('role') || 'OWNER').toUpperCase();

  const [email, setEmail] = useState(emailParam);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cooldown, setCooldown] = useState(60);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Retrieve pending registration data cached in sessionStorage
  const pendingReg = JSON.parse(sessionStorage.getItem('trustvault_pending_reg') || 'null');

  useEffect(() => {
    if (pendingReg && pendingReg.email && !email) {
      setEmail(pendingReg.email);
    }
  }, [pendingReg, email]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleOtpDigitChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...otpDigits];
    newDigits[idx] = val.slice(-1);
    setOtpDigits(newDigits);
    if (val && idx < 5) otpInputRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      otpInputRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(''));
      e.preventDefault();
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setErrorMsg('Email address missing. Please return to registration.');
      return;
    }
    setResending(true);
    setErrorMsg('');
    try {
      await authService.requestEmailOtp(email.trim().toLowerCase());
      setCooldown(60);
      showToast('New Code Sent', `Single-use OTP dispatched to ${email}.`, 'success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend verification OTP.');
      showToast('Resend Error', err.message, 'error');
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setErrorMsg('Please enter the full 6-digit verification code.');
      return;
    }

    setVerifying(true);
    setErrorMsg('');
    try {
      // Step 1: Verify OTP with backend
      const verifyRes = await authService.verifyEmailOtp(email.trim().toLowerCase(), code);

      // Step 2: Complete user account creation
      if (pendingReg) {
        const registerPayload = {
          name: pendingReg.name,
          email: pendingReg.email,
          phone: pendingReg.phone,
          password: pendingReg.password,
          role: pendingReg.role || roleParam,
          emailVerificationToken: verifyRes.verificationToken,
          inviteToken: pendingReg.inviteToken,
        };

        const regRes = await authService.register(registerPayload);
        sessionStorage.removeItem('trustvault_pending_reg');

        if (pendingReg.role === 'OWNER') {
          showToast('Account Created', 'Owner registration received. Awaiting Administrator approval.', 'info', 4000);
          navigate('/owner/pending-approval');
        } else {
          showToast('Email Verified', 'Viewer account active. You can now sign in.', 'success', 3500);
          navigate('/login');
        }
      } else {
        showToast('Email Verified', 'Verification token confirmed. Please sign in.', 'success');
        navigate('/login');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please check your OTP.');
      showToast('Verification Failed', err.message, 'error');
    } finally {
      setVerifying(false);
    }
  };

  const maskEmail = (str: string) => {
    if (!str.includes('@')) return str;
    const [name, domain] = str.split('@');
    return `${name.slice(0, 2)}***@${domain}`;
  };

  return (
    <div className="min-h-screen bg-[#070A13] flex items-center justify-center p-4 sm:p-6 font-sans text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="w-full max-w-md bg-[#0D121F] border border-[#161F33] rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 text-center relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-purple-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20">
          <Mail className="w-8 h-8 stroke-[2.2]" />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Verify Your Email
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
            We sent a 6-digit security code to{' '}
            <span className="text-white font-semibold font-mono">{maskEmail(email || 'your address')}</span>.
            Valid for 5 minutes.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-6">
          {/* OTP Input Boxes */}
          <div className="flex gap-2 sm:gap-3 justify-center" onPaste={handleOtpPaste}>
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { otpInputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                className="w-11 h-14 text-center text-xl font-bold bg-[#080C16] border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={verifying || otpDigits.join('').length !== 6}
            className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {verifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying Security Token...</span>
              </>
            ) : (
              <>
                <span>Verify Email & Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-800/80">
          <span>Didn't receive code?</span>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={cooldown > 0 || resending}
            className="text-emerald-400 hover:underline font-semibold disabled:opacity-50 disabled:no-underline cursor-pointer flex items-center gap-1"
          >
            {resending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <SendHorizonal className="w-3 h-3" />}
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
          </button>
        </div>

        <div>
          <Link to="/login" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
