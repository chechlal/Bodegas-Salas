import React from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Importamos el contexto

function Menu({ theme = 'light', toggleTheme }) {
  const isDark = theme === 'dark';
  const { isAdmin, user, logout } = useAuth(); // Obtenemos el estado de autenticación
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirigimos al login después de cerrar sesión
  };

  return (
    <Navbar 
      bg={isDark ? "dark" : "light"} 
      variant={isDark ? "dark" : "light"}
      expand="lg" 
      sticky="top" 
      className="shadow-lg"
    >
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold fs-4">
          <i className={`bi bi-database ${isDark ? 'text-light' : 'text-dark'}`}></i>
          <span className={isDark ? 'text-light' : 'text-dark'}> Gestión Inventario</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          {/* --- ENLACES PRINCIPALES (VISIBLES PARA TODOS) --- */}
          <Nav className="me-auto fs-5">
            <Nav.Link as={Link} to="/catalogo" className={`fw-medium px-3 ${isDark ? 'text-light' : 'text-dark'}`}>
              <i className="bi bi-table me-2"></i>
              Catálogo
            </Nav.Link>
            <Nav.Link as={Link} to="/contacto" className={`fw-medium px-3 ${isDark ? 'text-light' : 'text-dark'}`}>
              <i className="bi bi-envelope-at me-2"></i>
              Contacto
            </Nav.Link>

            {/* --- ENLACES DE ADMIN (SOLO VISIBLES SI isAdmin es true) --- */}
            {isAdmin && (
              <>
                <Nav.Link as={Link} to="/admin-productos" className={`fw-medium px-3 ${isDark ? 'text-light' : 'text-dark'}`}>
                  <i className="bi bi-gear me-2"></i>
                  Administrar Productos
                </Nav.Link>
                <Nav.Link as={Link} to="/admin-historial" className={`fw-medium px-3 ${isDark ? 'text-light' : 'text-dark'}`}>
                  <i className="bi bi-clock-history me-2"></i>
                  Historial
                </Nav.Link>
              </>
            )}
          </Nav>
          
          {/* --- SECCIÓN DE USUARIO Y LOGIN/LOGOUT --- */}
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <i className={`bi bi-person ${isDark ? 'text-light' : 'text-dark'}`}></i>
              <span className={`${isDark ? 'text-light' : 'text-dark'} fw-medium`}>
                {user ? `Bienvenido, ${user.username}` : "Invitado"}
              </span>
            </div>

            {/* --- LÓGICA DE BOTONES --- */}
            {isAdmin ? (
              // Si es admin, mostrar botón de Cerrar Sesión
              <Button variant="outline-danger" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-2"></i>
                Cerrar Sesión
              </Button>
            ) : (
              // Si es invitado, mostrar botón para Iniciar Sesión
              <Button as={Link} to="/login" variant="outline-success">
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Admin Login
              </Button>
            )}

            <Button variant="link" onClick={toggleTheme} className="p-0">
              <i className={`bi ${isDark ? 'bi-sun-fill text-light' : 'bi-moon-fill text-dark'} fs-4`}></i>
            </Button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Menu;