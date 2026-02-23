import { useState, useEffect } from "react";
import { Box, Grid, Typography, Paper, Divider, Chip, CircularProgress } from "@mui/material";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar";

const drawerWidth = 260;
const API = "http://localhost:3000/api";

// ─── Animaciones ──────────────────────────────────────────────
const containerAnimation = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemAnimation = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Estilos base oscuros ──────────────────────────────────────
const cardBase = {
  borderRadius: "20px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
  color: "#fff",
  height: "100%",
  overflow: "hidden",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
};

const accentColors = {
  ventas:    { main: "#34d399", bg: "rgba(52,211,153,0.12)",  icon: "💰" },
  productos: { main: "#60a5fa", bg: "rgba(96,165,250,0.12)",  icon: "📦" },
  stock:     { main: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: "🗃️" },
  pedidos:   { main: "#a78bfa", bg: "rgba(167,139,250,0.12)", icon: "🚚" },
  caja:      { main: "#fb7185", bg: "rgba(251,113,133,0.12)", icon: "🏦" },
  alertas:   { main: "#f97316", bg: "rgba(249,115,22,0.12)",  icon: "⚠️" },
};

// ─── Hook genérico para fetch ──────────────────────────────────
function useFetch(url) {
  const [data, setData]   = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);
    fetch(url, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [url]);

  return { data, error, loading };
}

// ─── Número grande animado ────────────────────────────────────
function StatNumber({ value, size = "3.8rem" }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Typography sx={{
        fontSize: size, fontWeight: 900, lineHeight: 1,
        fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em",
      }}>
        {value}
      </Typography>
    </motion.div>
  );
}

// ─── Pill de estado ────────────────────────────────────────────
function StatusPill({ ok, okLabel = "OK", errLabel = "Sin datos" }) {
  return (
    <Chip
      label={ok ? okLabel : errLabel}
      size="small"
      sx={{
        background: ok ? "rgba(52,211,153,0.18)" : "rgba(248,113,113,0.18)",
        color: ok ? "#34d399" : "#f87171",
        border: `1px solid ${ok ? "rgba(52,211,153,0.35)" : "rgba(248,113,113,0.35)"}`,
        fontWeight: 700, fontSize: "0.68rem", height: 22,
      }}
    />
  );
}

// ─── Skeleton loader ───────────────────────────────────────────
function CardSkeleton() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {[80, 40, 60].map((w, i) => (
        <Box key={i} sx={{
          height: i === 0 ? 44 : 16, width: `${w}%`, borderRadius: 1,
          background: "rgba(255,255,255,0.07)",
          animation: "pulse 1.6s ease-in-out infinite",
          "@keyframes pulse": { "0%,100%": { opacity: 0.5 }, "50%": { opacity: 1 } },
        }} />
      ))}
    </Box>
  );
}

// ─── Cards individuales ────────────────────────────────────────

function CajaCard({ onClick }) {
  const { data, loading, error } = useFetch(`${API}/caja/estado`);
  const abierta = data?.estado === "ABIERTA";

  return (
    <Paper onClick={onClick} sx={{
      ...cardBase,
      cursor: "pointer",
      minHeight: { xs: 200, sm: 240 },
      background: abierta
        ? "linear-gradient(135deg, rgba(52,211,153,0.18) 0%, rgba(16,185,129,0.06) 100%)"
        : "rgba(255,255,255,0.04)",
      border: abierta ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(255,255,255,0.08)",
      "&:hover": {
        transform: "translateY(-6px)",
        boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
        border: abierta ? "1px solid rgba(52,211,153,0.5)" : "1px solid rgba(255,255,255,0.15)",
      },
    }}>
      <Box sx={{ p: { xs: 3, sm: 4 }, display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: { xs: 2, sm: 3 } }}>
          <Typography sx={{ fontSize: { xs: "2rem", sm: "2.4rem" }, lineHeight: 1 }}>🏦</Typography>
          <StatusPill ok={abierta} okLabel="Abierta" errLabel={error ? "Error" : "Cerrada"} />
        </Box>
        <Typography variant="overline" sx={{ opacity: 0.45, letterSpacing: "0.12em", fontSize: "0.7rem", fontWeight: 700, mb: 1 }}>
          Estado de caja
        </Typography>
        {loading ? <CardSkeleton /> : error ? (
          <Typography sx={{ opacity: 0.4 }}>No disponible</Typography>
        ) : (
          <>
            <Typography sx={{ fontSize: { xs: "1.8rem", sm: "2.2rem" }, fontWeight: 900, color: abierta ? "#34d399" : "#f87171", lineHeight: 1, mb: 2 }}>
              {abierta ? "🟢 Abierta" : "🔴 Cerrada"}
            </Typography>
            <Box sx={{ display: "flex", gap: { xs: 2, sm: 3 }, mt: "auto", flexWrap: "wrap" }}>
              {data?.fecha_apertura && (
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.45, display: "block", mb: 0.3 }}>Apertura</Typography>
                  <Typography fontWeight={700} sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                    {new Date(data.fecha_apertura).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </Typography>
                </Box>
              )}
              {data?.monto_inicial && (
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.45, display: "block", mb: 0.3 }}>Monto inicial</Typography>
                  <Typography fontWeight={700} sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                    ${Number(data.monto_inicial).toLocaleString("es-AR")}
                  </Typography>
                </Box>
              )}
            </Box>
          </>
        )}
        <Typography variant="caption" sx={{ opacity: 0.3, mt: 2, display: "block" }}>Click para operar →</Typography>
      </Box>
    </Paper>
  );
}

function VentasCard({ onClick }) {
  const { data, loading, error } = useFetch(`${API}/estadisticas/ventas-hoy`);
  const color = accentColors.ventas;

  const d = data?.data ?? data ?? {};
  const total    = d.total ?? 0;
  const cantidad = d.cantidad_pedidos ?? 0;
  const ticket   = d.ticket_promedio_formateado ?? (d.ticket_promedio ? `$${Number(d.ticket_promedio).toLocaleString("es-AR")}` : "$0");
  const variacion = d.variacion ?? null;
  const variacionPositiva = d.variacion_valor > 0;

  return (
    <Paper onClick={onClick} sx={{
      ...cardBase,
      cursor: "pointer",
      minHeight: { xs: 200, sm: 240 },
      "&:hover": {
        transform: "translateY(-6px)",
        boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.15)",
      },
    }}>
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${color.main}, transparent)` }} />
      <Box sx={{ p: { xs: 3, sm: 4 }, display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: { xs: 2, sm: 3 } }}>
          <Typography sx={{ fontSize: { xs: "2rem", sm: "2.4rem" }, lineHeight: 1 }}>{color.icon}</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            {variacion && (
              <Chip label={variacion} size="small" sx={{
                background: variacionPositiva ? "rgba(52,211,153,0.18)" : "rgba(248,113,113,0.18)",
                color: variacionPositiva ? "#34d399" : "#f87171",
                border: `1px solid ${variacionPositiva ? "rgba(52,211,153,0.35)" : "rgba(248,113,113,0.35)"}`,
                fontWeight: 700, fontSize: "0.68rem", height: 22,
              }} />
            )}
            <StatusPill ok={!error && !loading} okLabel="Hoy" />
          </Box>
        </Box>
        <Typography variant="overline" sx={{ opacity: 0.45, letterSpacing: "0.12em", fontSize: "0.7rem", fontWeight: 700, mb: 1 }}>
          Ventas del día
        </Typography>
        {loading ? <CardSkeleton /> : error ? (
          <Typography sx={{ opacity: 0.4 }}>No disponible</Typography>
        ) : (
          <>
            <StatNumber value={d.total_formateado ?? `$${Number(total).toLocaleString("es-AR")}`} />
            <Box sx={{ display: "flex", gap: 4, mt: "auto", pt: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.45, display: "block", mb: 0.3 }}>Transacciones</Typography>
                <Typography fontWeight={800} sx={{ fontSize: "1.3rem", color: color.main }}>{cantidad}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.45, display: "block", mb: 0.3 }}>Ticket promedio</Typography>
                <Typography fontWeight={800} sx={{ fontSize: "1.3rem", color: color.main }}>{ticket}</Typography>
              </Box>
              {d.productos_vendidos != null && (
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.45, display: "block", mb: 0.3 }}>Productos</Typography>
                  <Typography fontWeight={800} sx={{ fontSize: "1.3rem", color: color.main }}>{d.productos_vendidos}</Typography>
                </Box>
              )}
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
}

function ProductosCard({ onClick }) {
  const { data, loading, error } = useFetch(`${API}/estadisticas/total-productos`);
  const color = accentColors.productos;

  const d = data?.data ?? data ?? {};
  const total    = d.total ?? 0;
  const conStock = d.productos_con_stock ?? 0;
  const sinStock = d.productos_sin_stock ?? 0;
  const nuevos   = d.nuevos_mes ?? 0;

  return (
    <Paper onClick={onClick} sx={{
      ...cardBase,
      cursor: "pointer",
      minHeight: { xs: 200, sm: 240 },
      "&:hover": {
        transform: "translateY(-6px)",
        boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.15)",
      },
    }}>
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${color.main}, transparent)` }} />
      <Box sx={{ p: { xs: 3, sm: 4 }, display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: { xs: 2, sm: 3 } }}>
          <Typography sx={{ fontSize: { xs: "2rem", sm: "2.4rem" }, lineHeight: 1 }}>{color.icon}</Typography>
          <StatusPill ok={!error && !loading} okLabel="Activos" />
        </Box>
        <Typography variant="overline" sx={{ opacity: 0.45, letterSpacing: "0.12em", fontSize: "0.7rem", fontWeight: 700, mb: 1 }}>
          Productos
        </Typography>
        {loading ? <CardSkeleton /> : error ? (
          <Typography sx={{ opacity: 0.4 }}>No disponible</Typography>
        ) : (
          <>
            <StatNumber value={total} />
            <Box sx={{ display: "flex", gap: 4, mt: "auto", pt: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.45, display: "block", mb: 0.3 }}>Con stock</Typography>
                <Typography fontWeight={800} sx={{ fontSize: "1.3rem", color: color.main }}>{conStock}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.45, display: "block", mb: 0.3 }}>Sin stock</Typography>
                <Typography fontWeight={800} sx={{ fontSize: "1.3rem", color: sinStock > 0 ? "#f87171" : "#94a3b8" }}>{sinStock}</Typography>
              </Box>
              {nuevos > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.45, display: "block", mb: 0.3 }}>Nuevos mes</Typography>
                  <Typography fontWeight={800} sx={{ fontSize: "1.3rem", color: "#34d399" }}>+{nuevos}</Typography>
                </Box>
              )}
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
}

function StockCard({ onClick }) {
  const { data, loading, error } = useFetch(`${API}/estadisticas/stock/general`);
  const color = accentColors.stock;

  const d = data?.data ?? data ?? {};
  const unidades   = d.total_unidades ?? 0;
  const valorizado = d.stock_valorizado ?? 0;
  const bajoStock  = d.productos_bajo_stock ?? 0;
  const sinStock   = d.productos_sin_stock ?? 0;

  return (
    <Paper onClick={onClick} sx={{
      ...cardBase,
      cursor: "pointer",
      minHeight: { xs: 200, sm: 240 },
      "&:hover": {
        transform: "translateY(-6px)",
        boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.15)",
      },
    }}>
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${color.main}, transparent)` }} />
      <Box sx={{ p: { xs: 3, sm: 4 }, display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: { xs: 2, sm: 3 } }}>
          <Typography sx={{ fontSize: { xs: "2rem", sm: "2.4rem" }, lineHeight: 1 }}>{color.icon}</Typography>
          {bajoStock > 0
            ? <Chip label={`${bajoStock} bajo mín.`} size="small" sx={{ background: "rgba(245,158,11,0.18)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.35)", fontWeight: 700, fontSize: "0.68rem", height: 22 }} />
            : <StatusPill ok={!error && !loading} okLabel="Normal" />
          }
        </Box>
        <Typography variant="overline" sx={{ opacity: 0.45, letterSpacing: "0.12em", fontSize: "0.7rem", fontWeight: 700, mb: 1 }}>
          Stock general
        </Typography>
        {loading ? <CardSkeleton /> : error ? (
          <Typography sx={{ opacity: 0.4 }}>No disponible</Typography>
        ) : (
          <>
            <StatNumber value={`${unidades.toLocaleString("es-AR")} uds.`} />
            <Box sx={{ display: "flex", gap: 4, mt: "auto", pt: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.45, display: "block", mb: 0.3 }}>Valorizado</Typography>
                <Typography fontWeight={800} sx={{ fontSize: "1.3rem", color: color.main }}>
                  ${Number(valorizado).toLocaleString("es-AR")}
                </Typography>
              </Box>
              {sinStock > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.45, display: "block", mb: 0.3 }}>Sin stock</Typography>
                  <Typography fontWeight={800} sx={{ fontSize: "1.3rem", color: "#f87171" }}>{sinStock}</Typography>
                </Box>
              )}
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
}

function AlertasCard({ onClick }) {
  const { data, loading, error } = useFetch(`${API}/stock/alertas`);
  const color = accentColors.alertas;

  const alertas  = Array.isArray(data) ? data : [];
  const count    = alertas.length;
  const agotados = alertas.filter((a) => a.estado_alerta === "agotado").length;
  const bajoMin  = alertas.filter((a) => a.estado_alerta === "bajo_minimo").length;

  return (
    <Paper onClick={onClick} sx={{
      ...cardBase,
      cursor: "pointer",
      minHeight: 220,
      background: count > 0 ? "rgba(249,115,22,0.07)" : "rgba(255,255,255,0.04)",
      border: count > 0 ? "1px solid rgba(249,115,22,0.25)" : "1px solid rgba(255,255,255,0.08)",
      "&:hover": { transform: "translateY(-5px)", boxShadow: "0 24px 48px rgba(0,0,0,0.5)" },
    }}>
      <Box sx={{ height: 3, background: `linear-gradient(90deg, ${color.main}, transparent)` }} />
      <Box sx={{ p: 4, display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
          <Typography sx={{ fontSize: "2.4rem", lineHeight: 1 }}>{color.icon}</Typography>
          {count > 0
            ? <Chip label="Requiere atención" size="small" sx={{ background: "rgba(249,115,22,0.18)", color: "#f97316", border: "1px solid rgba(249,115,22,0.35)", fontWeight: 700, fontSize: "0.68rem", height: 22 }} />
            : <StatusPill ok={true} okLabel="Sin alertas" />
          }
        </Box>
        <Typography variant="overline" sx={{ opacity: 0.45, letterSpacing: "0.12em", fontSize: "0.7rem", fontWeight: 700, mb: 1 }}>
          Alertas de stock
        </Typography>
        {loading ? <CardSkeleton /> : error ? (
          <Typography sx={{ opacity: 0.4 }}>No disponible</Typography>
        ) : (
          <>
            <StatNumber value={count} />
            {count > 0 ? (
              <Box sx={{ display: "flex", gap: 4, mt: "auto", pt: 2 }}>
                {agotados > 0 && (
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.45, display: "block", mb: 0.3 }}>Agotados</Typography>
                    <Typography fontWeight={800} sx={{ fontSize: "1.3rem", color: "#f87171" }}>{agotados}</Typography>
                  </Box>
                )}
                {bajoMin > 0 && (
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.45, display: "block", mb: 0.3 }}>Bajo mínimo</Typography>
                    <Typography fontWeight={800} sx={{ fontSize: "1.3rem", color: "#f59e0b" }}>{bajoMin}</Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Typography sx={{ opacity: 0.5, mt: "auto", pt: 2 }}>Todo el stock en rango normal ✓</Typography>
            )}
          </>
        )}
      </Box>
    </Paper>
  );
}

function PedidosCard({ onClick }) {
  const { data, loading, error } = useFetch(`${API}/estadisticas/pedidos-mes`);
  const color = accentColors.pedidos;

  const d = data?.data ?? data ?? {};
  const total       = d.total ?? 0;
  const pendientes  = d.pendientes ?? 0;
  const enProceso   = d.en_proceso ?? 0;
  const completados = d.completados ?? 0;
  const progreso    = d.progreso ?? 0;

  return (
    <Paper onClick={onClick} sx={{
      ...cardBase,
      cursor: "pointer",
      minHeight: { xs: 200, sm: 240 },
      "&:hover": {
        transform: "translateY(-6px)",
        boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.15)",
      },
    }}>
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${color.main}, transparent)` }} />
      <Box sx={{ p: { xs: 3, sm: 4 }, display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: { xs: 2, sm: 3 } }}>
          <Typography sx={{ fontSize: { xs: "2rem", sm: "2.4rem" }, lineHeight: 1 }}>{color.icon}</Typography>
          <StatusPill ok={!error && !loading} okLabel="Este mes" />
        </Box>
        <Typography variant="overline" sx={{ opacity: 0.45, letterSpacing: "0.12em", fontSize: "0.7rem", fontWeight: 700, mb: 1 }}>
          Pedidos
        </Typography>
        {loading ? <CardSkeleton /> : error ? (
          <Typography sx={{ opacity: 0.4 }}>No disponible</Typography>
        ) : (
          <>
            <StatNumber value={total} />
            <Box sx={{ display: "flex", gap: 4, mt: "auto", pt: 2, flexWrap: "wrap" }}>
              {completados > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.45, display: "block", mb: 0.3 }}>Completados</Typography>
                  <Typography fontWeight={800} sx={{ fontSize: "1.3rem", color: color.main }}>{completados}</Typography>
                </Box>
              )}
              {enProceso > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.45, display: "block", mb: 0.3 }}>En proceso</Typography>
                  <Typography fontWeight={800} sx={{ fontSize: "1.3rem", color: "#60a5fa" }}>{enProceso}</Typography>
                </Box>
              )}
              {pendientes > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.45, display: "block", mb: 0.3 }}>Pendientes</Typography>
                  <Typography fontWeight={800} sx={{ fontSize: "1.3rem", color: "#f59e0b" }}>{pendientes}</Typography>
                </Box>
              )}
            </Box>
            {progreso > 0 && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.8 }}>
                  <Typography variant="caption" sx={{ opacity: 0.45 }}>Progreso mensual</Typography>
                  <Typography variant="caption" sx={{ color: color.main, fontWeight: 700 }}>{progreso}%</Typography>
                </Box>
                <Box sx={{ height: 5, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}>
                  <Box sx={{ height: "100%", borderRadius: 2, width: `${Math.min(progreso, 100)}%`, background: `linear-gradient(90deg, ${color.main}, #818cf8)`, transition: "width 0.8s ease" }} />
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>
    </Paper>
  );
}

// ─── Mini documentación ────────────────────────────────────────
const docItems = [
  {
    icon: "🧾",
    section: "ventas",
    title: "Nueva venta",
    desc: "Registrá ventas en tiempo real, seleccioná productos, método de pago y emití el ticket. Desde aquí también podés consultar el historial de ventas del día.",
    tips: ["Usá el buscador para encontrar productos rápido", "Podés cobrar con efectivo, tarjeta o mixto"],
  },
  {
    icon: "🗃️",
    section: "stock",
    title: "Ver stock",
    desc: "Consultá las existencias actuales del kiosco. Filtrá por producto o categoría y detectá rápidamente los artículos con stock bajo o agotado.",
    tips: ["Los ítems en rojo están agotados", "Los amarillos están por debajo del mínimo configurado"],
  },
  {
    icon: "📦",
    section: "productos",
    title: "Productos",
    desc: "Accedé al catálogo completo de productos habilitados para este kiosco. Podés ver precios, descripciones y el estado de cada ítem.",
    tips: ["Los productos inactivos no aparecen en la pantalla de venta"],
  },
  {
    icon: "🚚",
    section: "pedidos",
    title: "Pedidos",
    desc: "Gestioná los pedidos de reposición del kiosco. Revisá el estado de cada pedido, desde pendiente hasta completado.",
    tips: ["Hacé un pedido cuando el stock baje del mínimo", "Los pedidos completados actualizan el stock automáticamente"],
  },
];

function MiniDocs({ onNavigate }) {
  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
        <Divider sx={{ flex: 1, borderColor: "rgba(255,255,255,0.07)" }} />
        <Typography variant="overline" sx={{ opacity: 0.3, letterSpacing: "0.18em", fontSize: "0.68rem", fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>
          📖 GUÍA DE SECCIONES
        </Typography>
        <Divider sx={{ flex: 1, borderColor: "rgba(255,255,255,0.07)" }} />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        {docItems.map((item) => (
          <Paper
            key={item.section}
            onClick={() => onNavigate(item.section)}
            sx={{
              ...cardBase,
              cursor: "pointer",
              p: { xs: 2.5, sm: 3 },
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              minHeight: 200,
              "&:hover": {
                transform: "translateY(-3px)",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.14)",
                boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
              },
            }}
          >
              {/* Cabecera */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography sx={{ fontSize: "1.6rem", lineHeight: 1 }}>{item.icon}</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#fff" }}>{item.title}</Typography>
              </Box>

              {/* Descripción */}
              <Typography variant="body2" sx={{ opacity: 0.55, lineHeight: 1.6, fontSize: "0.8rem" }}>
                {item.desc}
              </Typography>

              {/* Tips */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.6, mt: "auto" }}>
                {item.tips.map((tip, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 0.8 }}>
                    <Typography sx={{ color: "rgba(52,211,153,0.8)", fontSize: "0.65rem", mt: "2px", flexShrink: 0 }}>✦</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.45, fontSize: "0.72rem", lineHeight: 1.5 }}>{tip}</Typography>
                  </Box>
                ))}
              </Box>

              <Typography variant="caption" sx={{ opacity: 0.2, mt: 0.5 }}>Click para ir →</Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}

// ─── Secciones disponibles ─────────────────────────────────────
import StockTable     from "../components/tables/StockTableKiosco/Stocktable";
import ProductosTable from "../components/tables/ProductosTable";
import PedidosTable   from "../components/tables/PedidosTable";
import VentasTable    from "../components/caja/CajaVentas";

const sectionComponents = {
  stock:     StockTable,
  productos: ProductosTable,
  pedidos:   PedidosTable,
  ventas:    VentasTable,
};

// ─── Dashboard principal ───────────────────────────────────────
// ↓ CAMBIO: recibe selectedSection y onSectionChange como props desde App.jsx
//   en lugar de manejar el estado localmente
export default function Kiosco({ sidebarOpen, onSidebarToggle, selectedSection, onSectionChange }) {
  // ← ELIMINADO: const [selectedSection, setSelectedSection] = useState("dashboard");

  // goTo ahora llama al prop onSectionChange en lugar del setter local
  const goTo = (s) => onSectionChange(s);

  const renderDashboard = () => (
    <motion.div variants={containerAnimation} initial="hidden" animate="show">

      {/* ── Header ── */}
      <motion.div variants={itemAnimation}>
        <Box sx={{ mb: { xs: 4, md: 5 }, textAlign: "center" }}>
          <Typography variant="h1" fontWeight={900} sx={{
            color: "#fff", letterSpacing: "-0.04em", lineHeight: 1,
            fontSize: { xs: "2rem", sm: "2.5rem", md: "3.5rem" }, mb: 1,
          }}>
            Panel operativo
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.4, color: "white", fontWeight: 400, fontSize: { xs: "0.875rem", md: "1rem" } }}>
            {new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </Typography>
        </Box>
      </motion.div>

      {/* ── ACCESO RÁPIDO ── */}
      <motion.div variants={itemAnimation}>
        <Typography variant="overline" sx={{
          opacity: 0.35, letterSpacing: "0.18em", fontSize: "0.7rem", fontWeight: 700,
          display: "block", mb: 2, color: "#fff", textAlign: "center",
        }}>
          Acceso rápido
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", mb: { xs: 4, md: 5 } }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 180px)", gap: 2 }}>
            {[
              { label: "Nueva venta",  icon: "🧾", section: "ventas",    color: "#34d399" },
              { label: "Ver stock",    icon: "🗃️",  section: "stock",     color: "#f59e0b" },
              { label: "Productos",    icon: "📦", section: "productos", color: "#60a5fa" },
              { label: "Pedidos",      icon: "🚚", section: "pedidos",   color: "#a78bfa" },
            ].map((item) => (
              <Paper
                key={item.section}
                onClick={() => goTo(item.section)}
                sx={{
                  ...cardBase,
                  p: { xs: 2.5, sm: 3 },
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  minHeight: 120,
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    background: "rgba(255,255,255,0.08)",
                    boxShadow: "0 16px 32px rgba(0,0,0,0.4)",
                  },
                }}
              >
                <Typography sx={{ fontSize: "1.8rem", lineHeight: 1 }}>{item.icon}</Typography>
                <Typography fontWeight={700} sx={{ fontSize: "0.95rem", color: item.color }}>
                  {item.label}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>
      </motion.div>

      {/* ── DIVIDER ── */}
      <motion.div variants={itemAnimation}>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: { xs: 4, md: 5 } }} />
      </motion.div>

      {/* ── PANEL OPERATIVO ── */}
      <motion.div variants={itemAnimation}>
        <Typography variant="overline" sx={{
          opacity: 0.35, letterSpacing: "0.18em", fontSize: "0.7rem", fontWeight: 700,
          display: "block", mb: 2, color: "#fff", textAlign: "center",
        }}>
          Panel operativo
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", mb: { xs: 4, md: 5 } }}>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
            <CajaCard onClick={() => goTo("ventas")} />
            <VentasCard onClick={() => goTo("ventas")} />
            <AlertasCard onClick={() => goTo("stock")} />
            <StockCard onClick={() => goTo("stock")} />
          </Box>
        </Box>
      </motion.div>

      {/* ── MINI DOCUMENTACIÓN — al final ── */}
      <motion.div variants={itemAnimation}>
        <MiniDocs onNavigate={goTo} />
      </motion.div>

    </motion.div>
  );

  const renderTableSection = () => {
    const TableComponent = sectionComponents[selectedSection];
    return TableComponent ? (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <TableComponent />
      </motion.div>
    ) : null;
  };

  return (
    <Box sx={{ display: "flex", minHeight: "calc(100vh - 64px)", background: "transparent" }}>
      <Sidebar
        open={sidebarOpen}
        onClose={() => onSidebarToggle(false)}
        selectedSection={selectedSection}
        onSectionChange={onSectionChange}  // ← antes era setSelectedSection
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          marginLeft: sidebarOpen ? `${drawerWidth}px` : 0,
          transition: "margin-left 0.3s ease",
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3, md: 4, lg: 5 }, maxWidth: "1600px", mx: "auto" }}>
          {selectedSection === "dashboard" && renderDashboard()}
          {selectedSection !== "dashboard" && renderTableSection()}
        </Box>
      </Box>
    </Box>
  );
}