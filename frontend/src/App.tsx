import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { OwnerDashboardPage } from './pages/dashboard/OwnerDashboardPage';
import { DocumentLibraryPage } from './pages/documents/DocumentLibraryPage';
import { DocumentDetailPage } from './pages/documents/DocumentDetailPage';
import { SharedDocumentsPage } from './pages/documents/SharedDocumentsPage';
import { AuditTrailPage } from './pages/audit/AuditTrailPage';
import { SecurityCenterPage } from './pages/security/SecurityCenterPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { ProfileSettingsPage } from './pages/settings/ProfileSettingsPage';

import { getRoleLandingRoute } from './types';

// Role-based landing router
const RoleBasedLanding: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getRoleLandingRoute(user.role)} replace />;
};

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs">
        Initializing zero-trust session context...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Enterprise Dashboard Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<RoleBasedLanding />} />
              <Route path="dashboard" element={<OwnerDashboardPage />} />
              <Route path="documents" element={<DocumentLibraryPage />} />
              <Route path="documents/:id" element={<DocumentDetailPage />} />
              <Route path="shared" element={<SharedDocumentsPage />} />
              <Route path="audit" element={<AuditTrailPage />} />
              <Route path="security" element={<SecurityCenterPage />} />
              <Route path="admin" element={<AdminDashboardPage />} />
              <Route path="settings" element={<ProfileSettingsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
