import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, VaultDocument, AuditLog, AdminNotification, DocumentGrant } from '../types';

// Collection references
const USERS_COL = 'users';
const DOCUMENTS_COL = 'documents';
const AUDIT_LOGS_COL = 'audit_logs';
const NOTIFICATIONS_COL = 'notifications';

export const firebaseService = {
  // =========================================================================
  // 1. USERS COLLECTION
  // =========================================================================
  async syncUser(user: User): Promise<void> {
    try {
      const userRef = doc(db, USERS_COL, user.id);
      // Clean undefined fields before writing to Firestore
      const cleanData = JSON.parse(JSON.stringify(user));
      await setDoc(userRef, { ...cleanData, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('[Firebase] syncUser notice:', err);
    }
  },

  async getAllUsers(): Promise<User[]> {
    try {
      const snapshot = await getDocs(collection(db, USERS_COL));
      if (snapshot.empty) return [];
      return snapshot.docs.map((d) => d.data() as User);
    } catch (err) {
      console.warn('[Firebase] getAllUsers notice:', err);
      return [];
    }
  },

  onUsersChange(callback: (users: User[]) => void): () => void {
    try {
      const q = query(collection(db, USERS_COL));
      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const users = snapshot.docs.map((d) => d.data() as User);
            callback(users);
          }
        },
        (err) => {
          console.warn('[Firebase] onUsersChange listener notice:', err);
        }
      );
    } catch {
      return () => {};
    }
  },

  async updateUserStatus(userId: string, newStatus: string, approverName?: string): Promise<void> {
    try {
      const userRef = doc(db, USERS_COL, userId);
      const updatePayload: Record<string, any> = {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
      if (approverName) {
        updatePayload.approvedBy = approverName;
        updatePayload.approvedAt = new Date().toISOString();
      }
      await updateDoc(userRef, updatePayload);
    } catch (err) {
      console.warn('[Firebase] updateUserStatus notice:', err);
    }
  },

  // =========================================================================
  // 2. DOCUMENTS COLLECTION
  // =========================================================================
  async saveDocument(document: VaultDocument): Promise<void> {
    try {
      const docRef = doc(db, DOCUMENTS_COL, document.id);
      const cleanData = JSON.parse(JSON.stringify(document));
      await setDoc(docRef, { ...cleanData, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('[Firebase] saveDocument notice:', err);
    }
  },

  async getAllDocuments(): Promise<VaultDocument[]> {
    try {
      const snapshot = await getDocs(collection(db, DOCUMENTS_COL));
      if (snapshot.empty) return [];
      return snapshot.docs.map((d) => d.data() as VaultDocument);
    } catch (err) {
      console.warn('[Firebase] getAllDocuments notice:', err);
      return [];
    }
  },

  onDocumentsChange(callback: (docs: VaultDocument[]) => void): () => void {
    try {
      const q = query(collection(db, DOCUMENTS_COL));
      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const docs = snapshot.docs.map((d) => d.data() as VaultDocument);
            callback(docs);
          }
        },
        (err) => {
          console.warn('[Firebase] onDocumentsChange listener notice:', err);
        }
      );
    } catch {
      return () => {};
    }
  },

  async updateDocumentGrants(docId: string, grants: DocumentGrant[]): Promise<void> {
    try {
      const docRef = doc(db, DOCUMENTS_COL, docId);
      const cleanGrants = JSON.parse(JSON.stringify(grants));
      await updateDoc(docRef, {
        grants: cleanGrants,
        grantsCount: grants.filter((g) => g.status === 'ACTIVE').length,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[Firebase] updateDocumentGrants notice:', err);
    }
  },

  async deleteDocument(docId: string): Promise<void> {
    try {
      const docRef = doc(db, DOCUMENTS_COL, docId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('[Firebase] deleteDocument notice:', err);
    }
  },

  // =========================================================================
  // 3. IMMUTABLE AUDIT LOGS COLLECTION
  // =========================================================================
  async appendAuditLog(log: AuditLog): Promise<void> {
    try {
      const logRef = doc(db, AUDIT_LOGS_COL, log.id);
      const cleanData = JSON.parse(JSON.stringify(log));
      await setDoc(logRef, cleanData);
    } catch (err) {
      console.warn('[Firebase] appendAuditLog notice:', err);
    }
  },

  async getAuditLogs(maxLogs: number = 60): Promise<AuditLog[]> {
    try {
      const q = query(collection(db, AUDIT_LOGS_COL), orderBy('timestamp', 'desc'), limit(maxLogs));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return [];
      return snapshot.docs.map((d) => d.data() as AuditLog);
    } catch {
      // Fallback without ordering index if index is building
      try {
        const snapshot = await getDocs(collection(db, AUDIT_LOGS_COL));
        const list = snapshot.docs.map((d) => d.data() as AuditLog);
        return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      } catch (err) {
        console.warn('[Firebase] getAuditLogs notice:', err);
        return [];
      }
    }
  },

  onAuditLogsChange(callback: (logs: AuditLog[]) => void): () => void {
    try {
      const q = query(collection(db, AUDIT_LOGS_COL));
      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => d.data() as AuditLog);
            list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            callback(list);
          }
        },
        (err) => {
          console.warn('[Firebase] onAuditLogsChange listener notice:', err);
        }
      );
    } catch {
      return () => {};
    }
  },

  // =========================================================================
  // 4. ADMIN NOTIFICATIONS COLLECTION
  // =========================================================================
  async addNotification(notif: AdminNotification): Promise<void> {
    try {
      const notifRef = doc(db, NOTIFICATIONS_COL, notif.id);
      const cleanData = JSON.parse(JSON.stringify(notif));
      await setDoc(notifRef, cleanData);
    } catch (err) {
      console.warn('[Firebase] addNotification notice:', err);
    }
  },

  async getNotifications(): Promise<AdminNotification[]> {
    try {
      const snapshot = await getDocs(collection(db, NOTIFICATIONS_COL));
      if (snapshot.empty) return [];
      const list = snapshot.docs.map((d) => d.data() as AdminNotification);
      return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (err) {
      console.warn('[Firebase] getNotifications notice:', err);
      return [];
    }
  },

  onNotificationsChange(callback: (notifs: AdminNotification[]) => void): () => void {
    try {
      const q = query(collection(db, NOTIFICATIONS_COL));
      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => d.data() as AdminNotification);
            list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            callback(list);
          }
        },
        (err) => {
          console.warn('[Firebase] onNotificationsChange listener notice:', err);
        }
      );
    } catch {
      return () => {};
    }
  },

  async markNotificationRead(notifId: string): Promise<void> {
    try {
      const notifRef = doc(db, NOTIFICATIONS_COL, notifId);
      await updateDoc(notifRef, { read: true });
    } catch (err) {
      console.warn('[Firebase] markNotificationRead notice:', err);
    }
  },

  // =========================================================================
  // 5. SEED INITIAL DATA TO FIRESTORE IF EMPTY
  // =========================================================================
  async seedInitialDataIfEmpty(
    initialUsers: User[],
    initialDocs: VaultDocument[],
    initialLogs: AuditLog[],
    initialNotifs: AdminNotification[]
  ): Promise<void> {
    try {
      const usersSnap = await getDocs(collection(db, USERS_COL));
      if (usersSnap.empty) {
        console.log('[Firebase Firestore] Initializing users collection with verified seeds...');
        for (const u of initialUsers) {
          const userRef = doc(db, USERS_COL, u.id);
          await setDoc(userRef, JSON.parse(JSON.stringify(u)));
        }
      }

      const docsSnap = await getDocs(collection(db, DOCUMENTS_COL));
      if (docsSnap.empty) {
        console.log('[Firebase Firestore] Initializing documents collection with verified seeds...');
        for (const d of initialDocs) {
          const docRef = doc(db, DOCUMENTS_COL, d.id);
          await setDoc(docRef, JSON.parse(JSON.stringify(d)));
        }
      }

      const notifsSnap = await getDocs(collection(db, NOTIFICATIONS_COL));
      if (notifsSnap.empty) {
        for (const n of initialNotifs) {
          const notifRef = doc(db, NOTIFICATIONS_COL, n.id);
          await setDoc(notifRef, JSON.parse(JSON.stringify(n)));
        }
      }
    } catch (err) {
      console.warn('[Firebase Firestore] Initial seed notice (will retry on next load):', err);
    }
  },
};
