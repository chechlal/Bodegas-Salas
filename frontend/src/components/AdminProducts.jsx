import React, { useEffect, useRef, useState } from "react";
import { Table, Button, Modal, Form, Spinner, Row, Col, Image, Alert, Badge } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";

function AdminProducts({ theme }) {
  const { authFetch } = useAuth();
  const hasLoaded = useRef(false);

  useEffect(() => {
    document.title = "Panel de Administración - Bodegas Salas";
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      loadProducts();
      loadOptions();
    }
  }, []);

  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Product Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);

  // Modals for Attributes
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);

  // Stock Movement Modal
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockFormData, setStockFormData] = useState({ quantity: 1, type: 'IN', reason: '' });
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);

  // New Entries
  const [newBrandName, setNewBrandName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newProviderName, setNewProviderName] = useState("");

  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState("");

  // Dimensions
  const [alto, setAlto] = useState("");
  const [largo, setLargo] = useState("");
  const [ancho, setAncho] = useState("");

  // Images
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [principal, setPrincipal] = useState(null);

  const [error, setError] = useState(null);
  const [warn, setWarn] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ entity: null, id: null, name: "", input: "" });

  const formatPrice = (price) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(price || 0);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/products/");
      if (!res.ok){
        const errorData = await res.json();
        throw new Error(errorData.detail || "Error al cargar productos.");
      }

      const data = await res.json();
      setProducts(data.results || data);
    } catch (e) {
      console.error("Error cargando productos", e);
      setError("Error al cargar productos.");
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const [brandsRes, categoriesRes, providersRes] = await Promise.all([
        authFetch("/api/brands/"),
        authFetch("/api/categories/"),
        authFetch("/api/providers/"),
      ]);

      if (!brandsRes.ok || !categoriesRes.ok || !providersRes.ok) {
        throw new Error("Error al cargar las opciones de filtros.");
      }

      const brandsData = await brandsRes.json();
      const categoriesData = await categoriesRes.json();
      const providersData = await providersRes.json();
      setBrands(brandsData.results || brandsData);
      setCategories(categoriesData.results || categoriesData);
      setProviders(providersData.results || providersData);
    } catch (e) {
      console.error("Error cargando opciones", e);
      setError("Error al cargar opciones.");
    }
  };

  // ... (Keep existing modal openers/handlers but update setFormData to exclude 'stock' edit if needed) ...

  const openNewModal = () => {
    setEditingId(null);
    setFormData({
      nombre_comercial: "",
      ean: "",
      sku: "",
      // Stock is read-only for new products (starts at 0)
      stock: 0,
      precio_venta: 0,
      costo_cg: 0,
      peso: 0,
      rating: 0,
      lugar_bodega: "",
      edad_uso: "",
      descripcion: "",
      brand_id: "",
      category_id: "",
      provider_id: "",
    });
    setAlto("");
    setLargo("");
    setAncho("");
    setExistingImages([]);
    setNewImages([]);
    setPreviews([]);
    setPrincipal(null);
    setError(null);
    setWarn(null);
    setShowModal(true);
  };

  const handleEdit = async (product) => {
    setError(null);
    setWarn(null);
    setFormData({
      ...product,
      brand_id: product.brand?.id || "",
      category_id: product.category?.id || "",
      provider_id: product.provider?.id || "",
    });

    const dims = (product.dimensiones || "").split("x").map(s => s.trim());
    setAlto(dims[0] || "");
    setLargo(dims[1] || "");
    setAncho(dims[2] || "");

    setEditingId(product.id);

    try {
      const imagesRes = await authFetch(`/api/product-images/?search=${product.id}`);
      const imagesData = await imagesRes.json();
      const list = imagesData.results || imagesData || [];
      setExistingImages(list);
      setPreviews(list.map(img => ({ kind: "existing", url: img.image, id: img.id })));
      const principalFound = list.find(img => img.is_principal);
      setPrincipal(principalFound ? { kind: "existing", value: principalFound.id } : null);
    } catch (e) {
      console.error("Error cargando imágenes", e);
      setError("Error al cargar imágenes del producto.");
    }

    setNewImages([]);
    setShowModal(true);
  };

  const setField = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Image handlers (Keep same)
  const addFiles = (files) => {
    const arr = Array.from(files || []).filter(file => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024);
    if (arr.length === 0) {
      setError("Por favor, seleccione archivos de imagen válidos (máximo 5MB cada uno).");
      return;
    }
    const total = existingImages.length + newImages.length + arr.length;
    const limit = 5;
    if (total > limit) {
      setError(`Máximo ${limit} imágenes permitidas por producto.`);
      return;
    }
    const newPrev = arr.map((file, idx) => ({
      kind: "new",
      url: URL.createObjectURL(file),
      idx: newImages.length + idx,
    }));
    setNewImages(prev => [...prev, ...arr]);
    setPreviews(prev => [...prev, ...newPrev]);
  };

  const handleRemovePreview = (pv) => {
    if (pv.kind === "existing") {
      setExistingImages(prev => prev.filter(img => img.id !== pv.id));
      setPreviews(prev => prev.filter(p => !(p.kind === "existing" && p.id === pv.id)));
      if (principal?.kind === "existing" && principal.value === pv.id) setPrincipal(null);
    } else {
      setNewImages(prev => prev.filter((_, i) => i !== pv.idx));
      const rest = previews.filter(p => !(p.kind === "new" && p.idx === pv.idx));
      const renumbered = rest.map((p, index) => (p.kind === "new" ? { ...p, idx: index } : p));
      setPreviews(renumbered);
      if (principal?.kind === "new" && principal.value === pv.idx) setPrincipal(null);
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      const res = await authFetch(`/api/product-images/${imageId}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error eliminando imagen");
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
      setPreviews(prev => prev.filter(p => !(p.kind === "existing" && p.id === imageId)));
      if (principal?.kind === "existing" && principal.value === imageId) setPrincipal(null);
    } catch (e) {
      console.error("Error eliminando imagen", e);
      setError("Error al eliminar la imagen.");
    }
  };

  const sanitizedPayload = () => {
    let dimensiones = "";
    const a = parseFloat(alto);
    const l = parseFloat(largo);
    const an = parseFloat(ancho);
    if (!isNaN(a) && !isNaN(l) && !isNaN(an)) {
      dimensiones = `${a} x ${l} x ${an}`;
    }

    const {
      id, brand, category, provider, images, created_at, updated_at,
      brand_id, category_id, provider_id, stock, // Remove stock from payload
      ...rest
    } = formData;

    return {
      ...rest,
      dimensiones,
      brand_id: brand_id || undefined,
      category_id: category_id || undefined,
      provider_id: provider_id || undefined,
    };
  };

  const handleSave = async () => {
    setError(null);
    setWarn(null);

    try {
      const nums = ["precio_venta", "costo_cg", "peso", "rating"];
      for (const k of nums) {
        const v = formData[k];
        if (v != null && Number(v) < 0) throw new Error("Los valores numéricos no pueden ser negativos.");
      }
      if (formData.rating > 5) throw new Error("El rating no puede exceder 5.");
      const required = ["nombre_comercial", "ean", "sku", "brand_id", "category_id", "provider_id"];
      const missing = required.filter(k => !formData[k] || formData[k] === "");
      if (missing.length > 0) {
        throw new Error(`Campos requeridos faltantes.`);
      }

      const payload = sanitizedPayload();
      const isEdit = Boolean(editingId);
      const url = isEdit ? `/api/products/${editingId}/` : "/api/products/";
      const res = await authFetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Error guardando producto: ${JSON.stringify(errorData)}`);
      }
      const saved = await res.json();
      const productId = saved.id || editingId;

      // Handle Images (Keep same logic)
      for (const img of existingImages) {
        const shouldBePrincipal = principal?.kind === "existing" && principal.value === img.id;
        const patchRes = await authFetch(`/api/product-images/${img.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_principal: !!shouldBePrincipal }),
        });
      }

      for (let i = 0; i < newImages.length; i++) {
          const formDataImg = new FormData();
          formDataImg.append("image", newImages[i]);
          formDataImg.append("product", productId);
          const isPrincipal = principal?.kind === "new" && principal.value === i;
          formDataImg.append("is_principal", isPrincipal ? "true" : "false");
          await authFetch("/api/product-images/", {
              method: "POST",
              body: formDataImg,
          });
      }

      previews.filter(p => p.kind === "new").forEach(p => URL.revokeObjectURL(p.url));
      await loadProducts();
      setShowModal(false);
    } catch (e) {
      console.error("Error en handleSave:", e);
      setError(e.message || "Error inesperado al guardar el producto.");
    }
  };

  // ... (Keep handleSaveBrand, handleSaveCategory, handleSaveProvider, and delete logics as is) ...
  const handleSaveBrand = async () => { /* ... same ... */
      if (!newBrandName.trim()) { setError("El nombre de la marca es requerido."); return; }
      try {
        const res = await authFetch("/api/brands/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newBrandName }) });
        if (!res.ok) throw new Error();
        setNewBrandName(""); setShowBrandModal(false); loadOptions();
      } catch (e) { setError("Error al guardar la marca."); }
  };
  const handleSaveCategory = async () => { /* ... same ... */
      if (!newCategoryName.trim()) { setError("El nombre es requerido."); return; }
      try {
        const res = await authFetch("/api/categories/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCategoryName }) });
        if (!res.ok) throw new Error();
        setNewCategoryName(""); setShowCategoryModal(false); loadOptions();
      } catch (e) { setError("Error al guardar la categoría."); }
  };
  const handleSaveProvider = async () => { /* ... same ... */
      if (!newProviderName.trim()) { setError("El nombre es requerido."); return; }
      try {
        const res = await authFetch("/api/providers/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newProviderName }) });
        if (!res.ok) throw new Error();
        setNewProviderName(""); setShowProviderModal(false); loadOptions();
      } catch (e) { setError("Error al guardar el proveedor."); }
  };
  const handleDelete = async (productId) => {
    if (window.confirm("¿Está seguro de que desea eliminar este producto?")) {
      try {
        const res = await authFetch(`/api/products/${productId}/`, { method: "DELETE" });
        if (!res.ok) throw new Error("Error al eliminar el producto.");
        setProducts(prev => prev.filter(product => product.id !== productId));
        setError(null);
        setWarn("Producto eliminado exitosamente.");
      } catch (e) {
        console.error("Error eliminando producto", e);
        setError("Error al eliminar el producto.");
      }
    }
  };


  // Stock Management Logic
  const openStockModal = (product) => {
      setSelectedProductForStock(product);
      setStockFormData({ quantity: 1, type: 'IN', reason: '' });
      setShowStockModal(true);
  };

  const handleSaveStock = async () => {
      if (!selectedProductForStock) return;

      try {
          const payload = {
              product: selectedProductForStock.id,
              quantity: stockFormData.quantity,
              movement_type: stockFormData.type,
              reason: stockFormData.reason || "Movimiento Manual Admin"
          };

          const res = await authFetch("/api/stock-movements/", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
          });

          if (!res.ok) {
              const err = await res.json();
              throw new Error(err.detail || JSON.stringify(err));
          }

          // Refresh products to show new stock
          await loadProducts();
          setShowStockModal(false);
          setWarn("Movimiento de stock registrado exitosamente.");
      } catch (e) {
          console.error(e);
          setError(`Error al registrar movimiento: ${e.message}`);
      }
  };

  return (
    <div className="container mt-5 p-4 bg-white rounded shadow-sm">
      {loading ? (
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Cargando catálogo...</p>
        </div>
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0">Gestión de Productos</h2>
              <Button variant="success" onClick={openNewModal}>
                  <i className="bi bi-plus-lg me-2"></i> Nuevo Producto
              </Button>
          </div>

          {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
          {warn && <Alert variant="success" onClose={() => setWarn(null)} dismissible>{warn}</Alert>}

          <div className="mb-4 d-flex gap-2">
            <Button variant="outline-secondary" size="sm" onClick={() => { setNewBrandName(""); setShowBrandModal(true); setSelectedBrandId(""); }}>
              Marcas
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={() => { setNewCategoryName(""); setShowCategoryModal(true); setSelectedCategoryId(""); }}>
              Categorías
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={() => { setNewProviderName(""); setShowProviderModal(true); setSelectedProviderId(""); }}>
              Proveedores
            </Button>
          </div>

          <Table hover responsive className="align-middle">
            <thead className="table-light">
              <tr>
                <th style={{width: '60px'}}>Img</th>
                <th>Producto</th>
                <th>Datos</th>
                <th>Stock</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    {product.images?.find(img => img.is_principal)?.image ? (
                      <Image
                        src={product.images.find(img => img.is_principal).image}
                        rounded
                        style={{ width: "40px", height: "40px", objectFit: "cover" }}
                      />
                    ) : (
                        <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                            <i className="bi bi-image text-muted"></i>
                        </div>
                    )}
                  </td>
                  <td>
                      <div className="fw-bold">{product.nombre_comercial}</div>
                      <small className="text-muted">SKU: {product.sku}</small>
                  </td>
                  <td>
                      <small>
                      {product.brand?.name} | {product.category?.name}<br/>
                      {formatPrice(product.precio_venta)}
                      </small>
                  </td>
                  <td>
                      <div className="d-flex align-items-center">
                        <Badge bg={product.stock < 5 ? 'danger' : 'success'} className="me-2">
                            {product.stock}
                        </Badge>
                        <Button variant="link" size="sm" className="p-0 text-decoration-none" onClick={() => openStockModal(product)}>
                            <i className="bi bi-arrow-left-right"></i>
                        </Button>
                      </div>
                  </td>
                  <td className="text-end">
                    <Button variant="outline-primary" size="sm" className="me-1" onClick={() => handleEdit(product)}>
                      <i className="bi bi-pencil"></i>
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(product.id)}>
                      <i className="bi bi-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* Product Modal */}
          <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
            <Modal.Header closeButton>
              <Modal.Title>{editingId ? "Editar Producto" : "Nuevo Producto"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                {/* Simplified form layout for brevity, keep your existing fields */}
                <Row className="g-3">
                    <Col md={8}>
                        <Form.Group>
                            <Form.Label>Nombre</Form.Label>
                            <Form.Control value={formData.nombre_comercial} onChange={e => setField('nombre_comercial', e.target.value)} required />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                         <Form.Group>
                            <Form.Label>SKU</Form.Label>
                            <Form.Control value={formData.sku} onChange={e => setField('sku', e.target.value)} required />
                        </Form.Group>
                    </Col>

                    <Col md={4}>
                        <Form.Label>Marca</Form.Label>
                        <Form.Select value={formData.brand_id} onChange={e => setField('brand_id', e.target.value)}>
                            <option value="">Seleccionar...</option>
                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </Form.Select>
                    </Col>
                    <Col md={4}>
                        <Form.Label>Categoría</Form.Label>
                        <Form.Select value={formData.category_id} onChange={e => setField('category_id', e.target.value)}>
                            <option value="">Seleccionar...</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Form.Select>
                    </Col>
                    <Col md={4}>
                        <Form.Label>Proveedor</Form.Label>
                        <Form.Select value={formData.provider_id} onChange={e => setField('provider_id', e.target.value)}>
                            <option value="">Seleccionar...</option>
                            {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </Form.Select>
                    </Col>

                    <Col md={4}>
                        <Form.Label>Precio Venta</Form.Label>
                        <Form.Control type="number" value={formData.precio_venta} onChange={e => setField('precio_venta', e.target.value)} />
                    </Col>
                    <Col md={4}>
                        <Form.Label>Costo</Form.Label>
                        <Form.Control type="number" value={formData.costo_cg} onChange={e => setField('costo_cg', e.target.value)} />
                    </Col>
                    <Col md={4}>
                        <Form.Label>EAN</Form.Label>
                        <Form.Control value={formData.ean} onChange={e => setField('ean', e.target.value)} />
                    </Col>

                    {/* Stock is read only here */}
                    <Col md={12}>
                        <Alert variant="info" className="py-1"><small>El stock se gestiona mediante movimientos, no edición directa.</small></Alert>
                    </Col>

                    <Col md={12}>
                        <Form.Label>Imágenes</Form.Label>
                        <Form.Control type="file" multiple onChange={e => addFiles(e.target.files)} />
                        <div className="d-flex gap-2 mt-2">
                             {previews.map((pv, i) => (
                                 <div key={i} className="position-relative">
                                     <Image src={pv.url} style={{width: 60, height: 60, objectFit: 'cover'}} rounded />
                                     <Button size="sm" variant="danger" className="position-absolute top-0 end-0 p-0" style={{width: 20, height: 20, fontSize: 10}} onClick={() => pv.kind === 'existing' ? handleDeleteImage(pv.id) : handleRemovePreview(pv)}>x</Button>
                                 </div>
                             ))}
                        </div>
                    </Col>
                </Row>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSave}>Guardar</Button>
            </Modal.Footer>
          </Modal>

          {/* Stock Movement Modal */}
          <Modal show={showStockModal} onHide={() => setShowStockModal(false)} centered>
             <Modal.Header closeButton>
                 <Modal.Title>Gestionar Stock: {selectedProductForStock?.sku}</Modal.Title>
             </Modal.Header>
             <Modal.Body>
                 <Form>
                     <Form.Group className="mb-3">
                         <Form.Label>Tipo de Movimiento</Form.Label>
                         <Form.Select
                            value={stockFormData.type}
                            onChange={e => setStockFormData({...stockFormData, type: e.target.value})}
                         >
                             <option value="IN">Entrada (+)</option>
                             <option value="OUT">Salida (-)</option>
                             <option value="ADJUST">Ajuste de Pérdida (-)</option>
                         </Form.Select>
                     </Form.Group>
                     <Form.Group className="mb-3">
                         <Form.Label>Cantidad</Form.Label>
                         <Form.Control
                            type="number"
                            min="1"
                            value={stockFormData.quantity}
                            onChange={e => setStockFormData({...stockFormData, quantity: parseInt(e.target.value)})}
                         />
                     </Form.Group>
                     <Form.Group className="mb-3">
                         <Form.Label>Motivo</Form.Label>
                         <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder="Ej: Recepción de pedido #123"
                            value={stockFormData.reason}
                            onChange={e => setStockFormData({...stockFormData, reason: e.target.value})}
                         />
                     </Form.Group>
                     <div className="text-muted small">
                         Stock Actual: {selectedProductForStock?.stock}
                     </div>
                 </Form>
             </Modal.Body>
             <Modal.Footer>
                 <Button variant="secondary" onClick={() => setShowStockModal(false)}>Cancelar</Button>
                 <Button variant="primary" onClick={handleSaveStock}>Registrar Movimiento</Button>
             </Modal.Footer>
          </Modal>

           {/* Brand/Category/Provider Modals ( Simplified placehoders, logic is above) */}
           <Modal show={showBrandModal} onHide={() => setShowBrandModal(false)}>
              <Modal.Body>
                  <Form.Control placeholder="Nombre Marca" value={newBrandName} onChange={e => setNewBrandName(e.target.value)} />
                  <Button className="mt-2" onClick={handleSaveBrand}>Guardar</Button>
              </Modal.Body>
           </Modal>
           <Modal show={showCategoryModal} onHide={() => setShowCategoryModal(false)}>
              <Modal.Body>
                  <Form.Control placeholder="Nombre Categoría" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                  <Button className="mt-2" onClick={handleSaveCategory}>Guardar</Button>
              </Modal.Body>
           </Modal>
           <Modal show={showProviderModal} onHide={() => setShowProviderModal(false)}>
              <Modal.Body>
                  <Form.Control placeholder="Nombre Proveedor" value={newProviderName} onChange={e => setNewProviderName(e.target.value)} />
                  <Button className="mt-2" onClick={handleSaveProvider}>Guardar</Button>
              </Modal.Body>
           </Modal>

        </>
      )}
    </div>
  );
}

export default AdminProducts;
