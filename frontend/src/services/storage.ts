import { User, VaultDocument, AuditLog, SecurityPolicy, ThreatAlert, AdminNotification } from '../types';
import {
  INITIAL_USERS,
  INITIAL_DOCUMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SECURITY_POLICIES,
  INITIAL_THREAT_ALERTS,
  INITIAL_ADMIN_NOTIFICATIONS,
} from './mockData';
import { firebaseService } from './firebaseService';

const STORAGE_KEYS = {
  USERS: 'trustvault_users',
  DOCUMENTS: 'trustvault_documents',
  AUDIT_LOGS: 'trustvault_audit_logs',
  POLICIES: 'trustvault_policies',
  THREATS: 'trustvault_threats',
  NOTIFICATIONS: 'trustvault_admin_notifications',
  CURRENT_USER_ID: 'trustvault_current_user_id',
};

// Obsolete mock emails to purge from client memory
const LEGACY_MOCK_EMAILS = [
  'mike@trustvault.com',
  'emily@trustvault.com',
  'david@trustvault.com',
  'elena.rostova@external-audit.com',
  'alex.morgan@trustvault.com',
];

// Authoritative storage managed by Django REST API & PostgreSQL.
// Direct unauthenticated client writes to Firestore are disabled to prevent data tampering.

export const getStoredUsers = (): User[] => {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  try {
    const parsed: User[] = JSON.parse(data);
    // Filter out obsolete demo credentials, keeping strictly Admin, Owner, and live registered users
    const filtered = parsed.filter((u) => !LEGACY_MOCK_EMAILS.includes(u.email.toLowerCase()));

    // Ensure admin and owner are present
    INITIAL_USERS.forEach((iu) => {
      if (!filtered.some((u) => u.email.toLowerCase() === iu.email.toLowerCase())) {
        filtered.push(iu);
      }
    });

    if (filtered.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
    }
    return filtered;
  } catch {
    return INITIAL_USERS;
  }
};

export const setStoredUsers = (users: User[]): void => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const getStoredDocuments = (): VaultDocument[] => {
  const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify([]));
    return [];
  }
  try {
    const parsed: VaultDocument[] = JSON.parse(data);
    // Filter out obsolete legacy mock documents
    const liveDocs = parsed.filter((d) => d.id !== 'doc-701' && d.id !== 'doc-702');
    if (liveDocs.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(liveDocs));
    }
    return liveDocs;
  } catch {
    return [];
  }
};

export const setStoredDocuments = (docs: VaultDocument[]): void => {
  localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
};

export const getStoredAuditLogs = (): AuditLog[] => {
  const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
    return [];
  }
  try {
    const parsed: AuditLog[] = JSON.parse(data);
    const liveLogs = parsed.filter((l) => !l.id.startsWith('audit-00') && !l.id.startsWith('audit-10'));
    return liveLogs;
  } catch {
    return [];
  }
};

export const appendStoredAuditLog = (log: AuditLog): void => {
  const logs = getStoredAuditLogs();
  const updated = [log, ...logs];
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));
};

export const getStoredPolicies = (): SecurityPolicy[] => {
  const data = localStorage.getItem(STORAGE_KEYS.POLICIES);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.POLICIES, JSON.stringify(INITIAL_SECURITY_POLICIES));
    return INITIAL_SECURITY_POLICIES;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_SECURITY_POLICIES;
  }
};

export const setStoredPolicies = (policies: SecurityPolicy[]): void => {
  localStorage.setItem(STORAGE_KEYS.POLICIES, JSON.stringify(policies));
};

export const getStoredThreats = (): ThreatAlert[] => {
  const data = localStorage.getItem(STORAGE_KEYS.THREATS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.THREATS, JSON.stringify([]));
    return [];
  }
  try {
    const parsed: ThreatAlert[] = JSON.parse(data);
    return parsed.filter((t) => t.id !== 'thr-1' && t.id !== 'thr-2');
  } catch {
    return [];
  }
};

export const getStoredNotifications = (): AdminNotification[] => {
  const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    return [];
  }
  try {
    const parsed: AdminNotification[] = JSON.parse(data);
    // Filter out old seed notifications
    return parsed.filter(
      (n) => !['notif-1', 'notif-2', 'notif-3', 'notif-4', 'notif-seed-001'].includes(n.id)
    );
  } catch {
    return [];
  }
};

export const setStoredNotifications = (notifs: AdminNotification[]): void => {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
};

export const appendStoredNotification = (notif: AdminNotification): void => {
  const notifs = getStoredNotifications();
  const updated = [notif, ...notifs];
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  // Asynchronously replicate notification to Firebase Firestore
  firebaseService.addNotification(notif).catch(() => {});
};

export const updateStoredNotification = (id: string, updates: Partial<AdminNotification>): void => {
  const notifs = getStoredNotifications();
  const idx = notifs.findIndex((n) => n.id === id);
  if (idx !== -1) {
    notifs[idx] = { ...notifs[idx], ...updates };
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    if (updates.read) {
      firebaseService.markNotificationRead(id).catch(() => {});
    }
  }
};

export const getCurrentUserId = (): string => {
  const id = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
  if (!id || id === 'user-003' || id === 'user-005' || id === 'user-006' || id === 'user-007') {
    return 'user-002'; // Default to admin
  }
  return id;
};

export const setCurrentUserId = (id: string): void => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
};

export const resetAllDemoData = (): void => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.POLICIES, JSON.stringify(INITIAL_SECURITY_POLICIES));
  localStorage.setItem(STORAGE_KEYS.THREATS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'user-002');
};
