import { DocumentGrant, PermissionLevel, User } from '../types';
import {
  getStoredDocuments,
  setStoredDocuments,
  getStoredUsers,
  appendStoredAuditLog,
} from './storage';

export const accessService = {
  async grantAccess(
    documentId: string,
    targetUserId: string,
    permission: PermissionLevel,
    expiresAt: string | null,
    actor: User
  ): Promise<DocumentGrant> {
    const docs = getStoredDocuments();
    const docIndex = docs.findIndex((d) => d.id === documentId);
    if (docIndex === -1) throw new Error('Document not found.');

    const doc = docs[docIndex];
    const isOwner = doc.ownerId === actor.id || actor.role === 'OWNER' || actor.role === 'ADMIN';
    if (!isOwner) {
      appendStoredAuditLog({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'GRANT_CREATE',
        targetResourceId: doc.id,
        targetResourceName: doc.title,
        severity: 'CRITICAL',
        ipAddress: '198.51.100.12',
        userAgent: navigator.userAgent,
        outcome: 'DENIED',
        details: { reason: 'Unauthorized access grant attempt' },
      });
      throw new Error('Access Denied: Only document owner or Admin can grant access.');
    }

    const users = getStoredUsers();
    const targetUser = users.find((u) => u.id === targetUserId);
    if (!targetUser) throw new Error('Target user not found.');

    // Check if user already has grant
    const existingIndex = doc.grants.findIndex((g) => g.userId === targetUserId);
    let newGrant: DocumentGrant;

    if (existingIndex >= 0) {
      // Re-activate or update
      newGrant = {
        ...doc.grants[existingIndex],
        permission,
        expiresAt,
        status: 'ACTIVE',
        grantedAt: new Date().toISOString(),
        grantedBy: actor.name,
        revokedAt: undefined,
        revokedBy: undefined,
      };
      doc.grants[existingIndex] = newGrant;
    } else {
      newGrant = {
        id: `grant-${Date.now()}`,
        documentId: doc.id,
        userId: targetUser.id,
        userEmail: targetUser.email,
        userName: targetUser.name,
        userRole: targetUser.role,
        permission,
        grantedAt: new Date().toISOString(),
        grantedBy: actor.name,
        expiresAt,
        status: 'ACTIVE',
      };
      doc.grants.push(newGrant);
    }

    doc.grantsCount = doc.grants.filter((g) => g.status === 'ACTIVE').length;
    doc.updatedAt = new Date().toISOString();
    docs[docIndex] = doc;
    setStoredDocuments(docs);

    appendStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'GRANT_CREATE',
      targetResourceId: doc.id,
      targetResourceName: doc.title,
      severity: 'INFO',
      ipAddress: '198.51.100.12',
      userAgent: navigator.userAgent,
      outcome: 'SUCCESS',
      details: {
        grantee: targetUser.email,
        permission,
        expiresAt: expiresAt || 'INDEFINITE',
      },
    });

    return newGrant;
  },

  async revokeAccessImmediately(
    documentId: string,
    grantId: string,
    actor: User,
    reason: string = 'Administrative access revocation'
  ): Promise<void> {
    const docs = getStoredDocuments();
    const docIndex = docs.findIndex((d) => d.id === documentId);
    if (docIndex === -1) throw new Error('Document not found.');

    const doc = docs[docIndex];
    const isOwner = doc.ownerId === actor.id || actor.role === 'OWNER' || actor.role === 'ADMIN';
    if (!isOwner) {
      appendStoredAuditLog({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'GRANT_REVOKE',
        targetResourceId: doc.id,
        targetResourceName: doc.title,
        severity: 'CRITICAL',
        ipAddress: '198.51.100.12',
        userAgent: navigator.userAgent,
        outcome: 'DENIED',
        details: { reason: 'Unauthorized access revocation attempt' },
      });
      throw new Error('Access Denied: Only document owner or Admin can revoke access.');
    }

    const grantIndex = doc.grants.findIndex((g) => g.id === grantId);
    if (grantIndex === -1) throw new Error('Grant record not found.');

    const grant = doc.grants[grantIndex];
    grant.status = 'REVOKED';
    grant.revokedAt = new Date().toISOString();
    grant.revokedBy = actor.name;

    doc.grants[grantIndex] = grant;
    doc.grantsCount = doc.grants.filter((g) => g.status === 'ACTIVE').length;
    doc.updatedAt = new Date().toISOString();
    docs[docIndex] = doc;
    setStoredDocuments(docs);

    appendStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'GRANT_REVOKE',
      targetResourceId: doc.id,
      targetResourceName: doc.title,
      severity: 'CRITICAL',
      ipAddress: '198.51.100.12',
      userAgent: navigator.userAgent,
      outcome: 'SUCCESS',
      details: {
        revokedUser: grant.userEmail,
        grantId: grant.id,
        reason,
        immediateEffect: true,
      },
    });
  },

  async updateGrantPermission(
    documentId: string,
    grantId: string,
    newPermission: PermissionLevel,
    actor: User
  ): Promise<DocumentGrant> {
    const docs = getStoredDocuments();
    const docIndex = docs.findIndex((d) => d.id === documentId);
    if (docIndex === -1) throw new Error('Document not found.');

    const doc = docs[docIndex];
    const grantIndex = doc.grants.findIndex((g) => g.id === grantId);
    if (grantIndex === -1) throw new Error('Grant not found.');

    const grant = doc.grants[grantIndex];
    const oldPermission = grant.permission;
    grant.permission = newPermission;
    grant.status = 'ACTIVE';

    doc.grants[grantIndex] = grant;
    docs[docIndex] = doc;
    setStoredDocuments(docs);

    appendStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'GRANT_UPDATE',
      targetResourceId: doc.id,
      targetResourceName: doc.title,
      severity: 'WARNING',
      ipAddress: '198.51.100.12',
      userAgent: navigator.userAgent,
      outcome: 'SUCCESS',
      details: {
        targetUser: grant.userEmail,
        oldPermission,
        newPermission,
      },
    });

    return grant;
  },
};
