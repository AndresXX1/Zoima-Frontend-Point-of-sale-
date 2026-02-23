// stock/HistorialInventarios.jsx
import { useState } from "react";
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Typography, Chip, IconButton, Button, Tooltip,
  TablePagination, CircularProgress, Collapse,
} from "@mui/material";
import {
  History, Visibility, Edit, PictureAsPdf, ExpandMore, ExpandLess,
  Refresh, Person, ArrowUpward, ArrowDownward,
} from "@mui/icons-material";
import { fmtFecha } from "./Stockutils";

// ── Detalle expandido por inventario ────────────────────────────
const DetalleItems = ({ items }) => {
  if (!items?.length) {
    return (
      <Typography variant="body2" color="textSecondary" sx={{ py: 2, textAlign: "center" }}>
        No hay detalle disponible para este inventario.
      </Typography>
    );
  }

  const hayConCosto = items.some(i => i.precio_costo != null);
  const totalVenta  = items.reduce((a, i) => a + i.cantidad_contada * parseFloat(i.precio), 0);
  const totalCosto  = items.reduce((a, i) => i.precio_costo != null ? a + i.cantidad_contada * parseFloat(i.precio_costo) : a, 0);
  const margenTotal = hayConCosto ? totalVenta - totalCosto : null;
  const totalUnid   = items.reduce((a, i) => a + i.cantidad_contada, 0);

  return (
    <Box sx={{ px: 2, pb: 2, pt: 1 }}>
      {/* Resumen rápido */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1.5, mb: 2, p: 1.5, backgroundColor: "var(--bg-soft)", borderRadius: 2 }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--primary)", lineHeight: 1 }}>{totalUnid}</Typography>
          <Typography variant="caption" color="textSecondary">Unidades</Typography>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--primary-dark)", lineHeight: 1 }}>
            ${totalVenta.toLocaleString("es-ES", { minimumFractionDigits: 0 })}
          </Typography>
          <Typography variant="caption" color="textSecondary">Val. venta</Typography>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--error)", lineHeight: 1 }}>
            {hayConCosto ? `$${totalCosto.toLocaleString("es-ES", { minimumFractionDigits: 0 })}` : "—"}
          </Typography>
          <Typography variant="caption" color="textSecondary">Costo total</Typography>
        </Box>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1, color: margenTotal == null ? "#64748b" : margenTotal >= 0 ? "var(--primary-dark)" : "var(--error)" }}>
            {margenTotal != null ? `$${margenTotal.toLocaleString("es-ES", { minimumFractionDigits: 0 })}` : "—"}
          </Typography>
          <Typography variant="caption" color="textSecondary">Margen</Typography>
        </Box>
      </Box>

      {/* Tabla de productos */}
      <TableContainer sx={{ border: "1px solid #e2e8f0", borderRadius: 1.5, maxHeight: 320 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {["Producto", "P. Venta", "P. Costo", "Margen unit.", "Anterior", "Contado", "Diferencia", "Val. venta", "Val. costo"].map(c => (
                <TableCell key={c} sx={{ fontWeight: 600, backgroundColor: "#f8fafc", fontSize: "0.7rem", py: 0.8, whiteSpace: "nowrap" }}>{c}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, idx) => {
              const precio   = parseFloat(item.precio);
              const costo    = item.precio_costo != null ? parseFloat(item.precio_costo) : null;
              const margen   = costo != null ? precio - costo : null;
              const delta    = item.cantidad_delta ?? 0;
              const valVenta = item.cantidad_contada * precio;
              const valCosto = costo != null ? item.cantidad_contada * costo : null;
              return (
                <TableRow key={idx} hover>
                  <TableCell sx={{ fontWeight: 500, fontSize: "0.78rem", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.producto_nombre}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.78rem", color: "var(--primary-dark)", fontWeight: 600 }}>
                    ${precio.toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.78rem", color: "#64748b" }}>
                    {costo != null ? `$${costo.toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.78rem", fontWeight: 600, color: margen == null ? "#64748b" : margen >= 0 ? "var(--primary-dark)" : "var(--error)" }}>
                    {margen != null ? `$${margen.toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.78rem", color: "#64748b" }}>{item.cantidad_antes}</TableCell>
                  <TableCell sx={{ fontSize: "0.78rem", fontWeight: 700 }}>{item.cantidad_contada}</TableCell>
                  <TableCell>
                    {delta !== 0 ? (
                      <Chip
                        label={`${delta > 0 ? "+" : ""}${delta}`}
                        size="small"
                        icon={delta > 0 ? <ArrowUpward sx={{ fontSize: "0.7rem !important" }} /> : <ArrowDownward sx={{ fontSize: "0.7rem !important" }} />}
                        sx={{ backgroundColor: delta > 0 ? "var(--success-light)" : "var(--error-light)", color: delta > 0 ? "#065f46" : "#991b1b", fontWeight: 700, fontSize: "0.65rem", height: 20 }}
                      />
                    ) : (
                      <Typography variant="caption" color="textSecondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.78rem", fontWeight: 600 }}>
                    ${valVenta.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.78rem", color: "#64748b" }}>
                    {valCosto != null ? `$${valCosto.toLocaleString("es-ES", { minimumFractionDigits: 2 })}` : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// ── Componente principal ─────────────────────────────────────────
const HistorialInventarios = ({
  historialInventarios,
  loadingHistorialInv,
  showHistorialInv,
  setShowHistorialInv,
  invHistPage,
  setInvHistPage,
  invHistRowsPerPage,
  setInvHistRowsPerPage,
  generatingPDFInv,
  onRefresh,
  onVerDetalle,
  onDescargarPDF,
}) => {
  const [expandedRow, setExpandedRow] = useState(null);

  const paginatedHistorial = historialInventarios.slice(
    invHistPage * invHistRowsPerPage,
    invHistPage * invHistRowsPerPage + invHistRowsPerPage
  );

  const toggleRow = (id) => setExpandedRow(prev => prev === id ? null : id);

  return (
    <Paper sx={{ p: 3, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.98)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>

      {/* Header colapsable */}
      <Box
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none" }}
        onClick={() => setShowHistorialInv(v => !v)}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <History sx={{ color: "var(--primary)" }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            📚 Historial de Inventarios Cerrados
            {historialInventarios.length > 0 && (
              <Typography component="span" variant="body2" color="textSecondary" sx={{ ml: 1, fontWeight: 400 }}>
                ({historialInventarios.length} en total)
              </Typography>
            )}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {!showHistorialInv && historialInventarios.length > 0 && (
            <Chip label={`${historialInventarios.length} registros`} size="small" sx={{ backgroundColor: "#ede9fe", color: "#7c3aed", fontWeight: 600 }} />
          )}
          <IconButton size="small" sx={{ color: "var(--primary)" }}>
            {showHistorialInv ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      </Box>

      {showHistorialInv && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button
              variant="outlined" startIcon={<Refresh />} size="small"
              onClick={e => { e.stopPropagation(); onRefresh(); }}
              sx={{ color: "var(--primary)", borderColor: "var(--primary)", "&:hover": { backgroundColor: "#f1f5f9" } }}
            >
              Actualizar
            </Button>
          </Box>

          {loadingHistorialInv ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
          ) : historialInventarios.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4, color: "#94a3b8" }}>
              <History sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography variant="body1">No hay inventarios cerrados aún</Typography>
            </Box>
          ) : (
            <>
              <TableContainer sx={{ borderRadius: "8px 8px 0 0", border: "1px solid #e2e8f0" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {["", "Fecha", "Kiosco", "Productos", "Val. venta", "Val. costo", "Margen", "Observaciones", "Realizado por", "Acciones"].map(c => (
                        <TableCell key={c} sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", fontSize: "0.8rem" }}>{c}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedHistorial.map((inv, idx) => {
                      const esUltimo   = invHistPage === 0 && idx === 0;
                      const isExpanded = expandedRow === inv.id;
                      const items      = inv.items ?? [];
                      const hayConCosto = items.some(i => i.precio_costo != null);
                      const totalVenta  = parseFloat(inv.valor_total ?? 0);
                      const totalCosto  = items.reduce((a, i) => i.precio_costo != null ? a + i.cantidad_contada * parseFloat(i.precio_costo) : a, 0);
                      const margenTotal = hayConCosto ? totalVenta - totalCosto : null;

                      return (
                        <>
                          <TableRow
                            key={inv.id}
                            hover
                            sx={{ backgroundColor: esUltimo ? "rgba(102,126,234,0.04)" : "inherit", cursor: "pointer" }}
                            onClick={() => toggleRow(inv.id)}
                          >
                            {/* Expand toggle */}
                            <TableCell sx={{ width: 32, p: 0.5 }}>
                              <IconButton size="small" sx={{ color: "var(--primary)" }}>
                                {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                              </IconButton>
                            </TableCell>

                            {/* Fecha */}
                            <TableCell onClick={e => e.stopPropagation()}>
                              <Typography variant="body2" sx={{ fontWeight: esUltimo ? 700 : 400, whiteSpace: "nowrap" }}>
                                {fmtFecha(inv.created_at)}
                              </Typography>
                              {esUltimo && (
                                <Chip label="Último" size="small" sx={{ backgroundColor: "#ede9fe", color: "#7c3aed", fontWeight: 700, fontSize: "0.65rem", mt: 0.3 }} />
                              )}
                            </TableCell>

                            {/* Kiosco */}
                            <TableCell onClick={e => e.stopPropagation()}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{inv.kiosco_nombre}</Typography>
                            </TableCell>

                            {/* Productos */}
                            <TableCell onClick={e => e.stopPropagation()}>
                              <Typography variant="body2">{inv.total_productos}</Typography>
                            </TableCell>

                            {/* Val. venta */}
                            <TableCell onClick={e => e.stopPropagation()}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--primary-dark)", whiteSpace: "nowrap" }}>
                                ${totalVenta.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                              </Typography>
                            </TableCell>

                            {/* Val. costo */}
                            <TableCell onClick={e => e.stopPropagation()}>
                              <Typography variant="body2" sx={{ color: hayConCosto ? "var(--error)" : "#94a3b8", fontWeight: hayConCosto ? 600 : 400, whiteSpace: "nowrap" }}>
                                {hayConCosto ? `$${totalCosto.toLocaleString("es-ES", { minimumFractionDigits: 2 })}` : "—"}
                              </Typography>
                            </TableCell>

                            {/* Margen */}
                            <TableCell onClick={e => e.stopPropagation()}>
                              <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: "nowrap", color: margenTotal == null ? "#94a3b8" : margenTotal >= 0 ? "var(--primary-dark)" : "var(--error)" }}>
                                {margenTotal != null ? `$${margenTotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}` : "—"}
                              </Typography>
                            </TableCell>

                            {/* Observaciones */}
                            <TableCell onClick={e => e.stopPropagation()}>
                              <Typography variant="caption" color="textSecondary" sx={{ fontStyle: "italic" }}>
                                {inv.observaciones || "—"}
                              </Typography>
                            </TableCell>

                            {/* Realizado por */}
                            <TableCell onClick={e => e.stopPropagation()}>
                              {inv.empleado_nombre ? (
                                <Box>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <Person sx={{ fontSize: "0.9rem", color: "var(--primary)" }} />
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{inv.empleado_nombre}</Typography>
                                  </Box>
                                  {inv.usuario_nombre && (
                                    <Typography variant="caption" color="textSecondary" display="block">Sistema: {inv.usuario_nombre}</Typography>
                                  )}
                                </Box>
                              ) : (
                                <Typography variant="body2" color="textSecondary">{inv.usuario_nombre ?? "—"}</Typography>
                              )}
                            </TableCell>

                            {/* Acciones */}
                            <TableCell onClick={e => e.stopPropagation()}>
                              <Box sx={{ display: "flex", gap: 0.5 }}>
                                <Tooltip title="Ver detalle completo" arrow>
                                  <IconButton size="small" onClick={() => onVerDetalle(inv, "view")} sx={{ backgroundColor: "#f0f9ff", "&:hover": { backgroundColor: "var(--info-light)", transform: "scale(1.1)" }, transition: "all 0.2s" }}>
                                    <Visibility fontSize="small" sx={{ color: "var(--info)" }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Usar como base para nuevo inventario" arrow>
                                  <IconButton size="small" onClick={() => onVerDetalle(inv, "edit")} sx={{ backgroundColor: "#fefce8", "&:hover": { backgroundColor: "#fef9c3", transform: "scale(1.1)" }, transition: "all 0.2s" }}>
                                    <Edit fontSize="small" sx={{ color: "var(--warning)" }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Descargar PDF" arrow>
                                  <IconButton
                                    size="small"
                                    disabled={generatingPDFInv}
                                    onClick={() => onDescargarPDF({ ...inv, items: inv.items })}
                                    sx={{ backgroundColor: "#fef2f2", "&:hover": { backgroundColor: "var(--error-light)", transform: "scale(1.1)" }, transition: "all 0.2s" }}
                                  >
                                    <PictureAsPdf fontSize="small" sx={{ color: "var(--error)" }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>

                          {/* Fila expandida */}
                          <TableRow key={`${inv.id}-detail`}>
                            <TableCell colSpan={10} sx={{ p: 0, border: isExpanded ? undefined : "none" }}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box sx={{ backgroundColor: "#fafbff", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
                                  <DetalleItems items={inv.items} />
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Paper variant="outlined" sx={{ borderTop: 0, borderRadius: "0 0 8px 8px" }}>
                <TablePagination
                  component="div"
                  count={historialInventarios.length}
                  page={invHistPage}
                  onPageChange={(_, p) => { setInvHistPage(p); setExpandedRow(null); }}
                  rowsPerPage={invHistRowsPerPage}
                  onRowsPerPageChange={e => { setInvHistRowsPerPage(parseInt(e.target.value, 10)); setInvHistPage(0); setExpandedRow(null); }}
                  rowsPerPageOptions={[10, 15, 25]}
                  labelRowsPerPage="Por página:"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count} inventarios`}
                />
              </Paper>
            </>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default HistorialInventarios;