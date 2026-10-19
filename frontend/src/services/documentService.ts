import { VaultDocument, User, DocumentClassification, PermissionLevel } from '../types';
import {
  getStoredDocuments,
  setStoredDocuments,
  appendStoredAuditLog,
} from './storage';

export async function calculateSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digestBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(digestBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface UploadDocumentPayload {
  title: string;
  description: string;
  classification: DocumentClassification;
  tags: string[];
  watermarkEnabled: boolean;
  downloadRestricted: boolean;
  file: File;
  calculatedHash?: string;
}

export const documentService = {
  async getDocuments(): Promise<VaultDocument[]> {
    return getStoredDocuments();
  },

  async getDocumentById(id: string, currentUser: User): Promise<{ document: VaultDocument; userPermission: PermissionLevel | 'NONE' | 'REVOKED' }> {
    const docs = getStoredDocuments();
    const doc = docs.find((d) => d.id === id);
    if (!doc) throw new Error('Document not found.');

    // Determine permission level for currentUser
    let permission: PermissionLevel | 'NONE' | 'REVOKED' = 'NONE';

    if (doc.ownerId === currentUser.id || currentUser.role === 'OWNER') {
      permission = 'ADMIN';
    } else if (currentUser.role === 'ADMIN') {
      permission = 'ADMIN';
    } else {
      const grant = doc.grants.find((g) => g.userId === currentUser.id);
      if (grant) {
        if (grant.status === 'REVOKED') {
          permission = 'REVOKED';
        } else if (grant.expiresAt && new Date(grant.expiresAt) < new Date()) {
          permission = 'REVOKED';
        } else {
          permission = grant.permission;
        }
      } else if (doc.classification === 'PUBLIC') {
        permission = 'READ';
      }
    }

    // If permission is revoked, record access denial in audit trail
    if (permission === 'REVOKED' || permission === 'NONE') {
      appendStoredAuditLog({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'DOC_VIEW',
        targetResourceId: doc.id,
        targetResourceName: doc.title,
        severity: 'CRITICAL',
        ipAddress: '198.51.100.12',
        userAgent: navigator.userAgent,
        outcome: 'DENIED',
        details: {
          reason: permission === 'REVOKED' ? 'Access grant revoked or expired' : 'No valid grant found',
          threatRef: 'Information Disclosure / Elevation of Privilege',
        },
      });
    } else {
      appendStoredAuditLog({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'DOC_VIEW',
        targetResourceId: doc.id,
        targetResourceName: doc.title,
        severity: 'INFO',
        ipAddress: '198.51.100.12',
        userAgent: navigator.userAgent,
        outcome: 'SUCCESS',
        details: { permissionEvaluated: permission },
      });
    }

    return { document: doc, userPermission: permission };
  },

  async uploadDocument(payload: UploadDocumentPayload, currentUser: User): Promise<VaultDocument> {
    const docs = getStoredDocuments();
    const hash = payload.calculatedHash || (await calculateSHA256(payload.file));

    const newDocId = `doc-${Date.now()}`;
    const initialVersion = {
      id: `ver-${Date.now()}-1`,
      versionNumber: 1,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.id,
      uploaderName: currentUser.name,
      sha256Hash: hash,
      fileSizeBytes: payload.file.size,
      changeSummary: 'Initial document upload into zero-trust vault.',
    };

    const newDoc: VaultDocument = {
      id: newDocId,
      title: payload.title,
      description: payload.description,
      filename: payload.file.name,
      mimeType: payload.file.type || 'application/octet-stream',
      fileSizeBytes: payload.file.size,
      classification: payload.classification,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      ownerEmail: currentUser.email,
      sha256Hash: hash,
      watermarkEnabled: payload.watermarkEnabled,
      downloadRestricted: payload.downloadRestricted,
      tags: payload.tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      grantsCount: 0,
      versions: [initialVersion],
      grants: [],
    };

    const updated = [newDoc, ...docs];
    setStoredDocuments(updated);

    appendStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorEmail: currentUser.email,
      actorRole: currentUser.role,
      action: 'DOC_UPLOAD',
      targetResourceId: newDoc.id,
      targetResourceName: newDoc.title,
      severity: 'INFO',
      ipAddress: '198.51.100.12',
      userAgent: navigator.userAgent,
      outcome: 'SUCCESS',
      details: {
        fileSizeBytes: newDoc.fileSizeBytes,
        sha256Hash: newDoc.sha256Hash,
        classification: newDoc.classification,
      },
    });

    return newDoc;
  },

  async deleteDocument(id: string, currentUser: User): Promise<void> {
    const docs = getStoredDocuments();
    const target = docs.find((d) => d.id === id);
    if (!target) throw new Error('Document not found.');

    if (target.ownerId !== currentUser.id && currentUser.role !== 'OWNER' && currentUser.role !== 'ADMIN') {
      appendStoredAuditLog({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'DOC_DELETE',
        targetResourceId: target.id,
        targetResourceName: target.title,
        severity: 'CRITICAL',
        ipAddress: '198.51.100.12',
        userAgent: navigator.userAgent,
        outcome: 'DENIED',
        details: { reason: 'Unauthorized document deletion attempt' },
      });
      throw new Error('Access Denied: Only document owner or Security Admin can delete documents.');
    }

    const filtered = docs.filter((d) => d.id !== id);
    setStoredDocuments(filtered);

    appendStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorEmail: currentUser.email,
      actorRole: currentUser.role,
      action: 'DOC_DELETE',
      targetResourceId: target.id,
      targetResourceName: target.title,
      severity: 'WARNING',
      ipAddress: '198.51.100.12',
      userAgent: navigator.userAgent,
      outcome: 'SUCCESS',
      details: { deletedDocument: target.title },
    });
  },

  async requestSecureDownload(docId: string, currentUser: User): Promise<{ downloadUrl: string; filename: string }> {
    const docs = getStoredDocuments();
    const doc = docs.find((d) => d.id === docId);
    if (!doc) throw new Error('Document not found.');

    // Evaluate active authorization immediately
    const isOwner = doc.ownerId === currentUser.id || currentUser.role === 'OWNER' || currentUser.role === 'ADMIN';
    const activeGrant = doc.grants.find((g) => g.userId === currentUser.id && g.status === 'ACTIVE');

    if (!isOwner && !activeGrant && doc.classification !== 'PUBLIC') {
      appendStoredAuditLog({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'DOC_DOWNLOAD',
        targetResourceId: doc.id,
        targetResourceName: doc.title,
        severity: 'CRITICAL',
        ipAddress: '198.51.100.12',
        userAgent: navigator.userAgent,
        outcome: 'DENIED',
        details: { reason: 'Immediate authorization check failed. No active grant found.' },
      });
      throw new Error('Authorization Denied: You do not possess an active grant for this document.');
    }

    if (doc.downloadRestricted && !isOwner) {
      appendStoredAuditLog({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'DOC_DOWNLOAD',
        targetResourceId: doc.id,
        targetResourceName: doc.title,
        severity: 'WARNING',
        ipAddress: '198.51.100.12',
        userAgent: navigator.userAgent,
        outcome: 'DENIED',
        details: { reason: 'Direct download is restricted by document policy. Preview only.' },
      });
      throw new Error('Download Restricted: This document has DLP restrictions enabled. Please view inside the secure sandbox previewer.');
    }

    appendStoredAuditLog({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorEmail: currentUser.email,
      actorRole: currentUser.role,
      action: 'DOC_DOWNLOAD',
      targetResourceId: doc.id,
      targetResourceName: doc.title,
      severity: 'INFO',
      ipAddress: '198.51.100.12',
      userAgent: navigator.userAgent,
      outcome: 'SUCCESS',
      details: {
        sha256Hash: doc.sha256Hash,
        ephemeralSignedUrlIssued: true,
      },
    });

    // Generate safe mock download blob
    const fileContent = `--- TRUSTVAULT SECURE EXPORT ---
Document: ${doc.title}
Classification: ${doc.classification}
SHA-256 Checksum: ${doc.sha256Hash}
Exported By: ${currentUser.name} (${currentUser.email})
Timestamp: ${new Date().toISOString()}
Security Notice: Unauthorized redistribution is logged and strictly prohibited.
---------------------------------`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    return { downloadUrl: url, filename: doc.filename.endsWith('.pdf') ? doc.filename.replace('.pdf', '_export.txt') : `${doc.filename}.txt` };
  },
};
