import React from 'react';
import { Link } from 'react-router-dom';
import { VaultDocument, User } from '../../types';
import { ClassificationBadge } from '../common/Badge';
import {
  Users,
  Download,
  Eye,
  Key,
  Trash2,
} from 'lucide-react';

interface DocumentCardProps {
  document: VaultDocument;
  currentUser: User;
  onPreview: (doc: VaultDocument) => void;
  onManageAccess: (doc: VaultDocument) => void;
  onDelete: (docId: string, title: string) => void;
  onDownload: (docId: string) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  currentUser,
  onPreview,
  onManageAccess,
  onDelete,
  onDownload,
}) => {
  const isOwner = document.ownerId === currentUser.id || currentUser.role === 'OWNER' || currentUser.role === 'ADMIN';

  return (
    <div className="group rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 p-5 flex flex-col justify-between transition-all duration-200">
      <div>
        {/* Top Badges & Classification */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <ClassificationBadge classification={document.classification} />
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
            <span>{(document.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
          </div>
        </div>

        {/* Title */}
        <Link
          to={`/documents/${document.id}`}
          className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1 block mb-1"
        >
          {document.title}
        </Link>

        {/* Description */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
          {document.description || 'Enterprise protected document in zero-trust vault.'}
        </p>

        {/* Tags */}
        {document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {document.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200"
              >
                #{tag}
              </span>
            ))}
            {document.tags.length > 3 && (
              <span className="text-[10px] text-slate-400 px-1">+{document.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Metadata & Actions Footer */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 truncate">
            <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
              {document.ownerName.charAt(0)}
            </div>
            <span className="truncate">{document.ownerName}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>{document.grantsCount} grants</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-1 pt-1">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPreview(document)}
              title="Secure Sandbox Preview"
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>

            <button
              onClick={() => onDownload(document.id)}
              title="Download Ephemeral Stream"
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>

            {isOwner && (
              <button
                onClick={() => onManageAccess(document)}
                title="Manage Grants & Revocations"
                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              >
                <Key className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Link
              to={`/documents/${document.id}`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline px-2 py-1"
            >
              Details →
            </Link>

            {isOwner && (
              <button
                onClick={() => onDelete(document.id, document.title)}
                title="Delete Document"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
