import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  LogOut,
  Settings,
  UserCheck,
  ChevronDown,
  Upload,
  Key,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Check,
  X,
  ShieldAlert,
  Share2,
  Eye,
  Download,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { notificationService } from '../../services/notificationService';
import { AdminNotification, getRoleLandingRoute } from '../../types';

interface NavbarProps {
  onToggleSidebar: () => void;
  pageTitle?: string;
  onSearch?: (term: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onSearch }) => {
  const { user, allUsers, switchUser, logout, refreshUsers } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<string>('ALL');
  const [notifications, setNotifications] = useState<AdminNotification[]>(() =>
    notificationService.getNotificationsForRole(user)
  );

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    notificationService.fetchLiveNotifications();
    const unsubscribe = notificationService.subscribe(() => {
      setNotifications(notificationService.getNotificationsForRole(user));
    });
    return unsubscribe;
  }, [user]);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pendingApprovalsCount = notifications.filter(
    (n) => n.type === 'ACCESS_APPROVAL_REQUEST' && n.approvalStatus === 'PENDING'
  ).length;

  const filteredNotifications = notifications.filter((n) => {
    if (notifFilter === 'ALL') return true;

    if (user?.role === 'ADMIN') {
      if (notifFilter === 'APPROVALS') {
        return n.type === 'ACCESS_APPROVAL_REQUEST' || n.type === 'ACCESS_APPROVED' || n.type === 'ACCESS_REJECTED';
      }
      if (notifFilter === 'LOGINS') {
        return n.type === 'USER_LOGIN';
      }
      if (notifFilter === 'DOCS') {
        return n.type === 'DOC_UPLOAD';
      }
    } else if (user?.role === 'OWNER') {
      if (notifFilter === 'SHARES') {
        return n.type === 'DOC_SHARED' || n.type === 'DOC_REVOKED';
      }
      if (notifFilter === 'ACTIVITY') {
        return n.type === 'DOC_ACCESSED' || n.type === 'VIEWER_ACTION';
      }
      if (notifFilter === 'UPLOADS') {
        return n.type === 'DOC_UPLOAD';
      }
    } else if (user?.role === 'VIEWER') {
      if (notifFilter === 'SHARED_WITH_ME') {
        return n.type === 'DOC_SHARED';
      }
      if (notifFilter === 'ACTIVITY') {
        return n.type === 'DOC_ACCESSED' || n.type === 'VIEWER_ACTION';
      }
    }
    return true;
  });

  const getFilterButtons = () => {
    if (user?.role === 'ADMIN') {
      return [
        { id: 'ALL', label: 'All' },
        { id: 'APPROVALS', label: `Approvals${pendingApprovalsCount > 0 ? ` (${pendingApprovalsCount})` : ''}` },
        { id: 'LOGINS', label: 'Logins' },
        { id: 'DOCS', label: 'Doc Uploads' },
      ];
    }
    if (user?.role === 'OWNER') {
      return [
        { id: 'ALL', label: 'All' },
        { id: 'SHARES', label: 'Shares' },
        { id: 'ACTIVITY', label: 'Viewer Activity' },
        { id: 'UPLOADS', label: 'My Uploads' },
      ];
    }
    // VIEWER
    return [
      { id: 'ALL', label: 'All' },
      { id: 'SHARED_WITH_ME', label: 'Shared With Me' },
      { id: 'ACTIVITY', label: 'My Access' },
    ];
  };

  const handleApprove = async (notifId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const approved = await notificationService.approveAccess(notifId, user);
      showToast('Access Approved', `Authorized login for ${approved.name} (${approved.role}).`, 'success');
      await refreshUsers();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to approve user.', 'error');
    }
  };

  const handleReject = async (notifId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await notificationService.rejectAccess(notifId, user);
      showToast('Request Rejected', 'The registration request has been rejected.', 'info');
      await refreshUsers();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to reject user.', 'error');
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'JD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleLabel =
    user?.role === 'ADMIN'
      ? 'Administrator'
      : user?.role === 'OWNER'
      ? 'Document Owner'
      : 'Viewer';

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#070A13] border-b border-[#13192B] px-4 sm:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input matching reference image */}
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={
              user?.role === 'ADMIN'
                ? 'Search users, documents, or audit logs...'
                : 'Search your documents, folders...'
            }
            onChange={(e) => onSearch && onSearch(e.target.value)}
            className="w-full bg-[#0D121F] border border-[#1E2638] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
          />
        </div>
      </div>

      {/* Right controls: Notifications bell with red badge & User avatar */}
      <div className="flex items-center gap-3">
        {/* Interactive Notifications Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900/80 transition-colors cursor-pointer"
            title="Notifications & Access Approvals"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className={`absolute top-1 right-1 min-w-4 h-4 px-1 text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-white shadow-xs ${
                pendingApprovalsCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
              }`}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0D1322] border border-[#1E293B] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in duration-200 text-slate-100">
              {/* Header */}
              <div className="px-4 py-3 bg-[#080D1A] border-b border-[#1E293B] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {unreadCount} new
                    </span>
                  )}
                  {pendingApprovalsCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5" />
                      {pendingApprovalsCount} approval required
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => notificationService.markAllAsRead()}
                    className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex border-b border-[#1E293B] px-3 pt-2 gap-1 bg-[#0B101D] text-xs overflow-x-auto">
                {getFilterButtons().map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setNotifFilter(tab.id)}
                    className={`pb-2 px-2.5 text-[11px] font-semibold transition-colors relative cursor-pointer whitespace-nowrap ${
                      notifFilter === tab.id
                        ? 'text-emerald-400 border-b-2 border-emerald-400'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Notification Items List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-[#162033]">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-300">No notifications in this view</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">All activities and approvals are up to date.</p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => {
                    const isApproval = notif.type === 'ACCESS_APPROVAL_REQUEST';
                    const isApproved = notif.approvalStatus === 'APPROVED' || notif.type === 'ACCESS_APPROVED';
                    const isRejected = notif.approvalStatus === 'REJECTED' || notif.type === 'ACCESS_REJECTED';
                    const isPending = isApproval && notif.approvalStatus === 'PENDING';

                    return (
                      <div
                        key={notif.id}
                        onClick={() => notificationService.markAsRead(notif.id)}
                        className={`p-3.5 transition-colors cursor-pointer text-xs ${
                          !notif.read ? 'bg-[#10182B]/60 hover:bg-[#141E36]' : 'bg-[#0D1322] hover:bg-[#10182B]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon Container */}
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              isPending
                                ? 'bg-amber-500/20 text-amber-400 ring-2 ring-amber-400/30'
                                : notif.type === 'DOC_SHARED'
                                ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                                : notif.type === 'DOC_ACCESSED'
                                ? 'bg-teal-500/20 text-teal-400 ring-1 ring-teal-500/30'
                                : notif.type === 'DOC_REVOKED'
                                ? 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30'
                                : notif.type === 'DOC_UPLOAD'
                                ? 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30'
                                : notif.type === 'USER_LOGIN'
                                ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                                : isApproved
                                ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                                : 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30'
                            }`}
                          >
                            {isPending ? (
                              <AlertCircle className="w-4 h-4" />
                            ) : notif.type === 'DOC_SHARED' ? (
                              <Share2 className="w-4 h-4" />
                            ) : notif.type === 'DOC_ACCESSED' ? (
                              <Eye className="w-4 h-4" />
                            ) : notif.type === 'DOC_REVOKED' ? (
                              <AlertCircle className="w-4 h-4" />
                            ) : notif.type === 'DOC_UPLOAD' ? (
                              <Upload className="w-4 h-4" />
                            ) : notif.type === 'USER_LOGIN' ? (
                              <Key className="w-4 h-4" />
                            ) : isApproved ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-bold text-white text-xs truncate">{notif.title}</p>
                              <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                                {new Date(notif.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{notif.message}</p>

                            {/* Requester details & inline actions for Access Approval Requests */}
                            {isApproval && (
                              <div className="mt-2.5 pt-2 border-t border-[#1E293B]">
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-2">
                                  <span className="font-medium text-slate-300">{notif.actorEmail}</span>
                                  <span>•</span>
                                  <span className="font-semibold text-emerald-400">
                                    {notif.actorRole === 'OWNER' ? 'Document Owner' : 'Viewer'}
                                  </span>
                                </div>

                                {isPending ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={(e) => handleApprove(notif.id, e)}
                                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                                    >
                                      <Check className="w-3 h-3 stroke-[3]" />
                                      Approve Access
                                    </button>
                                    <button
                                      onClick={(e) => handleReject(notif.id, e)}
                                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                      <X className="w-3 h-3" />
                                      Reject
                                    </button>
                                  </div>
                                ) : isApproved ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Access Granted
                                  </span>
                                ) : isRejected ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-md border border-rose-500/30">
                                    <X className="w-3 h-3" />
                                    Request Rejected
                                  </span>
                                ) : null}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-[#080D1A] border-t border-[#1E293B] flex items-center justify-between text-[11px]">
                <button
                  onClick={() => notificationService.clearAll()}
                  className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Clear history
                </button>
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => {
                      setNotifOpen(false);
                      navigate('/admin');
                    }}
                    className="font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    Go to Admin Dashboard →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile with interactive popover */}
        {user && (
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 pl-3 border-l border-slate-800/80 hover:opacity-90 transition-opacity cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 text-white flex items-center justify-center font-bold text-xs tracking-wider shrink-0 shadow-md">
                {getInitials(user.name)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white leading-tight">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-400 font-normal">
                  {roleLabel}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#0E1424] border border-[#1E293B] rounded-2xl shadow-2xl p-4 z-40 space-y-3 animate-in fade-in text-slate-200">
                <div className="pb-3 border-b border-[#1E293B]">
                  <p className="text-sm font-bold text-white leading-tight">{user.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{user.email}</p>
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {roleLabel}
                  </span>
                </div>

                {/* Last Login Info */}
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#080D1A] border border-[#161F33] text-xs">
                  <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">Last Login</span>
                    <span className="text-xs text-slate-200 font-mono mt-0.5 block">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : new Date().toLocaleString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                    </span>
                  </div>
                </div>

                {/* Sign Out Action Only */}
                <div className="pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer shadow-sm"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
