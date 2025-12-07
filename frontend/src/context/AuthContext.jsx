import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    if (token) {
      const decoded = parseJwt(token);
      if (decoded) {
        setUser({ 
          username: decoded.username, 
          role: decoded.role 
        });
      }
    }
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/token/', { // https://bodegas-salas-api.onrender.com/api/token/
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access);
        setToken(data.access);
        return true; 
      } else {
        return false;
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const authFetch = async (url, options = {}) => {
    const finalOptions = { ...options };
    const headers = { ...options.headers };

    // 🚫 No forzar Content-Type si body es FormData (esto es CLAVE)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    // Token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    finalOptions.headers = headers;

    const response = await fetch(`http://127.0.0.1:8000/${url}`, finalOptions); //https://bodegas-salas-api.onrender.com

    if (response.status === 401) {
      logout();
      window.location.href = '/login';
    }

    return response;
  };

  // --- CORRECCIÓN CLAVE: Calculamos isAdmin ---
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ 
        user, 
        isAdmin, // <--- AGREGADO: Ahora el menú sabrá si eres admin
        login, 
        logout, 
        authFetch, 
        isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
}