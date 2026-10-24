import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  FolderLock,
  Eye,
  ArrowRight,
  CheckCircle2,
  Lock,
  FileCheck,
  Share2,
  Sparkles,
  KeyRound,
} from 'lucide-react';

export const RegisterChooseRolePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#070A13] text-slate-100 font-sans flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Navbar */}
      <header className="px-6 py-5 border-b border-[#161F33] flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-purple-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white flex items-center">
              Trust<span className="text-emerald-400">Vault</span>
            </span>
            <span className="text-[9px] tracking-widest uppercase font-semibold text-emerald-400/80 block -mt-1 font-mono">
              Zero-Trust
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400 hidden sm:inline">Already have an account?</span>
          <Link
            to="/login"
            className="px-3.5 py-1.5 rounded-xl bg-[#0E1426] hover:bg-[#141E38] border border-[#1E2638] text-slate-200 hover:text-white font-semibold flex items-center gap-1.5 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sign In</span>
          </Link>
        </div>
      </header>

      {/* Main Role Selection Area */}
      <main className="max-w-4xl mx-auto w-full px-5 py-10 sm:py-16 my-auto">
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Choose Your Account Type</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            How will you use TrustVault?
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
            Select your role to proceed with registration. Each role has specialized permissions and zero-trust verification.
          </p>
        </div>

        {/* Two Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Document Owner Card */}
          <div
            onClick={() => navigate('/register/owner')}
            className="group relative p-6 sm:p-8 rounded-3xl bg-[#0B101D] hover:bg-[#0E1629] border border-[#161F33] hover:border-emerald-500/60 transition-all duration-300 cursor-pointer shadow-xl shadow-black/40 flex flex-col justify-between card-hover-glow"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10 group-hover:scale-110 transition-transform">
                  <FolderLock className="w-7 h-7 stroke-[2]" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-300 uppercase tracking-wider font-mono">
                  Owner
                </span>
              </div>

              <h2 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                Document Owner
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Upload and manage your own documents, create folders, share with Viewers, and enforce granular view/download permissions.
              </p>

              <div className="mt-6 pt-5 border-t border-[#161F33] space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Upload & organize confidential documents</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Configure permissions & expiring access</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Revoke document access at any moment</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-[11px] pt-1">
                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Requires Administrator approval before login</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="button"
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-500 group-hover:from-emerald-400 group-hover:to-teal-400 text-slate-950 flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20"
              >
                <span>Register as Document Owner</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* 2. Viewer Card */}
          <div
            onClick={() => navigate('/register/viewer')}
            className="group relative p-6 sm:p-8 rounded-3xl bg-[#0B101D] hover:bg-[#12142B] border border-[#161F33] hover:border-purple-500/60 transition-all duration-300 cursor-pointer shadow-xl shadow-black/40 flex flex-col justify-between card-hover-glow"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/10 group-hover:scale-110 transition-transform">
                  <Eye className="w-7 h-7 stroke-[2]" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-300 uppercase tracking-wider font-mono">
                  Recipient
                </span>
              </div>

              <h2 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                Viewer
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Access, read, and preview documents shared directly with you by Document Owners. View authorized files with instant activation.
              </p>

              <div className="mt-6 pt-5 border-t border-[#161F33] space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Access documents explicitly shared with you</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Real-time in-browser document preview</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Authorized direct file downloads</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-[11px] pt-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Immediate access after email OTP verification</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="button"
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-[#0E1426] group-hover:bg-[#1E1B4B] border border-purple-500/40 text-purple-300 group-hover:text-white flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-500/10"
              >
                <span>Register as Viewer</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Notice regarding Admin registration */}
        <div className="mt-10 p-4 rounded-2xl bg-[#0B101D] border border-[#161F33] text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Looking for Administrator access? Admin accounts are provisioned via backend command only and cannot be registered publicly.
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-[#161F33] text-center text-xs text-slate-500 max-w-7xl mx-auto w-full px-6">
        <p>© {new Date().getFullYear()} TrustVault Zero-Trust Architecture. All cryptographic handshakes audited.</p>
      </footer>
    </div>
  );
};
