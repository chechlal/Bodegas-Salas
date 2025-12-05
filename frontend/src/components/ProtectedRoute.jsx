import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ requiredRole }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Si se pide un rol y el usuario no lo tiene, lo mandamos al inicio
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" />; // O a una página de "Acceso Denegado"
  }

  return <Outlet />;
};

export default ProtectedRoute;