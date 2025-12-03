import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isStaff } = useAuth(); // Note: isStaff might not be updated immediately in the same render cycle
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(username, password);
      
      if (success) {
        // We need to check the stored user info or wait for context update.
        // Since login is async and sets state, we might need to rely on localStorage or the logic inside AuthContext.
        // But for redirection, we can check the localStorage 'userInfo' which is set in login().
        const storedUser = JSON.parse(localStorage.getItem('userInfo'));

        if (storedUser && storedUser.is_staff) {
            navigate('/admin-productos'); // Dashboard Admin
        } else {
            navigate('/catalogo'); // Vista Vendedor
        }
      } else {
        setError('Usuario o contraseña incorrectos.');
      }
    } catch (err) {
      console.error('Error de login:', err);
      setError('Ocurrió un error al intentar iniciar sesión. Por favor, inténtelo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card className="shadow-lg border-0" style={{ width: '100%', maxWidth: '450px' }}>
        <Card.Body className="p-4 p-md-5">
          <div className="text-center mb-4">
            <i className="bi bi-box-seam fs-1 text-primary"></i>
            <h2 className="fw-bold mb-0 mt-2">Bodegas Salas PIM</h2>
            <p className="text-muted">Gestión de Inventario Inteligente</p>
          </div>
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formUsername">
              <Form.Label>Usuario</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ingresa tu usuario"
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
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </Form.Group>

            {error && (
              <Alert variant="danger" className="text-center">
                {error}
              </Alert>
            )}

            <div className="d-grid">
              <Button variant="primary" type="submit" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                    />
                    <span className="ms-2">Accediendo...</span>
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
