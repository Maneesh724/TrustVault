import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { VaultDocument, User } from '../../types';
import { ClassificationBadge } from '../common/Badge';
import { Download, ExternalLink, FileText, RefreshCw, AlertCircle, FileCheck2 } from 'lucide-react';
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
  const [downloading, setDownloading] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);

  const previewUrl = `/api/documents/${encodeURIComponent(document.id)}/download?userId=${encodeURIComponent(
    currentUser.id
  )}&preview=1`;

  const ext = (document.filename.split('.').pop() || '').toLowerCase();
  const isPdf = ext === 'pdf' || document.mimeType?.includes('pdf');
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext) || document.mimeType?.startsWith('image/');
  const isText = ['txt', 'csv', 'json', 'log', 'sql', 'md'].includes(ext) || document.mimeType?.includes('text');

  // If text file, fetch content to render directly
  useEffect(() => {
    if (isOpen && isText) {
      setLoadingText(true);
      fetch(previewUrl)
        .then((res) => (res.ok ? res.text() : ''))
        .then((text) => setTextContent(text))
        .catch(() => setTextContent(null))
        .finally(() => setLoadingText(false));
    } else {
      setTextContent(null);
    }
  }, [isOpen, document.id, isText, previewUrl]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await documentService.requestSecureDownload(document.id, currentUser);
      const link = window.document.createElement('a');
      link.href = res.downloadUrl;
      link.download = res.filename;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      showToast('Download Ready', `Downloading "${res.filename}"...`, 'success');
    } catch (err: any) {
      showToast('Download Denied', err.message || 'Authorization failed', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const formattedSize =
    document.fileSizeBytes > 1024 * 1024
      ? `${(document.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(document.fileSizeBytes / 1024).toFixed(1)} KB`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={document.title}
      subtitle={`${document.filename} • ${formattedSize}`}
      maxWidth="5xl"
    >
      <div className="space-y-4 text-slate-100">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#080D1A] border border-[#161F33] rounded-xl">
          <div className="flex items-center gap-2">
            <ClassificationBadge classification={document.classification} />
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-[#0D1322] text-slate-300 border border-[#1E293B]">
              {ext.toUpperCase() || 'DOCUMENT'}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Uploaded by <strong className="text-white">{document.ownerName || 'Document Owner'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#1E293B] bg-[#0D1322] hover:bg-[#131B2E] text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open document in a dedicated browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Full Screen</span>
            </a>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-4 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Preparing...' : 'Download Document'}</span>
            </button>
          </div>
        </div>

        {/* Real Document Preview Area (No watermarks, no mock text stamps) */}
        <div className="rounded-xl border border-[#161F33] bg-[#050811] overflow-hidden shadow-2xl flex items-center justify-center min-h-[55vh] max-h-[75vh]">
          {isPdf ? (
            <iframe
              src={`${previewUrl}#toolbar=1&navpanes=0&scrollbar=1`}
              title={document.title}
              className="w-full h-[72vh] border-0 rounded-xl bg-white"
            />
          ) : isImage ? (
            <div className="p-4 flex items-center justify-center w-full h-full overflow-auto max-h-[72vh]">
              <img
                src={previewUrl}
                alt={document.title}
                className="max-h-[68vh] max-w-full rounded-lg object-contain shadow-lg"
              />
            </div>
          ) : isText ? (
            <div className="w-full h-[72vh] p-5 overflow-auto text-left font-mono text-xs bg-[#080D1A] text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
              {loadingText ? (
                <div className="flex items-center justify-center h-full text-slate-400 gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Loading document contents...</span>
                </div>
              ) : textContent !== null ? (
                textContent
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <p>Unable to display plain text stream.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-10 text-center space-y-4 max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <FileCheck2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">{document.filename}</h4>
                <p className="text-xs text-slate-400 mt-1">
                  This file format ({ext.toUpperCase()}) is stored securely in your vault. Click below to download and view the original file.
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download & View File</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
