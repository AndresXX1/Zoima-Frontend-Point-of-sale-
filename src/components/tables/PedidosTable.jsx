// components/tables/PedidosTable.jsx
import { useState, useEffect } from "react";
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Badge
} from "@mui/material";
import { 
  Add, 
  Visibility,
  Edit,
  Delete,
  Refresh,
  Save,
  Cancel,
  Store,
  Inventory,
  AttachMoney,
  CalendarToday,
  CheckCircle,
  Pending,
  LocalShipping,
  DoneAll,
  Close,
  ShoppingCart,
  RemoveShoppingCart
} from "@mui/icons-material";

const API_URL = "http://localhost:3000/api";

const PedidosTable = () => {
  const [pedidos, setPedidos] = useState([]);
  const [kioscos, setKioscos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Diálogos
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openEditEstadoDialog, setOpenEditEstadoDialog] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  
  // Estados para notificaciones
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  
  // Pedido seleccionado
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [pedidoDetalle, setPedidoDetalle] = useState(null);
  
  // Formulario de nuevo pedido
  const [formData, setFormData] = useState({
    kiosco_id: "",
    productos: [{ producto_id: "", cantidad: 1 }]
  });

  // Estado para edición
  const [editEstado, setEditEstado] = useState("");

  // Mapeo de estados
  const getEstadoInfo = (estado) => {
    switch(estado) {
      case 'PENDIENTE':
        return { 
          label: 'Pendiente', 
          color: '#f59e0b', 
          bgColor: 'var(--warning-light)',
          icon: <Pending sx={{ fontSize: 14 }} />,
          step: 0
        };
      case 'EN_PROCESO':
        return { 
          label: 'En Proceso', 
          color: '#3b82f6', 
          bgColor: '#dbeafe',
          icon: <LocalShipping sx={{ fontSize: 14 }} />,
          step: 1
        };
      case 'COMPLETADO':
        return { 
          label: 'Completado', 
          color: 'var(--primary)', 
          bgColor: 'var(--success-light)',
          icon: <DoneAll sx={{ fontSize: 14 }} />,
          step: 2
        };
      case 'CANCELADO':
        return { 
          label: 'Cancelado', 
          color: '#ef4444', 
          bgColor: 'var(--error-light)',
          icon: <Close sx={{ fontSize: 14 }} />,
          step: -1
        };
      default:
        return { 
          label: estado, 
          color: '#64748b', 
          bgColor: '#f1f5f9',
          icon: <Pending sx={{ fontSize: 14 }} />,
          step: 0
        };
    }
  };

  // Mostrar snackbar
  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  // Cargar pedidos
  const fetchPedidos = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/pedidos`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      setPedidos(result.data || []);
      
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      showSnackbar("Error al cargar los pedidos", "error");
    } finally {
      setLoading(false);
    }
  };

  // Cargar kioscos
  const fetchKioscos = async () => {
    try {
      const response = await fetch(`${API_URL}/kioscos`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setKioscos(data);
      }
    } catch (error) {
      console.error("Error al cargar kioscos:", error);
    }
  };

  // Cargar productos
  const fetchProductos = async () => {
    try {
      const response = await fetch(`${API_URL}/productos`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filtrar solo productos activos
        const productosActivos = data.filter(p => p.activo !== false);
        setProductos(productosActivos);
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

  // Cargar detalle de pedido
  const fetchPedidoDetalle = async (id) => {
    try {
      const response = await fetch(`${API_URL}/pedidos/${id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar detalle del pedido');
      }

      const result = await response.json();
      setPedidoDetalle(result.data);
      
    } catch (error) {
      console.error("Error al cargar detalle:", error);
      showSnackbar("Error al cargar el detalle del pedido", "error");
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchPedidos(),
        fetchKioscos(),
        fetchProductos()
      ]);
    };
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manejar cambio en productos del formulario
  const handleProductoChange = (index, field, value) => {
    const updatedProductos = [...formData.productos];
    updatedProductos[index][field] = value;
    setFormData({ ...formData, productos: updatedProductos });
  };

  // Agregar producto al formulario
  const handleAddProducto = () => {
    setFormData({
      ...formData,
      productos: [...formData.productos, { producto_id: "", cantidad: 1 }]
    });
  };

  // Eliminar producto del formulario
  const handleRemoveProducto = (index) => {
    const updatedProductos = formData.productos.filter((_, i) => i !== index);
    setFormData({ ...formData, productos: updatedProductos });
  };

  // Validar formulario de creación
  const validarCreateForm = () => {
    if (!formData.kiosco_id) {
      showSnackbar("Debes seleccionar un kiosco", "error");
      return false;
    }

    if (formData.productos.length === 0) {
      showSnackbar("Debes agregar al menos un producto", "error");
      return false;
    }

    for (const producto of formData.productos) {
      if (!producto.producto_id) {
        showSnackbar("Todos los productos deben tener un producto seleccionado", "error");
        return false;
      }
      if (!producto.cantidad || producto.cantidad <= 0) {
        showSnackbar("La cantidad debe ser mayor a 0", "error");
        return false;
      }
    }

    return true;
  };

  // Crear nuevo pedido
  const handleCreatePedido = async () => {
    if (!validarCreateForm()) return;

    try {
      const response = await fetch(`${API_URL}/pedidos`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kiosco_id: parseInt(formData.kiosco_id),
          productos: formData.productos.map(p => ({
            producto_id: parseInt(p.producto_id),
            cantidad: parseInt(p.cantidad)
          }))
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al crear pedido');
      }

      // Actualizar lista
      await fetchPedidos();
      
      // Limpiar formulario y cerrar diálogo
      setFormData({
        kiosco_id: "",
        productos: [{ producto_id: "", cantidad: 1 }]
      });
      setOpenCreateDialog(false);
      
      showSnackbar("Pedido creado exitosamente");
      
    } catch (error) {
      console.error("Error al crear pedido:", error);
      showSnackbar(error.message || "Error al crear el pedido", "error");
    }
  };

  // Ver detalles del pedido
  const handleDetailsClick = async (pedido) => {
    setSelectedPedido(pedido);
    await fetchPedidoDetalle(pedido.id);
    setOpenDetailsDialog(true);
  };

  // Abrir diálogo para cambiar estado
  const handleEditEstadoClick = (pedido) => {
    setSelectedPedido(pedido);
    setEditEstado(pedido.estado);
    setOpenEditEstadoDialog(true);
  };

  // Actualizar estado del pedido
  const handleUpdateEstado = async () => {
    try {
      const response = await fetch(`${API_URL}/pedidos/${selectedPedido.id}/estado`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado: editEstado
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar estado');
      }

      // Actualizar lista
      await fetchPedidos();
      
      setOpenEditEstadoDialog(false);
      setSelectedPedido(null);
      
      showSnackbar("Estado actualizado exitosamente");
      
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      showSnackbar(error.message || "Error al actualizar el estado", "error");
    }
  };

  // Eliminar pedido
  const handleDeletePedido = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este pedido?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/pedidos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al eliminar pedido');
      }

      // Actualizar lista
      await fetchPedidos();
      
      showSnackbar("Pedido eliminado exitosamente");
      
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
      showSnackbar(error.message || "Error al eliminar el pedido", "error");
    }
  };

  // Formatear fecha
  const formatFecha = (fechaStr) => {
    if (!fechaStr) return 'N/A';
    try {
      return new Date(fechaStr).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fechaStr;
    }
  };

  // Formatear precio
  const formatPrecio = (precio) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(precio);
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: 400,
        flexDirection: "column",
        gap: 2
      }}>
        <CircularProgress />
        <Typography variant="body1" color="textSecondary">
          Cargando pedidos...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ 
        mb: 3, 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        flexWrap: "wrap",
        gap: 2
      }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: "white" }}>
          🛒 Gestión de Pedidos
        </Typography>
        
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Actualizar">
            <IconButton
              onClick={fetchPedidos}
              sx={{
                backgroundColor: "white",
                "&:hover": { backgroundColor: "var(--bg-soft)" }
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenCreateDialog(true)}
            sx={{
              background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, var(--primary-dark) 0%, #6b46c1 100%)",
              }
            }}
          >
            Nuevo Pedido
          </Button>
        </Box>
      </Box>

      {/* Tabla de pedidos */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: 3, 
          boxShadow: "0 8px 32px rgba(102, 126, 234, 0.15)",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          maxHeight: 600,
          overflowX: "auto",
          "& .MuiTableCell-root": {
            whiteSpace: "nowrap",
            padding: "12px 16px"
          }
        }}
      >
        <Table stickyHeader sx={{ minWidth: 1000 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", width: "5%" }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", width: "15%" }}>Kiosco</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", width: "15%" }}>Fecha</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", width: "10%" }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", width: "10%" }}>Productos</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", width: "15%" }}>Total</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", width: "20%" }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pedidos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <RemoveShoppingCart sx={{ fontSize: 48, color: "#94a3b8" }} />
                    <Typography variant="body1" color="textSecondary">
                      No hay pedidos registrados
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Haz clic en "Nuevo Pedido" para crear el primero
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              pedidos.map((pedido) => {
                const estadoInfo = getEstadoInfo(pedido.estado);
                const kioscoNombre = kioscos.find(k => k.id === pedido.kiosco_id)?.nombre || `Kiosco ${pedido.kiosco_id}`;
                
                return (
                  <TableRow key={pedido.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        #{pedido.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Store sx={{ color: "#64748b", fontSize: 18 }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {kioscoNombre}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CalendarToday sx={{ color: "#64748b", fontSize: 16 }} />
                        <Typography variant="body2">
                          {formatFecha(pedido.fecha)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        icon={estadoInfo.icon}
                        label={estadoInfo.label}
                        size="small"
                        sx={{ 
                          backgroundColor: estadoInfo.bgColor,
                          color: estadoInfo.color,
                          fontWeight: 600,
                          border: `1px solid ${estadoInfo.color}30`,
                          "& .MuiChip-icon": {
                            color: estadoInfo.color
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge 
                        badgeContent={pedido.total_productos || 0} 
                        color="primary"
                        sx={{ "& .MuiBadge-badge": { fontWeight: 600 } }}
                      >
                        <Inventory sx={{ color: "#64748b" }} />
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        icon={<AttachMoney sx={{ fontSize: 14 }} />}
                        label={formatPrecio(pedido.total || 0)}
                        size="small"
                        sx={{ 
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="Ver detalles" arrow>
                          <IconButton
                            size="small"
                            sx={{
                              backgroundColor: "#f3f4f6",
                              "&:hover": { 
                                backgroundColor: "#e5e7eb",
                                transform: "scale(1.1)"
                              }
                            }}
                            onClick={() => handleDetailsClick(pedido)}
                          >
                            <Visibility fontSize="small" sx={{ color: "var(--primary)" }} />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Cambiar estado" arrow>
                          <IconButton
                            size="small"
                            sx={{
                              backgroundColor: "#f3f4f6",
                              "&:hover": { 
                                backgroundColor: "#e5e7eb",
                                transform: "scale(1.1)"
                              }
                            }}
                            onClick={() => handleEditEstadoClick(pedido)}
                          >
                            <Edit fontSize="small" sx={{ color: "#f59e0b" }} />
                          </IconButton>
                        </Tooltip>
                        
                        {pedido.estado !== 'COMPLETADO' && pedido.estado !== 'CANCELADO' && (
                          <Tooltip title="Eliminar" arrow>
                            <IconButton
                              size="small"
                              sx={{
                                backgroundColor: "var(--error-light)",
                                "&:hover": { 
                                  backgroundColor: "#fecaca",
                                  transform: "scale(1.1)"
                                }
                              }}
                              onClick={() => handleDeletePedido(pedido.id)}
                            >
                              <Delete fontSize="small" sx={{ color: "#ef4444" }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo para crear pedido */}
      <Dialog 
        open={openCreateDialog} 
        onClose={() => {
          setOpenCreateDialog(false);
          setFormData({
            kiosco_id: "",
            productos: [{ producto_id: "", cantidad: 1 }]
          });
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ 
          fontWeight: 600, 
          backgroundColor: "var(--bg-soft)",
          borderBottom: "1px solid #e2e8f0"
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ShoppingCart sx={{ color: "var(--primary)" }} />
            Nuevo Pedido
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Kiosco</InputLabel>
                <Select
                  value={formData.kiosco_id}
                  label="Kiosco"
                  onChange={(e) => setFormData({...formData, kiosco_id: e.target.value})}
                  required
                >
                  {kioscos.map(kiosco => (
                    <MenuItem key={kiosco.id} value={kiosco.id}>
                      {kiosco.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Productos
              </Typography>
              
              {formData.productos.map((producto, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Producto</InputLabel>
                        <Select
                          value={producto.producto_id}
                          label="Producto"
                          onChange={(e) => handleProductoChange(index, 'producto_id', e.target.value)}
                          required
                        >
                          {productos.map(p => (
                            <MenuItem key={p.id} value={p.id}>
                              {p.nombre}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Cantidad"
                        type="number"
                        size="small"
                        value={producto.cantidad}
                        onChange={(e) => handleProductoChange(index, 'cantidad', e.target.value)}
                        inputProps={{ min: 1 }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveProducto(index)}
                        disabled={formData.productos.length === 1}
                        sx={{ color: "#ef4444" }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              ))}

              <Button
                startIcon={<Add />}
                onClick={handleAddProducto}
                size="small"
                sx={{ mt: 1 }}
              >
                Agregar otro producto
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: "var(--bg-soft)", borderTop: "1px solid #e2e8f0" }}>
          <Button 
            onClick={() => {
              setOpenCreateDialog(false);
              setFormData({
                kiosco_id: "",
                productos: [{ producto_id: "", cantidad: 1 }]
              });
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCreatePedido}
            startIcon={<Save />}
            sx={{
              background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, var(--primary-dark) 0%, #6b46c1 100%)",
              }
            }}
          >
            Crear Pedido
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para ver detalles del pedido */}
      <Dialog 
        open={openDetailsDialog} 
        onClose={() => {
          setOpenDetailsDialog(false);
          setSelectedPedido(null);
          setPedidoDetalle(null);
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ 
          fontWeight: 600, 
          backgroundColor: "var(--bg-soft)",
          borderBottom: "1px solid #e2e8f0"
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Visibility sx={{ color: "var(--primary)" }} />
            Detalles del Pedido #{selectedPedido?.id}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {pedidoDetalle && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, backgroundColor: "var(--bg-soft)", borderRadius: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="textSecondary">
                        Kiosco
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                        <Store sx={{ color: "#64748b", fontSize: 18 }} />
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {kioscos.find(k => k.id === pedidoDetalle.kiosco_id)?.nombre || `Kiosco ${pedidoDetalle.kiosco_id}`}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="textSecondary">
                        Fecha
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                        <CalendarToday sx={{ color: "#64748b", fontSize: 18 }} />
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {formatFecha(pedidoDetalle.fecha)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="textSecondary">
                        Estado
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip 
                          icon={getEstadoInfo(pedidoDetalle.estado).icon}
                          label={getEstadoInfo(pedidoDetalle.estado).label}
                          size="small"
                          sx={{ 
                            backgroundColor: getEstadoInfo(pedidoDetalle.estado).bgColor,
                            color: getEstadoInfo(pedidoDetalle.estado).color,
                            fontWeight: 600
                          }}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Productos
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: "var(--bg-soft)" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Producto</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">Cantidad</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Precio Unit.</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pedidoDetalle.detalle?.map((item) => {
                        const producto = productos.find(p => p.id === item.producto_id);
                        return (
                          <TableRow key={item.producto_id}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {producto?.nombre || `Producto ${item.producto_id}`}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={item.cantidad}
                                size="small"
                                sx={{ backgroundColor: '#f1f5f9' }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              {formatPrecio(item.precio_unitario || 0)}
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e40af' }}>
                                {formatPrecio(item.subtotal || 0)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow>
                        <TableCell colSpan={3} align="right" sx={{ fontWeight: 600 }}>
                          Total:
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e40af' }}>
                            {formatPrecio(pedidoDetalle.total || 0)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: "var(--bg-soft)", borderTop: "1px solid #e2e8f0" }}>
          <Button 
            onClick={() => {
              setOpenDetailsDialog(false);
              setSelectedPedido(null);
              setPedidoDetalle(null);
            }}
          >
            Cerrar
          </Button>
          {selectedPedido && selectedPedido.estado !== 'COMPLETADO' && selectedPedido.estado !== 'CANCELADO' && (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => {
                setOpenDetailsDialog(false);
                handleEditEstadoClick(selectedPedido);
              }}
              sx={{
                background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, var(--primary-dark) 0%, #6b46c1 100%)",
                }
              }}
            >
              Cambiar Estado
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Diálogo para cambiar estado */}
      <Dialog 
        open={openEditEstadoDialog} 
        onClose={() => {
          setOpenEditEstadoDialog(false);
          setSelectedPedido(null);
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ 
          fontWeight: 600, 
          backgroundColor: "var(--bg-soft)",
          borderBottom: "1px solid #e2e8f0"
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Edit sx={{ color: "var(--primary)" }} />
            Cambiar Estado - Pedido #{selectedPedido?.id}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={editEstado}
                  label="Estado"
                  onChange={(e) => setEditEstado(e.target.value)}
                >
                  <MenuItem value="PENDIENTE">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Pending sx={{ color: "#f59e0b" }} />
                      Pendiente
                    </Box>
                  </MenuItem>
                  <MenuItem value="EN_PROCESO">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LocalShipping sx={{ color: "#3b82f6" }} />
                      En Proceso
                    </Box>
                  </MenuItem>
                  <MenuItem value="COMPLETADO">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <DoneAll sx={{ color: "var(--primary)" }} />
                      Completado
                    </Box>
                  </MenuItem>
                  <MenuItem value="CANCELADO">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Close sx={{ color: "#ef4444" }} />
                      Cancelado
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {selectedPedido && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, backgroundColor: "var(--bg-soft)", borderRadius: 2 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Estado actual:
                  </Typography>
                  <Chip 
                    icon={getEstadoInfo(selectedPedido.estado).icon}
                    label={getEstadoInfo(selectedPedido.estado).label}
                    size="small"
                    sx={{ 
                      backgroundColor: getEstadoInfo(selectedPedido.estado).bgColor,
                      color: getEstadoInfo(selectedPedido.estado).color,
                      fontWeight: 600
                    }}
                  />
                </Paper>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: "var(--bg-soft)", borderTop: "1px solid #e2e8f0" }}>
          <Button 
            onClick={() => {
              setOpenEditEstadoDialog(false);
              setSelectedPedido(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateEstado}
            startIcon={<Save />}
            sx={{
              background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, var(--primary-dark) 0%, #6b46c1 100%)",
              }
            }}
          >
            Actualizar Estado
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert 
          onClose={() => setOpenSnackbar(false)} 
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PedidosTable;