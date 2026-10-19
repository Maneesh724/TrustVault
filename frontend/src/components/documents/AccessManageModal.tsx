import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { VaultDocument, PermissionLevel, User } from '../../types';
import { accessService } from '../../services/accessService';
import { RoleBadge, StatusBadge } from '../common/Badge';
import { UserPlus, ShieldX } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface AccessManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: VaultDocument;
  currentUser: User;
  allUsers: User[];
  onGrantsChanged: () => Promise<void>;
}

export const AccessManageModal: React.FC<AccessManageModalProps> = ({
  isOpen,
  onClose,
  document,
  currentUser,
  allUsers,
  onGrantsChanged,
}) => {
  const { showToast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [permission, setPermission] = useState<PermissionLevel>('READ');
  const [expirationOption, setExpirationOption] = useState<'NONE' | '7D' | '30D' | 'CUSTOM'>('NONE');
  const [customExpiresAt, setCustomExpiresAt] = useState('');
  const [isGranting, setIsGranting] = useState(false);

  // Revocation state
  const [revokingGrantId, setRevokingGrantId] = useState<string | null>(null);
  const [revokingUserName, setRevokingUserName] = useState<string>('');
  const [isConfirmRevokeOpen, setIsConfirmRevokeOpen] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  // Filter users eligible for new grants
  const eligibleUsers = allUsers.filter(
    (u) => u.id !== currentUser.id && u.id !== document.ownerId
  );

  const calculateExpiresAt = (): string | null => {
    const now = new Date();
    if (expirationOption === '7D') {
      now.setDate(now.getDate() + 7);
      return now.toISOString();
    }
    if (expirationOption === '30D') {
      now.setDate(now.getDate() + 30);
      return now.toISOString();
    }
    if (expirationOption === 'CUSTOM' && customExpiresAt) {
      return new Date(customExpiresAt).toISOString();
    }
    return null;
  };

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      showToast('Select User', 'Please select a user to grant access.', 'warning');
      return;
    }

    setIsGranting(true);
    try {
      const expiresAt = calculateExpiresAt();
      await accessService.grantAccess(document.id, selectedUserId, permission, expiresAt, currentUser);
      showToast('Access Granted', `Permission assigned successfully with zero-trust validation.`, 'success');
      setSelectedUserId('');
      setExpirationOption('NONE');
      await onGrantsChanged();
    } catch (err: any) {
      showToast('Grant Failed', err.message || 'Error granting access', 'error');
    } finally {
      setIsGranting(false);
    }
  };

  const handlePromptRevoke = (grantId: string, userName: string) => {
    setRevokingGrantId(grantId);
    setRevokingUserName(userName);
    setIsConfirmRevokeOpen(true);
  };

  const handleExecuteRevoke = async () => {
    if (!revokingGrantId) return;
    setIsRevoking(true);
    try {
      await accessService.revokeAccessImmediately(
        document.id,
        revokingGrantId,
        currentUser,
        'Manual revocation by document owner/admin'
      );
      showToast(
        'Access Revoked Immediately',
        `Access for ${revokingUserName} has been terminated. Subsequent requests will be blocked.`,
        'success'
      );
      setIsConfirmRevokeOpen(false);
      setRevokingGrantId(null);
      await onGrantsChanged();
    } catch (err: any) {
      showToast('Revocation Failed', err.message || 'Failed to revoke access', 'error');
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Access Governance & Grants"
        subtitle={`Manage document permissions for: ${document.title}`}
        maxWidth="2xl"
      >
        <div className="space-y-6">
          {/* Grant New Access Section */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <UserPlus className="w-4 h-4 text-blue-600" />
              Issue New Grant
            </h4>

            <form onSubmit={handleGrant} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* User Select */}
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">User *</label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                  >
                    <option value="">Select recipient...</option>
                    {eligibleUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Permission Level */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Permission *</label>
                  <select
                    value={permission}
                    onChange={(e) => setPermission(e.target.value as PermissionLevel)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                  >
                    <option value="READ">Read Only (Preview)</option>
                    <option value="EDIT">Read & Edit (New Version)</option>
                  </select>
                </div>

                {/* Expiration Option */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Expiration</label>
                  <select
                    value={expirationOption}
                    onChange={(e) => setExpirationOption(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                  >
                    <option value="NONE">Indefinite (No expiry)</option>
                    <option value="7D">7 Days</option>
                    <option value="30D">30 Days</option>
                    <option value="CUSTOM">Custom Date</option>
                  </select>
                </div>
              </div>

              {expirationOption === 'CUSTOM' && (
                <div className="pt-1">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Select Expiry Date & Time</label>
                  <input
                    type="datetime-local"
                    value={customExpiresAt}
                    onChange={(e) => setCustomExpiresAt(e.target.value)}
                    className="w-full sm:w-64 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isGranting || !selectedUserId}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-all shadow-sm"
                >
                  {isGranting ? 'Authorizing...' : 'Grant Access'}
                </button>
              </div>
            </form>
          </div>

          {/* Active Grants List */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Active & Historic Grants ({document.grants.length})</span>
              <span className="text-[11px] text-slate-500 font-normal">Immediate Revocation Active</span>
            </h4>

            {document.grants.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl">
                No external users have been granted access to this document yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {document.grants.map((grant) => (
                  <div
                    key={grant.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      grant.status === 'ACTIVE'
                        ? 'bg-white border-slate-200 shadow-sm'
                        : 'bg-rose-50/50 border-rose-200 opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                        {grant.userName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-800 truncate">{grant.userName}</p>
                          <RoleBadge role={grant.userRole} className="scale-75 origin-left" />
                          <StatusBadge status={grant.status} />
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{grant.userEmail}</p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
                          <span>Permission: <strong className="text-slate-700">{grant.permission}</strong></span>
                          <span>•</span>
                          <span>Expires: {grant.expiresAt ? new Date(grant.expiresAt).toLocaleDateString() : 'Never'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Revoke button */}
                    <div>
                      {grant.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          onClick={() => handlePromptRevoke(grant.id, grant.userName)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all flex items-center gap-1 shadow-sm"
                        >
                          <ShieldX className="w-3.5 h-3.5" />
                          Revoke Access
                        </button>
                      ) : (
                        <span className="text-[11px] text-rose-600 font-semibold italic">
                          Revoked
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog for Revocation */}
      <ConfirmDialog
        isOpen={isConfirmRevokeOpen}
        onClose={() => setIsConfirmRevokeOpen(false)}
        onConfirm={handleExecuteRevoke}
        title="Immediate Access Revocation"
        message={`Are you sure you want to revoke access for ${revokingUserName}? Any subsequent read or download requests from this user will be blocked immediately by the zero-trust evaluation gate.`}
        confirmText="Revoke Access Now"
        danger={true}
        isLoading={isRevoking}
      />
    </>
  );
};
