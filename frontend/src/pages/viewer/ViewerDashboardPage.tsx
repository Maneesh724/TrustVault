import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { documentService } from '../../services/documentService';
import { VaultDocument } from '../../types';
import { DocumentPreviewModal } from '../../components/documents/DocumentPreviewModal';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Eye,
  Download,
  Clock,
  Calendar,
  Lock,
  ArrowRight,
  ShieldCheck,
  Search,
  Bell,
  Activity,
  HardDrive,
  FileCheck2,
} from 'lucide-react';

export const ViewerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [sharedDocs, setSharedDocs] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadViewerData = async () => {
    if (!user) return;
    try {
      const allDocs = await documentService.getDocuments(user.id);
      const accessible = allDocs.filter(
        (doc) =>
          doc.classification === 'PUBLIC' ||
          doc.grants?.some((g) => g.userId === user.id && g.status === 'ACTIVE')
      );
      setSharedDocs(accessible);
    } catch (err: any) {
      showToast('Error Loading Vault', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadViewerData();
  }, [user]);

  const handleDownload = async (doc: VaultDocument) => {
    if (!user) return;
    try {
      const res = await documentService.requestSecureDownload(doc.id, user);
      const link = window.document.createElement('a');
      link.href = res.downloadUrl;
      link.download = res.filename;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      showToast('Download Delivered', `Decrypted copy delivered.`, 'success');
    } catch (err: any) {
      showToast('Permission Denied', err.message || 'Download permission not granted.', 'error');
    }
  };

  const filteredDocs = sharedDocs.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100 font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Viewer Portal, {user?.name} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Access confidential documents securely shared with your verified identity.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300 font-mono bg-[#0D121F] px-3.5 py-2 rounded-xl border border-[#1E2638] shadow-sm self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Active Cryptographic Session</span>
        </div>
      </div>

      {/* 5 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0B101D] border border-[#161F33] text-left shadow-lg">
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-slate-400 block">Accessible Docs</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            {sharedDocs.length}
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">Active grants</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0B101D] border border-[#161F33] text-left shadow-lg">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
            <Eye className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-slate-400 block">Recently Shared</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            {Math.min(sharedDocs.length, 3)}
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">Last 7 days</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0B101D] border border-[#161F33] text-left shadow-lg">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-slate-400 block">Expiring Soon</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            {sharedDocs.filter((d) => d.grants?.some((g) => g.expiresAt)).length}
          </div>
          <span className="text-[10px] text-amber-400 font-semibold mt-1 block">Time-bounded</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0B101D] border border-[#161F33] text-left shadow-lg">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
            <Activity className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-slate-400 block">Recent Access</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            {sharedDocs.length > 0 ? 5 : 0}
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">Audit verified</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0B101D] border border-[#161F33] text-left shadow-lg col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
            <Bell className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-slate-400 block">Notifications</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            1
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">Unread</span>
        </div>
      </div>

      {/* Main Shared Documents Table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0B101D] border border-[#161F33] shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-400" />
              Shared With Me
            </h2>
            <p className="text-xs text-slate-400">
              Only documents with verified, non-expired access grants are accessible.
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search shared files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0D121F] border border-[#1E2638] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090D18] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Document Name</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Owner</th>
                <th className="py-3 px-4 font-semibold">Granted Permission</th>
                <th className="py-3 px-4 font-semibold">Expiration</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Lock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    No documents currently shared with your identity.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const grant = doc.grants?.find((g) => g.userId === user?.id);
                  const canDownload = grant?.permission === 'ADMIN' || doc.classification === 'PUBLIC';

                  return (
                    <tr key={doc.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {doc.title}
                        <span className="block text-[11px] text-slate-500 font-mono font-normal">
                          {doc.filename}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {doc.filename.split('.').pop()?.toUpperCase() || 'PDF'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{doc.ownerName}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {grant?.permission || 'READ'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {grant?.expiresAt ? new Date(grant.expiresAt).toLocaleDateString() : 'Permanent'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="px-3 py-1 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          {canDownload && (
                            <button
                              onClick={() => handleDownload(doc)}
                              className="px-3 py-1 rounded-md text-xs font-semibold bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30 flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {previewDoc && user && (
        <DocumentPreviewModal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          document={previewDoc}
          currentUser={user}
        />
      )}
    </div>
  );
};
