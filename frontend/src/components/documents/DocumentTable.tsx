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
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/70">
            <th className="py-3 px-4">Document Title</th>
            <th className="py-3 px-4">Classification</th>
            <th className="py-3 px-4">Owner</th>
            <th className="py-3 px-4">Size</th>
            <th className="py-3 px-4">Grants</th>
            <th className="py-3 px-4">SHA-256 Checksum</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {documents.map((doc) => {
            const isOwner = doc.ownerId === currentUser.id || currentUser.role === 'OWNER' || currentUser.role === 'ADMIN';

            return (
              <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <Link
                        to={`/documents/${doc.id}`}
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors block"
                      >
                        {doc.title}
                      </Link>
                      <span className="text-[11px] text-slate-400 font-mono">{doc.filename}</span>
                    </div>
                  </div>
                </td>

                <td className="py-3 px-4">
                  <ClassificationBadge classification={doc.classification} />
                </td>

                <td className="py-3 px-4">
                  <div className="text-slate-800 font-medium">{doc.ownerName}</div>
                  <div className="text-[11px] text-slate-400">{doc.ownerEmail}</div>
                </td>

                <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                  {(doc.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
                </td>

                <td className="py-3 px-4">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200">
                    {doc.grantsCount} grants
                  </span>
                </td>

                <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                  <span title={doc.sha256Hash} className="cursor-help bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                    {doc.sha256Hash.substring(0, 10)}...{doc.sha256Hash.substring(doc.sha256Hash.length - 8)}
                  </span>
                </td>

                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onPreview(doc)}
                      title="Preview"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDownload(doc.id)}
                      title="Download"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {isOwner && (
                      <button
                        onClick={() => onManageAccess(doc)}
                        title="Manage Grants"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                    )}

                    <Link
                      to={`/documents/${doc.id}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1"
                    >
                      View
                    </Link>

                    {isOwner && (
                      <button
                        onClick={() => onDelete(doc.id, doc.title)}
                        title="Delete"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
