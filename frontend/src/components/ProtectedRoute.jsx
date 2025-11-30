import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Asegúrate que la ruta sea correcta

function ProtectedRoute() {
  const { isAdmin } = useAuth(); // Obtiene el estado real desde el contexto

  if (!isAdmin) {
    // Si no es admin, redirige a la página de login
    return <Navigate to="/login" replace />;
  }

  // Si es admin, permite el acceso a las rutas anidadas (Outlet)
  return <Outlet />;
}

export default ProtectedRoute;