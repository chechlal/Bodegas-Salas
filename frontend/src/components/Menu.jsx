import React from 'react';
import { Navbar, Nav, Container, Button, Badge } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Menu({ theme, toggleTheme }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/'); // Al salir, volvemos a la portada
  };

  const isActive = (path) => location.pathname === path ? 'active fw-bold' : '';

  return (
    <Navbar 
      expand="lg" 
      className="shadow-sm border-bottom sticky-top" 
      bg="body" 
      data-bs-theme={theme}
    >
      <Container>
        {/* LOGO */}
        <Navbar.Brand as={Link} to={user ? "/catalogo" : "/"} className="d-flex align-items-center gap-2">
          <i className="bi bi-box-seam-fill text-primary fs-4"></i>
          <span className="fw-bold tracking-tight">Bodegas Salas</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="main-navbar" />
        
        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto ms-lg-4">
            
            {/* MENÚ PARA VISITANTES (NO LOGUEADOS) */}
            {!user && (
              <>
                <Nav.Link as={Link} to="/" className={isActive('/')}>Inicio</Nav.Link>
                <Nav.Link as={Link} to="/contacto" className={isActive('/contacto')}>Contacto</Nav.Link>
              </>
            )}

            {/* MENÚ PARA USUARIOS (LOGUEADOS) */}
            {user && (
              <>
                <Nav.Link as={Link} to="/catalogo" className={isActive('/catalogo')}>
                  <i className="bi bi-grid-3x3 me-1"></i> Catálogo
                </Nav.Link>

                {isAdmin && (
                  <>
                    <Nav.Link as={Link} to="/admin-productos" className={isActive('/admin-productos')}>
                      <i className="bi bi-pencil-square me-1"></i> Gestión
                    </Nav.Link>
                    <Nav.Link as={Link} to="/admin-historial" className={isActive('/admin-historial')}>
                      <i className="bi bi-shield-check me-1"></i> Auditoría
                    </Nav.Link>
                  </>
                )}
              </>
            )}
          </Nav>

          {/* ZONA DERECHA (ACCIONES) */}
          <div className="d-flex align-items-center gap-3 mt-3 mt-lg-0">
            {/* Switch Tema */}
            <Button variant="link" onClick={toggleTheme} className="text-body p-0 fs-5 border-0">
              <i className={`bi ${theme === 'dark' ? 'bi-moon-stars-fill' : 'bi-sun-fill'}`}></i>
            </Button>

            {!user ? (
              // Botones Visitante
              <div className="d-flex gap-2">
                <Button as={Link} to="/login" variant="outline-primary" size="sm" className="fw-bold px-3 rounded-pill">
                  Ingresar
                </Button>
                <Button as={Link} to="/contacto" variant="primary" size="sm" className="fw-bold px-3 rounded-pill">
                  Prueba Gratis
                </Button>
              </div>
            ) : (
              // Panel Usuario
              <div className="d-flex align-items-center gap-3 border-start ps-3">
                <div className="text-end lh-1 d-none d-lg-block">
                  <div className="fw-bold small">{user.username}</div>
                  <Badge bg={isAdmin ? 'primary' : 'secondary'} className="fw-normal" style={{fontSize:'0.65rem'}}>
                    {isAdmin ? 'ADMIN' : 'VENDEDOR'}
                  </Badge>
                </div>
                <Button variant="outline-danger" size="sm" onClick={handleLogout} title="Cerrar Sesión">
                  <i className="bi bi-box-arrow-right"></i>
                </Button>
              </div>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Menu;