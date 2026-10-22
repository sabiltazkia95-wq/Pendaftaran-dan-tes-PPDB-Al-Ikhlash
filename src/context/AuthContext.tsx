import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getStoredToken, setStoredToken, removeStoredToken, User, StudentProfileData, RegistrationData } from '../lib/api.ts';

interface AuthContextType {
  user: User | null;
  studentProfile: StudentProfileData | null;
  registration: RegistrationData | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  switchAccount: (role: 'student' | 'committee' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfileData | null>(null);
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setStudentProfile(null);
      setRegistration(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      setStudentProfile(data.student_profile);
      setRegistration(data.registration);
    } catch (err) {
      console.warn('Failed to restore session:', err);
      removeStoredToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = (token: string, loggedInUser: User) => {
    setStoredToken(token);
    setUser(loggedInUser);
    fetchCurrentUser();
  };

  const logout = () => {
    removeStoredToken();
    setUser(null);
    setStudentProfile(null);
    setRegistration(null);
  };

  const refreshUserData = async () => {
    await fetchCurrentUser();
  };

  const switchAccount = async (role: 'student' | 'committee' | 'admin') => {
    setIsLoading(true);
    try {
      let email = 'santri@alikhlash.sch.id';
      let password = 'santri123';
      if (role === 'committee') {
        email = 'panitia@alikhlash.sch.id';
        password = 'panitia123';
      } else if (role === 'admin') {
        email = 'admin@alikhlash.sch.id';
        password = 'admin123';
      }

      const res = await api.login({ email, password });
      login(res.token, res.user);
    } catch (err) {
      console.error('Switch account failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        studentProfile,
        registration,
        isLoading,
        login,
        logout,
        refreshUserData,
        switchAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
