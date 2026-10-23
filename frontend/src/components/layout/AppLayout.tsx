import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname: string): string => {
    if (pathname.startsWith('/admin')) return 'Admin Dashboard';
    if (pathname.startsWith('/dashboard')) return 'Enterprise Security Dashboard';
    if (pathname.startsWith('/documents/')) return 'Document Security & Access';
    if (pathname.startsWith('/documents')) return 'Document Library';
    if (pathname.startsWith('/shared')) return 'Shared Documents & Grants';
    if (pathname.startsWith('/audit')) return 'Tamper-Evident Audit Trail';
    if (pathname.startsWith('/security')) return 'Security Center & Threat Model';
    if (pathname.startsWith('/settings')) return 'Profile & Security Settings';
    return 'TrustVault';
  };

  return (
    <div className="min-h-screen bg-[#070A13] text-slate-100 flex selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Navbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          pageTitle={getPageTitle(location.pathname)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1700px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
