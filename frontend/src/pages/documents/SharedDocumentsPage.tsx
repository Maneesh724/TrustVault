import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { documentService } from '../../services/documentService';
import { VaultDocument } from '../../types';
import { DocumentPreviewModal } from '../../components/documents/DocumentPreviewModal';
import { EmptyState } from '../../components/common/EmptyState';
import { ClassificationBadge, PermissionBadge } from '../../components/common/Badge';
import {
  Share2,
  Eye,
  Download,
  Calendar,
  Lock,
  User,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SharedDocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [sharedDocs, setSharedDocs] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null);

  const loadSharedDocs = async () => {
    if (!user) return;
    try {
      const allDocs = await documentService.getDocuments(user?.id);
      const filtered = allDocs.filter(
        (doc) =>
          doc.ownerId !== user.id &&
          (doc.classification === 'PUBLIC' ||
            doc.grants.some((g) => g.userId === user.id && g.status === 'ACTIVE'))
      );
      setSharedDocs(filtered);
    } catch (err: any) {
      showToast('Error Loading Shared Docs', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSharedDocs();
  }, [user]);

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
      showToast('Download Ready', `Downloading "${res.filename}"...`, 'success');
    } catch (err: any) {
      showToast('Download Denied', err.message, 'error');
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-slate-100 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Documents Shared With You</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Restricted corporate artifacts where your identity holds an active discretionary access grant.
        </p>
      </div>

      {sharedDocs.length === 0 ? (
        <EmptyState
          icon={Share2}
          title="No Shared Documents"
          description="Other users have not granted you access to confidential documents yet. Check back when grants are assigned."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sharedDocs.map((doc) => {
            const userGrant = doc.grants.find((g) => g.userId === user.id && g.status === 'ACTIVE');
            const permissionLevel = userGrant ? userGrant.permission : 'READ';

            return (
              <div
                key={doc.id}
                className="rounded-2xl bg-[#0B101D] border border-[#161F33] hover:border-emerald-500/40 hover:bg-[#0E1526] shadow-lg shadow-black/20 p-5 flex flex-col justify-between transition-all duration-300 card-hover-glow"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <ClassificationBadge classification={doc.classification} />
                    <PermissionBadge permission={permissionLevel} />
                  </div>

                  <Link
                    to={`/documents/${doc.id}`}
                    className="text-sm font-bold text-white hover:text-emerald-400 transition-colors line-clamp-1 block mb-1"
                  >
                    {doc.title}
                  </Link>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {doc.description || 'Enterprise protected document in zero-trust vault.'}
                  </p>

                  <div className="p-3 rounded-xl bg-[#080D1A] border border-[#161F33] text-[11px] space-y-1.5 mb-4 text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Shared by:</span>
                      <span className="font-semibold text-white">{doc.ownerName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Granted on:</span>
                      <span className="text-slate-300">
                        {userGrant ? new Date(userGrant.grantedAt).toLocaleDateString() : 'Public Access'}
                      </span>
                    </div>
                    {userGrant?.expiresAt && (
                      <div className="flex items-center justify-between text-amber-400 font-medium">
                        <span>Expires:</span>
                        <span>{new Date(userGrant.expiresAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#161F33] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(doc.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  <Link
                    to={`/documents/${doc.id}`}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group"
                  >
                    <span>View Grant</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewDoc && (
        <DocumentPreviewModal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          document={previewDoc}
          currentUser={user}
        />
      )}
    </div>
  );
};
