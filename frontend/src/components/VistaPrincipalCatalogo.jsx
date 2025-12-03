import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Form, InputGroup, Button, Spinner, Badge, Modal } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function VistaPrincipalCatalogo() {
  const { authFetch, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSheet, setShowSheet] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    document.title = "Catálogo - Bodegas Salas";
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/products/");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.results || data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
      p.nombre_comercial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(price || 0);

  const handleCopySheet = (product) => {
      const text = `📦 *${product.nombre_comercial}*\n` +
                   `🆔 SKU: ${product.sku}\n` +
                   `💰 Precio: ${formatPrice(product.precio_venta)}\n` +
                   `📝 Desc: ${product.descripcion || "Sin descripción"}\n` +
                   `📏 Dims: ${product.dimensiones || "N/A"}`;

      navigator.clipboard.writeText(text);
      alert("¡Ficha técnica copiada al portapapeles! 📋");
  };

  const handleLogout = () => {
      logout();
      navigate('/login');
  };

  return (
    <Container fluid className="bg-light min-vh-100 p-0">
        {/* Navbar for Seller */}
        <div className="bg-white shadow-sm p-3 mb-4 d-flex justify-content-between align-items-center px-4">
            <h4 className="mb-0 text-primary fw-bold"><i className="bi bi-box-seam"></i> Catálogo Digital</h4>
            <div className="d-flex align-items-center gap-3">
                 <span className="text-muted d-none d-md-block">Modo Vendedor</span>
                 <Button variant="outline-danger" size="sm" onClick={handleLogout}>Salir</Button>
            </div>
        </div>

        <Container>
            {/* Search Bar */}
            <div className="mb-4">
                <InputGroup size="lg">
                    <InputGroup.Text className="bg-white border-end-0"><i className="bi bi-search text-muted"></i></InputGroup.Text>
                    <Form.Control
                        placeholder="Buscar por nombre o SKU..."
                        className="border-start-0 shadow-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </InputGroup>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                </div>
            ) : (
                <Row className="g-4">
                    {filteredProducts.map(product => (
                        <Col key={product.id} xs={12} sm={6} md={4} lg={3}>
                            <Card className="h-100 border-0 shadow-sm product-card hover-shadow">
                                <div className="position-relative" style={{height: '200px'}}>
                                    {product.images && product.images.length > 0 ? (
                                        <Card.Img
                                            variant="top"
                                            src={product.images[0]} // Serializer returns string URL list for seller
                                            className="h-100 w-100 object-fit-cover"
                                        />
                                    ) : (
                                        <div className="h-100 w-100 bg-light d-flex align-items-center justify-content-center text-muted">
                                            <i className="bi bi-image fs-1"></i>
                                        </div>
                                    )}
                                    <Badge bg={product.stock > 0 ? "success" : "danger"} className="position-absolute top-0 end-0 m-2">
                                        {product.stock > 0 ? `${product.stock} un.` : "Agotado"}
                                    </Badge>
                                </div>
                                <Card.Body className="d-flex flex-column">
                                    <small className="text-muted mb-1">{product.brand_name} | {product.category_name}</small>
                                    <Card.Title className="fs-6 fw-bold mb-1">{product.nombre_comercial}</Card.Title>
                                    <Card.Text className="text-primary fw-bold fs-5 mb-3">
                                        {formatPrice(product.precio_venta)}
                                    </Card.Text>

                                    <div className="mt-auto d-grid gap-2">
                                        <Button variant="primary" size="sm" onClick={() => { setSelectedProduct(product); setShowSheet(true); }}>
                                            <i className="bi bi-eye"></i> Ver Detalle
                                        </Button>
                                        <Button variant="outline-success" size="sm" onClick={() => handleCopySheet(product)}>
                                            <i className="bi bi-whatsapp"></i> Copiar Ficha
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>

        {/* Product Detail Modal */}
        <Modal show={showSheet} onHide={() => setShowSheet(false)} centered size="lg">
            {selectedProduct && (
                <>
                <Modal.Header closeButton>
                    <Modal.Title>{selectedProduct.nombre_comercial}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col md={6}>
                             {selectedProduct.images && selectedProduct.images.length > 0 ? (
                                <img src={selectedProduct.images[0]} alt="" className="img-fluid rounded" />
                             ) : (
                                <div className="bg-light p-5 text-center">Sin imagen</div>
                             )}
                        </Col>
                        <Col md={6}>
                            <h4 className="text-primary">{formatPrice(selectedProduct.precio_venta)}</h4>
                            <hr/>
                            <p><strong>SKU:</strong> {selectedProduct.sku}</p>
                            <p><strong>Marca:</strong> {selectedProduct.brand_name}</p>
                            <p><strong>Stock:</strong> {selectedProduct.stock} unidades</p>
                            <p><strong>Dimensiones:</strong> {selectedProduct.dimensiones}</p>
                            <p><strong>Descripción:</strong></p>
                            <p className="text-muted small">{selectedProduct.descripcion}</p>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="success" onClick={() => handleCopySheet(selectedProduct)}>
                        <i className="bi bi-clipboard"></i> Copiar para Cliente
                    </Button>
                    <Button variant="secondary" onClick={() => setShowSheet(false)}>Cerrar</Button>
                </Modal.Footer>
                </>
            )}
        </Modal>
    </Container>
  );
}

export default VistaPrincipalCatalogo;
