import { AuditLog, AuditSeverity } from '../types';
import { getStoredAuditLogs, appendStoredAuditLog } from './storage';

export interface AuditFilterParams {
  search?: string;
  actorEmail?: string;
  action?: string;
  severity?: AuditSeverity | 'ALL';
  outcome?: 'SUCCESS' | 'DENIED' | 'FAILED' | 'ALL';
  startDate?: string;
  endDate?: string;
}

export const auditService = {
  async getAuditLogs(filters?: AuditFilterParams): Promise<AuditLog[]> {
    try {
      const res = await fetch('/api/audit');
      if (res.ok) {
        const liveLogs = await res.json();
        localStorage.setItem('trustvault_audit_logs', JSON.stringify(liveLogs));
      }
    } catch {}

    let logs = getStoredAuditLogs();

    if (filters) {
      if (filters.search) {
        const query = filters.search.toLowerCase();
        logs = logs.filter(
          (l) =>
            l.actorName.toLowerCase().includes(query) ||
            l.actorEmail.toLowerCase().includes(query) ||
            (l.targetResourceName && l.targetResourceName.toLowerCase().includes(query)) ||
            l.action.toLowerCase().includes(query)
        );
      }
      if (filters.severity && filters.severity !== 'ALL') {
        logs = logs.filter((l) => l.severity === filters.severity);
      }
      if (filters.outcome && filters.outcome !== 'ALL') {
        logs = logs.filter((l) => l.outcome === filters.outcome);
      }
      if (filters.action) {
        logs = logs.filter((l) => l.action === filters.action);
      }
    }

    return logs;
  },

  async logCustomEvent(event: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const newLog: AuditLog = {
      ...event,
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    appendStoredAuditLog(newLog);
    return newLog;
  },

  exportLogsAsCSV(logs: AuditLog[]): string {
    const headers = ['Timestamp', 'Actor Name', 'Actor Email', 'Role', 'Action', 'Target Resource', 'Severity', 'Outcome', 'IP Address'];
    const rows = logs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.actorName}"`,
      `"${l.actorEmail}"`,
      `"${l.actorRole}"`,
      `"${l.action}"`,
      `"${l.targetResourceName || 'N/A'}"`,
      `"${l.severity}"`,
      `"${l.outcome}"`,
      `"${l.ipAddress}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return csvContent;
  },
};
