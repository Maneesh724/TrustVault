import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowRight } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#070A13] flex items-center justify-center p-4 sm:p-6 font-sans text-slate-100">
      <div className="w-full max-w-md bg-[#0D121F] border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
          <HelpCircle className="w-8 h-8 stroke-[2.2]" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
            HTTP 404
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            The requested vault address or document route does not exist.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Return to Landing Page</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
