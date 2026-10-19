import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, Bell, Search, LogOut, Settings, UserCheck, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRoleLandingRoute } from '../../types';

interface NavbarProps {
  onToggleSidebar: () => void;
  pageTitle?: string;
  onSearch?: (term: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onSearch }) => {
  const { user, allUsers, switchUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

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
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input matching reference image */}
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search documents, users, or audit logs..."
            onChange={(e) => onSearch && onSearch(e.target.value)}
            className="w-full bg-slate-50/80 border border-slate-200 rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 transition-all"
          />
        </div>
      </div>

      {/* Right controls: Notifications bell with red badge & User avatar */}
      <div className="flex items-center gap-4">
        {/* Bell with red badge '3' as seen in screenshot */}
        <div className="relative cursor-pointer p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            3
          </span>
        </div>

        {/* User profile with interactive popover */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 pl-2 border-l border-slate-200 hover:opacity-85 transition-opacity cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-full bg-[#081B36] text-white flex items-center justify-center font-bold text-xs tracking-wider shrink-0 shadow-sm">
                {getInitials(user.name)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {user.name}
                </p>
                <p className="text-[11px] text-slate-500 font-normal">
                  {roleLabel}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-40 space-y-3 animate-in fade-in">
                <div className="pb-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
                  <p className="text-[11px] text-slate-500">{user.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {roleLabel}
                  </span>
                </div>

                {/* Quick Role Switcher for paired testing */}
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-blue-600" /> Switch Role:
                  </p>
                  <div className="space-y-1 text-xs">
                    {allUsers.filter((u) => u.id !== user.id).slice(0, 3).map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleSwitchUser(u.id)}
                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between text-slate-700 transition-colors cursor-pointer"
                      >
                        <span className="truncate">{u.name}</span>
                        <span className="text-[10px] text-blue-600 font-mono">
                          {u.role === 'ADMIN' ? 'Admin' : u.role === 'OWNER' ? 'Owner' : 'Viewer'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-500" />
                    Profile & Settings
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
