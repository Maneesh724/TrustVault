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
    <div className="group rounded-2xl bg-[#0B101D] border border-[#161F33] hover:border-emerald-500/40 hover:bg-[#0E1526] p-5 flex flex-col justify-between transition-all duration-300 shadow-lg shadow-black/20 card-hover-glow text-slate-100">
      <div>
        {/* Top Badges & Classification */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <ClassificationBadge classification={document.classification} />
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
            <span>{(document.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
          </div>
        </div>

        {/* Title */}
        <Link
          to={`/documents/${document.id}`}
          className="text-sm font-bold text-white hover:text-emerald-400 transition-colors line-clamp-1 block mb-1"
        >
          {document.title}
        </Link>

        {/* Description */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
          {document.description || 'Enterprise protected document in zero-trust vault.'}
        </p>

        {/* Tags */}
        {document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {document.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#0D1527] text-emerald-400 border border-emerald-500/20"
              >
                #{tag}
              </span>
            ))}
            {document.tags.length > 3 && (
              <span className="text-[10px] text-slate-500 px-1">+{document.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Metadata & Actions Footer */}
      <div className="pt-3 border-t border-[#161F33] space-y-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
              {document.ownerName.charAt(0)}
            </div>
            <span className="truncate">{document.ownerName}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 font-medium">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>{document.grantsCount} grants</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-1 pt-1">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPreview(document)}
              title="Secure Sandbox Preview"
              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
            </button>

            <button
              onClick={() => onDownload(document.id)}
              title="Download Ephemeral Stream"
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>

            {isOwner && (
              <button
                onClick={() => onManageAccess(document)}
                title="Manage Grants & Revocations"
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
              >
                <Key className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Link
              to={`/documents/${document.id}`}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline px-2 py-1"
            >
              Details →
            </Link>

            {isOwner && (
              <button
                onClick={() => onDelete(document.id, document.title)}
                title="Delete Document"
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
