import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';

// Public & Auth Pages
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A13] flex items-center justify-center text-slate-400 font-mono text-xs">
        Validating zero-trust session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Account status guards
  if (user.status === 'PENDING_APPROVAL') {
    return <Navigate to="/owner/pending-approval" replace />;
  }

  if (user.status === 'SUSPENDED' || user.status === 'REJECTED') {
    return <Navigate to="/access-denied" replace />;
  }

  // Role authorization guard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* ========================================================= */}
            {/* 1. PUBLIC ROUTES                                          */}
            {/* ========================================================= */}
            <Route path="/" element={<RoleBasedLanding />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Navigate to="/register/owner" replace />} />
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
              <Route path="sharing" element={<SharedDocumentsPage />} />
              <Route path="sharing/new" element={<SharedDocumentsPage />} />
              <Route path="sharing/:shareId" element={<SharedDocumentsPage />} />
              <Route path="access-history" element={<AuditTrailPage />} />
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
              <Route path="shared" element={<ViewerDashboardPage />} />
              <Route path="shared/:shareId" element={<ViewerDashboardPage />} />
              <Route path="documents/:documentId" element={<DocumentDetailPage />} />
              <Route path="recent" element={<ViewerDashboardPage />} />
              <Route path="notifications" element={<ViewerDashboardPage />} />
              <Route path="activity" element={<AuditTrailPage />} />
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
