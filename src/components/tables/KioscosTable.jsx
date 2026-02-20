// components/tables/KioscosTable.jsx
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
  Typography
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";

// Cambia esta URL por la correcta de tu backend
const API_URL = "http://localhost:3000/api"; // O la URL donde corre tu backend

const KioscosTable = () => {
  const [kioscos, setKioscos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [formData, setFormData] = useState({
    nombre: "",
    direccion: ""
  });

  // Función para mostrar snackbar
  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  // Cargar kioscos desde la API
  const fetchKioscos = async () => {
    try {
      setLoading(true);
      
      // IMPORTANTE: Configurar credentials: 'include' para enviar cookies
      const response = await fetch(`${API_URL}/kioscos`, {
        method: 'GET',
        credentials: 'include', // Esto envía las cookies automáticamente
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          showSnackbar("No autenticado. Por favor, inicia sesión.", "error");
          return;
        }
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      setKioscos(data);
      
    } catch (error) {
      console.error("Error al cargar kioscos:", error);
      
      // Verificar si es error de conexión
      if (error.message.includes("Failed to fetch") || error.message.includes("Connection refused")) {
        showSnackbar("Error de conexión con el servidor. Verifica que el backend esté corriendo.", "error");
      } else {
        showSnackbar("Error al cargar los kioscos", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchKioscos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manejar cambio en formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Crear nuevo kiosco
  const handleCreateKiosco = async () => {
    try {
      // Validar campos
      if (!formData.nombre.trim()) {
        showSnackbar("El nombre del kiosco es obligatorio", "error");
        return;
      }
      
      if (!formData.direccion.trim()) {
        showSnackbar("La dirección es obligatoria", "error");
        return;
      }

      // Configurar fetch con credentials: 'include'
      const response = await fetch(`${API_URL}/kioscos`, {
        method: 'POST',
        credentials: 'include', // Envía cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          direccion: formData.direccion.trim()
        })
      });

      if (!response.ok) {
        if (response.status === 400) {
          showSnackbar("Error de validación. Verifica los datos.", "error");
          return;
        }
        if (response.status === 401) {
          showSnackbar("No autenticado. Por favor, inicia sesión.", "error");
          return;
        }
        if (response.status === 403) {
          showSnackbar("No tienes permisos para realizar esta acción", "error");
          return;
        }
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const newKiosco = await response.json();
      
      // Agregar el nuevo kiosco a la lista
      setKioscos(prev => [...prev, newKiosco]);
      
      // Limpiar formulario y cerrar diálogo
      setFormData({ nombre: "", direccion: "" });
      setOpenDialog(false);
      
      showSnackbar("Kiosco creado exitosamente");
      
    } catch (error) {
      console.error("Error al crear kiosco:", error);
      showSnackbar("Error al crear el kiosco", "error");
    }
  };

  // Eliminar kiosco
  const handleDeleteKiosco = async (id) => {
    // Confirmación antes de eliminar
    if (!window.confirm("¿Estás seguro de que deseas eliminar este kiosco?")) {
      return;
    }

    try {
      // Configurar fetch con credentials: 'include'
      const response = await fetch(`${API_URL}/kioscos/${id}`, {
        method: 'DELETE',
        credentials: 'include', // Envía cookies
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          showSnackbar("No autenticado. Por favor, inicia sesión.", "error");
          return;
        }
        if (response.status === 403) {
          showSnackbar("No tienes permisos para realizar esta acción", "error");
          return;
        }
        if (response.status === 404) {
          showSnackbar("Kiosco no encontrado", "error");
          return;
        }
        throw new Error(`Error HTTP: ${response.status}`);
      }

      // Eliminar kiosco de la lista local
      setKioscos(prev => prev.filter(kiosco => kiosco.id !== id));
      
      showSnackbar("Kiosco eliminado exitosamente");
      
    } catch (error) {
      console.error("Error al eliminar kiosco:", error);
      showSnackbar("Error al eliminar el kiosco", "error");
    }
  };

  // Estado de carga
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
          Cargando kioscos...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ 
        mb: 3, 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        flexWrap: "wrap",
        gap: 2
      }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: "white" }}>
          📋 Gestión de Kioscos
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
          sx={{
            background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, var(--primary-dark) 0%, #6b46c1 100%)",
            }
          }}
        >
          Agregar Nueva Sucursal
        </Button>
      </Box>

      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: 3, 
          boxShadow: "0 8px 32px rgba(102, 126, 234, 0.15)",
          backgroundColor: "rgba(255, 255, 255, 0.95)"
        }}
      >
        <Table>
          <TableHead sx={{ backgroundColor: "var(--bg-soft)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Dirección</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {kioscos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    No hay kioscos registrados
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Haz clic en "Agregar Nueva Sucursal" para crear el primero
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              kioscos.map((kiosco) => (
                <TableRow key={kiosco.id} hover>
                  <TableCell>{kiosco.id}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{kiosco.nombre}</TableCell>
                  <TableCell>{kiosco.direccion}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: kiosco.activo ? "var(--success-light)" : "var(--error-light)",
                        color: kiosco.activo ? "#065f46" : "#991b1b",
                        fontSize: "0.875rem",
                        fontWeight: 500
                      }}
                    >
                      {kiosco.activo ? "Activo" : "Inactivo"}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton
                        size="small"
                        sx={{
                          backgroundColor: "#f3f4f6",
                          "&:hover": { 
                            backgroundColor: "#e5e7eb",
                            transform: "scale(1.1)"
                          },
                          transition: "all 0.2s"
                        }}
                        onClick={() => showSnackbar("Función de edición en desarrollo", "info")}
                      >
                        <Edit fontSize="small" sx={{ color: "var(--primary)" }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{
                          backgroundColor: "var(--error-light)",
                          "&:hover": { 
                            backgroundColor: "#fecaca",
                            transform: "scale(1.1)"
                          },
                          transition: "all 0.2s"
                        }}
                        onClick={() => handleDeleteKiosco(kiosco.id)}
                      >
                        <Delete fontSize="small" sx={{ color: "#ef4444" }} />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo para agregar nuevo kiosco */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Agregar Nueva Sucursal</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              fullWidth
              label="Nombre del Kiosco"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              required
              autoFocus
            />
            <TextField
              fullWidth
              label="Dirección"
              name="direccion"
              value={formData.direccion}
              onChange={handleInputChange}
              required
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => {
              setOpenDialog(false);
              setFormData({ nombre: "", direccion: "" });
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateKiosco}
            sx={{
              background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, var(--primary-dark) 0%, #6b46c1 100%)",
              }
            }}
          >
            Crear Kiosco
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
    </>
  );
};

export default KioscosTable;