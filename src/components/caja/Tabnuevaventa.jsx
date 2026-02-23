/* eslint-disable no-unused-vars */
import {
  Box, Paper, Typography, TextField, Button, Table, TableHead,
  TableRow, TableCell, TableBody, IconButton, CircularProgress,
  InputAdornment, Select, MenuItem, FormControl, InputLabel,
  Checkbox, ListItemText, Chip, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, LinearProgress,
} from "@mui/material";
import {
  Add, Delete, PointOfSale, Clear, ShoppingCart,
  QrCode, Receipt, Remove, AddShoppingCart, CameraAlt,
  AttachMoney, CreditCard, Refresh, Person, Contactless,
  CheckCircle, Cancel, HourglassEmpty, ErrorOutline,
} from "@mui/icons-material";
import { useRef, useState, useEffect, useCallback } from "react";
import CatalogoDialog from "./Catalogodialog";
import TicketDialog from "./Ticketdialog";

const fmt = (n) =>
  Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0 });

const API = "http://localhost:3000/api";

// ─── Estado visual del posnet ─────────────────────────────────────────────────
const EstadoPosnet = ({ estado, onCancelar, procesando }) => {
  const config = {
    PENDIENTE:  { icon: <HourglassEmpty sx={{ fontSize: 48, color: "#f59e0b" }} />,  label: "Esperando al cliente...", color: "#fef3c7", border: "#fcd34d", text: "#92400e" },
    PROCESANDO: { icon: <CircularProgress size={48} sx={{ color: "#3b82f6" }} />,    label: "Procesando pago...",      color: "#eff6ff", border: "#93c5fd", text: "#1e3a5f" },
    APROBADO:   { icon: <CheckCircle sx={{ fontSize: 48, color: "#16a34a" }} />,     label: "¡Pago aprobado!",        color: "#dcfce7", border: "#86efac", text: "#166534" },
    RECHAZADO:  { icon: <Cancel sx={{ fontSize: 48, color: "#dc2626" }} />,          label: "Pago rechazado",         color: "#fee2e2", border: "#fca5a5", text: "#991b1b" },
    CANCELADO:  { icon: <Cancel sx={{ fontSize: 48, color: "#64748b" }} />,          label: "Cobro cancelado",        color: "#f1f5f9", border: "#cbd5e1", text: "#475569" },
    ERROR:      { icon: <ErrorOutline sx={{ fontSize: 48, color: "#dc2626" }} />,    label: "Error en el pago",       color: "#fee2e2", border: "#fca5a5", text: "#991b1b" },
  };
  const c = config[estado] || config.PENDIENTE;
  return (
    <Box sx={{ textAlign: "center", py: 4, px: 3, backgroundColor: c.color, border: `2px solid ${c.border}`, borderRadius: 3 }}>
      {c.icon}
      <Typography variant="h6" sx={{ mt: 2, fontWeight: 800, color: c.text }}>{c.label}</Typography>
      {(estado === "PENDIENTE" || estado === "PROCESANDO") && (
        <>
          <LinearProgress sx={{ mt: 2, borderRadius: 2, backgroundColor: c.border }} />
          <Typography variant="caption" sx={{ mt: 1, display: "block", color: c.text }}>
            El posnet está esperando el pago del cliente
          </Typography>
          {estado === "PENDIENTE" && (
            <Button variant="outlined" size="small" onClick={onCancelar} disabled={procesando}
              sx={{ mt: 2, borderColor: "#dc2626", color: "#dc2626", fontWeight: 700 }}>
              Cancelar cobro
            </Button>
          )}
        </>
      )}
    </Box>
  );
};

// ─── TAB NUEVA VENTA ──────────────────────────────────────────────────────────
const TabNuevaVenta = ({
  items, cambiarCantidad, setCantidadDirecta, quitarItem, onVentaCompletada,
  codigoBarra, setCodigoBarra, agregarPorCodigo,
  cameraOpen, setCameraOpen, handleOpenCamera, handleCameraDetected,
  dialogOpen, setDialogOpen, productos, loadingProductos,
  busqueda, setBusqueda, seleccionados, toggleSeleccion, setSelCantidad,
  confirmarSeleccion, cancelarDialog, prodPage, setProdPage,
  prodRowsPerPage, setProdRowsPerPage,
  pagoEfectivo, setPagoEfectivo, pagoMP, setPagoMP,
  pagoRapido, confirmarVenta, limpiarVenta, procesandoVenta,
  lastTicket, setLastTicket,
  fichadosAhora, loadingFichados, empleadosSeleccionados,
  setEmpleadosSeleccionados, onRefreshFichados,
}) => {
  const barcodeRef = useRef(null);
  const [selectOpen, setSelectOpen] = useState(false);

  // ── Método de pago ──
  const [metodoPago, setMetodoPago] = useState("efectivo");

  // ── Estado MP Point ──
  const [estadoPosnet, setEstadoPosnet] = useState(null);
  const [posnetDialogOpen, setPosnetDialogOpen] = useState(false);
  const [enviandoPosnet, setEnviandoPosnet] = useState(false);
  const [ventaPosnetId, setVentaPosnetId] = useState(null);
  const pollingRef = useRef(null);

  // ── Ticket Dialog ──
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [ticketData, setTicketData] = useState(null);

  const total = items.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  const totalPagado = (Number(pagoEfectivo) || 0) + (Number(pagoMP) || 0);
  const vuelto = totalPagado - total;
  const sinEmpleado = empleadosSeleccionados.length === 0;

  // Limpiar campos de pago al cambiar método
  useEffect(() => {
    setPagoEfectivo("");
    setPagoMP("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metodoPago]);

  // ── Polling ──
  const detenerPolling = useCallback(() => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  }, []);

  useEffect(() => () => detenerPolling(), [detenerPolling]);

  // ── Abrir ticket dialog con datos de la venta ──────────────────────────────
  const abrirTicket = (data) => {
    setTicketData(data);
    setTicketDialogOpen(true);
  };

  // ── Cobrar con posnet ──────────────────────────────────────────────────────
  const cobrarConPosnet = async () => {
    setEnviandoPosnet(true);
    setEstadoPosnet("PENDIENTE");
    setPosnetDialogOpen(true);

    // Snapshot de los items antes de limpiar
    const itemsSnapshot = items.map((p) => ({
      producto_id: p.id,
      nombre: p.nombre,
      cantidad: p.cantidad,
      precio: p.precio,
    }));
    const totalSnapshot = total;

    try {
      await new Promise(r => setTimeout(r, 1500));
      setEstadoPosnet("PROCESANDO");
      await new Promise(r => setTimeout(r, 1000));

      const res = await fetch(`${API}/mp/simular-pago`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productos: itemsSnapshot,
          monto: totalSnapshot,
          empleado_ids: empleadosSeleccionados,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setEstadoPosnet("ERROR"); throw new Error(data.message); }

      setEstadoPosnet("APROBADO");
      setVentaPosnetId(data.ventaId);

      // Armar ticket con los datos disponibles
      const empleadosInfo = fichadosAhora.filter(e => empleadosSeleccionados.includes(e.empleado_id));
      abrirTicket({
        ticket_numero: data.ventaId,
        total: totalSnapshot,
        vuelto: 0,
        fecha: new Date().toISOString(),
        kiosco_nombre: data.kiosco_nombre ?? null,
        detalles: itemsSnapshot.map(p => ({
          nombre: p.nombre,
          cantidad: p.cantidad,
          precio: p.precio,
        })),
        pagos: [{ tipo: "POSNET", monto: totalSnapshot }],
        empleados: empleadosInfo,
      });

      limpiarVenta();
      onVentaCompletada?.();
    } catch (e) {
      setEstadoPosnet("ERROR");
      console.error("Error posnet:", e.message);
    } finally {
      setEnviandoPosnet(false);
    }
  };

  // ── Confirmar venta efectivo/MP — wrappea la función del padre ─────────────
  const handleConfirmarVenta = async () => {
    // Snapshot antes de que el padre limpie el carrito
    const itemsSnapshot = items.map(p => ({
      nombre: p.nombre,
      cantidad: p.cantidad,
      precio: p.precio,
    }));
    const totalSnapshot = total;
    const pagosSnapshot = [];
    if (Number(pagoEfectivo) > 0) pagosSnapshot.push({ tipo: "EFECTIVO", monto: Number(pagoEfectivo) });
    if (Number(pagoMP) > 0)       pagosSnapshot.push({ tipo: "MP",       monto: Number(pagoMP) });
    const vueltoSnapshot = totalPagado - totalSnapshot > 0 ? totalPagado - totalSnapshot : 0;
    const empleadosInfo = fichadosAhora.filter(e => empleadosSeleccionados.includes(e.empleado_id));

    // Ejecutar la lógica original (que limpia el carrito y devuelve el ticket en lastTicket)
    // Necesitamos el ticket_numero — lo obtenemos escuchando el cambio de lastTicket
    // Para eso llamamos a confirmarVenta y luego abrimos el dialog con lo que tenemos.
    // El ticket_numero vendrá de lastTicket (que se setea en el padre), lo capturamos
    // con un pequeño hack: seteamos un callback temporal.
    await confirmarVenta();

    // Después de confirmarVenta el padre actualiza lastTicket — lo leemos en el efecto abajo
    // Guardamos snapshot para el efecto
    pendingTicketRef.current = {
      total: totalSnapshot,
      vuelto: vueltoSnapshot,
      detalles: itemsSnapshot,
      pagos: pagosSnapshot,
      empleados: empleadosInfo,
    };
  };

  // Ref para pasar datos del snapshot al efecto de lastTicket
  const pendingTicketRef = useRef(null);

  // Cuando el padre actualiza lastTicket (después de venta exitosa), abrimos el dialog
  useEffect(() => {
    if (lastTicket && pendingTicketRef.current) {
      const snap = pendingTicketRef.current;
      pendingTicketRef.current = null;
      abrirTicket({
        ticket_numero: lastTicket.numero,
        total: snap.total,
        vuelto: snap.vuelto,
        fecha: new Date().toISOString(),
        detalles: snap.detalles,
        pagos: snap.pagos,
        empleados: snap.empleados,
      });
    }
   
  }, [lastTicket]);

  // ── Botón cobrar unificado ─────────────────────────────────────────────────
  const handleCobrar = () => {
    if (metodoPago === "posnet") {
      cobrarConPosnet();
    } else {
      handleConfirmarVenta();
    }
  };

  const labelBoton = () => {
    if (procesandoVenta || enviandoPosnet) return "Procesando...";
    if (metodoPago === "efectivo") return `Cobrar efectivo · $${fmt(total)}`;
    if (metodoPago === "mp")       return `Cobrar con MP · $${fmt(total)}`;
    if (metodoPago === "posnet")   return `Cobrar con Posnet · $${fmt(total)}`;
  };

  const colorBoton = () => {
    if (metodoPago === "posnet") return "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)";
    if (metodoPago === "mp")     return "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";
    return "linear-gradient(135deg, #16a34a 0%, #15803d 100%)";
  };

  const cerrarDialogPosnet = () => {
    if (estadoPosnet === "PENDIENTE" || estadoPosnet === "PROCESANDO") return;
    setPosnetDialogOpen(false);
    setEstadoPosnet(null);
    setVentaPosnetId(null);
    detenerPolling();
  };

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 400px" }, gap: 3 }}>

      {/* ── IZQUIERDA: PRODUCTOS ── */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1 }}>
          <ShoppingCart sx={{ color: "var(--primary)" }} /> Productos
        </Typography>

        {/* Buscador y botones */}
        <Box sx={{ display: "flex", gap: 1.5, mb: 3, flexWrap: "wrap" }}>
          <TextField
            inputRef={barcodeRef}
            label="Código de barras"
            value={codigoBarra}
            onChange={(e) => setCodigoBarra(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && agregarPorCodigo()}
            placeholder="Escaneá o escribí..."
            fullWidth variant="outlined"
            sx={{ flex: 1, minWidth: 200, "& .MuiOutlinedInput-root": { backgroundColor: "white", fontWeight: 600 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><QrCode sx={{ color: "var(--primary)" }} /></InputAdornment> }}
          />
          <Button variant="outlined" onClick={handleOpenCamera} startIcon={<CameraAlt />}
            sx={{ fontWeight: 700, borderColor: "var(--primary)", color: "var(--primary)", "&:hover": { backgroundColor: "rgba(102,126,234,0.1)" } }}>
            Cámara
          </Button>
          <Button variant="outlined" onClick={() => setDialogOpen(true)} startIcon={<AddShoppingCart />}
            sx={{ fontWeight: 700, borderColor: "var(--primary)", color: "var(--primary)", "&:hover": { backgroundColor: "rgba(102,126,234,0.1)" } }}>
            Catálogo
          </Button>
        </Box>

        {/* Carrito */}
        {items.length === 0 ? (
          <Box sx={{ py: 8, textAlign: "center", backgroundColor: "var(--bg-soft)", borderRadius: 2, border: "2px dashed #cbd5e1" }}>
            <ShoppingCart sx={{ fontSize: 64, color: "#cbd5e1", mb: 2 }} />
            <Typography sx={{ color: "#94a3b8", fontWeight: 600 }}>El carrito está vacío</Typography>
            <Typography variant="caption" sx={{ color: "#cbd5e1" }}>Escaneá o buscá productos para comenzar</Typography>
          </Box>
        ) : (
          <Box sx={{ border: "1px solid #e2e8f0", borderRadius: 2, overflow: "hidden", backgroundColor: "white" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "var(--bg-soft)" }}>
                  <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)" }}>Producto</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-secondary)" }}>Cant.</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: "var(--text-secondary)" }}>Precio</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: "var(--text-secondary)" }}>Subtotal</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-secondary)" }}>-</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id} sx={{ "&:hover": { backgroundColor: "var(--bg-soft)" }, transition: "all 0.2s ease" }}>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {p.nombre}
                      {p.codigo_barra && <Typography variant="caption" sx={{ display: "block", color: "#94a3b8" }}>{p.codigo_barra}</Typography>}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                        <IconButton size="small" onClick={() => cambiarCantidad(p.id, -1)}
                          sx={{ backgroundColor: "var(--error-light)", color: "var(--error)", "&:hover": { backgroundColor: "#fecaca" } }}>
                          <Remove fontSize="small" />
                        </IconButton>
                        <TextField value={p.cantidad} onChange={(e) => setCantidadDirecta(p.id, e.target.value)}
                          type="number" size="small" sx={{ width: 60, "& input": { textAlign: "center", fontWeight: 800 } }} />
                        <IconButton size="small" onClick={() => cambiarCantidad(p.id, 1)}
                          sx={{ backgroundColor: "#dcfce7", color: "#16a34a", "&:hover": { backgroundColor: "#bbf7d0" } }}>
                          <Add fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>${fmt(p.precio)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: "var(--primary)", fontSize: "1.05rem" }}>${fmt(p.precio * p.cantidad)}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => quitarItem(p.id)}
                        sx={{ color: "var(--error)", "&:hover": { backgroundColor: "var(--error-light)" } }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      {/* ── DERECHA: RESUMEN Y PAGO ── */}
      <Box>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "2px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", position: "sticky", top: 20 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 1 }}>
            <Receipt sx={{ color: "var(--primary)" }} /> Resumen
          </Typography>

          {/* Total */}
          <Box sx={{ mb: 3, p: 2.5, background: "linear-gradient(135deg, var(--bg-soft) 0%, #f1f5f9 100%)", borderRadius: 2, border: "1px solid #e2e8f0" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
              <Typography sx={{ color: "#64748b", fontWeight: 600 }}>Items:</Typography>
              <Typography sx={{ color: "var(--text-primary)", fontWeight: 800 }}>{items.reduce((acc, p) => acc + p.cantidad, 0)}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>TOTAL:</Typography>
              <Typography variant="h4" sx={{ color: "var(--primary)", fontWeight: 900 }}>${fmt(total)}</Typography>
            </Box>
          </Box>

          {/* ── SELECTOR DE MÉTODO DE PAGO ── */}
          <Typography variant="caption" sx={{ display: "block", mb: 1.5, color: "#64748b", fontWeight: 700, letterSpacing: "0.05em" }}>
            💳 MÉTODO DE PAGO
          </Typography>

          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            {[
              { key: "efectivo", label: "Efectivo", icon: <AttachMoney />, color: "#16a34a", shadow: "rgba(22,163,74,0.3)" },
              { key: "posnet",   label: "Posnet",   icon: <Contactless />, color: "#7c3aed", shadow: "rgba(124,58,237,0.3)" },
            ].map((m) => (
              <Button key={m.key} fullWidth
                variant={metodoPago === m.key ? "contained" : "outlined"}
                onClick={() => setMetodoPago(m.key)}
                startIcon={m.icon}
                sx={{
                  py: 1.2, fontWeight: 700, fontSize: "0.72rem", minWidth: 0,
                  ...(metodoPago === m.key
                    ? { backgroundColor: m.color, color: "white", boxShadow: `0 4px 12px ${m.shadow}`, borderColor: m.color,
                        "&:hover": { backgroundColor: m.color, filter: "brightness(0.9)" } }
                    : { borderColor: m.color, color: m.color, "&:hover": { backgroundColor: `${m.color}10`, borderColor: m.color } })
                }}
              >
                {m.label}
              </Button>
            ))}
          </Box>

          {/* Campo efectivo */}
          {metodoPago === "efectivo" && (
            <TextField label="Monto en efectivo" type="number" value={pagoEfectivo}
              onChange={(e) => setPagoEfectivo(e.target.value)} fullWidth
              sx={{ mb: 1.5, "& .MuiOutlinedInput-root": { backgroundColor: "white", fontWeight: 700 } }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><AttachMoney sx={{ color: "#16a34a" }} /></InputAdornment>,
                endAdornment: <InputAdornment position="end"><Button size="small" onClick={() => pagoRapido("efectivo")} sx={{ fontWeight: 700, fontSize: "0.7rem" }}>Exacto</Button></InputAdornment>
              }}
            />
          )}

          {/* Info posnet */}
          {metodoPago === "posnet" && (
            <Box sx={{ mb: 1.5, p: 1.5, borderRadius: 2, backgroundColor: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", textAlign: "center" }}>
              <Contactless sx={{ color: "#7c3aed", fontSize: "1.8rem" }} />
              <Typography variant="caption" sx={{ display: "block", color: "#7c3aed", fontWeight: 600 }}>
                Se enviará el cobro al posnet físico
              </Typography>
            </Box>
          )}

          {/* Vuelto / Falta */}
          {metodoPago === "efectivo" && totalPagado > 0 && (
            <Box sx={{ mb: 2, p: 2, borderRadius: 2, backgroundColor: vuelto >= 0 ? "#dcfce7" : "var(--error-light)", border: `2px solid ${vuelto >= 0 ? "#86efac" : "#fca5a5"}` }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: vuelto >= 0 ? "#166534" : "#991b1b" }}>
                  {vuelto >= 0 ? "Vuelto:" : "Falta:"}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 900, color: vuelto >= 0 ? "#166534" : "#991b1b" }}>
                  ${fmt(Math.abs(vuelto))}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Empleados en turno */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, letterSpacing: "0.05em" }}>👤 EMPLEADOS EN TURNO</Typography>
              <Tooltip title="Actualizar lista">
                <IconButton size="small" onClick={onRefreshFichados} disabled={loadingFichados} sx={{ color: "#64748b", p: 0.3 }}>
                  {loadingFichados ? <CircularProgress size={14} /> : <Refresh sx={{ fontSize: "1rem" }} />}
                </IconButton>
              </Tooltip>
            </Box>
            {fichadosAhora.length === 0 ? (
              <Box sx={{ p: 1.5, borderRadius: 2, border: "1px dashed #fca5a5", backgroundColor: "#fef2f2", textAlign: "center" }}>
                <Person sx={{ fontSize: "1.2rem", color: "#fca5a5", mb: 0.3 }} />
                <Typography variant="caption" sx={{ color: "#991b1b", display: "block", fontWeight: 600 }}>
                  No hay empleados fichados. Fichá un empleado para vender.
                </Typography>
              </Box>
            ) : (
              <FormControl fullWidth size="small">
                <InputLabel>¿Quién está vendiendo?</InputLabel>
                <Select multiple value={empleadosSeleccionados} open={selectOpen}
                  onOpen={() => setSelectOpen(true)} onClose={() => setSelectOpen(false)}
                  onChange={(e) => setEmpleadosSeleccionados(e.target.value)}
                  label="¿Quién está vendiendo?"
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((id) => {
                        const emp = fichadosAhora.find(e => e.empleado_id === id);
                        return emp ? <Chip key={id} label={`${emp.nombre} ${emp.apellido}`} size="small"
                          sx={{ backgroundColor: "rgba(102,126,234,0.12)", color: "var(--primary)", fontWeight: 600, fontSize: "0.72rem" }} /> : null;
                      })}
                    </Box>
                  )}
                  sx={{ backgroundColor: "white", fontWeight: 600 }}
                >
                  {fichadosAhora.map((emp) => (
                    <MenuItem key={emp.empleado_id} value={emp.empleado_id}>
                      <Checkbox checked={empleadosSeleccionados.includes(emp.empleado_id)} size="small"
                        sx={{ color: "var(--primary)", "&.Mui-checked": { color: "var(--primary)" } }} />
                      <ListItemText primary={`${emp.nombre} ${emp.apellido}`} secondary={emp.rol_nombre}
                        primaryTypographyProps={{ fontWeight: 600, fontSize: "0.9rem" }}
                        secondaryTypographyProps={{ fontSize: "0.75rem" }} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>

          {sinEmpleado && fichadosAhora.length > 0 && (
            <Box sx={{ mb: 1.5, px: 1.5, py: 1, borderRadius: 1.5, backgroundColor: "#fffbeb", border: "1px solid #fcd34d", display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="caption" sx={{ color: "#92400e", fontWeight: 600 }}>⚠️ Seleccioná quién está realizando la venta</Typography>
            </Box>
          )}

          {/* ── BOTONES ── */}
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button variant="outlined" onClick={limpiarVenta} startIcon={<Clear />}
              sx={{ py: 1.8, fontWeight: 800, borderColor: "#cbd5e1", color: "#64748b", minWidth: 90,
                "&:hover": { backgroundColor: "var(--bg-soft)", borderColor: "#94a3b8" } }}>
              Limpiar
            </Button>
            <Tooltip title={sinEmpleado ? "Seleccioná al menos un empleado en turno" : ""} arrow placement="top">
              <span style={{ flex: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleCobrar}
                  disabled={procesandoVenta || enviandoPosnet || items.length === 0 || sinEmpleado}
                  fullWidth
                  startIcon={(procesandoVenta || enviandoPosnet) ? <CircularProgress size={20} color="inherit" /> : <PointOfSale />}
                  sx={{
                    py: 1.8, fontWeight: 800,
                    background: colorBoton(),
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    "&:hover": { filter: "brightness(0.92)", transform: "translateY(-2px)", boxShadow: "0 6px 20px rgba(0,0,0,0.2)" },
                    transition: "all 0.3s ease",
                    "&:disabled": { background: "#e2e8f0", color: "#94a3b8", boxShadow: "none" }
                  }}
                >
                  {labelBoton()}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Paper>
      </Box>

      {/* ── DIALOG CATÁLOGO ── */}
      <CatalogoDialog
        open={dialogOpen} onClose={cancelarDialog}
        productos={productos} loadingProductos={loadingProductos}
        busqueda={busqueda} setBusqueda={setBusqueda}
        seleccionados={seleccionados} toggleSeleccion={toggleSeleccion}
        setSelCantidad={setSelCantidad} confirmarSeleccion={confirmarSeleccion}
        prodPage={prodPage} setProdPage={setProdPage}
        prodRowsPerPage={prodRowsPerPage} setProdRowsPerPage={setProdRowsPerPage}
      />

      {/* ── DIALOG POSNET ── */}
      <Dialog open={posnetDialogOpen} onClose={cerrarDialogPosnet} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid #e2e8f0" }}>
          <Contactless sx={{ color: "#7c3aed" }} />
          Cobro por Posnet · ${fmt(total)}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {estadoPosnet && (
            <EstadoPosnet
              estado={estadoPosnet}
              onCancelar={() => { setEstadoPosnet("CANCELADO"); detenerPolling(); }}
              procesando={enviandoPosnet}
            />
          )}
          {estadoPosnet === "APROBADO" && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: "#dcfce7", borderRadius: 2, textAlign: "center" }}>
              <Typography variant="body2" sx={{ color: "#166534", fontWeight: 700 }}>El stock fue descontado automáticamente ✅</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #e2e8f0" }}>
          <Button onClick={() => {
            cerrarDialogPosnet();
            if (estadoPosnet === "APROBADO") setTicketDialogOpen(true);
          }}
            variant="contained" fullWidth
            disabled={estadoPosnet === "PENDIENTE" || estadoPosnet === "PROCESANDO"}
            sx={{
              fontWeight: 800,
              background: estadoPosnet === "APROBADO"
                ? "linear-gradient(135deg, #16a34a 0%, #15803d 100%)"
                : "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
            }}
          >
            {estadoPosnet === "APROBADO" ? "Ver comprobante →" : (estadoPosnet === "PENDIENTE" || estadoPosnet === "PROCESANDO") ? "Esperando pago..." : "Cerrar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── TICKET DIALOG ── */}
      <TicketDialog
        open={ticketDialogOpen}
        onClose={() => {
          setTicketDialogOpen(false);
          setTicketData(null);
        }}
        ticket={ticketData}
      />
    </Box>
  );
};

export default TabNuevaVenta;