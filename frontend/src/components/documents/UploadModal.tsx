import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { calculateSHA256, UploadDocumentPayload } from '../../services/documentService';
import { DocumentClassification } from '../../types';
import { UploadCloud, FileCheck, Hash, Shield, Tag, X, Lock, Share2, Users, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (payload: UploadDocumentPayload) => Promise<void>;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
  const { showToast } = useToast();
  const { allUsers } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classification, setClassification] = useState<DocumentClassification>('CONFIDENTIAL');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Internal']);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [downloadRestricted, setDownloadRestricted] = useState(false);
  const [calculatedHash, setCalculatedHash] = useState<string>('');
  const [isHashing, setIsHashing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sharing Section State
  const [shareOption, setShareOption] = useState<'NONE' | 'VIEWER' | 'ADMIN' | 'BOTH'>('NONE');
  const [selectedViewerId, setSelectedViewerId] = useState<string>('ALL');
  const [sharePermission, setSharePermission] = useState<'READ' | 'EDIT'>('READ');

  const viewerUsers = allUsers.filter((u) => u.role === 'VIEWER');

  const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
  const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'png', 'jpg', 'jpeg', 'txt', 'csv'];

  const handleFileChange = async (selectedFile: File) => {
    // 1. Size Validation
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      showToast('File Too Large', 'Maximum allowed document size is 50MB.', 'error');
      return;
    }

    // 2. Type/Extension Validation
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext && !ALLOWED_EXTENSIONS.includes(ext)) {
      showToast(
        'Invalid File Type',
        `File type ".${ext}" is not permitted. Only PDF, DOCX, XLSX, TXT, CSV, and image documents are accepted.`,
        'error'
      );
      return;
    }

    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
    setIsHashing(true);
    try {
      const hash = await calculateSHA256(selectedFile);
      setCalculatedHash(hash);
      showToast('SHA-256 Calculated', 'File cryptographic integrity verified in browser.', 'success', 2500);
    } catch (err) {
      console.error(err);
      showToast('Checksum Error', 'Failed to calculate cryptographic hash.', 'error');
    } finally {
      setIsHashing(false);
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showToast('File Required', 'Please choose a document to upload.', 'warning');
      return;
    }
    if (!title.trim()) {
      showToast('Title Required', 'Please enter a document title.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await onUploadSuccess({
        title,
        description,
        classification,
        tags,
        watermarkEnabled,
        downloadRestricted,
        file,
        calculatedHash,
        shareOption,
        selectedViewerId,
        sharePermission,
      });
      showToast('Document Vaulted', `"${title}" was uploaded and configured with requested access policies.`, 'success');
      onClose();
      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      setCalculatedHash('');
      setShareOption('NONE');
      setTags(['Internal']);
    } catch (err: any) {
      showToast('Upload Failed', err.message || 'Error uploading document', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Secure Document" subtitle="Add file with client-side SHA-256 checksum and granular access policies" maxWidth="xl">
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-200">
        {/* File Drop Area */}
        <div className="border-2 border-dashed border-[#1E293B] hover:border-emerald-500/60 rounded-2xl p-5 text-center transition-colors bg-[#080D1A]">
          {file ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-2">
                <FileCheck className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">{file.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB • {file.type || 'Binary'}</p>
              
              {/* Hash Display */}
              <div className="mt-3 w-full bg-[#0D1322] border border-[#1E293B] rounded-xl p-2.5 text-left shadow-sm">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="flex items-center gap-1 font-semibold text-slate-300">
                    <Hash className="w-3.5 h-3.5 text-emerald-400" />
                    Cryptographic SHA-256 Fingerprint:
                  </span>
                  {isHashing ? (
                    <span className="text-amber-400 font-semibold animate-pulse">Calculating...</span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">Verified</span>
                  )}
                </div>
                <p className="font-mono text-[11px] text-emerald-300 break-all select-all">
                  {calculatedHash || 'Calculating checksum...'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setCalculatedHash('');
                }}
                className="mt-2 text-xs font-semibold text-rose-400 hover:underline cursor-pointer"
              >
                Choose a different file
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-2">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">
                Click to browse or drag and drop document
              </p>
              <p className="text-xs text-slate-400 mt-1">
                PDF, DOCX, XLSX, PNG up to 50MB
              </p>
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
            </label>
          )}
        </div>

        {/* Title & Classification */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Document Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Financial Audit"
              className="w-full bg-[#080D1A] border border-[#1E293B] rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Security Classification *</label>
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value as DocumentClassification)}
              className="w-full bg-[#080D1A] border border-[#1E293B] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="RESTRICTED">RESTRICTED (Highest Isolation)</option>
              <option value="CONFIDENTIAL">CONFIDENTIAL (Encrypted & Logged)</option>
              <option value="INTERNAL">INTERNAL (Authorized Staff)</option>
              <option value="PUBLIC">PUBLIC (All Viewers)</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Governance Notes</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief scope, data sensitivity, and purpose..."
            className="w-full bg-[#080D1A] border border-[#1E293B] rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Tags</label>
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1">
              <Tag className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Type tag and press enter..."
                className="w-full bg-[#080D1A] border border-[#1E293B] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="hover:text-rose-400 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Document Access Sharing Section */}
        <div className="p-3.5 rounded-xl bg-[#080D1A] border border-[#1E293B] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-white">Share Document Access</p>
                <p className="text-[11px] text-slate-400">Configure who immediately receives access upon upload</p>
              </div>
            </div>
            {shareOption !== 'NONE' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Sharing Configured
              </span>
            )}
          </div>

          {/* 4 Selectable Option Cards: Private, Share with Viewer, Share with Admin, Both */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setShareOption('NONE')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                shareOption === 'NONE'
                  ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                  : 'bg-[#0D1322] border-[#1E293B] text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Only Me</span>
                {shareOption === 'NONE' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">Private storage</span>
            </button>

            <button
              type="button"
              onClick={() => setShareOption('VIEWER')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                shareOption === 'VIEWER'
                  ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                  : 'bg-[#0D1322] border-[#1E293B] text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300">Share with Viewer</span>
                {shareOption === 'VIEWER' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">Authorized viewers</span>
            </button>

            <button
              type="button"
              onClick={() => setShareOption('ADMIN')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                shareOption === 'ADMIN'
                  ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                  : 'bg-[#0D1322] border-[#1E293B] text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300">Share with Admin</span>
                {shareOption === 'ADMIN' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">Admin oversight</span>
            </button>

            <button
              type="button"
              onClick={() => setShareOption('BOTH')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                shareOption === 'BOTH'
                  ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                  : 'bg-[#0D1322] border-[#1E293B] text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-300">Both</span>
                {shareOption === 'BOTH' && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">Viewers & Admin</span>
            </button>
          </div>

          {/* Granular Viewer Selection & Permission Level */}
          {(shareOption === 'VIEWER' || shareOption === 'BOTH') && (
            <div className="p-3 rounded-xl bg-[#0D1322] border border-[#1E293B] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Recipient Viewer:
                </label>
                <select
                  value={selectedViewerId}
                  onChange={(e) => setSelectedViewerId(e.target.value)}
                  className="w-full bg-[#080D1A] border border-[#1E293B] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">All Registered Viewers</option>
                  {viewerUsers.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Viewer Permission Level:
                </label>
                <select
                  value={sharePermission}
                  onChange={(e) => setSharePermission(e.target.value as 'READ' | 'EDIT')}
                  className="w-full bg-[#080D1A] border border-[#1E293B] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="READ">READ (View and Inspect Document)</option>
                  <option value="EDIT">EDIT (Read, Edit, & Download)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Security Controls Toggles */}
        <div className="p-3.5 rounded-xl bg-[#080D1A] border border-[#1E293B] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-white">Dynamic Watermarking</p>
                <p className="text-[11px] text-slate-400">Stamps reader email and timestamp on preview to deter leaks</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={watermarkEnabled}
              onChange={(e) => setWatermarkEnabled(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#1E293B]">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-xs font-bold text-white">Restrict Raw Download (DLP)</p>
                <p className="text-[11px] text-slate-400">Prevent downloading local copy; view only inside sandbox</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={downloadRestricted}
              onChange={(e) => setDownloadRestricted(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1E293B]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !file}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            {isSubmitting ? 'Securing & Storing...' : 'Vault Document'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
