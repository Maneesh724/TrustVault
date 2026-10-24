export type UserRole = 'ADMIN' | 'OWNER' | 'VIEWER';

export const getRoleLandingRoute = (role: UserRole, status?: string): string => {
  if (status === 'PENDING_APPROVAL') {
    return '/owner/pending-approval';
  }
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'OWNER':
      return '/owner/dashboard';
    case 'VIEWER':
      return '/viewer/dashboard';
    default:
      return '/login';
  }
};

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  department: string;
  mfaEnabled: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'INVITED' | 'PENDING_APPROVAL';
  phone?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  approvedBy?: string;
  approvedAt?: string;
  lastLoginAt: string;
  createdAt: string;
}

export type DocumentClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';

export type PermissionLevel = 'READ' | 'EDIT' | 'ADMIN';

export interface DocumentGrant {
  id: string;
  documentId: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: UserRole;
  permission: PermissionLevel;
  grantedAt: string;
  grantedBy: string;
  expiresAt: string | null;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  revokedAt?: string;
  revokedBy?: string;
}

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  uploadedAt: string;
  uploadedBy: string;
  uploaderName: string;
  sha256Hash: string;
  fileSizeBytes: number;
  changeSummary: string;
}

export interface VaultDocument {
  id: string;
  title: string;
  description: string;
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
  classification: DocumentClassification;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  sha256Hash: string;
  watermarkEnabled: boolean;
  downloadRestricted: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  grantsCount: number;
  versions: DocumentVersion[];
  grants: DocumentGrant[];
}

export type AuditActionType =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'AUTH_MFA_VERIFY'
  | 'AUTH_FAILED'
  | 'DOC_UPLOAD'
  | 'DOC_VIEW'
  | 'DOC_DOWNLOAD'
  | 'DOC_UPDATE'
  | 'DOC_DELETE'
  | 'GRANT_CREATE'
  | 'GRANT_UPDATE'
  | 'GRANT_REVOKE'
  | 'SECURITY_POLICY_UPDATE'
  | 'USER_ROLE_UPDATE'
  | 'USER_STATUS_CHANGE';

export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: UserRole;
  action: AuditActionType;
  targetResourceId?: string;
  targetResourceName?: string;
  severity: AuditSeverity;
  ipAddress: string;
  userAgent: string;
  outcome: 'SUCCESS' | 'DENIED' | 'FAILED';
  details: Record<string, any>;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'AUTHENTICATION' | 'DATA_LOSS_PREVENTION' | 'ACCESS_CONTROL' | 'ENCRYPTION';
  threatRef: string;
}

export interface ThreatAlert {
  id: string;
  timestamp: string;
  severity: AuditSeverity;
  title: string;
  description: string;
  sourceIp: string;
  mitigationStatus: 'ACTIVE' | 'MITIGATED' | 'INVESTIGATING';
  threatCategory: 'Spoofing' | 'Tampering' | 'Repudiation' | 'Information Disclosure' | 'Denial of Service' | 'Elevation of Privilege';
}

export interface SystemStats {
  totalDocuments: number;
  activeGrants: number;
  revokedGrants: number;
  activeUsers: number;
  tamperIntegrityScore: number;
  storageUsedBytes: number;
  storageQuotaBytes: number;
  recentSecurityEventsCount: number;
}

export type AdminNotificationType =
  | 'DOC_UPLOAD'
  | 'DOC_SHARED'
  | 'DOC_ACCESSED'
  | 'DOC_REVOKED'
  | 'USER_LOGIN'
  | 'VIEWER_ACTION'
  | 'OWNER_ACTION'
  | 'ACCESS_APPROVAL_REQUEST'
  | 'ACCESS_APPROVED'
  | 'ACCESS_REJECTED';

export interface AdminNotification {
  id: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: UserRole;
  targetResourceId?: string;
  targetResourceName?: string;
  pendingUserId?: string;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  details?: Record<string, any>;
}
