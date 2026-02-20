/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import {
  Box, Paper, Typography, TextField, Button, Table, TableHead,
  TableRow, TableCell, TableBody, IconButton, Tabs, Tab,
  Snackbar, Alert, CircularProgress, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, InputAdornment, Checkbox,
  TablePagination, Tooltip, FormControl, InputLabel, Select, MenuItem,
} from "@mui/material";
import {
  Add, Delete, PointOfSale, LockOpen, Lock, Search, Clear,
  ShoppingCart, QrCode, ViewList, CheckCircle, Cancel,
  AttachMoney, CreditCard, Receipt, Remove,
  AddShoppingCart, Storefront, Refresh, CameraAlt,
  TrendingUp, Schedule,
} from "@mui/icons-material";
import { useEffect, useState, useRef, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";

const API = "http://localhost:3000/api";

const fmt = (n) =>
  Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0 });

const fmtFecha = (iso) =>
  new Date(iso).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

{/* ─── RESUMEN DE CIERRE ──────────────────────────────────────────── */}
const ResumenCierre = ({ ventas, montoInicial, montoContado }) => {
  const ventasValidas = ventas.filter((v) => !v.anulada);
  const totalEfectivo = ventasValidas.reduce((acc, v) => acc + Number(v.total_efectivo || 0), 0);
  const totalMP = ventasValidas.reduce((acc, v) => acc + Number(v.total_mp || 0), 0);
  const totalVendido = ventasValidas.reduce((acc, v) => acc + Number(v.total), 0);
  const efectivoEsperado = Number(montoInicial) + totalEfectivo;
  const diferencia = Number(montoContado) - efectivoEsperado;

  return (
    <Box sx={{ 
      mt: 2.5, 
      p: 3, 
      background: "linear-gradient(135deg, var(--bg-soft) 0%, #f1f5f9 100%)",
      borderRadius: 3,
      border: "1px solid #e2e8f0",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      transition: "all 0.3s ease"
    }}>
      <Typography 
        variant="caption" 
        sx={{ 
          fontWeight: 800, 
          color: "var(--text-secondary)", 
          display: "block", 
          mb: 2, 
          letterSpacing: "0.1em",
          fontSize: "0.8rem"
        }}
      >
        📊 RESUMEN DEL TURNO
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 2 }}>
        {[
          { label: "Ventas realizadas", value: ventasValidas.length, icon: "🛍️" },
          { label: "Total vendido", value: `$${fmt(totalVendido)}`, icon: "💰" },
          { label: "Cobrado efectivo", value: `$${fmt(totalEfectivo)}`, icon: "💵" },
          { label: "Cobrado MP", value: `$${fmt(totalMP)}`, icon: "💳" },
        ].map(({ label, value, icon }) => (
          <Box 
            key={label} 
            sx={{ 
              p: 1.5, 
              backgroundColor: "white", 
              borderRadius: 2, 
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              transition: "all 0.2s ease",
              "&:hover": {
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                transform: "translateY(-2px)"
              }
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                color: "#64748b", 
                display: "flex", 
                alignItems: "center",
                gap: 0.5,
                fontSize: "0.7rem",
                mb: 0.5
              }}
            >
              <span>{icon}</span> {label}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 800, 
                color: "var(--text-primary)", 
                fontFamily: "monospace",
                fontSize: "1rem"
              }}
            >
              {value}
            </Typography>
          </Box>
        ))}
      </Box>
      {montoContado && (
        <Box sx={{
          p: 2, 
          borderRadius: 2,
          background: diferencia >= 0 
            ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" 
            : "linear-gradient(135deg, #fef2f2 0%, var(--error-light) 100%)",
          border: `2px solid ${diferencia >= 0 ? "#86efac" : "#fca5a5"}`,
          boxShadow: diferencia >= 0 
            ? "0 4px 12px rgba(34,197,94,0.15)" 
            : "0 4px 12px rgba(239,68,68,0.15)",
          transition: "all 0.3s ease"
        }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: diferencia >= 0 ? "#166534" : "#991b1b", 
                fontWeight: 800,
                fontSize: "0.85rem"
              }}
            >
              {diferencia >= 0 ? "✅ Sobrante" : "⚠️ Faltante"}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: diferencia >= 0 ? "#166534" : "#991b1b", 
                fontWeight: 900, 
                fontFamily: "monospace",
                fontSize: "1.1rem"
              }}
            >
              ${fmt(Math.abs(diferencia))}
            </Typography>
          </Box>
          <Typography 
            variant="caption" 
            sx={{ 
              color: "#64748b", 
              fontSize: "0.7rem",
              display: "block"
            }}
          >
            Esperado: ${fmt(efectivoEsperado)} · Contado: ${fmt(montoContado)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
{/* ----- verificacion de permisos de camara */}


{/* ─── SCANNER CÁMARA ─────────────────────────────────────────────── */}
const CameraScanner = ({ onDetected }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const readerRef = useRef(null);
  const animFrameRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [lastDetected, setLastDetected] = useState(null);
  const [frameCount, setFrameCount] = useState(0); // ← para ver que procesa frames
  const onDetectedRef = useRef(onDetected);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let stopped = false;
    let stream = null;

    const startScanner = async () => {
      await new Promise((res) => setTimeout(res, 500));
      if (stopped) return;

      try {
        // Pedir stream directamente con constraints específicos
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
        });

        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        console.log("📹 Stream activo:", stream.getVideoTracks()[0].getSettings());

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const codeReader = new BrowserMultiFormatReader(hints);
        readerRef.current = codeReader;

        setScanning(true);

        let frames = 0;
        const scanFrame = async () => {
          if (stopped) return;
          if (!videoRef.current || !canvasRef.current) {
            animFrameRef.current = requestAnimationFrame(scanFrame);
            return;
          }

          const video = videoRef.current;
          const canvas = canvasRef.current;

          if (video.readyState !== video.HAVE_ENOUGH_DATA) {
            animFrameRef.current = requestAnimationFrame(scanFrame);
            return;
          }

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          frames++;
          if (frames % 30 === 0) { // log cada 30 frames
            console.log(`🎞️ Frame #${frames} procesado - ${canvas.width}x${canvas.height}`);
            setFrameCount(frames);
          }

          try {
            const result = await codeReader.decodeFromCanvas(canvas);
            if (result && !stopped) {
            const codigo = result.getText();
            
            // Filtrar lecturas inválidas: mínimo 6 caracteres y solo números para EAN
            if (codigo.length < 6) {
                console.warn("Código descartado (muy corto):", codigo);
                return;
            }
            
            console.log("✅ CÓDIGO DETECTADO:", codigo, "| Formato:", result.getBarcodeFormat());
            setLastDetected(codigo);
            onDetectedRef.current(codigo);
}
          } catch (e) {
            // NotFoundException es normal, ignorar
          }

          // Pequeña pausa entre frames para no saturar CPU
          await new Promise(r => setTimeout(r, 100));
          if (!stopped) animFrameRef.current = requestAnimationFrame(scanFrame);
        };

        scanFrame();

      } catch (e) {
        if (stopped) return;
        console.error("Error iniciando scanner:", e.name, e.message);
        if (e.name === "NotAllowedError") {
          setError("Permiso de cámara denegado.");
        } else if (e.name === "NotFoundError") {
          setError("No se encontró ninguna cámara.");
        } else {
          setError(`Error: ${e.message}`);
        }
      }
    };

    startScanner();

    return () => {
      stopped = true;
      setScanning(false);
      cancelAnimationFrame(animFrameRef.current);
      if (stream) stream.getTracks().forEach(t => t.stop());
      try { readerRef.current?.reset(); } catch (_) {}
    };
  }, []);

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: "center", backgroundColor: "#fef2f2", borderRadius: 2, border: "2px dashed #fca5a5", m: 2 }}>
        <Typography variant="body2" sx={{ color: "var(--error)", fontWeight: 600, mb: 1 }}>{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative", backgroundColor: "#000", borderRadius: 2, overflow: "hidden" }}>
      <video ref={videoRef} style={{ width: "100%", maxHeight: 350, display: "block" }} muted playsInline />
      {/* Canvas oculto para procesamiento */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Visor */}
      <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <Box sx={{
          width: 260, height: 130,
          border: "3px solid #4ade80", borderRadius: 2,
          boxShadow: "0 0 0 2000px rgba(0,0,0,0.45), 0 0 20px #4ade80",
          position: "relative", overflow: "hidden"
        }}>
          {scanning && (
            <Box sx={{
              position: "absolute", left: 0, right: 0, height: 2,
              background: "linear-gradient(90deg, transparent, #4ade80, transparent)",
              animation: "scan 1.5s ease-in-out infinite alternate",
              "@keyframes scan": { from: { top: "0%" }, to: { top: "100%" } },
            }} />
          )}
        </Box>
      </Box>

      {/* Estado */}
      <Box sx={{ position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center" }}>
        <Typography variant="caption" sx={{
          color: "white", backgroundColor: "rgba(0,0,0,0.7)",
          px: 2, py: 0.8, borderRadius: 20, fontWeight: 600
        }}>
          {scanning ? `📱 Escaneando... (frame ${frameCount})` : "⏳ Iniciando..."}
        </Typography>
      </Box>

      {/* Diagnóstico */}
      {lastDetected && (
        <Box sx={{
          position: "absolute", top: 12, left: 12, right: 12,
          backgroundColor: "rgba(0,0,0,0.85)", border: "2px solid #4ade80",
          borderRadius: 2, p: 1.5, textAlign: "center"
        }}>
          <Typography variant="caption" sx={{ color: "#4ade80", display: "block", fontWeight: 800, fontSize: "0.7rem" }}>
            ✅ CÓDIGO DETECTADO
          </Typography>
          <Typography variant="body2" sx={{ color: "white", fontWeight: 900, fontFamily: "monospace" }}>
            {lastDetected}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
{/* ───────────────────────────────────────────────────────────────── */}
const CajaVentas = () => {
  const [tab, setTab] = useState(0);
  const barcodeRef = useRef(null);

const [user, setUser] = useState(null);
useEffect(() => {
  const loadUser = () => {
    try {
      // Intentar con ambas claves por si acaso
      const userStr = localStorage.getItem("user") || localStorage.getItem("usuario");
      
      if (userStr) {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
      }
     
    } catch (error) {
      // Error silencioso
    }
  };

  loadUser();

  // Escuchar cambios en localStorage
  const handleStorageChange = (e) => {
    if (e.key === "user" || e.key === "usuario") {
      loadUser();
    }
  };

  window.addEventListener("storage", handleStorageChange);
  
  return () => {
    window.removeEventListener("storage", handleStorageChange);
  };
}, []);

  const isAdmin = user?.rol === "ADMIN" || user?.rol_id === 1;

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const showMsg = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  {/* ── CAJA ────────────────────────────────────────────────────── */}
  const [caja, setCaja] = useState(null);
  const [loadingCaja, setLoadingCaja] = useState(true);
  const [montoInicial, setMontoInicial] = useState("");
  const [montoCierre, setMontoCierre] = useState("");
  const [kioscos, setKioscos] = useState([]);
  const [selectedKiosco, setSelectedKiosco] = useState("");

  {/* ── VENTA ───────────────────────────────────────────────────── */}
  const [codigoBarra, setCodigoBarra] = useState("");
  const [items, setItems] = useState([]);
  const [pagoEfectivo, setPagoEfectivo] = useState("");
  const [pagoMP, setPagoMP] = useState("");
  const [procesandoVenta, setProcesandoVenta] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [lastTicket, setLastTicket] = useState(null);

  {/* ── DIALOG PRODUCTOS ────────────────────────────────────────── */}
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionados, setSeleccionados] = useState({});
  const [prodPage, setProdPage] = useState(0);
  const [prodRowsPerPage, setProdRowsPerPage] = useState(10);

  {/* ── HISTORIAL ───────────────────────────────────────────────── */}
  const [ventas, setVentas] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [ventaDetalle, setVentaDetalle] = useState(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [filtroFecha, setFiltroFecha] = useState("");

  {/* ── API ─────────────────────────────────────────────────────── */}
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
  const handleOpenCamera = async () => {
    try {
      // Verificar si el navegador soporta mediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        showMsg("Tu navegador no soporta acceso a cámara", "warning");
        return;
      }

      // Verificar si hay cámaras disponibles
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(device => device.kind === 'videoinput');
      
      if (!hasCamera) {
        showMsg("No se encontró ninguna cámara en tu dispositivo", "warning");
        return;
      }

      // Intentar abrir la cámara
      setCameraOpen(true);
    } catch (error) {
      console.error("Error verificando cámara:", error);
      // Si hay error, igual intentamos abrir (el componente CameraScanner manejará el error)
      setCameraOpen(true);
    }
  };
  {/* ── INIT ────────────────────────────────────────────────────── */}
//   useEffect(() => {
//     cargarEstadoCaja();
//     fetchProductos();
//     cargarVentas();
//     if (isAdmin) fetchKioscos();
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isAdmin]);

{/* ── INIT ────────────────────────────────────────────────────── */}
useEffect(() => {
  const initializeData = async () => {
    try {
      // Cargar todo en paralelo
      await Promise.all([
        fetchKioscos(),  // ← Primero cargar kioscos
        fetchProductos(),
        cargarEstadoCaja(),
        cargarVentas()
      ]);
      
      
    } catch (error) {
      error
    }
  };
  
  initializeData();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  useEffect(() => {
    if (isAdmin && selectedKiosco) cargarEstadoCaja();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, selectedKiosco]);

  useEffect(() => {
    if (tab === 1 && caja) setTimeout(() => barcodeRef.current?.focus(), 150);
  }, [tab, caja]);

  {/* ── CAJA ────────────────────────────────────────────────────── */}
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
    } catch {
      setCaja(null);
    } finally {
      setLoadingCaja(false);
    }
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

  {/* ── PRODUCTOS ───────────────────────────────────────────────── */}
  const fetchProductos = async () => {
    setLoadingProductos(true);
    try {
      const data = await api(`${API}/productos`);
      setProductos(data);
    } catch { showMsg("Error al cargar productos", "error"); }
    finally { setLoadingProductos(false); }
  };

  {/* ── CÓDIGO DE BARRAS ────────────────────────────────────────── */}
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

  {/* ── ITEMS ───────────────────────────────────────────────────── */}
  const agregarItem = (producto, cantidad = 1) => {
    setItems((prev) => {
      const existe = prev.find((p) => p.id === producto.id);
      if (existe) return prev.map((p) => p.id === producto.id ? { ...p, cantidad: p.cantidad + cantidad } : p);
      return [...prev, { ...producto, cantidad }];
    });
  };

  const cambiarCantidad = (id, delta) => {
    setItems((prev) =>
      prev.map((p) => p.id === id ? { ...p, cantidad: p.cantidad + delta } : p)
        .filter((p) => p.cantidad > 0)
    );
  };

  const setCantidadDirecta = (id, valor) => {
    const n = parseInt(valor) || 0;
    if (n <= 0) return setItems((prev) => prev.filter((p) => p.id !== id));
    setItems((prev) => prev.map((p) => p.id === id ? { ...p, cantidad: n } : p));
  };

  const quitarItem = (id) => setItems((prev) => prev.filter((p) => p.id !== id));
  const limpiarVenta = () => { setItems([]); setPagoEfectivo(""); setPagoMP(""); };

  const total = items.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  const totalPagado = (Number(pagoEfectivo) || 0) + (Number(pagoMP) || 0);
  const vuelto = totalPagado - total;

  {/* ── PAGO RÁPIDO ─────────────────────────────────────────────── */}
  const pagoRapido = (tipo) => {
    if (tipo === "efectivo") { setPagoEfectivo(String(total)); setPagoMP(""); }
    if (tipo === "mp") { setPagoMP(String(total)); setPagoEfectivo(""); }
  };

  {/* ── DIALOG ──────────────────────────────────────────────────── */}
  const productosFiltrados = productos.filter((p) => {
    const q = busqueda.toLowerCase();
    return p.nombre.toLowerCase().includes(q) || (p.codigo_barra || "").includes(q);
  });

  const productosPaginados = productosFiltrados.slice(
    prodPage * prodRowsPerPage,
    prodPage * prodRowsPerPage + prodRowsPerPage
  );

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

  const cancelarDialog = () => { setSeleccionados({}); setBusqueda(""); setProdPage(0); setDialogOpen(false); };
  const cantSeleccionados = Object.keys(seleccionados).length;

  {/* ── CONFIRMAR VENTA ─────────────────────────────────────────── */}
  const confirmarVenta = async () => {
    if (items.length === 0) return showMsg("No hay productos en el carrito", "warning");
    if (totalPagado < total) return showMsg(`Falta $${fmt(total - totalPagado)} para completar el pago`, "warning");

    const pagos = [];
    if (Number(pagoEfectivo) > 0) pagos.push({ tipo: "EFECTIVO", monto: Number(pagoEfectivo) });
    if (Number(pagoMP) > 0) pagos.push({ tipo: "MP", monto: Number(pagoMP) });
    if (pagos.length === 0) return showMsg("Ingresá al menos un método de pago", "warning");

    setProcesandoVenta(true);
    try {
      const venta = await api(`${API}/ventas`, {
        method: "POST",
        body: JSON.stringify({
          productos: items.map((p) => ({ producto_id: p.id, cantidad: p.cantidad, precio: p.precio })),
          pagos,
        }),
      });

      const vueltoFinal = vuelto > 0 ? vuelto : 0;
      setLastTicket({ numero: venta.ticket_numero, total: venta.total, vuelto: vueltoFinal });
      limpiarVenta();
      cargarVentas();

      const msg = vueltoFinal > 0
        ? `✅ Ticket #${venta.ticket_numero} · Vuelto: $${fmt(vueltoFinal)}`
        : `✅ Ticket #${venta.ticket_numero} · $${fmt(venta.total)} cobrados`;
      showMsg(msg, "success");
      setTimeout(() => barcodeRef.current?.focus(), 100);
    } catch (e) {
      showMsg(e.message || "Error al procesar la venta", "error");
    } finally {
      setProcesandoVenta(false);
    }
  };

  {/* ── HISTORIAL ───────────────────────────────────────────────── */}
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
      setVentaDetalle(data); setDetalleOpen(true);
    } catch { showMsg("Error al cargar detalle", "error"); }
  };

  const anularVenta = async (ventaId) => {
    if (!window.confirm("¿Anular esta venta? Se revertirá el stock.")) return;
    try {
      await api(`${API}/ventas/${ventaId}/anular`, { method: "POST" });
      showMsg("Venta anulada correctamente");
      cargarVentas(); setDetalleOpen(false);
    } catch (e) { showMsg(e.message, "error"); }
  };

  {/* ── FILTROS HISTORIAL ───────────────────────────────────────── */}
  const ventasFiltradas = ventas.filter((v) => {
    if (filtroEstado === "ok" && v.anulada) return false;
    if (filtroEstado === "anuladas" && !v.anulada) return false;
    if (filtroFecha) {
      const fechaVenta = new Date(v.fecha).toISOString().slice(0, 10);
      if (fechaVenta !== filtroFecha) return false;
    }
    return true;
  });

  const totalHistorial = ventasFiltradas.filter((v) => !v.anulada).reduce((acc, v) => acc + Number(v.total), 0);

  {/* ── STATS HOY ───────────────────────────────────────────────── */}
  const ventasHoy = ventas.filter((v) => {
    const hoy = new Date().toISOString().slice(0, 10);
    return new Date(v.fecha).toISOString().slice(0, 10) === hoy && !v.anulada;
  });
  const totalHoy = ventasHoy.reduce((acc, v) => acc + Number(v.total), 0);

  const mono = {  };

  return (
    <Box sx={{ width: "100%", ...mono }}>

{/* ── Header ── */}
<Box sx={{ 
  mb: 3, 
  p: 3,
  background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
  borderRadius: 3,
  boxShadow: "0 8px 32px rgba(102,126,234,0.3)",
  display: "flex", 
  justifyContent: "space-between", 
  alignItems: "center", 
  flexWrap: "wrap", 
  gap: 2
}}>
  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
    <Box sx={{
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 2,
      p: 1.5,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backdropFilter: "blur(10px)"
    }}>
      <Storefront sx={{ color: "white", fontSize: 32 }} />
    </Box>
    <Box>
      <Typography 
        variant="h4" 
        sx={{ 
          color: "white", 
          fontWeight: 900, 
          letterSpacing: "-0.5px", 
          ...mono,
          textShadow: "0 2px 8px rgba(0,0,0,0.2)"
        }}
      >
        Punto de Venta
      </Typography>
      {ventasHoy.length > 0 && (
        <Chip
          icon={<TrendingUp sx={{ fontSize: "0.9rem !important" }} />}
          label={`Hoy: $${fmt(totalHoy)} · ${ventasHoy.length} ventas`}
          sx={{ 
            mt: 0.5,
            backgroundColor: "rgba(255,255,255,0.25)", 
            color: "white", 
            fontSize: "0.75rem", 
            ...mono, 
            border: "1px solid rgba(255,255,255,0.3)",
            backdropFilter: "blur(10px)",
            fontWeight: 700
          }}
        />
      )}
    </Box>
  </Box>
  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
    {loadingCaja && <CircularProgress size={24} sx={{ color: "white" }} />}
    
    {/* MI KIOSCO - Usando Typography con component="div" para evitar el error de anidación */}
    <Box sx={{
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 2,
      px: 2,
      py: 1,
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.3)"
    }}>
      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)", display: "block", fontSize: "0.65rem" }}>
        MI KIOSCO
      </Typography>
      {/* Cambiado a component="div" para evitar el error de anidación */}
      <Typography component="div" variant="body2" sx={{ color: "white", fontWeight: 800, ...mono }}>
        {(() => {
          // Debug: ver qué hay en user y kioscos
          
          // Buscar el kiosco del usuario
          if (user?.kiosco_id && kioscos.length > 0) {
            const userKiosco = kioscos.find(k => Number(k.id) === Number(user.kiosco_id));
            if (userKiosco) {
              
              return userKiosco.nombre;
            }
          }
          // Si no encuentra, mostrar el kiosco de la caja o un placeholder
          return caja?.kiosco_nombre || user?.kiosco_nombre || "Mi Kiosco";
        })()}
      </Typography>
    </Box>

    {/* CAJA ABIERTA - Solo visible cuando hay caja abierta */}
    {caja && (
      <Tooltip title={`Caja abierta: ${fmtFecha(caja.fecha_apertura)}`}>
        {/* Cambiado a Box en lugar de Tooltip directo para mejor estructura */}
        <Box sx={{
          backgroundColor: "rgba(74,222,128,0.2)",
          borderRadius: 2,
          px: 2,
          py: 1,
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(74,222,128,0.3)",
          display: "flex",
          flexDirection: "column"
        }}>
          <Typography variant="caption" sx={{ color: "rgba(74,222,128,0.9)", display: "block", fontSize: "0.65rem" }}>
            CAJA ABIERTA
          </Typography>
          {/* Separado en dos Typography para evitar anidación de div en p */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#4ade80" }} />
            <Typography component="span" variant="body2" sx={{ color: "white", fontWeight: 800, ...mono }}>
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
            color: "white",
            backgroundColor: "rgba(255,255,255,0.2)",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.3)"
            }
          }}
        >
          <Refresh />
        </IconButton>
      </Tooltip>
    )}
  </Box>
</Box>

      {/* ── Tabs ── */}
      <Paper 
        elevation={0} 
        sx={{ 
          mb: 3,
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{
            backgroundColor: "var(--bg-soft)",
            "& .MuiTab-root": {
              fontWeight: 700,
              fontSize: "0.9rem",
              textTransform: "none",
              py: 2.5,
              ...mono,
              color: "#64748b",
              transition: "all 0.3s ease",
              "&:hover": {
                backgroundColor: "rgba(102,126,234,0.05)"
              },
              "&.Mui-selected": {
                color: "var(--primary)",
                backgroundColor: "white"
              }
            },
            "& .MuiTabs-indicator": {
              height: 3,
              borderRadius: "3px 3px 0 0",
              background: "linear-gradient(90deg, var(--primary) 0%, #764ba2 100%)"
            }
          }}
        >
          <Tab icon={<LockOpen />} iconPosition="start" label="Gestión de Caja" />
          <Tab icon={<ShoppingCart />} iconPosition="start" label="Nueva Venta" disabled={!caja} />
          <Tab icon={<ViewList />} iconPosition="start" label="Historial" />
        </Tabs>
      </Paper>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 0: GESTIÓN DE CAJA */}
      {/* ══════════════════════════════════════════════════════════════ */}
 {tab === 0 && (
  <Box>
    {loadingCaja ? (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <CircularProgress sx={{ color: "var(--primary)" }} />
        <Typography sx={{ mt: 2, color: "#64748b" }}>Cargando estado...</Typography>
      </Box>
    ) : caja ? (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Box sx={{
            backgroundColor: "#dcfce7",
            borderRadius: 2,
            p: 1.5,
            display: "flex"
          }}>
            <CheckCircle sx={{ color: "#16a34a", fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--text-primary)", ...mono }}>
              Caja Abierta
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              {fmtFecha(caja.fecha_apertura)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: 2, 
          mb: 3 
        }}>
          {[
            { label: "Monto inicial", value: `$${fmt(caja.monto_inicial)}`, icon: "💵" },
            { 
              label: "Usuario", 
              value: (() => {
                // Intentar obtener el nombre del usuario de varias fuentes
                if (user?.nombre && user?.apellido) {
                  return `${user.nombre} ${user.apellido}`;
                }
                if (user?.email) {
                  return user.email.split('@')[0]; // Muestra la parte antes del @
                }
                return user?.email || "N/A";
              })(), 
              icon: "👤" 
            },
            { 
              label: "Kiosco", 
              value: (() => {
                // Intentar obtener el nombre del kiosco
                if (user?.kiosco_nombre) {
                  return user.kiosco_nombre;
                }
                if (user?.kiosco_id && kioscos.length > 0) {
                  const userKiosco = kioscos.find(k => Number(k.id) === Number(user.kiosco_id));
                  if (userKiosco) return userKiosco.nombre;
                }
                return user?.kiosco_id ? `Kiosco #${user.kiosco_id}` : "N/A";
              })(), 
              icon: "🏪" 
            },
          ].map(({ label, value, icon }) => (
            <Box 
              key={label}
              sx={{ 
                p: 2.5, 
                backgroundColor: "var(--bg-soft)", 
                borderRadius: 2,
                border: "1px solid #e2e8f0",
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  transform: "translateY(-2px)"
                }
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  color: "#64748b", 
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mb: 0.5,
                  fontSize: "0.75rem"
                }}
              >
                <span>{icon}</span> {label}
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 800, 
                  color: "var(--text-primary)", 
                  ...mono,
                  fontSize: "1.1rem"
                }}
              >
                {value}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ 
          display: "flex", 
          gap: 2, 
          alignItems: "flex-end",
          p: 3,
          backgroundColor: "var(--warning-light)",
          borderRadius: 2,
          border: "2px solid #fbbf24"
        }}>
          <TextField
            label="Monto en efectivo contado"
            type="number"
            value={montoCierre}
            onChange={(e) => setMontoCierre(e.target.value)}
            fullWidth
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "white",
                fontWeight: 700,
                ...mono
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AttachMoney sx={{ color: "#f59e0b" }} />
                </InputAdornment>
              )
            }}
          />
          <Button
            variant="contained"
            onClick={cerrarCaja}
            startIcon={<Lock />}
            sx={{ 
              minWidth: 160,
              py: 1.8,
              px: 3,
              fontWeight: 800,
              ...mono,
              background: "linear-gradient(135deg, #f59e0b 0%, var(--warning) 100%)",
              boxShadow: "0 4px 12px rgba(245,158,11,0.3)",
              "&:hover": {
                background: "linear-gradient(135deg, var(--warning) 0%, #b45309 100%)",
                transform: "translateY(-2px)",
                boxShadow: "0 6px 20px rgba(245,158,11,0.4)"
              },
              transition: "all 0.3s ease"
            }}
          >
            Cerrar Caja
          </Button>
        </Box>

        <ResumenCierre ventas={ventas} montoInicial={caja.monto_inicial} montoContado={montoCierre} />
      </Paper>
    ) : (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 5, 
          textAlign: "center",
          borderRadius: 3,
          border: "2px dashed #cbd5e1",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
        }}
      >
        <Box sx={{
          display: "inline-flex",
          backgroundColor: "var(--error-light)",
          borderRadius: 3,
          p: 2,
          mb: 3
        }}>
          <Lock sx={{ fontSize: 48, color: "var(--error)" }} />
        </Box>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 800, color: "var(--text-primary)", ...mono }}>
          Caja Cerrada
        </Typography>
        <Typography sx={{ mb: 4, color: "#64748b", maxWidth: 400, mx: "auto" }}>
          Para comenzar a operar, abrí una nueva caja ingresando el monto inicial en efectivo.
        </Typography>

        {isAdmin && kioscos.length > 0 && (
          <FormControl 
            fullWidth 
            sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
          >
            <InputLabel>Seleccionar kiosco</InputLabel>
            <Select
              value={selectedKiosco}
              onChange={(e) => setSelectedKiosco(e.target.value)}
              label="Seleccionar kiosco"
              sx={{
                backgroundColor: "white",
                fontWeight: 700,
                ...mono
              }}
            >
              {kioscos.map((k) => (
                <MenuItem key={k.id} value={k.id}>
                  🏪 {k.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <Box sx={{ 
          display: "flex", 
          gap: 2, 
          justifyContent: "center",
          maxWidth: 500,
          mx: "auto"
        }}>
          <TextField
            label="Monto inicial en efectivo"
            type="number"
            value={montoInicial}
            onChange={(e) => setMontoInicial(e.target.value)}
            fullWidth
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "white",
                fontWeight: 700,
                ...mono
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AttachMoney sx={{ color: "var(--primary)" }} />
                </InputAdornment>
              )
            }}
          />
          <Button
            variant="contained"
            onClick={abrirCaja}
            startIcon={<LockOpen />}
            sx={{ 
              minWidth: 160,
              py: 1.8,
              px: 3,
              fontWeight: 800,
              ...mono,
              background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
              boxShadow: "0 4px 12px rgba(102,126,234,0.3)",
              "&:hover": {
                background: "linear-gradient(135deg, #764ba2 0%, var(--primary) 100%)",
                transform: "translateY(-2px)",
                boxShadow: "0 6px 20px rgba(102,126,234,0.4)"
              },
              transition: "all 0.3s ease"
            }}
          >
            Abrir Caja
          </Button>
        </Box>
      </Paper>
    )}
  </Box>
)}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 1: NUEVA VENTA */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {tab === 1 && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 400px" }, gap: 3 }}>
          
          {/* ── IZQUIERDA: PRODUCTOS ── */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 3, 
                fontWeight: 800, 
                color: "var(--text-primary)",
                ...mono,
                display: "flex",
                alignItems: "center",
                gap: 1
              }}
            >
              <ShoppingCart sx={{ color: "var(--primary)" }} /> Productos
            </Typography>

            {lastTicket && (
              <Box sx={{
                mb: 3,
                p: 2,
                background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
                borderRadius: 2,
                border: "2px solid #86efac",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <Box>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: "#166534", 
                      fontWeight: 800, 
                      display: "block",
                      fontSize: "0.7rem"
                    }}
                  >
                    ✅ VENTA EXITOSA
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#166534", fontWeight: 700, ...mono }}>
                    Ticket #{lastTicket.numero} · ${fmt(lastTicket.total)}
                  </Typography>
                  {lastTicket.vuelto > 0 && (
                    <Typography variant="caption" sx={{ color: "#166534", ...mono }}>
                      Vuelto: ${fmt(lastTicket.vuelto)}
                    </Typography>
                  )}
                </Box>
                <IconButton 
                  size="small" 
                  onClick={() => setLastTicket(null)}
                  sx={{ color: "#166534" }}
                >
                  <Clear />
                </IconButton>
              </Box>
            )}

            <Box sx={{ display: "flex", gap: 1.5, mb: 3, flexWrap: "wrap" }}>
              <TextField
                inputRef={barcodeRef}
                label="Código de barras"
                value={codigoBarra}
                onChange={(e) => setCodigoBarra(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && agregarPorCodigo()}
                placeholder="Escaneá o escribí..."
                fullWidth
                variant="outlined"
                sx={{
                  flex: 1,
                  minWidth: 200,
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    fontWeight: 600,
                    ...mono
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <QrCode sx={{ color: "var(--primary)" }} />
                    </InputAdornment>
                  )
                }}
              />
<Button
  variant="outlined"
  onClick={handleOpenCamera}
  startIcon={<CameraAlt />}
  sx={{
    fontWeight: 700,
    ...mono,
    borderColor: "var(--primary)",
    color: "var(--primary)",
    "&:hover": {
      backgroundColor: "rgba(102,126,234,0.1)",
      borderColor: "#764ba2"
    }
  }}
>
  Cámara
</Button>
              <Button
                variant="outlined"
                onClick={() => setDialogOpen(true)}
                startIcon={<AddShoppingCart />}
                sx={{
                  fontWeight: 700,
                  ...mono,
                  borderColor: "var(--primary)",
                  color: "var(--primary)",
                  "&:hover": {
                    backgroundColor: "rgba(102,126,234,0.1)",
                    borderColor: "#764ba2"
                  }
                }}
              >
                Catálogo
              </Button>
            </Box>

            {items.length === 0 ? (
              <Box sx={{ 
                py: 8, 
                textAlign: "center",
                backgroundColor: "var(--bg-soft)",
                borderRadius: 2,
                border: "2px dashed #cbd5e1"
              }}>
                <ShoppingCart sx={{ fontSize: 64, color: "#cbd5e1", mb: 2 }} />
                <Typography sx={{ color: "#94a3b8", fontWeight: 600 }}>
                  El carrito está vacío
                </Typography>
                <Typography variant="caption" sx={{ color: "#cbd5e1" }}>
                  Escaneá o buscá productos para comenzar
                </Typography>
              </Box>
            ) : (
              <Box sx={{ 
                border: "1px solid #e2e8f0", 
                borderRadius: 2, 
                overflow: "hidden",
                backgroundColor: "white"
              }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "var(--bg-soft)" }}>
                      <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)", ...mono }}>Producto</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-secondary)", ...mono }}>Cant.</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: "var(--text-secondary)", ...mono }}>Precio</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: "var(--text-secondary)", ...mono }}>Subtotal</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-secondary)", ...mono }}>-</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((p) => (
                      <TableRow 
                        key={p.id}
                        sx={{
                          "&:hover": {
                            backgroundColor: "var(--bg-soft)"
                          },
                          transition: "all 0.2s ease"
                        }}
                      >
                        <TableCell sx={{ ...mono, fontWeight: 600 }}>
                          {p.nombre}
                          {p.codigo_barra && (
                            <Typography variant="caption" sx={{ display: "block", color: "#94a3b8" }}>
                              {p.codigo_barra}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                            <IconButton 
                              size="small" 
                              onClick={() => cambiarCantidad(p.id, -1)}
                              sx={{
                                backgroundColor: "var(--error-light)",
                                color: "var(--error)",
                                "&:hover": { backgroundColor: "#fecaca" }
                              }}
                            >
                              <Remove fontSize="small" />
                            </IconButton>
                            <TextField
                              value={p.cantidad}
                              onChange={(e) => setCantidadDirecta(p.id, e.target.value)}
                              type="number"
                              size="small"
                              sx={{ 
                                width: 60, 
                                "& input": { 
                                  textAlign: "center", 
                                  fontWeight: 800, 
                                  ...mono 
                                } 
                              }}
                            />
                            <IconButton 
                              size="small" 
                              onClick={() => cambiarCantidad(p.id, 1)}
                              sx={{
                                backgroundColor: "#dcfce7",
                                color: "#16a34a",
                                "&:hover": { backgroundColor: "#bbf7d0" }
                              }}
                            >
                              <Add fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ ...mono, fontWeight: 700 }}>
                          ${fmt(p.precio)}
                        </TableCell>
                        <TableCell align="right" sx={{ ...mono, fontWeight: 800, color: "var(--primary)", fontSize: "1.05rem" }}>
                          ${fmt(p.precio * p.cantidad)}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton 
                            size="small" 
                            onClick={() => quitarItem(p.id)}
                            sx={{
                              color: "var(--error)",
                              "&:hover": {
                                backgroundColor: "var(--error-light)"
                              }
                            }}
                          >
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
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                borderRadius: 3,
                border: "2px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                position: "sticky",
                top: 20
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3, 
                  fontWeight: 800, 
                  color: "var(--text-primary)",
                  ...mono,
                  display: "flex",
                  alignItems: "center",
                  gap: 1
                }}
              >
                <Receipt sx={{ color: "var(--primary)" }} /> Resumen
              </Typography>

              <Box sx={{ 
                mb: 3, 
                p: 2.5, 
                background: "linear-gradient(135deg, var(--bg-soft) 0%, #f1f5f9 100%)",
                borderRadius: 2,
                border: "1px solid #e2e8f0"
              }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                  <Typography sx={{ color: "#64748b", fontWeight: 600 }}>Items:</Typography>
                  <Typography sx={{ color: "var(--text-primary)", fontWeight: 800, ...mono }}>
                    {items.reduce((acc, p) => acc + p.cantidad, 0)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="h6" sx={{ color: "var(--text-primary)", fontWeight: 800 }}>
                    TOTAL:
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      color: "var(--primary)", 
                      fontWeight: 900, 
                      ...mono 
                    }}
                  >
                    ${fmt(total)}
                  </Typography>
                </Box>
              </Box>

              <Typography 
                variant="caption" 
                sx={{ 
                  display: "block", 
                  mb: 2, 
                  color: "#64748b", 
                  fontWeight: 700,
                  letterSpacing: "0.05em"
                }}
              >
                💳 MÉTODOS DE PAGO
              </Typography>

              <TextField
                label="Efectivo"
                type="number"
                value={pagoEfectivo}
                onChange={(e) => setPagoEfectivo(e.target.value)}
                fullWidth
                sx={{ 
                  mb: 1.5,
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    fontWeight: 700,
                    ...mono
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney sx={{ color: "#16a34a" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button 
                        size="small" 
                        onClick={() => pagoRapido("efectivo")}
                        sx={{
                          fontWeight: 700,
                          ...mono,
                          fontSize: "0.7rem"
                        }}
                      >
                        Exacto
                      </Button>
                    </InputAdornment>
                  )
                }}
              />

              <TextField
                label="Mercado Pago"
                type="number"
                value={pagoMP}
                onChange={(e) => setPagoMP(e.target.value)}
                fullWidth
                sx={{ 
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    fontWeight: 700,
                    ...mono
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CreditCard sx={{ color: "#3b82f6" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button 
                        size="small" 
                        onClick={() => pagoRapido("mp")}
                        sx={{
                          fontWeight: 700,
                          ...mono,
                          fontSize: "0.7rem"
                        }}
                      >
                        Exacto
                      </Button>
                    </InputAdornment>
                  )
                }}
              />

              {totalPagado > 0 && (
                <Box sx={{ 
                  mb: 2, 
                  p: 2, 
                  borderRadius: 2,
                  backgroundColor: vuelto >= 0 ? "#dcfce7" : "var(--error-light)",
                  border: `2px solid ${vuelto >= 0 ? "#86efac" : "#fca5a5"}`
                }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 800, 
                        color: vuelto >= 0 ? "#166534" : "#991b1b"
                      }}
                    >
                      {vuelto >= 0 ? "Vuelto:" : "Falta:"}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 900, 
                        ...mono, 
                        color: vuelto >= 0 ? "#166534" : "#991b1b"
                      }}
                    >
                      ${fmt(Math.abs(vuelto))}
                    </Typography>
                  </Box>
                </Box>
              )}

              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Button
                  variant="outlined"
                  onClick={limpiarVenta}
                  fullWidth
                  startIcon={<Clear />}
                  sx={{
                    py: 1.8,
                    fontWeight: 800,
                    ...mono,
                    borderColor: "#cbd5e1",
                    color: "#64748b",
                    "&:hover": {
                      backgroundColor: "var(--bg-soft)",
                      borderColor: "#94a3b8"
                    }
                  }}
                >
                  Limpiar
                </Button>
                <Button
                  variant="contained"
                  onClick={confirmarVenta}
                  disabled={procesandoVenta || items.length === 0}
                  fullWidth
                  startIcon={procesandoVenta ? <CircularProgress size={20} /> : <PointOfSale />}
                  sx={{
                    py: 1.8,
                    fontWeight: 800,
                    ...mono,
                    background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                    boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 6px 20px rgba(22,163,74,0.4)"
                    },
                    transition: "all 0.3s ease",
                    "&:disabled": {
                      background: "#e2e8f0",
                      color: "#94a3b8"
                    }
                  }}
                >
                  {procesandoVenta ? "Procesando..." : "Cobrar"}
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 2: HISTORIAL */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {tab === 2 && (
        <Box>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              mb: 3,
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}
          >
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", mb: 3 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  label="Estado"
                  sx={{
                    fontWeight: 700,
                    ...mono
                  }}
                >
                  <MenuItem value="todas">📋 Todas</MenuItem>
                  <MenuItem value="ok">✅ Confirmadas</MenuItem>
                  <MenuItem value="anuladas">❌ Anuladas</MenuItem>
                </Select>
              </FormControl>

              <TextField
                type="date"
                label="Fecha"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  minWidth: 200,
                  "& .MuiOutlinedInput-root": {
                    fontWeight: 700,
                    ...mono
                  }
                }}
              />

              <Button
                variant="outlined"
                onClick={() => { setFiltroEstado("todas"); setFiltroFecha(""); }}
                startIcon={<Clear />}
                sx={{
                  fontWeight: 700,
                  ...mono,
                  borderColor: "#cbd5e1",
                  color: "#64748b"
                }}
              >
                Limpiar
              </Button>

              <Box sx={{ flex: 1 }} />

              <Tooltip title="Recargar historial">
                <IconButton 
                  onClick={cargarVentas}
                  sx={{
                    backgroundColor: "var(--bg-soft)",
                    "&:hover": {
                      backgroundColor: "#e2e8f0"
                    }
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>

            <Box sx={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: 2 
            }}>
              {[
                { label: "Total ventas", value: ventasFiltradas.length, icon: "📊" },
                { label: "Confirmadas", value: ventasFiltradas.filter(v => !v.anulada).length, icon: "✅" },
                { label: "Anuladas", value: ventasFiltradas.filter(v => v.anulada).length, icon: "❌" },
                { label: "Total facturado", value: `$${fmt(totalHistorial)}`, icon: "💰" },
              ].map(({ label, value, icon }) => (
                <Box 
                  key={label}
                  sx={{ 
                    p: 2, 
                    backgroundColor: "var(--bg-soft)", 
                    borderRadius: 2,
                    border: "1px solid #e2e8f0",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      transform: "translateY(-2px)"
                    }
                  }}
                >
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: "#64748b", 
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mb: 0.5,
                      fontSize: "0.7rem"
                    }}
                  >
                    <span>{icon}</span> {label}
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 900, 
                      color: "var(--text-primary)", 
                      ...mono 
                    }}
                  >
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          {loadingHistorial ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <CircularProgress sx={{ color: "var(--primary)" }} />
              <Typography sx={{ mt: 2, color: "#64748b" }}>Cargando historial...</Typography>
            </Box>
          ) : ventasFiltradas.length === 0 ? (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 8, 
                textAlign: "center",
                borderRadius: 3,
                border: "2px dashed #cbd5e1"
              }}
            >
              <ViewList sx={{ fontSize: 64, color: "#cbd5e1", mb: 2 }} />
              <Typography sx={{ color: "#94a3b8", fontWeight: 600 }}>
                No hay ventas registradas
              </Typography>
            </Paper>
          ) : (
            <Paper 
              elevation={0} 
              sx={{ 
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                overflow: "hidden"
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "var(--bg-soft)" }}>
                    <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)", ...mono }}>Ticket</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)", ...mono }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)", ...mono }}>Usuario</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: "var(--text-secondary)", ...mono }}>Total</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-secondary)", ...mono }}>Estado</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-secondary)", ...mono }}>-</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ventasFiltradas.map((v) => (
                    <TableRow 
                      key={v.id}
                      sx={{
                        backgroundColor: v.anulada ? "#fef2f2" : "white",
                        "&:hover": {
                          backgroundColor: v.anulada ? "var(--error-light)" : "var(--bg-soft)"
                        },
                        transition: "all 0.2s ease"
                      }}
                    >
                      <TableCell sx={{ ...mono, fontWeight: 800, color: "var(--primary)" }}>
                        #{v.ticket_numero}
                      </TableCell>
                      <TableCell sx={{ ...mono }}>
                        {fmtFecha(v.fecha)}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {v.usuario_nombre || "N/A"}
                      </TableCell>
                      <TableCell align="right" sx={{ ...mono, fontWeight: 800, fontSize: "1.05rem" }}>
                        ${fmt(v.total)}
                      </TableCell>
                      <TableCell align="center">
                        {v.anulada ? (
                          <Chip 
                            icon={<Cancel />} 
                            label="Anulada" 
                            size="small" 
                            sx={{ 
                              backgroundColor: "var(--error-light)", 
                              color: "#991b1b",
                              fontWeight: 700,
                              ...mono
                            }} 
                          />
                        ) : (
                          <Chip 
                            icon={<CheckCircle />} 
                            label="OK" 
                            size="small" 
                            sx={{ 
                              backgroundColor: "#dcfce7", 
                              color: "#166534",
                              fontWeight: 700,
                              ...mono
                            }} 
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Button 
                          size="small" 
                          onClick={() => verDetalle(v.id)}
                          sx={{
                            fontWeight: 700,
                            ...mono,
                            color: "var(--primary)",
                            "&:hover": {
                              backgroundColor: "rgba(102,126,234,0.1)"
                            }
                          }}
                        >
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* DIALOGS */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {/* ── DIALOG: CATÁLOGO ── */}
      <Dialog 
        open={dialogOpen} 
        onClose={cancelarDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)"
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2,
          borderBottom: "1px solid #e2e8f0",
          fontWeight: 800,
          ...mono,
          display: "flex",
          alignItems: "center",
          gap: 1
        }}>
          <AddShoppingCart sx={{ color: "var(--primary)" }} />
          Catálogo de Productos
          {cantSeleccionados > 0 && (
            <Chip 
              label={`${cantSeleccionados} seleccionados`}
              size="small"
              sx={{
                ml: 1,
                backgroundColor: "#dcfce7",
                color: "#166534",
                fontWeight: 700
              }}
            />
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            placeholder="Buscar por nombre o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            fullWidth
            sx={{ 
              mb: 2,
              "& .MuiOutlinedInput-root": {
                fontWeight: 600,
                ...mono
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "var(--primary)" }} />
                </InputAdornment>
              )
            }}
          />

          {loadingProductos ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CircularProgress sx={{ color: "var(--primary)" }} />
            </Box>
          ) : (
            <>
              <Box sx={{ 
                border: "1px solid #e2e8f0", 
                borderRadius: 2, 
                overflow: "hidden",
                mb: 2 
              }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "var(--bg-soft)" }}>
                      <TableCell padding="checkbox"></TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)", ...mono }}>Producto</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: "var(--text-secondary)", ...mono }}>Precio</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-secondary)", ...mono }}>Cantidad</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {productosPaginados.map((p) => (
                      <TableRow 
                        key={p.id}
                        sx={{
                          "&:hover": {
                            backgroundColor: "var(--bg-soft)"
                          }
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={!!seleccionados[p.id]}
                            onChange={() => toggleSeleccion(p)}
                            sx={{
                              color: "var(--primary)",
                              "&.Mui-checked": {
                                color: "var(--primary)"
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {p.nombre}
                          {p.codigo_barra && (
                            <Typography variant="caption" sx={{ display: "block", color: "#94a3b8", ...mono }}>
                              {p.codigo_barra}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ ...mono, fontWeight: 700, color: "var(--primary)" }}>
                          ${fmt(p.precio)}
                        </TableCell>
                        <TableCell align="center">
                          {seleccionados[p.id] && (
                            <TextField
                              type="number"
                              value={seleccionados[p.id].cantidad}
                              onChange={(e) => setSelCantidad(p.id, e.target.value)}
                              size="small"
                              sx={{ 
                                width: 70,
                                "& input": {
                                  textAlign: "center",
                                  fontWeight: 700,
                                  ...mono
                                }
                              }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>

              <TablePagination
                component="div"
                count={productosFiltrados.length}
                page={prodPage}
                onPageChange={(_, p) => setProdPage(p)}
                rowsPerPage={prodRowsPerPage}
                onRowsPerPageChange={(e) => { setProdRowsPerPage(parseInt(e.target.value)); setProdPage(0); }}
                labelRowsPerPage="Filas:"
                sx={{ ...mono }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: 2.5, 
          borderTop: "1px solid #e2e8f0",
          gap: 1.5
        }}>
          <Button 
            onClick={cancelarDialog}
            sx={{
              fontWeight: 700,
              ...mono,
              color: "#64748b"
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={confirmarSeleccion}
            disabled={cantSeleccionados === 0}
            startIcon={<AddShoppingCart />}
            sx={{
              fontWeight: 800,
              ...mono,
              background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
              boxShadow: "0 4px 12px rgba(102,126,234,0.3)",
              "&:hover": {
                background: "linear-gradient(135deg, #764ba2 0%, var(--primary) 100%)"
              },
              "&:disabled": {
                background: "#e2e8f0",
                color: "#94a3b8"
              }
            }}
          >
            Agregar ({cantSeleccionados})
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── DIALOG: DETALLE VENTA ── */}
      <Dialog 
        open={detalleOpen} 
        onClose={() => setDetalleOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)"
          }
        }}
      >
        {ventaDetalle && (
          <>
            <DialogTitle sx={{ 
              pb: 2,
              borderBottom: "1px solid #e2e8f0",
              fontWeight: 800,
              ...mono
            }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Receipt sx={{ color: "var(--primary)" }} />
                  Ticket #{ventaDetalle.ticket_numero}
                </Box>
                {ventaDetalle.anulada ? (
                  <Chip 
                    icon={<Cancel />} 
                    label="ANULADA" 
                    sx={{ 
                      backgroundColor: "var(--error-light)", 
                      color: "#991b1b",
                      fontWeight: 800
                    }} 
                  />
                ) : (
                  <Chip 
                    icon={<CheckCircle />} 
                    label="CONFIRMADA" 
                    sx={{ 
                      backgroundColor: "#dcfce7", 
                      color: "#166534",
                      fontWeight: 800
                    }} 
                  />
                )}
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Box sx={{ 
                mb: 3, 
                p: 2, 
                backgroundColor: "var(--bg-soft)", 
                borderRadius: 2,
                border: "1px solid #e2e8f0"
              }}>
                {[
                  { label: "Fecha", value: fmtFecha(ventaDetalle.fecha) },
                  { label: "Usuario", value: ventaDetalle.usuario_nombre || "N/A" },
                  { label: "Kiosco", value: ventaDetalle.kiosco_nombre || "N/A" },
                ].map(({ label, value }) => (
                  <Box key={label} sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                      {label}:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, ...mono }}>
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Typography 
                variant="caption" 
                sx={{ 
                  display: "block", 
                  mb: 1.5, 
                  color: "#64748b", 
                  fontWeight: 800,
                  letterSpacing: "0.05em"
                }}
              >
                🛍️ PRODUCTOS
              </Typography>
              <Box sx={{ 
                border: "1px solid #e2e8f0", 
                borderRadius: 2, 
                overflow: "hidden",
                mb: 3
              }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "var(--bg-soft)" }}>
                      <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)", ...mono }}>Producto</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-secondary)", ...mono }}>Cant.</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: "var(--text-secondary)", ...mono }}>Precio</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: "var(--text-secondary)", ...mono }}>Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ventaDetalle.productos.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontWeight: 600 }}>{p.producto_nombre}</TableCell>
                        <TableCell align="center" sx={{ ...mono, fontWeight: 700 }}>{p.cantidad}</TableCell>
                        <TableCell align="right" sx={{ ...mono }}>${fmt(p.precio)}</TableCell>
                        <TableCell align="right" sx={{ ...mono, fontWeight: 800, color: "var(--primary)" }}>
                          ${fmt(p.cantidad * p.precio)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>

              <Typography 
                variant="caption" 
                sx={{ 
                  display: "block", 
                  mb: 1.5, 
                  color: "#64748b", 
                  fontWeight: 800,
                  letterSpacing: "0.05em"
                }}
              >
                💳 PAGOS
              </Typography>
              <Box sx={{ mb: 3 }}>
                {ventaDetalle.pagos.map((pago, i) => (
                  <Box 
                    key={i} 
                    sx={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      p: 1.5, 
                      backgroundColor: "var(--bg-soft)",
                      borderRadius: 2,
                      border: "1px solid #e2e8f0",
                      mb: 1
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {pago.tipo === "EFECTIVO" ? (
                        <AttachMoney sx={{ color: "#16a34a" }} />
                      ) : (
                        <CreditCard sx={{ color: "#3b82f6" }} />
                      )}
                      <Typography sx={{ fontWeight: 700, ...mono }}>
                        {pago.tipo}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 900, ...mono, fontSize: "1.05rem" }}>
                      ${fmt(pago.monto)}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ 
                p: 2.5, 
                background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
                borderRadius: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <Typography variant="h6" sx={{ color: "white", fontWeight: 800 }}>
                  TOTAL:
                </Typography>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    color: "white", 
                    fontWeight: 900, 
                    ...mono,
                    textShadow: "0 2px 8px rgba(0,0,0,0.2)"
                  }}
                >
                  ${fmt(ventaDetalle.total)}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ 
              p: 2.5, 
              borderTop: "1px solid #e2e8f0",
              gap: 1.5
            }}>
              <Button 
                onClick={() => setDetalleOpen(false)}
                sx={{
                  fontWeight: 700,
                  ...mono
                }}
              >
                Cerrar
              </Button>
              {!ventaDetalle.anulada && isAdmin && (
                <Button
                  variant="contained"
                  onClick={() => anularVenta(ventaDetalle.id)}
                  startIcon={<Cancel />}
                  sx={{
                    fontWeight: 800,
                    ...mono,
                    backgroundColor: "var(--error)",
                    "&:hover": {
                      backgroundColor: "#b91c1c"
                    }
                  }}
                >
                  Anular Venta
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── DIALOG: SCANNER CÁMARA ── */}
      <Dialog 
        open={cameraOpen} 
        onClose={() => setCameraOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)"
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2,
          borderBottom: "1px solid #e2e8f0",
          fontWeight: 800,
          ...mono,
          display: "flex",
          alignItems: "center",
          gap: 1
        }}>
          <CameraAlt sx={{ color: "var(--primary)" }} />
          Escanear Código de Barras
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <CameraScanner onDetected={handleCameraDetected} />
        </DialogContent>
        <DialogActions sx={{ 
          p: 2.5, 
          borderTop: "1px solid #e2e8f0"
        }}>
          <Button 
            onClick={() => setCameraOpen(false)}
            variant="contained"
            fullWidth
            sx={{
              fontWeight: 800,
              ...mono,
              background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #764ba2 0%, var(--primary) 100%)"
              }
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── SNACKBAR ── */}
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
          sx={{ 
            fontWeight: 700,
            ...mono,
            borderRadius: 2,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)"
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CajaVentas;