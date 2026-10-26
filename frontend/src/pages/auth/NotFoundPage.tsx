import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Lock, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#070A13] flex items-center justify-center p-4 sm:p-6 font-sans text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="w-full max-w-lg bg-[#0D121F] border border-amber-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-xl shadow-amber-500/20">
          <AlertTriangle className="w-10 h-10 stroke-[2.2] animate-bounce" />
        </div>

        <div className="space-y-3">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
            HTTP 404 · Invalid Path Blocked
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Page Not Found / Access Blocked
          </h1>
          <div className="inline-block px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800/50 text-amber-300 font-mono text-xs max-w-full overflow-hidden text-ellipsis">
            Invalid Route: <span className="font-bold text-white">{location.pathname}</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            Zero-Trust Routing Alert: The requested URL address does not match any valid TrustVault route or permission boundary. Direct access to unmapped endpoints is strictly prohibited.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <Link
            to="/login"
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <Lock className="w-4 h-4" />
            <span>Sign In with Authorized Credentials</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/"
            className="w-full py-3 px-4 rounded-xl font-medium text-xs text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Public Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
