import React from 'react';
import { DocumentClassification, PermissionLevel, UserRole } from '../../types';
import { Shield, ShieldAlert, Lock, Globe, Key, Eye, Edit3 } from 'lucide-react';

export const ClassificationBadge: React.FC<{ classification: DocumentClassification; className?: string }> = ({
  classification,
  className = '',
}) => {
  switch (classification) {
    case 'RESTRICTED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-rose-500/15 text-rose-400 border border-rose-500/30 ${className}`}
        >
          <ShieldAlert className="w-3 h-3 text-rose-400" />
          RESTRICTED
        </span>
      );
    case 'CONFIDENTIAL':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-amber-500/15 text-amber-400 border border-amber-500/30 ${className}`}
        >
          <Lock className="w-3 h-3 text-amber-400" />
          CONFIDENTIAL
        </span>
      );
    case 'INTERNAL':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-teal-500/15 text-teal-400 border border-teal-500/30 ${className}`}
        >
          <Shield className="w-3 h-3 text-teal-400" />
          INTERNAL
        </span>
      );
    case 'PUBLIC':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 ${className}`}
        >
          <Globe className="w-3 h-3 text-emerald-400" />
          PUBLIC
        </span>
      );
    default:
      return null;
  }
};

export const RoleBadge: React.FC<{ role: UserRole; className?: string }> = ({ role, className = '' }) => {
  switch (role) {
    case 'ADMIN':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30 ${className}`}
        >
          <Shield className="w-3 h-3 text-purple-400" />
          Administrator
        </span>
      );
    case 'OWNER':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 ${className}`}
        >
          <Key className="w-3 h-3 text-emerald-400" />
          Document Owner
        </span>
      );
    case 'VIEWER':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-teal-500/15 text-teal-400 border border-teal-500/30 ${className}`}
        >
          <Eye className="w-3 h-3 text-teal-400" />
          Viewer
        </span>
      );
  }
};

export const PermissionBadge: React.FC<{ permission: PermissionLevel; className?: string }> = ({
  permission,
  className = '',
}) => {
  switch (permission) {
    case 'ADMIN':
      return (
        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/30 ${className}`}>
          Full Admin
        </span>
      );
    case 'EDIT':
      return (
        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-md bg-teal-500/15 text-teal-400 border border-teal-500/30 ${className}`}>
          Read & Edit
        </span>
      );
    case 'READ':
      return (
        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 ${className}`}>
          Read Only
        </span>
      );
    default:
      return null;
  }
};

export const StatusBadge: React.FC<{ status: 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'SUSPENDED' | 'INVITED' | 'PENDING_APPROVAL'; className?: string }> = ({
  status,
  className = '',
}) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Active
        </span>
      );
    case 'PENDING_APPROVAL':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Pending Approval
        </span>
      );
    case 'REVOKED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          Revoked
        </span>
      );
    case 'EXPIRED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          Expired
        </span>
      );
    case 'SUSPENDED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 ${className}`}>
          Suspended
        </span>
      );
    case 'INVITED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 ${className}`}>
          Invited
        </span>
      );
    default:
      return null;
  }
};
