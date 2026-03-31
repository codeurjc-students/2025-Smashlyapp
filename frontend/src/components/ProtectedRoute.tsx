import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  redirectTo,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen text='Verificando sesión...' />;
  }

  // Si no hay usuario, redirigir a página de error de no autorizado
  if (!user) {
    const destination = redirectTo || '/error?type=unauthorized';
    return <Navigate to={destination} replace />;
  }

  // Si requiere admin pero el usuario no es admin, mostrar error 403
  // Comparar case-insensitive para permitir "admin", "Admin", "ADMIN", etc.
  if (requireAdmin && user.role?.toLowerCase() !== 'admin') {
    console.warn(
      `🚫 Admin access denied for user:`,
      { userId: user.id, userRole: user.role, expectedRole: 'admin' }
    );
    const destination = redirectTo || '/error?type=403';
    return <Navigate to={destination} replace />;
  }

  // Si todo está bien, mostrar el contenido protegido
  return <>{children}</>;
};

export default ProtectedRoute;
