import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { documentService, UploadDocumentPayload } from '../../services/documentService';
import { VaultDocument, DocumentClassification } from '../../types';
import { DocumentCard } from '../../components/documents/DocumentCard';
import { DocumentTable } from '../../components/documents/DocumentTable';
import { UploadModal } from '../../components/documents/UploadModal';
import { AccessManageModal } from '../../components/documents/AccessManageModal';
import { DocumentPreviewModal } from '../../components/documents/DocumentPreviewModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Search,
  Filter,
  Grid,
  List,
  UploadCloud,
  FolderLock,
  Plus,
} from 'lucide-react';

export const DocumentLibraryPage: React.FC = () => {
  const { user, allUsers } = useAuth();
  const { showToast } = useToast();

  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassification, setSelectedClassification] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [scope, setScope] = useState<'ALL' | 'MINE' | 'SHARED'>('ALL');

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null);
  const [manageAccessDoc, setManageAccessDoc] = useState<VaultDocument | null>(null);

  // Delete confirm state
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [deleteDocTitle, setDeleteDocTitle] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const loadDocuments = async () => {
    try {
      const docs = await documentService.getDocuments(user?.id);
      setDocuments(docs);
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [user]);

  const filteredDocuments = useMemo(() => {
    if (!user) return [];
    return documents.filter((doc) => {
      // Search matching
      const matchesSearch =
        searchQuery === '' ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        doc.sha256Hash.toLowerCase().includes(searchQuery.toLowerCase());

      // Classification matching
      const matchesClassification =
        selectedClassification === 'ALL' || doc.classification === selectedClassification;

      // Scope matching
      let matchesScope = true;
      if (scope === 'MINE') {
        matchesScope = doc.ownerId === user.id;
      } else if (scope === 'SHARED') {
        matchesScope = doc.grants.some((g) => g.userId === user.id && g.status === 'ACTIVE');
      }

      return matchesSearch && matchesClassification && matchesScope;
    });
  }, [documents, searchQuery, selectedClassification, scope, user]);

  const handleUploadSuccess = async (payload: UploadDocumentPayload) => {
    if (!user) return;
    await documentService.uploadDocument(payload, user);
    await loadDocuments();
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
      await loadDocuments();
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
      showToast('Download Ready', `Downloading "${res.filename}"...`, 'success');
    } catch (err: any) {
      showToast('Download Denied', err.message, 'error');
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-slate-100 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {user?.role === 'ADMIN' ? 'Global Document Oversight' : 'Enterprise Document Library'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {user?.role === 'ADMIN'
              ? 'System-wide document metadata oversight, classification governance, and access grant tracking across all vaults.'
              : 'Cryptographically sealed repository with document-level discretionary access control.'}
          </p>
        </div>

        {user?.role !== 'ADMIN' && (
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Secure Document
          </button>
        )}
      </div>

      {/* Control Bar: Search, Filters, View Modes */}
      <div className="p-4 rounded-2xl bg-[#0B101D] border border-[#161F33] shadow-lg shadow-black/20 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, description, tags, SHA-256..."
              className="w-full bg-[#0D121F] border border-[#1E2638] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* View Mode & Scope Toggle */}
          <div className="flex items-center gap-2 self-end md:self-auto w-full md:w-auto justify-between md:justify-end">
            {/* Scope tabs */}
            <div className="flex bg-[#080D1A] p-1 rounded-xl border border-[#1E2638] text-xs">
              <button
                onClick={() => setScope('ALL')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  scope === 'ALL' ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Documents
              </button>
              <button
                onClick={() => setScope('MINE')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  scope === 'MINE' ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Owned by Me
              </button>
              <button
                onClick={() => setScope('SHARED')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  scope === 'SHARED' ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Shared With Me
              </button>
            </div>

            {/* View Mode buttons */}
            <div className="flex bg-[#080D1A] p-1 rounded-xl border border-[#1E2638]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Classification Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-[#161F33]">
          <span className="text-[11px] font-semibold text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Classification:
          </span>
          {['ALL', 'RESTRICTED', 'CONFIDENTIAL', 'INTERNAL', 'PUBLIC'].map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClassification(cls)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedClassification === cls
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-xs'
                  : 'bg-[#0D121F] text-slate-400 border border-[#1E2638] hover:text-white'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      {/* Documents List / Grid */}
      {filteredDocuments.length === 0 ? (
        <EmptyState
          icon={FolderLock}
          title="No Matching Vault Documents"
          description={
            searchQuery || selectedClassification !== 'ALL'
              ? 'No documents matched your active search filters or security classification scope.'
              : 'The secure vault does not have any documents in this category yet.'
          }
          actionText="Upload Document"
          onAction={() => setIsUploadOpen(true)}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
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
      ) : (
        <DocumentTable
          documents={filteredDocuments}
          currentUser={user}
          onPreview={(d) => setPreviewDoc(d)}
          onManageAccess={(d) => setManageAccessDoc(d)}
          onDelete={handlePromptDelete}
          onDownload={handleDownload}
        />
      )}

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
          onGrantsChanged={loadDocuments}
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
