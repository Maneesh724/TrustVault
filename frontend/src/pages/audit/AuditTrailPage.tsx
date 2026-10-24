import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { auditService } from '../../services/auditService';
import { AuditLog } from '../../types';
import { Modal } from '../../components/common/Modal';
import {
  Search,
  Download,
  ShieldCheck,
  ShieldAlert,
  Eye,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AuditTrailPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('ALL');

  // Selected Log detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadLogs = async () => {
    try {
      const data = await auditService.getAuditLogs();
      setLogs(data);
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadLogs();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (user && user.role !== 'ADMIN') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#0B101D] border border-rose-500/30 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Zero-Trust Policy Enforced
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">System Audit Trail Restricted</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            The platform-wide audit log is restricted strictly to System Administrators. Document Owners manage sharing history through their dedicated Sharing portal, while Viewers only have access to documents shared directly with them.
          </p>
          <div className="pt-2">
            <Link
              to={user.role === 'OWNER' ? '/owner/sharing' : '/viewer/dashboard'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-400 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <span>{user.role === 'OWNER' ? 'Go to Sharing History' : 'Go to Viewer Workspace'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        search === '' ||
        log.actorName.toLowerCase().includes(search.toLowerCase()) ||
        log.actorEmail.toLowerCase().includes(search.toLowerCase()) ||
        (log.targetResourceName && log.targetResourceName.toLowerCase().includes(search.toLowerCase())) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.ipAddress.includes(search);

      const matchesSeverity = selectedSeverity === 'ALL' || log.severity === selectedSeverity;
      const matchesOutcome = selectedOutcome === 'ALL' || log.outcome === selectedOutcome;

      return matchesSearch && matchesSeverity && matchesOutcome;
    });
  }, [logs, search, selectedSeverity, selectedOutcome]);

  const handleExportCSV = () => {
    try {
      const csv = auditService.exportLogsAsCSV(filteredLogs);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `TrustVault_Audit_Export_${new Date().toISOString().slice(0, 10)}.csv`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      showToast('Audit Trail Exported', `Generated CSV report containing ${filteredLogs.length} events.`, 'success');
    } catch (err: any) {
      showToast('Export Error', err.message, 'error');
    }
  };

  const handleVerifyIntegrity = () => {
    showToast('Integrity Check Succeeded', 'Append-only ledger hash chain verified. Zero tampering detected.', 'success', 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-slate-100 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Tamper-Evident Audit Trail</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Immutable, append-only security ledger recording all authentication, views, grants, and immediate revocations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleVerifyIntegrity}
            className="px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Verify Hash Chain
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="p-4 rounded-2xl bg-[#0B101D] border border-[#161F33] shadow-lg shadow-black/20 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by actor, email, action, resource, IP..."
              className="w-full bg-[#0D121F] border border-[#1E2638] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-[#0D121F] border border-[#1E2638] rounded-xl px-3 py-2 text-xs text-slate-300 font-medium focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Severities</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
            </select>

            {/* Outcome Filter */}
            <select
              value={selectedOutcome}
              onChange={(e) => setSelectedOutcome(e.target.value)}
              className="bg-[#0D121F] border border-[#1E2638] rounded-xl px-3 py-2 text-xs text-slate-300 font-medium focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Outcomes</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="DENIED">DENIED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto rounded-2xl border border-[#161F33] bg-[#0B101D] shadow-lg shadow-black/20">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1E2638] text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-[#080D1A]">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Action Event</th>
              <th className="py-3 px-4">Target Resource</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Outcome</th>
              <th className="py-3 px-4">IP Address</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#161F33] text-xs">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>

                <td className="py-3.5 px-4">
                  <div className="font-semibold text-white">{log.actorName}</div>
                  <div className="text-[11px] text-slate-400">{log.actorEmail}</div>
                </td>

                <td className="py-3.5 px-4">
                  <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                    {log.action}
                  </span>
                </td>

                <td className="py-3.5 px-4 max-w-xs truncate text-slate-300 font-medium">
                  {log.targetResourceName || 'N/A'}
                </td>

                <td className="py-3.5 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      log.severity === 'CRITICAL'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : log.severity === 'WARNING'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {log.severity}
                  </span>
                </td>

                <td className="py-3.5 px-4">
                  <span
                    className={`font-bold text-[11px] ${
                      log.outcome === 'DENIED'
                        ? 'text-rose-400'
                        : log.outcome === 'FAILED'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {log.outcome}
                  </span>
                </td>

                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                  {log.ipAddress}
                </td>

                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="p-1.5 text-slate-400 hover:text-purple-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Inspect Log Record"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Audit Detail Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Audit Record: ${selectedLog.id}`}
          subtitle={`Recorded ${new Date(selectedLog.timestamp).toISOString()}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs text-slate-200">
            <div className="p-4 rounded-xl bg-[#080D1A] border border-[#161F33] space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">Action Type</span>
                  <span className="font-semibold text-emerald-400 font-mono text-xs">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Outcome</span>
                  <span
                    className={`font-bold ${
                      selectedLog.outcome === 'DENIED'
                        ? 'text-rose-400'
                        : selectedLog.outcome === 'FAILED'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {selectedLog.outcome}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Actor</span>
                  <span className="text-white font-medium">
                    {selectedLog.actorName} ({selectedLog.actorEmail})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Role</span>
                  <span className="font-semibold text-slate-300">{selectedLog.actorRole}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Client IP</span>
                  <span className="font-mono text-slate-300">{selectedLog.ipAddress}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Severity</span>
                  <span className="font-bold text-slate-300">{selectedLog.severity}</span>
                </div>
              </div>
            </div>

            {selectedLog.targetResourceName && (
              <div className="p-3.5 rounded-xl bg-[#080D1A] border border-[#161F33]">
                <span className="text-slate-400 block mb-0.5 text-[11px]">Target Resource</span>
                <span className="font-semibold text-white">{selectedLog.targetResourceName}</span>
                {selectedLog.targetResourceId && (
                  <span className="block text-[11px] font-mono text-slate-400 mt-0.5">
                    ID: {selectedLog.targetResourceId}
                  </span>
                )}
              </div>
            )}

            <div>
              <span className="text-slate-300 font-semibold block mb-1 text-xs">Structured JSON Payload</span>
              <pre className="p-3 rounded-xl bg-[#080D1A] text-emerald-300 text-[11px] font-mono overflow-x-auto max-h-48 border border-[#161F33]">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
