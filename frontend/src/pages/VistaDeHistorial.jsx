import React, { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert, Badge, Card, Button, Nav, Tab, Row, Col } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

// --- CONFIGURACIÓN DE NOMBRES DEMO ---
const USER_MAP = {
  'admin': 'Juan Soto (Gerente)',
  'vendedor': 'María Pérez (Vendedora)',
  'sistema': '🤖 Sistema Automático'
};

function VistaDeHistorial() {
  const { authFetch } = useAuth();
  const [movements, setMovements] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Centro de Auditoría - Bodegas Salas";
    loadData();
    // eslint-disable-next-line
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resMov, resHist] = await Promise.all([
        authFetch('/api/stock-movements/'),
        authFetch('/api/product-history/')
      ]);
      
      if (resMov.ok) setMovements(await resMov.json().then(d => d.results || d));
      if (resHist.ok) setHistory(await resHist.json().then(d => d.results || d));
    } catch (e) { setError("No se pudieron cargar los registros de auditoría."); }
    finally { setLoading(false); }
  };

  // --- HELPERS VISUALES ---
  const getUserName = (username) => USER_MAP[username?.toLowerCase()] || username || 'Usuario Desconocido';
  
  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return (
      <div className="d-flex flex-column text-muted" style={{fontSize: '0.85rem', lineHeight: '1.2'}}>
        <span className="fw-bold text-body">{d.toLocaleDateString('es-CL')}</span>
        <span>{d.toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'})}</span>
      </div>
    );
  };

  const getChanges = (current, index, all) => {
      // 1. BÚSQUEDA INTELIGENTE DEL ANCESTRO
      // Buscamos hacia atrás en la lista el primer registro que tenga el MISMO ID de producto.
      // Esto evita comparar "Peras con Manzanas" (o Lavadoras con Refrigeradores).
      const prev = all.slice(index + 1).find(h => h.id === current.id);

      // 2. LÓGICA DE ESTADO (Descontinuado / Reactivado)
      // Si no hay registro previo con este ID, asumimos que nació activo.
      const currentActive = current.is_active;
      const prevActive = prev ? prev.is_active : true;

      // CASO A: Se descontinuó
      if (currentActive === false && prevActive === true) {
          return <Badge bg="danger" className="w-100 p-2">⛔ DESCONTINUADO (Eliminación Lógica)</Badge>;
      }
      
      // CASO B: Se reactivó
      if (currentActive === true && prevActive === false) {
          return <Badge bg="success" className="w-100 p-2">♻️ REACTIVADO</Badge>;
      }

      // CASO C: Creación Inicial (No existe un ancestro para este ID)
      if (!prev) {
          return <Badge bg="success" className="bg-opacity-75"><i className="bi bi-stars"></i> Creación Inicial</Badge>;
      }

      // 3. DETECCIÓN DE CAMBIOS DE DATOS
      const changes = [];
      const fields = [
          { k: 'nombre_comercial', l: 'Nombre' },
          { k: 'precio_venta', l: 'Precio', money: true },
          { k: 'stock', l: 'Stock' },
          { k: 'sku', l: 'SKU' },
          { k: 'brand_name', l: 'Marca' }, 
          { k: 'category_name', l: 'Categoría' },
          { k: 'provider_name', l: 'Proveedor' },
          { k: 'descripcion', l: 'Descripción' }
      ];

      fields.forEach(f => {
          const valNow = current[f.k];
          const valPrev = prev[f.k];

          // Comparación estricta de texto (trim) para evitar falsos positivos por espacios o tipos
          if (String(valNow || '').trim() !== String(valPrev || '').trim()) {
              const displayNow = f.money ? `$${parseInt(valNow||0).toLocaleString('es-CL')}` : (valNow || '---');
              const displayPrev = f.money ? `$${parseInt(valPrev||0).toLocaleString('es-CL')}` : (valPrev || '---');
              
              changes.push(
                  <div key={f.k} className="mb-1 p-2 rounded bg-warning bg-opacity-10 text-body border border-warning small">
                      <strong>{f.l}:</strong> <span className="text-decoration-line-through text-muted opacity-75 mx-1">{displayPrev}</span> 
                      <i className="bi bi-arrow-right-short text-warning"></i> 
                      <span className="fw-bold mx-1">{displayNow}</span>
                  </div>
              );
          }
      });

      return changes.length > 0 ? changes : <span className="text-muted small fst-italic">Edición menor (sin cambios clave)</span>;
    };

  return (
    <div className="min-vh-100 bg-body-tertiary transition-colors">
      <Container className="py-5">
        
        {/* ENCABEZADO CON RESUMEN */}
        <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2 className="fw-bold text-body mb-0"><i className="bi bi-shield-lock-fill text-primary me-2"></i>Centro de Auditoría</h2>
                    <p className="text-muted">Registro forense de actividad y cambios.</p>
                </div>
                <Button variant="primary" onClick={loadData} disabled={loading} className="shadow-sm">
                    <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''} me-2`}></i> 
                    {loading ? 'Sincronizando...' : 'Actualizar Datos'}
                </Button>
            </div>

            {/* TARJETAS DE RESUMEN (KPIs) */}
            <Row className="g-3">
                <Col md={6}>
                    <Card className="border-0 shadow-sm h-100 border-start border-4 border-primary bg-body">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3 text-primary">
                                <i className="bi bi-boxes fs-4"></i>
                            </div>
                            <div>
                                <h6 className="text-muted mb-0 text-uppercase small fw-bold">Movimientos Logísticos</h6>
                                <h3 className="fw-bold mb-0 text-body">{movements.length}</h3>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="border-0 shadow-sm h-100 border-start border-4 border-warning bg-body">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-3 text-warning">
                                <i className="bi bi-file-earmark-diff fs-4"></i>
                            </div>
                            <div>
                                <h6 className="text-muted mb-0 text-uppercase small fw-bold">Cambios en Catálogo</h6>
                                <h3 className="fw-bold mb-0 text-body">{history.length}</h3>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>

        {error && <Alert variant="danger" className="shadow-sm border-0"><i className="bi bi-exclamation-circle me-2"></i>{error}</Alert>}

        {/* CONTENIDO PRINCIPAL */}
        <Card className="border-0 shadow-sm overflow-hidden bg-body">
          <Card.Header className="bg-body border-bottom p-0">
            <Tab.Container defaultActiveKey="stock">
                <Nav variant="tabs" className="nav-justified fw-bold">
                    <Nav.Item>
                        <Nav.Link eventKey="stock" className="py-3 border-0 border-bottom border-3 rounded-0 text-body">
                            <i className="bi bi-truck me-2 text-primary"></i>Control de Stock
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="changes" className="py-3 border-0 border-bottom border-3 rounded-0 text-body">
                            <i className="bi bi-pencil-square me-2 text-warning"></i>Cambios de Precios/Datos
                        </Nav.Link>
                    </Nav.Item>
                </Nav>
                
                <Card.Body className="p-0 bg-body">
                    <Tab.Content>
                        {/* --- TABLA MOVIMIENTOS --- */}
                        <Tab.Pane eventKey="stock">
                            <div className="table-responsive">
                                <Table hover className="align-middle mb-0 text-body">
                                    <thead className="bg-body-secondary text-secondary small text-uppercase">
                                        <tr>
                                            <th className="ps-4 py-3 bg-body-secondary">Fecha</th>
                                            <th className="bg-body-secondary">Responsable</th>
                                            <th className="text-center bg-body-secondary">Operación</th>
                                            <th className="bg-body-secondary">Producto</th>
                                            <th className="text-end bg-body-secondary">Cantidad</th>
                                            <th className="pe-4 bg-body-secondary">Justificación</th>
                                        </tr>
                                    </thead>
                                    <tbody className="border-top-0">
                                        {movements.map(m => (
                                            <tr key={m.id}>
                                                <td className="ps-4">{formatDate(m.created_at)}</td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="bg-body-secondary rounded-circle p-1 me-2 border d-flex justify-content-center align-items-center" style={{width:32, height:32}}>
                                                            <i className="bi bi-person text-body"></i>
                                                        </div>
                                                        <span className="fw-bold text-body">{getUserName(m.user)}</span>
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    {m.movement_type === 'IN' 
                                                        ? <Badge bg="success" className="px-3 py-2 rounded-pill bg-opacity-75"><i className="bi bi-box-arrow-in-down me-1"></i> Entrada</Badge>
                                                        : <Badge bg="danger" className="px-3 py-2 rounded-pill bg-opacity-75"><i className="bi bi-box-arrow-up me-1"></i> Salida</Badge>
                                                    }
                                                </td>
                                                <td>
                                                    <div className="fw-bold text-body">{m.product_name || `ID: ${m.product}`}</div>
                                                </td>
                                                <td className="text-end">
                                                    <span className={`fs-5 fw-bold font-monospace ${m.movement_type === 'IN' ? 'text-success' : 'text-danger'}`}>
                                                        {m.movement_type === 'IN' ? '+' : '-'}{m.quantity}
                                                    </span>
                                                </td>
                                                <td className="pe-4 text-muted small fst-italic">
                                                    "{m.reason}"
                                                </td>
                                            </tr>
                                        ))}
                                        {movements.length === 0 && <tr><td colSpan="6" className="text-center py-5 text-muted">No hay actividad registrada.</td></tr>}
                                    </tbody>
                                </Table>
                            </div>
                        </Tab.Pane>

                        {/* --- TABLA CAMBIOS --- */}
                        <Tab.Pane eventKey="changes">
                            <div className="table-responsive">
                                <Table hover className="align-middle mb-0 text-body">
                                    <thead className="bg-body-secondary text-secondary small text-uppercase">
                                        <tr>
                                            <th className="ps-4 py-3 bg-body-secondary">Fecha</th>
                                            <th className="bg-body-secondary">Editor</th>
                                            <th className="text-center bg-body-secondary">Evento</th>
                                            <th className="bg-body-secondary">Producto</th>
                                            <th className="pe-4 bg-body-secondary">Detalle del Cambio</th>
                                        </tr>
                                    </thead>
                                    <tbody className="border-top-0">
                                        {history.map((h, i) => (
                                            <tr key={h.history_id}>
                                                <td className="ps-4">{formatDate(h.history_date)}</td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="bg-body-secondary bg-opacity-10 rounded-circle p-1 me-2 border d-flex justify-content-center align-items-center" style={{width:32, height:32}}>
                                                            <i className="bi bi-pencil-fill text-body" style={{fontSize: 10}}></i>
                                                        </div>
                                                        <span className="fw-medium text-body">{getUserName(h.history_user)}</span>
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    {h.history_type === '+' && <Badge bg="success" text="white" className="rounded-pill border px-3 bg-opacity-75">Nuevo</Badge>}
                                                    {h.history_type === '~' && <Badge bg="warning" text="dark" className="rounded-pill border px-3 bg-opacity-75">Editado</Badge>}
                                                    {h.history_type === '-' && <Badge bg="danger" text="white" className="rounded-pill border px-3 bg-opacity-75">Borrado</Badge>}
                                                </td>
                                                <td>
                                                    <span className="fw-bold d-block text-body">{h.nombre_comercial}</span>
                                                    <span className="font-monospace text-muted small">{h.sku}</span>
                                                </td>
                                                <td className="pe-4">
                                                    {h.history_type === '~' ? getChanges(h, i, history) : 
                                                     h.history_type === '-' ? <span className="text-danger fw-bold"><i className="bi bi-trash"></i> Eliminado del sistema</span> :
                                                     <span className="text-success"><i className="bi bi-stars"></i> Creación inicial</span>}
                                                </td>
                                            </tr>
                                        ))}
                                        {history.length === 0 && <tr><td colSpan="5" className="text-center py-5 text-muted">No hay ediciones registradas.</td></tr>}
                                    </tbody>
                                </Table>
                            </div>
                        </Tab.Pane>
                    </Tab.Content>
                </Card.Body>
            </Tab.Container>
          </Card.Header>
        </Card>
      </Container>
    </div>
  );
}

export default VistaDeHistorial;