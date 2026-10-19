import React from 'react';
import { DocumentClassification, PermissionLevel, UserRole } from '../../types';
import { Shield, ShieldAlert, Lock, Globe, UserCheck, Key, Eye, Edit3 } from 'lucide-react';

export const ClassificationBadge: React.FC<{ classification: DocumentClassification; className?: string }> = ({
  classification,
  className = '',
}) => {
  switch (classification) {
    case 'RESTRICTED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-rose-50 text-rose-700 border border-rose-200 ${className}`}
        >
          <ShieldAlert className="w-3 h-3 text-rose-600" />
          RESTRICTED
        </span>
      );
    case 'CONFIDENTIAL':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-amber-50 text-amber-700 border border-amber-200 ${className}`}
        >
          <Lock className="w-3 h-3 text-amber-600" />
          CONFIDENTIAL
        </span>
      );
    case 'INTERNAL':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-blue-50 text-blue-700 border border-blue-200 ${className}`}
        >
          <Shield className="w-3 h-3 text-blue-600" />
          INTERNAL
        </span>
      );
    case 'PUBLIC':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        >
          <Globe className="w-3 h-3 text-emerald-600" />
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
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 ${className}`}
        >
          <Shield className="w-3 h-3 text-blue-600" />
          Administrator
        </span>
      );
    case 'OWNER':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 ${className}`}
        >
          <Key className="w-3 h-3 text-purple-600" />
          Document Owner
        </span>
      );
    case 'VIEWER':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        >
          <Eye className="w-3 h-3 text-emerald-600" />
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
        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200 ${className}`}>
          Full Admin
        </span>
      );
    case 'EDIT':
      return (
        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200 ${className}`}>
          Read & Edit
        </span>
      );
    case 'READ':
      return (
        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
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
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      );
    case 'PENDING_APPROVAL':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Pending Approval
        </span>
      );
    case 'REVOKED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Revoked
        </span>
      );
    case 'EXPIRED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Expired
        </span>
      );
    case 'SUSPENDED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 ${className}`}>
          Suspended
        </span>
      );
    case 'INVITED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}>
          Invited
        </span>
      );
    default:
      return null;
  }
};
