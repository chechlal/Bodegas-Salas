import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ adminOnly = false }) {
  const { user, isStaff } = useAuth();

  // If not logged in, go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If Admin Only route and user is not Staff
  if (adminOnly && !isStaff) {
      // Redirect to their allowed area
      return <Navigate to="/catalogo" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
