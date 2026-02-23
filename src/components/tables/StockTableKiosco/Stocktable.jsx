// components/tables/StockTable.jsx
// ─────────────────────────────────────────────────────────────────
// Componente principal de gestión de stock.
// Toda la lógica de estado y fetch vive aquí; los tres tabs
// (TabResumen, TabStock, TabInventario) son componentes presentacionales.
//
// "Realizado por" en inventarios:
//   El backend guarda empleado_id en la tabla inventarios y lo devuelve
//   como empleado_nombre en el GET /stock/inventarios.
//   Inventarios anteriores a la migración mostrarán "—" en ese campo.
// ─────────────────────────────────────────────────────────────────
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import {
  Box, Paper, Typography, Chip, Tabs, Tab, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Alert, IconButton, Tooltip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Snackbar,
} from "@mui/material";
import {
  NotificationsActive, Save, Cancel, Edit, History, TrendingUp,
  ArrowUpward, ArrowDownward, Visibility, Person, PictureAsPdf,
  CheckCircle,
} from "@mui/icons-material";
import { CircularProgress as CP } from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { API_URL, TIPO_CONFIG, buildFiltroTexto, fmtFecha } from "./Stockutils";
import TabResumen    from "./TabResumen";
import TabStock      from "./TabStock";
import TabInventario from "./TabInventario";

// ─────────────────────────────────────────────────────────────────
const StockTable = () => {
  const { usuario } = useAuth();
  const location    = useLocation();
  const esKiosco    = location.pathname.startsWith("/kiosco");

  // ── Datos base ──
  const [stock,       setStock]       = useState([]);
  const [kioscos,     setKioscos]     = useState([]);
  const [productos,   setProductos]   = useState([]);
  const [productosMap, setProductosMap] = useState({});
  const [loading,     setLoading]     = useState(true);
  const [logoBase64,  setLogoBase64]  = useState(null);

  // ── Tab ──
  const [activeTab, setActiveTab] = useState(0);

  // ── Resumen / alertas ──
  const [resumen,         setResumen]         = useState([]);
  const [alertas,         setAlertas]         = useState([]);
  const [loadingResumen,  setLoadingResumen]  = useState(false);
  const [loadingAlertas,  setLoadingAlertas]  = useState(false);

  // ── Filtros / tabla de stock ──
  const [filteredStock,       setFilteredStock]       = useState([]);
  const [searchText,          setSearchText]          = useState("");
  const [kioscoFilter,        setKioscoFilter]        = useState("");
  const [productoFilter,      setProductoFilter]      = useState("");
  const [stockStatus,         setStockStatus]         = useState("");
  const [showInactiveProducts, setShowInactiveProducts] = useState(true);
  const [precioMin,           setPrecioMin]           = useState("");
  const [precioMax,           setPrecioMax]           = useState("");
  const [orderBy,             setOrderBy]             = useState("id");
  const [orderDirection,      setOrderDirection]      = useState("asc");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [page,                setPage]                = useState(0);
  const [rowsPerPage,         setRowsPerPage]         = useState(15);
  const [generatingPDF,       setGeneratingPDF]       = useState(false);

  // ── Inventario semanal ──
  const [kioscoInventario,       setKioscoInventario]       = useState("");
  const [inventarioItems,        setInventarioItems]        = useState([]);
  const [loadingInventario,      setLoadingInventario]      = useState(false);
  const [savingInventario,       setSavingInventario]       = useState(false);
  const [observacionesInventario, setObservacionesInventario] = useState("");
  const [invItemsPage,           setInvItemsPage]           = useState(0);
  const [invItemsRowsPerPage,    setInvItemsRowsPerPage]    = useState(15);

  // ── Empleado responsable ──
  const [fichadosAhora,   setFichadosAhora]   = useState([]);
  const [loadingFichados, setLoadingFichados] = useState(false);
  const [empleadoInventario, setEmpleadoInventario] = useState("");

  // ── Historial de inventarios ──
  const [historialInventarios, setHistorialInventarios] = useState([]);
  const [loadingHistorialInv,  setLoadingHistorialInv]  = useState(false);
  const [invHistPage,          setInvHistPage]          = useState(0);
  const [invHistRowsPerPage,   setInvHistRowsPerPage]   = useState(10);
  const [showHistorialInv,     setShowHistorialInv]     = useState(false);
  const [inventarioDetalle,    setInventarioDetalle]    = useState(null);
  const [loadingDetalle,       setLoadingDetalle]       = useState(false);
  const [detalleDialogOpen,    setDetalleDialogOpen]    = useState(false);
  const [detalleMode,          setDetalleMode]          = useState("view");
  const [generatingPDFInv,     setGeneratingPDFInv]     = useState(false);

  // ── Movimiento rápido ──
  const [movimientoDialogOpen, setMovimientoDialogOpen] = useState(false);
  const [movimientoStockItem,  setMovimientoStockItem]  = useState(null);
  const [movimientoTipo,       setMovimientoTipo]       = useState("ingreso");
  const [movimientoCantidad,   setMovimientoCantidad]   = useState("");
  const [movimientoMotivo,     setMovimientoMotivo]     = useState("");
  const [savingMovimiento,     setSavingMovimiento]     = useState(false);

  // ── Edición directa ──
  const [openDialog,    setOpenDialog]    = useState(false);
  const [editingStock,  setEditingStock]  = useState(null);
  const [editQuantity,  setEditQuantity]  = useState("");

  // ── Historial por ítem ──
  const [historialDialogOpen, setHistorialDialogOpen] = useState(false);
  const [historialItems,      setHistorialItems]      = useState([]);
  const [loadingHistorial,    setLoadingHistorial]    = useState(false);
  const [historialStockItem,  setHistorialStockItem]  = useState(null);

  // ── Snackbar ──
  const [openSnackbar,    setOpenSnackbar]    = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // ─────────────────────────────────────────────────────────────────
  // Helpers de producto
  // ─────────────────────────────────────────────────────────────────
  const showSnackbarMsg      = (msg, sev = "success") => { setSnackbarMessage(msg); setSnackbarSeverity(sev); setOpenSnackbar(true); };
  const getProductoNombreSimple = id => productosMap[id]?.nombre ?? `Producto ${id}`;
  const getProductoPrecio       = id => parseFloat(productosMap[id]?.precio ?? 0);
  const getProductoPrecioCosto  = id => productosMap[id]?.precio_costo != null ? parseFloat(productosMap[id].precio_costo) : null;
  const getProductoMargen       = id => { const costo = getProductoPrecioCosto(id); if (costo === null) return null; return getProductoPrecio(id) - costo; };
  const fmtMargen               = (m) => m === null ? "—" : `$${m.toLocaleString("es-ES", { minimumFractionDigits: 0 })}`;
  const getProductoActivo       = id => productosMap[id]?.activo ?? true;
  const getProductoStockMinimo  = id => productosMap[id]?.stock_minimo ?? 0;

  // ─────────────────────────────────────────────────────────────────
  // Fetches
  // ─────────────────────────────────────────────────────────────────
  const fetchProductos = async () => {
    try {
      const r = await fetch(`${API_URL}/productos`, { credentials: "include" });
      if (r.ok) {
        const data = await r.json();
        setProductos(data);
        const map = {};
        data.forEach(p => (map[p.id] = p));
        setProductosMap(map);
      }
    } catch (e) { console.error(e); }
  };

  const fetchKioscos = async () => {
    try {
      const r = await fetch(`${API_URL}/kioscos`, { credentials: "include" });
      if (r.ok) setKioscos(await r.json());
    } catch (e) { console.error(e); }
  };

  const fetchStock = async () => {
    try {
      setLoading(true);
      const r = await fetch(`${API_URL}/stock`, { credentials: "include" });
      if (!r.ok) { if (r.status === 401) showSnackbarMsg("No autenticado.", "error"); return; }
      setStock(await r.json());
    } catch (e) { showSnackbarMsg("Error al cargar el stock", "error"); }
    finally { setLoading(false); }
  };

  const fetchResumen = async () => {
    try {
      setLoadingResumen(true);
      const r = await fetch(`${API_URL}/stock/resumen`, { credentials: "include" });
      if (r.ok) setResumen(await r.json());
    } catch (e) { console.error(e); }
    finally { setLoadingResumen(false); }
  };

  const fetchAlertas = async () => {
    try {
      setLoadingAlertas(true);
      const r = await fetch(`${API_URL}/stock/alertas`, { credentials: "include" });
      if (r.ok) setAlertas(await r.json());
    } catch (e) { console.error(e); }
    finally { setLoadingAlertas(false); }
  };

  const fetchFichadosAhora = async () => {
    try {
      setLoadingFichados(true);
      const r = await fetch(`${API_URL}/asistencias/fichados-ahora`, { credentials: "include" });
      if (r.ok) { const data = await r.json(); setFichadosAhora(data.empleados ?? []); }
    } catch (e) { console.error(e); }
    finally { setLoadingFichados(false); }
  };

  const fetchInventarioKiosco = async (kiosco_id) => {
    try {
      setLoadingInventario(true);
      const r = await fetch(`${API_URL}/stock/inventario/${kiosco_id}`, { credentials: "include" });
      if (r.ok) {
        const data = await r.json();
        setInventarioItems(data.map(i => ({ ...i, nueva_cantidad: i.cantidad })));
        setInvItemsPage(0);
      }
    } catch (e) { console.error(e); }
    finally { setLoadingInventario(false); }
  };

  const fetchHistorialInventarios = async () => {
    try {
      setLoadingHistorialInv(true);
      const url = esKiosco && usuario?.kiosco_id
        ? `${API_URL}/stock/inventarios?kiosco_id=${usuario.kiosco_id}`
        : `${API_URL}/stock/inventarios`;
      const r = await fetch(url, { credentials: "include" });
      if (r.ok) { setHistorialInventarios(await r.json()); setInvHistPage(0); }
    } catch (e) { console.error(e); }
    finally { setLoadingHistorialInv(false); }
  };

  const fetchHistorial = async (stock_id) => {
    try {
      setLoadingHistorial(true);
      const r = await fetch(`${API_URL}/stock/${stock_id}/historial?limit=30`, { credentials: "include" });
      if (r.ok) setHistorialItems(await r.json());
    } catch (e) { console.error(e); }
    finally { setLoadingHistorial(false); }
  };

  const fetchDetalleInventario = async (inventario) => {
    try {
      setLoadingDetalle(true);
      const fechaBase = new Date(inventario.created_at);
      const desde = new Date(fechaBase.getTime() - 3 * 60000).toISOString();
      const hasta  = new Date(fechaBase.getTime() + 3 * 60000).toISOString();

      const r = await fetch(`${API_URL}/stock/inventario/${inventario.kiosco_id}`, { credentials: "include" });
      if (!r.ok) { showSnackbarMsg("Error al cargar detalle", "error"); return; }
      const stockKiosco = await r.json();

      const promises = stockKiosco.map(async (s) => {
        try {
          const rh = await fetch(`${API_URL}/stock/${s.stock_id}/historial?tipo=inventario&desde=${desde}&hasta=${hasta}&limit=1`, { credentials: "include" });
          if (!rh.ok) return null;
          const movs = await rh.json();
          if (!movs.length) return null;
          const mov = movs[0];
          return { stock_id: s.stock_id, producto_id: s.producto_id, producto_nombre: s.producto_nombre, precio: parseFloat(s.precio), precio_costo: s.precio_costo != null ? parseFloat(s.precio_costo) : null, cantidad_antes: mov.cantidad_antes, cantidad_contada: mov.cantidad_despues, cantidad_delta: mov.cantidad_delta, nueva_cantidad: mov.cantidad_despues };
        } catch { return null; }
      });
      const items = (await Promise.all(promises)).filter(Boolean);
      setInventarioDetalle({
        ...inventario,
        items,
        kiosco_nombre: kioscos.find(k => k.id === inventario.kiosco_id)?.nombre ?? inventario.kiosco_nombre ?? `Kiosco ${inventario.kiosco_id}`,
      });
    } catch (e) { console.error(e); showSnackbarMsg("Error al cargar detalle del inventario", "error"); }
    finally { setLoadingDetalle(false); }
  };

  // ─────────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/logo.png")
      .then(r => { if (!r.ok) return; return r.blob(); })
      .then(blob => {
        if (!blob) return;
        const reader = new FileReader();
        reader.onloadend = () => setLogoBase64(reader.result);
        reader.readAsDataURL(blob);
      }).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([fetchProductos(), fetchKioscos(), fetchStock()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (esKiosco && usuario?.kiosco_id) {
      const id = usuario.kiosco_id.toString();
      setKioscoInventario(id);
      fetchInventarioKiosco(usuario.kiosco_id);
    }
     
  }, [esKiosco, usuario?.kiosco_id]);

  useEffect(() => {
    if (activeTab === 0) { fetchResumen(); fetchAlertas(); }
    if (activeTab === 2) { fetchHistorialInventarios(); fetchFichadosAhora(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Filtro + orden de stock
  useEffect(() => {
    let result = [...stock];
    if (searchText.trim()) {
      const s = searchText.toLowerCase().trim();
      result = result.filter(item => {
        const p = productosMap[item.producto_id];
        const k = kioscos.find(k => k.id === item.kiosco_id);
        return (p?.nombre?.toLowerCase().includes(s)) || (k?.nombre?.toLowerCase().includes(s)) || (p?.codigo_barra?.toLowerCase().includes(s)) || String(item.id).includes(s);
      });
    }
    if (kioscoFilter)   result = result.filter(i => i.kiosco_id.toString()   === kioscoFilter);
    if (productoFilter) result = result.filter(i => i.producto_id.toString() === productoFilter);
    if (precioMin)      result = result.filter(i => getProductoPrecio(i.producto_id) >= parseFloat(precioMin));
    if (precioMax)      result = result.filter(i => getProductoPrecio(i.producto_id) <= parseFloat(precioMax));
    if (stockStatus === "agotado")     result = result.filter(i => i.cantidad === 0);
    else if (stockStatus === "bajo")   result = result.filter(i => i.cantidad > 0 && i.cantidad <= 10);
    else if (stockStatus === "normal") result = result.filter(i => i.cantidad > 10);
    if (!showInactiveProducts) result = result.filter(i => getProductoActivo(i.producto_id));

    result.sort((a, b) => {
      let cA, cB;
      switch (orderBy) {
        case "producto": cA = getProductoNombreSimple(a.producto_id).toLowerCase(); cB = getProductoNombreSimple(b.producto_id).toLowerCase(); break;
        case "kiosco":   cA = kioscos.find(k => k.id === a.kiosco_id)?.nombre.toLowerCase() ?? ""; cB = kioscos.find(k => k.id === b.kiosco_id)?.nombre.toLowerCase() ?? ""; break;
        case "cantidad": cA = a.cantidad; cB = b.cantidad; break;
        case "precio":   cA = getProductoPrecio(a.producto_id); cB = getProductoPrecio(b.producto_id); break;
        default:         cA = a.id; cB = b.id;
      }
      if (cA < cB) return orderDirection === "asc" ? -1 : 1;
      if (cA > cB) return orderDirection === "asc" ?  1 : -1;
      return 0;
    });

    setFilteredStock(result);
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stock, kioscoFilter, productoFilter, showInactiveProducts, productosMap, searchText, precioMin, precioMax, stockStatus, orderBy, orderDirection, kioscos]);

  // ─────────────────────────────────────────────────────────────────
  // Handlers — Stock
  // ─────────────────────────────────────────────────────────────────
  const handleClearAllFilters = () => { setKioscoFilter(""); setProductoFilter(""); setSearchText(""); setPrecioMin(""); setPrecioMax(""); setStockStatus(""); setShowInactiveProducts(true); };

  const handleEditClick = item => { setEditingStock(item); setEditQuantity(item.cantidad.toString()); setOpenDialog(true); };

  const handleUpdateStock = async () => {
    const cant = parseInt(editQuantity);
    if (isNaN(cant) || cant < 0) { showSnackbarMsg("Cantidad inválida", "error"); return; }
    try {
      const r = await fetch(`${API_URL}/stock/${editingStock.id}`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cantidad: cant }) });
      if (!r.ok) { showSnackbarMsg({ 400: "Cantidad inválida", 401: "No autenticado", 403: "Sin permisos", 404: "No encontrado" }[r.status] || "Error", "error"); return; }
      const updated = await r.json();
      setStock(prev => prev.map(i => i.id === updated.id ? { ...i, cantidad: updated.cantidad } : i));
      setOpenDialog(false); setEditingStock(null); setEditQuantity("");
      showSnackbarMsg("Stock actualizado exitosamente");
    } catch (e) { showSnackbarMsg("Error al actualizar", "error"); }
  };

  const handleOpenMovimiento = item => { setMovimientoStockItem(item); setMovimientoTipo("ingreso"); setMovimientoCantidad(""); setMovimientoMotivo(""); setMovimientoDialogOpen(true); };

  const handleRegistrarMovimiento = async () => {
    const cant = parseInt(movimientoCantidad);
    if (isNaN(cant) || cant <= 0) { showSnackbarMsg("Cantidad debe ser mayor a 0", "error"); return; }
    setSavingMovimiento(true);
    try {
      const r = await fetch(`${API_URL}/stock/${movimientoStockItem.id}/movimiento`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: movimientoTipo, cantidad: cant, motivo: movimientoMotivo || undefined }) });
      if (!r.ok) { const d = await r.json(); showSnackbarMsg(d.message || "Error", "error"); return; }
      const d = await r.json();
      setStock(prev => prev.map(i => i.id === movimientoStockItem.id ? { ...i, cantidad: d.cantidad_nueva } : i));
      setMovimientoDialogOpen(false);
      showSnackbarMsg(`Movimiento de ${TIPO_CONFIG[movimientoTipo].label.toLowerCase()} registrado`);
    } catch (e) { showSnackbarMsg("Error al registrar movimiento", "error"); }
    finally { setSavingMovimiento(false); }
  };

  const handleOpenHistorial = async item => { setHistorialStockItem(item); setHistorialDialogOpen(true); await fetchHistorial(item.id); };

  // ─────────────────────────────────────────────────────────────────
  // Handlers — Inventario
  // ─────────────────────────────────────────────────────────────────
  const handleKioscoInventarioChange = async kiosco_id => {
    setKioscoInventario(kiosco_id);
    setInventarioItems([]);
    if (kiosco_id) await fetchInventarioKiosco(kiosco_id);
  };

  const handleInventarioCantidadChange = (stock_id, valor) => {
    setInventarioItems(prev => prev.map(i => i.stock_id === stock_id ? { ...i, nueva_cantidad: Math.max(0, parseInt(valor) || 0) } : i));
  };

  const handleConfirmarInventario = async () => {
    if (!kioscoInventario || inventarioItems.length === 0) { showSnackbarMsg("Seleccioná un kiosco", "warning"); return; }
    if (!empleadoInventario) { showSnackbarMsg("Seleccioná quién está realizando el inventario", "warning"); return; }
    setSavingInventario(true);
    try {
      const r = await fetch(`${API_URL}/stock/inventario/${kioscoInventario}`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: inventarioItems.map(i => ({ stock_id: i.stock_id, cantidad: i.nueva_cantidad })),
          observaciones: observacionesInventario || undefined,
          empleado_id: parseInt(empleadoInventario),
        }),
      });
      if (!r.ok) { const d = await r.json(); showSnackbarMsg(d.message || "Error", "error"); return; }
      const d = await r.json();
      const emp = fichadosAhora.find(e => e.empleado_id.toString() === empleadoInventario);
      const nombreDisplay = emp ? `${emp.nombre} ${emp.apellido}` : "el empleado seleccionado";
      showSnackbarMsg(`Inventario cerrado por ${nombreDisplay}: ${d.total_productos} productos · $${parseFloat(d.valor_total).toLocaleString("es-ES", { minimumFractionDigits: 0 })}`);
      await fetchStock();
      await fetchHistorialInventarios();
      setInventarioItems([]);
      setObservacionesInventario("");
      setEmpleadoInventario("");
      setInvItemsPage(0);
      if (esKiosco && usuario?.kiosco_id) {
        setKioscoInventario(usuario.kiosco_id.toString());
        await fetchInventarioKiosco(usuario.kiosco_id);
      } else {
        setKioscoInventario("");
      }
    } catch (e) { showSnackbarMsg("Error al cerrar inventario", "error"); }
    finally { setSavingInventario(false); }
  };

  const handleVerDetalle = async (inv, mode = "view") => {
    setDetalleMode(mode);
    setDetalleDialogOpen(true);
    setInventarioDetalle(null);
    await fetchDetalleInventario(inv);
  };

  const handleDetalleItemChange = (stock_id, valor) => {
    setInventarioDetalle(prev => ({ ...prev, items: prev.items.map(i => i.stock_id === stock_id ? { ...i, nueva_cantidad: Math.max(0, parseInt(valor) || 0) } : i) }));
  };

  const handleGuardarDesdeDetalle = async () => {
    if (!inventarioDetalle) return;
    setSavingInventario(true);
    try {
      const r = await fetch(`${API_URL}/stock/inventario/${inventarioDetalle.kiosco_id}`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: inventarioDetalle.items.map(i => ({ stock_id: i.stock_id, cantidad: i.nueva_cantidad })), observaciones: `Basado en inventario del ${fmtFecha(inventarioDetalle.created_at, false)}` }),
      });
      if (!r.ok) { const d = await r.json(); showSnackbarMsg(d.message || "Error", "error"); return; }
      showSnackbarMsg("Nuevo inventario guardado correctamente");
      setDetalleDialogOpen(false); setInventarioDetalle(null);
      await fetchStock(); await fetchHistorialInventarios();
    } catch (e) { showSnackbarMsg("Error al guardar", "error"); }
    finally { setSavingInventario(false); }
  };

  // ─────────────────────────────────────────────────────────────────
  // PDF — Stock
  // ─────────────────────────────────────────────────────────────────
  const handleDescargarPDF = async () => {
    if (filteredStock.length === 0) { showSnackbarMsg("No hay datos", "warning"); return; }
    setGeneratingPDF(true);
    try {
      const doc = new jsPDF({ orientation: "landscape" });
      const primary = [102, 126, 234], textC = [15, 23, 42], grayC = [100, 116, 139];
      const pageW = doc.internal.pageSize.getWidth();
      doc.setFillColor(...primary); doc.rect(0, 0, pageW, 45, "F");
      // eslint-disable-next-line no-empty
      if (logoBase64) { try { doc.addImage(logoBase64, "PNG", 14, 8, 30, 30); } catch {} }
      doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont(undefined, "bold");
      doc.text("Reporte de Stock", pageW / 2, 17, { align: "center" });
      doc.setFontSize(9); doc.setFont(undefined, "normal");
      doc.text(doc.splitTextToSize(buildFiltroTexto({ searchText, kioscoFilter, kioscos, productoFilter, productos, stockStatus, precioMin, precioMax, showInactiveProducts }), pageW - 110)[0], pageW / 2, 27, { align: "center" });
      doc.setFontSize(8); doc.setTextColor(...grayC);
      doc.text(`Generado: ${fmtFecha(new Date().toISOString())}`, pageW / 2, 42, { align: "center" });

      const totalReg = filteredStock.length, agotados = filteredStock.filter(i => i.cantidad === 0).length,
        bajoStock = filteredStock.filter(i => i.cantidad > 0 && i.cantidad <= 10).length,
        normal = filteredStock.filter(i => i.cantidad > 10).length,
        totalUnid = filteredStock.reduce((a, i) => a + i.cantidad, 0),
        valorTotal = filteredStock.reduce((a, i) => a + i.cantidad * getProductoPrecio(i.producto_id), 0);

      doc.setTextColor(...textC); doc.setFontSize(12); doc.setFont(undefined, "bold");
      doc.text("Resumen Estadístico", 14, 56); doc.setFontSize(10);
      const c1 = 14, c2 = pageW / 2 + 10;
      doc.setFont(undefined, "normal"); doc.text("Total registros:", c1, 64); doc.setFont(undefined, "bold"); doc.text(`${totalReg}`, c1 + 55, 64);
      doc.setFont(undefined, "normal"); doc.text("Total unidades:", c1, 70); doc.setFont(undefined, "bold"); doc.text(`${totalUnid.toLocaleString("es-ES")} unid.`, c1 + 55, 70);
      doc.setFont(undefined, "normal"); doc.text("Valor total:", c1, 76); doc.setFont(undefined, "bold"); doc.text(`$${valorTotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`, c1 + 55, 76);
      doc.setFont(undefined, "normal"); doc.setTextColor(...textC); doc.text("Agotados:", c2, 64); doc.setFont(undefined, "bold"); doc.setTextColor(220, 38, 38); doc.text(`${agotados}`, c2 + 55, 64);
      doc.setFont(undefined, "normal"); doc.setTextColor(...textC); doc.text("Bajo stock:", c2, 70); doc.setFont(undefined, "bold"); doc.setTextColor(146, 64, 14); doc.text(`${bajoStock}`, c2 + 55, 70);
      doc.setFont(undefined, "normal"); doc.setTextColor(...textC); doc.text("Normal:", c2, 76); doc.setFont(undefined, "bold"); doc.setTextColor(5, 150, 105); doc.text(`${normal}`, c2 + 55, 76);
      doc.setTextColor(...textC);

      autoTable(doc, {
        startY: 84,
        head: [["ID", "Producto", "Kiosco", "P. Venta", "P. Costo", "Margen", "Cantidad", "Val. Total", "Estado", "Producto"]],
        body: filteredStock.map(item => {
          const kiosco = kioscos.find(k => k.id === item.kiosco_id), precio = getProductoPrecio(item.producto_id),
            costo = getProductoPrecioCosto(item.producto_id), margen = getProductoMargen(item.producto_id),
            activo = getProductoActivo(item.producto_id);
          let est = "Normal"; if (item.cantidad === 0) est = "AGOTADO"; else if (item.cantidad <= 10) est = "BAJO";
          return [`#${item.id}`, getProductoNombreSimple(item.producto_id), kiosco?.nombre ?? `Kiosco ${item.kiosco_id}`, `$${precio.toFixed(2)}`, costo !== null ? `$${costo.toFixed(2)}` : "—", margen !== null ? `$${margen.toFixed(2)}` : "—", `${item.cantidad}`, `$${(precio * item.cantidad).toLocaleString("es-ES", { minimumFractionDigits: 2 })}`, est, activo ? "Activo" : "Inactivo"];
        }),
        theme: "striped",
        headStyles: { fillColor: primary, textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold", halign: "center" },
        bodyStyles: { textColor: textC, fontSize: 7, halign: "center" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
        columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 52, halign: "left" }, 2: { cellWidth: 38, halign: "left" }, 3: { cellWidth: 22 }, 4: { cellWidth: 22 }, 5: { cellWidth: 22 }, 6: { cellWidth: 18 }, 7: { cellWidth: 26 }, 8: { cellWidth: 20 }, 9: { cellWidth: 18 } },
         
        didDrawCell: (data) => {
          if (data.section !== "body") return;
          if (data.column.index === 8) {
            const val = data.cell.raw;
            if (val === "AGOTADO" || val === "BAJO") {
              const bg = val === "AGOTADO" ? [254, 226, 226] : [254, 243, 199], fg = val === "AGOTADO" ? [153, 27, 27] : [146, 64, 14];
              doc.setFillColor(...bg); doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "F");
              doc.setTextColor(...fg); doc.setFontSize(7); doc.setFont(undefined, "bold");
              doc.text(val, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: "center" }); doc.setTextColor(...textC);
            }
          }
          if (data.column.index === 9 && data.cell.raw === "Inactivo") {
            doc.setFillColor(254, 226, 226); doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "F");
            doc.setTextColor(153, 27, 27); doc.setFontSize(7);
            doc.text("Inactivo", data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: "center" }); doc.setTextColor(...textC);
          }
          if (data.column.index === 5 && data.cell.raw !== "—") {
            const val = parseFloat(data.cell.raw.replace("$", "").replace(".", "").replace(",", "."));
            if (!isNaN(val) && val > 0) {
              doc.setTextColor(5, 150, 105); doc.setFontSize(7);
              doc.text(data.cell.raw, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: "center" }); doc.setTextColor(...textC);
            }
          }
        },
      });

      const pc = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pc; i++) {
        doc.setPage(i);
        const pH = doc.internal.pageSize.height;
        doc.setFontSize(8); doc.setTextColor(...grayC);
        doc.text(`Página ${i} de ${pc}`, pageW / 2, pH - 10, { align: "center" });
        doc.text("Sistema de Gestión ZOIMA", 14, pH - 10);
        doc.text(`Total: ${totalReg} registros`, pageW - 14, pH - 10, { align: "right" });
      }
      doc.save(`Stock_${Date.now()}.pdf`);
      showSnackbarMsg("PDF descargado exitosamente");
    } catch (e) { showSnackbarMsg("Error al generar el PDF", "error"); }
    finally { setGeneratingPDF(false); }
  };

  // ─────────────────────────────────────────────────────────────────
  // PDF — Inventario
  // Funciona tanto desde el dialog de detalle (inv ya tiene items)
  // como desde la tabla del historial (inv solo tiene el header).
  // En el segundo caso carga el detalle primero y luego genera el PDF.
  // ─────────────────────────────────────────────────────────────────
  const handleDescargarPDFInventario = async (inv) => {
    setGeneratingPDFInv(true);
    try {
      // Si viene desde el historial sin items, reconstruimos el detalle primero
      let invConItems = inv;
      if (!inv?.items?.length) {
        const fechaBase = new Date(inv.created_at);
        const desde = new Date(fechaBase.getTime() - 3 * 60000).toISOString();
        const hasta  = new Date(fechaBase.getTime() + 3 * 60000).toISOString();

        const r = await fetch(`${API_URL}/stock/inventario/${inv.kiosco_id}`, { credentials: "include" });
        if (!r.ok) { showSnackbarMsg("Error al cargar detalle para el PDF", "error"); return; }
        const stockKiosco = await r.json();

        const promises = stockKiosco.map(async (s) => {
          try {
            const rh = await fetch(`${API_URL}/stock/${s.stock_id}/historial?tipo=inventario&desde=${desde}&hasta=${hasta}&limit=1`, { credentials: "include" });
            if (!rh.ok) return null;
            const movs = await rh.json();
            if (!movs.length) return null;
            const mov = movs[0];
            return {
              stock_id: s.stock_id, producto_id: s.producto_id,
              producto_nombre: s.producto_nombre, precio: parseFloat(s.precio),
              precio_costo: s.precio_costo != null ? parseFloat(s.precio_costo) : null,
              cantidad_antes: mov.cantidad_antes, cantidad_contada: mov.cantidad_despues,
              cantidad_delta: mov.cantidad_delta, nueva_cantidad: mov.cantidad_despues,
            };
          } catch { return null; }
        });

        const items = (await Promise.all(promises)).filter(Boolean);
        if (!items.length) { showSnackbarMsg("No se encontraron movimientos para este inventario", "warning"); return; }

        invConItems = {
          ...inv,
          items,
          kiosco_nombre: kioscos.find(k => k.id === inv.kiosco_id)?.nombre ?? inv.kiosco_nombre ?? `Kiosco ${inv.kiosco_id}`,
        };
      }
      const doc = new jsPDF({ orientation: "landscape" });
      const primary = [102, 126, 234], textC = [15, 23, 42], grayC = [100, 116, 139];
      const pageW = doc.internal.pageSize.getWidth();
      doc.setFillColor(...primary); doc.rect(0, 0, pageW, 47, "F");
      // eslint-disable-next-line no-empty
      if (logoBase64) { try { doc.addImage(logoBase64, "PNG", 14, 8, 30, 30); } catch {} }
      doc.setTextColor(255, 255, 255); doc.setFontSize(20); doc.setFont(undefined, "bold");
      doc.text("Inventario de Stock", pageW / 2, 17, { align: "center" });
      doc.setFontSize(10); doc.setFont(undefined, "normal");
      doc.text(`Kiosco: ${invConItems.kiosco_nombre}`, pageW / 2, 27, { align: "center" });
      doc.setFontSize(8); doc.setTextColor(...grayC);
      // Prioriza empleado_nombre en el PDF también
      const responsable = invConItems.empleado_nombre ?? invConItems.usuario_nombre ?? "—";
      doc.text(`Fecha: ${fmtFecha(invConItems.created_at)}  ·  Realizado por: ${responsable}`, pageW / 2, 34, { align: "center" });
      if (invConItems.observaciones) doc.text(`Obs: ${invConItems.observaciones}`, pageW / 2, 41, { align: "center" });

      const valorTotal = invConItems.items.reduce((a, i) => a + i.cantidad_contada * i.precio, 0),
        totalUnid = invConItems.items.reduce((a, i) => a + i.cantidad_contada, 0),
        conCambios = invConItems.items.filter(i => i.cantidad_delta !== 0).length;

      doc.setTextColor(...textC); doc.setFontSize(11); doc.setFont(undefined, "bold");
      doc.text("Resumen", 14, 58); doc.setFontSize(9); doc.setFont(undefined, "normal");
      doc.text(`Productos: ${invConItems.items.length}`, 14, 65);
      doc.text(`Unidades totales: ${totalUnid.toLocaleString("es-ES")}`, 14, 71);
      doc.text(`Valor total: $${valorTotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`, 14, 77);
      // Totales para el resumen del PDF
      const hayConCostoPDF  = invConItems.items.some(i => i.precio_costo != null);
      const totalCostoPDF   = invConItems.items.reduce((a, i) => i.precio_costo != null ? a + i.cantidad_contada * i.precio_costo : a, 0);
      const margenTotalPDF  = hayConCostoPDF ? valorTotal - totalCostoPDF : null;

      doc.text(`Con cambios: ${conCambios}`, pageW / 2, 65);
      doc.text(`Valor registrado: $${parseFloat(invConItems.valor_total ?? 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })}`, pageW / 2, 71);
      if (hayConCostoPDF) {
        doc.text(`Costo total: $${totalCostoPDF.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`, pageW / 2, 77);
        doc.text(`Margen estimado: $${margenTotalPDF.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`, pageW - 14, 65, { align: "right" });
      }

      autoTable(doc, {
        startY: 84,
        head: [["Producto", "P.Venta", "P.Costo", "Margen", "Anterior", "Contado", "Diferencia", "Val.Venta", "Val.Costo"]],
        body: invConItems.items.map(i => {
          const delta   = i.cantidad_delta ?? 0;
          const costo   = i.precio_costo;
          const margen  = costo != null ? i.precio - costo : null;
          const valCosto = costo != null ? i.cantidad_contada * costo : null;
          return [
            i.producto_nombre,
            `$${i.precio.toFixed(2)}`,
            costo  != null ? `$${costo.toFixed(2)}`  : "—",
            margen != null ? `$${margen.toFixed(2)}` : "—",
            `${i.cantidad_antes}`,
            `${i.cantidad_contada}`,
            delta > 0 ? `+${delta}` : `${delta}`,
            `$${(i.cantidad_contada * i.precio).toLocaleString("es-ES", { minimumFractionDigits: 2 })}`,
            valCosto != null ? `$${valCosto.toLocaleString("es-ES", { minimumFractionDigits: 2 })}` : "—",
          ];
        }),
        theme: "striped",
        headStyles: { fillColor: primary, textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold", halign: "center" },
        bodyStyles: { textColor: textC, fontSize: 7, halign: "center" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 55, halign: "left" },
          1: { cellWidth: 22 }, 2: { cellWidth: 22 }, 3: { cellWidth: 22 },
          4: { cellWidth: 18 }, 5: { cellWidth: 18 }, 6: { cellWidth: 20 },
          7: { cellWidth: 30 }, 8: { cellWidth: 30 },
        },
        didDrawCell: (data) => {
          if (data.section !== "body") return;
          // Diferencia coloreada (col 6)
          if (data.column.index === 6) {
            const val = parseFloat(data.cell.raw);
            if (isNaN(val) || val === 0) return;
            const bg = val > 0 ? [209, 250, 229] : [254, 226, 226], fg = val > 0 ? [5, 150, 105] : [153, 27, 27];
            doc.setFillColor(...bg); doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "F");
            doc.setTextColor(...fg); doc.setFontSize(7); doc.setFont(undefined, "bold");
            doc.text(data.cell.raw, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: "center" });
            doc.setTextColor(...textC);
          }
          // Margen coloreado en verde si positivo (col 3)
          if (data.column.index === 3 && data.cell.raw !== "—") {
            const val = parseFloat(data.cell.raw.replace("$", "").replace(/\./g, "").replace(",", "."));
            if (!isNaN(val) && val > 0) {
              doc.setTextColor(5, 150, 105); doc.setFontSize(7);
              doc.text(data.cell.raw, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: "center" });
              doc.setTextColor(...textC);
            }
          }
        },
      });

      const pc = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pc; i++) {
        doc.setPage(i);
        const pH = doc.internal.pageSize.height;
        doc.setFontSize(8); doc.setTextColor(...grayC);
        doc.text(`Página ${i} de ${pc}`, pageW / 2, pH - 10, { align: "center" });
        doc.text("Sistema de Gestión ZOIMA", 14, pH - 10);
        doc.text(`${invConItems.items.length} productos`, pageW - 14, pH - 10, { align: "right" });
      }
      doc.save(`Inventario_${invConItems.kiosco_nombre.replace(/\s+/g, "_")}_${fmtFecha(invConItems.created_at, false).replace(/\//g, "-")}.pdf`);
      showSnackbarMsg("PDF del inventario descargado");
    } catch (e) { console.error(e); showSnackbarMsg("Error al generar PDF del inventario", "error"); }
    finally { setGeneratingPDFInv(false); }
  };

  // ─────────────────────────────────────────────────────────────────
  // Derivados
  // ─────────────────────────────────────────────────────────────────
  const paginatedStock = filteredStock.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const activeFiltersCount = [kioscoFilter, productoFilter, searchText, precioMin, precioMax, stockStatus, !showInactiveProducts].filter(Boolean).length;
  const totalAlerts = alertas.length;

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────
  if (loading && stock.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400, flexDirection: "column", gap: 2 }}>
        <CircularProgress />
        <Typography variant="body1" color="textSecondary">Cargando stock...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>

      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: "white" }}>📦 Gestión de Stock</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Chip label={`Total: ${stock.length} registros`} sx={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 500 }} />
          {activeFiltersCount > 0 && <Chip label={`${activeFiltersCount} filtro${activeFiltersCount > 1 ? "s" : ""} activo${activeFiltersCount > 1 ? "s" : ""}`} sx={{ backgroundColor: "#fbbf24", color: "#78350f", fontWeight: 500 }} />}
          {totalAlerts > 0 && (
            <Chip
              icon={<NotificationsActive sx={{ color: "#991b1b !important", fontSize: "1rem" }} />}
              label={`${totalAlerts} alerta${totalAlerts > 1 ? "s" : ""}`}
              onClick={() => setActiveTab(0)}
              sx={{ backgroundColor: "var(--error-light)", color: "#991b1b", fontWeight: 600, cursor: "pointer", "&:hover": { backgroundColor: "#fecaca" } }}
            />
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.98)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ "& .MuiTab-root": { fontWeight: 600, textTransform: "none", fontSize: "0.9rem" }, "& .Mui-selected": { color: "var(--primary)" }, "& .MuiTabs-indicator": { backgroundColor: "var(--primary)" } }}>
          <Tab label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              📊 Resumen
              {totalAlerts > 0 && <Box sx={{ bgcolor: "#ef4444", color: "white", borderRadius: "10px", px: 0.8, py: 0.1, fontSize: "0.7rem", fontWeight: 700 }}>{totalAlerts}</Box>}
            </Box>
          } />
          <Tab label="📋 Stock" />
          <Tab label="🗓️ Inventario Semanal" />
        </Tabs>
      </Paper>

      {/* Tab 0 */}
      {activeTab === 0 && (
        <TabResumen
          resumen={resumen}
          alertas={alertas}
          loadingResumen={loadingResumen}
          loadingAlertas={loadingAlertas}
          stock={stock}
          getProductoPrecioCosto={getProductoPrecioCosto}
          onRefresh={() => { fetchResumen(); fetchAlertas(); }}
        />
      )}

      {/* Tab 1 */}
      {activeTab === 1 && (
        <TabStock
          filteredStock={filteredStock}
          paginatedStock={paginatedStock}
          stock={stock}
          kioscos={kioscos}
          productos={productos}
          page={page}
          rowsPerPage={rowsPerPage}
          searchText={searchText} setSearchText={setSearchText}
          kioscoFilter={kioscoFilter} setKioscoFilter={setKioscoFilter}
          productoFilter={productoFilter} setProductoFilter={setProductoFilter}
          stockStatus={stockStatus} setStockStatus={setStockStatus}
          showInactiveProducts={showInactiveProducts} setShowInactiveProducts={setShowInactiveProducts}
          precioMin={precioMin} setPrecioMin={setPrecioMin}
          precioMax={precioMax} setPrecioMax={setPrecioMax}
          orderBy={orderBy} setOrderBy={setOrderBy}
          orderDirection={orderDirection} setOrderDirection={setOrderDirection}
          showAdvancedFilters={showAdvancedFilters} setShowAdvancedFilters={setShowAdvancedFilters}
          activeFiltersCount={activeFiltersCount}
          generatingPDF={generatingPDF}
          onChangePage={(_, p) => setPage(p)}
          onChangeRowsPerPage={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          onClearFilters={handleClearAllFilters}
          onRefreshStock={fetchStock}
          onDownloadPDF={handleDescargarPDF}
          onOpenMovimiento={handleOpenMovimiento}
          onOpenHistorial={handleOpenHistorial}
          onEditClick={handleEditClick}
          getProductoNombreSimple={getProductoNombreSimple}
          getProductoPrecio={getProductoPrecio}
          getProductoPrecioCosto={getProductoPrecioCosto}
          getProductoMargen={getProductoMargen}
          getProductoActivo={getProductoActivo}
          getProductoStockMinimo={getProductoStockMinimo}
          fmtMargen={fmtMargen}
        />
      )}

      {/* Tab 2 */}
      {activeTab === 2 && (
        <TabInventario
          esKiosco={esKiosco}
          usuario={usuario}
          kioscos={kioscos}
          kioscoInventario={kioscoInventario}
          onKioscoChange={handleKioscoInventarioChange}
          inventarioItems={inventarioItems}
          loadingInventario={loadingInventario}
          onCantidadChange={handleInventarioCantidadChange}
          invItemsPage={invItemsPage} setInvItemsPage={setInvItemsPage}
          invItemsRowsPerPage={invItemsRowsPerPage} setInvItemsRowsPerPage={setInvItemsRowsPerPage}
          observacionesInventario={observacionesInventario} setObservacionesInventario={setObservacionesInventario}
          fichadosAhora={fichadosAhora}
          loadingFichados={loadingFichados}
          empleadoInventario={empleadoInventario} setEmpleadoInventario={setEmpleadoInventario}
          onRefreshFichados={fetchFichadosAhora}
          savingInventario={savingInventario}
          onConfirmarInventario={handleConfirmarInventario}
          getProductoPrecioCosto={getProductoPrecioCosto}
          historialInventarios={historialInventarios}
          loadingHistorialInv={loadingHistorialInv}
          showHistorialInv={showHistorialInv} setShowHistorialInv={setShowHistorialInv}
          invHistPage={invHistPage} setInvHistPage={setInvHistPage}
          invHistRowsPerPage={invHistRowsPerPage} setInvHistRowsPerPage={setInvHistRowsPerPage}
          generatingPDFInv={generatingPDFInv}
          onRefreshHistorial={fetchHistorialInventarios}
          onVerDetalle={handleVerDetalle}
          onDescargarPDFInv={handleDescargarPDFInventario}
        />
      )}

      {/* ── DIALOG — Detalle / edición de inventario ── */}
      <Dialog open={detalleDialogOpen} onClose={() => { setDetalleDialogOpen(false); setInventarioDetalle(null); }} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {detalleMode === "view" ? <Visibility sx={{ color: "var(--info)" }} /> : <Edit sx={{ color: "var(--warning)" }} />}
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {detalleMode === "view" ? "Detalle del Inventario" : "Editar y guardar como nuevo inventario"}
              </Typography>
            </Box>
            {inventarioDetalle && (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button size="small" variant="outlined" startIcon={detalleMode === "view" ? <Edit /> : <Visibility />} onClick={() => setDetalleMode(p => p === "view" ? "edit" : "view")} sx={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
                  {detalleMode === "view" ? "Usar como base" : "Solo ver"}
                </Button>
                <Button size="small" variant="contained" startIcon={generatingPDFInv ? <CircularProgress size={14} sx={{ color: "white" }} /> : <PictureAsPdf />} onClick={() => handleDescargarPDFInventario(inventarioDetalle)} disabled={!inventarioDetalle?.items?.length || generatingPDFInv} sx={{ background: "linear-gradient(135deg, #ef4444 0%, var(--error) 100%)", color: "white" }}>
                  {generatingPDFInv ? "Generando..." : "PDF"}
                </Button>
              </Box>
            )}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {loadingDetalle ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 6, gap: 2 }}>
              <CircularProgress />
              <Typography variant="body2" color="textSecondary">Reconstruyendo detalle del inventario...</Typography>
            </Box>
          ) : !inventarioDetalle ? null : (
            <>
              <Box sx={{ mb: 3, p: 2, backgroundColor: "var(--bg-soft)", borderRadius: 2, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 2 }}>
                <Box><Typography variant="caption" color="textSecondary">Kiosco</Typography><Typography variant="body1" sx={{ fontWeight: 600 }}>{inventarioDetalle.kiosco_nombre}</Typography></Box>
                <Box><Typography variant="caption" color="textSecondary">Fecha de cierre</Typography><Typography variant="body1" sx={{ fontWeight: 600 }}>{fmtFecha(inventarioDetalle.created_at)}</Typography></Box>
                {/* Realizado por — mismo criterio que en la tabla del historial */}
                <Box>
                  <Typography variant="caption" color="textSecondary">Realizado por</Typography>
                  {inventarioDetalle.empleado_nombre ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.3 }}>
                      <Person sx={{ fontSize: "1rem", color: "var(--primary)" }} />
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{inventarioDetalle.empleado_nombre}</Typography>
                    </Box>
                  ) : (
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{inventarioDetalle.usuario_nombre ?? "—"}</Typography>
                  )}
                  {inventarioDetalle.empleado_nombre && inventarioDetalle.usuario_nombre && (
                    <Typography variant="caption" color="textSecondary">Sistema: {inventarioDetalle.usuario_nombre}</Typography>
                  )}
                </Box>
                {inventarioDetalle.observaciones && (
                  <Box sx={{ gridColumn: "1/-1" }}>
                    <Typography variant="caption" color="textSecondary">Observaciones</Typography>
                    <Typography variant="body2" sx={{ fontStyle: "italic" }}>{inventarioDetalle.observaciones}</Typography>
                  </Box>
                )}
              </Box>

              {detalleMode === "edit" && <Alert severity="info" sx={{ mb: 2 }}>Modificá las cantidades y confirmá para crear un <strong>nuevo inventario</strong>. El original no se modifica.</Alert>}

              {inventarioDetalle.items.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body1" color="textSecondary">No se encontraron movimientos en ese rango de tiempo.</Typography>
                </Box>
              ) : (
                <>
                  <TableContainer sx={{ maxHeight: 420, border: "1px solid #e2e8f0", borderRadius: 2 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          {["Producto", "P. Venta", "P. Costo", "Margen", "Ant.", detalleMode === "edit" ? "A cargar" : "Contado", "Diferencia", "Val. venta", "Val. costo"].map(c => (
                            <TableCell key={c} sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)", fontSize: "0.75rem" }}>{c}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {inventarioDetalle.items.map(item => {
                          const delta        = item.cantidad_delta ?? 0;
                          const cantMostrada = detalleMode === "edit" ? item.nueva_cantidad : item.cantidad_contada;
                          const costo        = item.precio_costo;
                          const margen       = costo != null ? item.precio - costo : null;
                          const valVenta     = cantMostrada * item.precio;
                          const valCosto     = costo != null ? cantMostrada * costo : null;
                          return (
                            <TableRow key={item.stock_id} hover>
                              <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{item.producto_nombre}</Typography></TableCell>
                              <TableCell><Typography variant="body2" sx={{ color: "var(--primary-dark)", fontWeight: 600 }}>${item.precio.toFixed(2)}</Typography></TableCell>
                              <TableCell><Typography variant="body2" sx={{ color: "#64748b" }}>{costo != null ? `$${costo.toFixed(2)}` : "—"}</Typography></TableCell>
                              <TableCell><Typography variant="body2" sx={{ color: margen == null ? "#64748b" : margen >= 0 ? "var(--primary-dark)" : "var(--error)", fontWeight: 600 }}>{margen != null ? `$${margen.toFixed(2)}` : "—"}</Typography></TableCell>
                              <TableCell><Typography variant="body2">{item.cantidad_antes}</Typography></TableCell>
                              <TableCell sx={{ width: 120 }}>
                                {detalleMode === "edit"
                                  ? <TextField size="small" type="number" value={item.nueva_cantidad} onChange={e => handleDetalleItemChange(item.stock_id, e.target.value)} inputProps={{ min: 0, style: { textAlign: "center", fontWeight: 700 } }} sx={{ width: 90 }} />
                                  : <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.cantidad_contada}</Typography>}
                              </TableCell>
                              <TableCell>
                                {delta !== 0
                                  ? <Chip label={`${delta > 0 ? "+" : ""}${delta}`} size="small" icon={delta > 0 ? <ArrowUpward sx={{ fontSize: "0.8rem !important" }} /> : <ArrowDownward sx={{ fontSize: "0.8rem !important" }} />} sx={{ backgroundColor: delta > 0 ? "var(--success-light)" : "var(--error-light)", color: delta > 0 ? "#065f46" : "#991b1b", fontWeight: 700 }} />
                                  : <Typography variant="caption" color="textSecondary">—</Typography>}
                              </TableCell>
                              <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>${valVenta.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</Typography></TableCell>
                              <TableCell><Typography variant="body2" sx={{ color: "#64748b" }}>{valCosto != null ? `$${valCosto.toLocaleString("es-ES", { minimumFractionDigits: 2 })}` : "—"}</Typography></TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {/* Resumen con costo y margen */}
                  {(() => {
                    const cant      = i => detalleMode === "edit" ? i.nueva_cantidad : i.cantidad_contada;
                    const totalUnid = inventarioDetalle.items.reduce((a, i) => a + cant(i), 0);
                    const totalVenta = inventarioDetalle.items.reduce((a, i) => a + cant(i) * i.precio, 0);
                    const totalCosto = inventarioDetalle.items.reduce((a, i) => i.precio_costo != null ? a + cant(i) * i.precio_costo : a, 0);
                    const hayConCosto = inventarioDetalle.items.some(i => i.precio_costo != null);
                    const margenTotal = hayConCosto ? totalVenta - totalCosto : null;
                    return (
                      <Box sx={{ mt: 2, p: 2, backgroundColor: "var(--bg-soft)", borderRadius: 2, display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 2 }}>
                        <Box sx={{ textAlign: "center" }}><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--primary)" }}>{totalUnid}</Typography><Typography variant="caption" color="textSecondary">Total unidades</Typography></Box>
                        <Box sx={{ textAlign: "center" }}><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--primary-dark)" }}>${totalVenta.toLocaleString("es-ES", { minimumFractionDigits: 0 })}</Typography><Typography variant="caption" color="textSecondary">Valor venta</Typography></Box>
                        <Box sx={{ textAlign: "center" }}><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--error)" }}>{hayConCosto ? `$${totalCosto.toLocaleString("es-ES", { minimumFractionDigits: 0 })}` : "—"}</Typography><Typography variant="caption" color="textSecondary">Costo total</Typography></Box>
                        <Box sx={{ textAlign: "center" }}><Typography variant="h6" sx={{ fontWeight: 800, color: margenTotal == null ? "#64748b" : margenTotal >= 0 ? "var(--primary-dark)" : "var(--error)" }}>{margenTotal != null ? `$${margenTotal.toLocaleString("es-ES", { minimumFractionDigits: 0 })}` : "—"}</Typography><Typography variant="caption" color="textSecondary">Margen estimado</Typography></Box>
                        <Box sx={{ textAlign: "center" }}><Typography variant="h6" sx={{ fontWeight: 800, color: "var(--warning)" }}>{inventarioDetalle.items.filter(i => i.cantidad_delta !== 0).length}</Typography><Typography variant="caption" color="textSecondary">Con diferencias</Typography></Box>
                      </Box>
                    );
                  })()}
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: "var(--bg-soft)" }}>
          <Button onClick={() => { setDetalleDialogOpen(false); setInventarioDetalle(null); }} startIcon={<Cancel />} sx={{ color: "#64748b" }}>Cerrar</Button>
          {detalleMode === "edit" && inventarioDetalle?.items?.length > 0 && (
            <Button variant="contained" onClick={handleGuardarDesdeDetalle} disabled={savingInventario} startIcon={savingInventario ? <CircularProgress size={16} sx={{ color: "white" }} /> : <Save />} sx={{ background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)", color: "white" }}>
              {savingInventario ? "Guardando..." : "Guardar como nuevo inventario"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ── DIALOG — Edición directa ── */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setEditingStock(null); setEditQuantity(""); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><Edit sx={{ color: "var(--primary)" }} />Editar Cantidad (corrección directa)</Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {editingStock && (
            <Box sx={{ mb: 3, p: 2, backgroundColor: "#f1f5f9", borderRadius: 1 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary"><strong>Producto:</strong></Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>{getProductoNombreSimple(editingStock.producto_id)}</Typography>
                  <Typography variant="caption" color="textSecondary">Precio: ${getProductoPrecio(editingStock.producto_id).toFixed(2)}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary"><strong>Kiosco:</strong></Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>{kioscos.find(k => k.id === editingStock.kiosco_id)?.nombre || `Kiosco ${editingStock.kiosco_id}`}</Typography>
                </Box>
              </Box>
              <Typography variant="subtitle2" color="textSecondary"><strong>Cantidad actual:</strong></Typography>
              <Typography variant="h6" sx={{ color: editingStock.cantidad > 0 ? "var(--primary-dark)" : "var(--error)", fontWeight: 600 }}>{editingStock.cantidad} unidades</Typography>
            </Box>
          )}
          <Alert severity="info" sx={{ mb: 2 }}>Corrección administrativa. Para movimientos auditables usá el botón <strong>+</strong>.</Alert>
          <TextField fullWidth label="Nueva Cantidad" type="number" value={editQuantity} onChange={e => setEditQuantity(e.target.value)} InputProps={{ inputProps: { min: 0 } }} required autoFocus helperText="Ingresá la cantidad corregida" />
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: "var(--bg-soft)" }}>
          <Button onClick={() => { setOpenDialog(false); setEditingStock(null); setEditQuantity(""); }} startIcon={<Cancel />} sx={{ color: "#64748b" }}>Cancelar</Button>
          <Button variant="contained" onClick={handleUpdateStock} startIcon={<Save />} sx={{ background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)" }}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* ── DIALOG — Movimiento rápido ── */}
      <Dialog open={movimientoDialogOpen} onClose={() => setMovimientoDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><TrendingUp sx={{ color: "var(--primary-dark)" }} />Registrar Movimiento</Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {movimientoStockItem && (
            <Box sx={{ mb: 3, p: 2, backgroundColor: "#f1f5f9", borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{getProductoNombreSimple(movimientoStockItem.producto_id)} — {kioscos.find(k => k.id === movimientoStockItem.kiosco_id)?.nombre}</Typography>
              <Typography variant="body2" color="textSecondary">Stock actual: <strong>{movimientoStockItem.cantidad} unidades</strong></Typography>
            </Box>
          )}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>Tipo de movimiento</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 3 }}>
            {["ingreso", "ajuste", "rotura", "venta"].map(tipo => {
              const cfg = TIPO_CONFIG[tipo], sel = movimientoTipo === tipo;
              return (
                <Box key={tipo} onClick={() => setMovimientoTipo(tipo)} sx={{ p: 1.5, borderRadius: 2, cursor: "pointer", textAlign: "center", border: `2px solid ${sel ? cfg.color : "#e2e8f0"}`, backgroundColor: sel ? cfg.bg : "white", transition: "all 0.15s", "&:hover": { borderColor: cfg.color, backgroundColor: cfg.bg } }}>
                  <Box sx={{ color: cfg.color, display: "flex", justifyContent: "center", mb: 0.5 }}>{cfg.icon}</Box>
                  <Typography variant="body2" sx={{ fontWeight: sel ? 700 : 500, color: sel ? cfg.color : "inherit" }}>{cfg.label}</Typography>
                </Box>
              );
            })}
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField label="Cantidad" type="number" value={movimientoCantidad} onChange={e => setMovimientoCantidad(e.target.value)} inputProps={{ min: 1 }} required size="small" helperText={movimientoTipo === "ingreso" ? "Unidades que entran" : movimientoTipo === "venta" ? "Unidades vendidas" : movimientoTipo === "rotura" ? "Unidades dañadas" : "Unidades a ajustar"} />
            <TextField label="Motivo (opcional)" value={movimientoMotivo} onChange={e => setMovimientoMotivo(e.target.value)} size="small" placeholder="Ej: Reposición semanal" />
          </Box>
          {movimientoCantidad && movimientoStockItem && (
            <Box sx={{ mt: 2, p: 1.5, backgroundColor: "var(--bg-soft)", borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Stock resultante: <strong style={{ color: movimientoTipo === "ingreso" ? "var(--primary-dark)" : (movimientoStockItem.cantidad - (parseInt(movimientoCantidad) || 0)) < 0 ? "var(--error)" : "var(--info)" }}>
                  {movimientoTipo === "ingreso" ? movimientoStockItem.cantidad + (parseInt(movimientoCantidad) || 0) : movimientoStockItem.cantidad - (parseInt(movimientoCantidad) || 0)} unidades
                </strong>
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: "var(--bg-soft)" }}>
          <Button onClick={() => setMovimientoDialogOpen(false)} startIcon={<Cancel />} sx={{ color: "#64748b" }}>Cancelar</Button>
          <Button variant="contained" onClick={handleRegistrarMovimiento} disabled={savingMovimiento} startIcon={savingMovimiento ? <CircularProgress size={16} sx={{ color: "white" }} /> : <Save />} sx={{ background: `linear-gradient(135deg, ${TIPO_CONFIG[movimientoTipo]?.color} 0%, ${TIPO_CONFIG[movimientoTipo]?.color}cc 100%)` }}>
            {savingMovimiento ? "Registrando..." : "Registrar Movimiento"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── DIALOG — Historial por ítem ── */}
      <Dialog open={historialDialogOpen} onClose={() => setHistorialDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <History sx={{ color: "var(--info)" }} />Historial de Movimientos
            {historialStockItem && <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>— {getProductoNombreSimple(historialStockItem.producto_id)} / {kioscos.find(k => k.id === historialStockItem.kiosco_id)?.nombre}</Typography>}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {loadingHistorial ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
          ) : historialItems.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <History sx={{ fontSize: 48, color: "#cbd5e1", mb: 1 }} />
              <Typography variant="body1" color="textSecondary">No hay movimientos registrados</Typography>
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 450 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>{["Fecha", "Tipo", "Antes", "Movimiento", "Después", "Motivo", "Usuario"].map(c => <TableCell key={c} sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>{c}</TableCell>)}</TableRow>
                </TableHead>
                <TableBody>
                  {historialItems.map(m => {
                    const cfg = TIPO_CONFIG[m.tipo] || TIPO_CONFIG.ajuste, dp = m.cantidad_delta >= 0;
                    return (
                      <TableRow key={m.id} hover>
                        <TableCell>
                          <Typography variant="caption">{new Date(m.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}</Typography><br />
                          <Typography variant="caption" color="textSecondary">{new Date(m.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</Typography>
                        </TableCell>
                        <TableCell><Chip label={cfg.label} size="small" sx={{ backgroundColor: cfg.bg, color: cfg.color, fontWeight: 600, fontSize: "0.7rem" }} /></TableCell>
                        <TableCell><Typography variant="body2">{m.cantidad_antes}</Typography></TableCell>
                        <TableCell><Chip label={`${dp ? "+" : ""}${m.cantidad_delta}`} size="small" icon={dp ? <ArrowUpward sx={{ fontSize: "0.8rem !important" }} /> : <ArrowDownward sx={{ fontSize: "0.8rem !important" }} />} sx={{ backgroundColor: dp ? "var(--success-light)" : "var(--error-light)", color: dp ? "#065f46" : "#991b1b", fontWeight: 700 }} /></TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{m.cantidad_despues}</Typography></TableCell>
                        <TableCell><Typography variant="caption" color="textSecondary">{m.motivo || "—"}</Typography></TableCell>
                        <TableCell><Typography variant="caption">{m.usuario_nombre || "Sistema"}</Typography></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: "var(--bg-soft)" }}>
          <Button onClick={() => setHistorialDialogOpen(false)} startIcon={<Cancel />} sx={{ color: "#64748b" }}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={openSnackbar} autoHideDuration={5000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} sx={{ width: "100%" }}>{snackbarMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default StockTable;