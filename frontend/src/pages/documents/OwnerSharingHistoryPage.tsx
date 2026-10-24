import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { documentService } from '../../services/documentService';
import { VaultDocument, DocumentGrant, CustomUser } from '../../types';
import { AccessManageModal } from '../../components/documents/AccessManageModal';
import { EmptyState } from '../../components/common/EmptyState';
import { PermissionBadge } from '../../components/common/Badge';
import {
  Share2,
  Key,
  ShieldCheck,
  ShieldAlert,
  Clock,
  User,
  FileText,
  Trash2,
  RotateCcw,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface FlattenedGrant {
  grantId: string;
  documentId: string;
  documentTitle: string;
  documentClassification: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  permission: 'READ' | 'EDIT';
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  grantedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  revokedBy?: string;
}

export const OwnerSharingHistoryPage: React.FC = () => {
  const { user, allUsers } = useAuth();
  const { showToast } = useToast();

  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocForGrant, setSelectedDocForGrant] = useState<VaultDocument | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REVOKED' | 'EXPIRED'>('ALL');
  const [activeTab, setActiveTab] = useState<'GRANTS' | 'EVENT_LOGS'>('GRANTS');

  const loadOwnerDocuments = async () => {
    if (!user) return;
    try {
      const allDocs = await documentService.getDocuments(user.id);
      // Strictly filter to documents owned by this owner
      const owned = allDocs.filter((d) => d.ownerId === user.id);
      setDocuments(owned);
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwnerDocuments();
  }, [user]);

  // Flatten all grants across the owner's documents
  const allGrants = useMemo(() => {
    const list: FlattenedGrant[] = [];
    documents.forEach((doc) => {
      if (doc.grants && doc.grants.length > 0) {
        doc.grants.forEach((g) => {
          const recipient = allUsers.find((u) => u.id === g.userId);
          const isExpired = g.expiresAt ? new Date(g.expiresAt).getTime() < Date.now() : false;
          const computedStatus: 'ACTIVE' | 'REVOKED' | 'EXPIRED' =
            g.status === 'REVOKED' ? 'REVOKED' : isExpired ? 'EXPIRED' : 'ACTIVE';

          list.push({
            grantId: g.id,
            documentId: doc.id,
            documentTitle: doc.title,
            documentClassification: doc.classification,
            recipientId: g.userId,
            recipientName: recipient ? recipient.name : g.userName || 'Registered Viewer',
            recipientEmail: recipient ? recipient.email : g.userEmail || 'viewer@trustvault.com',
            permission: (g.permission as 'READ' | 'EDIT') || 'READ',
            status: computedStatus,
            grantedAt: g.grantedAt,
            expiresAt: g.expiresAt || undefined,
            revokedAt: g.revokedAt,
            revokedBy: g.revokedBy,
          });
        });
      }
    });
    return list.sort((a, b) => new Date(b.grantedAt).getTime() - new Date(a.grantedAt).getTime());
  }, [documents, allUsers]);

  const filteredGrants = useMemo(() => {
    return allGrants.filter((g) => {
      const matchesSearch =
        search === '' ||
        g.documentTitle.toLowerCase().includes(search.toLowerCase()) ||
        g.recipientName.toLowerCase().includes(search.toLowerCase()) ||
        g.recipientEmail.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || g.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [allGrants, search, statusFilter]);

  const activeCount = allGrants.filter((g) => g.status === 'ACTIVE').length;
  const revokedCount = allGrants.filter((g) => g.status === 'REVOKED').length;
  const expiredCount = allGrants.filter((g) => g.status === 'EXPIRED').length;
  const uniqueRecipients = new Set(allGrants.map((g) => g.recipientId)).size;

  const handleRevoke = async (docId: string, userId: string, recipientName: string) => {
    if (!user) return;
    try {
      await documentService.revokeAccess(docId, userId, user.name);
      showToast('Access Revoked', `Revoked access for ${recipientName} immediately.`, 'success');
      await loadOwnerDocuments();
    } catch (err: any) {
      showToast('Revocation Failed', err.message, 'error');
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-slate-100 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#161F33]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              Document Sharing & Access Control
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Document Sharing History & Permissions
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage active grants, review access history, and immediately revoke permissions for all documents you own.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {documents.length > 0 && (
            <button
              onClick={() => setSelectedDocForGrant(documents[0])}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Grant New Access</span>
            </button>
          )}
        </div>
      </div>

      {/* Scope Disclaimer Banner */}
      <div className="p-3.5 rounded-2xl bg-[#0B101D] border border-emerald-500/20 flex items-start sm:items-center gap-3 text-xs text-slate-300">
        <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
        <span className="leading-relaxed">
          <strong className="text-emerald-300">Zero-Trust Privacy Guarantee:</strong> You are viewing sharing records and access history strictly for documents you own. System-wide audit logs and other owners' private documents are shielded.
        </span>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0B101D] border border-[#161F33] card-hover-glow transition-all">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Active Grants
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{activeCount}</span>
            <span className="text-[11px] text-slate-500">currently authorized</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B101D] border border-[#161F33] card-hover-glow transition-all">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Revoked Grants
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400">{revokedCount}</span>
            <span className="text-[11px] text-slate-500">access terminated</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B101D] border border-[#161F33] card-hover-glow transition-all">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Expired Grants
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">{expiredCount}</span>
            <span className="text-[11px] text-slate-500">time elapsed</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B101D] border border-[#161F33] card-hover-glow transition-all">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Unique Viewers
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-400">{uniqueRecipients}</span>
            <span className="text-[11px] text-slate-500">recipients</span>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="p-4 rounded-2xl bg-[#0B101D] border border-[#161F33] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by document or recipient email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#080D1A] border border-[#161F33] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          <span className="text-xs text-slate-400 font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter:
          </span>
          {(['ALL', 'ACTIVE', 'REVOKED', 'EXPIRED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-[#080D1A] text-slate-400 hover:text-white border border-[#161F33]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Sharing Grants Table */}
      {filteredGrants.length === 0 ? (
        <EmptyState
          icon={Share2}
          title="No Sharing Records Found"
          description={
            allGrants.length === 0
              ? "You haven't shared any of your documents yet. Click 'Grant New Access' or visit your Document Library to share files with authorized viewers."
              : 'No sharing grants match your search or filter criteria.'
          }
        />
      ) : (
        <div className="rounded-2xl bg-[#0B101D] border border-[#161F33] overflow-hidden shadow-xl card-hover-glow">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#080D1A] border-b border-[#161F33] text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-4">Document Title</th>
                  <th className="px-5 py-4">Shared With (Viewer)</th>
                  <th className="px-5 py-4">Permission Granted</th>
                  <th className="px-5 py-4">Granted Date</th>
                  <th className="px-5 py-4">Expiration</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Instant Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161F33]/70 text-slate-200">
                {filteredGrants.map((grant) => {
                  return (
                    <tr key={`${grant.documentId}-${grant.grantId}`} className="hover:bg-[#0E1526]/60 transition-colors">
                      <td className="px-5 py-4">
                        <Link
                          to={`/owner/documents/${grant.documentId}`}
                          className="font-bold text-white hover:text-emerald-400 flex items-center gap-2 group transition-colors"
                        >
                          <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="truncate max-w-[220px]">{grant.documentTitle}</span>
                        </Link>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                          ID: {grant.documentId.slice(0, 14)}...
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-200">{grant.recipientName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{grant.recipientEmail}</div>
                      </td>

                      <td className="px-5 py-4">
                        <PermissionBadge permission={grant.permission} />
                      </td>

                      <td className="px-5 py-4 font-mono text-slate-400">
                        {new Date(grant.grantedAt).toLocaleDateString([], {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      <td className="px-5 py-4 font-mono text-slate-400">
                        {grant.expiresAt ? (
                          <span className="text-amber-300">
                            {new Date(grant.expiresAt).toLocaleDateString([], {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-500">Permanent</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {grant.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            ACTIVE
                          </span>
                        )}
                        {grant.status === 'REVOKED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            REVOKED
                          </span>
                        )}
                        {grant.status === 'EXPIRED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            EXPIRED
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {grant.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleRevoke(grant.documentId, grant.recipientId, grant.recipientName)}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                            title="Revoke access immediately"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Revoke Access</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const doc = documents.find((d) => d.id === grant.documentId);
                              if (doc) setSelectedDocForGrant(doc);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Restore or grant new permission"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Re-grant</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Granting New Access */}
      {selectedDocForGrant && (
        <AccessManageModal
          isOpen={!!selectedDocForGrant}
          onClose={() => {
            setSelectedDocForGrant(null);
            loadOwnerDocuments();
          }}
          document={selectedDocForGrant}
          allUsers={allUsers}
          currentUser={user}
          onGrantsChanged={loadOwnerDocuments}
        />
      )}
    </div>
  );
};
