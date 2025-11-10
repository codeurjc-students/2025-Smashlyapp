import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  redirectTo
}) => {
  const { user, loading } = useAuth();

  // Mostrar un loader mientras se verifica la autenticación
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        Cargando...
      </div>
    );
  }

  // Si no hay usuario, redirigir a página de error de no autorizado
  if (!user) {
    const destination = redirectTo || '/error?type=unauthorized';
    return <Navigate to={destination} replace />;
  }

  // Si requiere admin pero el usuario no es admin, mostrar error 403
  if (requireAdmin && user.role !== 'admin') {
    const destination = redirectTo || '/error?type=403';
    return <Navigate to={destination} replace />;
  }

  // Si todo está bien, mostrar el contenido protegido
  return <>{children}</>;
};

export default ProtectedRoute;
