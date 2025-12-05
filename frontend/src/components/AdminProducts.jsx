import React, { useEffect, useRef, useState } from "react";
import { Table, Button, Modal, Form, Spinner, Row, Col, Image, Alert, Badge, InputGroup } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";

function AdminProducts({ theme }) {
  const { authFetch } = useAuth();
  const hasLoaded = useRef(false);

  useEffect(() => {
    document.title = "Administración de Productos - xAI";
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
  const [showModal, setShowModal] = useState(false);

  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);

  // Estados para gestión de stock
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);
  const [stockFormData, setStockFormData] = useState({
    quantity: 1,
    movement_type: 'IN',
    reason: ''
  });

  const [newBrandName, setNewBrandName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newProviderName, setNewProviderName] = useState("");

  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState("");

  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);

  const [alto, setAlto] = useState("");
  const [largo, setLargo] = useState("");
  const [ancho, setAncho] = useState("");

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

  const openNewModal = () => {
    setEditingId(null);
    setFormData({
      nombre_comercial: "",
      ean: "",
      sku: "",
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
      created_at: new Date(),
      updated_at: new Date(),
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
      created_at: product.created_at ? new Date(product.created_at) : new Date(),
      updated_at: product.updated_at ? new Date(product.updated_at) : new Date(),
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
      [key]: value,
      updated_at: new Date(),
    }));
  };

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
    } else if (alto || largo || ancho) {
      throw new Error("Debes completar Alto, Largo y Ancho (en cm) o dejar los tres vacíos.");
    }

    const {
      id, brand, category, provider, images, created_at, updated_at,
      brand_id, category_id, provider_id, ...rest
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
      const nums = ["precio_venta", "stock", "costo_cg", "peso", "rating"];
      for (const k of nums) {
        const v = formData[k];
        if (v != null && Number(v) < 0) throw new Error("Los valores numéricos no pueden ser negativos.");
      }
      if (formData.rating > 5) throw new Error("El rating no puede exceder 5.");
      const required = ["nombre_comercial", "ean", "sku", "brand_id", "category_id", "provider_id"];
      const missing = required.filter(k => !formData[k] || formData[k] === "");
      if (missing.length > 0) {
        const fieldNames = missing.map(k => {
          if (k === "nombre_comercial") return "Nombre Comercial";
          if (k === "ean") return "EAN";
          if (k === "sku") return "SKU";
          if (k === "brand_id") return "Marca";
          if (k === "category_id") return "Categoría";
          if (k === "provider_id") return "Proveedor";
          return k;
        });
        throw new Error(`Campos requeridos faltantes: ${fieldNames.join(", ")}.`);
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

      for (const img of existingImages) {
        const shouldBePrincipal = principal?.kind === "existing" && principal.value === img.id;
        const patchRes = await authFetch(`/api/product-images/${img.id}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_principal: !!shouldBePrincipal }),
        });
        if (!patchRes.ok) {
          console.warn(`Error actualizando imagen existente ${img.id}`);
        }
      }

      let uploadErrors = 0;
      for (let i = 0; i < newImages.length; i++) {
          const formDataImg = new FormData();
          formDataImg.append("image", newImages[i]);
          formDataImg.append("product", productId);
          const isPrincipal = principal?.kind === "new" && principal.value === i;
          formDataImg.append("is_principal", isPrincipal ? "true" : "false");
          try {
              const imgRes = await authFetch("/api/product-images/", {
                  method: "POST",
                  body: formDataImg,
              });
              if (!imgRes.ok) {
                  const errorData = await imgRes.json();
                  setWarn(prev => prev ? `${prev}\nError en imagen ${i + 1}: ${JSON.stringify(errorData)}` : `Error en imagen ${i + 1}: ${JSON.stringify(errorData)}`);
                  throw new Error(`Error subiendo imagen ${i + 1}`);
              }
          } catch (e) {
              console.error(e);
              uploadErrors++;
          }
      }

      if (uploadErrors > 0) {
        setWarn(`Se subieron ${newImages.length - uploadErrors} de ${newImages.length} imágenes nuevas. Revisa las fallidas.`);
      }

      previews.filter(p => p.kind === "new").forEach(p => URL.revokeObjectURL(p.url));
      await loadProducts();
      setShowModal(false);
    } catch (e) {
      console.error("Error en handleSave:", e);
      setError(e.message || "Error inesperado al guardar el producto.");
    }
  };

  const handleSaveBrand = async () => {
    if (!newBrandName.trim()) {
      setError("El nombre de la marca es requerido.");
      return;
    }
    try {
      const res = await authFetch("/api/brands/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBrandName }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Error guardando marca: ${JSON.stringify(errorData)}`);
      }
      setNewBrandName("");
      setSelectedBrandId("");
      setShowBrandModal(false);
      await loadOptions();
    } catch (e) {
      setError(e.message || "Error al guardar la marca.");
    }
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) {
      setError("El nombre de la categoría es requerido.");
      return;
    }
    try {
      const res = await authFetch("/api/categories/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Error guardando categoría: ${JSON.stringify(errorData)}`);
      }
      setNewCategoryName("");
      setSelectedCategoryId("");
      setShowCategoryModal(false);
      await loadOptions();
    } catch (e) {
      setError(e.message || "Error al guardar la categoría.");
    }
  };

  const handleSaveProvider = async () => {
    if (!newProviderName.trim()) {
      setError("El nombre del proveedor es requerido.");
      return;
    }
    try {
      const res = await authFetch("/api/providers/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProviderName }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Error guardando proveedor: ${JSON.stringify(errorData)}`);
      }
      setNewProviderName("");
      setSelectedProviderId("");
      setShowProviderModal(false);
      await loadOptions();
    } catch (e) {
      setError(e.message || "Error al guardar el proveedor.");
    }
  };

  const checkAssociatedProducts = async (entityType, entityId, entityName) => {
    try {
      // Adjust query param to match backend convention (e.g., ?brand=1 instead of ?brand_id=1)
      const res = await authFetch(`/api/products/?${entityType}=${entityId}`);
      const data = await res.json();
      const productsList = data.results || data;
      return productsList.length > 0 ? productsList : null;
    } catch (e) {
      console.error(`Error verificando productos asociados a ${entityType}`, e);
      setError(`Error al verificar productos asociados a ${entityType}.`);
      return null;
    }
  };

  const handleDeleteBrand = async () => {
    const brandId = selectedBrandId;
    if (!brandId) {
      setError("Por favor, seleccione una marca para eliminar.");
      return;
    }

    const brand = brands.find(b => b.id === parseInt(brandId));
    if (!brand) {
      setError("La marca seleccionada no existe. Por favor, recargue la página e intente de nuevo.");
      return;
    }

    const associatedProducts = await checkAssociatedProducts("brand", brandId, brand.name);
    if (associatedProducts) {
      if (window.confirm(`Existen ${associatedProducts.length} productos asociados a la marca "${brand.name}". ¿Desea eliminarlos junto con la marca?`)) {
        setDeleteConfirm({ entity: "marca", id: brandId, name: brand.name, input: "" });
        return;
      }
      setWarn("No se puede eliminar la marca mientras haya productos asociados.");
      return;
    }

    try {
      const res = await authFetch(`/api/brands/${brandId}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar la marca.");
      setBrands(prev => prev.filter(b => b.id !== parseInt(brandId)));
      setProducts(prev => prev.map(p => p.brand_id === parseInt(brandId) ? { ...p, brand: null } : p));
      setFormData(prev => ({ ...prev, brand_id: prev.brand_id === parseInt(brandId) ? "" : prev.brand_id }));
      setSelectedBrandId("");
      setWarn("Marca eliminada exitosamente.");
    } catch (e) {
      console.error("Error eliminando marca", e);
      setError("Error al eliminar la marca.");
    }
  };

  const handleDeleteCategory = async () => {
    const categoryId = selectedCategoryId;
    if (!categoryId) {
      setError("Por favor, seleccione una categoría para eliminar.");
      return;
    }

    const category = categories.find(c => c.id === parseInt(categoryId));
    if (!category) {
      setError("La categoría seleccionada no existe. Por favor, recargue la página e intente de nuevo.");
      return;
    }

    const associatedProducts = await checkAssociatedProducts("category", categoryId, category.name);
    if (associatedProducts) {
      if (window.confirm(`Existen ${associatedProducts.length} productos asociados a la categoría "${category.name}". ¿Desea eliminarlos junto con la categoría?`)) {
        setDeleteConfirm({ entity: "categoría", id: categoryId, name: category.name, input: "" });
        return;
      }
      setWarn("No se puede eliminar la categoría mientras haya productos asociados.");
      return;
    }

    try {
      const res = await authFetch(`/api/categories/${categoryId}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar la categoría.");
      setCategories(prev => prev.filter(c => c.id !== parseInt(categoryId)));
      setProducts(prev => prev.map(p => p.category_id === parseInt(categoryId) ? { ...p, category: null } : p));
      setFormData(prev => ({ ...prev, category_id: prev.category_id === parseInt(categoryId) ? "" : prev.category_id }));
      setSelectedCategoryId("");
      setWarn("Categoría eliminada exitosamente.");
    } catch (e) {
      console.error("Error eliminando categoría", e);
      setError("Error al eliminar la categoría.");
    }
  };

  const handleDeleteProvider = async () => {
    const providerId = selectedProviderId;
    if (!providerId) {
      setError("Por favor, seleccione un proveedor para eliminar.");
      return;
    }

    const provider = providers.find(p => p.id === parseInt(providerId));
    if (!provider) {
      setError("El proveedor seleccionado no existe. Por favor, recargue la página e intente de nuevo.");
      return;
    }

    const associatedProducts = await checkAssociatedProducts("provider", providerId, provider.name);
    if (associatedProducts) {
      if (window.confirm(`Existen ${associatedProducts.length} productos asociados al proveedor "${provider.name}". ¿Desea eliminarlos junto con el proveedor?`)) {
        setDeleteConfirm({ entity: "proveedor", id: providerId, name: provider.name, input: "" });
        return;
      }
      setWarn("No se puede eliminar el proveedor mientras haya productos asociados.");
      return;
    }

    try {
      const res = await authFetch(`/api/providers/${providerId}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar el proveedor.");
      setProviders(prev => prev.filter(p => p.id !== parseInt(providerId)));
      setProducts(prev => prev.map(p => p.provider_id === parseInt(providerId) ? { ...p, provider: null } : p));
      setFormData(prev => ({ ...prev, provider_id: prev.provider_id === parseInt(providerId) ? "" : prev.provider_id }));
      setSelectedProviderId("");
      setWarn("Proveedor eliminado exitosamente.");
    } catch (e) {
      console.error("Error eliminando proveedor", e);
      setError("Error al eliminar el proveedor.");
    }
  };

  const handleConfirmDelete = async () => {
    const { entity, id, name, input } = deleteConfirm;
    const expectedInput = `eliminar productos con ${entity} "${name}"`;
    if (input !== expectedInput) {
      setError(`Debe escribir exactamente "${expectedInput}" para confirmar la eliminación.`);
      return;
    }

    try {
      let res;
      if (entity === "marca") {
        res = await authFetch(`/api/brands/${id}/`, { method: "DELETE" });
        await Promise.all(products.filter(p => p.brand_id === id).map(p =>
          authFetch(`/api/products/${p.id}/`, { method: "DELETE" })
        ));
        setBrands(prev => prev.filter(b => b.id !== id));
        setProducts(prev => prev.filter(p => p.brand_id !== id));
        setFormData(prev => ({ ...prev, brand_id: prev.brand_id === id ? "" : prev.brand_id }));
      } else if (entity === "categoría") {
        res = await authFetch(`/api/categories/${id}/`, { method: "DELETE" });
        await Promise.all(products.filter(p => p.category_id === id).map(p =>
          authFetch(`/api/products/${p.id}/`, { method: "DELETE" })
        ));
        setCategories(prev => prev.filter(c => c.id !== id));
        setProducts(prev => prev.filter(p => p.category_id !== id));
        setFormData(prev => ({ ...prev, category_id: prev.category_id === id ? "" : prev.category_id }));
      } else if (entity === "proveedor") {
        res = await authFetch(`/api/providers/${id}/`, { method: "DELETE" });
        await Promise.all(products.filter(p => p.provider_id === id).map(p =>
          authFetch(`/api/products/${p.id}/`, { method: "DELETE" })
        ));
        setProviders(prev => prev.filter(p => p.id !== id));
        setProducts(prev => prev.filter(p => p.provider_id !== id));
        setFormData(prev => ({ ...prev, provider_id: prev.provider_id === id ? "" : prev.provider_id }));
      }

      if (!res.ok) throw new Error(`Error al eliminar el ${entity}.`);
      setDeleteConfirm({ entity: null, id: null, name: "", input: "" });
      setWarn(`${entity.charAt(0).toUpperCase() + entity.slice(1)} y productos asociados eliminados exitosamente.`);
    } catch (e) {
      console.error(`Error eliminando ${entity}`, e);
      setError(`Error al eliminar el ${entity} y sus productos.`);
    }
  };

  const handleUpdateBrand = async () => {
    const brandId = selectedBrandId;
    if (!brandId || !newBrandName.trim()) {
      setError("Por favor, seleccione una marca y proporcione un nuevo nombre.");
      return;
    }

    const brand = brands.find(b => b.id === parseInt(brandId));
    if (!brand) {
      setError("La marca seleccionada no existe. Por favor, recargue la página e intente de nuevo.");
      return;
    }

    try {
      const res = await authFetch(`/api/brands/${brandId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBrandName }),
      });
      if (!res.ok) throw new Error("Error al actualizar la marca.");
      const updatedProducts = products.map(p =>
        p.brand_id === parseInt(brandId) ? { ...p, brand: { id: brandId, name: newBrandName } } : p
      );
      setProducts(updatedProducts);
      setBrands(prev => prev.map(b => b.id === parseInt(brandId) ? { ...b, name: newBrandName } : b));
      setNewBrandName("");
      setSelectedBrandId("");
      setWarn("Marca y productos asociados actualizados exitosamente.");
      await loadOptions();
    } catch (e) {
      console.error("Error actualizando marca", e);
      setError("Error al actualizar la marca.");
    }
  };

  const handleUpdateCategory = async () => {
    const categoryId = selectedCategoryId;
    if (!categoryId || !newCategoryName.trim()) {
      setError("Por favor, seleccione una categoría y proporcione un nuevo nombre.");
      return;
    }

    const category = categories.find(c => c.id === parseInt(categoryId));
    if (!category) {
      setError("La categoría seleccionada no existe. Por favor, recargue la página e intente de nuevo.");
      return;
    }

    try {
      const res = await authFetch(`/api/categories/${categoryId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName }),
      });
      if (!res.ok) throw new Error("Error al actualizar la categoría.");
      const updatedProducts = products.map(p =>
        p.category_id === parseInt(categoryId) ? { ...p, category: { id: categoryId, name: newCategoryName } } : p
      );
      setProducts(updatedProducts);
      setCategories(prev => prev.map(c => c.id === parseInt(categoryId) ? { ...c, name: newCategoryName } : c));
      setNewCategoryName("");
      setSelectedCategoryId("");
      setWarn("Categoría y productos asociados actualizados exitosamente.");
      await loadOptions();
    } catch (e) {
      console.error("Error actualizando categoría", e);
      setError("Error al actualizar la categoría.");
    }
  };

  const handleUpdateProvider = async () => {
    const providerId = selectedProviderId;
    if (!providerId || !newProviderName.trim()) {
      setError("Por favor, seleccione un proveedor y proporcione un nuevo nombre.");
      return;
    }

    const provider = providers.find(p => p.id === parseInt(providerId));
    if (!provider) {
      setError("El proveedor seleccionado no existe. Por favor, recargue la página e intente de nuevo.");
      return;
    }

    try {
      const res = await authFetch(`/api/providers/${providerId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProviderName }),
      });
      if (!res.ok) throw new Error("Error al actualizar el proveedor.");
      const updatedProducts = products.map(p =>
        p.provider_id === parseInt(providerId) ? { ...p, provider: { id: providerId, name: newProviderName } } : p
      );
      setProducts(updatedProducts);
      setProviders(prev => prev.map(p => p.id === parseInt(providerId) ? { ...p, name: newProviderName } : p));
      setNewProviderName("");
      setSelectedProviderId("");
      setWarn("Proveedor y productos asociados actualizados exitosamente.");
      await loadOptions();
    } catch (e) {
      console.error("Error actualizando proveedor", e);
      setError("Error al actualizar el proveedor.");
    }
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

  const handleOpenStockModal = (product) => {
    setSelectedProductForStock(product);
    setStockFormData({ quantity: 1, movement_type: 'IN', reason: '' });
    setShowStockModal(true);
  }

  const handleSubmitStockMovement = async () => {
    setError(null); // Limpiar errores previos

    // Validaciones básicas de UI
    if (stockFormData.quantity <= 0) {
      setError("La cantidad debe ser mayir a 0.")
      return;
    }
    if (!stockFormData.reason.trim()) {
      setError("Debe indicar una razón para el movimiento (ej: Compra, Merma, Ajuste).");
      return;
    }

    try {
      const payload = {
        product: selectedProductForStock.id,
        quantity: parseInt(stockFormData.quantity),
        movement_type: stockFormData.movement_type,
        reason: stockFormData.reason
      };

      const res = await authFetch('/api/movements/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errData = await res.json();
            const msg = errData.detail || (errData.quantity && errData.quantity[0]) || "Error al registrar movimiento";
            throw new Error(msg);
        }

        setWarn("✅ Movimiento registrado correctamente. Stock actualizado.");
        setShowStockModal(false);
        await loadProducts();
    } catch (e) {
        console.error(e);
        setError(e.message);
    }
  };

  const createdAtStr = formData.created_at?.toLocaleString() || "";
  const updatedAtStr = formData.updated_at?.toLocaleString() || "";

  return (
    <div className="container mt-5 p-5 bg-body rounded-3 shadow-lg">
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
          <p>Cargando productos...</p>
        </div>
      ) : (
        <>
          {error && <Alert variant="danger">{error}</Alert>}
          {warn && <Alert variant="warning">{warn}</Alert>}

          <div className="mb-4">
            <Button variant="outline-primary" className="me-2" onClick={() => { setNewBrandName(""); setShowBrandModal(true); setSelectedBrandId(""); }}>
              Administrar Marcas
            </Button>
            <Button variant="outline-primary" className="me-2" onClick={() => { setNewCategoryName(""); setShowCategoryModal(true); setSelectedCategoryId(""); }}>
              Administrar Categorías
            </Button>
            <Button variant="outline-primary" onClick={() => { setNewProviderName(""); setShowProviderModal(true); setSelectedProviderId(""); }}>
              Administrar Proveedores
            </Button>
          </div>

          <Modal show={showBrandModal} onHide={() => { setShowBrandModal(false); setDeleteConfirm({ entity: null, id: null, name: "", input: "" }); }} centered>
            <Modal.Header closeButton>
              <Modal.Title>Administrar Marcas</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Agregar Nueva Marca</Form.Label>
                <Form.Control
                  type="text"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Ej: Nike"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Seleccionar Marca para Modificar o Eliminar</Form.Label>
                <Form.Select
                  value={selectedBrandId}
                  onChange={(e) => setSelectedBrandId(e.target.value)}
                >
                  <option value="">Seleccione una marca</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              {selectedBrandId && (
                <Form.Group className="mb-3">
                  <Form.Label>Nuevo Nombre de la Marca</Form.Label>
                  <Form.Control
                    type="text"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder="Ingrese nuevo nombre"
                  />
                </Form.Group>
              )}
              <div className="d-flex flex-column">
                <div className="mb-2">
                  <Button variant="primary" className="me-3" onClick={handleSaveBrand} disabled={!newBrandName.trim()}>
                    Guardar Nueva Marca
                  </Button>
                </div>
                {selectedBrandId && (
                  <div className="mb-2">
                    <Button variant="success" className="me-3" onClick={handleUpdateBrand} disabled={!newBrandName.trim()}>
                      Modificar Marca
                    </Button>
                    <Button variant="danger" onClick={handleDeleteBrand}>
                      Eliminar Marca
                    </Button>
                  </div>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => { setShowBrandModal(false); setDeleteConfirm({ entity: null, id: null, name: "", input: "" }); }}>Cerrar</Button>
            </Modal.Footer>
          </Modal>

          <Modal show={showCategoryModal} onHide={() => { setShowCategoryModal(false); setDeleteConfirm({ entity: null, id: null, name: "", input: "" }); }} centered>
            <Modal.Header closeButton>
              <Modal.Title>Administrar Categorías</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Agregar Nueva Categoría</Form.Label>
                <Form.Control
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ej: Electrónicos"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Seleccionar Categoría para Modificar o Eliminar</Form.Label>
                <Form.Select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                >
                  <option value="">Seleccione una categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              {selectedCategoryId && (
                <Form.Group className="mb-3">
                  <Form.Label>Nuevo Nombre de la Categoría</Form.Label>
                  <Form.Control
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ingrese nuevo nombre"
                  />
                </Form.Group>
              )}
              <div className="d-flex flex-column">
                <div className="mb-2">
                  <Button variant="primary" className="me-3" onClick={handleSaveCategory} disabled={!newCategoryName.trim()}>
                    Guardar Nueva Categoría
                  </Button>
                </div>
                {selectedCategoryId && (
                  <div className="mb-2">
                    <Button variant="success" className="me-3" onClick={handleUpdateCategory} disabled={!newCategoryName.trim()}>
                      Modificar Categoría
                    </Button>
                    <Button variant="danger" onClick={handleDeleteCategory}>
                      Eliminar Categoría
                    </Button>
                  </div>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => { setShowCategoryModal(false); setDeleteConfirm({ entity: null, id: null, name: "", input: "" }); }}>Cerrar</Button>
            </Modal.Footer>
          </Modal>

          <Modal show={showProviderModal} onHide={() => { setShowProviderModal(false); setDeleteConfirm({ entity: null, id: null, name: "", input: "" }); }} centered>
            <Modal.Header closeButton>
              <Modal.Title>Administrar Proveedores</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Agregar Nuevo Proveedor</Form.Label>
                <Form.Control
                  type="text"
                  value={newProviderName}
                  onChange={(e) => setNewProviderName(e.target.value)}
                  placeholder="Ej: Proveedor XYZ"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Seleccionar Proveedor para Modificar o Eliminar</Form.Label>
                <Form.Select
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(e.target.value)}
                >
                  <option value="">Seleccione un proveedor</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              {selectedProviderId && (
                <Form.Group className="mb-3">
                  <Form.Label>Nuevo Nombre del Proveedor</Form.Label>
                  <Form.Control
                    type="text"
                    value={newProviderName}
                    onChange={(e) => setNewProviderName(e.target.value)}
                    placeholder="Ingrese nuevo nombre"
                  />
                </Form.Group>
              )}
              <div className="d-flex flex-column">
                <div className="mb-2">
                  <Button variant="primary" className="me-3" onClick={handleSaveProvider} disabled={!newProviderName.trim()}>
                    Guardar Nuevo Proveedor
                  </Button>
                </div>
                {selectedProviderId && (
                  <div className="mb-2">
                    <Button variant="success" className="me-3" onClick={handleUpdateProvider} disabled={!newProviderName.trim()}>
                      Modificar Proveedor
                    </Button>
                    <Button variant="danger" onClick={handleDeleteProvider}>
                      Eliminar Proveedor
                    </Button>
                  </div>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => { setShowProviderModal(false); setDeleteConfirm({ entity: null, id: null, name: "", input: "" }); }}>Cerrar</Button>
            </Modal.Footer>
          </Modal>

          <Modal show={deleteConfirm.entity} onHide={() => setDeleteConfirm({ entity: null, id: null, name: "", input: "" })} centered>
            <Modal.Header closeButton>
              <Modal.Title>Confirmar Eliminación</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>Existen productos asociados a esta {deleteConfirm.entity}. Para eliminarla junto con todos los productos, escriba exactamente: "<strong>{`eliminar productos con ${deleteConfirm.entity} "${deleteConfirm.name}"`}</strong>"</p>
              <Form.Group>
                <Form.Control
                  type="text"
                  value={deleteConfirm.input}
                  onChange={(e) => setDeleteConfirm(prev => ({ ...prev, input: e.target.value }))}
                  placeholder={`Escriba "eliminar productos con ${deleteConfirm.entity} "${deleteConfirm.name}"`}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setDeleteConfirm({ entity: null, id: null, name: "", input: "" })}>Cancelar</Button>
              <Button variant="danger" onClick={handleConfirmDelete} disabled={deleteConfirm.input !== `eliminar productos con ${deleteConfirm.entity} "${deleteConfirm.name}"`}>
                Eliminar Todo
              </Button>
            </Modal.Footer>
          </Modal>

          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Marca</th>
                <th>Categoría</th>
                <th>SKU</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Rating</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    {product.images?.find(img => img.is_principal)?.image && (
                      <Image
                        src={product.images.find(img => img.is_principal).image}
                        thumbnail
                        style={{ width: "50px", height: "50px", objectFit: "cover" }}
                      />
                    )}
                  </td>
                  <td>{product.nombre_comercial}</td>
                  <td>{product.brand?.name || "Sin marca"}</td>
                  <td>{product.category?.name || "Sin categoría"}</td>
                  <td>{product.sku}</td>
                  <td>{formatPrice(product.precio_venta)}</td>
                  <td className="text-center">
                    {product.stock === 0 ? (
                      <Badge bg="danger">AGOTADO</Badge>
                    ) : product.stock < 5 ? (
                      <Badge bg="danger">CRÍTICO ({product.stock})</Badge>
                    ) : product.stock < 10 ? (
                      <Badge bg="warning" text="dark">BAJO ({product.stock})</Badge>
                    ) : (
                      <Badge bg="success" className="px-3">{product.stock}</Badge>
                    )}
                  </td>
                  <td>{product.rating}</td>
                  <td>
                    <div className="d-grid gap-2 d-sm-flex justify-content-end">
                      {/* Botón Nuevo: Gestión de Inventario */}
                      <Button 
                          variant="outline-dark" 
                          size="sm" 
                          className="me-2"
                          title="Gestionar Inventario"
                          onClick={() => handleOpenStockModal(product)}
                      >
                          <i className="bi bi-box-seam-fill"></i> Stock
                      </Button>
                      <Button variant="warning" size="sm" className="me-2" onClick={() => handleEdit(product)}>
                        Editar
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(product.id)}>
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Button variant="primary" onClick={openNewModal}>Agregar Producto</Button>

          <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered fullscreen="sm-down">
            <Modal.Header closeButton>
              <Modal.Title>{editingId ? "Editar Producto" : "Nuevo Producto"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Row className="g-3">
                  {error && <Alert variant="danger">{error}</Alert>}
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Nombre Comercial</Form.Label>
                      <Form.Control
                        value={formData.nombre_comercial || ""}
                        onChange={(e) => setField("nombre_comercial", e.target.value)}
                        placeholder="Ej: Smart TV 55 pulgadas"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>EAN</Form.Label>
                      <Form.Control
                        value={formData.ean || ""}
                        onChange={(e) => setField("ean", e.target.value)}
                        placeholder="Ej: 0123456789012"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>SKU</Form.Label>
                      <Form.Control
                        value={formData.sku || ""}
                        onChange={(e) => setField("sku", e.target.value)}
                        placeholder="Ej: TV55-XYZ"
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Marca</Form.Label>
                      <Form.Select
                        value={formData.brand_id || ""}
                        onChange={(e) => setField("brand_id", e.target.value)}
                        required
                      >
                        <option value="">Seleccione una marca</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </Form.Select>
                      {brands.length === 0 && (
                        <Form.Text className="text-danger">
                          No hay marcas disponibles. Agregue una primero.
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Categoría</Form.Label>
                      <Form.Select
                        value={formData.category_id || ""}
                        onChange={(e) => setField("category_id", e.target.value)}
                        required
                      >
                        <option value="">Seleccione una categoría</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </Form.Select>
                      {categories.length === 0 && (
                        <Form.Text className="text-danger">
                          No hay categorías disponibles. Agregue una primero.
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Proveedor</Form.Label>
                      <Form.Select
                        value={formData.provider_id || ""}
                        onChange={(e) => setField("provider_id", e.target.value)}
                        required
                      >
                        <option value="">Seleccione un proveedor</option>
                        {providers.map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name}
                          </option>
                        ))}
                      </Form.Select>
                      {providers.length === 0 && (
                        <Form.Text className="text-danger">
                          No hay proveedores disponibles. Agregue uno primero.
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Peso (kg)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.peso ?? ""}
                        onChange={(e) => setField("peso", e.target.value === "" ? "" : parseFloat(e.target.value))}
                        placeholder="Ej: 5.5"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Alto (cm)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        value={alto}
                        onChange={(e) => { setAlto(e.target.value); setField("_touch", Math.random()); }}
                        placeholder="Ej: 10"
                      />
                      <Form.Text className="text-muted">Medida vertical del producto.</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Largo (cm)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        value={largo}
                        onChange={(e) => { setLargo(e.target.value); setField("_touch", Math.random()); }}
                        placeholder="Ej: 20"
                      />
                      <Form.Text className="text-muted">Medida horizontal más larga.</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Ancho (cm)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        value={ancho}
                        onChange={(e) => { setAncho(e.target.value); setField("_touch", Math.random()); }}
                        placeholder="Ej: 30"
                      />
                      <Form.Text className="text-muted">Medida horizontal más corta.</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Stock Actual</Form.Label>
                      <Form.Control 
                          type="text"
                          value={formData.stock || 0} 
                          disabled // BLOQUEADO
                          className="bg-light fw-bold"
                      />
                      <Form.Text className="text-muted" style={{fontSize: '0.75rem'}}>
                          * Se calcula automáticamente
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Precio de Venta (CLP)</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        value={formData.precio_venta ?? ""}
                        onChange={(e) => setField("precio_venta", e.target.value === "" ? "" : parseInt(e.target.value))}
                        placeholder="Ej: 50000"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Costo CG (CLP)</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        value={formData.costo_cg ?? ""}
                        onChange={(e) => setField("costo_cg", e.target.value === "" ? "" : parseInt(e.target.value))}
                        placeholder="Ej: 30000"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Rating (0–5)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.rating ?? ""}
                        onChange={(e) => setField("rating", e.target.value === "" ? "" : parseFloat(e.target.value))}
                        placeholder="Ej: 4.5"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Lugar en Bodega</Form.Label>
                      <Form.Control
                        value={formData.lugar_bodega || ""}
                        onChange={(e) => setField("lugar_bodega", e.target.value)}
                        placeholder="Ej: A-12"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Edad de Uso</Form.Label>
                      <Form.Control
                        value={formData.edad_uso || ""}
                        onChange={(e) => setField("edad_uso", e.target.value)}
                        placeholder="Ej: 12+ años"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Descripción</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        value={formData.descripcion || ""}
                        onChange={(e) => setField("descripcion", e.target.value)}
                        placeholder="Descripción del producto"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Creado en</Form.Label>
                      <Form.Control value={createdAtStr} readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Actualizado en</Form.Label>
                      <Form.Control value={updatedAtStr} readOnly />
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Imágenes</Form.Label>
                      <Form.Control type="file" multiple accept="image/*" onChange={(e) => addFiles(e.target.files)} />
                      <Form.Text className="text-muted">Seleccione hasta 5 imágenes. Vista previa abajo.</Form.Text>
                    </Form.Group>

                    {previews.length > 0 && (
                      <Row className="g-3">
                        {previews.map((pv, idx) => (
                          <Col key={`${pv.kind}-${pv.kind === "existing" ? pv.id : pv.idx}-${idx}`} md={3}>
                            <div className="border rounded p-2 text-center">
                              <Image src={pv.url} thumbnail style={{ width: "100%", height: 160, objectFit: "cover" }} />
                              <Form.Check
                                type="radio"
                                name="principal"
                                label="Principal"
                                checked={
                                  (principal?.kind === "existing" && pv.kind === "existing" && principal.value === pv.id) ||
                                  (principal?.kind === "new" && pv.kind === "new" && principal.value === pv.idx)
                                }
                                onChange={() =>
                                  setPrincipal(
                                    pv.kind === "existing"
                                      ? { kind: "existing", value: pv.id }
                                      : { kind: "new", value: pv.idx }
                                  )
                                }
                                className="mt-2"
                              />
                              {pv.kind === "existing" ? (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  className="mt-2 w-100"
                                  onClick={() => handleDeleteImage(pv.id)}
                                >
                                  <i className="bi bi-trash"></i> Eliminar
                                </Button>
                              ) : (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  className="mt-2 w-100"
                                  onClick={() => handleRemovePreview(pv)}
                                >
                                  <i className="bi bi-trash"></i> Quitar
                                </Button>
                              )}
                            </div>
                          </Col>
                        ))}
                      </Row>
                    )}
                  </Col>
                </Row>
              </Form>
            </Modal.Body>
            <Modal.Footer className={theme === "dark" ? "bg-dark" : "bg-light"}>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSave}>Guardar</Button>
            </Modal.Footer>
          </Modal>
          {/* --- MODAL DE LOGÍSTICA (ENTRADAS/SALIDAS) --- */}
          <Modal show={showStockModal} onHide={() => setShowStockModal(false)} centered>
            <Modal.Header closeButton className="bg-dark text-white">
                <Modal.Title>Registrar Movimiento</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                {selectedProductForStock && (
                    <Alert variant="secondary" className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <strong>{selectedProductForStock.nombre_comercial}</strong>
                            <div className="small text-muted">SKU: {selectedProductForStock.sku}</div>
                        </div>
                        <Badge bg="dark">Stock Actual: {selectedProductForStock.stock}</Badge>
                    </Alert>
                )}
                
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Tipo de Operación</Form.Label>
                        <div className="d-flex gap-3">
                            <Form.Check 
                                type="radio" 
                                id="move-in"
                                label="🟢 ENTRADA (Compra)" 
                                name="moveType" 
                                checked={stockFormData.movement_type === 'IN'}
                                onChange={() => setStockFormData({...stockFormData, movement_type: 'IN'})}
                            />
                            <Form.Check 
                                type="radio" 
                                id="move-out"
                                label="🔴 SALIDA (Venta/Merma)" 
                                name="moveType" 
                                checked={stockFormData.movement_type === 'OUT'}
                                onChange={() => setStockFormData({...stockFormData, movement_type: 'OUT'})}
                            />
                        </div>
                    </Form.Group>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Cantidad</Form.Label>
                                <InputGroup>
                                    <Form.Control 
                                        type="number" 
                                        min="1" 
                                        value={stockFormData.quantity} 
                                        onChange={(e) => setStockFormData({...stockFormData, quantity: e.target.value})}
                                    />
                                    <InputGroup.Text>u.</InputGroup.Text>
                                </InputGroup>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group>
                        <Form.Label>Motivo / Razón <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={2}
                            placeholder="Ej: Factura #5501, Ajuste de fin de mes..."
                            value={stockFormData.reason}
                            onChange={(e) => setStockFormData({...stockFormData, reason: e.target.value})}
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowStockModal(false)}>Cancelar</Button>
                <Button 
                    variant={stockFormData.movement_type === 'IN' ? 'success' : 'danger'} 
                    onClick={handleSubmitStockMovement}
                >
                    Confirmar {stockFormData.movement_type === 'IN' ? 'Entrada' : 'Salida'}
                </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </div>
  );
}

export default AdminProducts;