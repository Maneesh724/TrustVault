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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Navbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          pageTitle={getPageTitle(location.pathname)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
