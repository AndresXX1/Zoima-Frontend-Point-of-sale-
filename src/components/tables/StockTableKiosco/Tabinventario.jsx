// stock/TabInventario.jsx
// ─────────────────────────────────────────────────────────────────
// Tab de inventario semanal. Permite seleccionar un kiosco,
// elegir el empleado responsable (entre los fichados ahora) e
// ingresar las cantidades contadas.
// ─────────────────────────────────────────────────────────────────
import {
  Box, Paper, Typography, FormControl, InputLabel, Select, MenuItem,
  TextField, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, LinearProgress,
  IconButton, Alert, Tooltip, TablePagination,
} from "@mui/material";
import {
  Inventory2, CheckCircle, ArrowUpward, ArrowDownward,
  Person, Refresh,
} from "@mui/icons-material";
import HistorialInventarios from "./HistorialInventarios";

const TabInventario = ({
  // kiosco
  esKiosco, usuario, kioscos,
  kioscoInventario, onKioscoChange,
  // items
  inventarioItems, loadingInventario,
  onCantidadChange,
  invItemsPage, setInvItemsPage,
  invItemsRowsPerPage, setInvItemsRowsPerPage,
  // observaciones
  observacionesInventario, setObservacionesInventario,
  // empleado
  fichadosAhora, loadingFichados,
  empleadoInventario, setEmpleadoInventario,
  onRefreshFichados,
  // confirm
  savingInventario,
  onConfirmarInventario,
  // helpers de precio/costo
  getProductoPrecioCosto,
  // historial
  historialInventarios, loadingHistorialInv,
  showHistorialInv, setShowHistorialInv,
  invHistPage, setInvHistPage,
  invHistRowsPerPage, setInvHistRowsPerPage,
  generatingPDFInv,
  onRefreshHistorial,
  onVerDetalle,
  onDescargarPDFInv,
}) => {
  const paginatedInvItems = inventarioItems.slice(
    invItemsPage * invItemsRowsPerPage,
    invItemsPage * invItemsRowsPerPage + invItemsRowsPerPage
  );

  const ventaTotal  = inventarioItems.reduce((a, i) => a + i.nueva_cantidad * parseFloat(i.precio), 0);
  const costoTotal  = inventarioItems.reduce((a, i) => { const c = getProductoPrecioCosto(i.producto_id); return c !== null ? a + i.nueva_cantidad * c : a; }, 0);
  const hayConCosto = inventarioItems.some(i => getProductoPrecioCosto(i.producto_id) !== null);
  const margenTotal = hayConCosto ? ventaTotal - costoTotal : null;

  return (
    <Box>
      {/* ── Formulario principal ── */}
      <Paper sx={{ p: 3, borderRadius: 3, mb: 3, backgroundColor: "rgba(255,255,255,0.98)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>🗓️ Nuevo Inventario Semanal</Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          {esKiosco
            ? "Ingresá las cantidades contadas para tu kiosco y confirmá el inventario."
            : "Seleccioná el kiosco, ingresá las cantidades contadas y confirmá."}
        </Typography>

        {/* Kiosco + observaciones */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, mb: 3 }}>
          {esKiosco ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 2, backgroundColor: "#f0fdf4", borderRadius: 2, border: "1px solid #bbf7d0" }}>
              <Inventory2 sx={{ color: "var(--primary-dark)", fontSize: "1.4rem" }} />
              <Box>
                <Typography variant="caption" color="textSecondary" display="block">Kiosco asignado</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: "var(--primary-dark)" }}>
                  {usuario?.kiosco_nombre ?? `Kiosco ${usuario?.kiosco_id}`}
                </Typography>
              </Box>
            </Box>
          ) : (
            <FormControl fullWidth size="small">
              <InputLabel>Kiosco a inventariar</InputLabel>
              <Select value={kioscoInventario} label="Kiosco a inventariar" onChange={e => onKioscoChange(e.target.value)}>
                <MenuItem value="">Seleccioná un kiosco</MenuItem>
                {kioscos.filter(k => k.activo).map(k => <MenuItem key={k.id} value={k.id.toString()}>{k.nombre}</MenuItem>)}
              </Select>
            </FormControl>
          )}
          <TextField
            fullWidth size="small"
            label="Observaciones (opcional)"
            value={observacionesInventario}
            onChange={e => setObservacionesInventario(e.target.value)}
            placeholder="Ej: Inventario semana del 01/01"
          />
        </Box>

        {/* ── Selector de empleado responsable ── */}
        <Box sx={{ mb: 3, p: 2.5, backgroundColor: "#fafafa", borderRadius: 2, border: "1px solid #e2e8f0" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Person sx={{ color: "var(--primary)", fontSize: "1.2rem" }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>¿Quién realiza el inventario?</Typography>
            </Box>
            <Tooltip title="Actualizar lista de empleados fichados" arrow>
              <IconButton size="small" onClick={onRefreshFichados} disabled={loadingFichados} sx={{ color: "var(--primary)" }}>
                {loadingFichados ? <CircularProgress size={16} /> : <Refresh fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>

          {loadingFichados ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="textSecondary">Cargando empleados fichados...</Typography>
            </Box>
          ) : fichadosAhora.length === 0 ? (
            <Alert severity="warning" sx={{ py: 0.5 }}>
              No hay empleados fichados en este momento. El inventario no podrá confirmarse hasta que haya al menos uno fichado.
            </Alert>
          ) : (
            <FormControl fullWidth size="small" required>
              <InputLabel>Empleado responsable *</InputLabel>
              <Select value={empleadoInventario} label="Empleado responsable *" onChange={e => setEmpleadoInventario(e.target.value)}>
                <MenuItem value=""><em>Seleccioná un empleado</em></MenuItem>
                {fichadosAhora.map(emp => (
                  <MenuItem key={emp.empleado_id} value={emp.empleado_id.toString()}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--primary-dark)", flexShrink: 0 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{emp.nombre} {emp.apellido}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {emp.rol_nombre} · Fichado {new Date(emp.hora_ingreso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {empleadoInventario && (() => {
            const emp = fichadosAhora.find(e => e.empleado_id.toString() === empleadoInventario);
            return emp ? (
              <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                <CheckCircle sx={{ color: "var(--primary-dark)", fontSize: "1rem" }} />
                <Typography variant="caption" sx={{ color: "var(--primary-dark)", fontWeight: 600 }}>
                  Responsable: {emp.nombre} {emp.apellido}
                </Typography>
              </Box>
            ) : null;
          })()}
        </Box>

        {loadingInventario && <LinearProgress sx={{ mb: 2 }} />}

        {/* ── Tabla de items ── */}
        {inventarioItems.length > 0 && (
          <>
            <Box sx={{ mb: 2, p: 2, backgroundColor: "#f0fdf4", borderRadius: 2, border: "1px solid #bbf7d0" }}>
              <Typography variant="body2" sx={{ color: "#065f46", fontWeight: 500 }}>
                ✅ {inventarioItems.length} productos cargados · mostrando {paginatedInvItems.length} en esta página.
              </Typography>
            </Box>

            <TableContainer sx={{ mb: 0, border: "1px solid #e2e8f0", borderRadius: "8px 8px 0 0" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {["Producto", "P. Venta", "P. Costo", "Margen", "Stock actual", "Cantidad contada", "Diferencia"].map(c => (
                      <TableCell key={c} sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", fontSize: "0.75rem" }}>{c}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedInvItems.map(item => {
                    const diff   = item.nueva_cantidad - item.cantidad;
                    const costo  = item.precio_costo != null ? parseFloat(item.precio_costo) : null;
                    const margen = costo != null ? parseFloat(item.precio) - costo : null;
                    return (
                      <TableRow key={item.stock_id} hover>
                        <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{item.producto_nombre}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ color: "var(--primary-dark)", fontWeight: 600 }}>${parseFloat(item.precio).toFixed(2)}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ color: "#64748b" }}>{costo != null ? `$${costo.toFixed(2)}` : "—"}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ color: margen == null ? "#64748b" : margen >= 0 ? "var(--primary-dark)" : "var(--error)", fontWeight: 600 }}>{margen != null ? `$${margen.toFixed(2)}` : "—"}</Typography></TableCell>
                        <TableCell><Typography variant="body2">{item.cantidad} unid.</Typography></TableCell>
                        <TableCell sx={{ width: 130 }}>
                          <TextField
                            size="small" type="number"
                            value={item.nueva_cantidad}
                            onChange={e => onCantidadChange(item.stock_id, e.target.value)}
                            inputProps={{ min: 0, style: { textAlign: "center", fontWeight: 700 } }}
                            sx={{ width: 90 }}
                          />
                        </TableCell>
                        <TableCell>
                          {diff !== 0 ? (
                            <Chip
                              label={`${diff > 0 ? "+" : ""}${diff}`}
                              size="small"
                              icon={diff > 0 ? <ArrowUpward sx={{ fontSize: "0.8rem !important" }} /> : <ArrowDownward sx={{ fontSize: "0.8rem !important" }} />}
                              sx={{ backgroundColor: diff > 0 ? "var(--success-light)" : "var(--error-light)", color: diff > 0 ? "#065f46" : "#991b1b", fontWeight: 700 }}
                            />
                          ) : (
                            <Typography variant="caption" color="textSecondary">Sin cambios</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Paper variant="outlined" sx={{ borderTop: 0, borderRadius: "0 0 8px 8px", mb: 3 }}>
              <TablePagination
                component="div"
                count={inventarioItems.length}
                page={invItemsPage}
                onPageChange={(_, p) => setInvItemsPage(p)}
                rowsPerPage={invItemsRowsPerPage}
                onRowsPerPageChange={e => { setInvItemsRowsPerPage(parseInt(e.target.value, 10)); setInvItemsPage(0); }}
                rowsPerPageOptions={[10, 15, 25]}
                labelRowsPerPage="Por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count} productos`}
              />
            </Paper>

            {/* Resumen numérico */}
            <Box sx={{ mb: 3, p: 2, backgroundColor: "var(--bg-soft)", borderRadius: 2, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 2 }}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--primary)" }}>
                  {inventarioItems.reduce((a, i) => a + i.nueva_cantidad, 0)}
                </Typography>
                <Typography variant="caption" color="textSecondary">Total unidades</Typography>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--primary-dark)" }}>
                  ${ventaTotal.toLocaleString("es-ES", { minimumFractionDigits: 0 })}
                </Typography>
                <Typography variant="caption" color="textSecondary">Valor venta total</Typography>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                {hayConCosto ? (
                  <>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--error)" }}>
                      ${costoTotal.toLocaleString("es-ES", { minimumFractionDigits: 0 })}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">Costo total</Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: "#64748b" }}>—</Typography>
                    <Typography variant="caption" color="textSecondary">Costo total</Typography>
                  </>
                )}
              </Box>
              <Box sx={{ textAlign: "center" }}>
                {margenTotal !== null ? (
                  <>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: margenTotal >= 0 ? "var(--primary-dark)" : "var(--error)" }}>
                      ${margenTotal.toLocaleString("es-ES", { minimumFractionDigits: 0 })}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">Margen estimado</Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: "#64748b" }}>—</Typography>
                    <Typography variant="caption" color="textSecondary">Margen estimado</Typography>
                  </>
                )}
              </Box>
            </Box>

            <Button
              fullWidth variant="contained" size="large"
              onClick={onConfirmarInventario}
              disabled={savingInventario || !empleadoInventario || fichadosAhora.length === 0}
              startIcon={savingInventario ? <CircularProgress size={18} sx={{ color: "white" }} /> : <CheckCircle />}
              sx={{ background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)", color: "white", fontWeight: 700, py: 1.5, fontSize: "1rem", borderRadius: 2, boxShadow: "0 4px 12px rgba(102,126,234,0.35)", "&:hover": { transform: "translateY(-1px)" }, "&:disabled": { background: "rgba(0,0,0,0.12)" }, transition: "all 0.2s" }}
            >
              {savingInventario
                ? "Cerrando inventario..."
                : !empleadoInventario
                  ? "Seleccioná quién realiza el inventario"
                  : "✅ Confirmar Inventario"}
            </Button>
          </>
        )}

        {/* Empty states */}
        {!loadingInventario && !kioscoInventario && !esKiosco && (
          <Box sx={{ textAlign: "center", py: 4, color: "#94a3b8" }}>
            <Inventory2 sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
            <Typography variant="body1">Seleccioná un kiosco para comenzar</Typography>
          </Box>
        )}
        {loadingInventario && esKiosco && inventarioItems.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
        )}
      </Paper>

      {/* Historial */}
      <HistorialInventarios
        historialInventarios={historialInventarios}
        loadingHistorialInv={loadingHistorialInv}
        showHistorialInv={showHistorialInv}
        setShowHistorialInv={setShowHistorialInv}
        invHistPage={invHistPage}
        setInvHistPage={setInvHistPage}
        invHistRowsPerPage={invHistRowsPerPage}
        setInvHistRowsPerPage={setInvHistRowsPerPage}
        generatingPDFInv={generatingPDFInv}
        onRefresh={onRefreshHistorial}
        onVerDetalle={onVerDetalle}
        onDescargarPDF={onDescargarPDFInv}
      />
    </Box>
  );
};

export default TabInventario;