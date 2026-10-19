import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { documentService, UploadDocumentPayload } from '../../services/documentService';
import { securityService } from '../../services/securityService';
import { auditService } from '../../services/auditService';
import { VaultDocument, SystemStats, AuditLog } from '../../types';
import { DocumentCard } from '../../components/documents/DocumentCard';
import { UploadModal } from '../../components/documents/UploadModal';
import { AccessManageModal } from '../../components/documents/AccessManageModal';
import { DocumentPreviewModal } from '../../components/documents/DocumentPreviewModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  ShieldCheck,
  FolderLock,
  Users,
  ShieldAlert,
  HardDrive,
  UploadCloud,
  ArrowUpRight,
  Activity,
  FileCheck2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const OwnerDashboardPage: React.FC = () => {
  const { user, allUsers } = useAuth();
  const { showToast } = useToast();

  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null);
  const [manageAccessDoc, setManageAccessDoc] = useState<VaultDocument | null>(null);

  // Delete document confirm state
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [deleteDocTitle, setDeleteDocTitle] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [docs, systemStats, logs] = await Promise.all([
        documentService.getDocuments(),
        securityService.getSystemStats(),
        auditService.getAuditLogs(),
      ]);
      setDocuments(docs);
      setStats(systemStats);
      setRecentLogs(logs.slice(0, 5));
    } catch (err: any) {
      showToast('Error Loading Data', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const handleUploadSuccess = async (payload: UploadDocumentPayload) => {
    if (!user) return;
    await documentService.uploadDocument(payload, user);
    await loadDashboardData();
  };

  const handlePromptDelete = (docId: string, title: string) => {
    setDeleteDocId(docId);
    setDeleteDocTitle(title);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteDocId || !user) return;
    try {
      await documentService.deleteDocument(deleteDocId, user);
      showToast('Document Deleted', `"${deleteDocTitle}" removed from vault.`, 'success');
      setIsDeleteOpen(false);
      await loadDashboardData();
    } catch (err: any) {
      showToast('Deletion Failed', err.message, 'error');
    }
  };

  const handleDownload = async (docId: string) => {
    if (!user) return;
    try {
      const res = await documentService.requestSecureDownload(docId, user);
      const link = window.document.createElement('a');
      link.href = res.downloadUrl;
      link.download = res.filename;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      showToast('Stream Downloaded', 'Decrypted payload delivered.', 'success');
    } catch (err: any) {
      showToast('Download Denied', err.message, 'error');
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Zero-Trust Governance Active
            </span>
            <span className="text-xs text-slate-500">• Real-Time Invalidation</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Security Overview, {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Cryptographic document vault with continuous authorization, immediate revocation guards, and append-only auditability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Document
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vaulted Documents</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalDocuments ?? 0}</h3>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-1">
              <FileCheck2 className="w-3.5 h-3.5" /> 100% SHA-256 Hashed
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
            <FolderLock className="w-6 h-6" />
          </div>
        </div>

        {/* Active Grants */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Grants</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats?.activeGrants ?? 0}</h3>
            <span className="text-[11px] text-cyan-700 font-semibold flex items-center gap-0.5 mt-1">
              <Users className="w-3.5 h-3.5" /> Across {stats?.activeUsers ?? 0} Users
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Revoked Grants (Security Metric) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Immediate Revocations</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">{stats?.revokedGrants ?? 0}</h3>
            <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-0.5 mt-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Subsequent Access Blocked
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Tamper Integrity Score */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tamper Integrity</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats?.tamperIntegrityScore ?? 100}%</h3>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Zero Discrepancies
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* STRIDE Defense Banner & Threat Status */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-900">STRIDE Threat Mitigations Active</h4>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Zero-Trust request validation, SHA-256 fingerprint matching, and immutable audit logging enforced.
            </p>
          </div>
        </div>
        <Link
          to="/security"
          className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 shrink-0"
        >
          View Threat Model & Matrix <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Recent Vaulted Documents */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Vault Documents</h2>
            <p className="text-xs text-slate-500">Protected files with active zero-trust grants</p>
          </div>
          <Link
            to="/documents"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View Document Library →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.slice(0, 3).map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              currentUser={user}
              onPreview={(d) => setPreviewDoc(d)}
              onManageAccess={(d) => setManageAccessDoc(d)}
              onDelete={handlePromptDelete}
              onDownload={handleDownload}
            />
          ))}
        </div>
      </div>

      {/* Live Tamper-Evident Audit Feed */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Real-Time Audit Activity Feed</h3>
          </div>
          <Link to="/audit" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            View All Audit Logs →
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recentLogs.map((log) => (
            <div key={log.id} className="py-3 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    log.outcome === 'DENIED'
                      ? 'bg-rose-500 animate-pulse'
                      : log.outcome === 'FAILED'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{log.action}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        log.outcome === 'DENIED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {log.outcome}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Actor: <span className="text-slate-700 font-medium">{log.actorName}</span> •{' '}
                    {log.targetResourceName ? `Target: ${log.targetResourceName}` : log.details?.reason || 'System operation'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 shrink-0 font-mono">
                <Clock className="w-3 h-3" />
                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {previewDoc && (
        <DocumentPreviewModal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          document={previewDoc}
          currentUser={user}
        />
      )}

      {manageAccessDoc && (
        <AccessManageModal
          isOpen={!!manageAccessDoc}
          onClose={() => setManageAccessDoc(null)}
          document={manageAccessDoc}
          currentUser={user}
          allUsers={allUsers}
          onGrantsChanged={loadDashboardData}
        />
      )}

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Vault Document"
        message={`Are you sure you want to permanently delete "${deleteDocTitle}"? This will revoke all active grants and immutably record the deletion in the audit trail.`}
        confirmText="Permanently Delete"
        danger={true}
      />
    </div>
  );
};
