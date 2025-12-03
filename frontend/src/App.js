import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// --- CONTEXTO ---
import { AuthProvider, useAuth } from "./context/AuthContext";

// --- COMPONENTES PRINCIPALES ---
// import Menu from "./components/Menu"; // Menu is largely redundant if we separate roles drastically, but keeping for Home
import ProtectedRoute from "./components/ProtectedRoute";

// --- PÁGINAS ---
import Home from "./pages/Home";
// We use the new Component for Catalog, not the page wrapper if it existed
import VistaPrincipalCatalogo from "./components/VistaPrincipalCatalogo";
import AdminProducts from "./components/AdminProducts";
import Contacto from "./pages/Contacto";
import Login from "./components/Login";

// Wrapper to hide Menu on Admin/Seller Dashboard if needed, or keep it.
// For simplicity, let's keep it simple.

function App() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <Router>
      <AuthProvider>
        <div className="container-fluid p-0">
          <Routes>
            {/* --- RUTAS PÚBLICAS --- */}
            <Route path="/" element={<Navigate to="/login" />} /> {/* Redirect Root to Login for SaaS feel */}
            <Route path="/login" element={<Login />} />
            <Route path="/contacto" element={<Contacto />} />

            {/* --- RUTAS VENDEDOR (Protected but accessible by any auth user) --- */}
            <Route element={<ProtectedRoute />}>
               <Route path="/catalogo" element={<VistaPrincipalCatalogo />} />
            </Route>

            {/* --- RUTAS ADMIN --- */}
            <Route element={<ProtectedRoute adminOnly={true} />}>
              <Route path="/admin-productos" element={<AdminProducts theme={theme} />} />
              {/* <Route path="/admin-historial" element={<VistaDeHistorial />} /> */}
            </Route>

          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
