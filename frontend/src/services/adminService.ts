import { User, UserRole } from '../types';
import {
  getStoredUsers,
  setStoredUsers,
  appendStoredAuditLog,
} from './storage';
import { firebaseService } from './firebaseService';

export const adminService = {
  async getAllUsers(): Promise<User[]> {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        if (data.users) {
          setStoredUsers(data.users);
          return data.users;
        }
      }
    } catch {}
    return getStoredUsers();
  },

  async updateUserRole(targetUserId: string, newRole: UserRole, actor: User): Promise<User> {
    if (actor.role !== 'OWNER' && actor.role !== 'ADMIN') {
      appendStoredAuditLog({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'USER_ROLE_UPDATE',
        targetResourceId: targetUserId,
        severity: 'CRITICAL',
        ipAddress: '198.51.100.12',
        userAgent: navigator.userAgent,
        outcome: 'DENIED',
        details: { reason: 'Unauthorized attempt to update user role' },
      });
      throw new Error('Access Denied: Only Owner or Admin can assign roles.');
    }

    const users = getStoredUsers();
    const index = users.findIndex((u) => u.id === targetUserId);
    if (index === -1) throw new Error('User not found.');

    const oldRole = users[index].role;
    users[index].role = newRole;
    setStoredUsers(users);

    appendStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'USER_ROLE_UPDATE',
      targetResourceId: users[index].id,
      targetResourceName: users[index].name,
      severity: 'WARNING',
      ipAddress: '198.51.100.12',
      userAgent: navigator.userAgent,
      outcome: 'SUCCESS',
      details: { oldRole, newRole, targetEmail: users[index].email },
    });

    return users[index];
  },

  async toggleUserStatus(targetUserId: string, actor: User): Promise<User> {
    if (actor.role !== 'OWNER' && actor.role !== 'ADMIN') {
      throw new Error('Access Denied: Only Owner or Admin can suspend users.');
    }

    const users = getStoredUsers();
    const index = users.findIndex((u) => u.id === targetUserId);
    if (index === -1) throw new Error('User not found.');

    const newStatus = users[index].status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    users[index].status = newStatus;
    setStoredUsers(users);
    firebaseService.updateUserStatus(targetUserId, newStatus, actor.name).catch(() => {});

    appendStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'USER_STATUS_CHANGE',
      targetResourceId: users[index].id,
      targetResourceName: users[index].name,
      severity: 'CRITICAL',
      ipAddress: '198.51.100.12',
      userAgent: navigator.userAgent,
      outcome: 'SUCCESS',
      details: { newStatus, targetEmail: users[index].email },
    });

    return users[index];
  },

  async approveUser(targetUserId: string, actor: User): Promise<User> {
    if (actor.role !== 'OWNER' && actor.role !== 'ADMIN') {
      throw new Error('Access Denied: Only Owner or Admin can approve registration requests.');
    }

    // Call real backend first
    try {
      const res = await fetch('/api/auth/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, approverName: actor.name }),
      });
      if (res.ok) {
        const data = await res.json();
        // Sync into localStorage
        const users = getStoredUsers();
        const idx = users.findIndex((u) => u.id === targetUserId);
        if (idx !== -1) {
          users[idx] = { ...users[idx], status: 'ACTIVE', approvedBy: actor.name, approvedAt: new Date().toISOString() };
          setStoredUsers(users);
        }
        firebaseService.updateUserStatus(targetUserId, 'ACTIVE', actor.name).catch(() => {});
        appendStoredAuditLog({
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: actor.id,
          actorName: actor.name,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: 'USER_STATUS_CHANGE',
          targetResourceId: targetUserId,
          targetResourceName: data.user?.name || targetUserId,
          severity: 'INFO',
          ipAddress: '198.51.100.12',
          userAgent: navigator.userAgent,
          outcome: 'SUCCESS',
          details: { event: 'REGISTRATION_APPROVED_BY_ADMIN', approvedBy: actor.name },
        });
        return data.user;
      }
    } catch {
      // Fallback to local
    }

    // Local fallback
    const users = getStoredUsers();
    const index = users.findIndex((u) => u.id === targetUserId);
    if (index === -1) throw new Error('User not found.');

    users[index].status = 'ACTIVE';
    users[index].approvedBy = actor.name;
    users[index].approvedAt = new Date().toISOString();
    setStoredUsers(users);

    appendStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'USER_ROLE_UPDATE',
      targetResourceId: users[index].id,
      targetResourceName: users[index].name,
      severity: 'INFO',
      ipAddress: '198.51.100.12',
      userAgent: navigator.userAgent,
      outcome: 'SUCCESS',
      details: {
        event: 'REGISTRATION_APPROVED_BY_ADMIN',
        targetEmail: users[index].email,
        assignedRole: users[index].role,
        approvedBy: actor.name,
        emailNotificationDispatched: true,
      },
    });

    return users[index];
  },

  async rejectUser(targetUserId: string, actor: User | string): Promise<void> {
    const actorName = typeof actor === 'string' ? actor : actor.name;
    const actorId = typeof actor === 'string' ? 'admin' : actor.id;
    const actorEmail = typeof actor === 'string' ? 'admin@trustvault.com' : actor.email;
    const actorRole = typeof actor === 'string' ? 'ADMIN' : actor.role;

    // Call real backend first
    try {
      const res = await fetch('/api/auth/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, rejectorName: actorName }),
      });
      if (res.ok) {
        // Remove from local storage
        const users = getStoredUsers();
        const target = users.find((u) => u.id === targetUserId);
        setStoredUsers(users.filter((u) => u.id !== targetUserId));
        firebaseService.updateUserStatus(targetUserId, 'REJECTED', actorName).catch(() => {});
        appendStoredAuditLog({
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId,
          actorName,
          actorEmail,
          actorRole,
          action: 'USER_STATUS_CHANGE',
          targetResourceId: targetUserId,
          targetResourceName: target?.name || targetUserId,
          severity: 'WARNING',
          ipAddress: '198.51.100.12',
          userAgent: navigator.userAgent,
          outcome: 'SUCCESS',
          details: { event: 'REGISTRATION_REJECTED', targetEmail: target?.email },
        });
        return;
      }
    } catch {
      // Fallback to local
    }

    // Local fallback
    const users = getStoredUsers();
    const target = users.find((u) => u.id === targetUserId);
    if (!target) throw new Error('User not found.');

    const filtered = users.filter((u) => u.id !== targetUserId);
    setStoredUsers(filtered);

    appendStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId,
      actorName,
      actorEmail,
      actorRole,
      action: 'USER_STATUS_CHANGE',
      targetResourceId: targetUserId,
      targetResourceName: target.name,
      severity: 'WARNING',
      ipAddress: '198.51.100.12',
      userAgent: navigator.userAgent,
      outcome: 'SUCCESS',
      details: { event: 'REGISTRATION_REJECTED', targetEmail: target.email },
    });
  },
};
