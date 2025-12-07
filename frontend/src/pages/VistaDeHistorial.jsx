import React, { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert, Badge, Card, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
// BORRADO: import Menu from '../components/Menu'; <--- Ya está en App.js

function VistaDeHistorial() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { authFetch } = useAuth();

  useEffect(() => {
    document.title = "Auditoría de Stock - Bodegas Salas";
    fetchMovements();
    // eslint-disable-next-line
  }, []);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      setError(null);
      const response = await authFetch('/api/stock-movements/'); 

      if (!response.ok) {
        throw new Error('Error al cargar la auditoría.');
      }

      const data = await response.json();
      setMovements(data.results || data); 
    } catch (err) {
      console.error("Error:", err);
      setError("No se pudo cargar el registro de movimientos.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString('es-CL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const renderTypeBadge = (type) => {
    if (type === 'IN') return <Badge bg="success"><i className="bi bi-arrow-down-circle"></i> ENTRADA</Badge>;
    if (type === 'OUT') return <Badge bg="danger"><i className="bi bi-arrow-up-circle"></i> SALIDA</Badge>;
    return <Badge bg="secondary">{type}</Badge>;
  };

  return (
    // CAMBIO: Usamos 'bg-body-tertiary' para que responda al Modo Oscuro automáticamente
    <div className="min-vh-100 bg-body-tertiary">
      
      {/* ELIMINADO: <Menu />  <--- Esto causaba el menú doble */}
      
      <Container className="py-5">
        <Card className="shadow-sm border-0">
          <Card.Header className="bg-body border-bottom pt-4 px-4 d-flex justify-content-between align-items-center">
            <div>
              <h3 className="fw-bold mb-1"><i className="bi bi-shield-check text-primary me-2"></i>Auditoría de Inventario</h3>
              <p className="text-muted mb-0">Registro inmutable de todas las transacciones de stock.</p>
            </div>
            <Button variant="outline-primary" onClick={fetchMovements} size="sm">
              <i className="bi bi-arrow-clockwise"></i> Actualizar
            </Button>
          </Card.Header>

          <Card.Body className="p-0">
            {loading && (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Cargando bitácora...</p>
              </div>
            )}

            {error && (
              <div className="p-4">
                <Alert variant="danger">{error}</Alert>
              </div>
            )}

            {!loading && !error && (
              <div className="table-responsive">
                <Table hover striped className="mb-0 align-middle">
                  <thead className="table-light text-uppercase small text-muted">
                    <tr>
                      <th className="ps-4">Fecha</th>
                      <th>Usuario</th>
                      <th className="text-center">Acción</th>
                      <th>Producto</th>
                      <th className="text-end">Cantidad</th>
                      <th className="pe-4">Razón / Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-5 text-muted">
                          No hay movimientos registrados aún.
                        </td>
                      </tr>
                    ) : (
                      movements.map((mov) => (
                        <tr key={mov.id}>
                          <td className="ps-4 font-monospace small">{formatDate(mov.created_at)}</td>
                          <td className="fw-bold text-primary">{mov.user || 'Sistema'}</td>
                          <td className="text-center">{renderTypeBadge(mov.movement_type)}</td>
                          <td>
                            <span className="fw-bold">{mov.product_name || `Producto ID: ${mov.product}`}</span>
                          </td>
                          <td className="text-end font-monospace fs-5">
                            {mov.quantity}
                          </td>
                          <td className="pe-4 text-muted fst-italic">
                            {mov.reason || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default VistaDeHistorial;