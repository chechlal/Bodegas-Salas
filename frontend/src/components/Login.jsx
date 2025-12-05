import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
        const success = await login(username, password);
        
        if (success) {
          // --- LÓGICA DE REDIRECCIÓN INTELIGENTE ---
          // 1. Leemos el token recién guardado para saber quién es
          const token = localStorage.getItem('token');
          if (token) {
              // Decodificamos el payload del JWT (la parte intermedia)
              const payload = JSON.parse(atob(token.split('.')[1]));
              
              // 2. Si es ADMIN -> Admin Productos, Si es SELLER -> Catálogo
              if (payload.role === 'ADMIN') {
                  navigate('/admin-productos');
              } else {
                  navigate('/catalogo');
              }
          } else {
              // Fallback por seguridad
              navigate('/catalogo');
          }
        } else {
          setError('Usuario o contraseña incorrectos (o error de servidor).');
        }
      } catch (err) {
        console.error('Error detallado de login:', err);
        setError('Error de conexión. Revisa la consola (F12) para más detalles.');
      } finally {
        setLoading(false);
      }
    };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card className="shadow-lg border-0" style={{ width: '100%', maxWidth: '450px' }}>
        <Card.Body className="p-4 p-md-5">
          <div className="text-center mb-4">
            <i className="bi bi-box-arrow-in-right fs-1 text-success"></i>
            <h2 className="fw-bold mb-0 mt-2">Iniciar Sesión</h2>
            <p className="text-muted">Acceso solo para administradores</p>
          </div>
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formUsername">
              <Form.Label>Nombre de Usuario</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej: admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="formPassword">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </Form.Group>

            {/* Alerta de error que solo aparece si 'error' tiene contenido */}
            {error && (
              <Alert variant="danger" className="text-center">
                {error}
              </Alert>
            )}

            <div className="d-grid">
              <Button variant="success" type="submit" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                    />
                    <span className="ms-2">Ingresando...</span>
                  </>
                ) : (
                  'Ingresar'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Login;