import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // Ya no necesitas Navigate aquí
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// --- CONTEXTO ---
import { AuthProvider } from "./context/AuthContext"; // <-- 1. Importa el Provider

// --- COMPONENTES PRINCIPALES ---
import Menu from "./components/Menu";
import ProtectedRoute from "./components/ProtectedRoute"; // <-- 2. Importa el Guardián

// --- PÁGINAS ---
import Home from "./pages/Home";
import VistaPrincipalCatalogo from "./pages/VistaPrincipalCatalogo";
import AdminProducts from "./components/AdminProducts";
import Contacto from "./pages/Contacto";
import Login from "./components/Login"; // <-- 3. Importa la página de Login
import VistaDeHistorial from "./pages/VistaDeHistorial"; // <-- 4. Importa la página de Historial

function App() {
  const [theme, setTheme] = useState('light');

  // 5. El usuario hard-coded se elimina. AuthContext lo manejará.
  // const user = { ... }; // (ELIMINADO)

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
      <Router>
        <AuthProvider>
          <Menu theme={theme} toggleTheme={toggleTheme} />
          
          <div className="container-fluid p-0">
            <Routes>
              {/* --- RUTAS PÚBLICAS (Solo lo que ve un extraño) --- */}
              <Route path="/" element={<Home />} />
              <Route path="/contacto" element={<Contacto />} />
              <Route path="/login" element={<Login />} />

              {/* --- RUTAS PRIVADAS (Requieren Login) --- */}
              
              {/* Rutas Solo Admin */}
              <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
                <Route path="/admin-productos" element={<AdminProducts theme={theme} />} />
                <Route path="/admin-historial" element={<VistaDeHistorial />} />
              </Route>

              {/* Rutas para Vendedor y Admin (Catálogo Protegido) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/catalogo" element={<VistaPrincipalCatalogo />} />
              </Route>

            </Routes>
          </div>
        </AuthProvider>
      </Router>
    );
  }

export default App;