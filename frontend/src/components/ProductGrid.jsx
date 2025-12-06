import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Form, Button, Pagination, Card, Badge, Container, Row, Col, Spinner, Alert, Offcanvas, Toast, ToastContainer, InputGroup } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const ProductGrid = () => {
  const { authFetch } = useAuth();
  
  // --- Estados de Datos ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- Estados de UI ---
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [toastConfig, setToastConfig] = useState({ show: false, message: '', variant: 'success' });

  // --- Estados de Filtro y Orden ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [sortBy, setSortBy] = useState('nombre_comercial');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // --- Paginación ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);

  // --- Modal Detalle ---
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const defaultImage = 'https://via.placeholder.com/300x300?text=Sin+Imagen';

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line
  }, []);

  // --- HANDLERS UI (LOS QUE FALTABAN) ---
  const handleCloseFilters = () => setShowFilters(false);
  const handleShowFilters = () => setShowFilters(true);
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
    } catch (error) {
      console.error(error);
      showFeedback("Error al cargar productos", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPimSheet = async (e, productId) => {
    e.stopPropagation();
    try {
      const res = await authFetch(`/api/products/${productId}/pim-sheet/`);
      if (res.ok) {
        const data = await res.json();
        await navigator.clipboard.writeText(data.text);
        showFeedback("📋 Ficha técnica copiada al portapapeles", "success");
      } else {
        throw new Error("Error al obtener ficha");
      }
    } catch (err) {
      showFeedback("Error al copiar ficha", "danger");
    }
  };

  // --- Helpers ---
  const formatPrice = (price) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price || 0);
  
  const getStatusBadge = (stock) => {
    if (stock === 0) return <Badge bg="danger">⛔ Agotado</Badge>;
    if (stock < 5) return <Badge bg="danger" className="text-white">🔥 ¡Quedan {stock}!</Badge>;
    if (stock < 10) return <Badge bg="warning" text="dark">⚠️ Pocas Unidades</Badge>;
    return <Badge bg="success">✅ Disponible ({stock})</Badge>;
  };

  const getUniqueValues = (key) => [...new Set(products.map((item) => item[key]))].filter(Boolean).sort();

  // --- Filtrado y Ordenamiento ---
  const filteredAndSortedProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    
    let result = products.filter((p) => {
      const matchSearch = !term || 
        p.nombre_comercial.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.ean.includes(term);
      const matchFilters = Object.entries(filterValues).every(([k, v]) => !v || p[k] === v);
      return matchSearch && matchFilters;
    });

    result.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (['precio_venta', 'stock', 'rating'].includes(sortBy)) {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

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

  const handleFilterChange = (key, val) => {
    setFilterValues(prev => ({ ...prev, [key]: val }));
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterValues({});
    setCurrentPage(1);
  };

  // --- RENDERIZADO DE FILTROS ---
  const renderFilters = () => (
    <Row className="g-2 align-items-center">
      <Col xs={12} lg={4}>
        <InputGroup>
          <InputGroup.Text className="bg-body-secondary border-end-0"><i className="bi bi-search"></i></InputGroup.Text>
          <Form.Control 
            placeholder="Buscar por Nombre, SKU, EAN..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border-start-0"
          />
        </InputGroup>
      </Col>
      <Col xs={6} lg={2}>
        <Form.Select value={filterValues.marca || ''} onChange={e => handleFilterChange('marca', e.target.value)}>
          <option value="">Todas las Marcas</option>
          {getUniqueValues('marca').map(m => <option key={m} value={m}>{m}</option>)}
        </Form.Select>
      </Col>
      <Col xs={6} lg={2}>
        <Form.Select value={filterValues.categoria || ''} onChange={e => handleFilterChange('categoria', e.target.value)}>
          <option value="">Todas las Categorías</option>
          {getUniqueValues('categoria').map(c => <option key={c} value={c}>{c}</option>)}
        </Form.Select>
      </Col>
      <Col xs={6} lg={2}>
        <div className="d-flex gap-1">
            <Form.Select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-100">
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
        <Row className="g-1">
           <Col xs={6}>
            <Form.Select value={itemsPerPage} onChange={(e) => { setItemsPerPage(e.target.value === 'Todos' ? 'Todos' : parseInt(e.target.value)); setCurrentPage(1); }}>
                <option value="12">12</option>
                <option value="24">24</option>
                <option value="48">48</option>
                <option value="96">96</option>
                <option value="Todos">Todos</option>
            </Form.Select>
          </Col>
          <Col xs={6}>
             <div className="d-flex gap-1">
                <Button variant={viewMode === 'grid' ? 'primary' : 'outline-primary'} size="sm" className="w-50" onClick={() => setViewMode('grid')}><i className="bi bi-grid"></i></Button>
                <Button variant={viewMode === 'list' ? 'primary' : 'outline-primary'} size="sm" className="w-50" onClick={() => setViewMode('list')}><i className="bi bi-list-ul"></i></Button>
             </div>
          </Col>
        </Row>
      </Col>
    </Row>
  );

  return (
    <Container fluid className="py-4 bg-body-tertiary min-vh-100">
      
      {/* HEADER FILTROS */}
      <div className="bg-body p-3 rounded shadow-sm mb-4 border">
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="fw-bold m-0 text-primary"><i className="bi bi-shop me-2"></i>Catálogo Digital</h4>
            <div>
                <Button variant="link" className="text-decoration-none p-0 me-3" onClick={clearAllFilters}>Limpiar Filtros</Button>
                <span className="text-muted small">{filteredAndSortedProducts.length} productos</span>
            </div>
        </div>
        <div className="d-none d-lg-block">
            {renderFilters()}
        </div>
        <Button variant="outline-primary" className="d-lg-none w-100" onClick={handleShowFilters}>
            <i className="bi bi-funnel me-2"></i> Filtros y Búsqueda
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" variant="primary"/></div>
      ) : (
        <>
          {paginatedProducts.length === 0 ? (
            <Alert variant="info" className="text-center shadow-sm">No hay productos que coincidan con la búsqueda.</Alert>
          ) : viewMode === 'grid' ? (
            
            /* VISTA GRID */
            <Row className="g-3 g-xl-4">
              {paginatedProducts.map(p => (
                <Col key={p.id} xs={6} md={4} lg={3} xl={2}>
                  <Card className="h-100 shadow-sm product-card border-0" style={{cursor:'pointer'}} onClick={() => { setModalData(p); setCurrentImageIndex(0); setShowModal(true); }}>
                    <div className="position-relative bg-body-secondary text-center p-2 p-md-3" style={{height: '180px'}}>
                      <Card.Img variant="top" src={p.imagen_principal} className="h-100 w-auto" style={{objectFit: 'contain', maxWidth: '100%'}} />
                      <div className="position-absolute top-0 end-0 m-1">
                         <Badge bg="dark" className="opacity-75 shadow-sm" style={{fontWeight: 'normal'}}>{p.marca}</Badge>
                      </div>
                    </div>
                    <Card.Body className="d-flex flex-column p-2 p-md-3 bg-body">
                      <div className="mb-2">
                        <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.65rem'}}>{p.categoria}</small>
                        <Card.Title className="fw-bold fs-6 text-truncate mb-1" title={p.nombre_comercial}>{p.nombre_comercial}</Card.Title>
                        <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted font-monospace" style={{fontSize:'0.75rem'}}>{p.sku}</small>
                        </div>
                      </div>
                      <div className="mt-auto pt-2 border-top">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h5 className="text-primary fw-bold mb-0" style={{fontSize:'1rem'}}>{formatPrice(p.precio_venta)}</h5>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <div style={{transform: 'scale(0.85)', transformOrigin: 'left center'}}>{getStatusBadge(p.stock)}</div>
                            <Button variant="outline-success" size="sm" className="rounded-circle p-0 d-flex align-items-center justify-content-center" style={{width:28, height:28}} title="Copiar Ficha" onClick={(e) => handleCopyPimSheet(e, p.id)}>
                                <i className="bi bi-clipboard-check"></i>
                            </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            /* VISTA LISTA */
            <Card className="border-0 shadow-sm overflow-hidden bg-body">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th style={{width: 60}}>Img</th>
                                <th>Producto</th>
                                <th className="d-none d-md-table-cell">Marca/Cat</th>
                                <th className="d-none d-sm-table-cell">SKU</th>
                                <th className="text-end">Precio</th>
                                <th className="text-center">Stock</th>
                                <th className="text-end">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedProducts.map(p => (
                                <tr key={p.id} style={{cursor: 'pointer'}} onClick={() => { setModalData(p); setCurrentImageIndex(0); setShowModal(true); }}>
                                    <td><div className="bg-body-secondary rounded p-1" style={{width:40, height:40}}><img src={p.imagen_principal} alt="" style={{width: '100%', height: '100%', objectFit: 'contain'}} /></div></td>
                                    <td>
                                        <div className="fw-bold text-truncate" style={{maxWidth: 200}}>{p.nombre_comercial}</div>
                                        <div className="d-md-none small text-muted">{p.marca}</div>
                                    </td>
                                    <td className="d-none d-md-table-cell"><div className="small">{p.marca}</div><div className="text-muted small">{p.categoria}</div></td>
                                    <td className="d-none d-sm-table-cell font-monospace small">{p.sku}</td>
                                    <td className="text-end fw-bold text-success">{formatPrice(p.precio_venta)}</td>
                                    <td className="text-center">{getStatusBadge(p.stock)}</td>
                                    <td className="text-end">
                                        <Button variant="outline-success" size="sm" onClick={(e) => handleCopyPimSheet(e, p.id)} title="Copiar Ficha">
                                            <i className="bi bi-clipboard"></i>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
               <Pagination>
                 <Pagination.Prev onClick={() => setCurrentPage(c => Math.max(1, c - 1))} disabled={currentPage === 1} />
                 {[...Array(totalPages)].map((_, i) => {
                    if (i + 1 === 1 || i + 1 === totalPages || (i + 1 >= currentPage - 1 && i + 1 <= currentPage + 1)) {
                        return <Pagination.Item key={i+1} active={i+1 === currentPage} onClick={() => setCurrentPage(i+1)}>{i+1}</Pagination.Item>;
                    } else if (i + 1 === currentPage - 2 || i + 1 === currentPage + 2) {
                        return <Pagination.Ellipsis key={i} disabled />;
                    }
                    return null;
                 })}
                 <Pagination.Next onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages} />
               </Pagination>
            </div>
          )}
        </>
      )}

      {/* --- MODAL DETALLE --- */}
      {modalData && (
        <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg" contentClassName="bg-body">
            <Modal.Header closeButton className="border-bottom">
                <Modal.Title className="fs-5 fw-bold">{modalData.nombre_comercial}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row>
                    <Col md={5} className="text-center mb-3">
                        <div className="border rounded p-2 mb-2 bg-body-secondary position-relative">
                            <img src={modalData.images[currentImageIndex] || defaultImage} className="img-fluid" style={{maxHeight: 300, objectFit: 'contain'}} alt="Producto" />
                        </div>
                        {modalData.images.length > 1 && (
                            <div className="d-flex gap-2 justify-content-center overflow-auto pb-2">
                                {modalData.images.map((img, i) => (
                                    <img 
                                        key={i} src={img} 
                                        style={{width: 50, height: 50, objectFit: 'cover', cursor: 'pointer', border: currentImageIndex === i ? '2px solid var(--bs-primary)' : '1px solid #dee2e6'}} 
                                        className="rounded bg-body-secondary"
                                        onClick={() => setCurrentImageIndex(i)}
                                        alt="thumb"
                                    />
                                ))}
                            </div>
                        )}
                    </Col>
                    <Col md={7}>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <Badge bg="info" text="dark" className="me-2">{modalData.marca}</Badge>
                                <Badge bg="secondary">{modalData.categoria}</Badge>
                            </div>
                            <h3 className="text-success fw-bold m-0">{formatPrice(modalData.precio_venta)}</h3>
                        </div>
                        
                        <p className="text-muted small mb-4">{modalData.descripcion}</p>
                        
                        <div className="bg-body-secondary p-3 rounded mb-3 border">
                            <Row className="g-2 small">
                                <Col xs={6}><strong>SKU:</strong> <span className="font-monospace">{modalData.sku}</span></Col>
                                <Col xs={6}><strong>EAN:</strong> <span className="font-monospace">{modalData.ean}</span></Col>
                                <Col xs={6}><strong>Ubicación:</strong> {modalData.lugar_bodega}</Col>
                                <Col xs={6}><strong>Stock:</strong> {modalData.stock} u.</Col>
                                <Col xs={6}><strong>Dimensiones:</strong> {modalData.dimensiones}</Col>
                                <Col xs={6}><strong>Peso:</strong> {modalData.peso} kg</Col>
                            </Row>
                        </div>

                        <div className="d-grid gap-2">
                            <Button variant="success" onClick={(e) => handleCopyPimSheet(e, modalData.id)}>
                                <i className="bi bi-whatsapp me-2"></i> Copiar Ficha Técnica
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Modal.Body>
        </Modal>
      )}

      {/* --- OFFCANVAS MÓVIL --- */}
      <Offcanvas show={showFilters} onHide={handleCloseFilters} placement="bottom" className="bg-body h-auto" style={{maxHeight: '90vh'}}>
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title><i className="bi bi-funnel-fill me-2"></i> Filtros</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {renderFilters()}
          <div className="d-grid gap-2 mt-4">
             <Button variant="outline-danger" onClick={() => { clearAllFilters(); setShowFilters(false); }}>Limpiar Todo</Button>
             <Button variant="primary" onClick={() => setShowFilters(false)}>Ver Resultados</Button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      <ToastContainer position="top-end" className="p-3" style={{zIndex: 9999}}>
          <Toast onClose={() => setToastConfig({...toastConfig, show:false})} show={toastConfig.show} delay={3000} autohide bg={toastConfig.variant}>
              <Toast.Header><strong className="me-auto">Sistema</strong></Toast.Header>
              <Toast.Body className={toastConfig.variant === 'light' ? 'text-dark' : 'text-white'}>{toastConfig.message}</Toast.Body>
          </Toast>
      </ToastContainer>

    </Container>
  );
};

export default ProductGrid;