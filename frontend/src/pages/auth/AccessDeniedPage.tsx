import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowRight, Lock, ShieldX, Home } from 'lucide-react';

export const AccessDeniedPage: React.FC = () => {
  const location = useLocation();
  const state = (location.state as any) || {};
  const blockedPath = state.from || '';
  const customMessage = state.message || 'Zero-Trust Policy Enforced: You do not possess the required cryptographic role permissions or approved account status to access this protected endpoint.';

  return (
    <div className="min-h-screen bg-[#070A13] flex items-center justify-center p-4 sm:p-6 font-sans text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="w-full max-w-lg bg-[#0D121F] border border-rose-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto shadow-xl shadow-rose-500/20">
          <ShieldAlert className="w-10 h-10 stroke-[2.2] animate-pulse" />
        </div>

        <div className="space-y-3">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
            HTTP 403 Forbidden · Zero-Trust Guard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Access Denied
          </h1>
          {blockedPath && (
            <div className="inline-block px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800/50 text-rose-300 font-mono text-xs">
              Blocked Endpoint: <span className="font-bold text-white">{blockedPath}</span>
            </div>
          )}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            {customMessage}
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
