import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';

const Contacto = () => {
  const team = [
    { name: 'Rafael Salas', role: 'Jefe de Proyecto', email: 'rafael@bodegassalas.cl', icon: 'bi-briefcase-fill' },
    { name: 'Álvaro Casanova', role: 'Desarrollador Web', email: 'alvaro@bodegassalas.cl', icon: 'bi-gear-fill' },
    { name: 'Claudio Pérez', role: 'Analista Funcional', email: 'claudio@bodegassalas.cl', icon: 'bi-code-slash' },
  ];

  // 1. Estados para manejar el formulario
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Cotización PYME', // Valor por defecto
    message: ''
  });
  const [status, setStatus] = useState({ loading: false, success: false, error: '' });

  // 2. Manejador de cambios en los inputs
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Envío al Backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: false, error: '' });

    try {
        // Ajusta la URL si tu backend está en otro puerto/host
      const response = await fetch('http://localhost:8000/api/contact-form/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setStatus({ loading: false, success: true, error: '' });
        setFormData({ name: '', email: '', subject: 'Cotización PYME', message: '' }); // Limpiar form
      } else {
        throw new Error('Error al enviar el mensaje');
      }
    } catch (err) {
      setStatus({ loading: false, success: false, error: 'Hubo un problema enviando el correo. Intenta nuevamente.' });
    }
  };

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
          {/* COLUMNA IZQUIERDA: EQUIPO (Sin cambios visuales mayores) */}
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
            {/* ... (Sección Casa Matriz se mantiene igual) ... */}
          </Col>

          {/* COLUMNA DERECHA: FORMULARIO ACTIVO */}
          <Col lg={7}>
            <Card className="border-0 shadow-lg bg-body rounded-4 h-100">
              <Card.Body className="p-4 p-md-5">
                <h3 className="fw-bold text-body mb-4">Envíanos un mensaje</h3>
                
                {status.success && <Alert variant="success">¡Mensaje enviado! Te contactaremos pronto.</Alert>}
                {status.error && <Alert variant="danger">{status.error}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="text-muted small fw-bold">Nombre</Form.Label>
                        <Form.Control 
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="bg-body-secondary border-0 py-2" 
                            placeholder="Tu nombre" 
                            required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="text-muted small fw-bold">Email</Form.Label>
                        <Form.Control 
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="bg-body-secondary border-0 py-2" 
                            placeholder="correo@empresa.com" 
                            required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="text-muted small fw-bold">Asunto</Form.Label>
                        <Form.Select 
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            className="bg-body-secondary border-0 py-2"
                        >
                          <option value="Cotización Free">Cotización Free (Plan Inicial)</option>
                          <option value="Cotización PYME">Cotización PYME (Plan Recomendado)</option>
                          <option value="Cotización Enterprise">Cotización Enterprise (Corporativo)</option>
                          <option value="Soporte Técnico">Soporte Técnico</option>
                          <option value="Agendar Visita">Agendar Visita</option>
                          <option value="Otro">Otro Asunto</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="text-muted small fw-bold">Mensaje</Form.Label>
                        <Form.Control 
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            as="textarea" 
                            rows={5} 
                            className="bg-body-secondary border-0 py-2" 
                            placeholder="¿En qué podemos ayudarte?" 
                            required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Button variant="primary" type="submit" size="lg" className="w-100 fw-bold rounded-pill mt-3" disabled={status.loading}>
                        {status.loading ? <Spinner animation="border" size="sm" /> : <>Enviar Mensaje <i className="bi bi-send-fill ms-2"></i></>}
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