import React from "react";
import ProductGrid from "../components/ProductGrid";

function VistaPrincipalCatalogo() {
  return (
    <div className="container mt-5 p-5 bg-body rounded-3 shadow-lg">
      <h2 className="mb-4 text-center fw-bold text-success">Catálogo de Productos en Bodega</h2>
      <ProductGrid />
    </div>
  );
}

export default VistaPrincipalCatalogo;