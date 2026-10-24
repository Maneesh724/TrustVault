import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  danger?: boolean;
  confirmVariant?: string;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmLabel,
  cancelText = 'Cancel',
  danger = true,
  confirmVariant,
  onCancel,
  isLoading = false,
}) => {
  const handleClose = onCancel || onClose || (() => {});
  const displayConfirmText = confirmLabel || confirmText;
  const isDanger = confirmVariant === 'danger' || danger;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="md">
      <div className="flex items-start gap-3 mt-1 text-slate-200">
        <div
          className={`p-2 rounded-xl shrink-0 ${
            isDanger ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-[#1E293B]">
        <button
          type="button"
          onClick={handleClose}
          disabled={isLoading}
          className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer ${
            isDanger
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20'
              : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-500/20'
          }`}
        >
          {isLoading ? 'Processing...' : displayConfirmText}
        </button>
      </div>
    </Modal>
  );
};
