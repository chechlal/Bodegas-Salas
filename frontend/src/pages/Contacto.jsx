import React from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';

function Contacto() {
  return (
    <Container className="mt-5 p-5 bg-body rounded-3 shadow-lg">
      <h2 className="mb-4 text-center fw-bold text-success">Página de Contacto</h2>
      <Row className="justify-content-center">
        <Col md={8}>
          <p className="text-center mb-4">
            Si tienes alguna pregunta o necesitas soporte, no dudes en contactarnos a través del siguiente formulario o usando la información de contacto.
          </p>
          <Form>
            <Form.Group className="mb-3" controlId="formGroupName">
              <Form.Label>Tu Nombre</Form.Label>
              <Form.Control type="text" placeholder="Ingresa tu nombre" />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formGroupEmail">
              <Form.Label>Correo Electrónico</Form.Label>
              <Form.Control type="email" placeholder="Ingresa tu correo" />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formGroupMessage">
              <Form.Label>Mensaje</Form.Label>
              <Form.Control as="textarea" rows={4} placeholder="Escribe tu mensaje aquí" />
            </Form.Group>
            <div className="text-center">
                <Button variant="primary" type="submit">
                    Enviar Mensaje
                </Button>
            </div>
          </Form>
          <hr className="my-5" />
          <div className="text-center">
            <h5>Información Adicional</h5>
            <p className="mb-1"><strong>Email:</strong> soporte@gestioninventario.com</p>
            <p><strong>Teléfono:</strong> +56 9 1234 5678</p>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default Contacto;