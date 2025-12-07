import React from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';

const Contacto = () => {
  const team = [
    { name: 'Rafael Salas', role: 'Jefe de Proyecto', email: 'rafael@bodegassalas.cl', icon: 'bi-briefcase-fill' },
    { name: 'Álvaro Casanova', role: 'Desarrollador Web', email: 'alvaro@bodegassalas.cl', icon: 'bi-gear-fill' },
    { name: 'Claudio Pérez', role: 'Analista Funcional', email: 'claudio@bodegassalas.cl', icon: 'bi-code-slash' },
  ];

  return (
    <div className="bg-body-tertiary min-vh-100 py-5 transition-colors">
      <Container>
        
        {/* ENCABEZADO */}
        <div className="text-center mb-5">
          <h1 className="fw-bold text-body mb-3">Hablemos</h1>
          <p className="lead text-muted mx-auto" style={{maxWidth: 600}}>
            Estamos listos para modernizar tu negocio. Contáctanos directamente o visítanos en nuestras oficinas.
          </p>
        </div>

        <Row className="g-5">
          {/* COLUMNA IZQUIERDA: EQUIPO Y DATOS */}
          <Col lg={5}>
            <h4 className="fw-bold text-body mb-4"><i className="bi bi-people-fill text-primary me-2"></i>Nuestro Equipo</h4>
            
            <div className="d-flex flex-column gap-3 mb-5">
              {team.map((member, idx) => (
                <Card key={idx} className="border-0 shadow-sm bg-body">
                  <Card.Body className="d-flex align-items-center p-3">
                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: 50, height: 50}}>
                      <i className={`bi ${member.icon} fs-4`}></i>
                    </div>
                    <div>
                      <h6 className="fw-bold text-body mb-0">{member.name}</h6>
                      <small className="text-muted d-block">{member.role}</small>
                      <a href={`mailto:${member.email}`} className="text-decoration-none small text-primary">{member.email}</a>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>

            <div className="p-4 bg-dark text-white rounded-4 shadow">
              <h5 className="fw-bold mb-3"><i className="bi bi-geo-alt-fill text-danger me-2"></i>Casa Matriz</h5>
              <p className="mb-1 opacity-75">Av. Providencia 1234, Oficina 601</p>
              <p className="mb-3 opacity-75">Santiago, Chile</p>
              
              <hr className="border-secondary" />
              
              <div className="d-flex align-items-center gap-3">
                <div className="bg-success rounded-circle d-flex align-items-center justify-content-center" style={{width:40, height:40}}>
                  <i className="bi bi-whatsapp text-white"></i>
                </div>
                <div>
                  <small className="text-white-50 d-block">Llámanos o escribe</small>
                  <a href="tel:+56912345678" className="text-white fw-bold text-decoration-none fs-5 hover-underline">
                    +56 9 3339 4501
                  </a>
                </div>
              </div>
            </div>
          </Col>

          {/* COLUMNA DERECHA: FORMULARIO */}
          <Col lg={7}>
            <Card className="border-0 shadow-lg bg-body rounded-4 h-100">
              <Card.Body className="p-4 p-md-5">
                <h3 className="fw-bold text-body mb-4">Envíanos un mensaje</h3>
                <Form>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="text-muted small fw-bold">Nombre</Form.Label>
                        <Form.Control className="bg-body-secondary border-0 py-2" placeholder="Tu nombre" />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="text-muted small fw-bold">Email</Form.Label>
                        <Form.Control className="bg-body-secondary border-0 py-2" type="email" placeholder="correo@empresa.com" />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="text-muted small fw-bold">Asunto</Form.Label>
                        <Form.Select className="bg-body-secondary border-0 py-2">
                          <option>Cotización PYME</option>
                          <option>Soporte Técnico</option>
                          <option>Agendar Visita</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="text-muted small fw-bold">Mensaje</Form.Label>
                        <Form.Control as="textarea" rows={5} className="bg-body-secondary border-0 py-2" placeholder="¿En qué podemos ayudarte?" />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Button variant="primary" size="lg" className="w-100 fw-bold rounded-pill mt-3">
                        Enviar Mensaje <i className="bi bi-send-fill ms-2"></i>
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Contacto;