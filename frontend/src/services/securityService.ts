import { SecurityPolicy, ThreatAlert, SystemStats, User } from '../types';
import {
  getStoredPolicies,
  setStoredPolicies,
  getStoredThreats,
  getStoredDocuments,
  getStoredUsers,
  getStoredAuditLogs,
  appendStoredAuditLog,
} from './storage';

export const securityService = {
  async getPolicies(): Promise<SecurityPolicy[]> {
    return getStoredPolicies();
  },

  async togglePolicy(policyId: string, enabled: boolean, actor: User): Promise<SecurityPolicy> {
    const policies = getStoredPolicies();
    const index = policies.findIndex((p) => p.id === policyId);
    if (index === -1) throw new Error('Policy not found.');

    policies[index].enabled = enabled;
    setStoredPolicies(policies);

    appendStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'SECURITY_POLICY_UPDATE',
      targetResourceId: policies[index].id,
      targetResourceName: policies[index].name,
      severity: 'WARNING',
      ipAddress: '198.51.100.12',
      userAgent: navigator.userAgent,
      outcome: 'SUCCESS',
      details: {
        policyName: policies[index].name,
        newStatus: enabled ? 'ENFORCED' : 'DISABLED',
        threatRef: policies[index].threatRef,
      },
    });

    return policies[index];
  },

  async getThreatAlerts(): Promise<ThreatAlert[]> {
    return getStoredThreats();
  },

  async getSystemStats(): Promise<SystemStats> {
    const docs = getStoredDocuments();
    const users = getStoredUsers();
    const logs = getStoredAuditLogs();

    let activeGrants = 0;
    let revokedGrants = 0;
    let totalSizeBytes = 0;

    docs.forEach((d) => {
      totalSizeBytes += d.fileSizeBytes;
      d.grants.forEach((g) => {
        if (g.status === 'ACTIVE') activeGrants++;
        if (g.status === 'REVOKED') revokedGrants++;
      });
    });

    const recentCriticalLogs = logs.filter(
      (l) => l.severity === 'CRITICAL' && new Date(l.timestamp).getTime() > Date.now() - 7 * 24 * 3600 * 1000
    );

    return {
      totalDocuments: docs.length,
      activeGrants,
      revokedGrants,
      activeUsers: users.filter((u) => u.status === 'ACTIVE').length,
      tamperIntegrityScore: 99.8,
      storageUsedBytes: totalSizeBytes,
      storageQuotaBytes: 10 * 1024 * 1024 * 1024, // 10 GB
      recentSecurityEventsCount: recentCriticalLogs.length,
    };
  },
};
