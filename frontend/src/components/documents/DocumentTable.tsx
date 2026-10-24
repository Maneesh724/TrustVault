import React from 'react';
import { Link } from 'react-router-dom';
import { VaultDocument, User } from '../../types';
import { ClassificationBadge } from '../common/Badge';
import { Eye, Key, Download, Trash2, FileText } from 'lucide-react';

interface DocumentTableProps {
  documents: VaultDocument[];
  currentUser: User;
  onPreview: (doc: VaultDocument) => void;
  onManageAccess: (doc: VaultDocument) => void;
  onDelete: (docId: string, title: string) => void;
  onDownload: (docId: string) => void;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  currentUser,
  onPreview,
  onManageAccess,
  onDelete,
  onDownload,
}) => {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#161F33] bg-[#0B101D] shadow-lg shadow-black/20 text-slate-100">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#1E2638] text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-[#080D1A]">
            <th className="py-3.5 px-4">Document Title</th>
            <th className="py-3.5 px-4">Classification</th>
            <th className="py-3.5 px-4">Owner</th>
            <th className="py-3.5 px-4">Size</th>
            <th className="py-3.5 px-4">Grants</th>
            <th className="py-3.5 px-4">SHA-256 Checksum</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#161F33] text-xs">
          {documents.map((doc) => {
            const isOwner = doc.ownerId === currentUser.id || currentUser.role === 'OWNER' || currentUser.role === 'ADMIN';

            return (
              <tr key={doc.id} className="hover:bg-slate-900/40 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <Link
                        to={`/documents/${doc.id}`}
                        className="font-bold text-white hover:text-emerald-400 transition-colors block"
                      >
                        {doc.title}
                      </Link>
                      <span className="text-[11px] text-slate-400 font-mono">{doc.filename}</span>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <ClassificationBadge classification={doc.classification} />
                </td>

                <td className="py-3.5 px-4">
                  <div className="text-white font-medium">{doc.ownerName}</div>
                  <div className="text-[11px] text-slate-400">{doc.ownerEmail}</div>
                </td>

                <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                  {(doc.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
                </td>

                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 font-semibold text-[11px] border border-purple-500/30">
                    {doc.grantsCount} grants
                  </span>
                </td>

                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                  <span title={doc.sha256Hash} className="cursor-help bg-[#080D1A] px-2 py-0.5 rounded border border-[#1E2638]">
                    {doc.sha256Hash.substring(0, 10)}...{doc.sha256Hash.substring(doc.sha256Hash.length - 8)}
                  </span>
                </td>

                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onPreview(doc)}
                      title="Preview"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDownload(doc.id)}
                      title="Download"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {isOwner && (
                      <button
                        onClick={() => onManageAccess(doc)}
                        title="Manage Grants"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                    )}

                    {isOwner && (
                      <button
                        onClick={() => onDelete(doc.id, doc.title)}
                        title="Delete Document"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
