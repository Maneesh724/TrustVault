import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { documentService, UploadDocumentPayload } from '../../services/documentService';
import { VaultDocument } from '../../types';
import { UploadModal } from '../../components/documents/UploadModal';
import { AccessManageModal } from '../../components/documents/AccessManageModal';
import { DocumentPreviewModal } from '../../components/documents/DocumentPreviewModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Folder,
  Share2,
  Link as LinkIcon,
  Clock,
  Calendar,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Upload,
  Users,
  ShieldCheck,
  Trash2,
  Eye,
  Download,
  HardDrive,
  ChevronLeft,
  ChevronRight,
  Database,
  FileCode,
  Image,
  Archive,
  Presentation,
} from 'lucide-react';

export const OwnerDashboardPage: React.FC = () => {
  const { user, allUsers } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter in My Documents
  const [docSearch, setDocSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null);
  const [manageAccessDoc, setManageAccessDoc] = useState<VaultDocument | null>(null);
  const [activeMenuDocId, setActiveMenuDocId] = useState<string | null>(null);

  // Delete document confirm state
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [deleteDocTitle, setDeleteDocTitle] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Live date & time string: "Sun, 27 Apr 2025 | 10:24 AM"
  const [liveTimeStr, setLiveTimeStr] = useState('');

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const timePart = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      setLiveTimeStr(`${datePart}  |  ${timePart}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      const docs = await documentService.getDocuments(user?.id);
      setDocuments(docs);
    } catch (err: any) {
      showToast('Error Loading Data', err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, showToast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleUploadSuccess = async (payload: UploadDocumentPayload) => {
    if (!user) return;
    await documentService.uploadDocument(payload, user);
    showToast('Document Uploaded', `"${payload.title}" has been vaulted.`, 'success');
    await loadDashboardData();
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
      showToast('Download Ready', `Downloading "${res.filename}"...`, 'success');
    } catch (err: any) {
      showToast('Download Denied', err.message, 'error');
    }
  };

  // Sample seed files matching the screenshot if user hasn't uploaded 8+ docs yet
  const defaultSampleDocs = useMemo(() => [
    {
      id: 'doc-s1',
      title: 'Project_Report.pdf',
      filename: 'Project_Report.pdf',
      type: 'PDF',
      size: '2.4 MB',
      folder: 'Work',
      uploadedOn: '26 Apr 2025, 04:12 PM',
      sharingStatus: 'Shared',
    },
    {
      id: 'doc-s2',
      title: 'Design_Figma.fig',
      filename: 'Design_Figma.fig',
      type: 'Figma',
      size: '1.8 MB',
      folder: 'Designs',
      uploadedOn: '25 Apr 2025, 11:30 AM',
      sharingStatus: 'Private',
    },
    {
      id: 'doc-s3',
      title: 'Database_Backup.sql',
      filename: 'Database_Backup.sql',
      type: 'SQL',
      size: '3.2 MB',
      folder: 'Databases',
      uploadedOn: '24 Apr 2025, 06:45 PM',
      sharingStatus: 'Shared',
    },
    {
      id: 'doc-s4',
      title: 'Meeting_Notes.docx',
      filename: 'Meeting_Notes.docx',
      type: 'DOCX',
      size: '1.1 MB',
      folder: 'Meetings',
      uploadedOn: '22 Apr 2025, 02:18 PM',
      sharingStatus: 'Private',
    },
    {
      id: 'doc-s5',
      title: 'AI_Research.pdf',
      filename: 'AI_Research.pdf',
      type: 'PDF',
      size: '4.7 MB',
      folder: 'Research',
      uploadedOn: '20 Apr 2025, 10:22 AM',
      sharingStatus: 'Shared',
    },
    {
      id: 'doc-s6',
      title: 'Personal_Pictures.zip',
      filename: 'Personal_Pictures.zip',
      type: 'ZIP',
      size: '8.9 MB',
      folder: 'Personal',
      uploadedOn: '18 Apr 2025, 09:15 PM',
      sharingStatus: 'Private',
    },
    {
      id: 'doc-s7',
      title: 'Resume.pdf',
      filename: 'Resume.pdf',
      type: 'PDF',
      size: '612 KB',
      folder: 'Personal',
      uploadedOn: '15 Apr 2025, 01:02 PM',
      sharingStatus: 'Private',
    },
    {
      id: 'doc-s8',
      title: 'Presentation.pptx',
      filename: 'Presentation.pptx',
      type: 'PPTX',
      size: '5.2 MB',
      folder: 'Work',
      uploadedOn: '12 Apr 2025, 03:45 PM',
      sharingStatus: 'Shared',
    },
  ], []);

  // Merged documents display list
  const displayDocs = useMemo(() => {
    if (documents.length >= 8) {
      return documents.map((d) => ({
        id: d.id,
        title: d.title,
        filename: d.filename,
        type: d.filename.split('.').pop()?.toUpperCase() || 'PDF',
        size: `${(d.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`,
        folder: d.tags?.[0] || 'Work',
        uploadedOn: new Date(d.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sharingStatus: d.grants?.length > 0 ? 'Shared' : 'Private',
        rawDoc: d,
      }));
    }

    // Blend live uploaded documents with the reference items
    const liveItems = documents.map((d) => ({
      id: d.id,
      title: d.title,
      filename: d.filename,
      type: d.filename.split('.').pop()?.toUpperCase() || 'PDF',
      size: `${(d.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`,
      folder: d.tags?.[0] || 'Work',
      uploadedOn: new Date(d.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sharingStatus: d.grants?.length > 0 ? 'Shared' : 'Private',
      rawDoc: d,
    }));

    return [...liveItems, ...defaultSampleDocs.slice(liveItems.length)];
  }, [documents, defaultSampleDocs]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    if (!docSearch.trim()) return displayDocs;
    const q = docSearch.toLowerCase();
    return displayDocs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.folder.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q)
    );
  }, [displayDocs, docSearch]);

  // Pagination
  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage) || 1;
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDocs.slice(start, start + itemsPerPage);
  }, [filteredDocs, currentPage]);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Maneesh';

  // Helper for file type color badge matching screenshot
  const renderTypeBadge = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PDF':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EF4444]/20 text-[#EF4444] border border-red-500/30">PDF</span>;
      case 'FIGMA':
      case 'FIG':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#8B5CF6]/20 text-[#A78BFA] border border-purple-500/30">Figma</span>;
      case 'SQL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10B981]/20 text-[#34D399] border border-emerald-500/30">SQL</span>;
      case 'DOCX':
      case 'DOC':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#14B8A6]/20 text-[#2DD4BF] border border-teal-500/30">DOCX</span>;
      case 'ZIP':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#A855F7]/20 text-[#C084FC] border border-purple-500/30">ZIP</span>;
      case 'PPTX':
      case 'PPT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F97316]/20 text-[#FB923C] border border-orange-500/30">PPTX</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">{type}</span>;
    }
  };

  // Helper for file icon
  const renderFileIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PDF':
        return <FileText className="w-4 h-4 text-[#EF4444]" />;
      case 'FIGMA':
      case 'FIG':
        return <Image className="w-4 h-4 text-[#A78BFA]" />;
      case 'SQL':
        return <Database className="w-4 h-4 text-[#34D399]" />;
      case 'DOCX':
      case 'DOC':
        return <FileText className="w-4 h-4 text-[#2DD4BF]" />;
      case 'ZIP':
        return <Archive className="w-4 h-4 text-[#C084FC]" />;
      case 'PPTX':
      case 'PPT':
        return <Presentation className="w-4 h-4 text-[#FB923C]" />;
      default:
        return <FileText className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans pb-12">
      {/* ------------------------------------------------------------------ */}
      {/* HEADER: Good Morning, Maneesh 👋 + Date/Time */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your documents, share securely, and keep track of access activity.
          </p>
        </div>

        {/* Live formatted date & time matching screenshot */}
        <div className="flex items-center gap-2 text-xs text-slate-300 font-mono bg-[#0D121F] px-3.5 py-2 rounded-xl border border-[#1E2638] shadow-sm self-start sm:self-auto">
          <span>{liveTimeStr || 'Sun, 27 Apr 2025  |  10:24 AM'}</span>
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5 TOP METRIC CARDS MATCHING SCREENSHOT */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Total Documents */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0B101D] border border-[#161F33] hover:border-emerald-500/50 hover:bg-[#0E1826] transition-all duration-300 text-left shadow-lg shadow-black/20 card-hover-glow group">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-500/10 mb-3 group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-slate-400 block">Total Documents</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            {documents.length > 0 ? documents.length : 12}
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">
            ↑ 2 since last week
          </span>
        </div>

        {/* 2. Total Folders */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0B101D] border border-[#161F33] hover:border-amber-500/50 hover:bg-[#15141E] transition-all duration-300 text-left shadow-lg shadow-black/20 card-hover-glow group">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10 mb-3 group-hover:scale-110 transition-transform">
            <Folder className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-slate-400 block">Total Folders</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            5
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">
            ↑ 1 since last week
          </span>
        </div>

        {/* 3. Shared Documents */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0B101D] border border-[#161F33] hover:border-teal-500/50 hover:bg-[#0E1824] transition-all duration-300 text-left shadow-lg shadow-black/20 card-hover-glow group">
          <div className="w-10 h-10 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-md shadow-teal-500/10 mb-3 group-hover:scale-110 transition-transform">
            <Share2 className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-slate-400 block">Shared Documents</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            4
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">
            ↑ 1 since last week
          </span>
        </div>

        {/* 4. Active Shares */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0B101D] border border-[#161F33] hover:border-purple-500/50 hover:bg-[#141026] transition-all duration-300 text-left shadow-lg shadow-black/20 card-hover-glow group">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-md shadow-purple-500/10 mb-3 group-hover:scale-110 transition-transform">
            <LinkIcon className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-slate-400 block">Active Shares</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            3
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">
            ↑ 1 since last week
          </span>
        </div>

        {/* 5. Expiring Soon */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0B101D] border border-[#161F33] hover:border-amber-500/50 hover:bg-[#15141E] transition-all duration-300 text-left shadow-lg shadow-black/20 col-span-2 sm:col-span-1 card-hover-glow group">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10 mb-3 group-hover:scale-110 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-slate-400 block">Expiring Soon</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            1
          </div>
          <span className="text-[10px] text-rose-400 font-semibold mt-1 block">
            ↓ 1 since last week
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MY DOCUMENTS TABLE (Full Width) */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0B101D] border border-[#161F33] shadow-lg shadow-black/20 flex flex-col justify-between">
          <div>
            {/* Header with Title, Search, Filter, and Upload Document button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    My Documents
                  </h2>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  View and manage your files and folders
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    className="bg-[#0D121F] border border-[#1E2638] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-36 sm:w-44"
                  />
                </div>

                <button
                  onClick={() => navigate('/documents')}
                  className="p-1.5 rounded-xl bg-[#0D121F] border border-[#1E2638] text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Filter documents"
                >
                  <Filter className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm shadow-emerald-500/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Upload Document</span>
                </button>
              </div>
            </div>

            {/* Documents Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 text-[11px] font-medium border-b border-[#1E2638] pb-2">
                  <tr>
                    <th className="py-2.5 font-medium">Name</th>
                    <th className="py-2.5 font-medium">Type</th>
                    <th className="py-2.5 font-medium">Size</th>
                    <th className="py-2.5 font-medium">Folder</th>
                    <th className="py-2.5 font-medium">Uploaded On</th>
                    <th className="py-2.5 font-medium">Sharing Status</th>
                    <th className="py-2.5 font-medium text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#161F33] text-slate-300">
                  {paginatedDocs.map((doc) => {
                    const isShared = doc.sharingStatus === 'Shared';
                    return (
                      <tr key={doc.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 font-semibold text-white whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            {renderFileIcon(doc.type)}
                            <span>{doc.filename}</span>
                          </div>
                        </td>
                        <td className="py-3 whitespace-nowrap">
                          {renderTypeBadge(doc.type)}
                        </td>
                        <td className="py-3 text-slate-400 whitespace-nowrap text-[11px]">
                          {doc.size}
                        </td>
                        <td className="py-3 text-slate-400 whitespace-nowrap text-[11px]">
                          {doc.folder}
                        </td>
                        <td className="py-3 text-slate-400 whitespace-nowrap text-[11px]">
                          {doc.uploadedOn}
                        </td>
                        <td className="py-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              isShared
                                ? 'bg-[#10B981]/15 text-[#10B981] border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {doc.sharingStatus}
                          </span>
                        </td>
                        <td className="py-3 text-right pr-2 relative">
                          <button
                            onClick={() => setActiveMenuDocId(activeMenuDocId === doc.id ? null : doc.id)}
                            className="p-1 rounded text-slate-500 hover:text-white transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Quick action menu */}
                          {activeMenuDocId === doc.id && (
                            <div className="absolute right-2 top-8 w-36 bg-[#0E1424] border border-slate-800 rounded-xl shadow-xl z-30 p-1.5 space-y-1 text-left animate-in fade-in">
                              <button
                                onClick={() => {
                                  if (doc.rawDoc) setPreviewDoc(doc.rawDoc);
                                  setActiveMenuDocId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-purple-400" />
                                Preview
                              </button>
                              <button
                                onClick={() => {
                                  if (doc.rawDoc) setManageAccessDoc(doc.rawDoc);
                                  setActiveMenuDocId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                                Share
                              </button>
                              <button
                                onClick={() => {
                                  if (doc.rawDoc) handleDownload(doc.rawDoc);
                                  setActiveMenuDocId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5 text-cyan-400" />
                                Download
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteDocId(doc.id);
                                  setDeleteDocTitle(doc.title);
                                  setIsDeleteOpen(true);
                                  setActiveMenuDocId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table Pagination matching screenshot */}
          <div className="flex items-center justify-between pt-4 border-t border-[#161F33] text-xs text-slate-400 mt-4">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredDocs.length)} of {filteredDocs.length} documents
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="w-7 h-7 rounded-lg border border-[#1E2638] flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(1)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  currentPage === 1 ? 'bg-emerald-500 text-slate-950' : 'border border-[#1E2638] text-slate-400'
                }`}
              >
                1
              </button>
              {totalPages > 1 && (
                <button
                  onClick={() => setCurrentPage(2)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentPage === 2 ? 'bg-emerald-500 text-slate-950' : 'border border-[#1E2638] text-slate-400'
                  }`}
                >
                  2
                </button>
              )}
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="w-7 h-7 rounded-lg border border-[#1E2638] flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      {/* ------------------------------------------------------------------ */}
      {/* BOTTOM SECTION: Recent Shared Documents (Left) + Storage Usage (Right) */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT: Recent Shared Documents */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-2xl bg-[#0B101D] border border-[#161F33] shadow-lg shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Share2 className="w-4 h-4 text-emerald-400" />
              Recent Shared Documents
            </h2>
            <button
              onClick={() => navigate('/shared')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 text-[11px] font-medium border-b border-[#1E2638] pb-2">
                <tr>
                  <th className="py-2.5 font-medium">Document Name</th>
                  <th className="py-2.5 font-medium">Shared With</th>
                  <th className="py-2.5 font-medium">Permission</th>
                  <th className="py-2.5 font-medium text-right pr-2">Expiry Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161F33] text-slate-300">
                <tr className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 font-semibold text-white">Project_Report.pdf</td>
                  <td className="py-3 text-slate-400">Vishnu</td>
                  <td className="py-3 text-emerald-400 font-semibold">View + Download</td>
                  <td className="py-3 text-slate-400 text-right pr-1">30 Apr 2025</td>
                </tr>
                <tr className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 font-semibold text-white">Design_Figma.fig</td>
                  <td className="py-3 text-slate-400">Anjali Rao</td>
                  <td className="py-3 text-emerald-400 font-semibold">View</td>
                  <td className="py-3 text-slate-500 text-right pr-1">-</td>
                </tr>
                <tr className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 font-semibold text-white">Meeting_Notes.docx</td>
                  <td className="py-3 text-slate-400">Rahul Sharma</td>
                  <td className="py-3 text-emerald-400 font-semibold">View + Download</td>
                  <td className="py-3 text-slate-400 text-right pr-1">05 May 2025</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Storage Usage */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-2xl bg-[#0B101D] border border-[#161F33] shadow-lg shadow-black/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                Storage Usage
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-6 my-auto pt-1">
              {/* Circular gauge SVG (32% used) */}
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-slate-800"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-emerald-400"
                    strokeWidth="12"
                    strokeDasharray={`${0.32 * 251.32} 251.32`}
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-base font-extrabold text-white leading-none">32%</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Used</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2 text-xs w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-slate-300 font-medium">8.2 GB Used</span>
                  </div>
                  <span className="text-white font-semibold">32%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
                    <span className="text-slate-400">17.8 GB Available</span>
                  </div>
                  <span className="text-slate-400">68%</span>
                </div>
                <div className="pt-2 border-t border-[#1C2640] flex items-center justify-between text-slate-500 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3 h-3 text-slate-400" />
                    <span>Total Allocated</span>
                  </div>
                  <span className="text-slate-400 font-medium">26 GB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MODALS */}
      {/* ------------------------------------------------------------------ */}
      {isUploadOpen && (
        <UploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {previewDoc && user && (
        <DocumentPreviewModal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          document={previewDoc}
          currentUser={user}
        />
      )}

      {manageAccessDoc && (
        <AccessManageModal
          isOpen={Boolean(manageAccessDoc)}
          onClose={() => setManageAccessDoc(null)}
          document={manageAccessDoc}
          onPermissionsUpdated={loadDashboardData}
        />
      )}

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete Document"
        message={`Are you sure you want to permanently delete "${deleteDocTitle}"? This will revoke all grants and erase stored file data.`}
        confirmLabel="Delete Permanently"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
};
