import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import bcrypt from 'bcryptjs';
import type { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'AtomicQuiz2026!';

const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbykSmkmmOjui8KYyiGDHERpYzMhZ75o6UcIzA0EYJ3ZN1sNISmowKXlq_uADg0tGXZU/exec';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('atomic_quiz_auth');
    const storedUser = localStorage.getItem('atomic_quiz_user');
    
    if (stored === 'true' && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setIsAuthenticated(user.role === 'admin');
      } catch {
        localStorage.removeItem('atomic_quiz_auth');
        localStorage.removeItem('atomic_quiz_user');
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const adminUser: User = { username: 'admin', role: 'admin', nombre: 'Administrador' };
      setCurrentUser(adminUser);
      setIsAuthenticated(true);
      localStorage.setItem('atomic_quiz_auth', 'true');
      localStorage.setItem('atomic_quiz_user', JSON.stringify(adminUser));
      return { success: true };
    }

    try {
      const url = `${APPSCRIPT_URL}?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      const response = await fetch(url, { method: 'GET', mode: 'cors', cache: 'no-cache' });
      const text = await response.text();
      
      let result: { success: boolean; message?: string; user?: User };
      try {
        result = JSON.parse(text);
      } catch {
        return { success: false, message: 'Error de conexión' };
      }

      if (result.success && result.user) {
        const userActive = result.user.active;
        const isActive = userActive === true || userActive === 'TRUE' || userActive === 'true' || userActive === '1' || userActive === 1;
        
        if (!isActive) {
          return { success: false, message: 'Tu cuenta está pendiente de aprobación. Un administrador debe activar tu acceso.' };
        }
        
        setCurrentUser(result.user);
        setIsAuthenticated(result.user.role === 'admin');
        localStorage.setItem('atomic_quiz_auth', 'true');
        localStorage.setItem('atomic_quiz_user', JSON.stringify(result.user));
        return { success: true };
      }

      if (result.message?.toLowerCase().includes('inactive') || result.message?.toLowerCase().includes('pendiente') || result.message?.toLowerCase().includes('activo')) {
        return { success: false, message: 'Tu cuenta está pendiente de aprobación. Un administrador debe activar tu acceso.' };
      }

      return { success: false, message: result.message || 'Usuario o contraseña incorrectos' };
    } catch (error) {
      return { success: false, message: 'Error de conexión. Intenta de nuevo.' };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('atomic_quiz_auth');
    localStorage.removeItem('atomic_quiz_user');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, login, logout }}>
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
