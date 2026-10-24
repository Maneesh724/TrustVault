import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Home,
  FileText,
  Key,
  Clock,
  Settings,
  ShieldCheck,
  LogOut,
  Folder,
  Share2,
  Bell,
  Users,
  UserCheck,
  UserCog,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, allUsers, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const pendingCount = allUsers.filter((u) => u.status === 'PENDING_APPROVAL').length;
  const notifCount = notificationService.getNotifications().filter((n) => !n.read).length;

  // Exact navigation items matching the user-uploaded screenshots & specifications
  const getNavItems = () => {
    if (user?.role === 'ADMIN') {
      return [
        { name: 'Dashboard', path: '/admin/dashboard', icon: Home },
        { name: 'Owner Approvals', path: '/admin/approvals', icon: UserCheck, badge: pendingCount > 0 ? pendingCount : 2, badgeColor: 'bg-rose-500' },
        { name: 'User Management', path: '/admin/users', icon: Users },
        { name: 'Document Oversight', path: '/admin/documents', icon: FileText },
        { name: 'Audit Logs', path: '/admin/audit-logs', icon: Clock },
        { name: 'Security Events', path: '/admin/security', icon: ShieldCheck },
        { name: 'System Settings', path: '/admin/settings', icon: Settings },
      ];
    }
    if (user?.role === 'OWNER') {
      return [
        { name: 'Dashboard', path: '/owner/dashboard', icon: Home },
        { name: 'My Documents', path: '/owner/documents', icon: FileText },
        { name: 'Sharing History', path: '/owner/access-history', icon: Clock },
        { name: 'Settings', path: '/owner/settings', icon: Settings },
      ];
    }
    // VIEWER
    return [
      { name: 'Dashboard', path: '/viewer/dashboard', icon: Home },
      { name: 'Shared With Me', path: '/viewer/shared', icon: FileText },
      { name: 'Profile & Security', path: '/viewer/profile', icon: UserCog },
    ];
  };

  const navItems = getNavItems();

  const brandSubtitle =
    user?.role === 'ADMIN'
      ? 'Secure Documents. Trusted Access.'
      : 'Your Documents. Your Control.';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#070A13] text-slate-300 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 border-r border-[#13192B] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Brand header matching screenshot */}
          <Link to="/" className="h-18 px-5 border-b border-[#13192B] flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-500/20 shrink-0 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight flex items-center">
                Trust<span className="text-emerald-400">Vault</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal block leading-tight">
                {brandSubtitle}
              </span>
            </div>
          </Link>

          {/* Navigation Section */}
          <div className="px-3 py-4 space-y-1.5 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                      isActive
                        ? 'bg-[#0E2822] text-[#10B981] border border-[#10B981]/30 shadow-sm shadow-emerald-950/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`min-w-4 h-4 px-1.5 text-[10px] font-bold text-white rounded-full flex items-center justify-center ${
                        item.badgeColor || 'bg-rose-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Footer Area with subtle wave line & Logout */}
        <div className="p-4 border-t border-[#13192B] bg-[#070A13]">
          {/* Subtle decorative wave text for Owner */}
          {user?.role === 'OWNER' && (
            <div className="mb-4 px-2 text-center">
              <div className="h-6 w-full flex items-center justify-center opacity-40 mb-1">
                <svg viewBox="0 0 100 20" className="w-full h-full text-emerald-500 fill-none stroke-current stroke-1">
                  <path d="M0 10 Q 25 0, 50 10 T 100 10" />
                </svg>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Secure Sharing.<br />Complete Control.</p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
