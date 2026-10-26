import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService, RegisterResult } from '../services/authService';
import { resetAllDemoData } from '../services/storage';
import { firebaseService } from '../services/firebaseService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  allUsers: User[];
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User>;
  register: (params: {
    name: string;
    email: string;
    phone: string;
    password: string;
    department?: string;
    emailVerificationToken: string;
    inviteToken?: string;
    role?: string;
  }) => Promise<RegisterResult>;
  approveUser: (userId: string) => Promise<User>;
  rejectUser: (userId: string) => Promise<void>;
  updateUserStatus: (userId: string, status: string) => Promise<User>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  resetDemo: () => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUsers = async () => {
    try {
      const users = await authService.getAllUsers();
      setAllUsers(users);
    } catch (err) {
      console.error('Error refreshing users', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const users = await authService.getAllUsers();
        setAllUsers(users);
        const current = await authService.getCurrentUser();
        // Zero-Trust Administrator Guard:
        // Direct / unverified URL navigation to admin must not inherit background session without active tab verification
        if (current && current.role === 'ADMIN') {
          const hasAdminSession = typeof window !== 'undefined' && sessionStorage.getItem('trustvault_admin_session') === 'active';
          if (!hasAdminSession) {
            setUser(null);
            return;
          }
        }
        setUser(current);
      } catch (err) {
        console.error('Failed to initialize auth state', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Listen for real-time Firestore user changes
  useEffect(() => {
    const unsubscribe = firebaseService.onUsersChange((firestoreUsers) => {
      if (firestoreUsers && firestoreUsers.length > 0) {
        setAllUsers((prev) => {
          const map = new Map<string, User>();
          prev.forEach((u) => map.set(u.id, u));
          firestoreUsers.forEach((fu) => map.set(fu.id, { ...map.get(fu.id), ...fu }));
          return Array.from(map.values());
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string, rememberMe?: boolean): Promise<User> => {
    const loggedUser = await authService.login(email, password, rememberMe);
    if (loggedUser.role === 'ADMIN') {
      sessionStorage.setItem('trustvault_admin_session', 'active');
    } else {
      sessionStorage.removeItem('trustvault_admin_session');
    }
    setUser(loggedUser);
    // Refresh directory asynchronously in the background so redirect is instantaneous
    refreshUsers().catch(console.error);
    return loggedUser;
  };

  const register = async (params: {
    name: string;
    email: string;
    phone: string;
    password: string;
    department?: string;
    emailVerificationToken: string;
    inviteToken?: string;
    role?: string;
  }): Promise<RegisterResult> => {
    const result = await authService.register(params);
    await refreshUsers();
    return result;
  };

  const approveUser = async (userId: string): Promise<User> => {
    if (!user) throw new Error('Must be authenticated to approve users');
    const approved = await authService.approveUser(userId, user);
    await refreshUsers();
    return approved;
  };

  const rejectUser = async (userId: string): Promise<void> => {
    if (!user) throw new Error('Must be authenticated to reject users');
    await authService.rejectUser(userId, user.name);
    await refreshUsers();
  };

  const updateUserStatus = async (userId: string, newStatus: string): Promise<User> => {
    if (!user) throw new Error('Must be authenticated');
    const updated = await authService.updateUserStatus(userId, newStatus, user.name);
    await refreshUsers();
    return updated;
  };

  const logout = async () => {
    sessionStorage.removeItem('trustvault_admin_session');
    await authService.logout();
    setUser(null);
  };

  const switchUser = async (userId: string) => {
    const target = await authService.switchUser(userId);
    if (target.role === 'ADMIN') {
      sessionStorage.setItem('trustvault_admin_session', 'active');
    } else {
      sessionStorage.removeItem('trustvault_admin_session');
    }
    setUser(target);
    await refreshUsers();
  };

  const resetDemo = async () => {
    sessionStorage.removeItem('trustvault_admin_session');
    resetAllDemoData();
    await refreshUsers();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        allUsers,
        login,
        register,
        approveUser,
        rejectUser,
        updateUserStatus,
        logout,
        switchUser,
        resetDemo,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
