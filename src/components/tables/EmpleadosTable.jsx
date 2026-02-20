// components/tables/EmpleadosTable.jsx
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
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TablePagination,
  Divider,
  Checkbox
} from "@mui/material";
import { 
  Edit, 
  Delete, 
  Add, 
  Visibility,
  Person,
  Email,
  Badge,
  Lock,
  CalendarToday,
  Download,
  CheckCircle,
  Cancel,
  FilterList,
  PictureAsPdf,
  SelectAll,
  Deselect,
  Search,
  Clear
} from "@mui/icons-material";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = "http://localhost:3000/api";

// 🆕 HOOK SIMPLIFICADO con logs
const useImageToBase64 = (imagePath) => {
  const [base64, setBase64] = useState(null);

  useEffect(() => {
    console.log('🖼️ Intentando cargar logo desde:', imagePath);
    
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      console.log('✅ Logo cargado exitosamente, dimensiones:', img.width, 'x', img.height);
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      const base64String = canvas.toDataURL('image/png');
      console.log('✅ Base64 generado (primeros 50 chars):', base64String.substring(0, 50) + '...');
      
      setBase64(base64String);
    };
    
    img.onerror = (error) => {
      console.error('❌ Error cargando logo:', error);
      console.log('📁 Ruta intentada:', imagePath);
      console.log('📍 URL actual:', window.location.href);
      console.log('🔍 Verifica que el archivo exista en:', window.location.origin + imagePath);
    };
    
    img.src = imagePath;
  }, [imagePath]);

  return base64;
};

const EmpleadosTable = () => {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [openAsistenciasDialog, setOpenAsistenciasDialog] = useState(false);
  const [asistencias, setAsistencias] = useState([]);
  const [loadingAsistencias, setLoadingAsistencias] = useState(false);
  
  // 🆕 Filtro de empleados
  const [filtroEstado, setFiltroEstado] = useState("activos");
  
  // 🆕 Paginación de EMPLEADOS
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // 🆕 Buscador
  const [searchTerm, setSearchTerm] = useState("");
  
  // Paginación de asistencias
  const [pageAsistencias, setPageAsistencias] = useState(0);
  const [rowsPerPageAsistencias, setRowsPerPageAsistencias] = useState(10);
  
  // 🆕 Filtro de descarga PDF
  const [filtroPDF, setFiltroPDF] = useState("completo");
  
  // 🆕 Selección manual de asistencias
  const [asistenciasSeleccionadas, setAsistenciasSeleccionadas] = useState([]);
  
  // 🆕 Logo en base64 con múltiples rutas de fallback
  const logoBase64 = useImageToBase64('/logo.png');
  
  // Formulario de empleado
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    password: "",
    rol_id: 3
  });

  // Mostrar snackbar
  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  // Cargar empleados
  const fetchEmpleados = async () => {
    try {
      setLoading(true);
      
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
        if (response.status === 403) {
          showSnackbar("No tienes permisos para ver empleados", "error");
          return;
        }
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      const empleadosFiltrados = data.filter(emp => 
        emp.rol_id === 3 || emp.rol_nombre?.toUpperCase() === 'EMPLEADO'
      );
      
      setEmpleados(empleadosFiltrados);
      
    } catch (error) {
      console.error("Error al cargar empleados:", error);
      showSnackbar("Error al cargar los empleados", "error");
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Filtrado combinado: estado + búsqueda
  const empleadosFiltrados = empleados.filter(emp => {
    // Filtro por estado
    let pasaFiltroEstado = true;
    if (filtroEstado === "activos") pasaFiltroEstado = emp.activo === true;
    if (filtroEstado === "inactivos") pasaFiltroEstado = emp.activo === false;
    
    // Filtro por búsqueda
    let pasaFiltroBusqueda = true;
    if (searchTerm.trim() !== "") {
      const termino = searchTerm.toLowerCase();
      pasaFiltroBusqueda = 
        emp.nombre.toLowerCase().includes(termino) ||
        emp.apellido.toLowerCase().includes(termino) ||
        emp.dni.includes(termino) ||
        emp.email.toLowerCase().includes(termino) ||
        `${emp.nombre} ${emp.apellido}`.toLowerCase().includes(termino);
    }
    
    return pasaFiltroEstado && pasaFiltroBusqueda;
  });

  // 🆕 Paginación de empleados filtrados
  const empleadosPaginados = empleadosFiltrados.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // 🆕 Handlers de paginación
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 🆕 Limpiar búsqueda
  const handleClearSearch = () => {
    setSearchTerm("");
    setPage(0);
  };

  // 🆕 Reset página al buscar
  useEffect(() => {
    setPage(0);
  }, [searchTerm, filtroEstado]);

  const fetchAsistenciasEmpleado = async (empleadoId) => {
    try {
      setLoadingAsistencias(true);
      
      const response = await fetch(`${API_URL}/empleados/${empleadoId}/asistencias`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          setAsistencias([]);
          return;
        }
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      setAsistencias(data);
      
    } catch (error) {
      console.error("Error al cargar asistencias:", error);
      showSnackbar("Error al cargar el historial de asistencias", "error");
      setAsistencias([]);
    } finally {
      setLoadingAsistencias(false);
    }
  };

  const handleVerAsistencias = async (empleado) => {
    setSelectedEmpleado(empleado);
    setPageAsistencias(0);
    setFiltroPDF("completo");
    setAsistenciasSeleccionadas([]);
    await fetchAsistenciasEmpleado(empleado.id);
    setOpenAsistenciasDialog(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validarFormulario = (esEdicion = false) => {
    if (!formData.nombre.trim()) {
      showSnackbar("El nombre es obligatorio", "error");
      return false;
    }
    
    if (!formData.apellido.trim()) {
      showSnackbar("El apellido es obligatorio", "error");
      return false;
    }
    
    if (!formData.dni.trim()) {
      showSnackbar("El DNI es obligatorio", "error");
      return false;
    }
    
    if (!/^\d{7,8}$/.test(formData.dni)) {
      showSnackbar("El DNI debe tener 7 u 8 dígitos", "error");
      return false;
    }
    
    if (!formData.email.trim()) {
      showSnackbar("El email es obligatorio", "error");
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showSnackbar("El email no es válido", "error");
      return false;
    }
    
    if (!esEdicion) {
      if (!formData.password.trim()) {
        showSnackbar("La contraseña es obligatoria", "error");
        return false;
      }
      
      if (formData.password.length < 6) {
        showSnackbar("La contraseña debe tener al menos 6 caracteres", "error");
        return false;
      }
    } else {
      if (formData.password.trim() !== '' && formData.password.length < 6) {
        showSnackbar("La contraseña debe tener al menos 6 caracteres", "error");
        return false;
      }
    }
    
    return true;
  };

  const handleCreateEmpleado = async () => {
    if (!validarFormulario(false)) return;

    try {
      const response = await fetch(`${API_URL}/empleados`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          dni: formData.dni.trim(),
          email: formData.email.trim(),
          password: formData.password,
          rol_id: 3
        })
      });

      if (!response.ok) {
        if (response.status === 409) {
          const error = await response.json();
          showSnackbar(error.message, "error");
          return;
        }
        if (response.status === 400) {
          showSnackbar("Error de validación. Verifica los datos", "error");
          return;
        }
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const nuevoEmpleado = await response.json();
      
      if (nuevoEmpleado.rol_id === 3 || nuevoEmpleado.rol_nombre?.toUpperCase() === 'EMPLEADO') {
        setEmpleados(prev => [nuevoEmpleado, ...prev]);
      }
      
      resetFormData();
      setOpenDialog(false);
      showSnackbar("Empleado creado exitosamente");
      
    } catch (error) {
      console.error("Error al crear empleado:", error);
      showSnackbar("Error al crear el empleado", "error");
    }
  };

  const handleOpenEditDialog = (empleado) => {
    setSelectedEmpleado(empleado);
    setFormData({
      nombre: empleado.nombre,
      apellido: empleado.apellido,
      dni: empleado.dni,
      email: empleado.email,
      password: "",
      rol_id: empleado.rol_id
    });
    setOpenEditDialog(true);
  };

  const handleUpdateEmpleado = async () => {
    if (!validarFormulario(true)) return;

    try {
      const body = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        dni: formData.dni.trim(),
        email: formData.email.trim(),
        rol_id: 3
      };

      if (formData.password.trim() !== '') {
        body.password = formData.password;
      }

      const response = await fetch(`${API_URL}/empleados/${selectedEmpleado.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        if (response.status === 409) {
          const error = await response.json();
          showSnackbar(error.message, "error");
          return;
        }
        if (response.status === 404) {
          showSnackbar("Empleado no encontrado", "error");
          return;
        }
        if (response.status === 400) {
          showSnackbar("Error de validación. Verifica los datos", "error");
          return;
        }
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const empleadoActualizado = await response.json();
      
      setEmpleados(prev => prev.map(emp => 
        emp.id === empleadoActualizado.id ? empleadoActualizado : emp
      ));
      
      resetFormData();
      setOpenEditDialog(false);
      setSelectedEmpleado(null);
      showSnackbar("Empleado actualizado exitosamente");
      
    } catch (error) {
      console.error("Error al actualizar empleado:", error);
      showSnackbar("Error al actualizar el empleado", "error");
    }
  };

  const handleDeleteEmpleado = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este empleado?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/empleados/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          showSnackbar("No autenticado", "error");
          return;
        }
        if (response.status === 403) {
          showSnackbar("No tienes permisos para eliminar empleados", "error");
          return;
        }
        if (response.status === 404) {
          showSnackbar("Empleado no encontrado", "error");
          return;
        }
        throw new Error(`Error HTTP: ${response.status}`);
      }

      setEmpleados(prev => prev.map(emp => 
        emp.id === id ? { ...emp, activo: false } : emp
      ));
      
      showSnackbar("Empleado eliminado exitosamente");
      
    } catch (error) {
      console.error("Error al eliminar empleado:", error);
      showSnackbar("Error al eliminar el empleado", "error");
    }
  };

  const resetFormData = () => {
    setFormData({
      nombre: "",
      apellido: "",
      dni: "",
      email: "",
      password: "",
      rol_id: 3
    });
  };

  const calcularDuracion = (horaIngreso, horaEgreso) => {
    if (!horaIngreso || !horaEgreso) return "En curso";
    
    const ingreso = new Date(horaIngreso);
    const egreso = new Date(horaEgreso);
    
    const diffMs = egreso - ingreso;
    const horas = Math.floor(diffMs / (1000 * 60 * 60));
    const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${horas}h ${minutos}m`;
  };

  const obtenerAsistenciasFiltradas = () => {
    const hoy = new Date();
    
    switch (filtroPDF) {
      case "mes": {
        const hace30Dias = new Date();
        hace30Dias.setDate(hoy.getDate() - 30);
        return asistencias.filter(a => new Date(a.fecha) >= hace30Dias);
      }
      case "quincena": {
        const hace15Dias = new Date();
        hace15Dias.setDate(hoy.getDate() - 15);
        return asistencias.filter(a => new Date(a.fecha) >= hace15Dias);
      }
      case "manual": {
        return asistencias.filter(a => asistenciasSeleccionadas.includes(a.id));
      }
      default:
        return asistencias;
    }
  };

  const handleToggleAsistencia = (asistenciaId) => {
    setAsistenciasSeleccionadas(prev => {
      if (prev.includes(asistenciaId)) {
        return prev.filter(id => id !== asistenciaId);
      } else {
        return [...prev, asistenciaId];
      }
    });
  };

  const handleSeleccionarTodas = () => {
    setAsistenciasSeleccionadas(asistencias.map(a => a.id));
  };

  const handleDeseleccionarTodas = () => {
    setAsistenciasSeleccionadas([]);
  };

  useEffect(() => {
    if (asistenciasSeleccionadas.length > 0 && filtroPDF !== "manual") {
      setFiltroPDF("manual");
    }
  }, [asistenciasSeleccionadas, filtroPDF]);

  // 📥 DESCARGAR PDF CON LOGO Y FALLBACK
const handleDescargarPDF = async () => {
  const asistenciasFiltradas = obtenerAsistenciasFiltradas();
  
  if (!selectedEmpleado || asistenciasFiltradas.length === 0) {
    showSnackbar("No hay datos para descargar en el período seleccionado", "warning");
    return;
  }

  try {
    const doc = new jsPDF();
    
    // Configuración de colores
    const primaryColor = [102, 126, 234];
    const textColor = [15, 23, 42];
    const grayColor = [100, 116, 139];

    // PRIMERO: Fondo morado
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 45, 'F');
    
    // SEGUNDO: Logo (encima del fondo)
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', 14, 8, 30, 30);
        console.log('✅ Logo agregado al PDF exitosamente');
      } catch (error) {
        console.error('❌ Error al agregar logo:', error);
        // Fallback si falla el logo
        doc.setFillColor(255, 255, 255);
        doc.rect(14, 8, 30, 30, 'F');
        doc.setTextColor(...primaryColor);
        doc.setFontSize(16);
        doc.text('ZOIMA', 29, 28, { align: 'center' });
      }
    }

    // TERCERO: Texto del título (también encima del fondo)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('Historial de Asistencias', 105, 18, { align: 'center' });
    
    // Información del empleado
    doc.setFontSize(13);
    doc.setFont(undefined, 'normal');
    doc.text(`${selectedEmpleado.nombre} ${selectedEmpleado.apellido}`, 105, 28, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`DNI: ${selectedEmpleado.dni} | Email: ${selectedEmpleado.email}`, 105, 35, { align: 'center' });

      let periodoTexto = "Período: Historial completo";
      if (filtroPDF === "mes") periodoTexto = "Período: Últimos 30 días";
      if (filtroPDF === "quincena") periodoTexto = "Período: Últimos 15 días";
      if (filtroPDF === "manual") periodoTexto = `Período: Selección manual (${asistenciasFiltradas.length} registros)`;
      
      doc.setFontSize(9);
      doc.setTextColor(...grayColor);
      doc.text(periodoTexto, 105, 42, { align: 'center' });

      const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Generado: ${fechaGeneracion}`, 105, 50, { align: 'center' });

      const totalJornadas = asistenciasFiltradas.length;
      const jornadasCompletas = asistenciasFiltradas.filter(a => a.hora_egreso !== null).length;
      const jornadasPendientes = totalJornadas - jornadasCompletas;
      
      let totalHoras = 0;
      asistenciasFiltradas.forEach(a => {
        if (a.hora_egreso) {
          const ingreso = new Date(a.hora_ingreso);
          const egreso = new Date(a.hora_egreso);
          totalHoras += (egreso - ingreso) / (1000 * 60 * 60);
        }
      });

      doc.setTextColor(...textColor);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Resumen Estadístico', 14, 60);
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Total de jornadas: ${totalJornadas}`, 14, 67);
      doc.text(`Jornadas completas: ${jornadasCompletas}`, 14, 73);
      doc.text(`Jornadas pendientes: ${jornadasPendientes}`, 14, 79);
      doc.text(`Total de horas trabajadas: ${totalHoras.toFixed(2)}h`, 14, 85);

      const tableData = asistenciasFiltradas.map(asistencia => {
        const fecha = new Date(asistencia.fecha).toLocaleDateString('es-ES', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        const horaIngreso = new Date(asistencia.hora_ingreso).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const horaEgreso = asistencia.hora_egreso 
          ? new Date(asistencia.hora_egreso).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'Pendiente';
        
        const duracion = calcularDuracion(asistencia.hora_ingreso, asistencia.hora_egreso);
        
        return [fecha, horaIngreso, horaEgreso, duracion];
      });

      autoTable(doc, {
        startY: 95,
        head: [['Fecha', 'Hora Ingreso', 'Hora Egreso', 'Duración']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          textColor: textColor,
          fontSize: 9,
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 40 },
          2: { cellWidth: 40 },
          3: { cellWidth: 40 }
        }
      });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...grayColor);
        doc.text(
          `Página ${i} de ${pageCount}`,
          105,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
        doc.text(
          'Sistema de Gestión ZOIMA',
          14,
          doc.internal.pageSize.height - 10
        );
      }

      let sufijoPeriodo = "Completo";
      if (filtroPDF === "mes") sufijoPeriodo = "Ultimo_Mes";
      if (filtroPDF === "quincena") sufijoPeriodo = "Ultima_Quincena";
      if (filtroPDF === "manual") sufijoPeriodo = "Seleccion_Manual";
      
      const nombreArchivo = `Asistencias_${selectedEmpleado.apellido}_${selectedEmpleado.nombre}_${sufijoPeriodo}_${new Date().getTime()}.pdf`;
      doc.save(nombreArchivo);
      
      showSnackbar("PDF descargado exitosamente", "success");
      
    } catch (error) {
      console.error("Error al generar PDF:", error);
      showSnackbar("Error al generar el PDF", "error");
    }
  };

  const handleChangePageAsistencias = (event, newPage) => {
    setPageAsistencias(newPage);
  };

  const handleChangeRowsPerPageAsistencias = (event) => {
    setRowsPerPageAsistencias(parseInt(event.target.value, 10));
    setPageAsistencias(0);
  };

  const asistenciasPaginadas = asistencias.slice(
    pageAsistencias * rowsPerPageAsistencias,
    pageAsistencias * rowsPerPageAsistencias + rowsPerPageAsistencias
  );

  useEffect(() => {
    fetchEmpleados();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          Cargando empleados...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "90%", ml: "80px" }}>
      <Box sx={{ 
        mb: 3, 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        flexWrap: "wrap",
        gap: 2
      }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: "white" }}>
          👥 Gestión de Empleados
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
          Agregar Empleado
        </Button>
      </Box>

      {/* 🔍 BUSCADOR */}
      <Box sx={{ mb: 2, maxWidth: "400px" }}>
        <TextField
          fullWidth
          placeholder="Buscar por nombre, apellido, DNI o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: 2,
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "rgba(102, 126, 234, 0.3)",
              },
              "&:hover fieldset": {
                borderColor: "var(--primary)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "var(--primary)",
              }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "var(--primary)" }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleClearSearch}
                  sx={{
                    color: "#64748b",
                    "&:hover": {
                      color: "#ef4444"
                    }
                  }}
                >
                  <Clear fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        {searchTerm && (
          <Typography variant="caption" sx={{ color: "white", mt: 1, display: "block" }}>
            {empleadosFiltrados.length} resultado{empleadosFiltrados.length !== 1 ? 's' : ''} encontrado{empleadosFiltrados.length !== 1 ? 's' : ''}
          </Typography>
        )}
      </Box>

      {/* Filtros de estado */}
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <FilterList sx={{ color: "white" }} />
        <ToggleButtonGroup
          value={filtroEstado}
          exclusive
          onChange={(e, newValue) => {
            if (newValue !== null) {
              setFiltroEstado(newValue);
            }
          }}
          size="small"
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            "& .MuiToggleButton-root": {
              color: "white",
              borderColor: "rgba(255, 255, 255, 0.2)",
              "&.Mui-selected": {
                backgroundColor: "var(--primary)",
                color: "white",
                "&:hover": {
                  backgroundColor: "var(--primary-dark)"
                }
              }
            }
          }}
        >
          <ToggleButton value="activos">
            <CheckCircle sx={{ mr: 1, fontSize: 18 }} />
            Activos ({empleados.filter(e => e.activo).length})
          </ToggleButton>
          <ToggleButton value="inactivos">
            <Cancel sx={{ mr: 1, fontSize: 18 }} />
            Inactivos ({empleados.filter(e => !e.activo).length})
          </ToggleButton>
          <ToggleButton value="todos">
            Todos ({empleados.length})
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Tabla de empleados */}
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
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", width: "25%" }}>Nombre Completo</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", width: "12%" }}>DNI</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", width: "25%" }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", width: "auto" }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", width: "auto" }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {empleadosPaginados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="textSecondary">
                    {searchTerm 
                      ? `No se encontraron empleados que coincidan con "${searchTerm}"`
                      : filtroEstado === "activos" && "No hay empleados activos"
                    }
                    {!searchTerm && filtroEstado === "inactivos" && "No hay empleados inactivos"}
                    {!searchTerm && filtroEstado === "todos" && "No hay empleados registrados"}
                  </Typography>
                  {!searchTerm && filtroEstado === "todos" && (
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Haz clic en "Agregar Empleado" para crear el primero
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              empleadosPaginados.map((empleado) => (
                <TableRow 
                  key={empleado.id} 
                  hover
                  sx={{
                    opacity: empleado.activo ? 1 : 0.6,
                    backgroundColor: empleado.activo ? "inherit" : "rgba(239, 68, 68, 0.05)"
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      #{empleado.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box sx={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: "50%", 
                        backgroundColor: empleado.activo ? "var(--primary)15" : "#ef444415",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <Person sx={{ color: empleado.activo ? "var(--primary)" : "#ef4444", fontSize: 18 }} />
                      </Box>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {empleado.nombre} {empleado.apellido}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          ID: {empleado.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={empleado.dni}
                      size="small"
                      sx={{ 
                        backgroundColor: "#f1f5f9",
                        fontWeight: 500,
                        fontFamily: "monospace"
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Email sx={{ color: "#64748b", fontSize: 16 }} />
                      <Typography variant="body2" sx={{ color: "var(--text-primary)" }}>
                        {empleado.email}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {empleado.activo ? (
                      <Chip 
                        icon={<CheckCircle />}
                        label="Activo"
                        size="small"
                        sx={{ 
                          backgroundColor: "var(--success-light)",
                          color: "#065f46",
                          fontWeight: 600
                        }}
                      />
                    ) : (
                      <Chip 
                        icon={<Cancel />}
                        label="Inactivo"
                        size="small"
                        sx={{ 
                          backgroundColor: "var(--error-light)",
                          color: "#991b1b",
                          fontWeight: 600
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Tooltip title="Ver asistencias" arrow>
                        <IconButton
                          size="small"
                          disabled={!empleado.activo}
                          sx={{
                            backgroundColor: "#f3f4f6",
                            "&:hover": { 
                              backgroundColor: "#e5e7eb",
                              transform: "scale(1.1)"
                            },
                            transition: "all 0.2s",
                            "&.Mui-disabled": {
                              backgroundColor: "#f9fafb",
                              opacity: 0.4
                            }
                          }}
                          onClick={() => handleVerAsistencias(empleado)}
                        >
                          <Visibility fontSize="small" sx={{ color: "var(--primary)" }} />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Editar" arrow>
                        <IconButton
                          size="small"
                          disabled={!empleado.activo}
                          sx={{
                            backgroundColor: "var(--warning-light)",
                            "&:hover": { 
                              backgroundColor: "#fde68a",
                              transform: "scale(1.1)"
                            },
                            transition: "all 0.2s",
                            "&.Mui-disabled": {
                              backgroundColor: "#fefce8",
                              opacity: 0.4
                            }
                          }}
                          onClick={() => handleOpenEditDialog(empleado)}
                        >
                          <Edit fontSize="small" sx={{ color: "#f59e0b" }} />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title={empleado.activo ? "Eliminar" : "Ya eliminado"} arrow>
                        <span>
                          <IconButton
                            size="small"
                            disabled={!empleado.activo}
                            sx={{
                              backgroundColor: "var(--error-light)",
                              "&:hover": { 
                                backgroundColor: "#fecaca",
                                transform: "scale(1.1)"
                              },
                              transition: "all 0.2s",
                              "&.Mui-disabled": {
                                backgroundColor: "#fef2f2",
                                opacity: 0.4
                              }
                            }}
                            onClick={() => handleDeleteEmpleado(empleado.id)}
                          >
                            <Delete fontSize="small" sx={{ color: "#ef4444" }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 📄 PAGINACIÓN DE EMPLEADOS */}
      {empleadosFiltrados.length > 0 && (
        <TablePagination
          component="div"
          count={empleadosFiltrados.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: "0 0 12px 12px",
            color: "var(--text-primary)",
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
              margin: 0,
              color: "var(--text-primary)"
            },
            "& .MuiTablePagination-select": {
              color: "var(--text-primary)"
            },
            "& .MuiTablePagination-actions": {
              color: "var(--primary)"
            }
          }}
        />
      )}

      {/* Diálogos (sin cambios) */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); resetFormData(); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", borderBottom: "1px solid #e2e8f0", marginBottom: "30px" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Person sx={{ color: "var(--primary)" }} />
            Agregar Nuevo Empleado
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 4 }}>
          <Grid container spacing={2.5} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} required size="small" InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Apellido" name="apellido" value={formData.apellido} onChange={handleInputChange} required size="small" InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="DNI" name="dni" value={formData.dni} onChange={handleInputChange} required size="small" InputProps={{ startAdornment: <InputAdornment position="start"><Badge sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment> }} helperText="7 u 8 dígitos" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} required size="small" InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Contraseña" name="password" type="password" value={formData.password} onChange={handleInputChange} required size="small" InputProps={{ startAdornment: <InputAdornment position="start"><Lock sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment> }} helperText="Mínimo 6 caracteres" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Rol" value="Empleado" size="small" disabled InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment> }} />
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
                Los empleados siempre se crean con rol EMPLEADO
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: "var(--bg-soft)", borderTop: "1px solid #e2e8f0" }}>
          <Button onClick={() => { setOpenDialog(false); resetFormData(); }}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateEmpleado} sx={{ background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)", "&:hover": { background: "linear-gradient(135deg, var(--primary-dark) 0%, #6b46c1 100%)" } }}>Crear Empleado</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openEditDialog} onClose={() => { setOpenEditDialog(false); setSelectedEmpleado(null); resetFormData(); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", borderBottom: "1px solid #e2e8f0", marginBottom: "30px" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Edit sx={{ color: "#f59e0b" }} />
            Editar Empleado
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 4 }}>
          <Grid container spacing={2.5} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} required size="small" InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Apellido" name="apellido" value={formData.apellido} onChange={handleInputChange} required size="small" InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="DNI" name="dni" value={formData.dni} onChange={handleInputChange} required size="small" InputProps={{ startAdornment: <InputAdornment position="start"><Badge sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment> }} helperText="7 u 8 dígitos" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} required size="small" InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Nueva Contraseña" name="password" type="password" value={formData.password} onChange={handleInputChange} size="small" InputProps={{ startAdornment: <InputAdornment position="start"><Lock sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment> }} helperText="Dejar vacío para no cambiar la contraseña" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Rol" value="Empleado" size="small" disabled InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment> }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: "var(--bg-soft)", borderTop: "1px solid #e2e8f0" }}>
          <Button onClick={() => { setOpenEditDialog(false); setSelectedEmpleado(null); resetFormData(); }}>Cancelar</Button>
          <Button variant="contained" onClick={handleUpdateEmpleado} sx={{ background: "linear-gradient(135deg, #f59e0b 0%, var(--warning) 100%)", "&:hover": { background: "linear-gradient(135deg, var(--warning) 0%, #b45309 100%)" } }}>Actualizar Empleado</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de asistencias */}
      <Dialog open={openAsistenciasDialog} onClose={() => { setOpenAsistenciasDialog(false); setSelectedEmpleado(null); setAsistencias([]); setPageAsistencias(0); setFiltroPDF("completo"); setAsistenciasSeleccionadas([]); }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", borderBottom: "1px solid #e2e8f0", pb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarToday sx={{ color: "var(--primary)" }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Historial de Asistencias</Typography>
                <Typography variant="body2" color="textSecondary">{selectedEmpleado?.nombre} {selectedEmpleado?.apellido}</Typography>
              </Box>
            </Box>
          </Box>

          {asistencias.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ fontWeight: 600, color: "var(--text-primary)", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                    <PictureAsPdf sx={{ fontSize: 18, color: "var(--primary)" }} />
                    Seleccionar período para descargar:
                  </FormLabel>
                  <RadioGroup row value={filtroPDF} onChange={(e) => { setFiltroPDF(e.target.value); if (e.target.value !== "manual") { setAsistenciasSeleccionadas([]); } }}>
                    <FormControlLabel value="completo" control={<Radio />} label={`Historial completo (${asistencias.length})`} />
                    <FormControlLabel value="mes" control={<Radio />} label={`Último mes (${(() => { const hace30Dias = new Date(); hace30Dias.setDate(hace30Dias.getDate() - 30); return asistencias.filter(a => new Date(a.fecha) >= hace30Dias).length; })()})`} />
                    <FormControlLabel value="quincena" control={<Radio />} label={`Última quincena (${(() => { const hace15Dias = new Date(); hace15Dias.setDate(hace15Dias.getDate() - 15); return asistencias.filter(a => new Date(a.fecha) >= hace15Dias).length; })()})`} />
                    <FormControlLabel value="manual" control={<Radio />} label={`Selección manual (${asistenciasSeleccionadas.length})`} />
                  </RadioGroup>
                </FormControl>

                {filtroPDF === "manual" && (
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button size="small" startIcon={<SelectAll />} onClick={handleSeleccionarTodas} variant="outlined" sx={{ textTransform: "none" }}>Seleccionar todas</Button>
                    <Button size="small" startIcon={<Deselect />} onClick={handleDeseleccionarTodas} variant="outlined" sx={{ textTransform: "none" }}>Deseleccionar todas</Button>
                  </Box>
                )}
                
                <Button variant="contained" startIcon={<Download />} onClick={handleDescargarPDF} disabled={obtenerAsistenciasFiltradas().length === 0} sx={{ background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)", "&:hover": { background: "linear-gradient(135deg, var(--primary-dark) 0%, #6b46c1 100%)" }, alignSelf: "flex-start" }}>
                  Descargar PDF ({obtenerAsistenciasFiltradas().length} registros)
                </Button>
              </Box>
            </>
          )}
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          {loadingAsistencias ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
          ) : asistencias.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}><Typography variant="body1" color="textSecondary">No hay asistencias registradas para este empleado</Typography></Box>
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 400, overflowX: "auto" }}>
                <Table stickyHeader size="small" sx={{ minWidth: 600 }}>
                  <TableHead>
                    <TableRow>
                      {filtroPDF === "manual" && (<TableCell padding="checkbox" sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}><Checkbox indeterminate={asistenciasSeleccionadas.length > 0 && asistenciasSeleccionadas.length < asistencias.length} checked={asistenciasSeleccionadas.length === asistencias.length} onChange={(e) => { if (e.target.checked) { handleSeleccionarTodas(); } else { handleDeseleccionarTodas(); } }} /></TableCell>)}
                      <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>Hora Ingreso</TableCell>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>Hora Egreso</TableCell>
                      <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>Duración</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {asistenciasPaginadas.map((asistencia) => {
                      const duracion = calcularDuracion(asistencia.hora_ingreso, asistencia.hora_egreso);
                      const jornadaCompleta = asistencia.hora_egreso !== null;
                      const isSelected = asistenciasSeleccionadas.includes(asistencia.id);
                      
                      return (
                        <TableRow key={asistencia.id} hover selected={filtroPDF === "manual" && isSelected} sx={{ cursor: filtroPDF === "manual" ? "pointer" : "default" }} onClick={() => { if (filtroPDF === "manual") { handleToggleAsistencia(asistencia.id); } }}>
                          {filtroPDF === "manual" && (<TableCell padding="checkbox"><Checkbox checked={isSelected} onChange={() => handleToggleAsistencia(asistencia.id)} onClick={(e) => e.stopPropagation()} /></TableCell>)}
                          <TableCell>{new Date(asistencia.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}</TableCell>
                          <TableCell>{new Date(asistencia.hora_ingreso).toLocaleTimeString('es-ES')}</TableCell>
                          <TableCell>{asistencia.hora_egreso ? new Date(asistencia.hora_egreso).toLocaleTimeString('es-ES') : <Chip label="Pendiente" size="small" sx={{ backgroundColor: "var(--warning-light)", color: "#92400e" }} />}</TableCell>
                          <TableCell><Chip label={duracion} size="small" sx={{ backgroundColor: jornadaCompleta ? "var(--success-light)" : "var(--warning-light)", color: jornadaCompleta ? "#065f46" : "#92400e", fontWeight: 500 }} /></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination component="div" count={asistencias.length} page={pageAsistencias} onPageChange={handleChangePageAsistencias} rowsPerPage={rowsPerPageAsistencias} onRowsPerPageChange={handleChangeRowsPerPageAsistencias} rowsPerPageOptions={[5, 10, 25, 50]} labelRowsPerPage="Filas por página:" labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`} sx={{ borderTop: "1px solid #e2e8f0", "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { margin: 0 } }} />
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2, backgroundColor: "var(--bg-soft)", borderTop: "1px solid #e2e8f0" }}>
          <Button onClick={() => { setOpenAsistenciasDialog(false); setSelectedEmpleado(null); setAsistencias([]); setPageAsistencias(0); setFiltroPDF("completo"); setAsistenciasSeleccionadas([]); }}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={openSnackbar} autoHideDuration={4000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} sx={{ width: "100%" }}>{snackbarMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default EmpleadosTable;