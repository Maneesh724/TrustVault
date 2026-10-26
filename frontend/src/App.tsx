import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';

// Public & Auth Pages
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterChooseRolePage } from './pages/auth/RegisterChooseRolePage';
import { RegisterRolePage } from './pages/auth/RegisterRolePage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { PendingApprovalPage } from './pages/auth/PendingApprovalPage';
import { AccessDeniedPage } from './pages/auth/AccessDeniedPage';
import { NotFoundPage } from './pages/auth/NotFoundPage';

// Dashboards & Workspaces
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { OwnerDashboardPage } from './pages/dashboard/OwnerDashboardPage';
import { ViewerDashboardPage } from './pages/viewer/ViewerDashboardPage';

// Feature Pages
import { DocumentLibraryPage } from './pages/documents/DocumentLibraryPage';
import { DocumentDetailPage } from './pages/documents/DocumentDetailPage';
import { SharedDocumentsPage } from './pages/documents/SharedDocumentsPage';
import { OwnerSharingHistoryPage } from './pages/documents/OwnerSharingHistoryPage';
import { AuditTrailPage } from './pages/audit/AuditTrailPage';
import { SecurityCenterPage } from './pages/security/SecurityCenterPage';
import { ProfileSettingsPage } from './pages/settings/ProfileSettingsPage';
import { AiAssistantPage } from './pages/ai/AiAssistantPage';

import { getRoleLandingRoute, UserRole } from './types';

// Role-based landing router
const RoleBasedLanding: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <LandingPage />;
  return <Navigate to={getRoleLandingRoute(user.role, user.status)} replace />;
};

// Protected Route Guard with Role & Account Status Enforcement
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A13] flex items-center justify-center text-slate-400 font-mono text-xs">
        Validating zero-trust session...
      </div>
    );
  }

  // Zero-Trust Admin Route Guard:
  // Direct URL navigation to /admin/* without verified active admin credentials MUST show Access Denied Error
  if (allowedRoles && allowedRoles.includes('ADMIN')) {
    const hasAdminSession = typeof window !== 'undefined' && sessionStorage.getItem('trustvault_admin_session') === 'active';
    if (!user || user.role !== 'ADMIN' || !hasAdminSession) {
      return (
        <Navigate
          to="/access-denied"
          replace
          state={{
            from: location.pathname,
            reason: 'ADMIN_UNAUTHORIZED',
            message: 'Direct Access Denied: Administrator Dashboard is protected by Zero-Trust Role Guards. Direct URL access is prohibited without administrator authentication.',
          }}
        />
      );
    }
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Account status guards
  if (user.status === 'PENDING_APPROVAL') {
    return <Navigate to="/owner/pending-approval" replace />;
  }

  if (user.status === 'SUSPENDED' || user.status === 'REJECTED') {
    return (
      <Navigate
        to="/access-denied"
        replace
        state={{
          from: location.pathname,
          reason: 'ACCOUNT_SUSPENDED',
          message: 'Access Denied: Your account has been suspended or rejected by an Administrator.',
        }}
      />
    );
  }

  // Role authorization guard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to="/access-denied"
        replace
        state={{
          from: location.pathname,
          reason: 'ROLE_UNAUTHORIZED',
          message: `Zero-Trust Access Denied: Your account role (${user.role}) is unauthorized to access ${location.pathname}.`,
        }}
      />
    );
  }

  return <>{children}</>;
};

// Dynamic Browser Tab Title Handler with branding and descriptive metadata
const PageTitleHandler: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = 'TrustVault | Secure Documents. Trusted Access.';

    if (path === '/') title = 'TrustVault | Zero-Trust Enterprise Document Vault';
    else if (path === '/login') title = 'TrustVault | Secure Sign In';
    else if (path === '/register') title = 'TrustVault | Choose Account Role';
    else if (path === '/register/owner') title = 'TrustVault | Register Document Owner';
    else if (path === '/register/viewer') title = 'TrustVault | Register Viewer';
    else if (path === '/verify-email') title = 'TrustVault | Verify Corporate Email';
    else if (path === '/forgot-password') title = 'TrustVault | Password Recovery';
    else if (path.startsWith('/reset-password')) title = 'TrustVault | Reset Password';
    else if (path === '/owner/pending-approval') title = 'TrustVault | Pending Administrator Approval';
    // Admin routes
    else if (path === '/admin/dashboard' || path === '/admin') title = 'TrustVault | Admin Dashboard';
    else if (path === '/admin/approvals') title = 'TrustVault | Owner Approvals';
    else if (path === '/admin/users') title = 'TrustVault | User Management Directory';
    else if (path === '/admin/documents') title = 'TrustVault | Global Document Oversight';
    else if (path === '/admin/audit-logs') title = 'TrustVault | Security Audit Logs';
    else if (path === '/admin/security') title = 'TrustVault | Security Events & Policies';
    else if (path === '/admin/settings') title = 'TrustVault | System Settings';
    // Owner routes
    else if (path === '/owner/dashboard' || path === '/owner') title = 'TrustVault | Owner Dashboard';
    else if (path === '/owner/documents') title = 'TrustVault | My Documents';
    else if (path.startsWith('/owner/sharing')) title = 'TrustVault | Document Sharing';
    else if (path === '/owner/access-history') title = 'TrustVault | Access History';
    else if (path === '/owner/settings') title = 'TrustVault | Owner Settings';
    // Viewer routes
    else if (path === '/viewer/dashboard' || path === '/viewer') title = 'TrustVault | Viewer Dashboard';
    else if (path === '/viewer/shared') title = 'TrustVault | Shared With Me';
    else if (path === '/viewer/profile') title = 'TrustVault | Profile & Security';

    document.title = title;
  }, [location.pathname]);

  return null;
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <PageTitleHandler />
          <Routes>
            {/* ========================================================= */}
            {/* 1. PUBLIC ROUTES                                          */}
            {/* ========================================================= */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterChooseRolePage />} />
            <Route path="/register/owner" element={<RegisterRolePage role="OWNER" />} />
            <Route path="/register/viewer" element={<RegisterRolePage role="VIEWER" />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/owner/pending-approval" element={<PendingApprovalPage />} />
            <Route path="/access-denied" element={<AccessDeniedPage />} />

            {/* ========================================================= */}
            {/* 2. ADMIN PROTECTED ROUTES                                 */}
            {/* ========================================================= */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="approvals" element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminDashboardPage />} />
              <Route path="documents" element={<DocumentLibraryPage />} />
              <Route path="audit-logs" element={<AuditTrailPage />} />
              <Route path="security" element={<SecurityCenterPage />} />
              <Route path="settings" element={<ProfileSettingsPage />} />
              <Route path="profile" element={<ProfileSettingsPage />} />
              <Route path="ai" element={<AiAssistantPage />} />
            </Route>

            {/* ========================================================= */}
            {/* 3. DOCUMENT OWNER PROTECTED ROUTES                        */}
            {/* ========================================================= */}
            <Route
              path="/owner"
              element={
                <ProtectedRoute allowedRoles={['OWNER']}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/owner/dashboard" replace />} />
              <Route path="dashboard" element={<OwnerDashboardPage />} />
              <Route path="documents" element={<DocumentLibraryPage />} />
              <Route path="documents/upload" element={<DocumentLibraryPage />} />
              <Route path="documents/:documentId" element={<DocumentDetailPage />} />
              <Route path="folders" element={<OwnerDashboardPage />} />
              <Route path="sharing" element={<OwnerSharingHistoryPage />} />
              <Route path="sharing/new" element={<OwnerSharingHistoryPage />} />
              <Route path="sharing/:shareId" element={<OwnerSharingHistoryPage />} />
              <Route path="access-history" element={<OwnerSharingHistoryPage />} />
              <Route path="notifications" element={<OwnerDashboardPage />} />
              <Route path="profile" element={<ProfileSettingsPage />} />
              <Route path="settings" element={<ProfileSettingsPage />} />
              <Route path="ai" element={<AiAssistantPage />} />
            </Route>

            {/* ========================================================= */}
            {/* 4. VIEWER PROTECTED ROUTES                                */}
            {/* ========================================================= */}
            <Route
              path="/viewer"
              element={
                <ProtectedRoute allowedRoles={['VIEWER']}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/viewer/dashboard" replace />} />
              <Route path="dashboard" element={<ViewerDashboardPage />} />
              <Route path="shared" element={<SharedDocumentsPage />} />
              <Route path="shared/:shareId" element={<SharedDocumentsPage />} />
              <Route path="documents/:documentId" element={<DocumentDetailPage />} />
              <Route path="recent" element={<ViewerDashboardPage />} />
              <Route path="notifications" element={<ViewerDashboardPage />} />
              <Route path="activity" element={<SharedDocumentsPage />} />
              <Route path="profile" element={<ProfileSettingsPage />} />
            </Route>

            {/* ========================================================= */}
            {/* 5. LEGACY / SHORTCUT REDIRECT COMPATIBILITY               */}
            {/* ========================================================= */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<RoleBasedLanding />} />
            </Route>
            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DocumentLibraryPage />} />
              <Route path=":id" element={<DocumentDetailPage />} />
            </Route>
            <Route
              path="/shared"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<SharedDocumentsPage />} />
            </Route>
            <Route
              path="/audit"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AuditTrailPage />} />
            </Route>
            <Route
              path="/security"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<SecurityCenterPage />} />
            </Route>
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ProfileSettingsPage />} />
            </Route>

            {/* ========================================================= */}
            {/* 6. CATCH-ALL 404 ROUTE                                    */}
            {/* ========================================================= */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
