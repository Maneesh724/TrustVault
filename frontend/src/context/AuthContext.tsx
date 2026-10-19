import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService, RegisterResult } from '../services/authService';
import { resetAllDemoData } from '../services/storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  allUsers: User[];
  login: (email: string, password?: string) => Promise<User>;
  register: (params: {
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    password: string;
    department?: string;
    otpVerificationToken: string;
    adminProvisioningToken?: string;
  }) => Promise<RegisterResult>;
  approveUser: (userId: string) => Promise<User>;
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
      const current = await authService.getCurrentUser();
      setUser(current);
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
        setUser(current);
      } catch (err) {
        console.error('Failed to initialize auth state', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email: string): Promise<User> => {
    const loggedUser = await authService.login(email);
    setUser(loggedUser);
    await refreshUsers();
    return loggedUser;
  };

  const register = async (params: {
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    password: string;
    department?: string;
    otpVerificationToken: string;
    adminProvisioningToken?: string;
  }): Promise<RegisterResult> => {
    const result = await authService.register(params);
    // Note: User status is PENDING_APPROVAL, so we do not log them in automatically
    await refreshUsers();
    return result;
  };

  const approveUser = async (userId: string): Promise<User> => {
    if (!user) throw new Error('Must be authenticated to approve users');
    const approved = await authService.approveUser(userId, user);
    await refreshUsers();
    return approved;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const switchUser = async (userId: string) => {
    const target = await authService.switchUser(userId);
    setUser(target);
    await refreshUsers();
  };

  const resetDemo = async () => {
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
