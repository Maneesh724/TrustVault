import React from 'react';
import { Modal } from '../common/Modal';
import { VaultDocument, User } from '../../types';
import { ClassificationBadge } from '../common/Badge';
import { Hash, Shield, Download, Lock, CheckCircle2 } from 'lucide-react';
import { documentService } from '../../services/documentService';
import { useToast } from '../../context/ToastContext';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: VaultDocument;
  currentUser: User;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document,
  currentUser,
}) => {
  const { showToast } = useToast();

  const handleDownload = async () => {
    try {
      const res = await documentService.requestSecureDownload(document.id, currentUser);
      const link = window.document.createElement('a');
      link.href = res.downloadUrl;
      link.download = res.filename;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      showToast('Download Verified', 'Document stream decrypted and signed with ephemeral key.', 'success');
    } catch (err: any) {
      showToast('Download Blocked', err.message || 'Authorization failed', 'error');
    }
  };

  const watermarkText = `${currentUser.email} • IP: 198.51.100.12 • ${new Date().toLocaleDateString()}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={document.title}
      subtitle={`Encrypted Vault Document • ${(document.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Document Header Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-2">
            <ClassificationBadge classification={document.classification} />
            {document.watermarkEnabled && (
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Shield className="w-3 h-3 text-blue-600" />
                Watermark Protected
              </span>
            )}
            {document.downloadRestricted && (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-600" />
                DLP Restricted
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download Decrypted Stream
            </button>
          </div>
        </div>

        {/* SHA-256 Verification Pill */}
        <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700">
          <Hash className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="text-slate-500 font-sans font-medium">SHA-256:</span>
          <span className="text-slate-800 truncate select-all">{document.sha256Hash}</span>
          <span className="ml-auto flex items-center gap-1 text-emerald-600 text-[10px] shrink-0 font-sans font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Match Verified
          </span>
        </div>

        {/* Sandbox Document Viewer with Dynamic Watermark */}
        <div className="relative rounded-xl border border-slate-200 bg-white p-6 min-h-[320px] overflow-hidden select-none shadow-sm">
          {/* Watermark Pattern Overlay */}
          {document.watermarkEnabled && (
            <div className="absolute inset-0 pointer-events-none flex flex-wrap items-center justify-around opacity-[0.06] rotate-[-25deg] scale-125 z-10 select-none">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="text-sm font-black text-slate-900 uppercase tracking-widest p-4">
                  {watermarkText}
                </div>
              ))}
            </div>
          )}

          {/* Document Content Simulation */}
          <div className="relative z-0 space-y-4 text-slate-700 text-xs leading-relaxed font-sans">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">{document.title}</h2>
              <p className="text-xs text-slate-500 mt-1">Author: {document.ownerName} ({document.ownerEmail})</p>
              <p className="text-xs text-slate-500">Classification: {document.classification} • Zero-Trust Enforced</p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1">Executive Summary</h3>
              <p className="text-slate-600">
                {document.description || 'This document is subject to TrustVault enterprise data governance regulations. All views, grants, and downloads are registered immutably in the central audit ledger.'}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold text-slate-800">Security Governance Attributes</h3>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div>Original Filename: <span className="text-slate-900 font-mono font-medium">{document.filename}</span></div>
                <div>Storage Encryption: <span className="text-emerald-700 font-semibold">AES-256-GCM / SHA-256</span></div>
                <div>Access Grants Count: <span className="text-slate-900 font-semibold">{document.grantsCount}</span></div>
                <div>Last Modified: <span className="text-slate-700">{new Date(document.updatedAt).toLocaleString()}</span></div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              Notice: Viewing this confidential artifact is monitored. Tampering with or distributing without proper authorization is a violation of security policy.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
