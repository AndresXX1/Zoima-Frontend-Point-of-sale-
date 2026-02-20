// components/tables/UsuariosSistemaTable.jsx
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  Switch,
  FormControlLabel,
  ToggleButton,
  ToggleButtonGroup,
  TablePagination,
  Divider
} from "@mui/material";
import { 
  Edit, 
  Delete, 
  Add, 
  Person,
  Email,
  Lock,
  Store,
  AdminPanelSettings,
  Business,
  Refresh,
  Save,
  Cancel,
  LockReset,
  Search,
  FilterList,
  Clear
} from "@mui/icons-material";

const API_URL = "http://localhost:3000/api";

const UsuariosSistemaTable = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [kioscos, setKioscos] = useState([]);
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
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  
  // Estados para notificaciones
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  
  // Usuario seleccionado para editar/ver
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  
  // Formulario de nuevo usuario
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rol_id: 2,
    kiosco_id: ""
  });

  // Formulario de edición
  const [editFormData, setEditFormData] = useState({
    email: "",
    rol_id: "",
    kiosco_id: "",
    activo: true
  });

  // Formulario de cambio de contraseña
  const [passwordFormData, setPasswordFormData] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  // Mapeo de roles
  const getRolInfo = (rolId, rolNombre) => {
    if (rolNombre) {
      switch(rolNombre.toUpperCase()) {
        case 'ADMIN':
          return { 
            label: 'Administrador', 
            color: '#8b5cf6', 
            bgColor: '#8b5cf615',
            icon: <AdminPanelSettings sx={{ fontSize: 16 }} /> 
          };
        case 'KIOSCO':
          return { 
            label: 'Kiosco', 
            color: '#0891b2', 
            bgColor: '#0891b215',
            icon: <Store sx={{ fontSize: 16 }} /> 
          };
        default:
          return { 
            label: rolNombre, 
            color: '#64748b', 
            bgColor: '#64748b15',
            icon: <Person sx={{ fontSize: 16 }} /> 
          };
      }
    }
    
    switch(rolId) {
      case 1:
        return { 
          label: 'Administrador', 
          color: '#8b5cf6', 
          bgColor: '#8b5cf615',
          icon: <AdminPanelSettings sx={{ fontSize: 16 }} /> 
        };
      case 2:
        return { 
          label: 'Kiosco', 
          color: '#0891b2', 
          bgColor: '#0891b215',
          icon: <Store sx={{ fontSize: 16 }} /> 
        };
      default:
        return { 
          label: 'Desconocido', 
          color: '#64748b', 
          bgColor: '#64748b15',
          icon: <Person sx={{ fontSize: 16 }} /> 
        };
    }
  };

  // Mostrar snackbar
  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  // Cargar usuarios del sistema
  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/usuarios-sistema?todos=true`, {
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
      // Guardamos todos los usuarios (activos e inactivos)
      setUsuarios(result.data || []);
      
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      showSnackbar("Error al cargar los usuarios del sistema", "error");
    } finally {
      setLoading(false);
    }
  };

  // Cargar roles disponibles
  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_URL}/usuarios-sistema/roles`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        setRoles(result.data || []);
      }
    } catch (error) {
      console.error("Error al cargar roles:", error);
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

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchUsuarios(),
        fetchRoles(),
        fetchKioscos()
      ]);
    };
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Usuarios filtrados y buscados
  const usuariosFiltrados = useMemo(() => {
    let resultado = [...usuarios];

    // Filtro por estado
    if (statusFilter === "activos") {
      resultado = resultado.filter(u => u.activo === true);
    } else if (statusFilter === "inactivos") {
      resultado = resultado.filter(u => u.activo === false);
    }

    // Búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      resultado = resultado.filter(u =>
        u.email?.toLowerCase().includes(query) ||
        String(u.id).includes(query) ||
        u.rol?.toLowerCase().includes(query) ||
        kioscos.find(k => k.id === u.kiosco_id)?.nombre?.toLowerCase().includes(query)
      );
    }

    return resultado;
  }, [usuarios, statusFilter, searchQuery, kioscos]);

  // Usuarios de la página actual
  const usuariosPaginados = useMemo(() => {
    const start = page * rowsPerPage;
    return usuariosFiltrados.slice(start, start + rowsPerPage);
  }, [usuariosFiltrados, page, rowsPerPage]);

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

  // Validar formulario de creación
  const validarCreateForm = () => {
    if (!formData.email.trim()) {
      showSnackbar("El email es obligatorio", "error");
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showSnackbar("El email no es válido", "error");
      return false;
    }
    
    if (!formData.password.trim()) {
      showSnackbar("La contraseña es obligatoria", "error");
      return false;
    }
    
    if (formData.password.length < 6) {
      showSnackbar("La contraseña debe tener al menos 6 caracteres", "error");
      return false;
    }
    
    if (formData.rol_id === 2 && !formData.kiosco_id) {
      showSnackbar("Debes seleccionar un kiosco para el rol KIOSCO", "error");
      return false;
    }
    
    return true;
  };

  // Validar formulario de edición
  const validarEditForm = () => {
    if (!editFormData.email.trim()) {
      showSnackbar("El email es obligatorio", "error");
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      showSnackbar("El email no es válido", "error");
      return false;
    }
    
    if (editFormData.rol_id === 2 && !editFormData.kiosco_id) {
      showSnackbar("Debes seleccionar un kiosco para el rol KIOSCO", "error");
      return false;
    }
    
    return true;
  };

  // Validar cambio de contraseña
  const validarPasswordForm = () => {
    if (!passwordFormData.newPassword) {
      showSnackbar("La nueva contraseña es obligatoria", "error");
      return false;
    }
    
    if (passwordFormData.newPassword.length < 6) {
      showSnackbar("La contraseña debe tener al menos 6 caracteres", "error");
      return false;
    }
    
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      showSnackbar("Las contraseñas no coinciden", "error");
      return false;
    }
    
    return true;
  };

  // Crear nuevo usuario
  const handleCreateUsuario = async () => {
    if (!validarCreateForm()) return;

    try {
      const response = await fetch(`${API_URL}/usuarios-sistema`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          rol_id: formData.rol_id,
          kiosco_id: formData.kiosco_id || null
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al crear usuario');
      }

      await fetchUsuarios();
      
      setFormData({
        email: "",
        password: "",
        rol_id: 2,
        kiosco_id: ""
      });
      setOpenCreateDialog(false);
      
      showSnackbar("Usuario creado exitosamente");
      
    } catch (error) {
      console.error("Error al crear usuario:", error);
      showSnackbar(error.message || "Error al crear el usuario", "error");
    }
  };

  // Ver detalles
  const handleDetailsClick = (usuario) => {
    setSelectedUsuario(usuario);
    setOpenDetailsDialog(true);
  };

  // Abrir diálogo de edición
  const handleEditClick = (usuario) => {
    setSelectedUsuario(usuario);
    setEditFormData({
      email: usuario.email,
      rol_id: usuario.rol_id,
      kiosco_id: usuario.kiosco_id || "",
      activo: usuario.activo
    });
    setOpenEditDialog(true);
  };

  // Actualizar usuario
  const handleUpdateUsuario = async () => {
    if (!validarEditForm()) return;

    try {
      const response = await fetch(`${API_URL}/usuarios-sistema/${selectedUsuario.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: editFormData.email.trim(),
          rol_id: editFormData.rol_id,
          kiosco_id: editFormData.kiosco_id || null,
          activo: editFormData.activo
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar usuario');
      }

      await fetchUsuarios();
      
      setOpenEditDialog(false);
      setSelectedUsuario(null);
      
      showSnackbar("Usuario actualizado exitosamente");
      
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      showSnackbar(error.message || "Error al actualizar el usuario", "error");
    }
  };

  // Abrir diálogo de cambio de contraseña
  const handlePasswordClick = (usuario) => {
    setSelectedUsuario(usuario);
    setPasswordFormData({
      newPassword: "",
      confirmPassword: ""
    });
    setOpenPasswordDialog(true);
  };

  // Cambiar contraseña
  const handleUpdatePassword = async () => {
    if (!validarPasswordForm()) return;

    try {
      const response = await fetch(`${API_URL}/usuarios-sistema/${selectedUsuario.id}/password`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: passwordFormData.newPassword
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al cambiar contraseña');
      }

      setOpenPasswordDialog(false);
      setSelectedUsuario(null);
      
      showSnackbar("Contraseña actualizada exitosamente");
      
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      showSnackbar(error.message || "Error al cambiar la contraseña", "error");
    }
  };

  // Eliminar usuario (baja lógica)
  const handleDeleteUsuario = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas desactivar este usuario?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/usuarios-sistema/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al desactivar usuario');
      }

      await fetchUsuarios();
      
      showSnackbar("Usuario desactivado exitosamente");
      
    } catch (error) {
      console.error("Error al desactivar usuario:", error);
      showSnackbar(error.message || "Error al desactivar el usuario", "error");
    }
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
          Cargando usuarios del sistema...
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
          👤 Usuarios del Sistema
        </Typography>
        
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Actualizar">
            <IconButton
              onClick={fetchUsuarios}
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
            Agregar Usuario
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
            placeholder="Buscar por email, ID, rol o kiosco..."
            value={searchQuery}
            onChange={handleSearch}
            size="small"
            sx={{ flexGrow: 1, minWidth: 250 }}
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
                <Chip 
                  label={usuarios.filter(u => u.activo === true).length} 
                  size="small" 
                  sx={{ ml: 0.5, height: 18, fontSize: "0.7rem", backgroundColor: "rgba(0,0,0,0.08)" }} 
                />
              </ToggleButton>
              <ToggleButton value="todos">
                Todos
                <Chip 
                  label={usuarios.length} 
                  size="small" 
                  sx={{ ml: 0.5, height: 18, fontSize: "0.7rem", backgroundColor: "rgba(0,0,0,0.08)" }} 
                />
              </ToggleButton>
              <ToggleButton value="inactivos">
                Inactivos
                <Chip 
                  label={usuarios.filter(u => u.activo === false).length} 
                  size="small" 
                  sx={{ ml: 0.5, height: 18, fontSize: "0.7rem", backgroundColor: "rgba(0,0,0,0.08)" }} 
                />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Resultado de búsqueda */}
          {(searchQuery || statusFilter !== "activos") && (
            <Typography variant="body2" color="textSecondary" sx={{ ml: "auto", whiteSpace: "nowrap" }}>
              {usuariosFiltrados.length} resultado{usuariosFiltrados.length !== 1 ? "s" : ""}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Tabla de usuarios del sistema */}
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
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", width: "5%" }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", width: "25%" }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", width: "15%" }}>Rol</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", width: "15%" }}>Kiosco</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", width: "10%" }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", width: "10%" }}>Creado</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", width: "20%" }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuariosPaginados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="textSecondary">
                    {searchQuery ? "No se encontraron usuarios con esa búsqueda" : "No hay usuarios en esta categoría"}
                  </Typography>
                  {searchQuery && (
                    <Button size="small" onClick={handleClearSearch} sx={{ mt: 1 }}>
                      Limpiar búsqueda
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              usuariosPaginados.map((usuario) => {
                const rolInfo = getRolInfo(usuario.rol_id, usuario.rol);
                const kioscoNombre = kioscos.find(k => k.id === usuario.kiosco_id)?.nombre || 'No asignado';
                
                return (
                  <TableRow 
                    key={usuario.id} 
                    hover
                    sx={{
                      opacity: usuario.activo ? 1 : 0.7,
                      backgroundColor: !usuario.activo ? '#fef2f2' : 'inherit'
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        #{usuario.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{ 
                          width: 32, 
                          height: 32, 
                          borderRadius: "50%", 
                          backgroundColor: `${rolInfo.color}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          {rolInfo.icon}
                        </Box>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {usuario.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        icon={rolInfo.icon}
                        label={rolInfo.label}
                        size="small"
                        sx={{ 
                          backgroundColor: rolInfo.bgColor,
                          color: rolInfo.color,
                          fontWeight: 600,
                          border: `1px solid ${rolInfo.color}30`,
                          "& .MuiChip-icon": {
                            color: rolInfo.color
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {usuario.rol_id === 2 ? (
                        <Chip 
                          icon={<Business sx={{ fontSize: 14 }} />}
                          label={kioscoNombre}
                          size="small"
                          sx={{ 
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                            fontWeight: 500
                          }}
                        />
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          ---
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={usuario.activo ? "Activo" : "Inactivo"}
                        size="small"
                        sx={{ 
                          backgroundColor: usuario.activo ? "var(--success-light)" : "var(--error-light)",
                          color: usuario.activo ? "#065f46" : "#991b1b",
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {new Date(usuario.created_at).toLocaleDateString('es-ES')}
                      </Typography>
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
                            onClick={() => handleDetailsClick(usuario)}
                          >
                            <Person fontSize="small" sx={{ color: "var(--primary)" }} />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Editar" arrow>
                          <IconButton
                            size="small"
                            sx={{
                              backgroundColor: "#f3f4f6",
                              "&:hover": { 
                                backgroundColor: "#e5e7eb",
                                transform: "scale(1.1)"
                              }
                            }}
                            onClick={() => handleEditClick(usuario)}
                          >
                            <Edit fontSize="small" sx={{ color: "#f59e0b" }} />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Cambiar contraseña" arrow>
                          <IconButton
                            size="small"
                            sx={{
                              backgroundColor: "#f3f4f6",
                              "&:hover": { 
                                backgroundColor: "#e5e7eb",
                                transform: "scale(1.1)"
                              }
                            }}
                            onClick={() => handlePasswordClick(usuario)}
                          >
                            <LockReset fontSize="small" sx={{ color: "#0891b2" }} />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title={usuario.activo ? "Desactivar" : "Activar"} arrow>
                          <IconButton
                            size="small"
                            sx={{
                              backgroundColor: usuario.activo ? "var(--error-light)" : "var(--success-light)",
                              "&:hover": { 
                                backgroundColor: usuario.activo ? "#fecaca" : "#bbf7d0",
                                transform: "scale(1.1)"
                              }
                            }}
                            onClick={() => handleDeleteUsuario(usuario.id)}
                          >
                            <Delete fontSize="small" sx={{ 
                              color: usuario.activo ? "#ef4444" : "var(--primary-dark)" 
                            }} />
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
        count={usuariosFiltrados.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { 
          setRowsPerPage(parseInt(e.target.value, 10)); 
          setPage(0); 
        }}
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

      {/* Diálogo para crear usuario */}
      <Dialog 
        open={openCreateDialog} 
        onClose={() => setOpenCreateDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            overflow: "hidden"
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 600, 
          backgroundColor: "var(--bg-soft)",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 10,
          py: 2
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Add sx={{ color: "var(--primary)" }} />
            Agregar Usuario del Sistema
          </Box>
        </DialogTitle>
        
        <DialogContent 
          sx={{ 
            pt: "24px !important",
            pb: "16px !important",
            overflowY: "auto",
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "#f1f1f1",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#c1c1c1",
              borderRadius: "4px",
              "&:hover": {
                backgroundColor: "#a8a8a8",
              },
            },
          }}
        >
          <Box sx={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 2.5
          }}>
            {/* Email Field */}
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: "#64748b", fontSize: 18 }} />
                  </InputAdornment>
                )
              }}
            />
            
            {/* Password Field */}
            <TextField
              fullWidth
              label="Contraseña"
              name="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: "#64748b", fontSize: 18 }} />
                  </InputAdornment>
                )
              }}
              helperText="Mínimo 6 caracteres"
            />
            
            {/* Rol Select */}
            <FormControl fullWidth size="small">
              <InputLabel>Rol</InputLabel>
              <Select
                value={formData.rol_id}
                label="Rol"
                onChange={(e) => setFormData({...formData, rol_id: e.target.value, kiosco_id: ""})}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 300,
                      '& .MuiMenuItem-root': {
                        minHeight: 40,
                      }
                    }
                  }
                }}
              >
                {roles.map(rol => (
                  <MenuItem key={rol.id} value={rol.id}>
                    {rol.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Kiosco Select (conditional) */}
            {formData.rol_id === 2 && (
              <FormControl fullWidth size="small" required>
                <InputLabel>Kiosco</InputLabel>
                <Select
                  value={formData.kiosco_id}
                  label="Kiosco"
                  onChange={(e) => setFormData({...formData, kiosco_id: e.target.value})}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 300,
                        '& .MuiMenuItem-root': {
                          minHeight: 40,
                        }
                      }
                    }
                  }}
                >
                  {kioscos.map(kiosco => (
                    <MenuItem key={kiosco.id} value={kiosco.id}>
                      {kiosco.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 2.5, 
          backgroundColor: "var(--bg-soft)", 
          borderTop: "1px solid #e2e8f0",
          position: "sticky",
          bottom: 0,
          zIndex: 10
        }}>
          <Button 
            onClick={() => setOpenCreateDialog(false)}
            variant="outlined"
            sx={{ mr: 1 }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateUsuario}
            startIcon={<Save />}
            sx={{
              background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, var(--primary-dark) 0%, #6b46c1 100%)",
              }
            }}
          >
            Crear Usuario
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para editar usuario */}
      <Dialog 
        open={openEditDialog} 
        onClose={() => setOpenEditDialog(false)} 
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
            Editar Usuario - {selectedUsuario?.email}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: "20px !important" }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                required
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: "#64748b", fontSize: 18 }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Rol</InputLabel>
                <Select
                  value={editFormData.rol_id}
                  label="Rol"
                  onChange={(e) => setEditFormData({...editFormData, rol_id: e.target.value, kiosco_id: ""})}
                >
                  {roles.map(rol => (
                    <MenuItem key={rol.id} value={rol.id}>
                      {rol.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {editFormData.rol_id === 2 && (
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Kiosco</InputLabel>
                  <Select
                    value={editFormData.kiosco_id}
                    label="Kiosco"
                    onChange={(e) => setEditFormData({...editFormData, kiosco_id: e.target.value})}
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
            )}
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editFormData.activo}
                    onChange={(e) => setEditFormData({...editFormData, activo: e.target.checked})}
                    color="primary"
                  />
                }
                label={editFormData.activo ? "Usuario Activo" : "Usuario Inactivo"}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: "var(--bg-soft)", borderTop: "1px solid #e2e8f0" }}>
          <Button onClick={() => setOpenEditDialog(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateUsuario}
            startIcon={<Save />}
            sx={{
              background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, var(--primary-dark) 0%, #6b46c1 100%)",
              }
            }}
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para cambiar contraseña */}
      <Dialog 
        open={openPasswordDialog} 
        onClose={() => setOpenPasswordDialog(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ 
          fontWeight: 600, 
          backgroundColor: "var(--bg-soft)",
          borderBottom: "1px solid #e2e8f0"
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LockReset sx={{ color: "var(--primary)" }} />
            Cambiar Contraseña - {selectedUsuario?.email}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: "20px !important" }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nueva Contraseña"
                type="password"
                value={passwordFormData.newPassword}
                onChange={(e) => setPasswordFormData({...passwordFormData, newPassword: e.target.value})}
                required
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: "#64748b", fontSize: 18 }} />
                    </InputAdornment>
                  )
                }}
                helperText="Mínimo 6 caracteres"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirmar Contraseña"
                type="password"
                value={passwordFormData.confirmPassword}
                onChange={(e) => setPasswordFormData({...passwordFormData, confirmPassword: e.target.value})}
                required
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: "#64748b", fontSize: 18 }} />
                    </InputAdornment>
                  )
                }}
                error={passwordFormData.newPassword !== passwordFormData.confirmPassword && passwordFormData.confirmPassword !== ""}
                helperText={
                  passwordFormData.newPassword !== passwordFormData.confirmPassword && 
                  passwordFormData.confirmPassword !== "" 
                    ? "Las contraseñas no coinciden" 
                    : ""
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: "var(--bg-soft)", borderTop: "1px solid #e2e8f0" }}>
          <Button onClick={() => setOpenPasswordDialog(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdatePassword}
            startIcon={<Save />}
            sx={{
              background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, var(--primary-dark) 0%, #6b46c1 100%)",
              }
            }}
          >
            Cambiar Contraseña
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para ver detalles */}
      <Dialog 
        open={openDetailsDialog} 
        onClose={() => setOpenDetailsDialog(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ 
          fontWeight: 600, 
          backgroundColor: "var(--bg-soft)",
          borderBottom: "1px solid #e2e8f0"
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Person sx={{ color: "var(--primary)" }} />
            Detalles del Usuario
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedUsuario && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 2,
                  p: 2,
                  backgroundColor: "var(--bg-soft)",
                  borderRadius: 2,
                  mb: 2
                }}>
                  <Box sx={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: "50%", 
                    backgroundColor: `${getRolInfo(selectedUsuario.rol_id, selectedUsuario.rol).color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {getRolInfo(selectedUsuario.rol_id, selectedUsuario.rol).icon}
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {selectedUsuario.email}
                    </Typography>
                    <Chip 
                      label={selectedUsuario.activo ? "Activo" : "Inactivo"}
                      size="small"
                      sx={{ 
                        backgroundColor: selectedUsuario.activo ? "var(--success-light)" : "var(--error-light)",
                        color: selectedUsuario.activo ? "#065f46" : "#991b1b",
                        fontWeight: 600,
                        mt: 0.5
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  ID de Usuario
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                  #{selectedUsuario.id}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Rol
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip 
                    icon={getRolInfo(selectedUsuario.rol_id, selectedUsuario.rol).icon}
                    label={getRolInfo(selectedUsuario.rol_id, selectedUsuario.rol).label}
                    size="small"
                    sx={{ 
                      backgroundColor: getRolInfo(selectedUsuario.rol_id, selectedUsuario.rol).bgColor,
                      color: getRolInfo(selectedUsuario.rol_id, selectedUsuario.rol).color,
                      fontWeight: 600
                    }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Kiosco Asignado
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                  {selectedUsuario.rol_id === 2 
                    ? (kioscos.find(k => k.id === selectedUsuario.kiosco_id)?.nombre || 'No asignado')
                    : 'N/A'
                  }
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Fecha de Creación
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                  {new Date(selectedUsuario.created_at).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </Grid>
              
              {selectedUsuario.updated_at && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Última Actualización
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                    {new Date(selectedUsuario.updated_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: "var(--bg-soft)", borderTop: "1px solid #e2e8f0" }}>
          <Button onClick={() => setOpenDetailsDialog(false)}>
            Cerrar
          </Button>
          {selectedUsuario && (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => {
                setOpenDetailsDialog(false);
                handleEditClick(selectedUsuario);
              }}
              sx={{
                background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, var(--primary-dark) 0%, #6b46c1 100%)",
                }
              }}
            >
              Editar Usuario
            </Button>
          )}
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

export default UsuariosSistemaTable;