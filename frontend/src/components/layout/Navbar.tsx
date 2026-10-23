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
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'APPROVALS' | 'DOCS' | 'ACTIVITY'>('ALL');
  const [notifications, setNotifications] = useState<AdminNotification[]>(() =>
    notificationService.getNotifications()
  );

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    notificationService.fetchLiveNotifications();
    const unsubscribe = notificationService.subscribe(() => {
      setNotifications(notificationService.getNotifications());
    });
    return unsubscribe;
  }, []);

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
    if (notifFilter === 'APPROVALS') {
      return n.type === 'ACCESS_APPROVAL_REQUEST' || n.type === 'ACCESS_APPROVED' || n.type === 'ACCESS_REJECTED';
    }
    if (notifFilter === 'DOCS') {
      return n.type === 'DOC_UPLOAD';
    }
    if (notifFilter === 'ACTIVITY') {
      return n.type === 'USER_LOGIN' || n.type === 'VIEWER_ACTION' || n.type === 'OWNER_ACTION';
    }
    return true;
  });

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

  const handleSwitchUser = async (userId: string) => {
    const target = allUsers.find((u) => u.id === userId);
    if (target) {
      await switchUser(target.id);
      navigate(getRoleLandingRoute(target.role));
      setProfileOpen(false);
    }
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
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in duration-200">
              {/* Header */}
              <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                      {unreadCount} new
                    </span>
                  )}
                  {pendingApprovalsCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5" />
                      {pendingApprovalsCount} approval required
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => notificationService.markAllAsRead()}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex border-b border-slate-100 px-3 pt-2 gap-1 bg-white text-xs">
                {(['ALL', 'APPROVALS', 'DOCS', 'ACTIVITY'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setNotifFilter(tab)}
                    className={`pb-2 px-2.5 text-[11px] font-semibold transition-colors relative cursor-pointer ${
                      notifFilter === tab
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab === 'ALL'
                      ? 'All'
                      : tab === 'APPROVALS'
                      ? `Approvals ${pendingApprovalsCount > 0 ? `(${pendingApprovalsCount})` : ''}`
                      : tab === 'DOCS'
                      ? 'Docs'
                      : 'Activity'}
                  </button>
                ))}
              </div>

              {/* Notification Items List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-600">No notifications in this view</p>
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
                          !notif.read ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon Container */}
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              isPending
                                ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400/40'
                                : notif.type === 'DOC_UPLOAD'
                                ? 'bg-blue-100 text-blue-700'
                                : notif.type === 'USER_LOGIN'
                                ? 'bg-emerald-100 text-emerald-700'
                                : isApproved
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {isPending ? (
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
                              <p className="font-bold text-slate-900 text-xs truncate">{notif.title}</p>
                              <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                                {new Date(notif.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{notif.message}</p>

                            {/* Requester details & inline actions for Access Approval Requests */}
                            {isApproval && (
                              <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-2">
                                  <span className="font-medium text-slate-700">{notif.actorEmail}</span>
                                  <span>•</span>
                                  <span className="font-semibold text-blue-600">
                                    {notif.actorRole === 'OWNER' ? 'Document Owner' : 'Viewer'}
                                  </span>
                                </div>

                                {isPending ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={(e) => handleApprove(notif.id, e)}
                                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                    >
                                      <Check className="w-3 h-3 stroke-[3]" />
                                      Approve Access
                                    </button>
                                    <button
                                      onClick={(e) => handleReject(notif.id, e)}
                                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                      <X className="w-3 h-3" />
                                      Reject
                                    </button>
                                  </div>
                                ) : isApproved ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Access Granted
                                  </span>
                                ) : isRejected ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
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
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <button
                  onClick={() => notificationService.clearAll()}
                  className="text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Clear history
                </button>
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => {
                      setNotifOpen(false);
                      navigate('/admin');
                    }}
                    className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
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
              <div className="absolute right-0 mt-2 w-64 bg-[#0E1424] border border-slate-800 rounded-2xl shadow-xl p-3 z-40 space-y-3 animate-in fade-in text-slate-200">
                <div className="pb-2.5 border-b border-slate-800">
                  <p className="text-xs font-bold text-white leading-tight">{user.name}</p>
                  <p className="text-[11px] text-slate-400">{user.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {roleLabel}
                  </span>
                </div>

                {/* Quick Role Switcher for paired testing */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-emerald-400" /> Switch Role:
                  </p>
                  <div className="space-y-1 text-xs">
                    {allUsers.filter((u) => u.id !== user.id).slice(0, 3).map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleSwitchUser(u.id)}
                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-800/80 flex items-center justify-between text-slate-300 transition-colors cursor-pointer"
                      >
                        <span className="truncate">{u.name}</span>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          {u.role === 'ADMIN' ? 'Admin' : u.role === 'OWNER' ? 'Owner' : 'Viewer'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800/80 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    Profile & Settings
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
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
