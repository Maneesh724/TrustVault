import type { User, VaultDocument, AuditLog, SecurityPolicy, ThreatAlert, AdminNotification } from '../types/index.ts';

// Core default personas: ONLY Administrator and Document Owner
export const INITIAL_USERS: User[] = [
  {
    id: 'user-002',
    email: 'admin@trustvault.com',
    name: 'John Doe',
    role: 'ADMIN',
    department: 'Platform Administration',
    phone: '+1 (555) 234-8901',
    phoneVerified: true,
    mfaEnabled: true,
    status: 'ACTIVE',
    lastLoginAt: '2026-10-22T08:00:00Z',
    createdAt: '2025-01-10T08:00:00Z',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=John%20Doe',
  },
  {
    id: 'user-001',
    email: 'sarah@trustvault.com',
    name: 'Sarah Wilson',
    role: 'OWNER',
    department: 'Enterprise Security',
    phone: '+1 (555) 789-3412',
    phoneVerified: true,
    mfaEnabled: true,
    status: 'ACTIVE',
    lastLoginAt: '2026-10-22T08:30:00Z',
    createdAt: '2025-01-15T09:00:00Z',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Sarah%20Wilson',
  }
];

// Live operation mode: empty initial collections (populated via live backend actions)
export const INITIAL_DOCUMENTS: VaultDocument[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_SECURITY_POLICIES: SecurityPolicy[] = [
  {
    id: 'pol-1',
    name: 'Immediate Revocation Guard',
    description: 'Dynamic grant checking on every subsequent request. When an access grant is revoked, subsequent operations are blocked immediately.',
    enabled: true,
    category: 'ACCESS_CONTROL',
    threatRef: 'Elevation of Privilege',
  },
  {
    id: 'pol-2',
    name: 'Strict Single-Use Rate-Limited Mobile OTP',
    description: 'Enforces 5-minute expiry, single-use token consumption, and rate limits on OTP generation and verification.',
    enabled: true,
    category: 'AUTHENTICATION',
    threatRef: 'Spoofing',
  },
  {
    id: 'pol-3',
    name: 'Argon2id Memory-Hard Credential Hashing',
    description: 'Memory-hard password hashing (RFC 9106) protecting credentials against GPU/ASIC rainbow attacks.',
    enabled: true,
    category: 'AUTHENTICATION',
    threatRef: 'Spoofing',
  },
  {
    id: 'pol-4',
    name: 'Tamper-Evident Append-Only Audit Ledger',
    description: 'Compliance records cannot be updated or deleted by any administrative or programmatic action.',
    enabled: true,
    category: 'ACCESS_CONTROL',
    threatRef: 'Tampering',
  },
  {
    id: 'pol-5',
    name: 'Dynamic Watermark Insertion on Restricted Documents',
    description: 'Stamps accessing user email, IP address, and timestamp into document previews for tracking leaks.',
    enabled: true,
    category: 'DATA_LOSS_PREVENTION',
    threatRef: 'Information Disclosure',
  }
];

export const INITIAL_THREAT_ALERTS: ThreatAlert[] = [];

export const INITIAL_ADMIN_NOTIFICATIONS: AdminNotification[] = [];
