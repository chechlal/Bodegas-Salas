import React, { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

// Componente principal para la vista de historial
function VistaDeHistorial() {
  // Estado para almacenar los registros del historial
  const [history, setHistory] = useState([]);
  // Estado para controlar la pantalla de carga
  const [loading, setLoading] = useState(true);
  // Estado para manejar cualquier error de la API
  const [error, setError] = useState(null);
  
  // Obtenemos la función authFetch de nuestro contexto de autenticación
  const { authFetch } = useAuth();

  // useEffect se ejecuta una vez que el componente se monta
  useEffect(() => {
    // Título de la página
    document.title = "Historial de Cambios - xAI";

    // Función asíncrona para cargar los datos del historial
    const fetchHistory = async () => {
      try {
        setError(null); // Reseteamos cualquier error previo
        const response = await authFetch('/api/product-history/'); // Usamos authFetch para la petición segura

        if (!response.ok) {
          throw new Error('No se pudo obtener la respuesta del servidor.');
        }

        const data = await response.json();
        // Guardamos los resultados en el estado. El endpoint puede devolver 'results' o un array directamente.
        setHistory(data.results || data); 
      } catch (err) {
        console.error("Error al cargar el historial:", err);
        setError("Hubo un problema al cargar el historial de cambios. Inténtelo de nuevo más tarde.");
      } finally {
        // Ocultamos el spinner de carga, ya sea que la petición haya sido exitosa o fallida
        setLoading(false);
      }
    };

    fetchHistory();
  }, [authFetch]); // El efecto depende de authFetch para evitar warnings del linter

  // Función auxiliar para renderizar una insignia de color según el tipo de cambio
  const renderChangeType = (changeType) => {
    switch (changeType) {
      case '+':
        return <Badge bg="success">Creación</Badge>;
      case '~':
        return <Badge bg="warning" text="dark">Modificación</Badge>;
      case '-':
        return <Badge bg="danger">Eliminación</Badge>;
      default:
        return <Badge bg="secondary">{changeType}</Badge>;
    }
  };

  // Renderiza el spinner de carga
  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando historial de cambios...</p>
      </Container>
    );
  }

  // Renderiza el mensaje de error si algo falló
  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  // Renderiza la tabla con los datos del historial
  return (
    <Container className="mt-5 p-4 bg-body rounded-3 shadow-lg">
      <h2 className="mb-4 text-center fw-bold">Historial de Cambios en Productos</h2>
      {history.length === 0 ? (
        <Alert variant="info">Aún no se han registrado cambios en los productos.</Alert>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover responsive>
            <thead className="table-dark">
              <tr>
                <th>Fecha y Hora</th>
                <th>Producto (SKU)</th>
                <th>Tipo de Cambio</th>
                <th>Usuario</th>
                <th>Detalles Relevantes</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record) => (
                <tr key={record.history_id}>
                  {/* Formateamos la fecha para que sea legible */}
                  <td>{new Date(record.history_date).toLocaleString('es-CL')}</td>
                  <td>
                    <strong>{record.nombre_comercial}</strong>
                    <br />
                    <small className="text-muted">{record.sku}</small>
                  </td>
                  <td className="text-center">
                    {renderChangeType(record.history_type)}
                  </td>
                  {/* Mostramos el nombre de usuario o 'Sistema' si no está definido */}
                  <td>{record.history_user_id ? `Admin #${record.history_user_id}` : 'Sistema'}</td>
                  <td>
                    {/* Para modificaciones, mostramos los valores de stock y precio de ese momento */}
                    {record.history_type !== '-' ? (
                       <ul className="list-unstyled mb-0 small">
                         <li><strong>Stock:</strong> {record.stock}</li>
                         <li><strong>Precio Venta:</strong> ${new Intl.NumberFormat('es-CL').format(record.precio_venta)}</li>
                       </ul>
                    ) : (
                      <span className="text-muted">Registro eliminado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </Container>
  );
}

export default VistaDeHistorial;