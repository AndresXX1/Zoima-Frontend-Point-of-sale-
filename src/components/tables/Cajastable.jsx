// components/tables/CajasTable.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Tooltip, TextField, MenuItem,
  Select, InputLabel, FormControl, InputAdornment, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider,
  TablePagination, ToggleButton, ToggleButtonGroup, RadioGroup,
  FormControlLabel, Radio, FormLabel, Checkbox,
} from "@mui/material";
import {
  Search, Refresh, Visibility, FilterList, Clear, Storefront, Timer,
  CheckCircle, Cancel, Receipt, AttachMoney, CreditCard, Person,
  Download, PictureAsPdf, SelectAll, Deselect,
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

function duracion(apertura, cierre) {
  if (!apertura || !cierre) return "—";
  const diff = (new Date(cierre) - new Date(apertura)) / 60000;
  if (diff < 60) return `${Math.round(diff)} min`;
  return `${Math.floor(diff / 60)}h ${Math.round(diff % 60)}m`;
}

function EstadoChip({ estado }) {
  const abierta = estado === "ABIERTA";
  return (
    <Chip label={estado} size="small" sx={{
      backgroundColor: abierta ? "#fef3c7" : "var(--success-light)",
      color: abierta ? "#92400e" : "#065f46",
      fontWeight: 600, fontSize: "0.75rem",
    }} />
  );
}

// ── Hook logo base64 ─────────────────────────────────────────────
const useImageToBase64 = (imagePath) => {
  const [base64, setBase64] = useState(null);
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      setBase64(canvas.toDataURL("image/png"));
    };
    img.onerror = () => console.error("Error cargando logo:", imagePath);
    img.src = imagePath;
  }, [imagePath]);
  return base64;
};

// ── Dialog detalle de una venta individual ───────────────────────
function DetalleVentaDialog({ open, onClose, ventaId }) {
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !ventaId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`${API}/ventas/${ventaId}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setVenta(d))
      .finally(() => setLoading(false));
  }, [open, ventaId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (!open) setVenta(null); }, [open]);

  const detalles = venta?.detalles ?? venta?.productos ?? [];
  const pagos    = venta?.pagos ?? [];

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
            <Box sx={{ mb: 3, p: 2, backgroundColor: "var(--bg-soft)", borderRadius: 2, border: "1px solid #e2e8f0" }}>
              {[
                { label: "Fecha",   value: formatFecha(venta.fecha) },
                { label: "Usuario", value: venta.usuario_email || venta.usuario_nombre || "N/A" },
                { label: "Kiosco",  value: venta.kiosco_nombre || "N/A" },
              ].map(({ label, value }) => (
                <Box key={label} sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>{label}:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{value}</Typography>
                </Box>
              ))}
              {(venta.empleados ?? []).length > 0 && (
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid #e2e8f0" }}>
                  <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600, mb: 1 }}>Realizado por:</Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                    {venta.empleados.map((emp, i) => (
                      <Chip key={i}
                        icon={<Person sx={{ fontSize: "0.9rem !important" }} />}
                        label={typeof emp === "string" ? emp : `${emp.nombre} ${emp.apellido}`}
                        size="small"
                        sx={{ backgroundColor: "rgba(102,126,234,0.1)", color: "var(--primary)", fontWeight: 700 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

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

            <Typography variant="caption" sx={{ display: "block", mb: 1.5, color: "#64748b", fontWeight: 800, letterSpacing: "0.05em" }}>
              💳 PAGOS
            </Typography>
            <Box sx={{ mb: 3 }}>
              {pagos.map((pago, i) => (
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

      <DialogActions sx={{ p: 2, borderTop: "1px solid #e2e8f0" }}>
        <Button onClick={onClose} sx={{ fontWeight: 700, color: "#64748b" }}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Modal detalle caja ───────────────────────────────────────────
function DetalleCajaModal({ caja, open, onClose }) {
  const [ventas, setVentas] = useState([]);
  const [loadingVentas, setLoadingVentas] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [detalleVentaId, setDetalleVentaId] = useState(null);
  const [detalleVentaOpen, setDetalleVentaOpen] = useState(false);

  // PDF states
  const [filtroPDF, setFiltroPDF] = useState("completo");
  const [ventasSeleccionadas, setVentasSeleccionadas] = useState([]);
  const logoBase64 = useImageToBase64("/logo.png");

  useEffect(() => {
    if (!open || !caja) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingVentas(true);
    setFiltroEstado("todas");
    setFiltroPDF("completo");
    setVentasSeleccionadas([]);
    fetch(`${API}/ventas/historial?kiosco_id=${caja.kiosco_id}&caja_id=${caja.id}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setVentas(Array.isArray(d) ? d.filter(v => v?.id != null) : []))
      .finally(() => setLoadingVentas(false));
  }, [open, caja]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!open) { setVentas([]); setDetalleVentaOpen(false); setVentasSeleccionadas([]); }
  }, [open]);

  useEffect(() => {
    if (ventasSeleccionadas.length > 0 && filtroPDF !== "manual") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFiltroPDF("manual");
    }
  }, [ventasSeleccionadas, filtroPDF]);

  if (!caja) return null;

  const diferencia = caja.monto_cierre != null
    ? Number(caja.monto_cierre) - Number(caja.monto_inicial || 0)
    : null;

  const ventasFiltradas = ventas.filter(v => {
    if (filtroEstado === "ok")       return !v.anulada;
    if (filtroEstado === "anuladas") return  v.anulada;
    return true;
  });

  const totalConfirmadas = ventasFiltradas
    .filter(v => !v.anulada)
    .reduce((s, v) => s + Number(v.total || 0), 0);

  // ── PDF helpers ──────────────────────────────────────────────
  const obtenerVentasParaPDF = () => {
    const ventasConfirmadas = ventas.filter(v => !v.anulada);
    if (filtroPDF === "manual") return ventas.filter(v => ventasSeleccionadas.includes(v.id));
    return ventasConfirmadas; // "completo" → sólo confirmadas
  };

  const handleToggleVenta = (id) => {
    setVentasSeleccionadas(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSeleccionarTodas = () =>
    setVentasSeleccionadas(ventas.map(v => v.id));

  const handleDeseleccionarTodas = () => setVentasSeleccionadas([]);

  const handleDescargarPDF = () => {
    const ventasPDF = obtenerVentasParaPDF();
    if (!caja || ventasPDF.length === 0) return;

    const doc = new jsPDF();
    const primaryColor = [102, 126, 234];
    const textColor    = [15, 23, 42];
    const grayColor    = [100, 116, 139];

    // Header background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 45, "F");

    // Logo
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", 14, 8, 30, 30);
      } catch {
        doc.setFillColor(255, 255, 255);
        doc.rect(14, 8, 30, 30, "F");
        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.text("ZOIMA", 29, 27, { align: "center" });
      }
    }

    // Título
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text("Resumen de Caja", 105, 18, { align: "center" });
    doc.setFontSize(12);
    doc.setFont(undefined, "normal");
    doc.text(`${caja.kiosco_nombre} — Caja #${caja.id}`, 105, 28, { align: "center" });
    doc.setFontSize(9);
    doc.text(`Usuario: ${caja.usuario_nombre ?? caja.usuario_email ?? "—"}`, 105, 36, { align: "center" });

    // Fecha generación
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    const fechaGen = new Date().toLocaleDateString("es-ES", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    doc.text(`Generado: ${fechaGen}`, 105, 50, { align: "center" });

    // ── Datos de la caja ──
    doc.setTextColor(...textColor);
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Información de la Caja", 14, 60);

    doc.setFont(undefined, "normal");
    doc.setFontSize(10);
    const col1 = 14, col2 = 110;
    doc.text(`Estado: ${caja.estado}`, col1, 68);
    doc.text(`Apertura: ${formatFecha(caja.fecha_apertura)}`, col2, 68);
    doc.text(`Monto inicial: ${formatMonto(caja.monto_inicial)}`, col1, 75);
    doc.text(`Cierre: ${caja.fecha_cierre ? formatFecha(caja.fecha_cierre) : "—"}`, col2, 75);
    doc.text(`Monto cierre: ${caja.monto_cierre != null ? formatMonto(caja.monto_cierre) : "—"}`, col1, 82);
    doc.text(`Duración: ${duracion(caja.fecha_apertura, caja.fecha_cierre)}`, col2, 82);

    if (diferencia !== null) {
      const difColor = diferencia >= 0 ? [5, 150, 105] : [153, 27, 27];
      doc.setTextColor(...difColor);
      doc.setFont(undefined, "bold");
      doc.text(
        `Diferencia: ${diferencia >= 0 ? "+" : ""}${formatMonto(diferencia)}`,
        col1, 89
      );
      doc.setTextColor(...textColor);
      doc.setFont(undefined, "normal");
    }

    // ── Resumen estadístico ──
    doc.setFont(undefined, "bold");
    doc.setFontSize(12);
    doc.text("Resumen Estadístico", 14, 100);
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);

    const confirmadas = ventas.filter(v => !v.anulada);
    const anuladas    = ventas.filter(v => v.anulada);
    const totalFact   = confirmadas.reduce((s, v) => s + Number(v.total || 0), 0);

    doc.text(`Total de ventas: ${ventas.length}`, col1, 108);
    doc.text(`Confirmadas: ${confirmadas.length}`, col2, 108);
    doc.text(`Total facturado: ${formatMonto(totalFact)}`, col1, 115);
    doc.text(`Anuladas: ${anuladas.length}`, col2, 115);

    // ── Tabla ventas ──
    const filtroPDFLabel = filtroPDF === "manual"
      ? `Selección manual (${ventasPDF.length})`
      : `Ventas confirmadas (${ventasPDF.length})`;

    doc.setFont(undefined, "bold");
    doc.setFontSize(12);
    doc.text(`Detalle de Ventas — ${filtroPDFLabel}`, 14, 126);

    const tableData = ventasPDF.map(v => [
      `#${v.ticket_numero}`,
      formatFecha(v.fecha),
      v.usuario_nombre || "—",
      (v.empleados ?? [])
        .map(e => typeof e === "string" ? e : `${e.nombre} ${e.apellido}`)
        .join(", ") || "—",
      formatMonto(v.total),
      v.anulada ? "Anulada" : "OK",
    ]);

    autoTable(doc, {
      startY: 132,
      head: [["Ticket", "Fecha", "Usuario", "Realizado por", "Total", "Estado"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: primaryColor, textColor: [255, 255, 255],
        fontSize: 9, fontStyle: "bold", halign: "center",
      },
      bodyStyles: { textColor, fontSize: 8, halign: "center" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 38 },
        2: { cellWidth: 35 },
        3: { cellWidth: 40 },
        4: { cellWidth: 32 },
        5: { cellWidth: 22 },
      },
      didDrawCell: (data) => {
        if (data.section === "body" && data.column.index === 5) {
          const val = data.cell.raw;
          if (val === "Anulada") {
            doc.setTextColor(153, 27, 27);
          } else {
            doc.setTextColor(5, 150, 105);
          }
        }
      },
    });

    // Footer paginado
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...grayColor);
      doc.text(`Página ${i} de ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: "center" });
      doc.text("Sistema de Gestión ZOIMA", 14, doc.internal.pageSize.height - 10);
    }

    const sufijo = filtroPDF === "manual" ? "Seleccion_Manual" : "Completo";
    doc.save(`Caja_${caja.id}_${caja.kiosco_nombre}_${sufijo}_${Date.now()}.pdf`);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {/* ── HEADER MEJORADO ── */}
        <DialogTitle sx={{ p: 0 }}>
          {/* Banda superior con gradiente */}
          <Box sx={{
            background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
            px: 3, pt: 2.5, pb: 2,
          }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: 2,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Storefront sx={{ color: "white", fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ color: "white", fontWeight: 800, lineHeight: 1.2 }}>
                    {caja.kiosco_nombre}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                    Caja #{caja.id} · {caja.usuario_nombre ?? caja.usuario_email ?? "—"}
                  </Typography>
                </Box>
              </Box>
              <EstadoChip estado={caja.estado} />
            </Box>

            {/* KPIs rápidos en la banda */}
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {[
                { label: "Ventas", value: caja.cantidad_ventas ?? 0, icon: "🧾" },
                { label: "Total facturado", value: formatMonto(caja.total_ventas), icon: "💰" },
                { label: "Duración", value: duracion(caja.fecha_apertura, caja.fecha_cierre), icon: "⏱️" },
                ...(diferencia !== null
                  ? [{ label: "Diferencia", value: `${diferencia >= 0 ? "+" : ""}${formatMonto(diferencia)}`, icon: diferencia >= 0 ? "📈" : "📉", isNeg: diferencia < 0 }]
                  : []),
              ].map(({ label, value, icon, isNeg }) => (
                <Box key={label} sx={{
                  flex: "1 1 auto",
                  backgroundColor: isNeg ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.12)",
                  borderRadius: 2, px: 1.5, py: 1,
                  border: "1px solid rgba(255,255,255,0.15)",
                }}>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.65)", display: "block", fontWeight: 600 }}>
                    {icon} {label}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "white", fontWeight: 800, fontSize: "0.88rem" }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Fila de fechas y descarga PDF */}
          <Box sx={{
            backgroundColor: "var(--bg-soft)", px: 3, py: 1.5,
            borderBottom: "1px solid #e2e8f0",
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            flexWrap: "wrap", gap: 2,
          }}>
            {/* Fechas */}
            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              {[
                ["📅 Apertura", formatFecha(caja.fecha_apertura)],
                ["🔒 Cierre",   caja.fecha_cierre ? formatFecha(caja.fecha_cierre) : "—"],
                ["💵 Inicial",  formatMonto(caja.monto_inicial)],
                ["💵 Cierre",   caja.monto_cierre != null ? formatMonto(caja.monto_cierre) : "—"],
              ].map(([k, v]) => (
                <Box key={k}>
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700, display: "block" }}>{k}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.82rem" }}>{v}</Typography>
                </Box>
              ))}
            </Box>

            {/* Sección PDF */}
            {ventas.length > 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "flex-end" }}>
                <FormControl component="fieldset">
                  <FormLabel sx={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--primary)", mb: 0.3, display: "flex", alignItems: "center", gap: 0.5 }}>
                    <PictureAsPdf sx={{ fontSize: 14 }} /> Período PDF:
                  </FormLabel>
                  <RadioGroup row value={filtroPDF}
                    onChange={(e) => {
                      setFiltroPDF(e.target.value);
                      if (e.target.value !== "manual") setVentasSeleccionadas([]);
                    }}
                    sx={{ "& .MuiFormControlLabel-label": { fontSize: "0.78rem" }, "& .MuiRadio-root": { py: 0.3 } }}
                  >
                    <FormControlLabel value="completo" control={<Radio size="small" />}
                      label={`Todas (${ventas.filter(v => !v.anulada).length})`} />
                    <FormControlLabel value="manual" control={<Radio size="small" />}
                      label={`Manual (${ventasSeleccionadas.length})`} />
                  </RadioGroup>
                </FormControl>

                {filtroPDF === "manual" && (
                  <Box sx={{ display: "flex", gap: 0.8 }}>
                    <Button size="small" startIcon={<SelectAll sx={{ fontSize: 14 }} />}
                      onClick={handleSeleccionarTodas} variant="outlined"
                      sx={{ fontSize: "0.72rem", textTransform: "none", py: 0.3 }}>
                      Todas
                    </Button>
                    <Button size="small" startIcon={<Deselect sx={{ fontSize: 14 }} />}
                      onClick={handleDeseleccionarTodas} variant="outlined"
                      sx={{ fontSize: "0.72rem", textTransform: "none", py: 0.3 }}>
                      Ninguna
                    </Button>
                  </Box>
                )}

                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Download />}
                  onClick={handleDescargarPDF}
                  disabled={obtenerVentasParaPDF().length === 0}
                  sx={{
                    background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
                    "&:hover": { background: "linear-gradient(135deg, var(--primary-dark) 0%, #6b46c1 100%)" },
                    textTransform: "none", fontWeight: 700, fontSize: "0.8rem",
                  }}
                >
                  Descargar PDF ({obtenerVentasParaPDF().length})
                </Button>
              </Box>
            )}
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: "20px !important" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

            {/* ── Lista de ventas ── */}
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  🧾 Ventas de esta caja
                </Typography>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Estado</InputLabel>
                  <Select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} label="Estado">
                    <MenuItem value="todas">📋 Todas ({ventas.length})</MenuItem>
                    <MenuItem value="ok">✅ Confirmadas ({ventas.filter(v => !v.anulada).length})</MenuItem>
                    <MenuItem value="anuladas">❌ Anuladas ({ventas.filter(v => v.anulada).length})</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {loadingVentas ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress sx={{ color: "var(--primary)" }} />
                </Box>
              ) : ventasFiltradas.length === 0 ? (
                <Box sx={{ py: 5, textAlign: "center", border: "2px dashed #e2e8f0", borderRadius: 2 }}>
                  <Typography color="textSecondary">No hay ventas para mostrar</Typography>
                </Box>
              ) : (
                <Box sx={{ border: "1px solid #e2e8f0", borderRadius: 2, overflow: "hidden" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "var(--bg-soft)" }}>
                        {filtroPDF === "manual" && (
                          <TableCell padding="checkbox" sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>
                            <Checkbox
                              indeterminate={ventasSeleccionadas.length > 0 && ventasSeleccionadas.length < ventas.length}
                              checked={ventasSeleccionadas.length === ventas.length && ventas.length > 0}
                              onChange={e => e.target.checked ? handleSeleccionarTodas() : handleDeseleccionarTodas()}
                            />
                          </TableCell>
                        )}
                        <TableCell sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>Ticket</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>Fecha</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>Usuario</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>Realizado por</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>Total</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>Estado</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: "var(--text-secondary)" }}>—</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ventasFiltradas.map(v => {
                        const empleados = v.empleados ?? [];
                        const isSelected = ventasSeleccionadas.includes(v.id);
                        return (
                          <TableRow key={v.id}
                            onClick={() => filtroPDF === "manual" && handleToggleVenta(v.id)}
                            sx={{
                              backgroundColor: v.anulada ? "#fef2f2" : isSelected ? "rgba(102,126,234,0.06)" : "white",
                              "&:hover": { backgroundColor: v.anulada ? "var(--error-light)" : "var(--bg-soft)" },
                              transition: "background 0.15s ease",
                              cursor: filtroPDF === "manual" ? "pointer" : "default",
                            }}>
                            {filtroPDF === "manual" && (
                              <TableCell padding="checkbox">
                                <Checkbox checked={isSelected} onChange={() => handleToggleVenta(v.id)} onClick={e => e.stopPropagation()} />
                              </TableCell>
                            )}
                            <TableCell sx={{ fontWeight: 800, color: "var(--primary)" }}>
                              #{v.ticket_numero}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="textSecondary">{formatFecha(v.fecha)}</Typography>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{v.usuario_nombre || "—"}</TableCell>
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
                            <TableCell align="right">
                              <Chip label={formatMonto(v.total)} size="small"
                                sx={{ backgroundColor: "#dbeafe", color: "#1e40af", fontWeight: 600 }} />
                            </TableCell>
                            <TableCell align="center">
                              {v.anulada ? (
                                <Chip icon={<Cancel sx={{ fontSize: "0.85rem !important" }} />} label="Anulada" size="small"
                                  sx={{ backgroundColor: "var(--error-light)", color: "#991b1b", fontWeight: 700 }} />
                              ) : (
                                <Chip icon={<CheckCircle sx={{ fontSize: "0.85rem !important" }} />} label="OK" size="small"
                                  sx={{ backgroundColor: "#dcfce7", color: "#166534", fontWeight: 700 }} />
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Ver detalle" arrow>
                                <IconButton size="small"
                                  onClick={(e) => { e.stopPropagation(); setDetalleVentaId(v.id); setDetalleVentaOpen(true); }}
                                  sx={{ backgroundColor: "#f3f4f6", "&:hover": { backgroundColor: "#e5e7eb", transform: "scale(1.1)" } }}
                                >
                                  <Visibility fontSize="small" sx={{ color: "#6366f1" }} />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {/* Fila totales */}
                      <TableRow sx={{ backgroundColor: "var(--bg-soft)", borderTop: "2px solid #e2e8f0" }}>
                        <TableCell colSpan={filtroPDF === "manual" ? 5 : 4} sx={{ fontWeight: 800, color: "#64748b" }}>
                          Total confirmadas ({ventasFiltradas.filter(v => !v.anulada).length} ventas)
                        </TableCell>
                        <TableCell align="right">
                          <Chip label={formatMonto(totalConfirmadas)}
                            sx={{ backgroundColor: "var(--success-light)", color: "#065f46", fontWeight: 800 }} />
                        </TableCell>
                        <TableCell colSpan={2} />
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, backgroundColor: "var(--bg-soft)", borderTop: "1px solid #e2e8f0" }}>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <DetalleVentaDialog
        open={detalleVentaOpen}
        onClose={() => setDetalleVentaOpen(false)}
        ventaId={detalleVentaId}
      />
    </>
  );
}

// ── Tabla principal ──────────────────────────────────────────────
export default function CajasTable() {
  const [cajas, setCajas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [detalle, setDetalle] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const cargar = useCallback(() => {
    setLoading(true);
    fetch(`${API}/caja`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setCajas(Array.isArray(d) ? d : (d?.data ?? [])))
      .finally(() => setLoading(false));
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargar(); }, [cargar]);

  const filtradas = useMemo(() => cajas.filter(c => {
    const okEstado = filtroEstado === "todos" || c.estado === filtroEstado;
    const q = busqueda.toLowerCase();
    const okBusqueda = !q ||
      c.kiosco_nombre?.toLowerCase().includes(q) ||
      c.usuario_nombre?.toLowerCase().includes(q) ||
      String(c.id).includes(q);
    return okEstado && okBusqueda;
  }), [cajas, filtroEstado, busqueda]);

  const paginadas = useMemo(() =>
    filtradas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtradas, page, rowsPerPage]
  );

  const totalVentas = useMemo(() =>
    filtradas.filter(c => c.estado === "CERRADA").reduce((s, c) => s + Number(c.total_ventas || 0), 0),
    [filtradas]
  );

  const handleFiltroEstado = (_, v) => { if (v !== null) { setFiltroEstado(v); setPage(0); } };
  const handleBusqueda = (e) => { setBusqueda(e.target.value); setPage(0); };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: "white" }}>🏧 Historial de Cajas</Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", mt: 0.5 }}>
            {filtradas.length} cajas · Total facturado:{" "}
            <strong style={{ color: "#34d399" }}>{formatMonto(totalVentas)}</strong>
          </Typography>
        </Box>
        <Tooltip title="Actualizar">
          <IconButton onClick={cargar} sx={{ backgroundColor: "white", "&:hover": { backgroundColor: "var(--bg-soft)" } }}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, boxShadow: "0 4px 16px rgba(102,126,234,0.1)", backgroundColor: "rgba(255,255,255,0.97)" }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField size="small" placeholder="Buscar kiosco, usuario, ID..." value={busqueda} onChange={handleBusqueda}
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
            <ToggleButtonGroup value={filtroEstado} exclusive onChange={handleFiltroEstado} size="small"
              sx={{ "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 500, fontSize: "0.8rem", px: 1.5, py: 0.5, borderColor: "#e2e8f0", color: "#64748b", "&.Mui-selected": { backgroundColor: "var(--primary)", color: "white", "&:hover": { backgroundColor: "var(--primary-dark)" } } } }}
            >
              <ToggleButton value="todos">Todos <Chip label={cajas.length} size="small" sx={{ ml: 0.5, height: 18, fontSize: "0.7rem", backgroundColor: "rgba(0,0,0,0.08)" }} /></ToggleButton>
              <ToggleButton value="ABIERTA">Abiertas <Chip label={cajas.filter(c => c.estado === "ABIERTA").length} size="small" sx={{ ml: 0.5, height: 18, fontSize: "0.7rem", backgroundColor: "rgba(0,0,0,0.08)" }} /></ToggleButton>
              <ToggleButton value="CERRADA">Cerradas <Chip label={cajas.filter(c => c.estado === "CERRADA").length} size="small" sx={{ ml: 0.5, height: 18, fontSize: "0.7rem", backgroundColor: "rgba(0,0,0,0.08)" }} /></ToggleButton>
            </ToggleButtonGroup>
          </Box>
          {(busqueda || filtroEstado !== "todos") && (
            <Typography variant="body2" color="textSecondary" sx={{ ml: "auto", whiteSpace: "nowrap" }}>
              {filtradas.length} resultado{filtradas.length !== 1 ? "s" : ""}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Tabla */}
      <TableContainer component={Paper} sx={{
        borderRadius: 3, boxShadow: "0 8px 32px rgba(102,126,234,0.15)",
        backgroundColor: "rgba(255,255,255,0.95)", maxHeight: 520, overflowX: "auto",
        "& .MuiTableCell-root": { whiteSpace: "nowrap", padding: "12px 16px" },
      }}>
        <Table stickyHeader sx={{ minWidth: 1000 }}>
          <TableHead>
            <TableRow>
              {["ID", "Kiosco", "Usuario", "Apertura", "Cierre", "Duración", "Ventas", "Total", "Estado", "Acciones"].map(h => (
                <TableCell key={h} sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={10} align="center" sx={{ py: 6 }}><CircularProgress sx={{ color: "var(--primary)" }} /></TableCell></TableRow>
            ) : paginadas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="textSecondary">
                    {busqueda ? "No se encontraron cajas con esa búsqueda" : "Sin cajas encontradas"}
                  </Typography>
                  {busqueda && <Button size="small" onClick={() => setBusqueda("")} sx={{ mt: 1 }}>Limpiar búsqueda</Button>}
                </TableCell>
              </TableRow>
            ) : paginadas.map(c => (
              <TableRow key={c.id} hover>
                <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>#{c.id}</Typography></TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "var(--primary)15", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Storefront sx={{ color: "var(--primary)", fontSize: 16 }} />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.kiosco_nombre ?? "—"}</Typography>
                  </Box>
                </TableCell>
                <TableCell><Typography variant="body2">{c.usuario_nombre ?? c.usuario_email ?? "—"}</Typography></TableCell>
                <TableCell><Typography variant="body2" color="textSecondary">{formatFecha(c.fecha_apertura)}</Typography></TableCell>
                <TableCell><Typography variant="body2" color="textSecondary">{formatFecha(c.fecha_cierre)}</Typography></TableCell>
                <TableCell>
                  <Chip icon={<Timer sx={{ fontSize: 14 }} />} label={duracion(c.fecha_apertura, c.fecha_cierre)} size="small"
                    sx={{ backgroundColor: "#f1f5f9", color: "#334155", fontWeight: 500 }} />
                </TableCell>
                <TableCell>
                  <Chip label={c.cantidad_ventas ?? 0} size="small"
                    sx={{ backgroundColor: "#ede9fe", color: "#5b21b6", fontWeight: 600 }} />
                </TableCell>
                <TableCell>
                  <Chip label={formatMonto(c.total_ventas)} size="small"
                    sx={{ backgroundColor: "var(--success-light)", color: "#065f46", fontWeight: 600 }} />
                </TableCell>
                <TableCell><EstadoChip estado={c.estado} /></TableCell>
                <TableCell>
                  <Tooltip title="Ver detalle" arrow>
                    <IconButton size="small" onClick={() => setDetalle(c)}
                      sx={{ backgroundColor: "#f3f4f6", "&:hover": { backgroundColor: "#e5e7eb", transform: "scale(1.1)" } }}>
                      <Visibility fontSize="small" sx={{ color: "#6366f1" }} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination component={Paper} count={filtradas.length} page={page}
        onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
        onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[10, 15, 25]} labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        sx={{ mt: 1, borderRadius: 2, boxShadow: "0 2px 8px rgba(102,126,234,0.08)", backgroundColor: "rgba(255,255,255,0.95)", "& .MuiTablePagination-toolbar": { px: 2 } }}
      />

      <DetalleCajaModal caja={detalle} open={!!detalle} onClose={() => setDetalle(null)} />
    </Box>
  );
}