import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Shield,
  Home,
  Users,
  FileText,
  Key,
  Clock,
  Settings,
  ShieldCheck,
  LogOut,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRoleLandingRoute } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, allUsers, switchUser, resetDemo, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSwitchUser = async (targetId: string) => {
    const target = allUsers.find((u) => u.id === targetId);
    if (target) {
      await switchUser(target.id);
      navigate(getRoleLandingRoute(target.role));
      onClose();
    }
  };

  // Dynamic navigation items based on assigned role
  const getNavItems = () => {
    if (user?.role === 'ADMIN') {
      return [
        { name: 'Dashboard', path: '/admin', icon: Home },
        { name: 'Users', path: '/admin#users', icon: Users },
        { name: 'Documents', path: '/documents', icon: FileText },
        { name: 'Audit Log', path: '/audit', icon: Clock },
        { name: 'Security Monitor', path: '/security', icon: ShieldCheck },
        { name: 'Settings', path: '/settings', icon: Settings },
      ];
    }
    if (user?.role === 'OWNER') {
      return [
        { name: 'Dashboard', path: '/dashboard', icon: Home },
        { name: 'Documents', path: '/documents', icon: FileText },
        { name: 'Shared With Me', path: '/shared', icon: Key },
        { name: 'Audit Log', path: '/audit', icon: Clock },
        { name: 'Settings', path: '/settings', icon: Settings },
      ];
    }
    // VIEWER
    return [
      { name: 'Shared Documents', path: '/shared', icon: FileText },
      { name: 'Settings', path: '/settings', icon: Settings },
    ];
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#081B36] text-slate-300 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand header matching screenshot */}
          <div className="h-16 px-6 border-b border-slate-800/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Shield className="w-5 h-5 fill-white/20" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">TrustVault</span>
          </div>

          {/* Navigation Section */}
          <div className="px-3.5 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-[#1D68F2] text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Clean Bottom User Profile & Sign Out (No extra icons/role switcher) */}
        {user && (
          <div className="p-4 border-t border-slate-800/80 bg-[#06152B] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">{user.name}</p>
                <p className="text-[11px] text-blue-400 truncate capitalize font-medium">
                  {user.role === 'ADMIN' ? 'Administrator' : user.role === 'OWNER' ? 'Document Owner' : 'Viewer'}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
