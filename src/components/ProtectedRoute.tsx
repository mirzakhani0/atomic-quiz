import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, currentUser } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !currentUser) {
    // Redirigir al login pero guardando la ubicación actual para volver después
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
