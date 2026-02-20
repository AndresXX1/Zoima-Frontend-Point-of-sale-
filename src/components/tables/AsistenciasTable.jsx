// components/tables/AsistenciasTable.jsx
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
  Snackbar,
  Alert,
  CircularProgress,
  Typography,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from "@mui/material";
import { 
  FilterList, 
  Refresh, 
  Download,
  Person,
  Schedule,
  CalendarMonth,
  Visibility
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import { format, parseISO, differenceInHours, differenceInMinutes } from 'date-fns';

const API_URL = "http://localhost:3000/api";

const AsistenciasTable = () => {
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  
  // Filtros
  const [fechaDesde, setFechaDesde] = useState(null);
  const [fechaHasta, setFechaHasta] = useState(null);
  const [empleadoFilter, setEmpleadoFilter] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [empleados, setEmpleados] = useState([]);
  
  // Mostrar snackbar
  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  // Formatear fecha para mostrar
  const formatFecha = (fechaStr) => {
    try {
      const fecha = parseISO(fechaStr);
      return format(fecha, "dd/MM/yyyy");
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      return fechaStr;
    }
  };

  // Formatear hora para mostrar
  const formatHora = (horaStr) => {
    if (!horaStr) return null;
    try {
      const hora = parseISO(horaStr);
      return format(hora, "HH:mm:ss");
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      return horaStr;
    }
  };

  // Calcular horas trabajadas
  const calcularHorasTrabajadas = (horaIngresoStr, horaEgresoStr) => {
    if (!horaIngresoStr || !horaEgresoStr) return null;
    
    try {
      const horaIngreso = parseISO(horaIngresoStr);
      const horaEgreso = parseISO(horaEgresoStr);
      
      const horas = differenceInHours(horaEgreso, horaIngreso);
      const minutos = differenceInMinutes(horaEgreso, horaIngreso) % 60;
      
      return `${horas}:${minutos.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error("Error calculando horas:", error);
      return null;
    }
  };

  // Cargar todos los empleados
  const fetchEmpleados = async () => {
    try {
      const response = await fetch(`${API_URL}/empleados`, {
        method: 'GET',
        credentials: 'include',
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
      setEmpleados(data);
      
    } catch (error) {
      console.error("Error al cargar empleados:", error);
      showSnackbar("Error al cargar la lista de empleados", "error");
    }
  };

  // Cargar asistencias de un empleado específico
  const fetchAsistenciasEmpleado = async (empleadoId) => {
    try {
      const response = await fetch(`${API_URL}/empleados/${empleadoId}/asistencias`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return []; // Empleado no tiene asistencias
        }
        throw new Error(`Error HTTP: ${response.status}`);
      }

      return await response.json();
      
    } catch (error) {
      console.error(`Error al cargar asistencias del empleado ${empleadoId}:`, error);
      return [];
    }
  };

  // Cargar todas las asistencias (de todos los empleados)
  const fetchTodasAsistencias = async () => {
    try {
      setLoading(true);
      
      // Primero cargamos todos los empleados
      if (empleados.length === 0) {
        await fetchEmpleados();
      }
      
      if (empleados.length === 0) {
        setAsistencias([]);
        return;
      }
      
      // Cargar asistencias para cada empleado
      const todasAsistencias = [];
      
      for (const empleado of empleados) {
        const asistenciasEmpleado = await fetchAsistenciasEmpleado(empleado.id);
        
        // Agregar información del empleado a cada asistencia
        const asistenciasConEmpleado = asistenciasEmpleado.map(asistencia => ({
          ...asistencia,
          empleado_nombre: `${empleado.nombre} ${empleado.apellido}`,
          empleado_id: empleado.id,
          horas_trabajadas: calcularHorasTrabajadas(asistencia.hora_ingreso, asistencia.hora_egreso)
        }));
        
        todasAsistencias.push(...asistenciasConEmpleado);
      }
      
      // Ordenar por fecha (más reciente primero)
      todasAsistencias.sort((a, b) => {
        const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
        const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
        return fechaB - fechaA;
      });
      
      setAsistencias(todasAsistencias);
      
    } catch (error) {
      console.error("Error al cargar asistencias:", error);
      showSnackbar("Error al cargar las asistencias", "error");
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      await fetchEmpleados();
      await fetchTodasAsistencias();
    };
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtrar asistencias
  const filtrarAsistencias = () => {
    let filtradas = [...asistencias];
    
    // Filtrar por fecha desde
    if (fechaDesde) {
      const fechaDesdeDate = new Date(fechaDesde);
      fechaDesdeDate.setHours(0, 0, 0, 0);
      
      filtradas = filtradas.filter(a => {
        if (!a.fecha) return false;
        const fechaAsistencia = new Date(a.fecha);
        fechaAsistencia.setHours(0, 0, 0, 0);
        return fechaAsistencia >= fechaDesdeDate;
      });
    }
    
    // Filtrar por fecha hasta
    if (fechaHasta) {
      const fechaHastaDate = new Date(fechaHasta);
      fechaHastaDate.setHours(23, 59, 59, 999);
      
      filtradas = filtradas.filter(a => {
        if (!a.fecha) return false;
        const fechaAsistencia = new Date(a.fecha);
        fechaAsistencia.setHours(0, 0, 0, 0);
        return fechaAsistencia <= fechaHastaDate;
      });
    }
    
    // Filtrar por empleado
    if (empleadoFilter) {
      filtradas = filtradas.filter(a => a.empleado_id.toString() === empleadoFilter);
    }
    
    // Filtrar por tipo (completa/incompleta)
    if (tipoFilter) {
      if (tipoFilter === "completa") {
        filtradas = filtradas.filter(a => a.hora_egreso !== null);
      } else if (tipoFilter === "incompleta") {
        filtradas = filtradas.filter(a => a.hora_egreso === null);
      }
    }
    
    return filtradas;
  };

  const asistenciasFiltradas = filtrarAsistencias();

  // Limpiar filtros
  const handleClearFilters = () => {
    setFechaDesde(null);
    setFechaHasta(null);
    setEmpleadoFilter("");
    setTipoFilter("");
  };

  // Refrescar datos
  const handleRefresh = () => {
    fetchTodasAsistencias();
    showSnackbar("Datos actualizados", "success");
  };

  // Exportar a CSV (simulado por ahora)
  const handleExportCSV = () => {
    // Aquí iría la lógica para exportar a CSV
    showSnackbar("Función de exportación en desarrollo", "info");
  };

  if (loading && asistencias.length === 0) {
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
          Cargando asistencias...
        </Typography>
      </Box>
    );
  }

  // Calcular estadísticas
  const jornadasCompletas = asistencias.filter(a => a.hora_egreso !== null).length;
  const jornadasIncompletas = asistencias.filter(a => a.hora_egreso === null).length;
  const fechaMasReciente = asistencias.length > 0 
    ? asistencias[0].fecha 
    : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box>
        <Box sx={{ 
          mb: 3, 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2
        }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: "white" }}>
            📋 Registro de Asistencias
          </Typography>
          
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Actualizar datos">
              <IconButton
                onClick={handleRefresh}
                sx={{
                  backgroundColor: "white",
                  "&:hover": {
                    backgroundColor: "var(--bg-soft)",
                    transform: "scale(1.05)"
                  },
                  transition: "all 0.2s"
                }}
              >
                <Refresh sx={{ color: "var(--primary)" }} />
              </IconButton>
            </Tooltip>
            
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleExportCSV}
              sx={{
                background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)",
                }
              }}
            >
              Exportar
            </Button>
          </Box>
        </Box>

        {/* Contenedor de filtros */}
        <Paper 
          elevation={1} 
          sx={{ 
            mb: 3, 
            p: 2, 
            borderRadius: 2,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)"
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <FilterList sx={{ mr: 1, color: "var(--primary)" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Filtros
            </Typography>
          </Box>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Desde"
                value={fechaDesde}
                onChange={setFechaDesde}
                slotProps={{ 
                  textField: { 
                    size: "small", 
                    fullWidth: true,
                    sx: { backgroundColor: "white" }
                  } 
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Hasta"
                value={fechaHasta}
                onChange={setFechaHasta}
                slotProps={{ 
                  textField: { 
                    size: "small", 
                    fullWidth: true,
                    sx: { backgroundColor: "white" }
                  } 
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small" sx={{ backgroundColor: "white" }}>
                <InputLabel>Empleado</InputLabel>
                <Select
                  value={empleadoFilter}
                  label="Empleado"
                  onChange={(e) => setEmpleadoFilter(e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {empleados.map(empleado => (
                    <MenuItem key={empleado.id} value={empleado.id.toString()}>
                      {empleado.nombre} {empleado.apellido}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small" sx={{ backgroundColor: "white" }}>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={tipoFilter}
                  label="Tipo"
                  onChange={(e) => setTipoFilter(e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="completa">Jornada completa</MenuItem>
                  <MenuItem value="incompleta">Sin egreso</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-start" }}>
                {(fechaDesde || fechaHasta || empleadoFilter || tipoFilter) && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleClearFilters}
                    sx={{
                      backgroundColor: "var(--bg-soft)",
                      borderColor: "#e2e8f0",
                      "&:hover": {
                        backgroundColor: "#f1f5f9",
                        borderColor: "#cbd5e1"
                      }
                    }}
                  >
                    Limpiar
                  </Button>
                )}
                
                {(fechaDesde || fechaHasta || empleadoFilter || tipoFilter) && (
                  <Chip 
                    label={`${asistenciasFiltradas.length} resultados`}
                    size="small"
                    sx={{ 
                      backgroundColor: "#dbeafe",
                      color: "#1e40af",
                      fontWeight: 500
                    }}
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Estadísticas */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, borderRadius: 2, backgroundColor: "#dbeafe" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Person sx={{ color: "#1e40af" }} />
                <Typography variant="body2" color="#1e40af" fontWeight={600}>
                  Total registros
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ mt: 1, fontWeight: 700, color: "#1e40af" }}>
                {asistencias.length}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, borderRadius: 2, backgroundColor: "var(--success-light)" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Schedule sx={{ color: "#065f46" }} />
                <Typography variant="body2" color="#065f46" fontWeight={600}>
                  Jornadas completas
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ mt: 1, fontWeight: 700, color: "#065f46" }}>
                {jornadasCompletas}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, borderRadius: 2, backgroundColor: "var(--warning-light)" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Schedule sx={{ color: "#92400e" }} />
                <Typography variant="body2" color="#92400e" fontWeight={600}>
                  Sin egreso
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ mt: 1, fontWeight: 700, color: "#92400e" }}>
                {jornadasIncompletas}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, borderRadius: 2, backgroundColor: "#f3f4f6" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CalendarMonth sx={{ color: "#4b5563" }} />
                <Typography variant="body2" color="#4b5563" fontWeight={600}>
                  Fecha más reciente
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ mt: 1, fontWeight: 600, color: "#4b5563" }}>
                {fechaMasReciente ? formatFecha(fechaMasReciente) : 'N/A'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Tabla de asistencias */}
        <TableContainer 
          component={Paper} 
          sx={{ 
            borderRadius: 3, 
            boxShadow: "0 8px 32px rgba(102, 126, 234, 0.15)",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            maxHeight: 600
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>Empleado</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>Hora Ingreso</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>Hora Egreso</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>Horas Trabajadas</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {asistenciasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      No hay asistencias registradas
                    </Typography>
                    {(fechaDesde || fechaHasta || empleadoFilter || tipoFilter) && (
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        No se encontraron resultados con los filtros aplicados
                      </Typography>
                    )}
                    {asistencias.length === 0 && !loading && (
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Los empleados aún no han registrado asistencias
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                asistenciasFiltradas.map((asistencia) => {
                  const jornadaCompleta = asistencia.hora_egreso !== null;
                  
                  return (
                    <TableRow key={asistencia.id} hover>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          #{asistencia.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {asistencia.empleado_nombre}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            ID: {asistencia.empleado_id}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={formatFecha(asistencia.fecha)}
                          size="small"
                          sx={{ 
                            backgroundColor: "var(--info-light)",
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {formatHora(asistencia.hora_ingreso) || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 500,
                            color: jornadaCompleta ? "var(--success)" : "var(--error)"
                          }}
                        >
                          {formatHora(asistencia.hora_egreso) || 'Pendiente'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 600,
                            color: asistencia.horas_trabajadas ? "var(--success)" : "#f59e0b"
                          }}
                        >
                          {asistencia.horas_trabajadas || 'En curso'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={jornadaCompleta ? "Completa" : "En curso"}
                          size="small"
                          sx={{ 
                            backgroundColor: jornadaCompleta ? "var(--success-light)" : "var(--warning-light)",
                            color: jornadaCompleta ? "#065f46" : "#92400e",
                            fontWeight: 500
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Información de filtros aplicados */}
        {(fechaDesde || fechaHasta || empleadoFilter || tipoFilter) && asistenciasFiltradas.length > 0 && (
          <Box sx={{ mt: 2, p: 2, backgroundColor: "#f1f5f9", borderRadius: 2 }}>
            <Typography variant="body2" color="textSecondary">
              <strong>Filtros aplicados:</strong> 
              {fechaDesde && ` Desde: ${format(fechaDesde, 'dd/MM/yyyy')}`}
              {fechaHasta && ` | Hasta: ${format(fechaHasta, 'dd/MM/yyyy')}`}
              {empleadoFilter && ` | Empleado: ${empleados.find(e => e.id.toString() === empleadoFilter)?.nombre || empleadoFilter}`}
              {tipoFilter && ` | Tipo: ${tipoFilter === "completa" ? "Jornada completa" : "Sin egreso"}`}
              {` | Mostrando ${asistenciasFiltradas.length} de ${asistencias.length} registros`}
            </Typography>
          </Box>
        )}

        {/* Información sobre la carga de datos */}
        {asistencias.length > 0 && (
          <Box sx={{ mt: 2, p: 1.5, backgroundColor: "#f0f9ff", borderRadius: 2 }}>
            <Typography variant="caption" color="var(--info)">
              <strong>Nota:</strong> Las asistencias se cargan desde los historiales individuales de cada empleado. 
              Se muestran {asistencias.length} registros de {empleados.length} empleados.
            </Typography>
          </Box>
        )}

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
    </LocalizationProvider>
  );
};

export default AsistenciasTable;