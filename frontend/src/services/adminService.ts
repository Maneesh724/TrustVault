import { User, UserRole } from '../types';
import {
  getStoredUsers,
  setStoredUsers,
  appendStoredAuditLog,
} from './storage';

export const adminService = {
  async getAllUsers(): Promise<User[]> {
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

  async rejectUser(targetUserId: string, actor: User): Promise<void> {
    if (actor.role !== 'OWNER' && actor.role !== 'ADMIN') {
      throw new Error('Access Denied: Only Owner or Admin can reject registration requests.');
    }

    const users = getStoredUsers();
    const target = users.find((u) => u.id === targetUserId);
    if (!target) throw new Error('User not found.');

    const filtered = users.filter((u) => u.id !== targetUserId);
    setStoredUsers(filtered);

    appendStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
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
