// components/tables/ProductosTable.jsx
import { useState, useEffect, useMemo, useRef } from "react";
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
  Tooltip,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  TablePagination,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  ClickAwayListener
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
  Clear,
  CloudUpload,
  CheckCircle,
  ErrorOutline,
  InsertDriveFile,
  Category,
  KeyboardArrowDown,
  Check
} from "@mui/icons-material";

const API_URL = "http://localhost:3000/api";

const CATEGORIAS = [
  { value: "", label: "Sin categoría" },

  // Bebidas
  { value: "bebidas", label: "🥤 Bebidas" },
  { value: "gaseosas", label: "   • Gaseosas" },
  { value: "aguas", label: "   • Aguas" },
  { value: "jugos", label: "   • Jugos" },
  { value: "energeticas", label: "   • Energéticas" },

  // Alcohol
  { value: "alcohol", label: "🍺 Alcohol" },
  { value: "cervezas", label: "   • Cervezas" },
  { value: "vinos", label: "   • Vinos" },
  { value: "destilados", label: "   • Destilados" },

  // Tabaco
  { value: "tabaco", label: "🚬 Tabaco" },
  { value: "cigarrillos", label: "   • Cigarrillos" },
  { value: "vapeadores", label: "   • Vapeadores" },
  { value: "accesorios_tabaco", label: "   • Accesorios" },

  // Snacks y golosinas
  { value: "snacks", label: "🍟 Snacks" },
  { value: "papas", label: "   • Papas fritas" },
  { value: "mani", label: "   • Maní" },
  { value: "golosinas", label: "🍬 Golosinas" },
  { value: "chicles", label: "   • Chicles" },
  { value: "caramelos", label: "   • Caramelos" },
  { value: "chocolates", label: "🍫 Chocolates" },
  { value: "alfajores", label: "🧉 Alfajores" },

  // Galletitas
  { value: "galletitas", label: "🍪 Galletitas" },
  { value: "galletitas_dulces", label: "   • Dulces" },
  { value: "galletitas_saladas", label: "   • Saladas" },

  // Alimentos
  { value: "lacteos", label: "🥛 Lácteos" },
  { value: "fiambres", label: "🥩 Fiambres" },
  { value: "helados", label: "🍦 Helados" },
  { value: "panificados", label: "🍞 Panificados" },

  // Hogar
  { value: "limpieza", label: "🧹 Limpieza" },
  { value: "perfumeria", label: "🧴 Perfumería" },
  { value: "bazar", label: "🏠 Bazar" },

  // Varios
  { value: "revistas", label: "📰 Revistas" },
  { value: "pilas", label: "🔋 Pilas" },
  { value: "encendedores", label: "🔥 Encendedores" },

  { value: "otros", label: "📦 Otros" },
];

const CATEGORIA_COLORS = {
  bebidas:           { bg: "#dbeafe", color: "#1e40af" },
  gaseosas:          { bg: "#bfdbfe", color: "#1e3a8a" },
  aguas:             { bg: "#e0f2fe", color: "#0369a1" },
  jugos:             { bg: "#fef3c7", color: "#b45309" },
  energeticas:       { bg: "#fae8ff", color: "#a21caf" },
  alcohol:           { bg: "#ede9fe", color: "#5b21b6" },
  cervezas:          { bg: "#fed7aa", color: "#9a3412" },
  vinos:             { bg: "#fecaca", color: "#991b1b" },
  destilados:        { bg: "#e0e7ff", color: "#3730a3" },
  tabaco:            { bg: "#fed7aa", color: "#92400e" },
  cigarrillos:       { bg: "#fde68a", color: "#92400e" },
  vapeadores:        { bg: "#cffafe", color: "#0891b2" },
  accesorios_tabaco: { bg: "#e2e8f0", color: "#334155" },
  snacks:            { bg: "#fef9c3", color: "#854d0e" },
  papas:             { bg: "#fde68a", color: "#b45309" },
  mani:              { bg: "#d9f99d", color: "#3f6212" },
  golosinas:         { bg: "#fce7f3", color: "#9d174d" },
  chicles:           { bg: "#fbcfe8", color: "#831843" },
  caramelos:         { bg: "#fee2e2", color: "#991b1b" },
  chocolates:        { bg: "#fef08a", color: "#854d0e" },
  alfajores:         { bg: "#f5d0fe", color: "#86198f" },
  galletitas:        { bg: "#fef3c7", color: "#92400e" },
  galletitas_dulces: { bg: "#fde68a", color: "#92400e" },
  galletitas_saladas:{ bg: "#fef9c3", color: "#854d0e" },
  lacteos:           { bg: "#f0fdf4", color: "#166534" },
  fiambres:          { bg: "#fee2e2", color: "#991b1b" },
  helados:           { bg: "#cffafe", color: "#0891b2" },
  panificados:       { bg: "#fef3c7", color: "#92400e" },
  limpieza:          { bg: "#fce7f3", color: "#9d174d" },
  perfumeria:        { bg: "#e9d5ff", color: "#6b21a8" },
  bazar:             { bg: "#f1f5f9", color: "#334155" },
  revistas:          { bg: "#e2e8f0", color: "#1e293b" },
  pilas:             { bg: "#d9f99d", color: "#3f6212" },
  encendedores:      { bg: "#fecaca", color: "#b91c1c" },
  otros:             { bg: "#f1f5f9", color: "#334155" },
};

// Devuelve { label, bgColor, textColor } para una categoría por su value
const getCategoriaInfo = (categoriaValue) => {
  if (!categoriaValue) return null;
  const cat = CATEGORIAS.find(c => c.value === categoriaValue);
  const color = CATEGORIA_COLORS[categoriaValue] || { bg: "#f1f5f9", color: "#334155" };
  return {
    label: cat ? cat.label.trim() : categoriaValue,
    bgColor: color.bg,
    textColor: color.color,
  };
};

const EMPTY_FORM = { nombre: "", precio: "", precio_costo: "", codigo_barra: "", categoria: "" };

// ── Selector de categoría con buscador interno ────────────────────────────────
const CategoriaSelect = ({ value, onChange, label = "Seleccioná una categoría..." }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef(null);

  // Busca la opción seleccionada solo por value
  const selected = CATEGORIAS.find(c => c.value === value);

  const filtered = useMemo(() => {
    if (!search.trim()) return CATEGORIAS;
    return CATEGORIAS.filter(c =>
      c.label.toLowerCase().includes(search.toLowerCase()) ||
      c.value.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const handleOpen = () => {
    setOpen(true);
    setSearch("");
    setTimeout(() => searchRef.current?.focus(), 60);
  };

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
    setSearch("");
  };

  // Texto que se muestra en el trigger
  const triggerText = selected?.value
    ? selected.label.trim()   // "🥤 Bebidas" o "   • Gaseosas" → trim()
    : label;

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      {/* Trigger */}
      <Box
        onClick={handleOpen}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          border: "1px solid",
          borderColor: open ? "var(--primary, #667eea)" : "#c4c4c4",
          borderRadius: "8px",
          px: 1.5,
          py: "9px",
          cursor: "pointer",
          backgroundColor: "#fff",
          transition: "border-color 0.15s, box-shadow 0.15s",
          "&:hover": { borderColor: "#1e293b" },
          boxShadow: open ? "0 0 0 2px rgba(102,126,234,0.18)" : "none"
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Category sx={{ color: "#64748b", fontSize: 18 }} />
          <Typography
            variant="body2"
            sx={{
              color: value ? "#1e293b" : "#94a3b8",
              fontWeight: value ? 500 : 400,
              fontSize: "0.875rem"
            }}
          >
            {triggerText}
          </Typography>
        </Box>
        <KeyboardArrowDown
          sx={{
            color: "#94a3b8",
            fontSize: 20,
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)"
          }}
        />
      </Box>

      {/* Dropdown */}
      {open && (
        <ClickAwayListener onClickAway={() => { setOpen(false); setSearch(""); }}>
          <Box
            sx={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              zIndex: 1500,
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.13)",
              overflow: "hidden"
            }}
          >
            {/* Buscador */}
            <Box sx={{ p: 1, borderBottom: "1px solid #f1f5f9" }}>
              <TextField
                inputRef={searchRef}
                fullWidth
                placeholder="Buscar categoría..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                onKeyDown={(e) => e.stopPropagation()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "#94a3b8", fontSize: 16 }} />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearch("")}>
                        <Clear sx={{ fontSize: 14 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontSize: "0.82rem",
                    borderRadius: "6px",
                    "& fieldset": { borderColor: "#e2e8f0" },
                    "&:hover fieldset": { borderColor: "#94a3b8" }
                  }
                }}
              />
            </Box>

            {/* Opciones */}
            <Box sx={{ maxHeight: 240, overflowY: "auto" }}>
              {filtered.length === 0 ? (
                <Box sx={{ py: 3, textAlign: "center" }}>
                  <Typography variant="body2" color="textSecondary">Sin resultados</Typography>
                </Box>
              ) : (
                filtered.map((cat) => {
                  // Detectar si es subcategoría (empieza con espacios o •)
                  const isSubcat = cat.label.startsWith(" ");
                  return (
                    <Box
                      key={cat.value}
                      onClick={() => handleSelect(cat.value)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        pl: isSubcat ? 3.5 : 2,
                        pr: 2,
                        py: isSubcat ? 0.8 : 1,
                        cursor: "pointer",
                        backgroundColor: value === cat.value
                          ? "rgba(102,126,234,0.08)"
                          : "transparent",
                        "&:hover": { backgroundColor: "rgba(102,126,234,0.05)" },
                        transition: "background-color 0.12s",
                        // Separador visual antes de categorías principales (no subcat, no primera)
                        borderTop: !isSubcat && cat.value !== "" && cat.value !== "bebidas"
                          ? "1px solid #f1f5f9"
                          : "none"
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: value === cat.value ? 600 : (isSubcat ? 400 : 500),
                          color: cat.value
                            ? (isSubcat ? "#475569" : "#1e293b")
                            : "#94a3b8",
                          fontSize: isSubcat ? "0.82rem" : "0.875rem",
                        }}
                      >
                        {cat.label.trim()}
                      </Typography>
                      {value === cat.value && (
                        <Check sx={{ fontSize: 15, color: "var(--primary, #667eea)", flexShrink: 0 }} />
                      )}
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>
        </ClickAwayListener>
      )}
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const ProductosTable = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("activos");
  const [categoriaFilter, setCategoriaFilter] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);

  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [selectedProducto, setSelectedProducto] = useState(null);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editFormData, setEditFormData] = useState(EMPTY_FORM);

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/productos?todos=true`, {
        method: "GET", credentials: "include", headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const data = await response.json();
      setProductos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      showSnackbar("Error al cargar los productos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProductos(); }, []); // eslint-disable-line

  const isActivo = (p) => p.activo === true || p.activo === "t";

  const productosFiltrados = useMemo(() => {
    let r = [...productos];
    if (statusFilter === "activos") r = r.filter(p => isActivo(p));
    else if (statusFilter === "inactivos") r = r.filter(p => !isActivo(p));
    if (categoriaFilter) r = r.filter(p => p.categoria === categoriaFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      r = r.filter(p =>
        p.nombre?.toLowerCase().includes(q) ||
        p.codigo_barra?.toLowerCase().includes(q) ||
        p.categoria?.toLowerCase().includes(q) ||
        String(p.id).includes(q)
      );
    }
    return r;
  }, [productos, statusFilter, categoriaFilter, searchQuery]);

  const productosPaginados = useMemo(() => {
    const start = page * rowsPerPage;
    return productosFiltrados.slice(start, start + rowsPerPage);
  }, [productosFiltrados, page, rowsPerPage]);

  const handleStatusFilter = (_, v) => { if (v !== null) { setStatusFilter(v); setPage(0); } };
  const handleSearch = (e) => { setSearchQuery(e.target.value); setPage(0); };
  const handleClearSearch = () => { setSearchQuery(""); setPage(0); };

  const validarForm = (data) => {
    if (!data.nombre.trim()) { showSnackbar("El nombre del producto es obligatorio", "error"); return false; }
    if (!data.precio) { showSnackbar("El precio de venta es obligatorio", "error"); return false; }
    const precio = Number(data.precio);
    if (isNaN(precio) || precio <= 0) { showSnackbar("El precio de venta debe ser mayor a 0", "error"); return false; }
    if (!data.precio_costo) { showSnackbar("El precio de costo es obligatorio", "error"); return false; }
    const costo = Number(data.precio_costo);
    if (isNaN(costo) || costo <= 0) { showSnackbar("El precio de costo debe ser mayor a 0", "error"); return false; }
    if (costo >= precio) { showSnackbar("El costo no puede ser mayor o igual al precio de venta", "error"); return false; }
    return true;
  };

  const handleCreateProducto = async () => {
    if (!validarForm(formData)) return;
    try {
      const res = await fetch(`${API_URL}/productos`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre.trim(), precio: Number(formData.precio),
          precio_costo: Number(formData.precio_costo), codigo_barra: formData.codigo_barra || null,
          categoria: formData.categoria || null
        })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Error al crear producto");
      await fetchProductos();
      setFormData(EMPTY_FORM);
      setOpenCreateDialog(false);
      showSnackbar("Producto creado exitosamente");
    } catch (error) { showSnackbar(error.message || "Error al crear el producto", "error"); }
  };

  const handleEditClick = (producto) => {
    setSelectedProducto(producto);
    setEditFormData({
      nombre: producto.nombre, precio: producto.precio,
      precio_costo: producto.precio_costo || "", codigo_barra: producto.codigo_barra || "",
      categoria: producto.categoria || ""
    });
    setOpenEditDialog(true);
  };

  const handleUpdateProducto = async () => {
    if (!validarForm(editFormData)) return;
    try {
      const res = await fetch(`${API_URL}/productos/${selectedProducto.id}`, {
        method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: editFormData.nombre.trim(), precio: Number(editFormData.precio),
          precio_costo: Number(editFormData.precio_costo), categoria: editFormData.categoria || null
        })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Error al actualizar producto");
      await fetchProductos();
      setOpenEditDialog(false);
      setSelectedProducto(null);
      showSnackbar("Producto actualizado exitosamente");
    } catch (error) { showSnackbar(error.message || "Error al actualizar el producto", "error"); }
  };

  const handleDeleteProducto = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este producto?")) return;
    try {
      const res = await fetch(`${API_URL}/productos/${id}`, {
        method: "DELETE", credentials: "include", headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error(res.status === 404 ? "Producto no encontrado" : "Error al eliminar producto");
      await fetchProductos();
      showSnackbar("Producto eliminado exitosamente");
    } catch (error) { showSnackbar(error.message || "Error al eliminar el producto", "error"); }
  };

  const handleImportClose = () => { setOpenImportDialog(false); setImportFile(null); setImportResult(null); };

  const handleImport = async () => {
    if (!importFile) { showSnackbar("Seleccioná un archivo primero", "error"); return; }
    setImportLoading(true); setImportResult(null);
    try {
      const fd = new FormData(); fd.append("archivo", importFile);
      const res = await fetch(`${API_URL}/productos/import`, { method: "POST", credentials: "include", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al importar");
      setImportResult(data); await fetchProductos();
    } catch (error) { showSnackbar(error.message || "Error al importar el archivo", "error"); }
    finally { setImportLoading(false); }
  };

  const calcularMargen = (precio, costo) => {
    if (!costo || costo === 0) return 0;
    return ((precio - costo) / costo * 100).toFixed(1);
  };

  const formatPrecio = (precio) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(precio);

  const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: "8px" } };

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

      {/* ── Header ── */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: "white" }}>📦 Gestión de Productos</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Actualizar">
            <IconButton onClick={fetchProductos} sx={{ backgroundColor: "white", "&:hover": { backgroundColor: "var(--bg-soft)" } }}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button variant="outlined" startIcon={<CloudUpload />} onClick={() => setOpenImportDialog(true)}
            sx={{ borderColor: "#4ade80", color: "#4ade80", "&:hover": { borderColor: "#22c55e", backgroundColor: "rgba(74,222,128,0.08)" } }}>
            Importar Excel
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenCreateDialog(true)}
            sx={{ background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)", "&:hover": { background: "linear-gradient(135deg, var(--primary-dark) 0%, #6b46c1 100%)" } }}>
            Agregar Producto
          </Button>
        </Box>
      </Box>

      {/* ── Filtros ── */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, boxShadow: "0 4px 16px rgba(102,126,234,0.1)", backgroundColor: "rgba(255,255,255,0.97)" }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            placeholder="Buscar por nombre, código, categoría o ID..."
            value={searchQuery} onChange={handleSearch} size="small" sx={{ flexGrow: 1, minWidth: 220 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ color: "#94a3b8", fontSize: 20 }} /></InputAdornment>,
              endAdornment: searchQuery ? (
                <InputAdornment position="end"><IconButton size="small" onClick={handleClearSearch}><Clear sx={{ fontSize: 18 }} /></IconButton></InputAdornment>
              ) : null
            }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Categoría</InputLabel>
            <Select value={categoriaFilter} label="Categoría" onChange={(e) => { setCategoriaFilter(e.target.value); setPage(0); }}>
              <MenuItem value="">Todas</MenuItem>
              {CATEGORIAS.filter(c => c.value).map(cat => (
                <MenuItem key={cat.value} value={cat.value}>{cat.label.trim()}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FilterList sx={{ color: "#94a3b8", fontSize: 20 }} />
            <ToggleButtonGroup value={statusFilter} exclusive onChange={handleStatusFilter} size="small"
              sx={{ "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 500, fontSize: "0.8rem", px: 1.5, py: 0.5, borderColor: "#e2e8f0", color: "#64748b", "&.Mui-selected": { backgroundColor: "var(--primary)", color: "white", "&:hover": { backgroundColor: "var(--primary-dark)" } } } }}>
              <ToggleButton value="activos">Activos <Chip label={productos.filter(p => isActivo(p)).length} size="small" sx={{ ml: 0.5, height: 18, fontSize: "0.7rem", backgroundColor: "rgba(0,0,0,0.08)" }} /></ToggleButton>
              <ToggleButton value="todos">Todos <Chip label={productos.length} size="small" sx={{ ml: 0.5, height: 18, fontSize: "0.7rem", backgroundColor: "rgba(0,0,0,0.08)" }} /></ToggleButton>
              <ToggleButton value="inactivos">Inactivos <Chip label={productos.filter(p => !isActivo(p)).length} size="small" sx={{ ml: 0.5, height: 18, fontSize: "0.7rem", backgroundColor: "rgba(0,0,0,0.08)" }} /></ToggleButton>
            </ToggleButtonGroup>
          </Box>
          {(searchQuery || statusFilter !== "activos" || categoriaFilter) && (
            <Typography variant="body2" color="textSecondary" sx={{ ml: "auto", whiteSpace: "nowrap" }}>
              {productosFiltrados.length} resultado{productosFiltrados.length !== 1 ? "s" : ""}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* ── Tabla ── */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: "0 8px 32px rgba(102,126,234,0.15)", backgroundColor: "rgba(255,255,255,0.95)", maxHeight: 520, overflowX: "auto", "& .MuiTableCell-root": { whiteSpace: "nowrap", padding: "12px 16px" } }}>
        <Table stickyHeader sx={{ minWidth: 1200 }}>
          <TableHead>
            <TableRow>
              {["ID", "Producto", "Categoría", "Código de Barras", "Precio Costo", "Precio Venta", "Margen", "Stock Mínimo", "Estado", "Acciones"].map(col => (
                <TableCell key={col} sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>{col}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {productosPaginados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="textSecondary">
                    {searchQuery ? "No se encontraron productos con esa búsqueda" : "No hay productos en esta categoría"}
                  </Typography>
                  {searchQuery && <Button size="small" onClick={handleClearSearch} sx={{ mt: 1 }}>Limpiar búsqueda</Button>}
                </TableCell>
              </TableRow>
            ) : (
              productosPaginados.map((producto) => {
                const margen = calcularMargen(producto.precio, producto.precio_costo);
                const margenColor = margen >= 30 ? "var(--success-light)" : margen >= 20 ? "#fef9c3" : "var(--error-light)";
                const margenTextColor = margen >= 30 ? "#065f46" : margen >= 20 ? "#854d0e" : "#991b1b";
                const catInfo = getCategoriaInfo(producto.categoria);
                return (
                  <TableRow key={producto.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>#{producto.id}</Typography></TableCell>
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
                      {catInfo ? (
                        <Chip
                          label={catInfo.label}
                          size="small"
                          sx={{ backgroundColor: catInfo.bgColor, color: catInfo.textColor, fontWeight: 600, maxWidth: 140 }}
                        />
                      ) : (
                        <Typography variant="body2" color="textSecondary">---</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {producto.codigo_barra
                        ? <Chip icon={<QrCodeScanner sx={{ fontSize: 14 }} />} label={producto.codigo_barra} size="small" sx={{ backgroundColor: "#f1f5f9", color: "#334155", fontWeight: 500, fontFamily: "monospace" }} />
                        : <Typography variant="body2" color="textSecondary">---</Typography>}
                    </TableCell>
                    <TableCell><Chip icon={<LocalOffer sx={{ fontSize: 14 }} />} label={formatPrecio(producto.precio_costo || 0)} size="small" sx={{ backgroundColor: "#f1f5f9", color: "#334155", fontWeight: 500 }} /></TableCell>
                    <TableCell><Chip icon={<AttachMoney sx={{ fontSize: 14 }} />} label={formatPrecio(producto.precio)} size="small" sx={{ backgroundColor: "#dbeafe", color: "#1e40af", fontWeight: 600 }} /></TableCell>
                    <TableCell><Chip label={`${margen}%`} size="small" sx={{ backgroundColor: margenColor, color: margenTextColor, fontWeight: 600 }} /></TableCell>
                    <TableCell><Chip label={producto.stock_minimo || 0} size="small" sx={{ backgroundColor: "#f1f5f9", color: "#334155", fontWeight: 500 }} /></TableCell>
                    <TableCell>
                      <Chip label={isActivo(producto) ? "Activo" : "Inactivo"} size="small"
                        sx={{ backgroundColor: isActivo(producto) ? "var(--success-light)" : "var(--error-light)", color: isActivo(producto) ? "#065f46" : "#991b1b", fontWeight: 600 }} />
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
        component={Paper} count={productosFiltrados.length} page={page}
        onPageChange={(_, newPage) => setPage(newPage)} rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[10, 15]} labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        sx={{ mt: 1, borderRadius: 2, boxShadow: "0 2px 8px rgba(102,126,234,0.08)", backgroundColor: "rgba(255,255,255,0.95)", "& .MuiTablePagination-toolbar": { px: 2 } }}
      />

      {/* ══════════════════════════════════════════════════════
          Diálogo CREAR
      ══════════════════════════════════════════════════════ */}
      <Dialog open={openCreateDialog} onClose={() => { setOpenCreateDialog(false); setFormData(EMPTY_FORM); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", borderBottom: "1px solid #e2e8f0" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Add sx={{ color: "var(--primary)" }} /> Agregar Nuevo Producto
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: "20px !important" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

            <TextField fullWidth label="Nombre del Producto" value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required size="small" sx={fieldSx}
              InputProps={{ startAdornment: <InputAdornment position="start"><Inventory sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment> }} />

            <Box>
              <Typography variant="caption" sx={{ color: "#64748b", mb: 0.75, display: "block", fontWeight: 500, fontSize: "0.78rem" }}>
                Categoría (opcional)
              </Typography>
              <CategoriaSelect value={formData.categoria} onChange={(val) => setFormData({ ...formData, categoria: val })} />
            </Box>

            <TextField fullWidth label="Precio de Costo" type="number" value={formData.precio_costo}
              onChange={(e) => setFormData({ ...formData, precio_costo: e.target.value })} required size="small" sx={fieldSx}
              InputProps={{ startAdornment: <InputAdornment position="start"><LocalOffer sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment>, inputProps: { step: "0.01", min: "0.01" } }}
              helperText="Precio que pagaste por el producto" />

            <TextField fullWidth label="Precio de Venta" type="number" value={formData.precio}
              onChange={(e) => setFormData({ ...formData, precio: e.target.value })} required size="small" sx={fieldSx}
              InputProps={{ startAdornment: <InputAdornment position="start"><AttachMoney sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment>, inputProps: { step: "0.01", min: "0.01" } }}
              helperText="Precio final al público" />

            <TextField fullWidth label="Código de Barras (opcional)" value={formData.codigo_barra}
              onChange={(e) => setFormData({ ...formData, codigo_barra: e.target.value })} size="small" sx={fieldSx}
              InputProps={{ startAdornment: <InputAdornment position="start"><QrCodeScanner sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment> }} />

          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: "var(--bg-soft)", borderTop: "1px solid #e2e8f0" }}>
          <Button onClick={() => { setOpenCreateDialog(false); setFormData(EMPTY_FORM); }}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateProducto} startIcon={<Save />}
            sx={{ background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)", "&:hover": { background: "linear-gradient(135deg, var(--primary-dark) 0%, #6b46c1 100%)" } }}>
            Crear Producto
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════
          Diálogo EDITAR
      ══════════════════════════════════════════════════════ */}
      <Dialog open={openEditDialog} onClose={() => { setOpenEditDialog(false); setSelectedProducto(null); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", borderBottom: "1px solid #e2e8f0" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Edit sx={{ color: "var(--primary)" }} /> Editar Producto — {selectedProducto?.nombre}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: "20px !important" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

            <TextField fullWidth label="Nombre del Producto" value={editFormData.nombre}
              onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })} required size="small" sx={fieldSx}
              InputProps={{ startAdornment: <InputAdornment position="start"><Inventory sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment> }} />

            <Box>
              <Typography variant="caption" sx={{ color: "#64748b", mb: 0.75, display: "block", fontWeight: 500, fontSize: "0.78rem" }}>
                Categoría
              </Typography>
              <CategoriaSelect value={editFormData.categoria} onChange={(val) => setEditFormData({ ...editFormData, categoria: val })} />
            </Box>

            <TextField fullWidth label="Precio de Costo" type="number" value={editFormData.precio_costo}
              onChange={(e) => setEditFormData({ ...editFormData, precio_costo: e.target.value })} required size="small" sx={fieldSx}
              InputProps={{ startAdornment: <InputAdornment position="start"><LocalOffer sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment>, inputProps: { step: "0.01", min: "0.01" } }} />

            <TextField fullWidth label="Precio de Venta" type="number" value={editFormData.precio}
              onChange={(e) => setEditFormData({ ...editFormData, precio: e.target.value })} required size="small" sx={fieldSx}
              InputProps={{ startAdornment: <InputAdornment position="start"><AttachMoney sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment>, inputProps: { step: "0.01", min: "0.01" } }} />

            <TextField fullWidth label="Código de Barras" value={editFormData.codigo_barra}
              size="small" disabled sx={fieldSx}
              InputProps={{ startAdornment: <InputAdornment position="start"><QrCodeScanner sx={{ color: "#64748b", fontSize: 18 }} /></InputAdornment> }}
              helperText="El código de barras no se puede modificar" />

          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: "var(--bg-soft)", borderTop: "1px solid #e2e8f0" }}>
          <Button onClick={() => { setOpenEditDialog(false); setSelectedProducto(null); }}>Cancelar</Button>
          <Button variant="contained" onClick={handleUpdateProducto} startIcon={<Save />}
            sx={{ background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)", "&:hover": { background: "linear-gradient(135deg, var(--primary-dark) 0%, #6b46c1 100%)" } }}>
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════
          Diálogo IMPORTAR
      ══════════════════════════════════════════════════════ */}
      <Dialog open={openImportDialog} onClose={importLoading ? undefined : handleImportClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", borderBottom: "1px solid #e2e8f0" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CloudUpload sx={{ color: "#4ade80" }} /> Importar productos desde Excel / CSV
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: "20px !important" }}>
          {!importResult && (
            <Alert severity="info" sx={{ mb: 2 }}>
              El archivo debe tener estos encabezados en la primera fila:
              <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2 }}>
                <li><strong>nombre</strong> *(obligatorio)*</li>
                <li><strong>precio</strong> *(obligatorio)*</li>
                <li>precio_costo, stock_minimo, codigo_barra, categoria *(opcionales)*</li>
              </Box>
              Se aceptan: <strong>.xlsx, .xls, .csv</strong>
            </Alert>
          )}
          {!importResult && (
            <Box
              sx={{ border: "2px dashed #94a3b8", borderRadius: 2, p: 3, textAlign: "center", cursor: "pointer", transition: "border-color 0.2s", "&:hover": { borderColor: "#4ade80" }, backgroundColor: importFile ? "rgba(74,222,128,0.06)" : "#f8fafc" }}
              onClick={() => document.getElementById("import-file-input").click()}
            >
              <input id="import-file-input" type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }}
                onChange={(e) => { const file = e.target.files?.[0] ?? null; setImportFile(file); e.target.value = ""; }} />
              {importFile ? (
                <>
                  <InsertDriveFile sx={{ fontSize: 40, color: "#4ade80", mb: 1 }} />
                  <Typography variant="body1" fontWeight={600}>{importFile.name}</Typography>
                  <Typography variant="body2" color="textSecondary">{(importFile.size / 1024).toFixed(1)} KB — hacé clic para cambiar</Typography>
                </>
              ) : (
                <>
                  <CloudUpload sx={{ fontSize: 40, color: "#94a3b8", mb: 1 }} />
                  <Typography variant="body1" color="textSecondary">Hacé clic para seleccionar el archivo</Typography>
                  <Typography variant="body2" color="textSecondary">.xlsx, .xls o .csv — máx 10 MB</Typography>
                </>
              )}
            </Box>
          )}
          {importResult && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Alert severity={importResult.errores?.length > 0 ? "warning" : "success"}>{importResult.message}</Alert>
              {importResult.creados?.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "#22c55e", mb: 0.5 }}>
                    <CheckCircle fontSize="small" /> {importResult.creados.length} producto{importResult.creados.length !== 1 ? "s" : ""} creado{importResult.creados.length !== 1 ? "s" : ""}
                  </Typography>
                  <Box sx={{ maxHeight: 120, overflowY: "auto", pl: 1 }}>
                    {importResult.creados.map((c) => <Typography key={c.id} variant="body2" color="textSecondary">Fila {c.fila}: {c.nombre}</Typography>)}
                  </Box>
                </Box>
              )}
              {importResult.omitidos?.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "#f59e0b", mb: 0.5 }}>
                    <ErrorOutline fontSize="small" /> {importResult.omitidos.length} omitido{importResult.omitidos.length !== 1 ? "s" : ""}
                  </Typography>
                  <Box sx={{ maxHeight: 100, overflowY: "auto", pl: 1 }}>
                    {importResult.omitidos.map((o, i) => <Typography key={i} variant="body2" color="textSecondary">Fila {o.fila}: {o.nombre ?? "—"} — {o.motivo}</Typography>)}
                  </Box>
                </Box>
              )}
              {importResult.errores?.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "#ef4444", mb: 0.5 }}>
                    <ErrorOutline fontSize="small" /> {importResult.errores.length} error{importResult.errores.length !== 1 ? "es" : ""}
                  </Typography>
                  <Box sx={{ maxHeight: 100, overflowY: "auto", pl: 1 }}>
                    {importResult.errores.map((e, i) => <Typography key={i} variant="body2" color="textSecondary">Fila {e.fila}: {e.nombre} — {e.motivo}</Typography>)}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: "var(--bg-soft)", borderTop: "1px solid #e2e8f0" }}>
          <Button onClick={handleImportClose} disabled={importLoading}>{importResult ? "Cerrar" : "Cancelar"}</Button>
          {!importResult && (
            <Button variant="contained" onClick={handleImport} disabled={!importFile || importLoading}
              startIcon={importLoading ? <CircularProgress size={16} color="inherit" /> : <CloudUpload />}
              sx={{ background: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)", color: "#fff", "&:hover": { background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" }, "&:disabled": { background: "#e2e8f0" } }}>
              {importLoading ? "Importando..." : "Importar"}
            </Button>
          )}
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