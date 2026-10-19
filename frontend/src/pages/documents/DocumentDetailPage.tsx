import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { documentService } from '../../services/documentService';
import { auditService } from '../../services/auditService';
import { VaultDocument, PermissionLevel, AuditLog } from '../../types';
import { ClassificationBadge, RoleBadge, StatusBadge } from '../../components/common/Badge';
import { AccessManageModal } from '../../components/documents/AccessManageModal';
import { DocumentPreviewModal } from '../../components/documents/DocumentPreviewModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  Shield,
  ShieldAlert,
  ArrowLeft,
  Key,
  Download,
  Eye,
  Hash,
  History,
  Activity,
  Trash2,
  Lock,
  CheckCircle2,
  FileText,
  Clock,
  UserCheck,
} from 'lucide-react';

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, allUsers } = useAuth();
  const { showToast } = useToast();

  const [document, setDocument] = useState<VaultDocument | null>(null);
  const [userPermission, setUserPermission] = useState<PermissionLevel | 'NONE' | 'REVOKED'>('NONE');
  const [docAuditLogs, setDocAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isManageAccessOpen, setIsManageAccessOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const loadDocumentDetails = async () => {
    if (!id || !user) return;
    try {
      const res = await documentService.getDocumentById(id, user);
      setDocument(res.document);
      setUserPermission(res.userPermission);

      // Fetch logs for this document
      const allLogs = await auditService.getAuditLogs();
      const filtered = allLogs.filter((l) => l.targetResourceId === id);
      setDocAuditLogs(filtered);
    } catch (err: any) {
      showToast('Document Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocumentDetails();
  }, [id, user]);

  const handleDownload = async () => {
    if (!document || !user) return;
    try {
      const res = await documentService.requestSecureDownload(document.id, user);
      const link = window.document.createElement('a');
      link.href = res.downloadUrl;
      link.download = res.filename;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      showToast('Download Verified', 'Decrypted payload delivered via ephemeral signed stream.', 'success');
      await loadDocumentDetails();
    } catch (err: any) {
      showToast('Download Denied', err.message, 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!document || !user) return;
    try {
      await documentService.deleteDocument(document.id, user);
      showToast('Document Deleted', `"${document.title}" removed.`, 'success');
      navigate('/documents');
    } catch (err: any) {
      showToast('Deletion Failed', err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-400 text-xs font-mono">
        Evaluating zero-trust authorization token...
      </div>
    );
  }

  if (!document || !user) {
    return (
      <div className="text-center p-12">
        <p className="text-sm text-slate-400">Document not found.</p>
        <Link to="/documents" className="text-xs text-indigo-400 hover:underline mt-2 inline-block">
          Return to Library
        </Link>
      </div>
    );
  }

  // If user permission is REVOKED or NONE on a non-public document, show zero-trust blocked screen!
  const isAccessDenied = userPermission === 'REVOKED' || (userPermission === 'NONE' && document.classification !== 'PUBLIC');

  if (isAccessDenied) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-3xl bg-white border border-rose-200 text-center space-y-4 shadow-sm animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Zero-Trust Access Denied</h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
          {userPermission === 'REVOKED'
            ? 'Your access grant to this document was revoked by the document owner or compliance administrator. Under TrustVault zero-trust architecture, subsequent requests are terminated immediately.'
            : 'You do not hold an active cryptographic grant for this restricted document. Unauthenticated access attempts are immutably logged.'}
        </p>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs font-mono space-y-1 text-slate-600">
          <div>Document ID: <span className="text-slate-900 font-semibold">{document.id}</span></div>
          <div>Requesting Actor: <span className="text-slate-900 font-semibold">{user.name} ({user.email})</span></div>
          <div>Grant Evaluation Status: <span className="text-rose-600 font-bold">{userPermission}</span></div>
          <div>Timestamp: <span className="text-slate-700">{new Date().toISOString()}</span></div>
          <div>Threat Defense: <span className="text-amber-700 font-semibold">Elevation of Privilege / Broken Object Level Authorization Guard</span></div>
        </div>

        <div className="pt-2 flex justify-center gap-3">
          <Link
            to="/documents"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Library
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = document.ownerId === user.id || user.role === 'OWNER' || user.role === 'ADMIN';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/documents"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Document Library
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            Sandbox Preview
          </button>

          <button
            onClick={handleDownload}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>

          {isOwner && (
            <>
              <button
                onClick={() => setIsManageAccessOpen(true)}
                className="px-3.5 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-amber-600" />
                Manage Grants
              </button>

              <button
                onClick={() => setIsDeleteOpen(true)}
                className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                title="Delete Document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Document Details Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <ClassificationBadge classification={document.classification} />
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                Evaluated Access: {userPermission}
              </span>
              {document.watermarkEnabled && (
                <span className="text-[11px] font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  <Shield className="w-3 h-3 text-cyan-600" /> Watermark Enforced
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{document.title}</h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
              {document.description || 'Enterprise protected document in zero-trust vault.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-right shrink-0">
            <span className="text-[11px] text-slate-500 font-mono block">Original File: {document.filename}</span>
            <span className="text-xs font-bold text-slate-800 mt-1 block">
              {(document.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>
        </div>

        {/* Cryptographic SHA-256 Fingerprint */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-blue-600" />
              SHA-256 Checksum Fingerprint (Integrity Verified)
            </span>
            <span className="text-emerald-700 flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Immutable Hash
            </span>
          </div>
          <p className="font-mono text-xs text-slate-800 break-all select-all pt-1">
            {document.sha256Hash}
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs">
          <div>
            <span className="text-slate-500 block">Owner / Author</span>
            <span className="font-semibold text-slate-900 mt-0.5 block">{document.ownerName}</span>
            <span className="text-[10px] text-slate-500">{document.ownerEmail}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Creation Timestamp</span>
            <span className="font-semibold text-slate-900 mt-0.5 block">
              {new Date(document.createdAt).toLocaleDateString()}
            </span>
            <span className="text-[10px] text-slate-500">{new Date(document.createdAt).toLocaleTimeString()}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Active Grants</span>
            <span className="font-semibold text-blue-700 mt-0.5 block">{document.grantsCount} users</span>
          </div>
          <div>
            <span className="text-slate-500 block">Current Version</span>
            <span className="font-semibold text-emerald-700 mt-0.5 block">
              v{document.versions.length}.0
            </span>
          </div>
        </div>
      </div>

      {/* Access Grants & Permissions Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              Document Access Grants ({document.grants.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized users with read/edit capabilities. Revoking a grant takes effect immediately.
            </p>
          </div>
          {isOwner && (
            <button
              onClick={() => setIsManageAccessOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              Add / Revoke Grants
            </button>
          )}
        </div>

        {document.grants.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl">
            Only the document owner currently holds access to this artifact.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Grantee</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Permission</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Granted By</th>
                  <th className="py-2.5 px-3">Expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {document.grants.map((grant) => (
                  <tr key={grant.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-900">{grant.userName}</div>
                      <div className="text-[11px] text-slate-500">{grant.userEmail}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <RoleBadge role={grant.userRole} />
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">
                      {grant.permission}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={grant.status} />
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{grant.grantedBy}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {grant.expiresAt ? new Date(grant.expiresAt).toLocaleDateString() : 'Indefinite'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Version History */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-600" />
          Cryptographic Version History ({document.versions.length})
        </h3>

        <div className="space-y-3">
          {document.versions.map((ver) => (
            <div
              key={ver.id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-700">v{ver.versionNumber}.0</span>
                  <span className="text-slate-700 font-medium">Uploaded by {ver.uploaderName}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">{new Date(ver.uploadedAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-600 text-xs mt-1">{ver.changeSummary}</p>
                <p className="text-[11px] font-mono text-slate-500 mt-1">
                  SHA-256: {ver.sha256Hash}
                </p>
              </div>

              <div className="text-slate-500 text-xs font-mono shrink-0">
                {(ver.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Document Specific Audit Trail */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          Document Audit History ({docAuditLogs.length} events)
        </h3>

        {docAuditLogs.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl">
            No audit records registered for this document yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {docAuditLogs.map((log) => (
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
                      Actor: <span className="text-slate-700 font-medium">{log.actorName}</span> ({log.actorEmail}) • IP:{' '}
                      {log.ipAddress}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 shrink-0 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {isPreviewOpen && (
        <DocumentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          document={document}
          currentUser={user}
        />
      )}

      {isManageAccessOpen && (
        <AccessManageModal
          isOpen={isManageAccessOpen}
          onClose={() => setIsManageAccessOpen(false)}
          document={document}
          currentUser={user}
          allUsers={allUsers}
          onGrantsChanged={loadDocumentDetails}
        />
      )}

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Vault Document"
        message={`Are you sure you want to permanently delete "${document.title}"? This cannot be undone.`}
        confirmText="Delete Document"
        danger={true}
      />
    </div>
  );
};
