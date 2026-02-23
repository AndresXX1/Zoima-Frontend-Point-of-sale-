/* eslint-disable no-unused-vars */
// components/tables/VentasAdminTable.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Tooltip, TextField, MenuItem,
  Select, InputLabel, FormControl, InputAdornment, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider,
  TablePagination, Alert, Snackbar,
} from "@mui/material";
import {
  Search, Refresh, Visibility, Cancel, Receipt,
  FilterList, Clear, Store, Person, CheckCircle,
  AttachMoney, CreditCard, Download,
} from "@mui/icons-material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API = "http://localhost:3000/api";

const fmt = (n) =>
  Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2 });

function formatFecha(f) {
  if (!f) return "—";
  return new Date(f).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatMonto(m) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS", minimumFractionDigits: 2,
  }).format(Number(m || 0));
}

function EstadoChip({ anulada }) {
  return anulada ? (
    <Chip label="Anulada" size="small" sx={{ backgroundColor: "var(--error-light)", color: "#991b1b", fontWeight: 600, fontSize: "0.75rem" }} />
  ) : (
    <Chip label="Válida" size="small" sx={{ backgroundColor: "var(--success-light)", color: "#065f46", fontWeight: 600, fontSize: "0.75rem" }} />
  );
}

// ── Generador de PDF ─────────────────────────────────────────────
function generarPDFVenta(venta, logoBase64) {
  const doc = new jsPDF();
  const primaryColor = [102, 126, 234];
  const textColor    = [15, 23, 42];
  const grayColor    = [100, 116, 139];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 45, "F");

  if (logoBase64) {
    // eslint-disable-next-line no-empty
    try { doc.addImage(logoBase64, "PNG", 14, 8, 30, 30); } catch (_) {}
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont(undefined, "bold");
  doc.text("Comprobante de Venta", 105, 18, { align: "center" });
  doc.setFontSize(13);
  doc.setFont(undefined, "normal");
  doc.text(`Ticket #${venta.ticket_numero}`, 105, 28, { align: "center" });
  doc.setFontSize(10);
  doc.text(`${venta.kiosco_nombre || ""} — ${formatFecha(venta.fecha)}`, 105, 36, { align: "center" });

  // Info general
  let y = 55;
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text("Información de la venta", 14, y); y += 8;
  doc.setFont(undefined, "normal");
  doc.setFontSize(10);

  const info = [
    ["Kiosco",   venta.kiosco_nombre  || "—"],
    ["Fecha",    formatFecha(venta.fecha)],
    ["Usuario",  venta.usuario_nombre || venta.usuario_email || "—"],
    ["Estado",   venta.anulada ? "ANULADA" : "CONFIRMADA"],
  ];

  if ((venta.empleados ?? []).length > 0) {
    const nombres = venta.empleados.map(e =>
      typeof e === "string" ? e : `${e.nombre} ${e.apellido}`
    ).join(", ");
    info.push(["Realizado por", nombres]);
  }

  info.forEach(([k, v]) => {
    doc.setFont(undefined, "bold");
    doc.text(`${k}:`, 14, y);
    doc.setFont(undefined, "normal");
    doc.text(v, 60, y);
    y += 7;
  });

  y += 4;

  // Productos
  const detalles = venta.detalles ?? venta.productos ?? [];
  doc.setFont(undefined, "bold");
  doc.setFontSize(11);
  doc.text("Productos", 14, y); y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Producto", "Cantidad", "Precio unit.", "Subtotal"]],
    body: detalles.map(p => {
      const precio = Number(p.precio_unitario ?? p.precio ?? 0);
      return [
        p.producto_nombre ?? p.nombre ?? "—",
        p.cantidad,
        `$${fmt(precio)}`,
        `$${fmt(p.cantidad * precio)}`,
      ];
    }),
    theme: "striped",
    headStyles: { fillColor: primaryColor, textColor: [255,255,255], fontSize: 10, fontStyle: "bold", halign: "center" },
    bodyStyles: { textColor, fontSize: 9, halign: "center" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
    columnStyles: { 0: { halign: "left" } },
  });

  y = doc.lastAutoTable.finalY + 8;

  // Pagos
  const pagos = venta.pagos ?? [];
  if (pagos.length > 0) {
    doc.setFont(undefined, "bold");
    doc.setFontSize(11);
    doc.setTextColor(...textColor);
    doc.text("Pagos", 14, y); y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Tipo", "Monto"]],
      body: pagos.map(p => [p.tipo, `$${fmt(p.monto)}`]),
      theme: "striped",
      headStyles: { fillColor: primaryColor, textColor: [255,255,255], fontSize: 10, fontStyle: "bold", halign: "center" },
      bodyStyles: { textColor, fontSize: 9, halign: "center" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // Total
  doc.setFillColor(...primaryColor);
  doc.rect(14, y, 182, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, "bold");
  doc.setFontSize(13);
  doc.text("TOTAL:", 20, y + 9.5);
  doc.text(`$${fmt(venta.total)}`, 196, y + 9.5, { align: "right" });

  // Footer
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text(`Página ${i} de ${pages}`, 105, doc.internal.pageSize.height - 10, { align: "center" });
    doc.text("Sistema de Gestión ZOIMA", 14, doc.internal.pageSize.height - 10);
  }

  doc.save(`Venta_${venta.ticket_numero}_${Date.now()}.pdf`);
}

// ── Hook logo base64 ─────────────────────────────────────────────
function useLogoBase64(path) {
  const [base64, setBase64] = useState(null);
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      setBase64(canvas.toDataURL("image/png"));
    };
    img.src = path;
  }, [path]);
  return base64;
}

// ── Modal detalle ─────────────────────────────────────────────────
function DetalleModal({ ventaId, open, onClose }) {
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(false);
  const logoBase64 = useLogoBase64("/logo.png");

  useEffect(() => {
    if (!open || !ventaId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`${API}/ventas/${ventaId}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setVenta(d))
      .finally(() => setLoading(false));
  }, [ventaId, open]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (!open) setVenta(null); }, [open]);

  const detalles  = venta?.detalles  ?? venta?.productos ?? [];
  const pagos     = venta?.pagos     ?? [];
  const empleados = venta?.empleados ?? [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" } }}
    >
      <DialogTitle sx={{ pb: 2, borderBottom: "1px solid #e2e8f0", fontWeight: 800 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Receipt sx={{ color: "var(--primary)" }} />
            {venta ? `Ticket #${venta.ticket_numero}` : "Detalle de venta"}
          </Box>
          {venta && (venta.anulada ? (
            <Chip icon={<Cancel />} label="ANULADA"
              sx={{ backgroundColor: "var(--error-light)", color: "#991b1b", fontWeight: 800 }} />
          ) : (
            <Chip icon={<CheckCircle />} label="CONFIRMADA"
              sx={{ backgroundColor: "#dcfce7", color: "#166534", fontWeight: 800 }} />
          ))}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress sx={{ color: "var(--primary)" }} />
          </Box>
        ) : !venta ? (
          <Typography color="textSecondary">No se pudo cargar la venta.</Typography>
        ) : (
          <>
            {/* Info general */}
            <Box sx={{ mb: 3, p: 2, backgroundColor: "var(--bg-soft)", borderRadius: 2, border: "1px solid #e2e8f0" }}>
              {[
                { label: "Fecha",   value: formatFecha(venta.fecha) },
                { label: "Usuario", value: venta.usuario_email || venta.usuario_nombre || "N/A" },
                { label: "Kiosco",  value: venta.kiosco_nombre  || "N/A" },
              ].map(({ label, value }) => (
                <Box key={label} sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>{label}:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{value}</Typography>
                </Box>
              ))}
              {empleados.length > 0 && (
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid #e2e8f0" }}>
                  <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600, mb: 1 }}>Realizado por:</Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                    {empleados.map((emp, i) => (
                      <Chip key={i}
                        icon={<Person sx={{ fontSize: "0.9rem !important" }} />}
                        label={typeof emp === "string" ? emp : `${emp.nombre} ${emp.apellido}`}
                        size="small"
                        sx={{ backgroundColor: "rgba(102,126,234,0.1)", color: "var(--primary)", fontWeight: 700, fontSize: "0.78rem" }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

            {/* Productos */}
            <Typography variant="caption" sx={{ display: "block", mb: 1.5, color: "#64748b", fontWeight: 800, letterSpacing: "0.05em" }}>
              🛍️ PRODUCTOS
            </Typography>
            <Box sx={{ border: "1px solid #e2e8f0", borderRadius: 2, overflow: "hidden", mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "var(--bg-soft)" }}>
                    <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)" }}>Producto</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-secondary)" }}>Cant.</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: "var(--text-secondary)" }}>Precio unit.</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: "var(--text-secondary)" }}>Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalles.map((p, i) => {
                    const precio = Number(p.precio_unitario ?? p.precio ?? 0);
                    const nombre = p.producto_nombre ?? p.nombre ?? "—";
                    return (
                      <TableRow key={i}>
                        <TableCell sx={{ fontWeight: 600 }}>{nombre}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>{p.cantidad}</TableCell>
                        <TableCell align="right">${fmt(precio)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: "var(--primary)" }}>
                          ${fmt(p.cantidad * precio)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>

            {/* Pagos */}
            <Typography variant="caption" sx={{ display: "block", mb: 1.5, color: "#64748b", fontWeight: 800, letterSpacing: "0.05em" }}>
              💳 PAGOS
            </Typography>
            <Box sx={{ mb: 3 }}>
              {pagos.length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ pl: 1 }}>Sin información de pagos</Typography>
              ) : pagos.map((pago, i) => (
                <Box key={i} sx={{
                  display: "flex", justifyContent: "space-between", p: 1.5,
                  backgroundColor: "var(--bg-soft)", borderRadius: 2, border: "1px solid #e2e8f0", mb: 1,
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {pago.tipo === "EFECTIVO"
                      ? <AttachMoney sx={{ color: "#16a34a" }} />
                      : <CreditCard sx={{ color: "#3b82f6" }} />}
                    <Typography sx={{ fontWeight: 700 }}>{pago.tipo}</Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 900, fontSize: "1.05rem" }}>${fmt(pago.monto)}</Typography>
                </Box>
              ))}
            </Box>

            {/* Total */}
            <Box sx={{
              p: 2.5,
              background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
              borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <Typography variant="h6" sx={{ color: "white", fontWeight: 800 }}>TOTAL:</Typography>
              <Typography variant="h4" sx={{ color: "white", fontWeight: 900 }}>${fmt(venta.total)}</Typography>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, backgroundColor: "var(--bg-soft)", borderTop: "1px solid #e2e8f0", gap: 1 }}>
        <Button onClick={onClose} sx={{ fontWeight: 700, color: "#64748b" }}>Cerrar</Button>
        {venta && (
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => generarPDFVenta(venta, logoBase64)}
            sx={{
              background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
              "&:hover": { background: "linear-gradient(135deg, var(--primary-dark) 0%, #6b46c1 100%)" },
              fontWeight: 700,
            }}
          >
            Descargar PDF
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ── Tabla principal ───────────────────────────────────────────────
export default function VentasAdminTable() {
  const [kioscos, setKioscos] = useState([]);
  const [kioscoId, setKioscoId] = useState("");
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [detalleId, setDetalleId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [anulando, setAnulando] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const showSnackbar = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  useEffect(() => {
    fetch(`${API}/kioscos`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setKioscos(Array.isArray(d) ? d : []));
  }, []);

  const cargar = useCallback(() => {
    if (!kioscoId) { setVentas([]); return; }
    setLoading(true);
    fetch(`${API}/ventas/historial?kiosco_id=${kioscoId}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setVentas((Array.isArray(d) ? d : []).filter(v => v && v.id != null)))
      .finally(() => setLoading(false));
  }, [kioscoId]);

  useEffect(() => { cargar(); }, [cargar]);

  // Anular: no verifica campo "activo", va directo al endpoint
  const anular = async (id) => {
    if (!id) return;
    setAnulando(true);
    try {
      const res = await fetch(`${API}/ventas/${id}/anular`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Error ${res.status}`);
      }
      setConfirm(null);
      showSnackbar("Venta anulada correctamente");
      cargar();
    } catch (e) {
      showSnackbar(e.message || "Error al anular la venta", "error");
    } finally {
      setAnulando(false);
    }
  };

  const filtradas = useMemo(() => ventas.filter(v => {
    if (!v) return false;
    const okEstado =
      filtroEstado === "todos" ||
      (filtroEstado === "valida" ? !v.anulada : v.anulada);
    const q = busqueda.toLowerCase();
    const okBusqueda =
      !q ||
      v.ticket_numero?.toLowerCase().includes(q) ||
      v.kiosco_nombre?.toLowerCase().includes(q) ||
      String(v.id).includes(q);
    return okEstado && okBusqueda;
  }), [ventas, filtroEstado, busqueda]);

  const paginadas = useMemo(() => {
    const start = page * rowsPerPage;
    return filtradas.slice(start, start + rowsPerPage);
  }, [filtradas, page, rowsPerPage]);

  const handleBusqueda = (e) => { setBusqueda(e.target.value); setPage(0); };
  const handleFiltroEstado = (e) => { setFiltroEstado(e.target.value); setPage(0); };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: "white" }}>
          🧾 Historial de Ventas
        </Typography>
        <Tooltip title="Actualizar">
          <IconButton onClick={cargar} sx={{ backgroundColor: "white", "&:hover": { backgroundColor: "var(--bg-soft)" } }}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, boxShadow: "0 4px 16px rgba(102,126,234,0.1)", backgroundColor: "rgba(255,255,255,0.97)" }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Kiosco</InputLabel>
            <Select value={kioscoId} label="Kiosco"
              onChange={(e) => { setKioscoId(e.target.value); setPage(0); }}
              startAdornment={<InputAdornment position="start"><Store sx={{ color: "#64748b", fontSize: 18, ml: 0.5 }} /></InputAdornment>}
            >
              {kioscos.map(k => <MenuItem key={k.id} value={k.id}>{k.nombre}</MenuItem>)}
            </Select>
          </FormControl>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />

          <TextField size="small" placeholder="Buscar ticket, kiosco, ID..." value={busqueda} onChange={handleBusqueda}
            sx={{ flexGrow: 1, minWidth: 220 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ color: "#94a3b8", fontSize: 20 }} /></InputAdornment>,
              endAdornment: busqueda ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => { setBusqueda(""); setPage(0); }}><Clear sx={{ fontSize: 18 }} /></IconButton>
                </InputAdornment>
              ) : null,
            }}
          />

          <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FilterList sx={{ color: "#94a3b8", fontSize: 20 }} />
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Estado</InputLabel>
              <Select value={filtroEstado} label="Estado" onChange={handleFiltroEstado}>
                <MenuItem value="todos">Todos <Chip label={ventas.length} size="small" sx={{ ml: 1, height: 18, fontSize: "0.7rem", backgroundColor: "rgba(0,0,0,0.08)" }} /></MenuItem>
                <MenuItem value="valida">Válidas <Chip label={ventas.filter(v => !v.anulada).length} size="small" sx={{ ml: 1, height: 18, fontSize: "0.7rem", backgroundColor: "rgba(0,0,0,0.08)" }} /></MenuItem>
                <MenuItem value="anulada">Anuladas <Chip label={ventas.filter(v => v.anulada).length} size="small" sx={{ ml: 1, height: 18, fontSize: "0.7rem", backgroundColor: "rgba(0,0,0,0.08)" }} /></MenuItem>
              </Select>
            </FormControl>
          </Box>

          {(busqueda || filtroEstado !== "todos") && (
            <Typography variant="body2" color="textSecondary" sx={{ ml: "auto", whiteSpace: "nowrap" }}>
              {filtradas.length} resultado{filtradas.length !== 1 ? "s" : ""}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Tabla */}
      {!kioscoId ? (
        <Paper sx={{ borderRadius: 3, p: 6, textAlign: "center", backgroundColor: "rgba(255,255,255,0.95)" }}>
          <Typography variant="body1" color="textSecondary">Seleccioná un kiosco para ver las ventas</Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper} sx={{
            borderRadius: 3, boxShadow: "0 8px 32px rgba(102,126,234,0.15)",
            backgroundColor: "rgba(255,255,255,0.95)", maxHeight: 520, overflowX: "auto",
            "& .MuiTableCell-root": { whiteSpace: "nowrap", padding: "12px 16px" },
          }}>
            <Table stickyHeader sx={{ minWidth: 1100 }}>
              <TableHead>
                <TableRow>
                  {["ID", "Ticket", "Kiosco", "Fecha", "Realizado por", "Total", "Estado", "Acciones"].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <CircularProgress sx={{ color: "var(--primary)" }} />
                    </TableCell>
                  </TableRow>
                ) : paginadas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Typography variant="body1" color="textSecondary">
                        {busqueda ? "No se encontraron ventas con esa búsqueda" : "Sin ventas en esta categoría"}
                      </Typography>
                      {busqueda && <Button size="small" onClick={() => setBusqueda("")} sx={{ mt: 1 }}>Limpiar búsqueda</Button>}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginadas.map(v => {
                    const empleados = v.empleados ?? [];
                    return (
                      <TableRow key={v.id} hover sx={{
                        backgroundColor: v.anulada ? "#fef2f2" : "white",
                        "&:hover": { backgroundColor: v.anulada ? "var(--error-light)" : "var(--bg-soft)" },
                      }}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>#{v.id}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={v.ticket_numero} size="small"
                            sx={{ backgroundColor: "#f1f5f9", color: "#334155", fontWeight: 500, fontFamily: "monospace" }} />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box sx={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "var(--primary)15", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Store sx={{ color: "var(--primary)", fontSize: 16 }} />
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{v.kiosco_nombre}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">{formatFecha(v.fecha)}</Typography>
                        </TableCell>

                        {/* Realizado por */}
                        <TableCell>
                          {empleados.length === 0 ? (
                            <Typography variant="caption" sx={{ color: "#94a3b8" }}>—</Typography>
                          ) : (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                              {empleados.map((emp, i) => (
                                <Chip key={i}
                                  icon={<Person sx={{ fontSize: "0.8rem !important" }} />}
                                  label={typeof emp === "string" ? emp : `${emp.nombre} ${emp.apellido}`}
                                  size="small"
                                  sx={{ backgroundColor: "rgba(102,126,234,0.1)", color: "var(--primary)", fontWeight: 600, fontSize: "0.72rem", height: 22 }}
                                />
                              ))}
                            </Box>
                          )}
                        </TableCell>

                        <TableCell>
                          <Chip label={formatMonto(v.total)} size="small"
                            sx={{ backgroundColor: "#dbeafe", color: "#1e40af", fontWeight: 600 }} />
                        </TableCell>
                        <TableCell>
                          <EstadoChip anulada={v.anulada} />
                        </TableCell>

                        {/* Acciones — solo Ver y Anular (sin ticket) */}
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <Tooltip title="Ver detalle" arrow>
                              <IconButton size="small"
                                sx={{ backgroundColor: "#f3f4f6", "&:hover": { backgroundColor: "#e5e7eb", transform: "scale(1.1)" } }}
                                onClick={() => setDetalleId(v.id)}
                              >
                                <Visibility fontSize="small" sx={{ color: "#6366f1" }} />
                              </IconButton>
                            </Tooltip>
                            {!v.anulada && (
                              <Tooltip title="Anular venta" arrow>
                                <IconButton size="small"
                                  sx={{ backgroundColor: "var(--error-light)", "&:hover": { backgroundColor: "#fecaca", transform: "scale(1.1)" } }}
                                  onClick={() => setConfirm({ id: v.id, ticket: v.ticket_numero })}
                                >
                                  <Cancel fontSize="small" sx={{ color: "#ef4444" }} />
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

          <TablePagination component={Paper} count={filtradas.length} page={page}
            onPageChange={(_, newPage) => setPage(newPage)} rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 15, 25]} labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            sx={{ mt: 1, borderRadius: 2, boxShadow: "0 2px 8px rgba(102,126,234,0.08)", backgroundColor: "rgba(255,255,255,0.95)", "& .MuiTablePagination-toolbar": { px: 2 } }}
          />
        </>
      )}

      <DetalleModal ventaId={detalleId} open={!!detalleId} onClose={() => setDetalleId(null)} />

      {/* Confirmar anulación */}
      <Dialog open={!!confirm} onClose={() => !anulando && setConfirm(null)}>
        <DialogTitle sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", borderBottom: "1px solid #e2e8f0" }}>
          ¿Anular venta {confirm?.ticket}?
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Typography variant="body2" color="textSecondary">
            Esta acción no se puede deshacer. La venta quedará marcada como anulada.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: "var(--bg-soft)", borderTop: "1px solid #e2e8f0" }}>
          <Button onClick={() => setConfirm(null)} disabled={anulando}>Cancelar</Button>
          <Button color="error" variant="contained" disabled={!confirm?.id || anulando}
            startIcon={anulando ? <CircularProgress size={16} sx={{ color: "white" }} /> : <Cancel />}
            onClick={() => confirm?.id && anular(confirm.id)}
          >
            {anulando ? "Anulando..." : "Anular"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}