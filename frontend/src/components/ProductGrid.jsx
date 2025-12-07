import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Form, Button, Pagination, Card, Badge, Container, Row, Col, Spinner, Alert, Offcanvas, InputGroup, Toast, ToastContainer, Table } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ProductGrid = () => {
  const { authFetch } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [toastConfig, setToastConfig] = useState({ show: false, message: '', variant: 'success' });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [sortBy, setSortBy] = useState('nombre_comercial');
  const [sortOrder, setSortOrder] = useState('asc');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);

  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleProduct, setSaleProduct] = useState(null);
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [saleReason, setSaleReason] = useState("");
  const [saleLoading, setSaleLoading] = useState(false);

  const [forecastData, setForecastData] = useState(null);

  // Imagen por defecto profesional
  const defaultImage = 'https://via.placeholder.com/400x400?text=Producto+Sin+Imagen';

  useEffect(() => { loadProducts(); }, []); // eslint-disable-line

  const showFeedback = (message, variant = 'success') => setToastConfig({ show: true, message, variant });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await authFetch("/api/products/");
      if (!response.ok) throw new Error("Error cargando catálogo");
      const data = await response.json();
      const productsArray = data.results || data;
      
      setProducts(productsArray.map(product => ({
        ...product,
        imagen_principal: product.images?.find(img => img.is_principal)?.image || product.images?.[0]?.image || defaultImage,
        marca: product.brand?.name || 'Genérico',
        categoria: product.category?.name || 'General',
        proveedor: product.provider?.name || 'N/A',
        images: product.images?.map(img => img.image) || [],
      })));
    } catch (error) { showFeedback("Error al cargar productos", "danger"); } 
    finally { setLoading(false); }
  };

  const handleCopyPimSheet = async (e, productId) => {
    e.stopPropagation();
    try {
      const res = await authFetch(`/api/products/${productId}/pim-sheet/`);
      if (res.ok) {
        const data = await res.json();
        // Intentar escribir en el portapapeles
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(data.text);
            showFeedback("📋 Ficha técnica copiada al portapapeles", "success");
        } else {
            // Fallback para entornos no seguros o navegadores antiguos
            console.warn("Portapapeles no disponible, mostrando en consola");
            console.log(data.text);
            showFeedback("Ficha generada (Ver consola - Error de permisos HTTPS)", "warning");
        }
      } else { throw new Error("Error en API"); }
    } catch (err) { 
        console.error(err);
        showFeedback("Error al generar la ficha técnica", "danger"); 
    }
  };

  const openSaleModal = (e, product) => {
    e.stopPropagation();
    setSaleProduct(product);
    setSaleQuantity(1);
    setSaleReason("Venta rápida en sala");
    setShowSaleModal(true);
  };

  const handleProcessSale = async () => {
    if (saleQuantity <= 0) return showFeedback("Cantidad inválida", "warning");
    if (saleQuantity > saleProduct.stock) return showFeedback("Sin stock suficiente", "danger");
    setSaleLoading(true);
    try {
      const res = await authFetch('/api/stock-movements/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: saleProduct.id, quantity: parseInt(saleQuantity), movement_type: 'OUT', reason: saleReason })
      });
      if (res.ok) {
        showFeedback(`✅ Venta registrada: -${saleQuantity}`, "success");
        setShowSaleModal(false);
        loadProducts();
      } else {
        const err = await res.json();
        showFeedback(err.detail || "Error al procesar", "danger");
      }
    } catch (error) { showFeedback("Error de conexión", "danger"); } 
    finally { setSaleLoading(false); }
  };

  const formatPrice = (price) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price || 0);
  
  const getStatusBadge = (stock) => {
    if (stock === 0) return <Badge bg="danger">⛔ Agotado</Badge>;
    if (stock < 5) return <Badge bg="warning" text="dark">⚠️ Quedan {stock}</Badge>;
    return <Badge bg="success" className="bg-opacity-75">✅ Stock: {stock}</Badge>;
  };

  const getUniqueValues = (key) => [...new Set(products.map((item) => item[key]))].filter(Boolean).sort();

  const filteredAndSortedProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let result = products.filter((p) => {
      const matchSearch = !term || p.nombre_comercial.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term) || p.ean.includes(term);
      const matchFilters = Object.entries(filterValues).every(([k, v]) => !v || p[k] === v);
      return matchSearch && matchFilters;
    });
    result.sort((a, b) => {
      let aVal = a[sortBy], bVal = b[sortBy];
      if (['precio_venta', 'stock'].includes(sortBy)) { aVal = parseFloat(aVal)||0; bVal = parseFloat(bVal)||0; }
      else { aVal = String(aVal).toLowerCase(); bVal = String(bVal).toLowerCase(); }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [products, searchTerm, filterValues, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / (itemsPerPage === 'Todos' ? filteredAndSortedProducts.length : itemsPerPage));
  const paginatedProducts = useMemo(() => {
    if (itemsPerPage === 'Todos') return filteredAndSortedProducts;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProducts.slice(start, start + itemsPerPage);
  }, [filteredAndSortedProducts, currentPage, itemsPerPage]);

  const renderFilters = () => (
    <Row className="g-2 align-items-center">
      <Col xs={12} lg={4}>
        <InputGroup>
          <InputGroup.Text className="bg-body-secondary border-secondary"><i className="bi bi-search text-body"></i></InputGroup.Text>
          <Form.Control 
            placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} 
            className="bg-body text-body border-secondary"
          />
        </InputGroup>
      </Col>
      <Col xs={6} lg={2}>
        <Form.Select value={filterValues.marca || ''} onChange={e => setFilterValues({...filterValues, marca: e.target.value})} className="bg-body text-body border-secondary">
          <option value="">Marcas</option>
          {getUniqueValues('marca').map(m => <option key={m} value={m}>{m}</option>)}
        </Form.Select>
      </Col>
      <Col xs={6} lg={2}>
        <Form.Select value={filterValues.categoria || ''} onChange={e => setFilterValues({...filterValues, categoria: e.target.value})} className="bg-body text-body border-secondary">
          <option value="">Categorías</option>
          {getUniqueValues('categoria').map(c => <option key={c} value={c}>{c}</option>)}
        </Form.Select>
      </Col>
      <Col xs={6} lg={2}>
        <div className="d-flex gap-1">
            <Form.Select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-100 bg-body text-body border-secondary">
                <option value="nombre_comercial">Nombre</option>
                <option value="precio_venta">Precio</option>
                <option value="stock">Stock</option>
            </Form.Select>
            <Button variant="outline-secondary" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                <i className={`bi bi-sort-${sortOrder === 'asc' ? 'down' : 'up'}`}></i>
            </Button>
        </div>
      </Col>
      <Col xs={6} lg={2}>
        <Form.Select value={itemsPerPage} onChange={(e) => { setItemsPerPage(e.target.value === 'Todos' ? 'Todos' : parseInt(e.target.value)); setCurrentPage(1); }} className="bg-body text-body border-secondary">
            <option value="12">12 items</option><option value="24">24 items</option><option value="48">48 items</option><option value="Todos">Todos</option>
        </Form.Select>
      </Col>
    </Row>
  );

  const loadForecast = async (id) => {
    setForecastData(null);
    try {
      const res = await authFetch(`/api/products/${id}/forecast/`);
      const data = await res.json();
      if (data.status === 'success') {
        setForecastData(data);
      }
    } catch (e) {
        console.error("Error cargando predicción:", e)
    }
  };

  const handlePrevImage = () => {
    if (!modalData?.images) return;
    setCurrentImageIndex((prev) => (prev === 0 ? modalData.images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (!modalData?.images) return;
    setCurrentImageIndex((prev) => (prev === modalData.images.length - 1 ? 0 : prev + 1));
  };

  return (
    <Container className="py-4 min-vh-100 bg-body-tertiary transition-colors">
      
      {/* HEADER FILTROS */}
      <div className="bg-body p-3 rounded shadow-sm mb-4 border border-secondary-subtle">
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold m-0 text-body"><i className="bi bi-grid-fill me-2 text-primary"></i>Catálogo</h5>
            <div>
                {(Object.values(filterValues).some(x=>x) || searchTerm) && (
                    <Button variant="link" className="text-decoration-none p-0 me-3 text-danger" onClick={()=>{setSearchTerm(''); setFilterValues({});}} size="sm">
                        <i className="bi bi-x-circle"></i> Limpiar
                    </Button>
                )}
                <span className="text-muted small">{filteredAndSortedProducts.length} productos</span>
            </div>
        </div>
        <div className="d-none d-lg-block">{renderFilters()}</div>
        <Button variant="outline-primary" className="d-lg-none w-100" onClick={()=>setShowFilters(true)}><i className="bi bi-funnel"></i> Filtros</Button>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" variant="primary"/></div>
      ) : (
        <>
          {paginatedProducts.length === 0 ? (
            <Alert variant="secondary" className="text-center py-5">No se encontraron productos.</Alert>
          ) : viewMode === 'grid' ? (
            <Row className="g-3 g-xl-4">
              {paginatedProducts.map(p => (
                <Col key={p.id} xs={6} md={4} lg={3}>
                  <Card className="h-100 shadow-sm border-0 overflow-hidden bg-body product-card" style={{cursor:'pointer', transition: 'transform 0.2s'}} onClick={() => { setModalData(p); setCurrentImageIndex(0); setShowModal(true); loadForecast(p.id); }}>
                    <div className="position-relative text-center p-3 bg-body-tertiary" style={{height: '200px'}}>
                      <Card.Img variant="top" src={p.imagen_principal} className="h-100 w-auto" style={{objectFit: 'contain', maxWidth: '100%'}} />
                      <div className="position-absolute top-0 start-0 m-2">
                         <Badge bg="body" text="body" className="border shadow-sm opacity-75">{p.marca}</Badge>
                      </div>
                    </div>
                    <Card.Body className="d-flex flex-column p-3 bg-body border-top border-secondary-subtle">
                      <div className="mb-2">
                        <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.7rem'}}>{p.categoria}</small>
                        <Card.Title className="fw-bold fs-6 text-truncate mb-1 text-body" title={p.nombre_comercial}>{p.nombre_comercial}</Card.Title>
                        <small className="text-muted font-monospace" style={{fontSize:'0.75rem'}}>{p.sku}</small>
                      </div>
                      <div className="mt-auto pt-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="text-primary fw-bold mb-0">{formatPrice(p.precio_venta)}</h5>
                            <div style={{transform: 'scale(0.9)', transformOrigin: 'right center'}}>{getStatusBadge(p.stock)}</div>
                        </div>
                        <div className="d-flex gap-2">
                            <Button variant="primary" className="flex-grow-1 fw-bold d-flex align-items-center justify-content-center gap-2" onClick={(e) => openSaleModal(e, p)} disabled={p.stock <= 0}>
                                <i className="bi bi-cart-check-fill"></i> VENDER
                            </Button>
                            <Button variant="outline-secondary" className="px-3" onClick={(e) => handleCopyPimSheet(e, p.id)} title="Copiar Ficha Técnica">
                                <i className="bi bi-file-text"></i>
                            </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <div className="text-center">Vista lista no disponible en modo adaptable.</div>
          )}

          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-5">
               <Pagination className="shadow-sm">
                 <Pagination.Prev onClick={() => setCurrentPage(c => Math.max(1, c - 1))} disabled={currentPage === 1} />
                 <Pagination.Item active>{currentPage} de {totalPages}</Pagination.Item>
                 <Pagination.Next onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages} />
               </Pagination>
            </div>
          )}
        </>
      )}

      {/* --- MODAL DETALLE XL MEJORADO --- */}
      {modalData && (
        <Modal show={showModal} onHide={() => setShowModal(false)} centered size="xl" contentClassName="bg-body text-body">
            <Modal.Header closeButton className="border-bottom border-secondary-subtle">
                <Modal.Title className="fs-4 fw-bold text-primary">
                    <i className="bi bi-box-seam me-2"></i>Ficha del Producto
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                <Row>
                    {/* --- COLUMNA IZQUIERDA: IMAGEN + GRÁFICO --- */}
                    <Col lg={5} className="d-flex flex-column gap-3">
                        
                        {/* 1. SECCIÓN DE IMAGEN (Carrusel Restaurado) */}
                        <div className="bg-light p-3 rounded d-flex align-items-center justify-content-center overflow-hidden position-relative shadow-sm" style={{ height: '350px' }}>
                            {modalData.images && modalData.images.length > 0 ? (
                                <>
                                    <img
                                        src={modalData.images[currentImageIndex] || defaultImage} // Usa imagen actual o default
                                        alt={modalData.nombre_comercial}
                                        className="img-fluid rounded"
                                        style={{ maxHeight: '100%', objectFit: 'contain' }}
                                    />
                                    {modalData.images.length > 1 && (
                                        <>
                                            {/* Botón Anterior */}
                                            <Button
                                                variant="light"
                                                className="position-absolute start-0 top-50 translate-middle-y ms-2 rounded-circle shadow-sm opacity-75"
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                                            >
                                                <i className="bi bi-chevron-left"></i>
                                            </Button>
                                            {/* Botón Siguiente */}
                                            <Button
                                                variant="light"
                                                className="position-absolute end-0 top-50 translate-middle-y me-2 rounded-circle shadow-sm opacity-75"
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                                            >
                                                <i className="bi bi-chevron-right"></i>
                                            </Button>
                                            {/* Indicadores */}
                                            <div className="position-absolute bottom-0 start-50 translate-middle-x mb-2 d-flex gap-1">
                                                {modalData.images.map((_, idx) => (
                                                    <span 
                                                        key={idx} 
                                                        className={`rounded-circle ${idx === currentImageIndex ? 'bg-primary' : 'bg-secondary'}`} 
                                                        style={{width: '8px', height: '8px', opacity: idx === currentImageIndex ? 1 : 0.5}}
                                                    ></span>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                // Fallback si no hay imágenes en el array pero sí una principal
                                <img 
                                    src={modalData.imagen_principal || defaultImage} 
                                    alt={modalData.nombre_comercial}
                                    className="img-fluid rounded"
                                    style={{ maxHeight: '100%', objectFit: 'contain' }}
                                />
                            )}
                        </div>

                        {/* 2. SECCIÓN DE INTELIGENCIA DE NEGOCIO (Gráfico) */}
                        {forecastData ? (
                            <div className="alert alert-info border-0 shadow-sm m-0">
                                <h6 className="fw-bold text-info-emphasis mb-2" style={{fontSize: '0.9rem'}}>
                                    <i className="bi bi-graph-up-arrow me-2"></i>Predicción de Stock (IA)
                                </h6>
                                <div className="d-flex justify-content-between align-items-center mb-2 px-1 small">
                                    <div>
                                        <span className="text-muted d-block" style={{fontSize: '0.8rem'}}>Velocidad</span>
                                        <strong>{forecastData.burn_rate} un/día</strong>
                                    </div>
                                    <div className="text-end">
                                        <span className="text-muted d-block" style={{fontSize: '0.8rem'}}>Quiebre Estimado</span>
                                        <strong className="text-danger">{forecastData.estimated_stockout}</strong>
                                    </div>
                                </div>
                                
                                <div className="bg-white p-1 rounded" style={{ height: '120px' }}>
                                    <Line 
                                        data={{
                                            labels: forecastData.chart_data.labels,
                                            datasets: [{
                                                label: 'Ventas Diarias',
                                                data: forecastData.chart_data.values,
                                                borderColor: '#0dcaf0',
                                                backgroundColor: 'rgba(13, 202, 240, 0.5)',
                                                tension: 0.3,
                                                pointRadius: 3,
                                                pointBackgroundColor: '#fff',
                                                borderWidth: 2
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { display: false } },
                                            scales: { 
                                                x: { grid: { display: false }, ticks: { font: { size: 9 } } }, 
                                                y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 9 } } } 
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="alert alert-light border shadow-sm m-0 d-flex align-items-center text-muted p-2">
                                <Spinner animation="border" size="sm" variant="secondary" className="me-2" />
                                <small style={{fontSize: '0.85rem'}}>Analizando tendencias...</small>
                            </div>
                        )}
                    </Col>

                    {/* COLUMNA DERECHA: DATOS TÉCNICOS */}
                    <Col lg={7}>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <Badge bg="info" text="dark" className="me-2 fs-6">{modalData.marca}</Badge>
                                <Badge bg="secondary" className="fs-6">{modalData.categoria}</Badge>
                            </div>
                            <div className="fs-5">{getStatusBadge(modalData.stock)}</div>
                        </div>

                        <h2 className="fw-bold mb-2 display-6 text-body">{modalData.nombre_comercial}</h2>
                        <h3 className="text-success fw-bold mb-4 display-5">{formatPrice(modalData.precio_venta)}</h3>

                        <h5 className="border-bottom border-secondary-subtle pb-2 mb-3 fw-bold text-body-secondary">Especificaciones</h5>
                        <Table borderless size="sm" className="mb-4 text-body">
                            <tbody>
                                <tr><td className="text-muted w-25">SKU (Código):</td><td className="font-monospace fw-bold">{modalData.sku}</td></tr>
                                <tr><td className="text-muted">Ubicación:</td><td>{modalData.lugar_bodega || "No asignada"}</td></tr>
                                <tr><td className="text-muted">Dimensiones:</td><td>{modalData.dimensiones || "N/A"}</td></tr>
                                <tr><td className="text-muted">Peso:</td><td>{modalData.peso > 0 ? `${modalData.peso} kg` : "N/A"}</td></tr>
                                <tr><td className="text-muted">Uso Sugerido:</td><td>{modalData.edad_uso || "General"}</td></tr>
                            </tbody>
                        </Table>

                        <h5 className="border-bottom border-secondary-subtle pb-2 mb-2 fw-bold text-body-secondary">Descripción</h5>
                        <p className="text-muted mb-4" style={{whiteSpace: 'pre-line'}}>{modalData.descripcion}</p>

                        <div className="d-grid gap-2 d-md-flex mt-auto">
                            {/* BOTÓN COPIAR - ESTILO PROFESIONAL */}
                            <Button variant="outline-dark" size="lg" className="flex-grow-1 fw-bold border-2" onClick={(e) => handleCopyPimSheet(e, modalData.id)}>
                                <i className="bi bi-file-earmark-text me-2"></i> Copiar Ficha Técnica
                            </Button>
                            <Button variant="primary" size="lg" className="flex-grow-1 fw-bold" onClick={(e) => { setShowModal(false); openSaleModal(e, modalData); }} disabled={modalData.stock <= 0}>
                                <i className="bi bi-cart-check-fill me-2"></i> REGISTRAR VENTA
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Modal.Body>
        </Modal>
      )}

      {/* MODAL VENTA Y TOAST (Iguales que antes) */}
      <Modal show={showSaleModal} onHide={() => setShowSaleModal(false)} centered backdrop="static" size="sm" contentClassName="bg-body text-body">
        <Modal.Header closeButton className="border-bottom-0 pb-0">
            <Modal.Title className="fs-5 fw-bold">Registrar Venta</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {saleProduct && (
                <>
                    <div className="d-flex align-items-center gap-3 mb-3 bg-body-tertiary p-2 rounded border border-secondary-subtle">
                        <img src={saleProduct.imagen_principal} alt="" style={{width: 50, height: 50, objectFit:'contain'}} className="bg-body rounded border" />
                        <div className="overflow-hidden">
                            <div className="fw-bold text-truncate">{saleProduct.nombre_comercial}</div>
                            <small className="text-muted">Stock actual: {saleProduct.stock}</small>
                        </div>
                    </div>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold small">Cantidad a descontar</Form.Label>
                            <Form.Control type="number" min="1" max={saleProduct.stock} value={saleQuantity} onChange={(e) => setSaleQuantity(e.target.value)} autoFocus size="lg" className="text-center fw-bold text-primary bg-body text-body border-secondary" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="small">Nota (Opcional)</Form.Label>
                            <Form.Control type="text" placeholder="Ej: Venta mostrador..." value={saleReason} onChange={(e) => setSaleReason(e.target.value)} size="sm" className="bg-body text-body border-secondary" />
                        </Form.Group>
                    </Form>
                </>
            )}
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0">
            <Button variant="link" className="text-muted text-decoration-none" onClick={() => setShowSaleModal(false)}>Cancelar</Button>
            <Button variant="primary" className="px-4 fw-bold" onClick={handleProcessSale} disabled={saleLoading || saleQuantity > saleProduct?.stock || saleQuantity <= 0}>
                {saleLoading ? <Spinner size="sm" animation="border"/> : 'Confirmar'}
            </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="bottom-center" className="p-3" style={{zIndex: 9999}}>
          <Toast onClose={() => setToastConfig({...toastConfig, show:false})} show={toastConfig.show} delay={3000} autohide bg={toastConfig.variant} className="shadow">
              <Toast.Body className={`d-flex align-items-center gap-2 ${toastConfig.variant === 'light' ? 'text-dark' : 'text-white'}`}>
                  <i className={`bi bi-${toastConfig.variant === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'}`}></i>
                  <strong className="me-auto">{toastConfig.message}</strong>
              </Toast.Body>
          </Toast>
      </ToastContainer>

      <Offcanvas show={showFilters} onHide={()=>setShowFilters(false)} placement="bottom" className="h-auto rounded-top-4 bg-body text-body" style={{maxHeight: '85vh'}}>
        <Offcanvas.Header closeButton className="border-bottom border-secondary-subtle">
          <Offcanvas.Title className="fw-bold"><i className="bi bi-funnel-fill me-2"></i>Filtros</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="pb-4">
          {renderFilters()}
          <div className="d-grid gap-2 mt-4">
             <Button variant="primary" size="lg" onClick={()=>setShowFilters(false)}>Ver Resultados</Button>
             <Button variant="outline-danger" onClick={()=>{setSearchTerm(''); setFilterValues({});}}>Limpiar Todo</Button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

    </Container>
  );
};

export default ProductGrid;