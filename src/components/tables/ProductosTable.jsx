// components/tables/ProductosTable.jsx
import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Typography,
  Chip,
  Grid,
  Tooltip,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  TablePagination,
  Divider
} from "@mui/material";
import { 
  Edit, 
  Delete, 
  Add, 
  Inventory,
  AttachMoney,
  Refresh,
  Save,
  QrCodeScanner,
  LocalOffer,
  Search,
  FilterList,
  Clear
} from "@mui/icons-material";

const API_URL = "http://localhost:3000/api";

const ProductosTable = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("activos"); // "todos" | "activos" | "inactivos"
  
  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Diálogos
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [selectedProducto, setSelectedProducto] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: "",
    precio: "",
    precio_costo: "",
    codigo_barra: ""
  });

  const [editFormData, setEditFormData] = useState({
    nombre: "",
    precio: "",
    precio_costo: "",
    codigo_barra: ""
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/productos?todos=true`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

      const data = await response.json();
      // Guardamos todos los productos (activos e inactivos)
      // El filtrado se maneja en el frontend con el ToggleButtonGroup
      setProductos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      showSnackbar("Error al cargar los productos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Productos filtrados y buscados
  const productosFiltrados = useMemo(() => {
    let resultado = [...productos];

    // Normalizar el campo activo (puede venir como boolean true/false o string "t"/"f" de postgres)
    const isActivo = (p) => p.activo === true || p.activo === "t";

    // Filtro por estado
    if (statusFilter === "activos") {
      resultado = resultado.filter(p => isActivo(p));
    } else if (statusFilter === "inactivos") {
      resultado = resultado.filter(p => !isActivo(p));
    }

    // Búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      resultado = resultado.filter(p =>
        p.nombre?.toLowerCase().includes(query) ||
        p.codigo_barra?.toLowerCase().includes(query) ||
        String(p.id).includes(query)
      );
    }

    return resultado;
  }, [productos, statusFilter, searchQuery]);

  // Productos de la página actual
  const productosPaginados = useMemo(() => {
    const start = page * rowsPerPage;
    return productosFiltrados.slice(start, start + rowsPerPage);
  }, [productosFiltrados, page, rowsPerPage]);

  // Resetear página al cambiar filtros
  const handleStatusFilter = (_, newValue) => {
    if (newValue !== null) {
      setStatusFilter(newValue);
      setPage(0);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setPage(0);
  };

  const validarCreateForm = () => {
    if (!formData.nombre.trim()) {
      showSnackbar("El nombre del producto es obligatorio", "error");
      return false;
    }
    if (!formData.precio) {
      showSnackbar("El precio de venta es obligatorio", "error");
      return false;
    }
    const precio = Number(formData.precio);
    if (isNaN(precio) || precio <= 0) {
      showSnackbar("El precio de venta debe ser un número mayor a 0", "error");
      return false;
    }
    if (!formData.precio_costo) {
      showSnackbar("El precio de costo es obligatorio", "error");
      return false;
    }
    const precioCosto = Number(formData.precio_costo);
    if (isNaN(precioCosto) || precioCosto <= 0) {
      showSnackbar("El precio de costo debe ser un número mayor a 0", "error");
      return false;
    }
    if (precioCosto >= precio) {
      showSnackbar("El precio de costo no puede ser mayor o igual al precio de venta", "error");
      return false;
    }
    return true;
  };

  const validarEditForm = () => {
    if (!editFormData.nombre.trim()) {
      showSnackbar("El nombre del producto es obligatorio", "error");
      return false;
    }
    if (!editFormData.precio) {
      showSnackbar("El precio de venta es obligatorio", "error");
      return false;
    }
    const precio = Number(editFormData.precio);
    if (isNaN(precio) || precio <= 0) {
      showSnackbar("El precio de venta debe ser un número mayor a 0", "error");
      return false;
    }
    if (!editFormData.precio_costo) {
      showSnackbar("El precio de costo es obligatorio", "error");
      return false;
    }
    const precioCosto = Number(editFormData.precio_costo);
    if (isNaN(precioCosto) || precioCosto <= 0) {
      showSnackbar("El precio de costo debe ser un número mayor a 0", "error");
      return false;
    }
    if (precioCosto >= precio) {
      showSnackbar("El precio de costo no puede ser mayor o igual al precio de venta", "error");
      return false;
    }
    return true;
  };

  const handleCreateProducto = async () => {
    if (!validarCreateForm()) return;
    try {
      const response = await fetch(`${API_URL}/productos`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          precio: Number(formData.precio),
          precio_costo: Number(formData.precio_costo),
          codigo_barra: formData.codigo_barra || null
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Error al crear producto');
      await fetchProductos();
      setFormData({ nombre: "", precio: "", precio_costo: "", codigo_barra: "" });
      setOpenCreateDialog(false);
      showSnackbar("Producto creado exitosamente");
    } catch (error) {
      showSnackbar(error.message || "Error al crear el producto", "error");
    }
  };

  const handleEditClick = (producto) => {
    setSelectedProducto(producto);
    setEditFormData({
      nombre: producto.nombre,
      precio: producto.precio,
      precio_costo: producto.precio_costo || "",
      codigo_barra: producto.codigo_barra || ""
    });
    setOpenEditDialog(true);
  };

  const handleUpdateProducto = async () => {
    if (!validarEditForm()) return;
    try {
      const response = await fetch(`${API_URL}/productos/${selectedProducto.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: editFormData.nombre.trim(),
          precio: Number(editFormData.precio),
          precio_costo: Number(editFormData.precio_costo)
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Error al actualizar producto');
      await fetchProductos();
      setOpenEditDialog(false);
      setSelectedProducto(null);
      showSnackbar("Producto actualizado exitosamente");
    } catch (error) {
      showSnackbar(error.message || "Error al actualizar el producto", "error");
    }
  };

  const handleDeleteProducto = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este producto?")) return;
    try {
      const response = await fetch(`${API_URL}/productos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error(response.status === 404 ? 'Producto no encontrado' : 'Error al eliminar producto');
      }
      await fetchProductos();
      showSnackbar("Producto eliminado exitosamente");
    } catch (error) {
      showSnackbar(error.message || "Error al eliminar el producto", "error");
    }
  };

  const calcularMargen = (precio, precioCosto) => {
    if (!precioCosto || precioCosto === 0) return 0;
    return ((precio - precioCosto) / precioCosto * 100).toFixed(1);
  };

  const formatPrecio = (precio) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(precio);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400, flexDirection: "column", gap: 2 }}>
        <CircularProgress />
        <Typography variant="body1" color="textSecondary">Cargando productos...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: "white" }}>
          📦 Gestión de Productos
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Actualizar">
            <IconButton onClick={fetchProductos} sx={{ backgroundColor: "white", "&:hover": { backgroundColor: "var(--bg-soft)" } }}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenCreateDialog(true)}
            sx={{
              background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
              "&:hover": { background: "linear-gradient(135deg, var(--primary-dark) 0%, #6b46c1 100%)" }
            }}
          >
            Agregar Producto
          </Button>
        </Box>
      </Box>

      {/* Barra de búsqueda y filtros */}
      <Paper sx={{ 
        p: 2, 
        mb: 2, 
        borderRadius: 3, 
        boxShadow: "0 4px 16px rgba(102, 126, 234, 0.1)",
        backgroundColor: "rgba(255, 255, 255, 0.97)"
      }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          {/* Buscador */}
          <TextField
            placeholder="Buscar por nombre, código o ID..."
            value={searchQuery}
            onChange={handleSearch}
            size="small"
            sx={{ flexGrow: 1, minWidth: 220 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "#94a3b8", fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <Clear sx={{ fontSize: 18 }} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />

          <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />

          {/* Filtro de estado */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FilterList sx={{ color: "#94a3b8", fontSize: 20 }} />
            <ToggleButtonGroup
              value={statusFilter}
              exclusive
              onChange={handleStatusFilter}
              size="small"
              sx={{
                "& .MuiToggleButton-root": {
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "0.8rem",
                  px: 1.5,
                  py: 0.5,
                  borderColor: "#e2e8f0",
                  color: "#64748b",
                  "&.Mui-selected": {
                    backgroundColor: "var(--primary)",
                    color: "white",
                    "&:hover": { backgroundColor: "var(--primary-dark)" }
                  }
                }
              }}
            >
              <ToggleButton value="activos">
                Activos
                <Chip label={productos.filter(p => p.activo === true || p.activo === "t").length} size="small" sx={{ ml: 0.5, height: 18, fontSize: "0.7rem", backgroundColor: "rgba(0,0,0,0.08)" }} />
              </ToggleButton>
              <ToggleButton value="todos">
                Todos
                <Chip label={productos.length} size="small" sx={{ ml: 0.5, height: 18, fontSize: "0.7rem", backgroundColor: "rgba(0,0,0,0.08)" }} />
              </ToggleButton>
              <ToggleButton value="inactivos">
                Inactivos
                <Chip label={productos.filter(p => p.activo !== true && p.activo !== "t").length} size="small" sx={{ ml: 0.5, height: 18, fontSize: "0.7rem", backgroundColor: "rgba(0,0,0,0.08)" }} />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Resultado de búsqueda */}
          {(searchQuery || statusFilter !== "activos") && (
            <Typography variant="body2" color="textSecondary" sx={{ ml: "auto", whiteSpace: "nowrap" }}>
              {productosFiltrados.length} resultado{productosFiltrados.length !== 1 ? "s" : ""}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Tabla */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: 3, 
          boxShadow: "0 8px 32px rgba(102, 126, 234, 0.15)",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          maxHeight: 520,
          overflowX: "auto",
          "& .MuiTableCell-root": {
            whiteSpace: "nowrap",
            padding: "12px 16px"
          }
        }}
      >
        <Table stickyHeader sx={{ minWidth: 1100 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>Producto</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>Código de Barras</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>Precio Costo</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>Precio Venta</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>Margen</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>Stock Mínimo</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {productosPaginados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="textSecondary">
                    {searchQuery ? "No se encontraron productos con esa búsqueda" : "No hay productos en esta categoría"}
                  </Typography>
                  {searchQuery && (
                    <Button size="small" onClick={handleClearSearch} sx={{ mt: 1 }}>
                      Limpiar búsqueda
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              productosPaginados.map((producto) => {
                const margen = calcularMargen(producto.precio, producto.precio_costo);
                const margenColor = margen >= 30 ? "var(--success-light)" : margen >= 20 ? "#fef9c3" : "var(--error-light)";
                const margenTextColor = margen >= 30 ? "#065f46" : margen >= 20 ? "#854d0e" : "#991b1b";
                
                return (
                  <TableRow key={producto.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>#{producto.id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "var(--primary)15", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Inventory sx={{ color: "var(--primary)", fontSize: 18 }} />
                        </Box>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>{producto.nombre}</Typography>
                          <Typography variant="caption" color="textSecondary">ID: {producto.id}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {producto.codigo_barra ? (
                        <Chip icon={<QrCodeScanner sx={{ fontSize: 14 }} />} label={producto.codigo_barra} size="small" sx={{ backgroundColor: '#f1f5f9', color: '#334155', fontWeight: 500, fontFamily: 'monospace' }} />
                      ) : (
                        <Typography variant="body2" color="textSecondary">---</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip icon={<LocalOffer sx={{ fontSize: 14 }} />} label={formatPrecio(producto.precio_costo || 0)} size="small" sx={{ backgroundColor: '#f1f5f9', color: '#334155', fontWeight: 500 }} />
                    </TableCell>
                    <TableCell>
                      <Chip icon={<AttachMoney sx={{ fontSize: 14 }} />} label={formatPrecio(producto.precio)} size="small" sx={{ backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={`${margen}%`} size="small" sx={{ backgroundColor: margenColor, color: margenTextColor, fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={producto.stock_minimo || 0} size="small" sx={{ backgroundColor: '#f1f5f9', color: '#334155', fontWeight: 500 }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={(producto.activo === true || producto.activo === "t") ? "Activo" : "Inactivo"} size="small" sx={{ backgroundColor: (producto.activo === true || producto.activo === "t") ? "var(--success-light)" : "var(--error-light)", color: (producto.activo === true || producto.activo === "t") ? "#065f46" : "#991b1b", fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="Editar" arrow>
                          <IconButton size="small" sx={{ backgroundColor: "#f3f4f6", "&:hover": { backgroundColor: "#e5e7eb", transform: "scale(1.1)" } }} onClick={() => handleEditClick(producto)}>
                            <Edit fontSize="small" sx={{ color: "#f59e0b" }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar" arrow>
                          <IconButton size="small" sx={{ backgroundColor: "var(--error-light)", "&:hover": { backgroundColor: "#fecaca", transform: "scale(1.1)" } }} onClick={() => handleDeleteProducto(producto.id)}>
                            <Delete fontSize="small" sx={{ color: "#ef4444" }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación */}
      <TablePagination
        component={Paper}
        count={productosFiltrados.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[10, 15]}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        sx={{
          mt: 1,
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(102, 126, 234, 0.08)",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          "& .MuiTablePagination-toolbar": { px: 2 }
        }}
      />

      {/* Diálogo crear producto */}
      <Dialog 
        open={openCreateDialog} 
        onClose={() => { setOpenCreateDialog(false); setFormData({ nombre: "", precio: "", precio_costo: "", codigo_barra: "" }); }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", borderBottom: "1px solid #e2e8f0" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Add sx={{ color: "var(--primary)" }} />
            Agregar Nuevo Producto
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: "20px !important" }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nombre del Producto" name="nombre" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required size="small"
                InputProps={{ startAdornment: <InputAdornment position="start"><Inventory sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Precio de Costo" name="precio_costo" type="number" value={formData.precio_costo} onChange={(e) => setFormData({...formData, precio_costo: e.target.value})} required size="small"
                InputProps={{ startAdornment: <InputAdornment position="start"><LocalOffer sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment>, inputProps: { step: "0.01", min: "0.01" } }}
                helperText="Precio que pagaste por el producto" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Precio de Venta" name="precio" type="number" value={formData.precio} onChange={(e) => setFormData({...formData, precio: e.target.value})} required size="small"
                InputProps={{ startAdornment: <InputAdornment position="start"><AttachMoney sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment>, inputProps: { step: "0.01", min: "0.01" } }}
                helperText="Precio final al público" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Código de Barras (opcional)" name="codigo_barra" value={formData.codigo_barra} onChange={(e) => setFormData({...formData, codigo_barra: e.target.value})} size="small"
                InputProps={{ startAdornment: <InputAdornment position="start"><QrCodeScanner sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment> }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: "var(--bg-soft)", borderTop: "1px solid #e2e8f0" }}>
          <Button onClick={() => { setOpenCreateDialog(false); setFormData({ nombre: "", precio: "", precio_costo: "", codigo_barra: "" }); }}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateProducto} startIcon={<Save />}
            sx={{ background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)", "&:hover": { background: "linear-gradient(135deg, var(--primary-dark) 0%, #6b46c1 100%)" } }}>
            Crear Producto
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo editar producto */}
      <Dialog 
        open={openEditDialog} 
        onClose={() => { setOpenEditDialog(false); setSelectedProducto(null); }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", borderBottom: "1px solid #e2e8f0" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Edit sx={{ color: "var(--primary)" }} />
            Editar Producto - {selectedProducto?.nombre}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: "20px !important" }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nombre del Producto" value={editFormData.nombre} onChange={(e) => setEditFormData({...editFormData, nombre: e.target.value})} required size="small"
                InputProps={{ startAdornment: <InputAdornment position="start"><Inventory sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Precio de Costo" type="number" value={editFormData.precio_costo} onChange={(e) => setEditFormData({...editFormData, precio_costo: e.target.value})} required size="small"
                InputProps={{ startAdornment: <InputAdornment position="start"><LocalOffer sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment>, inputProps: { step: "0.01", min: "0.01" } }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Precio de Venta" type="number" value={editFormData.precio} onChange={(e) => setEditFormData({...editFormData, precio: e.target.value})} required size="small"
                InputProps={{ startAdornment: <InputAdornment position="start"><AttachMoney sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment>, inputProps: { step: "0.01", min: "0.01" } }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Código de Barras" value={editFormData.codigo_barra} size="small" disabled
                InputProps={{ startAdornment: <InputAdornment position="start"><QrCodeScanner sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment> }}
                helperText="El código de barras no se puede modificar" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: "var(--bg-soft)", borderTop: "1px solid #e2e8f0" }}>
          <Button onClick={() => { setOpenEditDialog(false); setSelectedProducto(null); }}>Cancelar</Button>
          <Button variant="contained" onClick={handleUpdateProducto} startIcon={<Save />}
            sx={{ background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)", "&:hover": { background: "linear-gradient(135deg, var(--primary-dark) 0%, #6b46c1 100%)" } }}>
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={openSnackbar} autoHideDuration={4000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductosTable;