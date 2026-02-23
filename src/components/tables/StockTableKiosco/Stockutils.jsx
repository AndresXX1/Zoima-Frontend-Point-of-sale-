// stock/stockUtils.js
// ─────────────────────────────────────────────────────────────────
// Constantes y helpers compartidos por todos los componentes de stock.
// ─────────────────────────────────────────────────────────────────
import { ArrowUpward, TrendingUp, Build, BrokenImage, Inventory2 } from "@mui/icons-material";

export const API_URL = "http://localhost:3000/api";

// En lugar de guardar el JSX directamente en el objeto (lo que requiere
// React en scope), guardamos el componente Icon y lo instanciamos donde
// se usa: <cfg.Icon fontSize="small" />
export const TIPO_CONFIG = {
  ingreso:    { label: "Ingreso",    color: "var(--primary-dark)",  bg: "var(--success-light)",  Icon: ArrowUpward  },
  venta:      { label: "Venta",      color: "#2563eb",              bg: "#dbeafe",               Icon: TrendingUp   },
  ajuste:     { label: "Ajuste",     color: "#7c3aed",              bg: "#ede9fe",               Icon: Build        },
  rotura:     { label: "Rotura",     color: "var(--error)",         bg: "var(--error-light)",    Icon: BrokenImage  },
  inventario: { label: "Inventario", color: "var(--warning)",       bg: "var(--warning-light)",  Icon: Inventory2   },
};

/**
 * Construye un texto descriptivo de los filtros activos (para el PDF y UI).
 */
export const buildFiltroTexto = ({
  searchText, kioscoFilter, kioscos,
  productoFilter, productos,
  stockStatus, precioMin, precioMax,
  showInactiveProducts,
}) => {
  const partes = [];
  if (searchText) partes.push(`Búsqueda: "${searchText}"`);
  if (kioscoFilter) {
    const k = kioscos.find(k => k.id.toString() === kioscoFilter);
    partes.push(`Kiosco: ${k ? k.nombre : kioscoFilter}`);
  }
  if (productoFilter) {
    const p = productos.find(p => p.id.toString() === productoFilter);
    partes.push(`Producto: ${p ? p.nombre : productoFilter}`);
  }
  if (stockStatus === "agotado") partes.push("Estado: Agotado");
  if (stockStatus === "bajo")    partes.push("Estado: Bajo stock");
  if (stockStatus === "normal")  partes.push("Estado: Normal");
  if (precioMin) partes.push(`Precio mín: $${precioMin}`);
  if (precioMax) partes.push(`Precio máx: $${precioMax}`);
  if (!showInactiveProducts) partes.push("Sólo productos activos");
  return partes.length ? partes.join("  |  ") : "Sin filtros aplicados";
};

/**
 * Formatea una fecha ISO como string legible en es-ES.
 * @param {string}  iso     - Fecha en formato ISO 8601
 * @param {boolean} conHora - Si true incluye hora y minutos
 */
export const fmtFecha = (iso, conHora = true) => {
  if (!iso) return "—";
  const opts = { day: "2-digit", month: "2-digit", year: "numeric" };
  if (conHora) { opts.hour = "2-digit"; opts.minute = "2-digit"; }
  return new Date(iso).toLocaleDateString("es-ES", opts);
};