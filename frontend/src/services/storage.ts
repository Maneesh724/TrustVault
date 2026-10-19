import { User, VaultDocument, AuditLog, SecurityPolicy, ThreatAlert } from '../types';
import {
  INITIAL_USERS,
  INITIAL_DOCUMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SECURITY_POLICIES,
  INITIAL_THREAT_ALERTS
} from './mockData';

const STORAGE_KEYS = {
  USERS: 'trustvault_users',
  DOCUMENTS: 'trustvault_documents',
  AUDIT_LOGS: 'trustvault_audit_logs',
  POLICIES: 'trustvault_policies',
  THREATS: 'trustvault_threats',
  CURRENT_USER_ID: 'trustvault_current_user_id',
};

export const getStoredUsers = (): User[] => {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  try {
    const parsed: User[] = JSON.parse(data);
    const adminUser = parsed.find((u) => u.role === 'ADMIN');
    if (adminUser && adminUser.email !== 'admin@trustvault.com') {
      adminUser.email = 'admin@trustvault.com';
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(parsed));
    }
    return parsed;
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
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(INITIAL_DOCUMENTS));
    return INITIAL_DOCUMENTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_DOCUMENTS;
  }
};

export const setStoredDocuments = (docs: VaultDocument[]): void => {
  localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
};

export const getStoredAuditLogs = (): AuditLog[] => {
  const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    return INITIAL_AUDIT_LOGS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_AUDIT_LOGS;
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
    localStorage.setItem(STORAGE_KEYS.THREATS, JSON.stringify(INITIAL_THREAT_ALERTS));
    return INITIAL_THREAT_ALERTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_THREAT_ALERTS;
  }
};

export const getCurrentUserId = (): string => {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'user-002';
};

export const setCurrentUserId = (id: string): void => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
};

export const resetAllDemoData = (): void => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(INITIAL_DOCUMENTS));
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
  localStorage.setItem(STORAGE_KEYS.POLICIES, JSON.stringify(INITIAL_SECURITY_POLICIES));
  localStorage.setItem(STORAGE_KEYS.THREATS, JSON.stringify(INITIAL_THREAT_ALERTS));
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'user-002');
};
