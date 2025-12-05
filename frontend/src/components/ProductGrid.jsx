import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Form, Button, Pagination, Card, Badge, Container, Row, Col, Spinner, Alert, Offcanvas } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const ProductGrid = () => {
  const { authFetch } = useAuth();
  // --- Estados Originales ---
  const [products, setProducts] = useState([]);
  const [modalData, setModalData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [filterValues, setFilterValues] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('nombre_comercial');
  const [sortOrder, setSortOrder] = useState('asc');
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // --- Estado para el Filtro Móvil ---
  const [showFilters, setShowFilters] = useState(false);

  const defaultImage = '/path/to/default-image.png';

  // --- Carga de Productos (Se ejecuta 1 vez) ---
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch("api/products/");

      if (!response.ok) {
        throw new Error("Error de permisos o conexión");
      }

      const data = await response.json();
      
      const productsArray = data.results || data;
      
      // Procesa los productos (como en tu versión original)
      setProducts(productsArray.map(product => ({
        ...product,
        imagen_principal: product.images?.find(img => img.is_principal)?.image || product.images?.[0]?.image || defaultImage,
        marca: product.brand?.name || 'Sin marca',
        categoria: product.category?.name || 'Sin categoría',
        proveedor: product.provider?.name || 'Sin proveedor',
        images: product.images?.map(img => img.image) || [],
      })));
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Funciones para el Offcanvas ---
  const handleCloseFilters = () => setShowFilters(false);
  const handleShowFilters = () => setShowFilters(true);

  // --- Funciones de tu versión original ---
  const getUniqueValues = (key) => [...new Set(products.map((item) => item[key]))].filter(Boolean);

  const handleProductClick = (product) => {
    setModalData({
      ...product,
      images: product.images.filter(Boolean),
    });
    setCurrentImageIndex(0);
    setShowModal(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % modalData.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? modalData.images.length - 1 : prevIndex - 1
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(price || 0);
  };

  const formatDimensions = (dimensions) => {
    if (!dimensions) return 'No especificado';
    const parts = dimensions.split('x').map(s => s.trim());
    const [alto, largo, ancho] = parts;
    return (
      <ul className="list-unstyled mb-0">
        <li>Alto: {alto || '?'} cm</li>
        <li>Largo: {largo || '?'} cm</li>
        <li>Ancho: {ancho || '?'} cm</li>
      </ul>
    );
  };

  const getRatingVariant = (rating) => {
    const r = parseFloat(rating);
    if (r === 5.0) return 'primary';
    else if (r >= 4.0) return 'success';
    else if (r >= 3.1) return 'warning';
    else return 'danger';
  };

  // --- Lógica de Filtrado (Client-Side) ---
  const filteredAndSortedProducts = useMemo(() => {
    const trimmedSearchTerm = searchTerm.trim().toLowerCase();
    let filtered = products.filter((product) => {
      const searchMatch = trimmedSearchTerm === '' || 
        (product.nombre_comercial || '').toLowerCase().includes(trimmedSearchTerm) ||
        (product.ean || '').toLowerCase().includes(trimmedSearchTerm) ||
        (product.sku || '').toLowerCase().includes(trimmedSearchTerm);
      
      const filterMatch = Object.entries(filterValues).every(([key, value]) =>
        !value || product[key.toLowerCase()] === value
      );
      
      return searchMatch && filterMatch;
    });

    filtered.sort((a, b) => {
      let aVal = a[sortBy] || '';
      let bVal = b[sortBy] || '';
      
      if (sortBy === 'precio_venta' || sortBy === 'stock' || sortBy === 'rating') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [products, searchTerm, filterValues, sortBy, sortOrder]);

  const effectiveItemsPerPage = itemsPerPage === 'Todos' ? filteredAndSortedProducts.length : parseInt(itemsPerPage, 10);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * effectiveItemsPerPage;
    return filteredAndSortedProducts.slice(startIndex, startIndex + effectiveItemsPerPage);
  }, [filteredAndSortedProducts, currentPage, effectiveItemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / effectiveItemsPerPage);

  const handleFilterChange = (key, value) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterValues({});
    setCurrentPage(1);
  };

  const getStatusBadge = (stock) => {
    if (stock === 0) return <Badge bg="danger">Agotado</Badge>;
    else if (stock > 0 && stock < 10) return <Badge bg="warning">Pocas unidades</Badge>;
    else return <Badge bg="success">Disponible</Badge>;
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value === 'Todos' ? 'Todos' : parseInt(value));
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="success" size="lg" />
          <p className="mt-3 text-muted">Cargando productos...</p>
        </div>
      </div>
    );
  }

  // --- Componente de Filtros Reutilizable ---
  // (Definido aquí para pasarlo al desktop y al offcanvas)
  const renderFilterControls = (isMobile = false) => (
    <Row className="g-3">
      <Col xs={12}>
        <Form.Group>
          <Form.Label className="fw-semibold mb-2">Buscar Producto</Form.Label>
          <div className="position-relative">
            <Form.Control
              type="text"
              placeholder="Nombre, EAN o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} // Esto es rápido y no pierde foco
              className="ps-5 rounded-pill border-2"
            />
            <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
          </div>
        </Form.Group>
      </Col>
      <Col xs={12} md={isMobile ? 12 : 2}>
        <Form.Group>
          <Form.Label className="fw-semibold mb-2">Categoría</Form.Label>
          <Form.Select
            value={filterValues.categoria || ''}
            onChange={(e) => handleFilterChange('categoria', e.target.value)}
            className="rounded-pill border-2"
          >
            <option value="">Todas</option>
            {getUniqueValues('categoria').map((value, i) => (
              <option key={i} value={value}>{value}</option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>
      <Col xs={12} md={isMobile ? 12 : 2}>
        <Form.Group>
          <Form.Label className="fw-semibold mb-2">Marca</Form.Label>
          <Form.Select
            value={filterValues.marca || ''}
            onChange={(e) => handleFilterChange('marca', e.target.value)}
            className="rounded-pill border-2"
          >
            <option value="">Todas</option>
            {getUniqueValues('marca').map((value, i) => (
              <option key={i} value={value}>{value}</option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>
      <Col xs={6} md={isMobile ? 6 : 2}>
        <Form.Group>
          <Form.Label className="fw-semibold mb-2">Ordenar por</Form.Label>
          <Form.Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-pill border-2"
          >
            <option value="nombre_comercial">Nombre</option>
            <option value="precio_venta">Precio</option>
            <option value="stock">Stock</option>
            <option value="rating">Rating</option>
          </Form.Select>
        </Form.Group>
      </Col>
      <Col xs={6} md={isMobile ? 6 : 2}>
        <Form.Group>
          <Form.Label className="fw-semibold mb-2">Orden</Form.Label>
          <Form.Select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="rounded-pill border-2"
          >
            <option value="asc">Ascendente</option>
            <option value="desc">Descendente</option>
          </Form.Select>
        </Form.Group>
      </Col>
      {/* Ocultamos el selector de vista en el offcanvas móvil */}
      {!isMobile && (
        <Col xs={6} md={1}>
          <Form.Group>
            <Form.Label className="fw-semibold mb-2">Vista</Form.Label>
            <Form.Select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="rounded-pill border-2"
            >
              <option value="grid">Grid</option>
              <option value="list">Lista</option>
            </Form.Select>
          </Form.Group>
        </Col>
      )}
      <Col xs={12} md={isMobile ? 12 : 3}>
        <Row className="g-3">
           <Col xs={6}>
            <Form.Group>
              <Form.Label className="fw-semibold mb-2">Por página</Form.Label>
              <Form.Select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(e.target.value)}
                className="rounded-pill border-2"
              >
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="Todos">Todos</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col xs={6} className="d-flex align-items-end">
            <Button variant="outline-secondary" size="sm" className="rounded-pill w-100" onClick={clearAllFilters}>
              Limpiar
            </Button>
          </Col>
        </Row>
      </Col>
    </Row>
  );

  return (
    <Container fluid className="mt-4">
      {/* --- FILTROS DE ESCRITORIO --- */}
      {/* Oculto en móvil (d-none), visible en desktop (d-lg-block) */}
      <div className="bg-body p-4 rounded-3 shadow-sm mb-4 sticky-top d-none d-lg-block" style={{ top: '60px', zIndex: 1000 }}>
        {renderFilterControls(false)}
      </div>

      {/* --- BOTÓN DE FILTROS MÓVIL --- */}
      {/* Visible en móvil (d-lg-none) */}
      <Button
        variant="outline-success"
        className="d-lg-none w-100 mb-3"
        onClick={handleShowFilters}
      >
        <i className="bi bi-funnel-fill me-2"></i>
        Mostrar Filtros
      </Button>

      {paginatedProducts.length === 0 && (
        <Alert variant="info" className="text-center">
          No se encontraron productos con los filtros aplicados.
        </Alert>
      )}

      {viewMode === 'grid' ? (
        <Row className="g-4">
          {paginatedProducts.map((product) => (
            <Col key={product.id} xs={6} md={4} lg={3}> {/* Col 6 para mejor vista móvil */}
              <Card
                className="h-100 shadow-sm border-0 rounded-3 overflow-hidden cursor-pointer transition-all"
                onClick={() => handleProductClick(product)}
                style={{ transition: 'transform 0.3s ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div className="position-relative">
                  <Card.Img
                    variant="top"
                    src={product.imagen_principal}
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                  <div className="position-absolute top-0 end-0 m-2">
                    {getStatusBadge(product.stock)}
                  </div>
                </div>
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="fw-bold text-truncate">{product.nombre_comercial}</Card.Title>
                  <Card.Text className="text-muted small mb-2">{product.marca} • {product.categoria}</Card.Text>
                  <div className="mt-auto d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-success">{formatPrice(product.precio_venta)}</span>
                    {product.rating && (
                      <Badge bg={getRatingVariant(product.rating)}>⭐ {product.rating}</Badge>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover table-striped align-middle">
            <thead className="table-dark">
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Marca</th>
                <th>Categoría</th>
                <th>SKU</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product) => (
                <tr key={product.id} onClick={() => handleProductClick(product)} style={{ cursor: 'pointer' }}>
                  <td>
                    <img
                      src={product.imagen_principal}
                      alt={product.nombre_comercial}
                      className="rounded"
                      style={{ width: '50px', height: '50px', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    />
                  </td>
                  <td>
                    <div className="fw-semibold">{product.nombre_comercial}</div>
                    <small className="text-muted">{product.descripcion?.substring(0, 50)}...</small>
                  </td>
                  <td>{product.marca}</td>
                  <td>
                    <Badge bg="secondary" className="rounded-pill">{product.categoria}</Badge>
                  </td>
                  <td><code>{product.sku}</code></td>
                  <td className="fw-bold text-success">{formatPrice(product.precio_venta)}</td>
                  <td>{product.stock}</td>
                  <td>{getStatusBadge(product.stock)}</td>
                  <td>
                    <Badge bg={getRatingVariant(product.rating)}>{product.rating ? `⭐ ${product.rating}` : 'Sin rating'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Paginación --- */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-5">
          <Pagination size="lg">
            {/* ... (tu lógica de paginación es correcta) ... */}
            <Pagination.First
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            />
            <Pagination.Prev
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            />
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (pageNum <= totalPages) {
                return (
                  <Pagination.Item
                    key={pageNum}
                    active={pageNum === currentPage}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Pagination.Item>
                );
              }
              return null;
            })}
            <Pagination.Next
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            />
            <Pagination.Last
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            />
          </Pagination>
        </div>
      )}
      
      {/* --- Modal (Sin Cambios) --- */}
      {modalData && showModal && (
        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          centered
          size="xl"
          className="product-modal"
        >
          <Modal.Header closeButton className="bg-success text-white">
            <Modal.Title className="d-flex align-items-center gap-3">
              <i className="bi bi-box-seam"></i>
              <div>
                <div className="fs-5">{modalData.nombre_comercial}</div>
                <small className="opacity-75">SKU: {modalData.sku} • EAN: {modalData.ean}</small>
              </div>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Row className="g-4">
              <Col md={6}>
                <div className="text-center">
                  <div className="position-relative mb-3">
                    <img
                      src={modalData.images[currentImageIndex] || defaultImage}
                      alt={modalData.nombre_comercial}
                      className="img-fluid rounded-3 shadow-sm"
                      style={{ maxHeight: '400px', width: '100%', objectFit: 'contain' }}
                    />
                    {modalData.images.length > 1 && (
                      <>
                        <Button
                          variant="light"
                          className="position-absolute top-50 start-0 translate-middle-y ms-2 rounded-circle"
                          style={{ width: '40px', height: '40px' }}
                          onClick={prevImage}
                        >
                          <i className="bi bi-chevron-left"></i>
                        </Button>
                        <Button
                          variant="light"
                          className="position-absolute top-50 end-0 translate-middle-y me-2 rounded-circle"
                          style={{ width: '40px', height: '40px' }}
                          onClick={nextImage}
                        >
                          <i className="bi bi-chevron-right"></i>
                        </Button>
                      </>
                    )}
                  </div>
                  {modalData.images.length > 1 && (
                    <div className="d-flex justify-content-center gap-2 flex-wrap">
                      {modalData.images.map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`Vista ${index + 1}`}
                          className={`rounded cursor-pointer shadow-sm ${
                            currentImageIndex === index ? 'border border-success border-3' : 'border'
                          }`}
                          style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                          onClick={() => setCurrentImageIndex(index)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Col>
              <Col md={6}>
                <div className="h-100 d-flex flex-column">
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="text-success mb-2">{modalData.marca}</h5>
                        <Badge bg="secondary" className="rounded-pill mb-2">{modalData.categoria}</Badge>
                      </div>
                      <div className="text-end">
                        {getStatusBadge(modalData.stock)}
                        {modalData.rating && (
                          <div className="mt-1">
                            <Badge bg={getRatingVariant(modalData.rating)}>⭐ {modalData.rating}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="fs-3 fw-bold text-success mb-3">{formatPrice(modalData.precio_venta)}</div>
                    <p className="text-muted mb-3">{modalData.descripcion}</p>
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="border-bottom pb-2 mb-3">Especificaciones</h6>
                    <Row className="g-2 small">
                      <Col sm={6}><strong>Peso:</strong> {modalData.peso ? `${modalData.peso} kg` : 'No especificado'}</Col>
                      <Col sm={6}><strong>Dimensiones:</strong> {formatDimensions(modalData.dimensiones)}</Col>
                      <Col sm={6}><strong>Costo CG:</strong> {formatPrice(modalData.costo_cg)}</Col>
                      <Col sm={6}><strong>Edad de Uso:</strong> {modalData.edad_uso || 'No especificado'}</Col>
                      <Col sm={6}><strong>Stock:</strong> {modalData.stock} unidades</Col>
                      <Col sm={6}><strong>Ubicación:</strong> {modalData.lugar_bodega || 'No especificado'}</Col>
                      <Col sm={12}><strong>Proveedor:</strong> {modalData.proveedor}</Col>
                    </Row>
                  </div>
                </div>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="bg-body-tertiary">
            <div className="d-flex justify-content-between w-100 align-items-center">
              <div className="text-muted small">
                Imagen {currentImageIndex + 1} de {modalData.images.length}
              </div>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cerrar
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      )}

      {/* --- OFFCANVAS (MÓVIL) --- */}
      {/* Oculto en desktop (d-lg-none) */}
      <Offcanvas 
        show={showFilters} 
        onHide={handleCloseFilters} 
        placement="bottom"
        className="d-lg-none"
        style={{ height: 'auto' }}
      >
        <Offcanvas.Header closeButton>
          {/* --- CORRECCIÓN DEL ERROR DE TIPEO --- */}
          <Offcanvas.Title><i className="bi bi-funnel-fill me-2"></i> Filtros</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {renderFilterControls(true)} {/* Llama a los filtros en modo móvil */}
          <Button variant="success" className="w-100 mt-4" onClick={handleCloseFilters}>
            Ver Resultados
          </Button>
        </Offcanvas.Body>
      </Offcanvas>

    </Container>
  );
};

export default ProductGrid;