import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [authTokens, setAuthTokens] = useState(() => 
        localStorage.getItem('authTokens')
            ? JSON.parse(localStorage.getItem('authTokens'))
            : null
    );
    const [user, setUser] = useState(() => 
        localStorage.getItem('authTokens')
            ? { username: 'Admin' } // Puedes decodificar el JWT aquí para obtener el user
            : null
    );
    const [isAdmin, setIsAdmin] = useState(() => !!localStorage.getItem('authTokens'));

    const login = async (username, password) => {
        const response = await fetch('/api/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (response.ok) {
            setAuthTokens(data);
            // Aquí podrías decodificar 'data.access' para obtener info del usuario
            setUser({ username: username }); 
            setIsAdmin(true);
            localStorage.setItem('authTokens', JSON.stringify(data));
            return true;
        } else {
            console.error("Error de login:", data);
            return false;
        }
    };

    const logout = () => {
        setAuthTokens(null);
        setUser(null);
        setIsAdmin(false);
        localStorage.removeItem('authTokens');
    };

    // Función para agregar el token a todas las peticiones (muy importante)
    // Deberías usar esto en AdminProducts.jsx en lugar de fetch simple,
    // o configurar un interceptor de axios.
    const authFetch = async (url, options = {}) => {
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${authTokens.access}`
        };
        return fetch(url, { ...options, headers });
    };


    const contextData = {
        user,
        isAdmin,
        login,
        logout,
        authFetch // Para usar en peticiones de admin
    };

    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    );
};