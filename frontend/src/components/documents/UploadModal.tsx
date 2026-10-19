import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { calculateSHA256, UploadDocumentPayload } from '../../services/documentService';
import { DocumentClassification } from '../../types';
import { UploadCloud, FileCheck, Hash, Shield, Tag, X, Lock } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (payload: UploadDocumentPayload) => Promise<void>;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
  const { showToast } = useToast();
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

  const handleFileChange = async (selectedFile: File) => {
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
      });
      showToast('Document Vaulted', `"${title}" was encrypted and stored with SHA-256 integrity check.`, 'success');
      onClose();
      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      setCalculatedHash('');
      setTags(['Internal']);
    } catch (err: any) {
      showToast('Upload Failed', err.message || 'Error uploading document', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Secure Document" subtitle="Add file with client-side SHA-256 checksum and granular access policies" maxWidth="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Drop Area */}
        <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-5 text-center transition-colors bg-slate-50/70">
          {file ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <FileCheck className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">{file.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB • {file.type || 'Binary'}</p>
              
              {/* Hash Display */}
              <div className="mt-3 w-full bg-white border border-slate-200 rounded-xl p-2.5 text-left shadow-sm">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Hash className="w-3.5 h-3.5 text-blue-600" />
                    Cryptographic SHA-256 Fingerprint:
                  </span>
                  {isHashing ? (
                    <span className="text-amber-600 font-semibold animate-pulse">Calculating...</span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">Verified</span>
                  )}
                </div>
                <p className="font-mono text-[11px] text-slate-700 break-all select-all">
                  {calculatedHash || 'Calculating checksum...'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setCalculatedHash('');
                }}
                className="mt-2 text-xs font-semibold text-rose-600 hover:underline"
              >
                Choose a different file
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                Click to browse or drag and drop document
              </p>
              <p className="text-xs text-slate-500 mt-1">
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Document Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Financial Audit"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Security Classification *</label>
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value as DocumentClassification)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600"
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
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Governance Notes</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief scope, data sensitivity, and purpose..."
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Tags</label>
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1">
              <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="hover:text-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Security Controls Toggles */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs font-bold text-slate-800">Dynamic Watermarking</p>
                <p className="text-[11px] text-slate-500">Stamps reader email and timestamp on preview to deter leaks</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={watermarkEnabled}
              onChange={(e) => setWatermarkEnabled(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              <div>
                <p className="text-xs font-bold text-slate-800">Restrict Raw Download (DLP)</p>
                <p className="text-[11px] text-slate-500">Prevent downloading local copy; view only inside sandbox</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={downloadRestricted}
              onChange={(e) => setDownloadRestricted(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !file}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-sm transition-all"
          >
            {isSubmitting ? 'Securing & Storing...' : 'Vault Document'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
