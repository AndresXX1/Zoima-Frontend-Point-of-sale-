// stock/TabStock.jsx
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Chip, TextField, Button, IconButton, FormControl, InputLabel,
  Select, MenuItem, FormControlLabel, Checkbox, TablePagination, InputAdornment,Divider,
  Tooltip, CircularProgress,
} from "@mui/material";
import {
  Edit, FilterList, Warning, Search, Clear, ExpandMore, ExpandLess,
  PictureAsPdf, Add, History, Refresh, 
} from "@mui/icons-material";

const TabStock = ({
  filteredStock,
  paginatedStock,
  stock,
  kioscos,
  productos,
  page,
  rowsPerPage,
  searchText, setSearchText,
  kioscoFilter, setKioscoFilter,
  productoFilter, setProductoFilter,
  stockStatus, setStockStatus,
  showInactiveProducts, setShowInactiveProducts,
  precioMin, setPrecioMin,
  precioMax, setPrecioMax,
  orderBy, setOrderBy,
  orderDirection, setOrderDirection,
  showAdvancedFilters, setShowAdvancedFilters,
  activeFiltersCount,
  generatingPDF,
  onChangePage,
  onChangeRowsPerPage,
  onClearFilters,
  onRefreshStock,
  onDownloadPDF,
  onOpenMovimiento,
  onOpenHistorial,
  onEditClick,
  getProductoNombreSimple,
  getProductoPrecio,
  getProductoPrecioCosto,
  getProductoMargen,
  getProductoActivo,
  getProductoStockMinimo,
  fmtMargen,
}) => {
  const Divider2 = ({ sx }) => <Box sx={{ borderBottom: "1px solid #e2e8f0", my: 2, ...sx }} />;

  return (
    <>
      {/* Toolbar */}
      <Paper elevation={2} sx={{ mb: 2, p: 2, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.98)" }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
            <TextField
              fullWidth size="small"
              placeholder="Buscar por producto, kiosco, código o ID..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search sx={{ color: "var(--primary)" }} /></InputAdornment>,
                endAdornment: searchText && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchText("")}><Clear fontSize="small" /></IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
            <Button
              variant={showAdvancedFilters ? "contained" : "outlined"}
              startIcon={showAdvancedFilters ? <ExpandLess /> : <ExpandMore />}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              sx={{ backgroundColor: showAdvancedFilters ? "var(--primary)" : "white", color: showAdvancedFilters ? "white" : "var(--primary)", borderColor: "var(--primary)", "&:hover": { backgroundColor: showAdvancedFilters ? "var(--primary-dark)" : "#f1f5f9" } }}
            >
              Filtros
            </Button>
            <Button variant="outlined" startIcon={<Refresh />} onClick={onRefreshStock} sx={{ color: "var(--primary)", borderColor: "var(--primary)", "&:hover": { backgroundColor: "#f1f5f9" } }}>
              Actualizar
            </Button>
            {activeFiltersCount > 0 && (
              <Button variant="outlined" startIcon={<Clear />} onClick={onClearFilters}>Limpiar</Button>
            )}
            <Tooltip title={filteredStock.length === 0 ? "No hay datos para exportar" : ""} arrow>
              <span>
                <Button
                  variant="contained"
                  startIcon={generatingPDF ? <CircularProgress size={16} sx={{ color: "white" }} /> : <PictureAsPdf />}
                  onClick={onDownloadPDF}
                  disabled={filteredStock.length === 0 || generatingPDF}
                  sx={{ background: "linear-gradient(135deg, #ef4444 0%, var(--error) 100%)", color: "white", fontWeight: 600, boxShadow: "0 4px 12px rgba(239,68,68,0.3)", "&:hover": { background: "linear-gradient(135deg, var(--error) 0%, #b91c1c 100%)", transform: "translateY(-1px)" }, "&:disabled": { background: "rgba(0,0,0,0.12)" }, transition: "all 0.2s", whiteSpace: "nowrap" }}
                >
                  {generatingPDF ? "Generando..." : activeFiltersCount > 0 ? `PDF (${filteredStock.length})` : "PDF"}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Filtros avanzados */}
      {showAdvancedFilters && (
        <Paper elevation={1} sx={{ mb: 3, p: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.95)" }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <FilterList sx={{ mr: 1, color: "var(--primary)" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Filtros Avanzados</Typography>
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: "#64748b" }}>Filtros principales</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 3, mb: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Kiosco</InputLabel>
              <Select value={kioscoFilter} label="Kiosco" onChange={e => setKioscoFilter(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {kioscos.map(k => <MenuItem key={k.id} value={k.id.toString()}>{k.nombre}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Producto</InputLabel>
              <Select value={productoFilter} label="Producto" onChange={e => setProductoFilter(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {productos.map(p => <MenuItem key={p.id} value={p.id.toString()}>{p.nombre}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Estado de Stock</InputLabel>
              <Select value={stockStatus} label="Estado de Stock" onChange={e => setStockStatus(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="agotado">Agotado (0)</MenuItem>
                <MenuItem value="bajo">Bajo (1-10)</MenuItem>
                <MenuItem value="normal">Normal (+10)</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ borderBottom: "1px solid #e2e8f0", my: 2 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: "#64748b" }}>Filtros secundarios</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr 1fr" }, gap: 3, alignItems: "center" }}>
            <FormControl fullWidth size="small">
              <InputLabel>Ordenar por</InputLabel>
              <Select value={`${orderBy}-${orderDirection}`} label="Ordenar por" onChange={e => { const [f, d] = e.target.value.split("-"); setOrderBy(f); setOrderDirection(d); }}>
                <MenuItem value="id-asc">ID ↑</MenuItem>
                <MenuItem value="id-desc">ID ↓</MenuItem>
                <MenuItem value="producto-asc">Producto A-Z</MenuItem>
                <MenuItem value="producto-desc">Producto Z-A</MenuItem>
                <MenuItem value="cantidad-asc">Cantidad ↑</MenuItem>
                <MenuItem value="cantidad-desc">Cantidad ↓</MenuItem>
                <MenuItem value="precio-asc">Precio ↑</MenuItem>
                <MenuItem value="precio-desc">Precio ↓</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth size="small" type="number" label="Precio mínimo" value={precioMin} onChange={e => setPrecioMin(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
            <TextField fullWidth size="small" type="number" label="Precio máximo" value={precioMax} onChange={e => setPrecioMax(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
            <FormControlLabel control={<Checkbox checked={showInactiveProducts} onChange={e => setShowInactiveProducts(e.target.checked)} />} label="Mostrar inactivos" />
          </Box>
        </Paper>
      )}

      {filteredStock.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="white" sx={{ fontWeight: 500 }}>
            Mostrando {paginatedStock.length} de {filteredStock.length} resultado{filteredStock.length !== 1 ? "s" : ""}
            {filteredStock.length !== stock.length && ` (${stock.length} totales)`}
          </Typography>
        </Box>
      )}

      {/* Tabla */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: "0 8px 32px rgba(102,126,234,0.15)", backgroundColor: "rgba(255,255,255,0.95)", maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {["ID", "Producto", "P. Venta", "P. Costo", "Margen", "Stock Mín.", "Kiosco", "Cantidad", "Acciones"].map(col => (
                <TableCell key={col} sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>{col}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStock.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="textSecondary">No hay stock disponible</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedStock.map(item => {
                const kiosco = kioscos.find(k => k.id === item.kiosco_id);
                const productoActivo = getProductoActivo(item.producto_id);
                const productoPrecio = getProductoPrecio(item.producto_id);
                const productoCosto = getProductoPrecioCosto(item.producto_id);
                const margen = getProductoMargen(item.producto_id);
                const stockMinimo = getProductoStockMinimo(item.producto_id);
                const esBajo = item.cantidad > 0 && item.cantidad <= Math.max(stockMinimo, 10);
                const esAgotado = item.cantidad === 0;
                const margenColor = margen === null ? "#64748b" : margen > 0 ? "var(--primary-dark)" : "var(--error)";

                return (
                  <TableRow key={item.id} hover sx={{ backgroundColor: !productoActivo ? "rgba(254,226,226,0.1)" : "inherit" }}>
                    <TableCell><Typography variant="body2" color="textSecondary">#{item.id}</Typography></TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{getProductoNombreSimple(item.producto_id)}</Typography>
                          <Typography variant="caption" color="textSecondary">ID: {item.producto_id}</Typography>
                        </Box>
                        {!productoActivo && <Warning fontSize="small" sx={{ color: "#ef4444" }} />}
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body1" sx={{ fontWeight: 600, color: "var(--primary-dark)" }}>${productoPrecio.toFixed(2)}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500 }}>{productoCosto !== null ? `$${productoCosto.toFixed(2)}` : "—"}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600, color: margenColor }}>{fmtMargen(margen)}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500 }}>{stockMinimo} unid.</Typography></TableCell>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{kiosco ? kiosco.nombre : `Kiosco ${item.kiosco_id}`}</Typography>
                      <Typography variant="caption" color="textSecondary">ID: {item.kiosco_id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: esAgotado ? "var(--error)" : esBajo ? "var(--warning)" : "var(--primary-dark)", fontSize: "1.05rem" }}>
                          {item.cantidad} unid.
                        </Typography>
                        {esAgotado && <Chip label="AGOTADO" size="small" sx={{ backgroundColor: "var(--error-light)", color: "#991b1b", fontWeight: 700, fontSize: "0.65rem" }} />}
                        {!esAgotado && esBajo && <Chip label="BAJO" size="small" sx={{ backgroundColor: "var(--warning-light)", color: "#92400e", fontWeight: 700, fontSize: "0.65rem" }} />}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title="Registrar movimiento" arrow>
                          <IconButton size="small" sx={{ backgroundColor: "#f0fdf4", "&:hover": { backgroundColor: "#dcfce7", transform: "scale(1.1)" }, transition: "all 0.2s" }} onClick={() => onOpenMovimiento(item)}>
                            <Add fontSize="small" sx={{ color: "var(--primary-dark)" }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Ver historial de movimientos" arrow>
                          <IconButton size="small" sx={{ backgroundColor: "#f0f9ff", "&:hover": { backgroundColor: "var(--info-light)", transform: "scale(1.1)" }, transition: "all 0.2s" }} onClick={() => onOpenHistorial(item)}>
                            <History fontSize="small" sx={{ color: "var(--info)" }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={productoActivo ? "Editar cantidad directamente" : "Producto inactivo"} arrow>
                          <span>
                            <IconButton size="small" sx={{ backgroundColor: "#f3f4f6", "&:hover": { backgroundColor: "#e5e7eb", transform: "scale(1.1)" }, transition: "all 0.2s" }} onClick={() => onEditClick(item)} disabled={!productoActivo}>
                              <Edit fontSize="small" sx={{ color: productoActivo ? "var(--primary)" : "#9ca3af" }} />
                            </IconButton>
                          </span>
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

      {filteredStock.length > 0 && (
        <Paper sx={{ mt: 2, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.95)" }}>
          <TablePagination
            component="div"
            count={filteredStock.length}
            page={page}
            onPageChange={onChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={onChangeRowsPerPage}
            rowsPerPageOptions={[10, 15, 25, 50, 100]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </Paper>
      )}
    </>
  );
};

export default TabStock;