import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { securityService } from '../../services/securityService';
import { SecurityPolicy, ThreatAlert, SystemStats } from '../../types';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  FileCode,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Activity,
  Layers,
} from 'lucide-react';

export const SecurityCenterPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [threats, setThreats] = useState<ThreatAlert[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSecurityData = async () => {
    try {
      const [pol, thr, st] = await Promise.all([
        securityService.getPolicies(),
        securityService.getThreatAlerts(),
        securityService.getSystemStats(),
      ]);
      setPolicies(pol);
      setThreats(thr);
      setStats(st);
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityData();
  }, [user]);

  const handleTogglePolicy = async (policyId: string, currentEnabled: boolean) => {
    if (!user) return;
    try {
      await securityService.togglePolicy(policyId, !currentEnabled, user);
      showToast(
        'Policy Updated',
        `Policy state set to ${!currentEnabled ? 'ENFORCED' : 'DISABLED'}. Logged to audit trail.`,
        'success'
      );
      await loadSecurityData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-slate-100 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            STRIDE Threat Model Enforced
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Security & Zero-Trust Governance Center</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Active threat mitigation controls, cryptographic verification health, and dynamic policy enforcement.
        </p>
      </div>

      {/* Security Health Score Banner */}
      <div className="p-6 rounded-2xl bg-[#0B101D] border border-[#161F33] shadow-lg shadow-black/20 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="space-y-1 md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-base font-bold text-white">Zero-Trust Posture: Enterprise Secure</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            All document access is validated continuously against the relational authorization store. Tokens are short-lived, media files are stored outside web roots, and all revocation actions immediately take effect.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> SHA-256 Digest Matching
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Immediate Revocation
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Immutable Audit Ledger
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#080D1A] border border-[#161F33] text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Integrity Score</span>
          <span className="text-3xl font-extrabold text-emerald-400 mt-1 block">
            {stats?.tamperIntegrityScore ?? 99.8}%
          </span>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">Zero Unmitigated Anomalies</span>
        </div>
      </div>

      {/* Active Threat Alerts & Incident Mitigations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h3 className="text-base font-bold text-white">Active Threat Mitigations & Incident Ledger</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {threats.length} Mitigated Incidents
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {threats.map((thr) => (
            <div
              key={thr.id}
              className="p-5 rounded-2xl bg-[#0B101D] border border-[#161F33] shadow-lg shadow-black/20 space-y-3 card-hover-glow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      thr.severity === 'CRITICAL'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {thr.severity}
                  </span>
                  <span className="text-[11px] font-semibold text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded-md border border-purple-500/30">
                    {thr.threatCategory}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  {thr.mitigationStatus}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white">{thr.title}</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{thr.description}</p>
              </div>

              <div className="pt-2 border-t border-[#161F33] flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Source IP: {thr.sourceIp}</span>
                <span>{new Date(thr.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STRIDE Defense Matrix Reference */}
      <div className="p-6 rounded-2xl bg-[#0B101D] border border-[#161F33] shadow-lg shadow-black/20 space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <h3 className="text-base font-bold text-white">STRIDE Security Architecture Matrix</h3>
        </div>
        <p className="text-xs text-slate-400">
          Implemented mitigations according to <code className="text-emerald-400 font-semibold font-mono">THREATS.md</code>:
        </p>

        <div className="overflow-x-auto rounded-xl border border-[#161F33]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#080D1A] border-b border-[#161F33] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Threat</th>
                <th className="py-2.5 px-3">Attack Vector</th>
                <th className="py-2.5 px-3">TrustVault Defense Mechanism</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#161F33]">
              <tr className="hover:bg-slate-900/40">
                <td className="py-2.5 px-3 font-bold text-rose-400">Spoofing</td>
                <td className="py-2.5 px-3 text-slate-300 font-medium">Session hijacking, forged tokens</td>
                <td className="py-2.5 px-3 text-slate-400">HttpOnly cookies, short-lived JWT, mandatory email OTP</td>
                <td className="py-2.5 px-3"><span className="text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 text-[11px]">Active</span></td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-2.5 px-3 font-bold text-amber-400">Tampering</td>
                <td className="py-2.5 px-3 text-slate-300 font-medium">File alterations at rest, audit log modification</td>
                <td className="py-2.5 px-3 text-slate-400">Client + Server SHA-256 fingerprint verification; DB immutable triggers</td>
                <td className="py-2.5 px-3"><span className="text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 text-[11px]">Active</span></td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-2.5 px-3 font-bold text-purple-400">Repudiation</td>
                <td className="py-2.5 px-3 text-slate-300 font-medium">Denying sharing or download actions</td>
                <td className="py-2.5 px-3 text-slate-400">Append-only audit trail capturing user ID, IP address, timestamp & outcome</td>
                <td className="py-2.5 px-3"><span className="text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 text-[11px]">Active</span></td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-2.5 px-3 font-bold text-teal-400">Information Disclosure</td>
                <td className="py-2.5 px-3 text-slate-300 font-medium">IDOR, unauthorized file downloads, public paths</td>
                <td className="py-2.5 px-3 text-slate-400">Pre-signed ephemeral stream tokens (60s TTL), dynamic watermark overlay</td>
                <td className="py-2.5 px-3"><span className="text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 text-[11px]">Active</span></td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-2.5 px-3 font-bold text-purple-400">Elevation of Privilege</td>
                <td className="py-2.5 px-3 text-slate-300 font-medium">Stale tokens retaining access after revocation</td>
                <td className="py-2.5 px-3 text-slate-400">Immediate revocation check on every subsequent request via dynamic gate</td>
                <td className="py-2.5 px-3"><span className="text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 text-[11px]">Active</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Policies Toggle Panel */}
      <div className="p-6 rounded-2xl bg-[#0B101D] border border-[#161F33] shadow-lg shadow-black/20 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          Active Zero-Trust Policy Switches
        </h3>
        <p className="text-xs text-slate-400">
          Enforce or relax real-time zero-trust guardrails. Changes are recorded immediately in the audit trail.
        </p>

        <div className="space-y-3">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="p-4 rounded-xl bg-[#080D1A] border border-[#161F33] flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white">{policy.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300 font-medium">
                    {policy.category}
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl">{policy.description}</p>
                <p className="text-[11px] text-emerald-400 font-semibold">Mitigates: {policy.threatRef}</p>
              </div>

              <button
                type="button"
                onClick={() => handleTogglePolicy(policy.id, policy.enabled)}
                className={`p-1 rounded-full transition-colors cursor-pointer ${
                  policy.enabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-600 hover:text-slate-500'
                }`}
                title={policy.enabled ? 'Click to disable' : 'Click to enable'}
              >
                {policy.enabled ? (
                  <ToggleRight className="w-9 h-9" />
                ) : (
                  <ToggleLeft className="w-9 h-9" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
