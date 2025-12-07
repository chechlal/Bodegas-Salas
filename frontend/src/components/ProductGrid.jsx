import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Form, Button, Pagination, Card, Badge, Container, Row, Col, Spinner, Alert, Offcanvas, InputGroup, Toast, ToastContainer } from 'react-bootstrap';
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

  // --- Estados para Modal de Venta ---
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleProduct, setSaleProduct] = useState(null);
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [saleReason, setSaleReason] = useState("");
  const [saleLoading, setSaleLoading] = useState(false);

  const defaultImage = 'https://via.placeholder.com/300x300?text=Sin+Imagen';

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line
  }, []);

  // --- HANDLERS UI ---
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

  // --- Lógica de Venta ---
  const openSaleModal = (e, product) => {
    e.stopPropagation();
    setSaleProduct(product);
    setSaleQuantity(1);
    setSaleReason("Venta rápida en sala");
    setShowSaleModal(true);
  };

  const handleProcessSale = async () => {
    if (saleQuantity <= 0) return showFeedback("La cantidad debe ser mayor a 0", "warning");
    if (saleQuantity > saleProduct.stock) return showFeedback("No hay suficiente stock disponible", "danger");
    
    setSaleLoading(true);
    try {
      const res = await authFetch('/api/stock-movements/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: saleProduct.id,
          quantity: parseInt(saleQuantity),
          movement_type: 'OUT',
          reason: saleReason
        })
      });

      if (res.ok) {
        showFeedback(`✅ Venta registrada: -${saleQuantity} de ${saleProduct.nombre_comercial}`, "success");
        setShowSaleModal(false);
        loadProducts();
      } else {
        const errData = await res.json();
        showFeedback(errData.detail || "Error al procesar venta", "danger");
      }
    } catch (error) {
      showFeedback("Error de conexión al vender", "danger");
    } finally {
      setSaleLoading(false);
    }
  };

  // --- Helpers ---
  const formatPrice = (price) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price || 0);
  
  const getStatusBadge = (stock) => {
    if (stock === 0) return <Badge bg="danger">⛔ Agotado</Badge>;
    if (stock < 5) return <Badge bg="warning" text="dark">⚠️ Quedan {stock}</Badge>;
    return <Badge bg="success" className="bg-opacity-75 text-white">✅ Stock: {stock}</Badge>;
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
            placeholder="Buscar..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border-start-0"
          />
        </InputGroup>
      </Col>
      <Col xs={6} lg={2}>
        <Form.Select value={filterValues.marca || ''} onChange={e => handleFilterChange('marca', e.target.value)}>
          <option value="">Marcas</option>
          {getUniqueValues('marca').map(m => <option key={m} value={m}>{m}</option>)}
        </Form.Select>
      </Col>
      <Col xs={6} lg={2}>
        <Form.Select value={filterValues.categoria || ''} onChange={e => handleFilterChange('categoria', e.target.value)}>
          <option value="">Categorías</option>
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
        <Form.Select value={itemsPerPage} onChange={(e) => { setItemsPerPage(e.target.value === 'Todos' ? 'Todos' : parseInt(e.target.value)); setCurrentPage(1); }}>
            <option value="12">12 por pág.</option>
            <option value="24">24 por pág.</option>
            <option value="48">48 por pág.</option>
            <option value="Todos">Todos</option>
        </Form.Select>
      </Col>
    </Row>
  );

  return (
    // CAMBIO 1: Usamos Container normal en vez de fluid para centrar y dar márgenes
    <Container className="py-4 min-vh-100">
      
      {/* HEADER FILTROS */}
      <div className="bg-white p-3 rounded shadow-sm mb-4 border">
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold m-0 text-dark"><i className="bi bi-grid-fill me-2 text-primary"></i>Catálogo</h5>
            <div>
                {Object.keys(filterValues).length > 0 || searchTerm ? (
                    <Button variant="link" className="text-decoration-none p-0 me-3 text-danger" onClick={clearAllFilters} size="sm">
                        <i className="bi bi-x-circle"></i> Limpiar
                    </Button>
                ) : null}
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
            <Alert variant="light" className="text-center border shadow-sm py-5">
                <i className="bi bi-search fs-1 text-muted d-block mb-3"></i>
                No se encontraron productos con esos filtros.
            </Alert>
          ) : viewMode === 'grid' ? (
            
            /* VISTA GRID MEJORADA */
            <Row className="g-3 g-xl-4">
              {paginatedProducts.map(p => (
                <Col key={p.id} xs={6} md={4} lg={3}>
                  <Card className="h-100 shadow-sm product-card border-0 overflow-hidden" style={{cursor:'pointer', transition: 'transform 0.2s'}} onClick={() => { setModalData(p); setCurrentImageIndex(0); setShowModal(true); }}>
                    
                    <div className="position-relative text-center p-3 bg-white" style={{height: '200px'}}>
                      <Card.Img variant="top" src={p.imagen_principal} className="h-100 w-auto" style={{objectFit: 'contain', maxWidth: '100%'}} />
                      <div className="position-absolute top-0 start-0 m-2">
                         <Badge bg="light" text="dark" className="border shadow-sm">{p.marca}</Badge>
                      </div>
                    </div>

                    <Card.Body className="d-flex flex-column p-3 bg-light border-top">
                      <div className="mb-2">
                        <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.7rem', letterSpacing: '0.5px'}}>{p.categoria}</small>
                        <Card.Title className="fw-bold fs-6 text-truncate mb-1 text-dark" title={p.nombre_comercial}>{p.nombre_comercial}</Card.Title>
                        <small className="text-muted font-monospace" style={{fontSize:'0.75rem'}}>{p.sku}</small>
                      </div>
                      
                      <div className="mt-auto pt-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="text-primary fw-bold mb-0">{formatPrice(p.precio_venta)}</h5>
                            {/* CAMBIO 2: Badge de stock movido aquí arriba */}
                            <div style={{transform: 'scale(0.9)', transformOrigin: 'right center'}}>{getStatusBadge(p.stock)}</div>
                        </div>
                        
                        {/* CAMBIO 3: Botones de acción rediseñados */}
                        <div className="d-flex gap-2">
                            <Button 
                                variant="primary" 
                                className="flex-grow-1 fw-bold d-flex align-items-center justify-content-center gap-2" 
                                title="Registrar Venta" 
                                onClick={(e) => openSaleModal(e, p)}
                                disabled={p.stock <= 0}
                            >
                                <i className="bi bi-cart-check-fill"></i> VENDER
                            </Button>
                            <Button variant="outline-secondary" className="px-3" title="Copiar Ficha" onClick={(e) => handleCopyPimSheet(e, p.id)}>
                                <i className="bi bi-clipboard"></i>
                            </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            /* VISTA LISTA (Mantenida simple) */
            <Card className="border-0 shadow-sm overflow-hidden bg-white">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light small text-muted text-uppercase">
                            <tr>
                                <th style={{width: 60}}></th>
                                <th>Producto</th>
                                <th className="d-none d-md-table-cell">Detalles</th>
                                <th className="text-end">Precio</th>
                                <th className="text-center">Disponibilidad</th>
                                <th className="text-end" style={{minWidth: 120}}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedProducts.map(p => (
                                <tr key={p.id} style={{cursor: 'pointer'}} onClick={() => { setModalData(p); setCurrentImageIndex(0); setShowModal(true); }}>
                                    <td><div className="bg-white border rounded p-1 d-flex align-items-center justify-content-center" style={{width:48, height:48}}><img src={p.imagen_principal} alt="" style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} /></div></td>
                                    <td>
                                        <div className="fw-bold text-truncate text-dark" style={{maxWidth: 220}}>{p.nombre_comercial}</div>
                                        <div className="small text-muted font-monospace d-md-none">{p.sku}</div>
                                    </td>
                                    <td className="d-none d-md-table-cell small">
                                        <div>{p.marca}</div>
                                        <div className="text-muted font-monospace">{p.sku}</div>
                                    </td>
                                    <td className="text-end fw-bold text-primary">{formatPrice(p.precio_venta)}</td>
                                    <td className="text-center"><div style={{transform: 'scale(0.9)'}}>{getStatusBadge(p.stock)}</div></td>
                                    <td className="text-end">
                                        <div className="d-flex justify-content-end gap-2">
                                            <Button variant="outline-secondary" size="sm" title="Copiar Ficha" onClick={(e) => handleCopyPimSheet(e, p.id)}>
                                                <i className="bi bi-clipboard"></i>
                                            </Button>
                                            <Button 
                                                variant="primary" 
                                                size="sm" 
                                                className="fw-bold px-3"
                                                onClick={(e) => openSaleModal(e, p)}
                                                disabled={p.stock <= 0}
                                            >
                                                VENDER
                                            </Button>
                                        </div>
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
            <div className="d-flex justify-content-center mt-5">
               <Pagination className="shadow-sm">
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

      {/* --- MODAL DETALLE (Actualizado visualmente) --- */}
      {modalData && (
        <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
            <Modal.Header closeButton className="border-bottom-0 pb-0">
                <small className="text-muted text-uppercase">{modalData.categoria}</small>
            </Modal.Header>
            <Modal.Body className="pt-0">
                <h3 className="fw-bold mb-3 text-dark">{modalData.nombre_comercial}</h3>
                <Row>
                    <Col md={6} className="text-center mb-4 mb-md-0">
                        <div className="bg-white border rounded p-3 mb-3 d-flex align-items-center justify-content-center" style={{height: 300}}>
                            <img src={modalData.images[currentImageIndex] || defaultImage} className="img-fluid" style={{maxHeight: '100%', objectFit: 'contain'}} alt="Producto" />
                        </div>
                        {modalData.images.length > 1 && (
                            <div className="d-flex gap-2 justify-content-center overflow-auto">
                                {modalData.images.map((img, i) => (
                                    <div 
                                        key={i}
                                        className={`border rounded p-1 bg-white ${currentImageIndex === i ? 'border-primary' : ''}`}
                                        style={{width: 60, height: 60, cursor: 'pointer'}}
                                        onClick={() => setCurrentImageIndex(i)}
                                    >
                                        <img src={img} style={{width: '100%', height: '100%', objectFit: 'cover'}} alt="thumb"/>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Col>
                    <Col md={6}>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h2 className="text-primary fw-bold m-0">{formatPrice(modalData.precio_venta)}</h2>
                            <div>{getStatusBadge(modalData.stock)}</div>
                        </div>

                        <div className="mb-4">
                            <h6 className="fw-bold">Descripción</h6>
                            <p className="text-muted">{modalData.descripcion}</p>
                        </div>
                        
                        <div className="bg-light p-3 rounded mb-4 border small">
                            <Row className="g-2">
                                <Col xs={6}><strong>Marca:</strong> {modalData.marca}</Col>
                                <Col xs={6}><strong>SKU:</strong> <span className="font-monospace">{modalData.sku}</span></Col>
                                <Col xs={6}><strong>Ubicación:</strong> {modalData.lugar_bodega}</Col>
                                <Col xs={6}><strong>Dimensiones:</strong> {modalData.dimensiones}</Col>
                            </Row>
                        </div>

                        <div className="d-flex gap-2">
                            <Button variant="primary" size="lg" className="flex-grow-1 fw-bold d-flex align-items-center justify-content-center gap-2" onClick={(e) => { setShowModal(false); openSaleModal(e, modalData); }} disabled={modalData.stock <= 0}>
                                <i className="bi bi-cart-check-fill"></i> REGISTRAR VENTA
                            </Button>
                            <Button variant="outline-secondary" size="lg" className="px-3" title="Copiar Ficha" onClick={(e) => handleCopyPimSheet(e, modalData.id)}>
                                <i className="bi bi-clipboard"></i>
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Modal.Body>
        </Modal>
      )}

      {/* --- MODAL DE VENTA RÁPIDA (Sin cambios funcionales, solo estéticos menores) --- */}
      <Modal show={showSaleModal} onHide={() => setShowSaleModal(false)} centered backdrop="static" size="sm">
        <Modal.Header closeButton className="border-bottom-0 pb-0">
            <Modal.Title className="fs-5 fw-bold">Registrar Venta</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {saleProduct && (
                <>
                    <div className="d-flex align-items-center gap-3 mb-3 bg-light p-2 rounded border">
                        <img src={saleProduct.imagen_principal} alt="" style={{width: 50, height: 50, objectFit:'contain'}} className="bg-white rounded border" />
                        <div className="overflow-hidden">
                            <div className="fw-bold text-truncate">{saleProduct.nombre_comercial}</div>
                            <small className="text-muted">Stock actual: {saleProduct.stock}</small>
                        </div>
                    </div>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold small">Cantidad a descontar</Form.Label>
                            <Form.Control 
                                type="number" 
                                min="1" 
                                max={saleProduct.stock} 
                                value={saleQuantity} 
                                onChange={(e) => setSaleQuantity(e.target.value)} 
                                autoFocus
                                size="lg"
                                className="text-center fw-bold text-primary"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="small">Nota (Opcional)</Form.Label>
                            <Form.Control 
                                type="text" 
                                placeholder="Ej: Venta mostrador..." 
                                value={saleReason}
                                onChange={(e) => setSaleReason(e.target.value)}
                                size="sm"
                            />
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

      <Offcanvas show={showFilters} onHide={handleCloseFilters} placement="bottom" className="h-auto rounded-top-4" style={{maxHeight: '85vh'}}>
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title className="fw-bold"><i className="bi bi-funnel-fill me-2"></i>Filtros y Búsqueda</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="pb-4">
          {renderFilters()}
          <div className="d-grid gap-2 mt-4">
             <Button variant="primary" size="lg" onClick={() => setShowFilters(false)}>Ver {filteredAndSortedProducts.length} Resultados</Button>
             <Button variant="outline-danger" onClick={clearAllFilters}>Limpiar Todo</Button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

    </Container>
  );
};

export default ProductGrid;