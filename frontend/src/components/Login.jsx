import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

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
          const token = localStorage.getItem('token');
          const payload = token ? JSON.parse(atob(token.split('.')[1])) : {};
          payload.role === 'ADMIN' ? navigate('/admin-productos') : navigate('/catalogo');
        } else {
          setError('Credenciales incorrectas.');
        }
      } catch (err) {
        setError('Error de conexión con el servidor.');
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-column justify-content-center">
      <Container>
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            
            <div className="text-center mb-4">
              <div className="bg-primary bg-gradient text-white rounded-circle d-inline-flex align-items-center justify-content-center shadow" style={{width: 64, height: 64}}>
                <i className="bi bi-box-seam fs-2"></i>
              </div>
              <h2 className="fw-bold mt-3 text-body">Bienvenido</h2>
              <p className="text-muted">Ingresa a tu cuenta para gestionar</p>
            </div>

            <Card className="shadow-lg border-0 bg-body rounded-4">
              <Card.Body className="p-4 p-md-5">
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-muted small fw-bold text-uppercase">Usuario</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-body-secondary border-end-0"><i className="bi bi-person text-muted"></i></InputGroup.Text>
                      <Form.Control
                        className="bg-body-secondary border-start-0 ps-0"
                        placeholder="Ej: admin"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoFocus
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="text-muted small fw-bold text-uppercase">Contraseña</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-body-secondary border-end-0"><i className="bi bi-lock text-muted"></i></InputGroup.Text>
                      <Form.Control
                        type="password"
                        className="bg-body-secondary border-start-0 ps-0"
                        placeholder="••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </InputGroup>
                  </Form.Group>

                  {error && (
                    <Alert variant="danger" className="d-flex align-items-center small py-2">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
                    </Alert>
                  )}

                  <Button variant="primary" type="submit" size="lg" className="w-100 fw-bold rounded-pill mb-3" disabled={loading}>
                    {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Ingresar al Sistema'}
                  </Button>

                  <div className="text-center">
                    <Link to="/" className="text-decoration-none text-muted small">
                      <i className="bi bi-arrow-left me-1"></i> Volver al Inicio
                    </Link>
                  </div>
                </Form>
              </Card.Body>
            </Card>

            <div className="text-center mt-4 text-muted small">
              &copy; 2025 Bodegas Salas. Todos los derechos reservados.
            </div>

          </div>
        </div>
      </Container>
    </div>
  );
}

export default Login;