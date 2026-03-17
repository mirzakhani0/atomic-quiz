import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import bcrypt from 'bcryptjs';

interface AuthUser {
  username: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ADMIN_USERNAME = 'admin';
const HASHED_PASSWORD = '$2b$12$RV3m2A/Qn/AHjrXHlcbob.di4NFT5JPeVdoHbXpsJgt2htholWWWG';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('atomic_quiz_auth');
    if (stored === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    const isValidUser = username === ADMIN_USERNAME;
    const isValidPass = bcrypt.compareSync(password, HASHED_PASSWORD);
    
    if (isValidUser && isValidPass) {
      setIsAuthenticated(true);
      localStorage.setItem('atomic_quiz_auth', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('atomic_quiz_auth');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}