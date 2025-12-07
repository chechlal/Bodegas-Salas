import React, { useEffect, useRef, useState, useMemo } from "react";
import { Table, Button, Modal, Form, Spinner, Row, Col, Image, Alert, Badge, InputGroup, Toast, ToastContainer, Card, Tab, Tabs } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";

function AdminProducts({ theme }) {
  const { authFetch } = useAuth();
  const hasLoaded = useRef(false);

  // --- 1. ESTADOS DE DATOS ---
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- 2. ESTADOS DE INTERFAZ, BÚSQUEDA Y ORDEN ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  // Estado inicial del ordenamiento
  const defaultSort = { key: 'nombre_comercial', direction: 'asc' };
  const [sortConfig, setSortConfig] = useState(defaultSort);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);

  // --- 3. ESTADOS DE FORMULARIOS ---
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  
  // Dimensiones (Objeto único)
  const [dims, setDims] = useState({ alto: "", largo: "", ancho: "" });

  // Imágenes
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [principalIndex, setPrincipalIndex] = useState(0); // Índice de la foto principal

  // Logística
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);
  const [stockFormData, setStockFormData] = useState({ quantity: 1, movement_type: 'IN', reason: '' });

  // Gestión de Maestros (Edición/Creación)
  const [masterName, setMasterName] = useState(""); 
  const [masterEditId, setMasterEditId] = useState("");
  const [masterEditName, setMasterEditName] = useState("");

  // --- 4. SISTEMA DE NOTIFICACIONES ---
  const [toastConfig, setToastConfig] = useState({ show: false, message: '', variant: 'success' });
  const [deleteConfirm, setDeleteConfirm] = useState({ 
    show: false, entity: null, id: null, name: "", input: "", originalType: null 
  });

  useEffect(() => {
    document.title = "Administración de Catálogo - Bodegas Salas";
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      loadAllData();
    }
    // eslint-disable-next-line
  }, []);

  // --- HELPERS ---
  const showFeedback = (message, variant = 'success') => setToastConfig({ show: true, message, variant });
  const formatPrice = (price) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(price || 0);

  // --- FUNCIONES DE FILTRO Y RESET ---
  const hasActiveFilters = useMemo(() => {
    return (
        searchTerm !== "" || 
        filterCategory !== "" || 
        sortConfig.key !== defaultSort.key || 
        sortConfig.direction !== defaultSort.direction
    );
  }, [searchTerm, filterCategory, sortConfig, defaultSort]);

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterCategory("");
    setSortConfig(defaultSort);
  };

  // --- CARGA DE DATOS ---
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [prodRes, brandRes, catRes, provRes] = await Promise.all([
        authFetch("/api/products/"),
        authFetch("/api/brands/"),
        authFetch("/api/categories/"),
        authFetch("/api/providers/")
      ]);

      if (!prodRes.ok) throw new Error("Error de conexión");
      
      const pData = await prodRes.json();
      setProducts(pData.results || pData);
      setBrands(await brandRes.json().then(d => d.results || d));
      setCategories(await catRes.json().then(d => d.results || d));
      setProviders(await provRes.json().then(d => d.results || d));

    } catch (e) {
      console.error(e);
      showFeedback("Error al cargar datos del sistema.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const refreshProducts = async () => {
    try {
      const res = await authFetch("/api/products/");
      const data = await res.json();
      setProducts(data.results || data);
    } catch(e) { console.error(e); }
  };

  const refreshOptions = async () => {
    try {
        const [brandRes, catRes, provRes] = await Promise.all([
            authFetch("/api/brands/"),
            authFetch("/api/categories/"),
            authFetch("/api/providers/")
        ]);
        setBrands(await brandRes.json().then(d => d.results || d));
        setCategories(await catRes.json().then(d => d.results || d));
        setProviders(await provRes.json().then(d => d.results || d));
    } catch(e) { console.error(e); }
  }

  // --- ORDENAMIENTO ---
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedProducts = (productsList) => {
      const sorted = [...productsList];
      sorted.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Objetos
        if (sortConfig.key === 'brand') { aVal = a.brand?.name || ''; bVal = b.brand?.name || ''; }
        if (sortConfig.key === 'category') { aVal = a.category?.name || ''; bVal = b.category?.name || ''; }
        if (sortConfig.key === 'provider') { aVal = a.provider?.name || ''; bVal = b.provider?.name || ''; }
        
        // Conversión Numérica para ordenamiento correcto
        if (['precio_venta', 'stock', 'rating', 'costo_cg'].includes(sortConfig.key)) {
            const cleanNumber = (val) => parseFloat(String(val).replace(/\./g, '').replace(',', '.')) || 0;
            aVal = cleanNumber(aVal);
            bVal = cleanNumber(bVal);
        } else {
            aVal = String(aVal).toLowerCase();
            bVal = String(bVal).toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
      return sorted;
    };

  // --- FILTRADO + ORDENAMIENTO ---
  const processedProducts = useMemo(() => {
    let result = products;

    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(p => 
            p.nombre_comercial.toLowerCase().includes(term) ||
            p.sku.toLowerCase().includes(term) ||
            p.brand?.name?.toLowerCase().includes(term)
        );
    }
    if (filterCategory) {
        result = result.filter(p => p.category?.id === parseInt(filterCategory));
    }

    return getSortedProducts(result);
  }, [products, searchTerm, filterCategory, sortConfig]); // eslint-disable-line react-hooks/exhaustive-deps


  // --- CRUD PRODUCTOS ---
  const openProductModal = (product = null) => {
      // Resetear estados visuales
      setNewImages([]);
      setPreviews([]);
      setPrincipalIndex(0); 

      if (product) {
          setEditingId(product.id);
          setFormData({
              ...product,
              brand_id: product.brand?.id || "",
              category_id: product.category?.id || "",
              provider_id: product.provider?.id || "",
          });
          
          // Parsear dimensiones
          const d = (product.dimensiones || "").split("x").map(s => s.trim());
          setDims({ alto: d[0] || "", largo: d[1] || "", ancho: d[2] || "" });

          // Cargar imágenes
          authFetch(`/api/product-images/?search=${product.id}`)
              .then(r => r.json())
              .then(data => {
                  const imgs = data.results || data || [];
                  setExistingImages(imgs);
                  
                  // Configurar previews
                  const initialPreviews = imgs.map(img => ({ 
                      kind: 'existing', 
                      url: img.image, 
                      id: img.id, 
                      is_principal: img.is_principal 
                  }));
                  setPreviews(initialPreviews);
                  
                  // Detectar índice de la principal
                  const pIndex = initialPreviews.findIndex(p => p.is_principal);
                  setPrincipalIndex(pIndex >= 0 ? pIndex : 0);
              });
      } else {
          // MODO CREACIÓN
          setEditingId(null);
          setFormData({
              nombre_comercial: "", ean: "", sku: "", stock: 0, precio_venta: 0, costo_cg: 0, rating: 0,
              brand_id: "", category_id: "", provider_id: "", descripcion: "", lugar_bodega: "", edad_uso: "", peso: 0
          });
          setDims({ alto: "", largo: "", ancho: "" });
          setPrincipalIndex(0);
      }
      setShowModal(true);
    };

  const handleSaveProduct = async () => {
    try {
        setSaving(true);
        if (!formData.nombre_comercial || !formData.sku || !formData.brand_id) {
            setSaving(false);
            return showFeedback("Complete los campos obligatorios (*)", "warning");
        }

        let dimensiones = "";
        if (dims.alto && dims.largo && dims.ancho) {
            dimensiones = `${dims.alto} x ${dims.largo} x ${dims.ancho}`;
        }

        const payload = {
            ...formData,
            dimensiones,
            brand_id: formData.brand_id,
            category_id: formData.category_id,
            provider_id: formData.provider_id,
        };
        
        ['stock', 'brand', 'category', 'provider', 'images'].forEach(k => delete payload[k]);

        const url = editingId ? `/api/products/${editingId}/` : "/api/products/";
        const method = editingId ? "PATCH" : "POST";

        const res = await authFetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Error al guardar producto");
        
        const savedProd = await res.json();
        const prodId = savedProd.id;

        // --- GUARDADO DE IMÁGENES ---
        for (let i = 0; i < previews.length; i++) {
            const pv = previews[i];
            const isMain = (i === principalIndex); 

            if (pv.kind === 'existing') {
                if (pv.is_principal !== isMain) {
                    await authFetch(`/api/product-images/${pv.id}/`, {
                        method: "PATCH", 
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ is_principal: isMain })
                    });
                }
            } else if (pv.kind === 'new') {
                const fd = new FormData();
                fd.append("image", pv.file);
                fd.append("product", prodId);
                fd.append("is_principal", isMain ? "true" : "false");
                await authFetch("/api/product-images/", { method: "POST", body: fd });
            }
        }

        showFeedback(editingId ? "Producto actualizado." : "Producto creado.", "success");
        setShowModal(false);
        refreshProducts();

    } catch (e) {
        showFeedback(e.message, "danger");
    } finally {
        setSaving(false);
    }
  };

  // Manejo de Imágenes (Preview y Borrado)
  const handleFileChange = (e) => {
      const files = Array.from(e.target.files);
      setNewImages(prev => [...prev, ...files]);
      const newPrevs = files.map(f => ({ kind: 'new', url: URL.createObjectURL(f), file: f }));
      setPreviews(prev => [...prev, ...newPrevs]);
  };

  const removePreview = (index) => {
      const item = previews[index];
      if (item.kind === 'existing') {
          setExistingImages(prev => prev.filter(img => img.id !== item.id));
          authFetch(`/api/product-images/${item.id}/`, { method: "DELETE" });
      } else {
          setNewImages(prev => prev.filter(f => f !== item.file));
      }
      setPreviews(prev => prev.filter((_, i) => i !== index));
      if (index === principalIndex) setPrincipalIndex(0);
      else if (index < principalIndex) setPrincipalIndex(principalIndex - 1);
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("¿Confirmar eliminación definitiva del producto?")) {
        try {
            const res = await authFetch(`/api/products/${id}/`, { method: "DELETE" });
            if (!res.ok) throw new Error("No se pudo eliminar");
            showFeedback("Producto eliminado.", "success");
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch(e) {
            showFeedback("Error al eliminar producto", "danger");
        }
    }
  };

  // --- CRUD MAESTROS ---
  const openMasterModal = (type) => {
      setMasterName("");
      setMasterEditId("");
      setMasterEditName("");
      if (type === 'brand') setShowBrandModal(true);
      if (type === 'category') setShowCategoryModal(true);
      if (type === 'provider') setShowProviderModal(true);
  };

  const handleSaveMaster = async (type) => {
      if (!masterName.trim()) return showFeedback("El nombre no puede estar vacío", "warning");
      const endpoint = type === 'brand' ? 'brands' : type === 'category' ? 'categories' : 'providers';
      try {
          const res = await authFetch(`/api/${endpoint}/`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: masterName })
          });
          if (!res.ok) throw new Error("Error al crear");
          showFeedback("Registro creado exitosamente", "success");
          setMasterName("");
          refreshOptions();
      } catch (e) { showFeedback("Error al guardar", "danger"); }
  };

  const handleUpdateMaster = async (type) => {
      if (!masterEditId || !masterEditName.trim()) return showFeedback("Seleccione un registro e ingrese un nombre", "warning");
      const endpoint = type === 'brand' ? 'brands' : type === 'category' ? 'categories' : 'providers';
      try {
          const res = await authFetch(`/api/${endpoint}/${masterEditId}/`, {
              method: "PATCH", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: masterEditName })
          });
          if (!res.ok) throw new Error("Error al actualizar");
          showFeedback("Registro actualizado", "success");
          setMasterEditName("");
          setMasterEditId("");
          refreshOptions();
          refreshProducts();
      } catch (e) { showFeedback("Error al actualizar", "danger"); }
  };

  const handleDeleteMasterAttempt = async (type) => {
      if (!masterEditId) return showFeedback("Seleccione un elemento para eliminar", "warning");
      
      const list = type === 'brand' ? brands : type === 'category' ? categories : providers;
      const item = list.find(x => x.id === parseInt(masterEditId));
      
      const param = type === 'brand' ? 'brand' : type === 'category' ? 'category' : 'provider';
      const res = await authFetch(`/api/products/?${param}=${masterEditId}`);
      const associated = await res.json();
      const count = (associated.results || associated).length;

      if (count > 0) {
          setShowBrandModal(false); setShowCategoryModal(false); setShowProviderModal(false);
          setDeleteConfirm({
              show: true,
              entity: type === 'brand' ? 'Marca' : type === 'category' ? 'Categoría' : 'Proveedor',
              id: parseInt(masterEditId),
              name: item.name,
              input: "",
              originalType: type
          });
      } else {
          const endpoint = type === 'brand' ? 'brands' : type === 'category' ? 'categories' : 'providers';
          await authFetch(`/api/${endpoint}/${masterEditId}/`, { method: "DELETE" });
          showFeedback("Eliminado correctamente", "success");
          setMasterEditId("");
          setMasterEditName("");
          refreshOptions();
      }
  };

  const executeCascadingDelete = async () => {
      const { id, originalType, input, entity, name } = deleteConfirm;
      const expected = `eliminar productos con ${entity} "${name}"`;

      // 1. Tu validación de seguridad se mantiene (EXCELENTE)
      if (input !== expected) return showFeedback("La frase de confirmación no coincide", "danger");

      try {
          // 2. Simplificación: Ya no borramos productos uno por uno.
          // Llamamos directo a borrar el Maestro, y el Backend hace la cascada "Soft".
          
          const endpoint = originalType === 'brand' ? 'brands' : originalType === 'category' ? 'categories' : 'providers';
          
          // Esta llamada ahora activa el perform_destroy modificado en Django
          const finalRes = await authFetch(`/api/${endpoint}/${id}/`, { method: "DELETE" });
          
          if (!finalRes.ok) throw new Error("Error al descontinuar registros");

          showFeedback(`Operación Exitosa: ${entity} y sus productos han sido descontinuados.`, "success");
          setDeleteConfirm({ ...deleteConfirm, show: false });
          
          // Recargamos todo para ver los cambios
          loadAllData();

      } catch (e) {
          console.error(e);
          showFeedback("Error al procesar la solicitud", "danger");
      }
  };

  // --- LOGÍSTICA ---
  const handleStockClick = (product) => {
      setSelectedProductForStock(product);
      setStockFormData({ quantity: 1, movement_type: 'IN', reason: '' });
      setShowStockModal(true);
  };

  const submitStock = async () => {
      if (!stockFormData.reason.trim()) return showFeedback("El motivo es obligatorio para auditoría", "warning");
      try {
          const res = await authFetch('/api/stock-movements/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  product: selectedProductForStock.id,
                  quantity: parseInt(stockFormData.quantity),
                  movement_type: stockFormData.movement_type,
                  reason: stockFormData.reason
              })
          });

          if (!res.ok) {
              const err = await res.json();
              const msg = err.quantity ? err.quantity[0] : 
                          (err.detail || err.non_field_errors?.[0] || "Error al registrar movimiento");
              throw new Error(msg);
          }
          
          showFeedback("Stock actualizado exitosamente", "success");
          setShowStockModal(false);
          refreshProducts();
      } catch (e) { showFeedback(e.message, "danger"); }
  };

  // --- RENDER ---
  const dark = theme === 'dark';
  const inputClass = dark ? "bg-dark text-white border-secondary" : "";
  const cardClass = dark ? 'bg-dark text-white border-secondary' : 'bg-white border-0 shadow-sm';
  const tableHeaderClass = dark ? "table-secondary" : "bg-light text-secondary";

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <i className="bi bi-arrow-down-up text-muted ms-1" style={{fontSize: '0.8em'}}></i>;
    return sortConfig.direction === 'asc' 
      ? <i className="bi bi-sort-down-alt text-primary ms-1"></i>
      : <i className="bi bi-sort-up text-primary ms-1"></i>;
  };

  return (
    <div className={`container-fluid p-4 ${dark ? 'bg-black' : 'bg-light'} min-vh-100`}>
      
      {/* 1. BARRA DE CONTROL SUPERIOR */}
      <Card className={`mb-4 ${cardClass}`}>
        <Card.Body className="d-flex flex-column flex-xl-row justify-content-between align-items-center gap-3 py-3">
            <div>
                <h4 className="fw-bold mb-0 d-flex align-items-center">
                    <i className="bi bi-grid-3x3-gap-fill me-2 text-primary"></i> 
                    Administración de Catálogo
                </h4>
                <div className="text-muted small">
                    {products.length} productos • {brands.length} marcas • {categories.length} categorías
                </div>
            </div>

            <div className="d-flex flex-column flex-md-row gap-2 w-100 w-xl-auto align-items-center">
                {/* Buscador */}
                <InputGroup style={{minWidth: '280px'}}>
                    <InputGroup.Text className={dark ? "bg-secondary border-secondary text-white" : "bg-light"}>
                        <i className="bi bi-search"></i>
                    </InputGroup.Text>
                    <Form.Control 
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className={dark ? "bg-dark text-white border-secondary" : ""}
                    />
                </InputGroup>

                {/* Filtro Rápido */}
                <Form.Select 
                    className={dark ? "bg-dark text-white border-secondary" : ""}
                    style={{maxWidth: '200px'}}
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                >
                    <option value="">Todas las Categorías</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Form.Select>

                {/* Botón RESET FILTROS */}
                {hasActiveFilters && (
                    <Button 
                        variant="outline-danger" 
                        onClick={clearAllFilters} 
                        title="Limpiar Búsqueda, Filtros y Orden"
                    >
                        <i className="bi bi-x-lg"></i>
                    </Button>
                )}

                {/* Botón Principal */}
                <Button variant="primary" className="fw-bold px-4 text-nowrap" onClick={() => openProductModal(null)}>
                    <i className="bi bi-plus-lg me-2"></i>Nuevo Producto
                </Button>
            </div>
        </Card.Body>
        <Card.Footer className={`d-flex gap-2 py-2 overflow-auto ${dark ? 'border-secondary' : 'bg-light'}`}>
            <small className="text-muted fw-bold me-2 align-self-center text-nowrap">DATOS MAESTROS:</small>
            <Button size="sm" variant={dark ? "outline-info" : "outline-secondary"} onClick={() => openMasterModal('brand')}>
                <i className="bi bi-tag me-1"></i> Marcas
            </Button>
            <Button size="sm" variant={dark ? "outline-info" : "outline-secondary"} onClick={() => openMasterModal('category')}>
                <i className="bi bi-list-nested me-1"></i> Categorías
            </Button>
            <Button size="sm" variant={dark ? "outline-info" : "outline-secondary"} onClick={() => openMasterModal('provider')}>
                <i className="bi bi-truck me-1"></i> Proveedores
            </Button>
        </Card.Footer>
      </Card>

      {/* 2. TABLA PROFESIONAL */}
      {loading ? (
          <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
      ) : (
          <Card className={`overflow-hidden ${cardClass}`}>
            <Table responsive hover className={`mb-0 align-middle table-sm ${dark ? 'table-dark' : ''}`}>
                <thead className={tableHeaderClass}>
                    <tr className="small text-uppercase">
                        <th style={{width:'60px'}}></th>
                        <th style={{cursor:'pointer'}} onClick={() => handleSort('nombre_comercial')}>Producto <SortIcon column='nombre_comercial'/></th>
                        <th style={{cursor:'pointer'}} onClick={() => handleSort('brand')}>Marca <SortIcon column='brand'/></th>
                        <th style={{cursor:'pointer'}} onClick={() => handleSort('category')}>Categoría <SortIcon column='category'/></th>
                        <th>SKU</th>
                        <th className="text-end" style={{cursor:'pointer'}} onClick={() => handleSort('precio_venta')}>Precio <SortIcon column='precio_venta'/></th>
                        <th className="text-center" style={{cursor:'pointer'}} onClick={() => handleSort('stock')}>Stock <SortIcon column='stock'/></th>
                        <th className="text-end">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {processedProducts.map(p => (
                        <tr key={p.id} className={dark ? "border-secondary" : ""}>
                            <td>
                                <div className="rounded bg-body-secondary d-flex align-items-center justify-content-center" style={{width:40, height:40, overflow:'hidden'}}>
                                    {p.images?.[0]?.image ? (
                                        <Image src={p.images[0].image} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                    ) : <i className="bi bi-box text-muted"></i>}
                                </div>
                            </td>
                            <td className="fw-bold text-nowrap">{p.nombre_comercial}</td>
                            <td>{p.brand?.name}</td>
                            <td><Badge bg="secondary" className="fw-normal">{p.category?.name}</Badge></td>
                            <td className="font-monospace small">{p.sku}</td>
                            <td className="text-end fw-bold text-success">{formatPrice(p.precio_venta)}</td>
                            <td className="text-center">
                                {p.stock === 0 ? <Badge bg="danger">AGOTADO</Badge> :
                                 p.stock < 5 ? <Badge bg="warning" text="dark">{p.stock}</Badge> :
                                 <span className="fw-bold text-success">{p.stock}</span>
                                }
                            </td>
                            <td className="text-end">
                                <div className="d-flex justify-content-end gap-2">
                                    <Button variant={dark?"outline-light":"outline-dark"} size="sm" onClick={() => handleStockClick(p)} title="Inventario">
                                        <i className="bi bi-boxes"></i>
                                    </Button>
                                    <Button variant="outline-primary" size="sm" onClick={() => openProductModal(p)} title="Editar">
                                        <i className="bi bi-pencil-fill"></i>
                                    </Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDeleteProduct(p.id)} title="Eliminar">
                                        <i className="bi bi-trash-fill"></i>
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {processedProducts.length === 0 && (
                        <tr><td colSpan="8" className="text-center py-5 text-muted">No se encontraron resultados.</td></tr>
                    )}
                </tbody>
            </Table>
          </Card>
      )}

      {/* --- MODAL MAESTROS (Tabulado para Crear/Editar) --- */}
      {[
          { show: showBrandModal, set: setShowBrandModal, type: 'brand', title: 'Marcas', list: brands },
          { show: showCategoryModal, set: setShowCategoryModal, type: 'category', title: 'Categorías', list: categories },
          { show: showProviderModal, set: setShowProviderModal, type: 'provider', title: 'Proveedores', list: providers }
      ].map(m => (
          <Modal key={m.type} show={m.show} onHide={() => m.set(false)} centered backdrop="static">
              <Modal.Header closeButton className={dark ? "bg-secondary text-white" : "bg-light"}>
                  <Modal.Title>Gestionar {m.title}</Modal.Title>
              </Modal.Header>
              <Modal.Body className={dark ? "bg-dark text-white" : ""}>
                  <Tabs defaultActiveKey="create" className="mb-3">
                      <Tab eventKey="create" title="Crear">
                          <InputGroup className="mt-3">
                              <Form.Control 
                                  placeholder="Nombre nuevo..." 
                                  value={masterName} 
                                  onChange={e=>setMasterName(e.target.value)} 
                                  className={inputClass}
                              />
                              <Button variant="success" onClick={()=>handleSaveMaster(m.type)}>Crear</Button>
                          </InputGroup>
                      </Tab>
                      <Tab eventKey="edit" title="Editar/Borrar">
                          <Form.Select className={`mt-3 mb-2 ${inputClass}`} onChange={e => {
                              setMasterEditId(e.target.value);
                              const item = m.list.find(x => x.id === parseInt(e.target.value));
                              setMasterEditName(item ? item.name : "");
                          }}>
                              <option value="">Seleccione...</option>
                              {m.list.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                          </Form.Select>
                          {masterEditId && (
                              <InputGroup className="mt-2">
                                  <Form.Control value={masterEditName} onChange={e=>setMasterEditName(e.target.value)} className={inputClass}/>
                                  <Button variant="primary" onClick={()=>handleUpdateMaster(m.type)}>Guardar</Button>
                                  <Button variant="danger" onClick={()=>handleDeleteMasterAttempt(m.type)}><i className="bi bi-trash"></i></Button>
                              </InputGroup>
                          )}
                      </Tab>
                  </Tabs>
              </Modal.Body>
          </Modal>
      ))}

      {/* --- MODAL ELIMINACIÓN SEGURA --- */}
      <Modal show={deleteConfirm.show} onHide={() => setDeleteConfirm({...deleteConfirm, show: false})} centered backdrop="static">
          <Modal.Header closeButton className="bg-danger text-white">
              <Modal.Title><i className="bi bi-exclamation-triangle-fill me-2"></i>Acción Irreversible</Modal.Title>
          </Modal.Header>
          <Modal.Body>
              <Alert variant="warning">
                  Se detectaron productos asociados a <strong>{deleteConfirm.name}</strong>. 
                  Para continuar, debe autorizar la eliminación de <strong>TODOS</strong> estos productos.
              </Alert>
              <Form.Label>Escriba: <strong>eliminar productos con {deleteConfirm.entity} "{deleteConfirm.name}"</strong></Form.Label>
              <Form.Control 
                  value={deleteConfirm.input}
                  onChange={e => setDeleteConfirm({...deleteConfirm, input: e.target.value})}
                  className="border-danger"
                  autoFocus
              />
          </Modal.Body>
          <Modal.Footer>
              <Button variant="secondary" onClick={() => setDeleteConfirm({...deleteConfirm, show: false})}>Cancelar</Button>
              <Button 
                  variant="danger" 
                  onClick={executeCascadingDelete}
                  disabled={deleteConfirm.input !== `eliminar productos con ${deleteConfirm.entity} "${deleteConfirm.name}"`}
              >
                  Confirmar Eliminación Total
              </Button>
          </Modal.Footer>
      </Modal>

      {/* --- MODAL FORMULARIO PRODUCTO (CON TABS) --- */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered backdrop="static">
          <Modal.Header closeButton className="bg-primary text-white">
              <Modal.Title>{editingId ? "Editar Producto" : "Nuevo Producto"}</Modal.Title>
          </Modal.Header>
          <Modal.Body className={dark ? "bg-dark text-white" : ""}>
              <Tabs defaultActiveKey="general" className="mb-3">
                  
                  {/* PESTAÑA 1: DATOS BÁSICOS */}
                  <Tab eventKey="general" title="📦 General">
                      <Row className="g-3">
                          <Col md={12}>
                              <Form.Label>Nombre Comercial *</Form.Label>
                              <Form.Control value={formData.nombre_comercial} onChange={e=>setFormData({...formData, nombre_comercial: e.target.value})} className={inputClass} autoFocus />
                          </Col>
                          <Col md={6}>
                              <Form.Label>SKU *</Form.Label>
                              <Form.Control value={formData.sku} onChange={e=>setFormData({...formData, sku: e.target.value})} className={inputClass} />
                          </Col>
                          <Col md={6}>
                              <Form.Label>EAN</Form.Label>
                              <Form.Control value={formData.ean} onChange={e=>setFormData({...formData, ean: e.target.value})} className={inputClass} />
                          </Col>
                          <Col md={4}>
                              <Form.Label>Marca *</Form.Label>
                              <Form.Select value={formData.brand_id} onChange={e=>setFormData({...formData, brand_id: e.target.value})} className={inputClass}>
                                  <option value="">Seleccione...</option>
                                  {brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                              </Form.Select>
                          </Col>
                          <Col md={4}>
                              <Form.Label>Categoría</Form.Label>
                              <Form.Select value={formData.category_id} onChange={e=>setFormData({...formData, category_id: e.target.value})} className={inputClass}>
                                  <option value="">Seleccione...</option>
                                  {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                              </Form.Select>
                          </Col>
                          <Col md={4}>
                              <Form.Label>Proveedor</Form.Label>
                              <Form.Select value={formData.provider_id} onChange={e=>setFormData({...formData, provider_id: e.target.value})} className={inputClass}>
                                  <option value="">Seleccione...</option>
                                  {providers.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                              </Form.Select>
                          </Col>
                      </Row>
                  </Tab>

                  {/* PESTAÑA 2: DETALLES */}
                  <Tab eventKey="details" title="📝 Detalles">
                      <Row className="g-3">
                          <Col md={12}>
                              <Form.Label>Descripción</Form.Label>
                              <Form.Control as="textarea" rows={3} value={formData.descripcion || ""} onChange={e=>setFormData({...formData, descripcion: e.target.value})} className={inputClass} />
                          </Col>
                          <Col md={4}>
                              <Form.Label>Ubicación Bodega</Form.Label>
                              <Form.Control value={formData.lugar_bodega || ""} onChange={e=>setFormData({...formData, lugar_bodega: e.target.value})} placeholder="Ej: Pasillo A-1" className={inputClass} />
                          </Col>
                          <Col md={4}>
                              <Form.Label>Edad de Uso</Form.Label>
                              <Form.Control value={formData.edad_uso || ""} onChange={e=>setFormData({...formData, edad_uso: e.target.value})} placeholder="Ej: +3 años" className={inputClass} />
                          </Col>
                          <Col md={4}>
                              <Form.Label>Peso (kg)</Form.Label>
                              <Form.Control type="number" step="0.01" value={formData.peso || 0} onChange={e=>setFormData({...formData, peso: e.target.value})} className={inputClass} />
                          </Col>
                          <Col md={4}>
                              <Form.Label>Alto (cm)</Form.Label>
                              <Form.Control value={dims.alto} onChange={e => setDims({ ...dims, alto: e.target.value })} className={inputClass} />
                          </Col>
                          <Col md={4}>
                              <Form.Label>Largo (cm)</Form.Label>
                              <Form.Control value={dims.largo} onChange={e => setDims({ ...dims, largo: e.target.value })} className={inputClass} />
                          </Col>
                          <Col md={4}>
                              <Form.Label>Ancho (cm)</Form.Label>
                              <Form.Control value={dims.ancho} onChange={e => setDims({ ...dims, ancho: e.target.value })} className={inputClass} />
                          </Col>
                      </Row>
                  </Tab>

                  {/* PESTAÑA 3: PRECIOS E IMÁGENES */}
                  <Tab eventKey="media" title="💰 Precios e Img">
                      <Row className="g-3">
                          <Col md={6}>
                              <Form.Label>Precio Venta</Form.Label>
                              <InputGroup><InputGroup.Text>$</InputGroup.Text><Form.Control type="number" value={formData.precio_venta} onChange={e=>setFormData({...formData, precio_venta: e.target.value})} className={inputClass} /></InputGroup>
                          </Col>
                          <Col md={6}>
                              <Form.Label>Costo</Form.Label>
                              <InputGroup><InputGroup.Text>$</InputGroup.Text><Form.Control type="number" value={formData.costo_cg} onChange={e=>setFormData({...formData, costo_cg: e.target.value})} className={inputClass} /></InputGroup>
                          </Col>
                          <Col md={6}>
                              <Form.Label>Stock (Bloqueado)</Form.Label>
                              <Form.Control value={formData.stock || 0} disabled className="bg-secondary-subtle" />
                          </Col>
                          <Col md={6}>
                              <Form.Label>Rating</Form.Label>
                              <Form.Control type="number" step="0.1" max="5" value={formData.rating} onChange={e=>setFormData({...formData, rating: e.target.value})} className={inputClass} />
                          </Col>

                          <Col md={12}>
                              <Form.Label>Gestión de Imágenes</Form.Label>
                              <Form.Control type="file" multiple onChange={handleFileChange} className={`mb-2 ${inputClass}`} />
                              <div className="d-flex gap-2 mt-2 p-2 border rounded bg-light overflow-auto">
                                  {previews.map((pv, i) => (
                                      <div 
                                          key={i} 
                                          className={`position-relative border p-1 ${principalIndex === i ? 'border-success border-2' : ''}`} 
                                          style={{minWidth: 80, cursor:'pointer'}} 
                                          onClick={() => setPrincipalIndex(i)} 
                                      >
                                          <Image src={pv.url} style={{width:70, height:70, objectFit:'cover'}} />
                                          {principalIndex === i && (
                                              <Badge bg="success" className="position-absolute top-0 start-0" style={{zIndex:1}}>
                                                  Main
                                              </Badge>
                                          )}
                                          <Button 
                                              size="sm" 
                                              variant="danger" 
                                              className="position-absolute top-0 end-0 p-0" 
                                              style={{width:20, height:20, zIndex:2}} 
                                              onClick={(e) => { e.stopPropagation(); removePreview(i); }}
                                          >
                                              &times;
                                          </Button>
                                      </div>
                                  ))}
                                  {previews.length === 0 && <span className="text-muted small m-auto">Sin imágenes</span>}
                              </div>
                          </Col>
                      </Row>
                  </Tab>
              </Tabs>
          </Modal.Body>
          <Modal.Footer className={dark ? "bg-dark border-secondary" : ""}>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSaveProduct} disabled={saving}>
                  {saving ? <><Spinner size="sm" animation="border"/> Guardando...</> : "Guardar Producto"}
              </Button>
          </Modal.Footer>
      </Modal>

      {/* --- MODAL STOCK --- */}
      <Modal show={showStockModal} onHide={() => setShowStockModal(false)} centered>
          <Modal.Header closeButton className="bg-dark text-white"><Modal.Title>Control de Inventario</Modal.Title></Modal.Header>
          <Modal.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                      <h5 className="mb-0">{selectedProductForStock?.nombre_comercial}</h5>
                      <small className="text-muted">{selectedProductForStock?.sku}</small>
                  </div>
                  <div className="text-end">
                      <span className="d-block small text-muted">STOCK ACTUAL</span>
                      <h2 className="mb-0">{selectedProductForStock?.stock}</h2>
                  </div>
              </div>
              <Form onSubmit={(e) => { e.preventDefault(); submitStock(); }}>
                  <div className="btn-group w-100 mb-3" role="group">
                      <input type="radio" className="btn-check" name="btnradio" id="btnradio1" autoComplete="off" checked={stockFormData.movement_type==='IN'} onChange={()=>setStockFormData({...stockFormData, movement_type:'IN'})} />
                      <label className="btn btn-outline-success" htmlFor="btnradio1">ENTRADA (Compra)</label>

                      <input type="radio" className="btn-check" name="btnradio" id="btnradio2" autoComplete="off" checked={stockFormData.movement_type==='OUT'} onChange={()=>setStockFormData({...stockFormData, movement_type:'OUT'})} />
                      <label className="btn btn-outline-danger" htmlFor="btnradio2">SALIDA (Venta)</label>
                  </div>
                  <Form.Group className="mb-3">
                      <Form.Label>Cantidad</Form.Label>
                      <Form.Control type="number" min="1" value={stockFormData.quantity} onChange={e=>setStockFormData({...stockFormData, quantity: e.target.value})} size="lg" className="text-center fw-bold" />
                  </Form.Group>
                  <Form.Group>
                      <Form.Label>Motivo / Razón</Form.Label>
                      <Form.Control as="textarea" rows={2} value={stockFormData.reason} onChange={e=>setStockFormData({...stockFormData, reason: e.target.value})} placeholder="Requerido para auditoría" />
                  </Form.Group>
              </Form>
          </Modal.Body>
          <Modal.Footer>
              <Button variant="dark" className="w-100" onClick={submitStock}>Confirmar Movimiento</Button>
          </Modal.Footer>
      </Modal>

      <ToastContainer position="top-end" className="p-3" style={{zIndex: 9999}}>
          <Toast onClose={() => setToastConfig({...toastConfig, show:false})} show={toastConfig.show} delay={4000} autohide bg={toastConfig.variant}>
              <Toast.Header><strong className="me-auto">Sistema</strong></Toast.Header>
              <Toast.Body className="text-white">{toastConfig.message}</Toast.Body>
          </Toast>
      </ToastContainer>
    </div>
  );
}

export default AdminProducts;