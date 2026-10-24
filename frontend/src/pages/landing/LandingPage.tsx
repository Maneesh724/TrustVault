import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, FileCheck, ArrowRight, KeyRound, Eye, Users } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#070A13] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Navbar */}
      <header className="h-20 border-b border-[#141A29] px-6 sm:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-xl text-white tracking-tight">
              Trust<span className="text-emerald-400">Vault</span>
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-mono -mt-1">
              Zero-Trust
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register/owner"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#10B981] hover:bg-[#059669] text-slate-950 transition-colors shadow-lg shadow-emerald-500/20"
          >
            Register as Owner
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-20 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Role-Based Zero-Trust Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Cryptographic Document Security with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Hardware-Grade Control
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          TrustVault delivers zero-trust document custody, single-use email OTP registration, server-enforced role permissions, and immutable audit ledgers.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/register"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105"
          >
            <span>Create an Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-xs bg-[#0E1424] hover:bg-[#141C33] border border-slate-800 text-white flex items-center justify-center gap-2 transition-all"
          >
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span>Sign In to Vault</span>
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
          <div className="p-6 rounded-2xl bg-[#0B101D] border border-[#161F33] space-y-3 card-hover-glow">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Administrator Command</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pre-configured oversight with owner approvals, account suspensions, system-wide audit monitoring, and zero content exposure.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0B101D] border border-[#161F33] space-y-3 card-hover-glow">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Document Owner Sovereignty</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload, organize, and grant granular permissions with expiring access links and real-time revocation guarantees.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0B101D] border border-[#161F33] space-y-3 card-hover-glow">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Restricted Viewer Portal</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inspect authorized documents with dynamic digital watermarking and verified audit records without leaking metadata.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
