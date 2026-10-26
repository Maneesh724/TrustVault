import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { VaultDocument, User } from '../../types';
import { ClassificationBadge } from '../common/Badge';
import { Download, ExternalLink, FileText, RefreshCw, AlertCircle, FileCheck2, ShieldCheck, Eye } from 'lucide-react';
import { documentService } from '../../services/documentService';
import { useToast } from '../../context/ToastContext';
import { apiUrl } from '../../config/api';

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
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const ext = (document.filename.split('.').pop() || '').toLowerCase();
  const isPdf = ext === 'pdf' || document.mimeType?.includes('pdf');
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext) || document.mimeType?.startsWith('image/');
  const isText = ['txt', 'csv', 'json', 'log', 'sql', 'md'].includes(ext) || document.mimeType?.includes('text');

  // Securely stream document binary through authenticated API into a local Blob URL
  useEffect(() => {
    let active = true;
    let createdUrl = '';

    if (isOpen && document.id) {
      setLoadingFile(true);
      setLoadError(null);

      // Check for inline base64 data on document or in session cache
      const inlineB64 = document.fileBase64 || sessionStorage.getItem(`tv_doc_b64_${document.id}`) || localStorage.getItem(`tv_doc_b64_${document.id}`);
      if (inlineB64 && inlineB64.trim()) {
        try {
          let b64 = inlineB64.trim();
          if (b64.includes(',')) {
            b64 = b64.split(',')[1];
          }
          b64 = b64.replace(/\s+/g, '');
          const padding = b64.length % 4;
          if (padding) b64 += '='.repeat(4 - padding);

          const binary = atob(b64);
          if (isText) {
            setTextContent(binary);
            setLoadingFile(false);
            return;
          }
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const mime = document.mimeType || (isPdf ? 'application/pdf' : 'application/octet-stream');
          const blob = new Blob([bytes], { type: mime });
          createdUrl = URL.createObjectURL(blob);
          setBlobUrl(createdUrl);
          setLoadingFile(false);
          return;
        } catch (b64Err) {
          console.warn('Direct base64 decode fallback to network fetch:', b64Err);
        }
      }

      const targetPath = `/api/documents/${encodeURIComponent(document.id)}/download?userId=${encodeURIComponent(
        currentUser.id
      )}&preview=1`;
      const targetUrl = apiUrl(targetPath);
      const sessionId = sessionStorage.getItem('trustvault_session_id');

      fetch(targetUrl, {
        credentials: 'include',
        headers: sessionId ? { 'X-Session-ID': sessionId } : {},
      })
        .then(async (res) => {
          if (!res.ok) {
            let errMsg = `Failed to load document (HTTP ${res.status})`;
            try {
              const data = await res.json();
              if (data.error) errMsg = data.error;
            } catch {}
            throw new Error(errMsg);
          }
          if (isText) {
            const text = await res.text();
            if (active) setTextContent(text);
            return null;
          }
          return res.blob();
        })
        .then((blob) => {
          if (!active || !blob) return;
          createdUrl = URL.createObjectURL(blob);
          setBlobUrl(createdUrl);
        })
        .catch((err: any) => {
          if (!active) return;
          setLoadError(err.message || 'Unable to load document preview.');
        })
        .finally(() => {
          if (active) setLoadingFile(false);
        });
    }

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
      setBlobUrl(null);
      setTextContent(null);
    };
  }, [isOpen, document.id, currentUser.id, isText]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      if (blobUrl) {
        const link = window.document.createElement('a');
        link.href = blobUrl;
        link.download = document.filename;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        showToast('Download Ready', `Downloading "${document.filename}"...`, 'success');
        return;
      }
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

  const handleOpenFullScreen = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
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
            {blobUrl && (
              <button
                type="button"
                onClick={handleOpenFullScreen}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#1E293B] bg-[#0D1322] hover:bg-[#131B2E] text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Open document in a dedicated browser tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Full Screen</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="px-4 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Preparing...' : 'Download Document'}</span>
            </button>
          </div>
        </div>

        {/* Real Document Preview Area */}
        <div className="rounded-xl border border-[#161F33] bg-[#050811] overflow-hidden shadow-2xl flex items-center justify-center min-h-[55vh] max-h-[75vh] relative">
          {loadingFile ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span className="text-xs font-mono">Decrypting & streaming document from vault...</span>
            </div>
          ) : loadError ? (
            <div className="p-8 text-center space-y-3 max-w-md">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Access Denied / Preview Error</h4>
              <p className="text-xs text-rose-300/90 leading-relaxed font-mono bg-rose-950/20 p-3 rounded-xl border border-rose-900/30">
                {loadError}
              </p>
            </div>
          ) : isPdf && blobUrl ? (
            <div className="w-full h-[72vh] flex flex-col">
              <iframe
                src={`${blobUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                title={document.title}
                className="w-full h-full border-0 rounded-xl bg-slate-900"
              />
            </div>
          ) : isImage && blobUrl ? (
            <div className="p-4 flex items-center justify-center w-full h-full overflow-auto max-h-[72vh]">
              <img
                src={blobUrl}
                alt={document.title}
                className="max-h-[68vh] max-w-full rounded-lg object-contain shadow-lg"
              />
            </div>
          ) : isText && textContent !== null ? (
            <div className="w-full h-[72vh] p-5 overflow-auto text-left font-mono text-xs bg-[#080D1A] text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
              {textContent}
            </div>
          ) : (
            <div className="p-10 text-center space-y-4 max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <FileCheck2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">{document.filename}</h4>
                <p className="text-xs text-slate-400 mt-1">
                  This document ({ext.toUpperCase()}) is securely stored in your private vault. Click below to view or download.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                {blobUrl && (
                  <button
                    type="button"
                    onClick={handleOpenFullScreen}
                    className="px-4 py-2 rounded-xl bg-[#0D1322] hover:bg-[#131B2E] border border-slate-700 text-white font-semibold text-xs inline-flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span>Open Viewer</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
