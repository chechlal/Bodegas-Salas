import React from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="bg-body-tertiary min-vh-100 transition-colors">
      
      {/* HERO SECTION (Siempre oscuro para impacto) */}
      <div className="bg-dark text-white py-5 text-center shadow position-relative overflow-hidden">
        <div className="position-absolute top-0 start-0 w-100 h-100 bg-gradient opacity-25" style={{background: 'linear-gradient(45deg, #2c3e50, #000)'}}></div>
        <Container className="position-relative z-1 py-5">
          <div className="mb-3 animate-up">
            <i className="bi bi-box-seam display-1 text-primary"></i>
          </div>
          <h1 className="display-3 fw-bold mb-3">Bodegas Salas ERP</h1>
          <p className="lead text-white-50 mb-5 fs-4">
            Control total de tu inventario. Potencia a tus vendedores.<br/>
            La solución definitiva para el retail moderno.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Button as={Link} to="/login" variant="primary" size="lg" className="px-5 py-3 fw-bold rounded-pill shadow-lg">
              <i className="bi bi-rocket-takeoff me-2"></i> Iniciar Ahora
            </Button>
            <Button as={Link} to="/contacto" variant="outline-light" size="lg" className="px-5 py-3 fw-bold rounded-pill">
              Conocer al Equipo
            </Button>
          </div>
        </Container>
      </div>

      {/* SECCIÓN DE PRECIOS */}
      <Container className="py-5">
        <div className="text-center mb-5">
          <h2 className="fw-bold text-body display-6">Planes a tu Medida</h2>
          <p className="text-muted fs-5">Escalabilidad garantizada para tu negocio</p>
        </div>

        <Row className="justify-content-center g-4">
          {/* PLAN BÁSICO */}
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm bg-body">
              <Card.Header className="bg-body border-0 pt-4 text-center">
                <h4 className="fw-bold text-muted text-uppercase small ls-1">Inicial</h4>
                <h2 className="display-4 fw-bold text-body">Gratis</h2>
              </Card.Header>
              <Card.Body className="text-center d-flex flex-column">
                <ul className="list-unstyled mb-4 text-secondary">
                  <li className="mb-3"><i className="bi bi-check2 text-success me-2 fs-5"></i>Catálogo Digital</li>
                  <li className="mb-3"><i className="bi bi-check2 text-success me-2 fs-5"></i>1 Usuario Vendedor</li>
                  <li className="text-muted opacity-50"><i className="bi bi-dash me-2"></i>Sin Auditoría</li>
                </ul>
                <div className="mt-auto">
                  <Button variant="outline-secondary" className="w-100 rounded-pill" disabled>Tu Plan Actual</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* PLAN PYME (Destacado) */}
          <Col md={4}>
            <Card className="h-100 border border-primary border-2 shadow bg-body position-relative transform-hover">
              <div className="position-absolute top-0 start-50 translate-middle">
                <Badge bg="primary" className="px-3 py-2 rounded-pill shadow-sm">RECOMENDADO</Badge>
              </div>
              <Card.Header className="bg-body border-0 pt-5 text-center">
                <h4 className="fw-bold text-primary text-uppercase small ls-1">Profesional</h4>
                <h2 className="display-4 fw-bold text-body">2 UF <small className="fs-6 text-muted">/mes</small></h2>
              </Card.Header>
              <Card.Body className="text-center d-flex flex-column">
                <ul className="list-unstyled mb-4 text-body">
                  <li className="mb-3"><i className="bi bi-check-circle-fill text-primary me-2"></i><strong>Todo lo Básico +</strong></li>
                  <li className="mb-3"><i className="bi bi-check-circle-fill text-primary me-2"></i>Auditoría Forense</li>
                  <li className="mb-3"><i className="bi bi-check-circle-fill text-primary me-2"></i>Usuarios Ilimitados</li>
                </ul>
                <div className="mt-auto">
                  <Button as={Link} to="/contacto" variant="primary" className="w-100 rounded-pill fw-bold py-2 shadow-sm">Solicitar Demo</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* PLAN EMPRESA */}
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm bg-body">
              <Card.Header className="bg-body border-0 pt-4 text-center">
                <h4 className="fw-bold text-muted text-uppercase small ls-1">Enterprise</h4>
                <h2 className="display-4 fw-bold text-body">Cotizar</h2>
              </Card.Header>
              <Card.Body className="text-center d-flex flex-column">
                <ul className="list-unstyled mb-4 text-secondary">
                  <li className="mb-3"><i className="bi bi-check2 text-success me-2 fs-5"></i>Multi-Bodega</li>
                  <li className="mb-3"><i className="bi bi-check2 text-success me-2 fs-5"></i>API Personalizada</li>
                  <li className="mb-3"><i className="bi bi-check2 text-success me-2 fs-5"></i>Soporte 24/7</li>
                </ul>
                <div className="mt-auto">
                  <Button as={Link} to="/contacto" variant="outline-primary" className="w-100 rounded-pill">Contactar Ventas</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Home;