import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ShieldAlert, ArrowRight, ShieldCheck } from 'lucide-react';

export const PendingApprovalPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#070A13] flex items-center justify-center p-4 sm:p-6 font-sans text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="w-full max-w-lg bg-[#0D121F] border border-amber-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-500/20">
          <Clock className="w-8 h-8 stroke-[2.2]" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Account Pending Approval
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Registration Under Review
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            Your corporate Document Owner account has been successfully created and your email has been verified. In accordance with zero-trust governance, an authorized Administrator must review and approve your account before document access is granted.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left text-xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-400">Account Type:</span>
            <span className="font-bold text-white">Document Owner</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-400">Current Status:</span>
            <span className="font-bold text-amber-400">PENDING_APPROVAL</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Next Action:</span>
            <span className="text-slate-300">Awaiting Administrator Authorization</span>
          </div>
        </div>

        <div className="pt-2">
          <Link
            to="/login"
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Return to Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
