/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import {
  Box, Paper, Typography, CircularProgress, Chip, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Snackbar, Alert, Tooltip, IconButton,
} from "@mui/material";
import {
  LockOpen, ShoppingCart, ViewList, Storefront,
  TrendingUp, Refresh, CameraAlt,
} from "@mui/icons-material";
import { useEffect, useState, useCallback } from "react";

import TabGestionCaja from "./Tabgestioncaja";
import TabNuevaVenta from "./Tabnuevaventa";
import TabHistorial from "./Tabhistorial";
import CameraScanner from "./Camerascanner";

const API = "http://localhost:3000/api";

const fmt = (n) =>
  Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0 });

const fmtFecha = (iso) =>
  new Date(iso).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const CajaVentas = () => {
  const [tab, setTab] = useState(0);

  /* ── USUARIO ─────────────────────────────────────────────────── */
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = () => {
      try {
        const userStr = localStorage.getItem("user") || localStorage.getItem("usuario");
        if (userStr) setUser(JSON.parse(userStr));
      } catch (_) {}
    };
    loadUser();
    const handler = (e) => {
      if (e.key === "user" || e.key === "usuario") loadUser();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const isAdmin = user?.rol === "ADMIN" || user?.rol_id === 1;

  /* ── SNACKBAR ────────────────────────────────────────────────── */
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const showMsg = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  /* ── CAJA ────────────────────────────────────────────────────── */
  const [caja, setCaja] = useState(null);
  const [loadingCaja, setLoadingCaja] = useState(true);
  const [montoInicial, setMontoInicial] = useState("");
  const [montoCierre, setMontoCierre] = useState("");
  const [kioscos, setKioscos] = useState([]);
  const [selectedKiosco, setSelectedKiosco] = useState("");

  /* ── VENTA ───────────────────────────────────────────────────── */
  const [codigoBarra, setCodigoBarra] = useState("");
  const [items, setItems] = useState([]);
  const [pagoEfectivo, setPagoEfectivo] = useState("");
  const [pagoMP, setPagoMP] = useState("");
  const [procesandoVenta, setProcesandoVenta] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [lastTicket, setLastTicket] = useState(null);

  /* ── EMPLEADOS FICHADOS ──────────────────────────────────────── */
  const [fichadosAhora, setFichadosAhora] = useState([]);
  const [loadingFichados, setLoadingFichados] = useState(false);
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState([]);

  /* ── CATÁLOGO DIALOG ─────────────────────────────────────────── */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionados, setSeleccionados] = useState({});
  const [prodPage, setProdPage] = useState(0);
  const [prodRowsPerPage, setProdRowsPerPage] = useState(10);

  /* ── HISTORIAL ───────────────────────────────────────────────── */
  const [ventas, setVentas] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [ventaDetalle, setVentaDetalle] = useState(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [filtroFecha, setFiltroFecha] = useState("");

  /* ── API helper ──────────────────────────────────────────────── */
  const api = async (url, options = {}) => {
    const res = await fetch(url, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Error ${res.status}`);
    }
    return res.json();
  };

  /* ── INIT ────────────────────────────────────────────────────── */
  useEffect(() => {
    Promise.all([
      fetchKioscos(),
      fetchProductos(),
      cargarEstadoCaja(),
      cargarVentas(),
      fetchFichadosAhora(),
    ]).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAdmin && selectedKiosco) cargarEstadoCaja();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, selectedKiosco]);

  /* ── FICHADOS AHORA ──────────────────────────────────────────── */
  const fetchFichadosAhora = async () => {
    setLoadingFichados(true);
    try {
      const data = await api(`${API}/asistencias/fichados-ahora`);
      setFichadosAhora(data.empleados ?? []);
    } catch (e) {
      console.error("Error al cargar fichados:", e);
    } finally {
      setLoadingFichados(false);
    }
  };

  /* ── CAJA ────────────────────────────────────────────────────── */
  const fetchKioscos = async () => {
    try {
      const data = await api(`${API}/kioscos`);
      setKioscos(data);
    } catch (e) { console.error(e); }
  };

  const cargarEstadoCaja = async () => {
    setLoadingCaja(true);
    try {
      let url = `${API}/caja/estado`;
      if (isAdmin && selectedKiosco) url += `?kiosco_id=${selectedKiosco}`;
      const data = await api(url);
      setCaja(data);
    } catch { setCaja(null); }
    finally { setLoadingCaja(false); }
  };

  const abrirCaja = async () => {
    if (!montoInicial) return showMsg("Ingresá monto inicial", "warning");
    try {
      const payload = { monto_inicial: Number(montoInicial) };
      if (isAdmin) {
        if (!selectedKiosco) return showMsg("Seleccioná un kiosco", "warning");
        payload.kiosco_id = selectedKiosco;
      }
      await api(`${API}/caja/abrir`, { method: "POST", body: JSON.stringify(payload) });
      setMontoInicial("");
      showMsg("✅ Caja abierta correctamente");
      cargarEstadoCaja();
      cargarVentas();
    } catch (e) { showMsg(e.message, "error"); }
  };

  const cerrarCaja = async () => {
    if (!montoCierre) return showMsg("Ingresá monto de cierre", "warning");
    try {
      const payload = { monto_cierre: Number(montoCierre) };
      if (isAdmin) {
        if (!selectedKiosco) return showMsg("Seleccioná un kiosco", "warning");
        payload.kiosco_id = selectedKiosco;
      }
      await api(`${API}/caja/cerrar`, { method: "POST", body: JSON.stringify(payload) });
      setMontoCierre("");
      showMsg("🔒 Caja cerrada correctamente");
      cargarEstadoCaja();
    } catch (e) { showMsg(e.message, "error"); }
  };

  /* ── PRODUCTOS ───────────────────────────────────────────────── */
  const fetchProductos = async () => {
    setLoadingProductos(true);
    try {
      const data = await api(`${API}/productos`);
      setProductos(data);
    } catch { showMsg("Error al cargar productos", "error"); }
    finally { setLoadingProductos(false); }
  };

  /* ── CÓDIGO DE BARRAS ────────────────────────────────────────── */
  const agregarPorCodigo = async (codigoExterno) => {
    const cod = codigoExterno || codigoBarra;
    if (!cod?.trim()) return;
    try {
      const producto = await api(`${API}/productos/barcode/${cod.trim()}`);
      agregarItem(producto, 1);
      setCodigoBarra("");
      if (codigoExterno) setCameraOpen(false);
    } catch {
      showMsg(`Producto no encontrado: ${cod}`, "error");
      setCodigoBarra("");
    }
  };

  const handleCameraDetected = useCallback((codigo) => {
    agregarPorCodigo(codigo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenCamera = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        showMsg("Tu navegador no soporta acceso a cámara", "warning");
        return;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      if (!devices.some(d => d.kind === "videoinput")) {
        showMsg("No se encontró ninguna cámara en tu dispositivo", "warning");
        return;
      }
      setCameraOpen(true);
    } catch {
      setCameraOpen(true);
    }
  };

  /* ── ITEMS ───────────────────────────────────────────────────── */
  const agregarItem = (producto, cantidad = 1) => {
    setItems((prev) => {
      const existe = prev.find((p) => p.id === producto.id);
      if (existe) return prev.map((p) => p.id === producto.id ? { ...p, cantidad: p.cantidad + cantidad } : p);
      return [...prev, { ...producto, cantidad }];
    });
  };

  const cambiarCantidad = (id, delta) =>
    setItems((prev) =>
      prev.map((p) => p.id === id ? { ...p, cantidad: p.cantidad + delta } : p)
        .filter((p) => p.cantidad > 0)
    );

  const setCantidadDirecta = (id, valor) => {
    const n = parseInt(valor) || 0;
    if (n <= 0) return setItems((prev) => prev.filter((p) => p.id !== id));
    setItems((prev) => prev.map((p) => p.id === id ? { ...p, cantidad: n } : p));
  };

  const quitarItem = (id) => setItems((prev) => prev.filter((p) => p.id !== id));
  const limpiarVenta = () => {
    setItems([]);
    setPagoEfectivo("");
    setPagoMP("");
    // Empleados seleccionados se mantienen entre ventas a propósito
  };

  const total = items.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  const totalPagado = (Number(pagoEfectivo) || 0) + (Number(pagoMP) || 0);

  /* ── PAGO RÁPIDO ─────────────────────────────────────────────── */
  const pagoRapido = (tipo) => {
    if (tipo === "efectivo") { setPagoEfectivo(String(total)); setPagoMP(""); }
    if (tipo === "mp") { setPagoMP(String(total)); setPagoEfectivo(""); }
  };

  /* ── CATÁLOGO DIALOG ─────────────────────────────────────────── */
  const toggleSeleccion = (producto) => {
    setSeleccionados((prev) => {
      if (prev[producto.id]) { const next = { ...prev }; delete next[producto.id]; return next; }
      return { ...prev, [producto.id]: { producto, cantidad: 1 } };
    });
  };

  const setSelCantidad = (id, valor) => {
    const n = parseInt(valor) || 1;
    setSeleccionados((prev) => ({ ...prev, [id]: { ...prev[id], cantidad: Math.max(1, n) } }));
  };

  const confirmarSeleccion = () => {
    Object.values(seleccionados).forEach(({ producto, cantidad }) => agregarItem(producto, cantidad));
    setSeleccionados({}); setBusqueda(""); setProdPage(0); setDialogOpen(false);
  };

  const cancelarDialog = () => {
    setSeleccionados({}); setBusqueda(""); setProdPage(0); setDialogOpen(false);
  };

  /* ── CONFIRMAR VENTA ─────────────────────────────────────────── */
  const confirmarVenta = async () => {
    if (items.length === 0) return showMsg("No hay productos en el carrito", "warning");
    if (totalPagado < total) return showMsg(`Falta $${fmt(total - totalPagado)} para completar el pago`, "warning");

    const pagos = [];
    if (Number(pagoEfectivo) > 0) pagos.push({ tipo: "EFECTIVO", monto: Number(pagoEfectivo) });
    if (Number(pagoMP) > 0) pagos.push({ tipo: "MP", monto: Number(pagoMP) });
    if (pagos.length === 0) return showMsg("Ingresá al menos un método de pago", "warning");

    setProcesandoVenta(true);
    try {
      const body = {
        productos: items.map((p) => ({ producto_id: p.id, cantidad: p.cantidad, precio: p.precio })),
        pagos,
      };
      // Incluir empleados si hay seleccionados
      if (empleadosSeleccionados.length > 0) {
        body.empleado_ids = empleadosSeleccionados;
      }

      const venta = await api(`${API}/ventas`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      const vueltoFinal = totalPagado - total > 0 ? totalPagado - total : 0;
      setLastTicket({ numero: venta.ticket_numero, total: venta.total, vuelto: vueltoFinal });
      limpiarVenta();
      cargarVentas();

      const msg = vueltoFinal > 0
        ? `✅ Ticket #${venta.ticket_numero} · Vuelto: $${fmt(vueltoFinal)}`
        : `✅ Ticket #${venta.ticket_numero} · $${fmt(venta.total)} cobrados`;
      showMsg(msg, "success");
    } catch (e) {
      showMsg(e.message || "Error al procesar la venta", "error");
    } finally {
      setProcesandoVenta(false);
    }
  };

  /* ── HISTORIAL ───────────────────────────────────────────────── */
  const cargarVentas = async () => {
    setLoadingHistorial(true);
    try {
      let url = `${API}/ventas/historial`;
      if (isAdmin && selectedKiosco) url += `?kiosco_id=${selectedKiosco}`;
      const data = await api(url);
      setVentas(data);
    } catch (e) { console.error(e); }
    finally { setLoadingHistorial(false); }
  };

  const verDetalle = async (ventaId) => {
    try {
      const data = await api(`${API}/ventas/${ventaId}`);
      setVentaDetalle(data);
      setDetalleOpen(true);
    } catch { showMsg("Error al cargar detalle", "error"); }
  };

  const anularVenta = async (ventaId) => {
    try {
      await api(`${API}/ventas/${ventaId}/anular`, { method: "POST" });
      showMsg("Venta anulada correctamente");
      cargarVentas();
      setDetalleOpen(false);
    } catch (e) { showMsg(e.message, "error"); }
  };

  /* ── STATS HOY ───────────────────────────────────────────────── */
  const ventasHoy = ventas.filter((v) => {
    const hoy = new Date().toISOString().slice(0, 10);
    return new Date(v.fecha).toISOString().slice(0, 10) === hoy && !v.anulada;
  });
  const totalHoy = ventasHoy.reduce((acc, v) => acc + Number(v.total), 0);

  /* ── RENDER ──────────────────────────────────────────────────── */
  return (
    <Box sx={{ width: "100%" }}>

      {/* ── Header ── */}
      <Box sx={{
        mb: 3, p: 3,
        background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
        borderRadius: 3, boxShadow: "0 8px 32px rgba(102,126,234,0.3)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{
            backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2, p: 1.5,
            display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)"
          }}>
            <Storefront sx={{ color: "white", fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ color: "white", fontWeight: 900, letterSpacing: "-0.5px", textShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
              Punto de Venta
            </Typography>
            {ventasHoy.length > 0 && (
              <Chip
                icon={<TrendingUp sx={{ fontSize: "0.9rem !important" }} />}
                label={`Hoy: $${fmt(totalHoy)} · ${ventasHoy.length} ventas`}
                sx={{
                  mt: 0.5,
                  backgroundColor: "rgba(255,255,255,0.25)", color: "white", fontSize: "0.75rem",
                  border: "1px solid rgba(255,255,255,0.3)", backdropFilter: "blur(10px)", fontWeight: 700
                }}
              />
            )}
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {loadingCaja && <CircularProgress size={24} sx={{ color: "white" }} />}

          {/* Kiosco */}
          <Box sx={{
            backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2, px: 2, py: 1,
            backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.3)"
          }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)", display: "block", fontSize: "0.65rem" }}>
              MI KIOSCO
            </Typography>
            <Typography component="div" variant="body2" sx={{ color: "white", fontWeight: 800 }}>
              {kioscos.find(k => Number(k.id) === Number(user?.kiosco_id))?.nombre
                || caja?.kiosco_nombre
                || user?.kiosco_nombre
                || "Mi Kiosco"}
            </Typography>
          </Box>

          {/* Empleados fichados badge */}
          {fichadosAhora.length > 0 && (
            <Tooltip title={fichadosAhora.map(e => `${e.nombre} ${e.apellido}`).join(", ")}>
              <Box sx={{
                backgroundColor: "rgba(251,191,36,0.2)", borderRadius: 2, px: 2, py: 1,
                backdropFilter: "blur(10px)", border: "1px solid rgba(251,191,36,0.3)",
                cursor: "default"
              }}>
                <Typography variant="caption" sx={{ color: "rgba(251,191,36,0.9)", display: "block", fontSize: "0.65rem" }}>
                  EN TURNO
                </Typography>
                <Typography component="div" variant="body2" sx={{ color: "white", fontWeight: 800 }}>
                  {fichadosAhora.length} empleado{fichadosAhora.length > 1 ? "s" : ""}
                </Typography>
              </Box>
            </Tooltip>
          )}

          {/* Caja abierta badge */}
          {caja && (
            <Tooltip title={`Caja abierta: ${fmtFecha(caja.fecha_apertura)}`}>
              <Box sx={{
                backgroundColor: "rgba(74,222,128,0.2)", borderRadius: 2, px: 2, py: 1,
                backdropFilter: "blur(10px)", border: "1px solid rgba(74,222,128,0.3)",
                display: "flex", flexDirection: "column"
              }}>
                <Typography variant="caption" sx={{ color: "rgba(74,222,128,0.9)", display: "block", fontSize: "0.65rem" }}>
                  CAJA ABIERTA
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#4ade80" }} />
                  <Typography component="span" variant="body2" sx={{ color: "white", fontWeight: 800 }}>
                    ${fmt(caja.monto_inicial)}
                  </Typography>
                </Box>
              </Box>
            </Tooltip>
          )}

          {isAdmin && (
            <Tooltip title="Actualizar estado">
              <IconButton
                onClick={cargarEstadoCaja}
                sx={{
                  color: "white", backgroundColor: "rgba(255,255,255,0.2)",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.3)" }
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* ── Tabs ── */}
      <Paper elevation={0} sx={{ mb: 3, borderRadius: 3, overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{
            backgroundColor: "var(--bg-soft)",
            "& .MuiTab-root": {
              fontWeight: 700, fontSize: "0.9rem", textTransform: "none", py: 2.5,
              color: "#64748b", transition: "all 0.3s ease",
              "&:hover": { backgroundColor: "rgba(102,126,234,0.05)" },
              "&.Mui-selected": { color: "var(--primary)", backgroundColor: "white" }
            },
            "& .MuiTabs-indicator": {
              height: 3, borderRadius: "3px 3px 0 0",
              background: "linear-gradient(90deg, var(--primary) 0%, #764ba2 100%)"
            }
          }}
        >
          <Tab icon={<LockOpen />} iconPosition="start" label="Gestión de Caja" />
          <Tab icon={<ShoppingCart />} iconPosition="start" label="Nueva Venta" disabled={!caja} />
          <Tab icon={<ViewList />} iconPosition="start" label="Historial" />
        </Tabs>
      </Paper>

      {/* ── Tab 0: Gestión de Caja ── */}
      {tab === 0 && (
        <TabGestionCaja
          caja={caja}
          loadingCaja={loadingCaja}
          montoInicial={montoInicial}
          setMontoInicial={setMontoInicial}
          montoCierre={montoCierre}
          setMontoCierre={setMontoCierre}
          kioscos={kioscos}
          selectedKiosco={selectedKiosco}
          setSelectedKiosco={setSelectedKiosco}
          isAdmin={isAdmin}
          user={user}
          ventas={ventas}
          onAbrirCaja={abrirCaja}
          onCerrarCaja={cerrarCaja}
        />
      )}

      {/* ── Tab 1: Nueva Venta ── */}
      {tab === 1 && (
        <TabNuevaVenta
          items={items}
          cambiarCantidad={cambiarCantidad}
          setCantidadDirecta={setCantidadDirecta}
          quitarItem={quitarItem}
          codigoBarra={codigoBarra}
          setCodigoBarra={setCodigoBarra}
          agregarPorCodigo={agregarPorCodigo}
          cameraOpen={cameraOpen}
          setCameraOpen={setCameraOpen}
          handleOpenCamera={handleOpenCamera}
          handleCameraDetected={handleCameraDetected}
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
          productos={productos}
          loadingProductos={loadingProductos}
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          seleccionados={seleccionados}
          toggleSeleccion={toggleSeleccion}
          setSelCantidad={setSelCantidad}
          confirmarSeleccion={confirmarSeleccion}
          cancelarDialog={cancelarDialog}
          prodPage={prodPage}
          setProdPage={setProdPage}
          prodRowsPerPage={prodRowsPerPage}
          setProdRowsPerPage={setProdRowsPerPage}
          pagoEfectivo={pagoEfectivo}
          setPagoEfectivo={setPagoEfectivo}
          pagoMP={pagoMP}
          setPagoMP={setPagoMP}
          pagoRapido={pagoRapido}
          confirmarVenta={confirmarVenta}
          limpiarVenta={limpiarVenta}
          procesandoVenta={procesandoVenta}
          lastTicket={lastTicket}
          setLastTicket={setLastTicket}
          fichadosAhora={fichadosAhora}
          loadingFichados={loadingFichados}
          empleadosSeleccionados={empleadosSeleccionados}
          setEmpleadosSeleccionados={setEmpleadosSeleccionados}
          onRefreshFichados={fetchFichadosAhora}
          onVentaCompletada={cargarVentas}
        />
      )}

      {/* ── Tab 2: Historial ── */}
      {tab === 2 && (
        <TabHistorial
          ventas={ventas}
          loadingHistorial={loadingHistorial}
          filtroEstado={filtroEstado}
          setFiltroEstado={setFiltroEstado}
          filtroFecha={filtroFecha}
          setFiltroFecha={setFiltroFecha}
          ventaDetalle={ventaDetalle}
          detalleOpen={detalleOpen}
          setDetalleOpen={setDetalleOpen}
          isAdmin={isAdmin}
          onVerDetalle={verDetalle}
          onAnularVenta={anularVenta}
          onRecargar={cargarVentas}
        />
      )}

      {/* ── Dialog Cámara ── */}
      <Dialog
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" } }}
      >
        <DialogTitle sx={{ pb: 2, borderBottom: "1px solid #e2e8f0", fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
          <CameraAlt sx={{ color: "var(--primary)" }} />
          Escanear Código de Barras
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <CameraScanner onDetected={handleCameraDetected} />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: "1px solid #e2e8f0" }}>
          <Button
            onClick={() => setCameraOpen(false)}
            variant="contained"
            fullWidth
            sx={{
              fontWeight: 800,
              background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
              "&:hover": { background: "linear-gradient(135deg, #764ba2 0%, var(--primary) 100%)" }
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ fontWeight: 700, borderRadius: 2, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CajaVentas;