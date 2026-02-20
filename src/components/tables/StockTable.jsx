/* eslint-disable no-unused-vars */
// components/tables/StockTable.jsx
import { useState, useEffect } from "react";
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Button, Snackbar,
  Alert, CircularProgress, Typography, Chip, Select, MenuItem,
  FormControl, InputLabel, Tooltip, Checkbox, FormControlLabel,
  TablePagination, InputAdornment, Divider, Tab, Tabs,
  LinearProgress, Card, CardContent,
} from "@mui/material";
import {
  Edit, Save, Cancel, FilterList, Warning, Search, Clear,
  ExpandMore, ExpandLess, PictureAsPdf, Add,
  History, Inventory2, TrendingUp, NotificationsActive,
  CheckCircle, ArrowUpward, ArrowDownward, Build, BrokenImage,
  Refresh, ContentCopy, Visibility,
} from "@mui/icons-material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_URL = "http://localhost:3000/api";

const TIPO_CONFIG = {
  ingreso:    { label: "Ingreso",    color: "var(--primary-dark)", bg: "var(--success-light)", icon: <ArrowUpward   fontSize="small" /> },
  venta:      { label: "Venta",      color: "#2563eb", bg: "#dbeafe", icon: <TrendingUp     fontSize="small" /> },
  ajuste:     { label: "Ajuste",     color: "#7c3aed", bg: "#ede9fe", icon: <Build          fontSize="small" /> },
  rotura:     { label: "Rotura",     color: "var(--error)", bg: "var(--error-light)", icon: <BrokenImage    fontSize="small" /> },
  inventario: { label: "Inventario", color: "var(--warning)", bg: "var(--warning-light)", icon: <Inventory2     fontSize="small" /> },
};

const buildFiltroTexto = ({ searchText, kioscoFilter, kioscos, productoFilter, productos, stockStatus, precioMin, precioMax, showInactiveProducts }) => {
  const partes = [];
  if (searchText) partes.push(`Búsqueda: "${searchText}"`);
  if (kioscoFilter) { const k = kioscos.find(k => k.id.toString() === kioscoFilter); partes.push(`Kiosco: ${k ? k.nombre : kioscoFilter}`); }
  if (productoFilter) { const p = productos.find(p => p.id.toString() === productoFilter); partes.push(`Producto: ${p ? p.nombre : productoFilter}`); }
  if (stockStatus === "agotado") partes.push("Estado: Agotado");
  if (stockStatus === "bajo")    partes.push("Estado: Bajo stock");
  if (stockStatus === "normal")  partes.push("Estado: Normal");
  if (precioMin) partes.push(`Precio mín: $${precioMin}`);
  if (precioMax) partes.push(`Precio máx: $${precioMax}`);
  if (!showInactiveProducts) partes.push("Sólo productos activos");
  return partes.length ? partes.join("  |  ") : "Sin filtros aplicados";
};

const fmtFecha = (iso, conHora = true) => {
  if (!iso) return "—";
  const opts = { day: "2-digit", month: "2-digit", year: "numeric" };
  if (conHora) { opts.hour = "2-digit"; opts.minute = "2-digit"; }
  return new Date(iso).toLocaleDateString("es-ES", opts);
};

// ─────────────────────────────────────────────────────────────────
const StockTable = () => {
  // ── Datos ──
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kioscos, setKioscos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [productosMap, setProductosMap] = useState({});
  const [filteredStock, setFilteredStock] = useState([]);

  // ── Tabs ──
  const [activeTab, setActiveTab] = useState(0);

  // ── Resumen y alertas ──
  const [resumen, setResumen] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [loadingAlertas, setLoadingAlertas] = useState(false);

  // ── Inventario semanal ──
  const [kioscoInventario, setKioscoInventario] = useState("");
  const [inventarioItems, setInventarioItems] = useState([]);
  const [loadingInventario, setLoadingInventario] = useState(false);
  const [savingInventario, setSavingInventario] = useState(false);
  const [observacionesInventario, setObservacionesInventario] = useState("");

  // ── Paginado: lista de productos del inventario activo ──
  const [invItemsPage, setInvItemsPage] = useState(0);
  const [invItemsRowsPerPage, setInvItemsRowsPerPage] = useState(15);

  // ── Historial de inventarios cerrados ──
  const [historialInventarios, setHistorialInventarios] = useState([]);
  const [loadingHistorialInv, setLoadingHistorialInv] = useState(false);

  // ── Paginado: historial de inventarios cerrados ──
  const [invHistPage, setInvHistPage] = useState(0);
  const [invHistRowsPerPage, setInvHistRowsPerPage] = useState(10);

  // ── Historial colapsable ──
  const [showHistorialInv, setShowHistorialInv] = useState(false);

  // ── Detalle de inventario histórico ──
  const [inventarioDetalle, setInventarioDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false);
  const [detalleMode, setDetalleMode] = useState("view"); // 'view' | 'edit'
  const [generatingPDFInv, setGeneratingPDFInv] = useState(false);

  // ── Historial de movimientos por ítem ──
  const [historialDialogOpen, setHistorialDialogOpen] = useState(false);
  const [historialItems, setHistorialItems] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [historialStockItem, setHistorialStockItem] = useState(null);

  // ── Movimiento rápido ──
  const [movimientoDialogOpen, setMovimientoDialogOpen] = useState(false);
  const [movimientoStockItem, setMovimientoStockItem] = useState(null);
  const [movimientoTipo, setMovimientoTipo] = useState("ingreso");
  const [movimientoCantidad, setMovimientoCantidad] = useState("");
  const [movimientoMotivo, setMovimientoMotivo] = useState("");
  const [savingMovimiento, setSavingMovimiento] = useState(false);

  // ── Edición directa ──
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [editQuantity, setEditQuantity] = useState("");

  // ── Filtros ──
  const [kioscoFilter, setKioscoFilter] = useState("");
  const [productoFilter, setProductoFilter] = useState("");
  const [showInactiveProducts, setShowInactiveProducts] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [orderBy, setOrderBy] = useState("id");
  const [orderDirection, setOrderDirection] = useState("asc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // ── PDF ──
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [logoBase64, setLogoBase64] = useState(null);

  // ── Snackbar ──
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // ─── Logo ─────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/logo.png").then(r => { if (!r.ok) return; return r.blob(); }).then(blob => {
      if (!blob) return;
      const reader = new FileReader();
      reader.onloadend = () => setLogoBase64(reader.result);
      reader.readAsDataURL(blob);
    }).catch(() => {});
  }, []);

  // ─── Helpers ──────────────────────────────────────────────────
  const showSnackbarMsg = (msg, sev = "success") => { setSnackbarMessage(msg); setSnackbarSeverity(sev); setOpenSnackbar(true); };
  const getProductoNombreSimple = id => productosMap[id]?.nombre ?? `Producto ${id}`;
  const getProductoPrecio       = id => parseFloat(productosMap[id]?.precio ?? 0);
  const getProductoPrecioCosto  = id => productosMap[id]?.precio_costo != null ? parseFloat(productosMap[id].precio_costo) : null;
  const getProductoMargen       = id => {
    const costo = getProductoPrecioCosto(id);
    if (costo === null) return null;
    const venta = getProductoPrecio(id);
    return venta - costo;
  };
  const fmtMargen = (margen) => {
    if (margen === null) return "—";
    return `$${margen.toLocaleString("es-ES", {minimumFractionDigits:0})}`;
  };
  const getProductoActivo       = id => productosMap[id]?.activo ?? true;
  const getProductoStockMinimo  = id => productosMap[id]?.stock_minimo ?? 0;

  // ─── Fetches ──────────────────────────────────────────────────
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
    try { const r = await fetch(`${API_URL}/kioscos`, { credentials: "include" }); if (r.ok) setKioscos(await r.json()); }
    catch (e) { console.error(e); }
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
    try { setLoadingResumen(true); const r = await fetch(`${API_URL}/stock/resumen`, { credentials: "include" }); if (r.ok) setResumen(await r.json()); }
    catch (e) { console.error(e); } finally { setLoadingResumen(false); }
  };

  const fetchAlertas = async () => {
    try { setLoadingAlertas(true); const r = await fetch(`${API_URL}/stock/alertas`, { credentials: "include" }); if (r.ok) setAlertas(await r.json()); }
    catch (e) { console.error(e); } finally { setLoadingAlertas(false); }
  };

  const fetchInventarioKiosco = async (kiosco_id) => {
    try {
      setLoadingInventario(true);
      const r = await fetch(`${API_URL}/stock/inventario/${kiosco_id}`, { credentials: "include" });
      if (r.ok) {
        const data = await r.json();
        setInventarioItems(data.map(i => ({ ...i, nueva_cantidad: i.cantidad })));
        setInvItemsPage(0); // reset página al cargar nuevo kiosco
      }
    } catch (e) { console.error(e); } finally { setLoadingInventario(false); }
  };

  const fetchHistorialInventarios = async () => {
    try {
      setLoadingHistorialInv(true);
      const r = await fetch(`${API_URL}/stock/inventarios`, { credentials: "include" });
      if (r.ok) {
        setHistorialInventarios(await r.json());
        setInvHistPage(0); // reset página al recargar
      }
    } catch (e) { console.error(e); } finally { setLoadingHistorialInv(false); }
  };

  const fetchHistorial = async (stock_id) => {
    try {
      setLoadingHistorial(true);
      const r = await fetch(`${API_URL}/stock/${stock_id}/historial?limit=30`, { credentials: "include" });
      if (r.ok) setHistorialItems(await r.json());
    } catch (e) { console.error(e); } finally { setLoadingHistorial(false); }
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
          const rh = await fetch(
            `${API_URL}/stock/${s.stock_id}/historial?tipo=inventario&desde=${desde}&hasta=${hasta}&limit=1`,
            { credentials: "include" }
          );
          if (!rh.ok) return null;
          const movs = await rh.json();
          if (!movs.length) return null;
          const mov = movs[0];
          return {
            stock_id:         s.stock_id,
            producto_id:      s.producto_id,
            producto_nombre:  s.producto_nombre,
            precio:           parseFloat(s.precio),
            cantidad_antes:   mov.cantidad_antes,
            cantidad_contada: mov.cantidad_despues,
            cantidad_delta:   mov.cantidad_delta,
            nueva_cantidad:   mov.cantidad_despues,
          };
        } catch { return null; }
      });

      const items = (await Promise.all(promises)).filter(Boolean);

      setInventarioDetalle({
        ...inventario,
        items,
        kiosco_nombre: kioscos.find(k => k.id === inventario.kiosco_id)?.nombre
          ?? inventario.kiosco_nombre
          ?? `Kiosco ${inventario.kiosco_id}`,
      });
    } catch (e) {
      console.error("Error al cargar detalle:", e);
      showSnackbarMsg("Error al cargar detalle del inventario", "error");
    } finally {
      setLoadingDetalle(false);
    }
  };

  // ─── Carga inicial ─────────────────────────────────────────────
  useEffect(() => {
    Promise.all([fetchProductos(), fetchKioscos(), fetchStock()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 0) { fetchResumen(); fetchAlertas(); }
    if (activeTab === 2) { fetchHistorialInventarios(); }
  }, [activeTab]);

  // ─── Filtrado ─────────────────────────────────────────────────
  useEffect(() => {
    let result = [...stock];
    if (searchText.trim()) {
      const s = searchText.toLowerCase().trim();
      result = result.filter(item => {
        const p = productosMap[item.producto_id];
        const k = kioscos.find(k => k.id === item.kiosco_id);
        return (p?.nombre?.toLowerCase().includes(s)) || (k?.nombre?.toLowerCase().includes(s)) ||
               (p?.codigo_barra?.toLowerCase().includes(s)) || String(item.id).includes(s);
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
        case "kiosco":   cA = kioscos.find(k=>k.id===a.kiosco_id)?.nombre.toLowerCase()??""; cB = kioscos.find(k=>k.id===b.kiosco_id)?.nombre.toLowerCase()??""; break;
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

  // ─── Handlers básicos ─────────────────────────────────────────
  const handleChangePage = (_, p) => setPage(p);
  const handleChangeRowsPerPage = e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };
  const handleClearAllFilters = () => { setKioscoFilter(""); setProductoFilter(""); setSearchText(""); setPrecioMin(""); setPrecioMax(""); setStockStatus(""); setShowInactiveProducts(true); };
  const handleEditClick = item => { setEditingStock(item); setEditQuantity(item.cantidad.toString()); setOpenDialog(true); };

  const handleUpdateStock = async () => {
    const cant = parseInt(editQuantity);
    if (isNaN(cant) || cant < 0) { showSnackbarMsg("Cantidad inválida", "error"); return; }
    try {
      const r = await fetch(`${API_URL}/stock/${editingStock.id}`, { method:"PUT", credentials:"include", headers:{"Content-Type":"application/json"}, body:JSON.stringify({cantidad:cant}) });
      if (!r.ok) { showSnackbarMsg({400:"Cantidad inválida",401:"No autenticado",403:"Sin permisos",404:"No encontrado"}[r.status]||"Error","error"); return; }
      const updated = await r.json();
      setStock(prev => prev.map(i => i.id===updated.id ? {...i,cantidad:updated.cantidad} : i));
      setOpenDialog(false); setEditingStock(null); setEditQuantity("");
      showSnackbarMsg("Stock actualizado exitosamente");
    } catch (e) { showSnackbarMsg("Error al actualizar","error"); }
  };

  const handleOpenMovimiento = item => { setMovimientoStockItem(item); setMovimientoTipo("ingreso"); setMovimientoCantidad(""); setMovimientoMotivo(""); setMovimientoDialogOpen(true); };

  const handleRegistrarMovimiento = async () => {
    const cant = parseInt(movimientoCantidad);
    if (isNaN(cant)||cant<=0) { showSnackbarMsg("Cantidad debe ser mayor a 0","error"); return; }
    setSavingMovimiento(true);
    try {
      const r = await fetch(`${API_URL}/stock/${movimientoStockItem.id}/movimiento`, { method:"POST", credentials:"include", headers:{"Content-Type":"application/json"}, body:JSON.stringify({tipo:movimientoTipo,cantidad:cant,motivo:movimientoMotivo||undefined}) });
      if (!r.ok) { const d = await r.json(); showSnackbarMsg(d.message||"Error","error"); return; }
      const d = await r.json();
      setStock(prev => prev.map(i => i.id===movimientoStockItem.id ? {...i,cantidad:d.cantidad_nueva} : i));
      setMovimientoDialogOpen(false);
      showSnackbarMsg(`Movimiento de ${TIPO_CONFIG[movimientoTipo].label.toLowerCase()} registrado`);
    } catch (e) { showSnackbarMsg("Error al registrar movimiento","error"); }
    finally { setSavingMovimiento(false); }
  };

  const handleOpenHistorial = async item => { setHistorialStockItem(item); setHistorialDialogOpen(true); await fetchHistorial(item.id); };

  // ─── Inventario semanal ────────────────────────────────────────
  const handleKioscoInventarioChange = async kiosco_id => {
    setKioscoInventario(kiosco_id);
    setInventarioItems([]);
    if (kiosco_id) await fetchInventarioKiosco(kiosco_id);
  };

  const handleInventarioCantidadChange = (stock_id, valor) => {
    setInventarioItems(prev => prev.map(i => i.stock_id===stock_id ? {...i,nueva_cantidad:Math.max(0,parseInt(valor)||0)} : i));
  };

  const handleConfirmarInventario = async () => {
    if (!kioscoInventario||inventarioItems.length===0) { showSnackbarMsg("Seleccioná un kiosco","warning"); return; }
    setSavingInventario(true);
    try {
      const r = await fetch(`${API_URL}/stock/inventario/${kioscoInventario}`, {
        method:"POST", credentials:"include", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({items:inventarioItems.map(i=>({stock_id:i.stock_id,cantidad:i.nueva_cantidad})),observaciones:observacionesInventario||undefined}),
      });
      if (!r.ok) { const d=await r.json(); showSnackbarMsg(d.message||"Error","error"); return; }
      const d = await r.json();
      showSnackbarMsg(`Inventario cerrado: ${d.total_productos} productos · $${parseFloat(d.valor_total).toLocaleString("es-ES",{minimumFractionDigits:0})}`);
      await fetchStock(); await fetchHistorialInventarios();
      setInventarioItems([]); setKioscoInventario(""); setObservacionesInventario("");
      setInvItemsPage(0);
    } catch (e) { showSnackbarMsg("Error al cerrar inventario","error"); }
    finally { setSavingInventario(false); }
  };

  // ─── Ver / editar inventario histórico ────────────────────────
  const handleVerDetalle = async (inv, mode="view") => {
    setDetalleMode(mode);
    setDetalleDialogOpen(true);
    setInventarioDetalle(null);
    await fetchDetalleInventario(inv);
  };

  const handleDetalleItemChange = (stock_id, valor) => {
    setInventarioDetalle(prev => ({
      ...prev,
      items: prev.items.map(i => i.stock_id===stock_id ? {...i,nueva_cantidad:Math.max(0,parseInt(valor)||0)} : i),
    }));
  };

  const handleGuardarDesdeDetalle = async () => {
    if (!inventarioDetalle) return;
    setSavingInventario(true);
    try {
      const kiosco_id = inventarioDetalle.kiosco_id;
      const r = await fetch(`${API_URL}/stock/inventario/${kiosco_id}`, {
        method:"POST", credentials:"include", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          items: inventarioDetalle.items.map(i=>({stock_id:i.stock_id,cantidad:i.nueva_cantidad})),
          observaciones: `Basado en inventario del ${fmtFecha(inventarioDetalle.created_at,false)}`,
        }),
      });
      if (!r.ok) { const d=await r.json(); showSnackbarMsg(d.message||"Error","error"); return; }
      showSnackbarMsg("Nuevo inventario guardado correctamente");
      setDetalleDialogOpen(false); setInventarioDetalle(null);
      await fetchStock(); await fetchHistorialInventarios();
    } catch (e) { showSnackbarMsg("Error al guardar","error"); }
    finally { setSavingInventario(false); }
  };

  // ─── PDF stock ──────────────────────────────────────────────
  const handleDescargarPDF = async () => {
    if (filteredStock.length===0) { showSnackbarMsg("No hay datos","warning"); return; }
    setGeneratingPDF(true);
    try {
      const doc=new jsPDF({orientation:"landscape"});
      const primary=[102,126,234],textC=[15,23,42],grayC=[100,116,139];
      const pageW=doc.internal.pageSize.getWidth();
      doc.setFillColor(...primary); doc.rect(0,0,pageW,45,"F");
      // eslint-disable-next-line no-empty
      if (logoBase64) { try { doc.addImage(logoBase64,"PNG",14,8,30,30); } catch {} }
      doc.setTextColor(255,255,255); doc.setFontSize(22); doc.setFont(undefined,"bold");
      doc.text("Reporte de Stock",pageW/2,17,{align:"center"});
      doc.setFontSize(9); doc.setFont(undefined,"normal");
      doc.text(doc.splitTextToSize(buildFiltroTexto({searchText,kioscoFilter,kioscos,productoFilter,productos,stockStatus,precioMin,precioMax,showInactiveProducts}),pageW-110)[0],pageW/2,27,{align:"center"});
      doc.setFontSize(8); doc.setTextColor(...grayC);
      doc.text(`Generado: ${fmtFecha(new Date().toISOString())}`,pageW/2,42,{align:"center"});

      const totalReg=filteredStock.length,agotados=filteredStock.filter(i=>i.cantidad===0).length,
        bajoStock=filteredStock.filter(i=>i.cantidad>0&&i.cantidad<=10).length,
        normal=filteredStock.filter(i=>i.cantidad>10).length,
        totalUnid=filteredStock.reduce((a,i)=>a+i.cantidad,0),
        valorTotal=filteredStock.reduce((a,i)=>a+i.cantidad*getProductoPrecio(i.producto_id),0);

      doc.setTextColor(...textC); doc.setFontSize(12); doc.setFont(undefined,"bold");
      doc.text("Resumen Estadístico",14,56); doc.setFontSize(10);
      const c1=14,c2=pageW/2+10;
      doc.setFont(undefined,"normal"); doc.text("Total registros:",c1,64); doc.setFont(undefined,"bold"); doc.text(`${totalReg}`,c1+55,64);
      doc.setFont(undefined,"normal"); doc.text("Total unidades:",c1,70); doc.setFont(undefined,"bold"); doc.text(`${totalUnid.toLocaleString("es-ES")} unid.`,c1+55,70);
      doc.setFont(undefined,"normal"); doc.text("Valor total:",c1,76); doc.setFont(undefined,"bold"); doc.text(`$${valorTotal.toLocaleString("es-ES",{minimumFractionDigits:2})}`,c1+55,76);
      doc.setFont(undefined,"normal"); doc.setTextColor(...textC); doc.text("Agotados:",c2,64); doc.setFont(undefined,"bold"); doc.setTextColor(220,38,38); doc.text(`${agotados}`,c2+55,64);
      doc.setFont(undefined,"normal"); doc.setTextColor(...textC); doc.text("Bajo stock:",c2,70); doc.setFont(undefined,"bold"); doc.setTextColor(146,64,14); doc.text(`${bajoStock}`,c2+55,70);
      doc.setFont(undefined,"normal"); doc.setTextColor(...textC); doc.text("Normal:",c2,76); doc.setFont(undefined,"bold"); doc.setTextColor(5,150,105); doc.text(`${normal}`,c2+55,76);
      doc.setTextColor(...textC);

      autoTable(doc,{
        startY:84,head:[["ID","Producto","Kiosco","P. Venta","P. Costo","Margen","Cantidad","Val. Total","Estado","Producto"]],
        body:filteredStock.map(item=>{
          const kiosco=kioscos.find(k=>k.id===item.kiosco_id),precio=getProductoPrecio(item.producto_id),costo=getProductoPrecioCosto(item.producto_id),margen=getProductoMargen(item.producto_id),activo=getProductoActivo(item.producto_id);
          let est="Normal";if(item.cantidad===0)est="AGOTADO";else if(item.cantidad<=10)est="BAJO";
          return[`#${item.id}`,getProductoNombreSimple(item.producto_id),kiosco?.nombre??`Kiosco ${item.kiosco_id}`,`$${precio.toFixed(2)}`,costo!==null?`$${costo.toFixed(2)}`:"—",margen!==null?`$${margen.toFixed(2)}`:"—",`${item.cantidad}`,`$${(precio*item.cantidad).toLocaleString("es-ES",{minimumFractionDigits:2})}`,est,activo?"Activo":"Inactivo"];
        }),
        theme:"striped",headStyles:{fillColor:primary,textColor:[255,255,255],fontSize:8,fontStyle:"bold",halign:"center"},bodyStyles:{textColor:textC,fontSize:7,halign:"center"},alternateRowStyles:{fillColor:[248,250,252]},
        margin:{left:14,right:14},columnStyles:{0:{cellWidth:12},1:{cellWidth:52,halign:"left"},2:{cellWidth:38,halign:"left"},3:{cellWidth:22},4:{cellWidth:22},5:{cellWidth:22},6:{cellWidth:18},7:{cellWidth:26},8:{cellWidth:20},9:{cellWidth:18}},
        didDrawCell:(data)=>{if(data.section!=="body")return;if(data.column.index===8){const val=data.cell.raw;if(val==="AGOTADO"||val==="BAJO"){const bg=val==="AGOTADO"?[254,226,226]:[254,243,199],fg=val==="AGOTADO"?[153,27,27]:[146,64,14];doc.setFillColor(...bg);doc.rect(data.cell.x,data.cell.y,data.cell.width,data.cell.height,"F");doc.setTextColor(...fg);doc.setFontSize(7);doc.setFont(undefined,"bold");doc.text(val,data.cell.x+data.cell.width/2,data.cell.y+data.cell.height/2+1,{align:"center"});doc.setTextColor(...textC);}}if(data.column.index===9&&data.cell.raw==="Inactivo"){doc.setFillColor(254,226,226);doc.rect(data.cell.x,data.cell.y,data.cell.width,data.cell.height,"F");doc.setTextColor(153,27,27);doc.setFontSize(7);doc.text("Inactivo",data.cell.x+data.cell.width/2,data.cell.y+data.cell.height/2+1,{align:"center"});doc.setTextColor(...textC);}if(data.column.index===5&&data.cell.raw!=="—"){const val=parseFloat(data.cell.raw.replace("$","").replace(".","").replace(",","."));if(!isNaN(val)&&val>0){doc.setTextColor(5,150,105);doc.setFontSize(7);doc.text(data.cell.raw,data.cell.x+data.cell.width/2,data.cell.y+data.cell.height/2+1,{align:"center"});doc.setTextColor(...textC);}}},
      });
      const pc=doc.internal.getNumberOfPages();for(let i=1;i<=pc;i++){doc.setPage(i);const pH=doc.internal.pageSize.height;doc.setFontSize(8);doc.setTextColor(...grayC);doc.text(`Página ${i} de ${pc}`,pageW/2,pH-10,{align:"center"});doc.text("Sistema de Gestión ZOIMA",14,pH-10);doc.text(`Total: ${totalReg} registros`,pageW-14,pH-10,{align:"right"});}
      doc.save(`Stock_${Date.now()}.pdf`);
      showSnackbarMsg("PDF descargado exitosamente");
    } catch (e) { showSnackbarMsg("Error al generar el PDF","error"); }
    finally { setGeneratingPDF(false); }
  };

  // ─── PDF de inventario histórico ──────────────────────────────
  const handleDescargarPDFInventario = async (inv) => {
    if (!inv?.items?.length) { showSnackbarMsg("No hay datos para exportar","warning"); return; }
    setGeneratingPDFInv(true);
    try {
      const doc=new jsPDF({orientation:"landscape"});
      const primary=[102,126,234],textC=[15,23,42],grayC=[100,116,139];
      const pageW=doc.internal.pageSize.getWidth();

      doc.setFillColor(...primary); doc.rect(0,0,pageW,47,"F");
      // eslint-disable-next-line no-empty
      if (logoBase64) { try { doc.addImage(logoBase64,"PNG",14,8,30,30); } catch {} }
      doc.setTextColor(255,255,255); doc.setFontSize(20); doc.setFont(undefined,"bold");
      doc.text("Inventario de Stock",pageW/2,17,{align:"center"});
      doc.setFontSize(10); doc.setFont(undefined,"normal");
      doc.text(`Kiosco: ${inv.kiosco_nombre}`,pageW/2,27,{align:"center"});
      doc.setFontSize(8); doc.setTextColor(...grayC);
      doc.text(`Fecha: ${fmtFecha(inv.created_at)}  ·  Usuario: ${inv.usuario_nombre??"—"}`,pageW/2,34,{align:"center"});
      if (inv.observaciones) doc.text(`Obs: ${inv.observaciones}`,pageW/2,41,{align:"center"});

      const valorTotal=inv.items.reduce((a,i)=>a+i.cantidad_contada*i.precio,0);
      const totalUnid=inv.items.reduce((a,i)=>a+i.cantidad_contada,0);
      const conCambios=inv.items.filter(i=>i.cantidad_delta!==0).length;

      doc.setTextColor(...textC); doc.setFontSize(11); doc.setFont(undefined,"bold");
      doc.text("Resumen",14,58); doc.setFontSize(9); doc.setFont(undefined,"normal");
      doc.text(`Productos: ${inv.items.length}`,14,65);
      doc.text(`Unidades totales: ${totalUnid.toLocaleString("es-ES")}`,14,71);
      doc.text(`Valor total: $${valorTotal.toLocaleString("es-ES",{minimumFractionDigits:2})}`,14,77);
      doc.text(`Con cambios: ${conCambios}`,pageW/2,65);
      doc.text(`Valor registrado: $${parseFloat(inv.valor_total??0).toLocaleString("es-ES",{minimumFractionDigits:2})}`,pageW/2,71);

      autoTable(doc,{
        startY:84,
        head:[["Producto","Precio","Stock anterior","Contado","Diferencia","Valor línea"]],
        body:inv.items.map(i=>{const delta=i.cantidad_delta??0;return[i.producto_nombre,`$${i.precio.toFixed(2)}`,`${i.cantidad_antes}`,`${i.cantidad_contada}`,delta>0?`+${delta}`:`${delta}`,`$${(i.cantidad_contada*i.precio).toLocaleString("es-ES",{minimumFractionDigits:2})}`];}),
        theme:"striped",
        headStyles:{fillColor:primary,textColor:[255,255,255],fontSize:9,fontStyle:"bold",halign:"center"},
        bodyStyles:{textColor:textC,fontSize:8,halign:"center"},
        alternateRowStyles:{fillColor:[248,250,252]},
        margin:{left:14,right:14},
        columnStyles:{0:{cellWidth:80,halign:"left"},1:{cellWidth:28},2:{cellWidth:30},3:{cellWidth:28},4:{cellWidth:28},5:{cellWidth:50}},
        didDrawCell:(data)=>{
          if(data.section!=="body"||data.column.index!==4) return;
          const val=parseFloat(data.cell.raw);
          if(isNaN(val)||val===0) return;
          const bg=val>0?[209,250,229]:[254,226,226],fg=val>0?[5,150,105]:[153,27,27];
          doc.setFillColor(...bg);doc.rect(data.cell.x,data.cell.y,data.cell.width,data.cell.height,"F");
          doc.setTextColor(...fg);doc.setFontSize(8);doc.setFont(undefined,"bold");
          doc.text(data.cell.raw,data.cell.x+data.cell.width/2,data.cell.y+data.cell.height/2+1,{align:"center"});
          doc.setTextColor(...textC);
        },
      });

      const pc=doc.internal.getNumberOfPages();for(let i=1;i<=pc;i++){doc.setPage(i);const pH=doc.internal.pageSize.height;doc.setFontSize(8);doc.setTextColor(...grayC);doc.text(`Página ${i} de ${pc}`,pageW/2,pH-10,{align:"center"});doc.text("Sistema de Gestión ZOIMA",14,pH-10);doc.text(`${inv.items.length} productos`,pageW-14,pH-10,{align:"right"});}
      doc.save(`Inventario_${inv.kiosco_nombre.replace(/\s+/g,"_")}_${fmtFecha(inv.created_at,false).replace(/\//g,"-")}.pdf`);
      showSnackbarMsg("PDF del inventario descargado");
    } catch (e) { console.error(e); showSnackbarMsg("Error al generar PDF del inventario","error"); }
    finally { setGeneratingPDFInv(false); }
  };

  // ─── Computed ──────────────────────────────────────────────────
  const paginatedStock = filteredStock.slice(page*rowsPerPage, page*rowsPerPage+rowsPerPage);

  // Paginados del inventario semanal
  const paginatedInvItems = inventarioItems.slice(
    invItemsPage * invItemsRowsPerPage,
    invItemsPage * invItemsRowsPerPage + invItemsRowsPerPage
  );
  const paginatedHistorial = historialInventarios.slice(
    invHistPage * invHistRowsPerPage,
    invHistPage * invHistRowsPerPage + invHistRowsPerPage
  );

  const activeFiltersCount = [kioscoFilter,productoFilter,searchText,precioMin,precioMax,stockStatus,!showInactiveProducts].filter(Boolean).length;
  const totalAlerts = alertas.length;

  if (loading && stock.length===0) {
    return <Box sx={{display:"flex",justifyContent:"center",alignItems:"center",height:400,flexDirection:"column",gap:2}}><CircularProgress/><Typography variant="body1" color="textSecondary">Cargando stock...</Typography></Box>;
  }

  return (
    <Box sx={{width:"100%"}}>

      {/* ── Header ── */}
      <Box sx={{mb:3,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:2}}>
        <Typography variant="h5" sx={{fontWeight:600,color:"white"}}>📦 Gestión de Stock</Typography>
        <Box sx={{display:"flex",alignItems:"center",gap:2,flexWrap:"wrap"}}>
          <Chip label={`Total: ${stock.length} registros`} sx={{backgroundColor:"rgba(255,255,255,0.2)",color:"white",fontWeight:500}}/>
          {activeFiltersCount>0&&<Chip label={`${activeFiltersCount} filtro${activeFiltersCount>1?"s":""} activo${activeFiltersCount>1?"s":""}`} sx={{backgroundColor:"#fbbf24",color:"#78350f",fontWeight:500}}/>}
          {totalAlerts>0&&<Chip icon={<NotificationsActive sx={{color:"#991b1b !important",fontSize:"1rem"}}/>} label={`${totalAlerts} alerta${totalAlerts>1?"s":""}`} onClick={()=>setActiveTab(0)} sx={{backgroundColor:"var(--error-light)",color:"#991b1b",fontWeight:600,cursor:"pointer","&:hover":{backgroundColor:"#fecaca"}}}/>}
        </Box>
      </Box>

      {/* ── Tabs ── */}
      <Paper sx={{mb:3,borderRadius:2,backgroundColor:"rgba(255,255,255,0.98)",boxShadow:"0 4px 12px rgba(0,0,0,0.08)"}}>
        <Tabs value={activeTab} onChange={(_,v)=>setActiveTab(v)} sx={{"& .MuiTab-root":{fontWeight:600,textTransform:"none",fontSize:"0.9rem"},"& .Mui-selected":{color:"var(--primary)"},"& .MuiTabs-indicator":{backgroundColor:"var(--primary)"}}}>
          <Tab label={<Box sx={{display:"flex",alignItems:"center",gap:1}}>📊 Resumen {totalAlerts>0&&<Box sx={{bgcolor:"#ef4444",color:"white",borderRadius:"10px",px:0.8,py:0.1,fontSize:"0.7rem",fontWeight:700}}>{totalAlerts}</Box>}</Box>}/>
          <Tab label="📋 Stock"/>
          <Tab label="🗓️ Inventario Semanal"/>
        </Tabs>
      </Paper>

      {/* ══════════════════════════════════════════════════
          TAB 0 — RESUMEN + ALERTAS
      ══════════════════════════════════════════════════ */}
      {activeTab===0&&(
        <Box>
          {loadingResumen?<Box sx={{display:"flex",justifyContent:"center",py:6}}><CircularProgress/></Box>:(
            <>
              <Typography variant="h6" sx={{color:"white",fontWeight:600,mb:2}}>💰 Valor del stock por kiosco</Typography>
              <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",sm:"1fr 1fr",md:"1fr 1fr 1fr"},gap:3,mb:4}}>
                {resumen.map(r=>{
                  const pct=r.total_productos>0?(r.productos_agotados/r.total_productos)*100:0;
                  // Calculate costo and margen from productosMap for this kiosco's stock
                  const stockDelKiosco = stock.filter(s => s.kiosco_id === r.kiosco_id);
                  const costoTotal = stockDelKiosco.reduce((acc, s) => {
                    const costo = getProductoPrecioCosto(s.producto_id);
                    return costo !== null ? acc + costo * s.cantidad : acc;
                  }, 0);
                  const hayConCosto = stockDelKiosco.some(s => getProductoPrecioCosto(s.producto_id) !== null);
                  const margenTotal = hayConCosto ? parseFloat(r.valor_total??0) - costoTotal : null;
                  const margenPct = costoTotal > 0 && margenTotal !== null ? (margenTotal / costoTotal * 100) : null;
                  return(
                  <Card key={r.kiosco_id} sx={{borderRadius:3,boxShadow:"0 4px 20px rgba(0,0,0,0.1)",border:"1px solid rgba(102,126,234,0.15)"}}>
                    <CardContent sx={{p:3}}>
                      <Typography variant="h6" sx={{fontWeight:700,mb:0.5}}>{r.kiosco_nombre}</Typography>
                      <Typography variant="body2" color="textSecondary" sx={{mb:0.5}}>Valor de venta</Typography>
                      <Typography variant="h4" sx={{fontWeight:800,color:"var(--primary)",mb:1}}>${parseFloat(r.valor_total??0).toLocaleString("es-ES",{minimumFractionDigits:0,maximumFractionDigits:0})}</Typography>
                      <Box sx={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:1,mb:1.5}}>
                        <Box sx={{p:1,backgroundColor:"var(--bg-soft)",borderRadius:1}}>
                          <Typography variant="caption" color="textSecondary" display="block">Costo total</Typography>
                          <Typography variant="body1" sx={{fontWeight:700,color:"var(--error)"}}>{hayConCosto?`$${costoTotal.toLocaleString("es-ES",{minimumFractionDigits:0})}`:"—"}</Typography>
                        </Box>
                        <Box sx={{p:1,backgroundColor:"var(--bg-soft)",borderRadius:1}}>
                          <Typography variant="caption" color="textSecondary" display="block">Margen estimado</Typography>
                          <Typography variant="body1" sx={{fontWeight:700,color:margenTotal===null?"#64748b":margenTotal>=0?"var(--primary-dark)":"var(--error)"}}>
                            {margenTotal === null ? "—" : `$${margenTotal.toLocaleString("es-ES",{minimumFractionDigits:0})}`}
                            {margenPct !== null && <Typography component="span" variant="caption" sx={{ml:0.5,color:"inherit"}}>{`(${margenPct.toFixed(0)}%)`}</Typography>}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="caption" color="textSecondary">{r.total_unidades} unidades · {r.total_productos} productos</Typography>
                      <Divider sx={{my:2}}/>
                      <Box sx={{display:"flex",justifyContent:"space-between"}}>
                        <Box sx={{textAlign:"center"}}><Typography variant="h6" sx={{fontWeight:700,color:"var(--error)"}}>{r.productos_agotados}</Typography><Typography variant="caption" color="textSecondary">Agotados</Typography></Box>
                        <Box sx={{textAlign:"center"}}><Typography variant="h6" sx={{fontWeight:700,color:"var(--warning)"}}>{r.productos_bajo_minimo}</Typography><Typography variant="caption" color="textSecondary">Bajo mínimo</Typography></Box>
                        <Box sx={{textAlign:"center"}}><Typography variant="h6" sx={{fontWeight:700,color:"var(--primary-dark)"}}>{r.productos_ok}</Typography><Typography variant="caption" color="textSecondary">OK</Typography></Box>
                      </Box>
                      {pct>0&&<Box sx={{mt:2}}><LinearProgress variant="determinate" value={pct} sx={{height:6,borderRadius:3,backgroundColor:"#f1f5f9","& .MuiLinearProgress-bar":{backgroundColor:pct>30?"var(--error)":"var(--warning)"}}}/><Typography variant="caption" color="textSecondary">{pct.toFixed(0)}% agotados</Typography></Box>}
                    </CardContent>
                  </Card>
                );})}
              </Box>
              <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center",mb:2}}>
                <Typography variant="h6" sx={{color:"white",fontWeight:600}}>🚨 Alertas ({alertas.length})</Typography>
                <Button variant="outlined" startIcon={<Refresh/>} onClick={()=>{fetchResumen();fetchAlertas();}} sx={{color:"white",borderColor:"rgba(255,255,255,0.5)","&:hover":{borderColor:"white",backgroundColor:"rgba(255,255,255,0.1)"}}}>Actualizar</Button>
              </Box>
              {loadingAlertas?<Box sx={{display:"flex",justifyContent:"center",py:4}}><CircularProgress sx={{color:"white"}}/></Box>
                :alertas.length===0?<Paper sx={{p:4,borderRadius:3,textAlign:"center"}}><CheckCircle sx={{fontSize:48,color:"var(--primary-dark)",mb:1}}/><Typography variant="h6" sx={{fontWeight:600}}>¡Todo en orden!</Typography><Typography variant="body2" color="textSecondary">No hay alertas de stock</Typography></Paper>
                :<TableContainer component={Paper} sx={{borderRadius:3}}><Table size="small"><TableHead><TableRow>{["Producto","Kiosco","Mínimo","Actual","Estado"].map(c=><TableCell key={c} sx={{fontWeight:600,backgroundColor:"var(--bg-soft)"}}>{c}</TableCell>)}</TableRow></TableHead><TableBody>{alertas.map(a=><TableRow key={a.stock_id} hover><TableCell>{a.producto_nombre}</TableCell><TableCell>{a.kiosco_nombre}</TableCell><TableCell>{a.stock_minimo} unid.</TableCell><TableCell><Typography sx={{fontWeight:700,color:a.cantidad_actual===0?"var(--error)":"var(--warning)"}}>{a.cantidad_actual} unid.</Typography></TableCell><TableCell><Chip label={a.estado_alerta==="agotado"?"AGOTADO":"BAJO MÍNIMO"} size="small" sx={{backgroundColor:a.estado_alerta==="agotado"?"var(--error-light)":"var(--warning-light)",color:a.estado_alerta==="agotado"?"#991b1b":"#92400e",fontWeight:700}}/></TableCell></TableRow>)}</TableBody></Table></TableContainer>}
            </>
          )}
        </Box>
      )}

      {/* ══════════════════════════════════════════════════
          TAB 1 — STOCK
      ══════════════════════════════════════════════════ */}
      {activeTab===1&&(
        <>
          <Paper elevation={2} sx={{mb:2,p:2,borderRadius:2,backgroundColor:"rgba(255,255,255,0.98)"}}>
            <Box sx={{display:"flex",gap:2,alignItems:"center",flexWrap:"wrap"}}>
              <Box sx={{flex:"1 1 300px",minWidth:0}}>
                <TextField fullWidth size="small" placeholder="Buscar por producto, kiosco, código o ID..." value={searchText} onChange={e=>setSearchText(e.target.value)}
                  InputProps={{startAdornment:<InputAdornment position="start"><Search sx={{color:"var(--primary)"}}/></InputAdornment>,endAdornment:searchText&&<InputAdornment position="end"><IconButton size="small" onClick={()=>setSearchText("")}><Clear fontSize="small"/></IconButton></InputAdornment>}}/>
              </Box>
              <Box sx={{display:"flex",gap:1,flexShrink:0}}>
                <Button variant={showAdvancedFilters?"contained":"outlined"} startIcon={showAdvancedFilters?<ExpandLess/>:<ExpandMore/>} onClick={()=>setShowAdvancedFilters(!showAdvancedFilters)} sx={{backgroundColor:showAdvancedFilters?"var(--primary)":"white",color:showAdvancedFilters?"white":"var(--primary)",borderColor:"var(--primary)","&:hover":{backgroundColor:showAdvancedFilters?"var(--primary-dark)":"#f1f5f9"}}}>Filtros</Button>
                <Button variant="outlined" startIcon={<Refresh/>} onClick={fetchStock} sx={{color:"var(--primary)",borderColor:"var(--primary)","&:hover":{backgroundColor:"#f1f5f9"}}}>Actualizar</Button>
                {activeFiltersCount>0&&<Button variant="outlined" startIcon={<Clear/>} onClick={handleClearAllFilters}>Limpiar</Button>}
                <Tooltip title={filteredStock.length===0?"No hay datos para exportar":""} arrow>
                  <span>
                    <Button variant="contained" startIcon={generatingPDF?<CircularProgress size={16} sx={{color:"white"}}/>:<PictureAsPdf/>} onClick={handleDescargarPDF} disabled={filteredStock.length===0||generatingPDF}
                      sx={{background:"linear-gradient(135deg, #ef4444 0%, var(--error) 100%)",color:"white",fontWeight:600,boxShadow:"0 4px 12px rgba(239,68,68,0.3)","&:hover":{background:"linear-gradient(135deg, var(--error) 0%, #b91c1c 100%)",transform:"translateY(-1px)"},"&:disabled":{background:"rgba(0,0,0,0.12)"},transition:"all 0.2s",whiteSpace:"nowrap"}}>
                      {generatingPDF?"Generando...":activeFiltersCount>0?`PDF (${filteredStock.length})`:"PDF"}
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          </Paper>

          {showAdvancedFilters&&(
            <Paper elevation={1} sx={{mb:3,p:3,borderRadius:2,backgroundColor:"rgba(255,255,255,0.95)"}}>
              <Box sx={{display:"flex",alignItems:"center",mb:3}}><FilterList sx={{mr:1,color:"var(--primary)"}}/><Typography variant="subtitle1" sx={{fontWeight:600}}>Filtros Avanzados</Typography></Box>
              <Typography variant="subtitle2" sx={{fontWeight:600,mb:2,color:"#64748b"}}>Filtros principales</Typography>
              <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",sm:"1fr 1fr",md:"1fr 1fr 1fr"},gap:3,mb:3}}>
                <FormControl fullWidth size="small"><InputLabel>Kiosco</InputLabel><Select value={kioscoFilter} label="Kiosco" onChange={e=>setKioscoFilter(e.target.value)}><MenuItem value="">Todos</MenuItem>{kioscos.map(k=><MenuItem key={k.id} value={k.id.toString()}>{k.nombre}</MenuItem>)}</Select></FormControl>
                <FormControl fullWidth size="small"><InputLabel>Producto</InputLabel><Select value={productoFilter} label="Producto" onChange={e=>setProductoFilter(e.target.value)}><MenuItem value="">Todos</MenuItem>{productos.map(p=><MenuItem key={p.id} value={p.id.toString()}>{p.nombre}</MenuItem>)}</Select></FormControl>
                <FormControl fullWidth size="small"><InputLabel>Estado de Stock</InputLabel><Select value={stockStatus} label="Estado de Stock" onChange={e=>setStockStatus(e.target.value)}><MenuItem value="">Todos</MenuItem><MenuItem value="agotado">Agotado (0)</MenuItem><MenuItem value="bajo">Bajo (1-10)</MenuItem><MenuItem value="normal">Normal (+10)</MenuItem></Select></FormControl>
              </Box>
              <Divider sx={{my:3}}/>
              <Typography variant="subtitle2" sx={{fontWeight:600,mb:2,color:"#64748b"}}>Filtros secundarios</Typography>
              <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",sm:"1fr 1fr",md:"1fr 1fr 1fr 1fr"},gap:3,alignItems:"center"}}>
                <FormControl fullWidth size="small"><InputLabel>Ordenar por</InputLabel><Select value={`${orderBy}-${orderDirection}`} label="Ordenar por" onChange={e=>{const[f,d]=e.target.value.split("-");setOrderBy(f);setOrderDirection(d);}}><MenuItem value="id-asc">ID ↑</MenuItem><MenuItem value="id-desc">ID ↓</MenuItem><MenuItem value="producto-asc">Producto A-Z</MenuItem><MenuItem value="producto-desc">Producto Z-A</MenuItem><MenuItem value="cantidad-asc">Cantidad ↑</MenuItem><MenuItem value="cantidad-desc">Cantidad ↓</MenuItem><MenuItem value="precio-asc">Precio ↑</MenuItem><MenuItem value="precio-desc">Precio ↓</MenuItem></Select></FormControl>
                <TextField fullWidth size="small" type="number" label="Precio mínimo" value={precioMin} onChange={e=>setPrecioMin(e.target.value)} InputProps={{startAdornment:<InputAdornment position="start">$</InputAdornment>}}/>
                <TextField fullWidth size="small" type="number" label="Precio máximo" value={precioMax} onChange={e=>setPrecioMax(e.target.value)} InputProps={{startAdornment:<InputAdornment position="start">$</InputAdornment>}}/>
                <FormControlLabel control={<Checkbox checked={showInactiveProducts} onChange={e=>setShowInactiveProducts(e.target.checked)}/>} label="Mostrar inactivos"/>
              </Box>
            </Paper>
          )}

          {filteredStock.length>0&&<Box sx={{mb:2}}><Typography variant="body2" color="white" sx={{fontWeight:500}}>Mostrando {paginatedStock.length} de {filteredStock.length} resultado{filteredStock.length!==1?"s":""}{filteredStock.length!==stock.length&&` (${stock.length} totales)`}</Typography></Box>}

          <TableContainer component={Paper} sx={{borderRadius:3,boxShadow:"0 8px 32px rgba(102,126,234,0.15)",backgroundColor:"rgba(255,255,255,0.95)",maxHeight:600}}>
            <Table stickyHeader>
              <TableHead><TableRow>{["ID","Producto","P. Venta","P. Costo","Margen","Stock Mín.","Kiosco","Cantidad","Acciones"].map(col=><TableCell key={col} sx={{fontWeight:600,backgroundColor:"var(--bg-soft)"}}>{col}</TableCell>)}</TableRow></TableHead>
              <TableBody>
                {filteredStock.length===0
                  ? <TableRow><TableCell colSpan={9} align="center" sx={{py:4}}><Typography variant="body1" color="textSecondary">No hay stock disponible</Typography></TableCell></TableRow>
                  : paginatedStock.map(item=>{
                    const kiosco=kioscos.find(k=>k.id===item.kiosco_id),productoActivo=getProductoActivo(item.producto_id),productoPrecio=getProductoPrecio(item.producto_id),productoCosto=getProductoPrecioCosto(item.producto_id),margen=getProductoMargen(item.producto_id),stockMinimo=getProductoStockMinimo(item.producto_id),esBajo=item.cantidad>0&&item.cantidad<=Math.max(stockMinimo,10),esAgotado=item.cantidad===0;
                    const margenColor = margen === null ? "#64748b" : margen > 0 ? "var(--primary-dark)" : "var(--error)";
                    return(
                      <TableRow key={item.id} hover sx={{backgroundColor:!productoActivo?"rgba(254,226,226,0.1)":"inherit"}}>
                        <TableCell><Typography variant="body2" color="textSecondary">#{item.id}</Typography></TableCell>
                        <TableCell><Box sx={{display:"flex",alignItems:"center",gap:1}}><Box><Typography variant="body1" sx={{fontWeight:500}}>{getProductoNombreSimple(item.producto_id)}</Typography><Typography variant="caption" color="textSecondary">ID: {item.producto_id}</Typography></Box>{!productoActivo&&<Warning fontSize="small" sx={{color:"#ef4444"}}/>}</Box></TableCell>
                        <TableCell><Typography variant="body1" sx={{fontWeight:600,color:"var(--primary-dark)"}}>${productoPrecio.toFixed(2)}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{color:"#64748b",fontWeight:500}}>{productoCosto !== null ? `$${productoCosto.toFixed(2)}` : "—"}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{fontWeight:600,color:margenColor}}>{fmtMargen(margen)}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{color:"#64748b",fontWeight:500}}>{stockMinimo} unid.</Typography></TableCell>
                        <TableCell><Typography variant="body1" sx={{fontWeight:500}}>{kiosco?kiosco.nombre:`Kiosco ${item.kiosco_id}`}</Typography><Typography variant="caption" color="textSecondary">ID: {item.kiosco_id}</Typography></TableCell>
                        <TableCell><Box sx={{display:"flex",alignItems:"center",gap:1}}><Typography variant="body1" sx={{fontWeight:700,color:esAgotado?"var(--error)":esBajo?"var(--warning)":"var(--primary-dark)",fontSize:"1.05rem"}}>{item.cantidad} unid.</Typography>{esAgotado&&<Chip label="AGOTADO" size="small" sx={{backgroundColor:"var(--error-light)",color:"#991b1b",fontWeight:700,fontSize:"0.65rem"}}/>}{!esAgotado&&esBajo&&<Chip label="BAJO" size="small" sx={{backgroundColor:"var(--warning-light)",color:"#92400e",fontWeight:700,fontSize:"0.65rem"}}/>}</Box></TableCell>
                        <TableCell>
                          <Box sx={{display:"flex",gap:0.5}}>
                            <Tooltip title="Registrar movimiento" arrow><IconButton size="small" sx={{backgroundColor:"#f0fdf4","&:hover":{backgroundColor:"#dcfce7",transform:"scale(1.1)"},transition:"all 0.2s"}} onClick={()=>handleOpenMovimiento(item)}><Add fontSize="small" sx={{color:"var(--primary-dark)"}}/></IconButton></Tooltip>
                            <Tooltip title="Ver historial de movimientos" arrow><IconButton size="small" sx={{backgroundColor:"#f0f9ff","&:hover":{backgroundColor:"var(--info-light)",transform:"scale(1.1)"},transition:"all 0.2s"}} onClick={()=>handleOpenHistorial(item)}><History fontSize="small" sx={{color:"var(--info)"}}/></IconButton></Tooltip>
                            <Tooltip title={productoActivo?"Editar cantidad directamente":"Producto inactivo"} arrow><span><IconButton size="small" sx={{backgroundColor:"#f3f4f6","&:hover":{backgroundColor:"#e5e7eb",transform:"scale(1.1)"},transition:"all 0.2s"}} onClick={()=>handleEditClick(item)} disabled={!productoActivo}><Edit fontSize="small" sx={{color:productoActivo?"var(--primary)":"#9ca3af"}}/></IconButton></span></Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                }
              </TableBody>
            </Table>
          </TableContainer>

          {filteredStock.length>0&&<Paper sx={{mt:2,borderRadius:2,backgroundColor:"rgba(255,255,255,0.95)"}}><TablePagination component="div" count={filteredStock.length} page={page} onPageChange={handleChangePage} rowsPerPage={rowsPerPage} onRowsPerPageChange={handleChangeRowsPerPage} rowsPerPageOptions={[10,15,25,50,100]} labelRowsPerPage="Filas por página:" labelDisplayedRows={({from,to,count})=>`${from}-${to} de ${count}`}/></Paper>}
        </>
      )}

      {/* ══════════════════════════════════════════════════
          TAB 2 — INVENTARIO SEMANAL
      ══════════════════════════════════════════════════ */}
      {activeTab===2&&(
        <Box>
          {/* ── Formulario nuevo inventario ── */}
          <Paper sx={{p:3,borderRadius:3,mb:3,backgroundColor:"rgba(255,255,255,0.98)",boxShadow:"0 4px 12px rgba(0,0,0,0.08)"}}>
            <Typography variant="h6" sx={{fontWeight:700,mb:1}}>🗓️ Nuevo Inventario Semanal</Typography>
            <Typography variant="body2" color="textSecondary" sx={{mb:3}}>
              Seleccioná el kiosco, ingresá las cantidades contadas y confirmá. Podés cargar las cantidades del último inventario como punto de partida.
            </Typography>

            <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",md:"1fr 1fr"},gap:3,mb:3}}>
              <FormControl fullWidth size="small">
                <InputLabel>Kiosco a inventariar</InputLabel>
                <Select value={kioscoInventario} label="Kiosco a inventariar" onChange={e=>handleKioscoInventarioChange(e.target.value)}>
                  <MenuItem value="">Seleccioná un kiosco</MenuItem>
                  {kioscos.filter(k=>k.activo).map(k=><MenuItem key={k.id} value={k.id.toString()}>{k.nombre}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField fullWidth size="small" label="Observaciones (opcional)" value={observacionesInventario} onChange={e=>setObservacionesInventario(e.target.value)} placeholder="Ej: Inventario semana del 01/01"/>
            </Box>

            {/* Botón usar stock actual como base */}
            {kioscoInventario&&inventarioItems.length>0&&(
              <Box sx={{mb:3}}>
                <Tooltip title="Reemplaza los valores de 'Cantidad contada' con el stock actual del sistema para todos los productos" arrow>
                  <Button variant="outlined" startIcon={<ContentCopy/>}
                    onClick={()=>{
                      setInventarioItems(prev => prev.map(i => ({ ...i, nueva_cantidad: i.cantidad })));
                      setInvItemsPage(0);
                      showSnackbarMsg("Cantidades actualizadas desde el stock actual del sistema", "info");
                    }}
                    sx={{borderColor:"var(--info)",color:"var(--info)","&:hover":{backgroundColor:"#f0f9ff",borderColor:"#0284c7"}}}>
                    📊 Usar stock actual como base
                  </Button>
                </Tooltip>
              </Box>
            )}

            {loadingInventario&&<LinearProgress sx={{mb:2}}/>}

            {inventarioItems.length>0&&(
              <>
                <Box sx={{mb:2,p:2,backgroundColor:"#f0fdf4",borderRadius:2,border:"1px solid #bbf7d0"}}>
                  <Typography variant="body2" sx={{color:"#065f46",fontWeight:500}}>
                    ✅ {inventarioItems.length} productos cargados · mostrando {paginatedInvItems.length} en esta página.
                  </Typography>
                </Box>

                {/* ── Tabla paginada de productos del inventario activo ── */}
                <TableContainer sx={{mb:0,border:"1px solid #e2e8f0",borderRadius:"8px 8px 0 0"}}>
                  <Table size="small" stickyHeader>
                    <TableHead><TableRow>
                      <TableCell sx={{fontWeight:600,backgroundColor:"var(--bg-soft)"}}>Producto</TableCell>
                      <TableCell sx={{fontWeight:600,backgroundColor:"var(--bg-soft)"}}>Precio</TableCell>
                      <TableCell sx={{fontWeight:600,backgroundColor:"var(--bg-soft)"}}>Stock actual</TableCell>
                      <TableCell sx={{fontWeight:600,backgroundColor:"var(--bg-soft)"}}>Cantidad contada</TableCell>
                      <TableCell sx={{fontWeight:600,backgroundColor:"var(--bg-soft)"}}>Diferencia</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                      {paginatedInvItems.map(item=>{
                        const diff=item.nueva_cantidad-item.cantidad;
                        return(
                          <TableRow key={item.stock_id} hover>
                            <TableCell><Typography variant="body2" sx={{fontWeight:500}}>{item.producto_nombre}</Typography></TableCell>
                            <TableCell><Typography variant="body2" sx={{color:"var(--primary-dark)"}}>${parseFloat(item.precio).toFixed(2)}</Typography></TableCell>
                            <TableCell><Typography variant="body2">{item.cantidad} unid.</Typography></TableCell>
                            <TableCell sx={{width:140}}>
                              <TextField size="small" type="number" value={item.nueva_cantidad}
                                onChange={e=>handleInventarioCantidadChange(item.stock_id,e.target.value)}
                                inputProps={{min:0,style:{textAlign:"center",fontWeight:700}}} sx={{width:100}}/>
                            </TableCell>
                            <TableCell>
                              {diff!==0
                                ?<Chip label={`${diff>0?"+":""}${diff}`} size="small"
                                    icon={diff>0?<ArrowUpward sx={{fontSize:"0.8rem !important"}}/>:<ArrowDownward sx={{fontSize:"0.8rem !important"}}/>}
                                    sx={{backgroundColor:diff>0?"var(--success-light)":"var(--error-light)",color:diff>0?"#065f46":"#991b1b",fontWeight:700}}/>
                                :<Typography variant="caption" color="textSecondary">Sin cambios</Typography>}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Paginador de productos del inventario activo */}
                <Paper variant="outlined" sx={{borderTop:0,borderRadius:"0 0 8px 8px",mb:3}}>
                  <TablePagination
                    component="div"
                    count={inventarioItems.length}
                    page={invItemsPage}
                    onPageChange={(_, p) => setInvItemsPage(p)}
                    rowsPerPage={invItemsRowsPerPage}
                    onRowsPerPageChange={e => { setInvItemsRowsPerPage(parseInt(e.target.value, 10)); setInvItemsPage(0); }}
                    rowsPerPageOptions={[10, 15, 25]}
                    labelRowsPerPage="Por página:"
                    labelDisplayedRows={({from,to,count})=>`${from}-${to} de ${count} productos`}
                  />
                </Paper>

                {/* ── Totales resumen ── */}
                <Box sx={{mb:3,p:2,backgroundColor:"var(--bg-soft)",borderRadius:2,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:2}}>
                  <Box sx={{textAlign:"center"}}><Typography variant="h5" sx={{fontWeight:800,color:"var(--primary)"}}>{inventarioItems.reduce((a,i)=>a+i.nueva_cantidad,0)}</Typography><Typography variant="caption" color="textSecondary">Total unidades</Typography></Box>
                  <Box sx={{textAlign:"center"}}><Typography variant="h5" sx={{fontWeight:800,color:"var(--primary-dark)"}}>${inventarioItems.reduce((a,i)=>a+i.nueva_cantidad*parseFloat(i.precio),0).toLocaleString("es-ES",{minimumFractionDigits:0})}</Typography><Typography variant="caption" color="textSecondary">Valor venta total</Typography></Box>
                  <Box sx={{textAlign:"center"}}>
                    {(()=>{
                      const hayConCosto = inventarioItems.some(i => getProductoPrecioCosto(i.producto_id) !== null);
                      const costoTotal = inventarioItems.reduce((a,i)=>{ const c=getProductoPrecioCosto(i.producto_id); return c!==null ? a+i.nueva_cantidad*c : a; },0);
                      return hayConCosto
                        ? <><Typography variant="h5" sx={{fontWeight:800,color:"var(--error)"}}>${costoTotal.toLocaleString("es-ES",{minimumFractionDigits:0})}</Typography><Typography variant="caption" color="textSecondary">Costo total</Typography></>
                        : <><Typography variant="h5" sx={{fontWeight:800,color:"#64748b"}}>—</Typography><Typography variant="caption" color="textSecondary">Costo total</Typography></>;
                    })()}
                  </Box>
                  <Box sx={{textAlign:"center"}}>
                    {(()=>{
                      const hayConCosto = inventarioItems.some(i => getProductoPrecioCosto(i.producto_id) !== null);
                      if (!hayConCosto) return <><Typography variant="h5" sx={{fontWeight:800,color:"#64748b"}}>—</Typography><Typography variant="caption" color="textSecondary">Margen estimado</Typography></>;
                      const ventaTotal = inventarioItems.reduce((a,i)=>a+i.nueva_cantidad*parseFloat(i.precio),0);
                      const costoTotal = inventarioItems.reduce((a,i)=>{ const c=getProductoPrecioCosto(i.producto_id); return c!==null ? a+i.nueva_cantidad*c : a; },0);
                      const margen = ventaTotal - costoTotal;
                      return <><Typography variant="h5" sx={{fontWeight:800,color:margen>=0?"var(--primary-dark)":"var(--error)"}}>${margen.toLocaleString("es-ES",{minimumFractionDigits:0})}</Typography><Typography variant="caption" color="textSecondary">Margen estimado</Typography></>;
                    })()}
                  </Box>
                </Box>

                <Button fullWidth variant="contained" size="large" onClick={handleConfirmarInventario} disabled={savingInventario}
                  startIcon={savingInventario?<CircularProgress size={18} sx={{color:"white"}}/>:<CheckCircle/>}
                  sx={{background:"linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",color:"white",fontWeight:700,py:1.5,fontSize:"1rem",borderRadius:2,boxShadow:"0 4px 12px rgba(102,126,234,0.35)","&:hover":{transform:"translateY(-1px)"},transition:"all 0.2s"}}>
                  {savingInventario?"Cerrando inventario...":"✅ Confirmar Inventario"}
                </Button>
              </>
            )}

            {!loadingInventario&&!kioscoInventario&&(
              <Box sx={{textAlign:"center",py:4,color:"#94a3b8"}}>
                <Inventory2 sx={{fontSize:48,mb:1,opacity:0.5}}/>
                <Typography variant="body1">Seleccioná un kiosco para comenzar</Typography>
              </Box>
            )}
          </Paper>

          {/* ── Historial de inventarios cerrados (colapsable) ── */}
          <Paper sx={{p:3,borderRadius:3,backgroundColor:"rgba(255,255,255,0.98)",boxShadow:"0 4px 12px rgba(0,0,0,0.08)"}}>
            <Box
              sx={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",userSelect:"none"}}
              onClick={()=>setShowHistorialInv(v=>!v)}
            >
              <Box sx={{display:"flex",alignItems:"center",gap:1.5}}>
                <History sx={{color:"var(--primary)"}}/>
                <Typography variant="h6" sx={{fontWeight:700}}>
                  📚 Historial de Inventarios Cerrados
                  {historialInventarios.length>0&&
                    <Typography component="span" variant="body2" color="textSecondary" sx={{ml:1,fontWeight:400}}>
                      ({historialInventarios.length} en total)
                    </Typography>
                  }
                </Typography>
              </Box>
              <Box sx={{display:"flex",alignItems:"center",gap:1}}>
                {!showHistorialInv&&historialInventarios.length>0&&(
                  <Chip label={`${historialInventarios.length} registros`} size="small" sx={{backgroundColor:"#ede9fe",color:"#7c3aed",fontWeight:600}}/>
                )}
                <IconButton size="small" sx={{color:"var(--primary)"}}>
                  {showHistorialInv?<ExpandLess/>:<ExpandMore/>}
                </IconButton>
              </Box>
            </Box>

            {showHistorialInv&&(
              <Box sx={{mt:3}}>
                <Box sx={{display:"flex",justifyContent:"flex-end",mb:2}}>
                  <Button variant="outlined" startIcon={<Refresh/>} onClick={e=>{e.stopPropagation();fetchHistorialInventarios();}} size="small" sx={{color:"var(--primary)",borderColor:"var(--primary)","&:hover":{backgroundColor:"#f1f5f9"}}}>Actualizar</Button>
                </Box>

            {loadingHistorialInv
              ? <Box sx={{display:"flex",justifyContent:"center",py:4}}><CircularProgress/></Box>
              : historialInventarios.length===0
                ? <Box sx={{textAlign:"center",py:4,color:"#94a3b8"}}><History sx={{fontSize:48,mb:1,opacity:0.5}}/><Typography variant="body1">No hay inventarios cerrados aún</Typography></Box>
                : (
                  <>
                    <TableContainer sx={{borderRadius:"8px 8px 0 0",border:"1px solid #e2e8f0"}}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>{["Fecha","Kiosco","Productos","Valor total","Observaciones","Usuario","Acciones"].map(c=><TableCell key={c} sx={{fontWeight:600,backgroundColor:"var(--bg-soft)"}}>{c}</TableCell>)}</TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedHistorial.map((inv, idx)=>{
                            // idx 0 solo cuando estamos en página 0
                            const esUltimo = invHistPage === 0 && idx === 0;
                            return (
                              <TableRow key={inv.id} hover sx={{backgroundColor:esUltimo?"rgba(102,126,234,0.04)":"inherit"}}>
                                <TableCell>
                                  <Typography variant="body2" sx={{fontWeight:esUltimo?700:400}}>{fmtFecha(inv.created_at)}</Typography>
                                  {esUltimo&&<Chip label="Último" size="small" sx={{backgroundColor:"#ede9fe",color:"#7c3aed",fontWeight:700,fontSize:"0.65rem",mt:0.3}}/>}
                                </TableCell>
                                <TableCell><Typography variant="body2" sx={{fontWeight:500}}>{inv.kiosco_nombre}</Typography></TableCell>
                                <TableCell><Typography variant="body2">{inv.total_productos}</Typography></TableCell>
                                <TableCell><Typography variant="body2" sx={{fontWeight:600,color:"var(--primary-dark)"}}>${parseFloat(inv.valor_total??0).toLocaleString("es-ES",{minimumFractionDigits:2})}</Typography></TableCell>
                                <TableCell><Typography variant="caption" color="textSecondary" sx={{fontStyle:"italic"}}>{inv.observaciones||"—"}</Typography></TableCell>
                                <TableCell><Typography variant="caption">{inv.usuario_nombre??"—"}</Typography></TableCell>
                                <TableCell>
                                  <Box sx={{display:"flex",gap:0.5}}>
                                    <Tooltip title="Ver detalle del inventario" arrow>
                                      <IconButton size="small" onClick={()=>handleVerDetalle(inv,"view")} sx={{backgroundColor:"#f0f9ff","&:hover":{backgroundColor:"var(--info-light)",transform:"scale(1.1)"},transition:"all 0.2s"}}>
                                        <Visibility fontSize="small" sx={{color:"var(--info)"}}/>
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Usar como base para nuevo inventario" arrow>
                                      <IconButton size="small" onClick={()=>handleVerDetalle(inv,"edit")} sx={{backgroundColor:"#fefce8","&:hover":{backgroundColor:"#fef9c3",transform:"scale(1.1)"},transition:"all 0.2s"}}>
                                        <Edit fontSize="small" sx={{color:"var(--warning)"}}/>
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Descargar PDF" arrow>
                                      <IconButton size="small" disabled={generatingPDFInv}
                                        onClick={async()=>{
                                          setInventarioDetalle(null);
                                          await fetchDetalleInventario(inv);
                                        }}
                                        sx={{backgroundColor:"#fef2f2","&:hover":{backgroundColor:"var(--error-light)",transform:"scale(1.1)"},transition:"all 0.2s"}}>
                                        <PictureAsPdf fontSize="small" sx={{color:"var(--error)"}}/>
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Paginador del historial de inventarios */}
                    <Paper variant="outlined" sx={{borderTop:0,borderRadius:"0 0 8px 8px"}}>
                      <TablePagination
                        component="div"
                        count={historialInventarios.length}
                        page={invHistPage}
                        onPageChange={(_, p) => setInvHistPage(p)}
                        rowsPerPage={invHistRowsPerPage}
                        onRowsPerPageChange={e => { setInvHistRowsPerPage(parseInt(e.target.value, 10)); setInvHistPage(0); }}
                        rowsPerPageOptions={[10, 15, 25]}
                        labelRowsPerPage="Por página:"
                        labelDisplayedRows={({from,to,count})=>`${from}-${to} de ${count} inventarios`}
                      />
                    </Paper>
                  </>
                )
              }
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {/* ══════════════════════════════════════════════════
          DIALOG — DETALLE / EDICIÓN DE INVENTARIO HISTÓRICO
      ══════════════════════════════════════════════════ */}
      <Dialog open={detalleDialogOpen} onClose={()=>{setDetalleDialogOpen(false);setInventarioDetalle(null);}} maxWidth="lg" fullWidth>
        <DialogTitle sx={{fontWeight:600,backgroundColor:"var(--bg-soft)"}}>
          <Box sx={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:2}}>
            <Box sx={{display:"flex",alignItems:"center",gap:1}}>
              {detalleMode==="view"?<Visibility sx={{color:"var(--info)"}}/>:<Edit sx={{color:"var(--warning)"}}/>}
              <Typography variant="h6" sx={{fontWeight:700}}>
                {detalleMode==="view"?"Detalle del Inventario":"Editar y guardar como nuevo inventario"}
              </Typography>
            </Box>
            {inventarioDetalle&&(
              <Box sx={{display:"flex",gap:1}}>
                <Button size="small" variant="outlined"
                  startIcon={detalleMode==="view"?<Edit/>:<Visibility/>}
                  onClick={()=>setDetalleMode(p=>p==="view"?"edit":"view")}
                  sx={{borderColor:"var(--primary)",color:"var(--primary)"}}>
                  {detalleMode==="view"?"Usar como base":"Solo ver"}
                </Button>
                <Button size="small" variant="contained"
                  startIcon={generatingPDFInv?<CircularProgress size={14} sx={{color:"white"}}/>:<PictureAsPdf/>}
                  onClick={()=>handleDescargarPDFInventario(inventarioDetalle)}
                  disabled={!inventarioDetalle?.items?.length||generatingPDFInv}
                  sx={{background:"linear-gradient(135deg, #ef4444 0%, var(--error) 100%)",color:"white"}}>
                  {generatingPDFInv?"Generando...":"PDF"}
                </Button>
              </Box>
            )}
          </Box>
        </DialogTitle>

        <DialogContent sx={{pt:2}}>
          {loadingDetalle?(
            <Box sx={{display:"flex",flexDirection:"column",alignItems:"center",py:6,gap:2}}>
              <CircularProgress/>
              <Typography variant="body2" color="textSecondary">Reconstruyendo detalle del inventario...</Typography>
            </Box>
          ):!inventarioDetalle?null:(
            <>
              <Box sx={{mb:3,p:2,backgroundColor:"var(--bg-soft)",borderRadius:2,display:"grid",gridTemplateColumns:{xs:"1fr",sm:"1fr 1fr 1fr"},gap:2}}>
                <Box><Typography variant="caption" color="textSecondary">Kiosco</Typography><Typography variant="body1" sx={{fontWeight:600}}>{inventarioDetalle.kiosco_nombre}</Typography></Box>
                <Box><Typography variant="caption" color="textSecondary">Fecha de cierre</Typography><Typography variant="body1" sx={{fontWeight:600}}>{fmtFecha(inventarioDetalle.created_at)}</Typography></Box>
                <Box><Typography variant="caption" color="textSecondary">Realizado por</Typography><Typography variant="body1" sx={{fontWeight:600}}>{inventarioDetalle.usuario_nombre??"—"}</Typography></Box>
                {inventarioDetalle.observaciones&&<Box sx={{gridColumn:"1/-1"}}><Typography variant="caption" color="textSecondary">Observaciones</Typography><Typography variant="body2" sx={{fontStyle:"italic"}}>{inventarioDetalle.observaciones}</Typography></Box>}
              </Box>

              {detalleMode==="edit"&&(
                <Alert severity="info" sx={{mb:2}}>
                  Modificá las cantidades y confirmá para crear un <strong>nuevo inventario</strong>. El original no se modifica.
                </Alert>
              )}

              {inventarioDetalle.items.length===0?(
                <Box sx={{textAlign:"center",py:4}}>
                  <Typography variant="body1" color="textSecondary">No se encontraron movimientos en ese rango de tiempo.</Typography>
                  <Typography variant="caption" color="textSecondary">Si el inventario fue muy extenso, usá el formulario de nuevo inventario.</Typography>
                </Box>
              ):(
                <>
                  <TableContainer sx={{maxHeight:420,border:"1px solid #e2e8f0",borderRadius:2}}>
                    <Table size="small" stickyHeader>
                      <TableHead><TableRow>
                        <TableCell sx={{fontWeight:600,backgroundColor:"var(--bg-soft)"}}>Producto</TableCell>
                        <TableCell sx={{fontWeight:600,backgroundColor:"var(--bg-soft)"}}>Precio</TableCell>
                        <TableCell sx={{fontWeight:600,backgroundColor:"var(--bg-soft)"}}>Stock anterior</TableCell>
                        <TableCell sx={{fontWeight:600,backgroundColor:"var(--bg-soft)"}}>{detalleMode==="edit"?"Cantidad a cargar":"Contado"}</TableCell>
                        <TableCell sx={{fontWeight:600,backgroundColor:"var(--bg-soft)"}}>Diferencia</TableCell>
                        <TableCell sx={{fontWeight:600,backgroundColor:"var(--bg-soft)"}}>Valor línea</TableCell>
                      </TableRow></TableHead>
                      <TableBody>
                        {inventarioDetalle.items.map(item=>{
                          const delta=item.cantidad_delta??0;
                          const cantMostrada=detalleMode==="edit"?item.nueva_cantidad:item.cantidad_contada;
                          return(
                            <TableRow key={item.stock_id} hover>
                              <TableCell><Typography variant="body2" sx={{fontWeight:500}}>{item.producto_nombre}</Typography></TableCell>
                              <TableCell><Typography variant="body2" sx={{color:"var(--primary-dark)"}}>${item.precio.toFixed(2)}</Typography></TableCell>
                              <TableCell><Typography variant="body2">{item.cantidad_antes}</Typography></TableCell>
                              <TableCell sx={{width:140}}>
                                {detalleMode==="edit"
                                  ?<TextField size="small" type="number" value={item.nueva_cantidad} onChange={e=>handleDetalleItemChange(item.stock_id,e.target.value)} inputProps={{min:0,style:{textAlign:"center",fontWeight:700}}} sx={{width:100}}/>
                                  :<Typography variant="body2" sx={{fontWeight:700}}>{item.cantidad_contada}</Typography>}
                              </TableCell>
                              <TableCell>{delta!==0?<Chip label={`${delta>0?"+":""}${delta}`} size="small" icon={delta>0?<ArrowUpward sx={{fontSize:"0.8rem !important"}}/>:<ArrowDownward sx={{fontSize:"0.8rem !important"}}/>} sx={{backgroundColor:delta>0?"var(--success-light)":"var(--error-light)",color:delta>0?"#065f46":"#991b1b",fontWeight:700}}/>:<Typography variant="caption" color="textSecondary">—</Typography>}</TableCell>
                              <TableCell><Typography variant="body2" sx={{fontWeight:600}}>${(cantMostrada*item.precio).toLocaleString("es-ES",{minimumFractionDigits:2})}</Typography></TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{mt:2,p:2,backgroundColor:"var(--bg-soft)",borderRadius:2,display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:2}}>
                    <Box sx={{textAlign:"center"}}><Typography variant="h6" sx={{fontWeight:800,color:"var(--primary)"}}>{inventarioDetalle.items.reduce((a,i)=>a+(detalleMode==="edit"?i.nueva_cantidad:i.cantidad_contada),0)}</Typography><Typography variant="caption" color="textSecondary">Total unidades</Typography></Box>
                    <Box sx={{textAlign:"center"}}><Typography variant="h6" sx={{fontWeight:800,color:"var(--primary-dark)"}}>${inventarioDetalle.items.reduce((a,i)=>a+(detalleMode==="edit"?i.nueva_cantidad:i.cantidad_contada)*i.precio,0).toLocaleString("es-ES",{minimumFractionDigits:0})}</Typography><Typography variant="caption" color="textSecondary">Valor total</Typography></Box>
                    <Box sx={{textAlign:"center"}}><Typography variant="h6" sx={{fontWeight:800,color:"var(--warning)"}}>{inventarioDetalle.items.filter(i=>i.cantidad_delta!==0).length}</Typography><Typography variant="caption" color="textSecondary">Con diferencias</Typography></Box>
                  </Box>
                </>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions sx={{p:2,backgroundColor:"var(--bg-soft)"}}>
          <Button onClick={()=>{setDetalleDialogOpen(false);setInventarioDetalle(null);}} startIcon={<Cancel/>} sx={{color:"#64748b"}}>Cerrar</Button>
          {detalleMode==="edit"&&inventarioDetalle?.items?.length>0&&(
            <Button variant="contained" onClick={handleGuardarDesdeDetalle} disabled={savingInventario}
              startIcon={savingInventario?<CircularProgress size={16} sx={{color:"white"}}/>:<Save/>}
              sx={{background:"linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",color:"white"}}>
              {savingInventario?"Guardando...":"Guardar como nuevo inventario"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ── Edición directa ── */}
      <Dialog open={openDialog} onClose={()=>{setOpenDialog(false);setEditingStock(null);setEditQuantity("");}} maxWidth="sm" fullWidth>
        <DialogTitle sx={{fontWeight:600,backgroundColor:"var(--bg-soft)"}}><Box sx={{display:"flex",alignItems:"center",gap:1}}><Edit sx={{color:"var(--primary)"}}/>Editar Cantidad (corrección directa)</Box></DialogTitle>
        <DialogContent sx={{pt:3}}>
          {editingStock&&<Box sx={{mb:3,p:2,backgroundColor:"#f1f5f9",borderRadius:1}}><Box sx={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:2,mb:2}}><Box><Typography variant="subtitle2" color="textSecondary"><strong>Producto:</strong></Typography><Typography variant="body1" sx={{mt:0.5}}>{getProductoNombreSimple(editingStock.producto_id)}</Typography><Typography variant="caption" color="textSecondary">Precio: ${getProductoPrecio(editingStock.producto_id).toFixed(2)}</Typography></Box><Box><Typography variant="subtitle2" color="textSecondary"><strong>Kiosco:</strong></Typography><Typography variant="body1" sx={{mt:0.5}}>{kioscos.find(k=>k.id===editingStock.kiosco_id)?.nombre||`Kiosco ${editingStock.kiosco_id}`}</Typography></Box></Box><Typography variant="subtitle2" color="textSecondary"><strong>Cantidad actual:</strong></Typography><Typography variant="h6" sx={{color:editingStock.cantidad>0?"var(--primary-dark)":"var(--error)",fontWeight:600}}>{editingStock.cantidad} unidades</Typography></Box>}
          <Alert severity="info" sx={{mb:2}}>Corrección administrativa. Para movimientos auditables usá el botón <strong>+</strong>.</Alert>
          <TextField fullWidth label="Nueva Cantidad" type="number" value={editQuantity} onChange={e=>setEditQuantity(e.target.value)} InputProps={{inputProps:{min:0}}} required autoFocus helperText="Ingresá la cantidad corregida"/>
        </DialogContent>
        <DialogActions sx={{p:2,backgroundColor:"var(--bg-soft)"}}>
          <Button onClick={()=>{setOpenDialog(false);setEditingStock(null);setEditQuantity("");}} startIcon={<Cancel/>} sx={{color:"#64748b"}}>Cancelar</Button>
          <Button variant="contained" onClick={handleUpdateStock} startIcon={<Save/>} sx={{background:"linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)"}}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* ── Movimiento rápido ── */}
      <Dialog open={movimientoDialogOpen} onClose={()=>setMovimientoDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{fontWeight:600,backgroundColor:"var(--bg-soft)"}}><Box sx={{display:"flex",alignItems:"center",gap:1}}><TrendingUp sx={{color:"var(--primary-dark)"}}/>Registrar Movimiento</Box></DialogTitle>
        <DialogContent sx={{pt:3}}>
          {movimientoStockItem&&<Box sx={{mb:3,p:2,backgroundColor:"#f1f5f9",borderRadius:1}}><Typography variant="subtitle2" sx={{fontWeight:600}}>{getProductoNombreSimple(movimientoStockItem.producto_id)} — {kioscos.find(k=>k.id===movimientoStockItem.kiosco_id)?.nombre}</Typography><Typography variant="body2" color="textSecondary">Stock actual: <strong>{movimientoStockItem.cantidad} unidades</strong></Typography></Box>}
          <Typography variant="subtitle2" sx={{fontWeight:600,mb:1.5}}>Tipo de movimiento</Typography>
          <Box sx={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:1.5,mb:3}}>
            {["ingreso","ajuste","rotura","venta"].map(tipo=>{const cfg=TIPO_CONFIG[tipo],sel=movimientoTipo===tipo;return <Box key={tipo} onClick={()=>setMovimientoTipo(tipo)} sx={{p:1.5,borderRadius:2,cursor:"pointer",textAlign:"center",border:`2px solid ${sel?cfg.color:"#e2e8f0"}`,backgroundColor:sel?cfg.bg:"white",transition:"all 0.15s","&:hover":{borderColor:cfg.color,backgroundColor:cfg.bg}}}><Box sx={{color:cfg.color,display:"flex",justifyContent:"center",mb:0.5}}>{cfg.icon}</Box><Typography variant="body2" sx={{fontWeight:sel?700:500,color:sel?cfg.color:"inherit"}}>{cfg.label}</Typography></Box>;})}
          </Box>
          <Box sx={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:2}}>
            <TextField label="Cantidad" type="number" value={movimientoCantidad} onChange={e=>setMovimientoCantidad(e.target.value)} inputProps={{min:1}} required size="small" helperText={movimientoTipo==="ingreso"?"Unidades que entran":movimientoTipo==="venta"?"Unidades vendidas":movimientoTipo==="rotura"?"Unidades dañadas":"Unidades a ajustar"}/>
            <TextField label="Motivo (opcional)" value={movimientoMotivo} onChange={e=>setMovimientoMotivo(e.target.value)} size="small" placeholder="Ej: Reposición semanal"/>
          </Box>
          {movimientoCantidad&&movimientoStockItem&&<Box sx={{mt:2,p:1.5,backgroundColor:"var(--bg-soft)",borderRadius:1}}><Typography variant="body2" color="textSecondary">Stock resultante: <strong style={{color:movimientoTipo==="ingreso"?"var(--primary-dark)":(movimientoStockItem.cantidad-(parseInt(movimientoCantidad)||0))<0?"var(--error)":"var(--info)"}}>{movimientoTipo==="ingreso"?movimientoStockItem.cantidad+(parseInt(movimientoCantidad)||0):movimientoStockItem.cantidad-(parseInt(movimientoCantidad)||0)} unidades</strong></Typography></Box>}
        </DialogContent>
        <DialogActions sx={{p:2,backgroundColor:"var(--bg-soft)"}}>
          <Button onClick={()=>setMovimientoDialogOpen(false)} startIcon={<Cancel/>} sx={{color:"#64748b"}}>Cancelar</Button>
          <Button variant="contained" onClick={handleRegistrarMovimiento} disabled={savingMovimiento} startIcon={savingMovimiento?<CircularProgress size={16} sx={{color:"white"}}/>:<Save/>} sx={{background:`linear-gradient(135deg, ${TIPO_CONFIG[movimientoTipo]?.color} 0%, ${TIPO_CONFIG[movimientoTipo]?.color}cc 100%)`}}>{savingMovimiento?"Registrando...":"Registrar Movimiento"}</Button>
        </DialogActions>
      </Dialog>

      {/* ── Historial de movimientos por ítem ── */}
      <Dialog open={historialDialogOpen} onClose={()=>setHistorialDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{fontWeight:600,backgroundColor:"var(--bg-soft)"}}>
          <Box sx={{display:"flex",alignItems:"center",gap:1}}>
            <History sx={{color:"var(--info)"}}/>Historial de Movimientos
            {historialStockItem&&<Typography variant="body2" color="textSecondary" sx={{ml:1}}>— {getProductoNombreSimple(historialStockItem.producto_id)} / {kioscos.find(k=>k.id===historialStockItem.kiosco_id)?.nombre}</Typography>}
          </Box>
        </DialogTitle>
        <DialogContent sx={{pt:2}}>
          {loadingHistorial?<Box sx={{display:"flex",justifyContent:"center",py:4}}><CircularProgress/></Box>
            :historialItems.length===0?<Box sx={{textAlign:"center",py:4}}><History sx={{fontSize:48,color:"#cbd5e1",mb:1}}/><Typography variant="body1" color="textSecondary">No hay movimientos registrados</Typography></Box>
            :<TableContainer sx={{maxHeight:450}}><Table size="small" stickyHeader><TableHead><TableRow>{["Fecha","Tipo","Antes","Movimiento","Después","Motivo","Usuario"].map(c=><TableCell key={c} sx={{fontWeight:600,backgroundColor:"var(--bg-soft)"}}>{c}</TableCell>)}</TableRow></TableHead><TableBody>{historialItems.map(m=>{const cfg=TIPO_CONFIG[m.tipo]||TIPO_CONFIG.ajuste,dp=m.cantidad_delta>=0;return(<TableRow key={m.id} hover><TableCell><Typography variant="caption">{new Date(m.created_at).toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit",year:"numeric"})}</Typography><br/><Typography variant="caption" color="textSecondary">{new Date(m.created_at).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}</Typography></TableCell><TableCell><Chip label={cfg.label} size="small" sx={{backgroundColor:cfg.bg,color:cfg.color,fontWeight:600,fontSize:"0.7rem"}}/></TableCell><TableCell><Typography variant="body2">{m.cantidad_antes}</Typography></TableCell><TableCell><Chip label={`${dp?"+":""}${m.cantidad_delta}`} size="small" icon={dp?<ArrowUpward sx={{fontSize:"0.8rem !important"}}/>:<ArrowDownward sx={{fontSize:"0.8rem !important"}}/>} sx={{backgroundColor:dp?"var(--success-light)":"var(--error-light)",color:dp?"#065f46":"#991b1b",fontWeight:700}}/></TableCell><TableCell><Typography variant="body2" sx={{fontWeight:600}}>{m.cantidad_despues}</Typography></TableCell><TableCell><Typography variant="caption" color="textSecondary">{m.motivo||"—"}</Typography></TableCell><TableCell><Typography variant="caption">{m.usuario_nombre||"Sistema"}</Typography></TableCell></TableRow>);})}</TableBody></Table></TableContainer>}
        </DialogContent>
        <DialogActions sx={{p:2,backgroundColor:"var(--bg-soft)"}}><Button onClick={()=>setHistorialDialogOpen(false)} startIcon={<Cancel/>} sx={{color:"#64748b"}}>Cerrar</Button></DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar open={openSnackbar} autoHideDuration={5000} onClose={()=>setOpenSnackbar(false)} anchorOrigin={{vertical:"bottom",horizontal:"right"}}>
        <Alert onClose={()=>setOpenSnackbar(false)} severity={snackbarSeverity} sx={{width:"100%"}}>{snackbarMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default StockTable;