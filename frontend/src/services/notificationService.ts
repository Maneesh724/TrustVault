import { AdminNotification, User, VaultDocument } from '../types';
import {
  getStoredNotifications,
  setStoredNotifications,
  appendStoredNotification,
  updateStoredNotification,
} from './storage';
import { adminService } from './adminService';

type NotificationListener = () => void;
const listeners: Set<NotificationListener> = new Set();

const notifyListeners = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Error in notification listener:', e);
    }
  });
};

export const notificationService = {
  subscribe(listener: NotificationListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getNotifications(): AdminNotification[] {
    return getStoredNotifications();
  },

  async fetchLiveNotifications(): Promise<AdminNotification[]> {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const live = await res.json();
        setStoredNotifications(live);
        notifyListeners();
        return live;
      }
    } catch {}
    return getStoredNotifications();
  },

  getUnreadCount(): number {
    return getStoredNotifications().filter((n) => !n.read).length;
  },

  getPendingApprovalsCount(): number {
    return getStoredNotifications().filter(
      (n) => n.type === 'ACCESS_APPROVAL_REQUEST' && n.approvalStatus === 'PENDING'
    ).length;
  },

  /**
   * Dispatches an Admin Notification when a Document is uploaded by an Owner or Viewer.
   */
  notifyDocUpload(doc: VaultDocument, uploader: User): void {
    if (uploader.role !== 'OWNER' && uploader.role !== 'VIEWER') return;

    const notif: AdminNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'DOC_UPLOAD',
      title: 'New Document Uploaded',
      message: `${uploader.name} (${uploader.role === 'OWNER' ? 'Document Owner' : 'Viewer'}) uploaded "${doc.title}".`,
      timestamp: new Date().toISOString(),
      read: false,
      actorId: uploader.id,
      actorName: uploader.name,
      actorEmail: uploader.email,
      actorRole: uploader.role,
      targetResourceId: doc.id,
      targetResourceName: doc.title,
      details: {
        filename: doc.filename,
        classification: doc.classification,
        fileSizeBytes: doc.fileSizeBytes,
      },
    };

    appendStoredNotification(notif);
    notifyListeners();
  },

  /**
   * Dispatches an Admin Notification when a Viewer or Owner logs in.
   */
  notifyUserLogin(user: User): void {
    if (user.role !== 'OWNER' && user.role !== 'VIEWER') return;

    const notif: AdminNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'USER_LOGIN',
      title: 'User Authenticated',
      message: `${user.name} (${user.role === 'OWNER' ? 'Document Owner' : 'Viewer'}) logged into TrustVault.`,
      timestamp: new Date().toISOString(),
      read: false,
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      details: {
        email: user.email,
        department: user.department,
        ipAddress: '198.51.100.12',
      },
    };

    appendStoredNotification(notif);
    notifyListeners();
  },

  /**
   * Dispatches an Admin Notification when any Viewer or Owner performs an action
   * (e.g. downloads, views, modifies permissions, updates doc).
   */
  notifyUserAction(
    actionName: string,
    actor: User,
    targetResourceName?: string,
    details?: Record<string, any>
  ): void {
    if (actor.role !== 'OWNER' && actor.role !== 'VIEWER') return;

    let friendlyTitle = 'Activity Recorded';
    if (actionName === 'DOC_DOWNLOAD') friendlyTitle = 'Document Downloaded';
    else if (actionName === 'DOC_VIEW') friendlyTitle = 'Document Accessed';
    else if (actionName === 'DOC_UPDATE') friendlyTitle = 'Document Modified';
    else if (actionName === 'DOC_DELETE') friendlyTitle = 'Document Deleted';
    else if (actionName === 'GRANT_CREATE') friendlyTitle = 'Permission Granted';
    else if (actionName === 'GRANT_REVOKE') friendlyTitle = 'Permission Revoked';

    const notif: AdminNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: actor.role === 'OWNER' ? 'OWNER_ACTION' : 'VIEWER_ACTION',
      title: friendlyTitle,
      message: `${actor.name} (${actor.role === 'OWNER' ? 'Document Owner' : 'Viewer'}) performed ${friendlyTitle}${
        targetResourceName ? ` on "${targetResourceName}"` : ''
      }.`,
      timestamp: new Date().toISOString(),
      read: false,
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetResourceName,
      details,
    };

    appendStoredNotification(notif);
    notifyListeners();
  },

  /**
   * Dispatches an Access Approval Request Notification to the Admin when a Viewer or Owner registers.
   */
  notifyAccessRequest(user: User): void {
    const notif: AdminNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'ACCESS_APPROVAL_REQUEST',
      title: 'Access Approval Required',
      message: `${user.name} registered as ${
        user.role === 'OWNER' ? 'Document Owner' : 'Viewer'
      } and is awaiting access authorization.`,
      timestamp: new Date().toISOString(),
      read: false,
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      pendingUserId: user.id,
      approvalStatus: 'PENDING',
      details: {
        phone: user.phone || 'N/A',
        department: user.department || 'General',
        email: user.email,
        requestedRole: user.role,
      },
    };

    appendStoredNotification(notif);
    notifyListeners();
  },

  /**
   * Admin approves a pending user directly from the notification.
   */
  async approveAccess(notificationId: string, approver: User): Promise<User> {
    const notifs = getStoredNotifications();
    const notif = notifs.find((n) => n.id === notificationId);
    if (!notif) throw new Error('Notification not found.');
    if (!notif.pendingUserId) throw new Error('No pending user associated with this notification.');

    // Approve user through admin service
    const approvedUser = await adminService.approveUser(notif.pendingUserId, approver);

    // Update the notification record
    updateStoredNotification(notificationId, {
      approvalStatus: 'APPROVED',
      read: true,
      message: `${approvedUser.name}'s registration was approved by ${approver.name}. Account is now ACTIVE.`,
    });

    // Add confirmation notification
    const confirmationNotif: AdminNotification = {
      id: `notif-${Date.now()}`,
      type: 'ACCESS_APPROVED',
      title: 'Account Activated',
      message: `Access authorization granted for ${approvedUser.name} (${
        approvedUser.role === 'OWNER' ? 'Document Owner' : 'Viewer'
      }) by Administrator ${approver.name}.`,
      timestamp: new Date().toISOString(),
      read: false,
      actorId: approver.id,
      actorName: approver.name,
      actorEmail: approver.email,
      actorRole: approver.role,
      details: {
        approvedUserEmail: approvedUser.email,
        role: approvedUser.role,
      },
    };
    appendStoredNotification(confirmationNotif);

    notifyListeners();
    return approvedUser;
  },

  /**
   * Admin rejects a pending user directly from the notification.
   */
  async rejectAccess(notificationId: string, approver: User): Promise<void> {
    const notifs = getStoredNotifications();
    const notif = notifs.find((n) => n.id === notificationId);
    if (!notif) throw new Error('Notification not found.');
    if (!notif.pendingUserId) throw new Error('No pending user associated with this notification.');

    const userName = notif.actorName;
    await adminService.rejectUser(notif.pendingUserId, approver);

    updateStoredNotification(notificationId, {
      approvalStatus: 'REJECTED',
      read: true,
      message: `${userName}'s registration was rejected by ${approver.name}.`,
    });

    notifyListeners();
  },

  updateNotification(id: string, updates: Partial<AdminNotification>): void {
    updateStoredNotification(id, updates);
    notifyListeners();
  },

  markAsRead(id: string): void {
    updateStoredNotification(id, { read: true });
    notifyListeners();
  },

  markAllAsRead(): void {
    const notifs = getStoredNotifications();
    const updated = notifs.map((n) => ({ ...n, read: true }));
    setStoredNotifications(updated);
    notifyListeners();
  },

  clearAll(): void {
    setStoredNotifications([]);
    notifyListeners();
  },
};
