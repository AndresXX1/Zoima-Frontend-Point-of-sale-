// pages/Admin.jsx
import { useState } from "react";
import { Box, Grid, Typography, Paper, Divider, Chip } from "@mui/material";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import Sidebar from "../components/Sidebar";

const drawerWidth = 260;
const API = "http://localhost:3000/api";

// ─── Paleta Admin — violeta/púrpura ───────────────────────────
const PRIMARY        = "#667eea";
const PRIMARY_DARK   = "#764ba2";
const PRIMARY_GLOW   = "rgba(102,126,234,0.18)";
const PRIMARY_BORDER = "rgba(102,126,234,0.3)";

// ─── Animaciones ──────────────────────────────────────────────
const containerAnimation = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemAnimation = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Estilos base ──────────────────────────────────────────────
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

// eslint-disable-next-line no-unused-vars
const cardHover = {
  "&:hover": {
    transform: "translateY(-6px)",
    boxShadow: `0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px ${PRIMARY_BORDER}`,
    background: PRIMARY_GLOW,
    border: `1px solid ${PRIMARY_BORDER}`,
  },
};

const accentColors = {
  kioscos:   { main: PRIMARY,      icon: "🏪" },
  empleados: { main: "#a78bfa",    icon: "👥" },
  ventas:    { main: "#818cf8",    icon: "💰" },
  productos: { main: "#c4b5fd",    icon: "📦" },
  stock:     { main: "#7c3aed",    icon: "🗃️" },
  pedidos:   { main: PRIMARY_DARK, icon: "🚚" },
};

// ─── Hook fetch ────────────────────────────────────────────────
function useFetch(url) {
  const [data, setData]       = useState(null);
  const [error, setError]     = useState(false);
  const [loading, setLoading] = useState(true);

  useState(() => {
    let cancelled = false;
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

// ─── Número animado ────────────────────────────────────────────
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
        background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.75) 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>
        {value}
      </Typography>
    </motion.div>
  );
}

// ─── Pill de estado ────────────────────────────────────────────
function StatusPill({ ok, okLabel = "OK", errLabel = "Sin datos" }) {
  return (
    <Chip label={ok ? okLabel : errLabel} size="small" sx={{
      background: ok ? PRIMARY_GLOW : "rgba(248,113,113,0.18)",
      color: ok ? PRIMARY : "#f87171",
      border: `1px solid ${ok ? PRIMARY_BORDER : "rgba(248,113,113,0.35)"}`,
      fontWeight: 700, fontSize: "0.68rem", height: 22,
    }} />
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
          "@keyframes pulse": { "0%,100%": { opacity: 0.4 }, "50%": { opacity: 0.9 } },
        }} />
      ))}
    </Box>
  );
}

function ChartSkeleton({ height = 180 }) {
  return (
    <Box sx={{ height, display: "flex", alignItems: "flex-end", gap: 1.5, px: 1 }}>
      {[60, 80, 45, 90, 70, 55, 85, 65, 75, 50, 95, 40].map((h, i) => (
        <Box key={i} sx={{
          flex: 1, height: `${h}%`, borderRadius: "6px 6px 0 0",
          background: PRIMARY_GLOW,
          animation: "pulse 1.6s ease-in-out infinite",
          animationDelay: `${i * 0.08}s`,
          "@keyframes pulse": { "0%,100%": { opacity: 0.4 }, "50%": { opacity: 0.85 } },
        }} />
      ))}
    </Box>
  );
}

// ─── CARDS STAT ────────────────────────────────────────────────

function KioscosCard() {
  const { data, loading, error } = useFetch(`${API}/kioscos`);
  const color   = accentColors.kioscos;
  const kioscos = Array.isArray(data) ? data : (data?.data ?? []);
  const total   = kioscos.length;
  const activos = kioscos.filter((k) => k.activo || k.estado === "activo" || k.estado === "ACTIVO").length;

  return (
    <Paper sx={{ ...cardBase, minHeight: { xs: 200, sm: 240 } }}>
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${PRIMARY}, ${PRIMARY_DARK})` }} />
      <Box sx={{ p: { xs: 3, sm: 4 }, display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
          <Typography sx={{ fontSize: "2.4rem", lineHeight: 1 }}>{color.icon}</Typography>
          <StatusPill ok={!error && !loading} okLabel="Registrados" />
        </Box>
        <Typography variant="overline" sx={{ opacity: 0.45, letterSpacing: "0.12em", fontSize: "0.7rem", fontWeight: 700, mb: 1 }}>
          Kioscos
        </Typography>
        {loading ? <CardSkeleton /> : error ? (
          <Typography sx={{ opacity: 0.4 }}>No disponible</Typography>
        ) : (
          <>
            <StatNumber value={total} />
            <Box sx={{ display: "flex", gap: 4, mt: "auto", pt: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.45, display: "block", mb: 0.3 }}>Activos</Typography>
                <Typography fontWeight={800} sx={{ fontSize: "1.3rem", color: color.main }}>{activos}</Typography>
              </Box>
              {total - activos > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.45, display: "block", mb: 0.3 }}>Inactivos</Typography>
                  <Typography fontWeight={800} sx={{ fontSize: "1.3rem", color: "#94a3b8" }}>{total - activos}</Typography>
                </Box>
              )}
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
}

function EmpleadosCard() {
  const { data, loading, error } = useFetch(`${API}/empleados`);
  const color     = accentColors.empleados;
  const empleados = Array.isArray(data) ? data : (data?.data ?? []);
  const total     = empleados.length;
  const activos   = empleados.filter((e) => e.activo || e.estado === "activo" || e.estado === "ACTIVO").length;
  const inactivos = total - activos;

  return (
    <Paper sx={{ ...cardBase, minHeight: { xs: 200, sm: 240 } }}>
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${accentColors.empleados.main}, transparent)` }} />
      <Box sx={{ p: { xs: 3, sm: 4 }, display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
          <Typography sx={{ fontSize: "2.4rem", lineHeight: 1 }}>{color.icon}</Typography>
          <StatusPill ok={!error && !loading} okLabel="Total" />
        </Box>
        <Typography variant="overline" sx={{ opacity: 0.45, letterSpacing: "0.12em", fontSize: "0.7rem", fontWeight: 700, mb: 1 }}>
          Empleados
        </Typography>
        {loading ? <CardSkeleton /> : error ? (
          <Typography sx={{ opacity: 0.4 }}>No disponible</Typography>
        ) : (
          <>
            <StatNumber value={total} />
            <Box sx={{ display: "flex", gap: 4, mt: "auto", pt: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.45, display: "block", mb: 0.3 }}>Activos</Typography>
                <Typography fontWeight={800} sx={{ fontSize: "1.3rem", color: color.main }}>{activos}</Typography>
              </Box>
              {inactivos > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.45, display: "block", mb: 0.3 }}>Inactivos</Typography>
                  <Typography fontWeight={800} sx={{ fontSize: "1.3rem", color: "#f87171" }}>{inactivos}</Typography>
                </Box>
              )}
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
}

function VentasCard() {
  const { data, loading, error } = useFetch(`${API}/estadisticas/ventas-hoy`);
  const color    = accentColors.ventas;
  const d        = data?.data ?? data ?? {};
  const total    = d.total ?? 0;
  const cantidad = d.cantidad_pedidos ?? 0;
  const ticket   = d.ticket_promedio_formateado ?? (d.ticket_promedio ? `$${Number(d.ticket_promedio).toLocaleString("es-AR")}` : "$0");
  const variacion = d.variacion ?? null;
  const variacionPositiva = d.variacion_valor > 0;

  return (
    <Paper sx={{ ...cardBase, minHeight: { xs: 200, sm: 240 } }}>
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${color.main}, transparent)` }} />
      <Box sx={{ p: { xs: 3, sm: 4 }, display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
          <Typography sx={{ fontSize: "2.4rem", lineHeight: 1 }}>{color.icon}</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            {variacion && (
              <Chip label={variacion} size="small" sx={{
                background: variacionPositiva ? PRIMARY_GLOW : "rgba(248,113,113,0.18)",
                color: variacionPositiva ? PRIMARY : "#f87171",
                border: `1px solid ${variacionPositiva ? PRIMARY_BORDER : "rgba(248,113,113,0.35)"}`,
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
                <Typography variant="caption" sx={{ opacity: 0.45, display: "block", mb: 0.3 }}>Ticket prom.</Typography>
                <Typography fontWeight={800} sx={{ fontSize: "1.3rem", color: color.main }}>{ticket}</Typography>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
}

function ProductosCard() {
  const { data, loading, error } = useFetch(`${API}/estadisticas/total-productos`);
  const color    = accentColors.productos;
  const d        = data?.data ?? data ?? {};
  const total    = d.total ?? 0;
  const conStock = d.productos_con_stock ?? 0;
  const sinStock = d.productos_sin_stock ?? 0;

  return (
    <Paper sx={{ ...cardBase, minHeight: { xs: 200, sm: 240 } }}>
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${color.main}, transparent)` }} />
      <Box sx={{ p: { xs: 3, sm: 4 }, display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
          <Typography sx={{ fontSize: "2.4rem", lineHeight: 1 }}>{color.icon}</Typography>
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
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
}

function StockCard() {
  const { data, loading, error } = useFetch(`${API}/estadisticas/stock/general`);
  const color      = accentColors.stock;
  const d          = data?.data ?? data ?? {};
  const unidades   = d.total_unidades ?? 0;
  const valorizado = d.stock_valorizado ?? 0;
  const bajoStock  = d.productos_bajo_stock ?? 0;

  return (
    <Paper sx={{ ...cardBase, minHeight: { xs: 200, sm: 240 } }}>
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${color.main}, transparent)` }} />
      <Box sx={{ p: { xs: 3, sm: 4 }, display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
          <Typography sx={{ fontSize: "2.4rem", lineHeight: 1 }}>{color.icon}</Typography>
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
            <StatNumber value={`${unidades.toLocaleString("es-AR")} `} />
            <Typography>Un.</Typography>
            <Box sx={{ display: "flex", gap: 4, mt: "auto", pt: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.45, display: "block", mb: 0.3 }}>Valorizado</Typography>
                <Typography fontWeight={800} sx={{ fontSize: "1.3rem", color: color.main }}>
                  ${Number(valorizado).toLocaleString("es-AR")}
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
}

function PedidosCard() {
  const { data, loading, error } = useFetch(`${API}/estadisticas/pedidos-mes`);
  const color       = accentColors.pedidos;
  const d           = data?.data ?? data ?? {};
  const total       = d.total ?? 0;
  const pendientes  = d.pendientes ?? 0;
  const enProceso   = d.en_proceso ?? 0;
  const completados = d.completados ?? 0;
  const progreso    = d.progreso ?? 0;

  return (
    <Paper sx={{ ...cardBase, minHeight: { xs: 200, sm: 240 } }}>
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${color.main}, transparent)` }} />
      <Box sx={{ p: { xs: 3, sm: 4 }, display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
          <Typography sx={{ fontSize: "2.4rem", lineHeight: 1 }}>{color.icon}</Typography>
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
            <Box sx={{ display: "flex", gap: 3, mt: "auto", pt: 2, flexWrap: "wrap" }}>
              {completados > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.45, display: "block", mb: 0.3 }}>Completados</Typography>
                  <Typography fontWeight={800} sx={{ fontSize: "1.1rem", color: color.main }}>{completados}</Typography>
                </Box>
              )}
              {enProceso > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.45, display: "block", mb: 0.3 }}>En proceso</Typography>
                  <Typography fontWeight={800} sx={{ fontSize: "1.1rem", color: "#a78bfa" }}>{enProceso}</Typography>
                </Box>
              )}
              {pendientes > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.45, display: "block", mb: 0.3 }}>Pendientes</Typography>
                  <Typography fontWeight={800} sx={{ fontSize: "1.1rem", color: "#f59e0b" }}>{pendientes}</Typography>
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
                  <Box sx={{ height: "100%", borderRadius: 2, width: `${Math.min(progreso, 100)}%`, background: `linear-gradient(90deg, ${PRIMARY}, ${PRIMARY_DARK})`, transition: "width 0.8s ease" }} />
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>
    </Paper>
  );
}

// ─── GRÁFICO 1: Ventas por mes (barras) ───────────────────────
function VentasMensualesChart() {
  const { data, loading, error } = useFetch(`${API}/estadisticas/ventas/mensuales`);

  const raw = data?.data ?? data ?? [];
  const chartData = Array.isArray(raw)
    ? raw.map((item) => ({
        mes: item.mes ?? item.mes_corto ?? item.month ?? "–",
        ventas: Number(item.ventas ?? item.total ?? 0),
        objetivo: item.objetivo != null ? Number(item.objetivo) : undefined,
      }))
    : [];

  const todasEnCero = chartData.every((d) => d.ventas === 0);
  const displayData = todasEnCero
    ? chartData.map((d) => ({ ...d, _ventas_display: 0.001, ventas: 0 }))
    : chartData;
  const barKey = todasEnCero ? "_ventas_display" : "ventas";

  const tickStyle = { fill: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 500 };

  const tooltipStyle = {
    contentStyle: {
      background: "rgba(15,10,40,0.95)",
      border: `1px solid ${PRIMARY_BORDER}`,
      borderRadius: 12,
      color: "#fff",
      fontSize: "0.8rem",
      backdropFilter: "blur(12px)",
    },
    labelStyle: { color: "rgba(255,255,255,0.7)", fontWeight: 700, marginBottom: 4 },
    cursor: { fill: "rgba(102,126,234,0.06)" },
  };

  return (
    <Paper sx={{
      ...cardBase,
      minHeight: { xs: 280, sm: 320 },
      "&:hover": { border: `1px solid ${PRIMARY_BORDER}`, boxShadow: "0 16px 40px rgba(0,0,0,0.4)" },
    }}>
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${PRIMARY}, ${PRIMARY_DARK})` }} />
      <Box sx={{ p: { xs: 3, sm: 4 }, display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.45, letterSpacing: "0.12em", fontSize: "0.7rem", fontWeight: 700, display: "block", mb: 0.5, color: "#fff" }}>
              Ventas por mes
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff" }}>
              {new Date().getFullYear()}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 1, background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_DARK})` }} />
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.65rem" }}>Ventas</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box sx={{ width: 14, height: 2, background: "#f59e0b", borderRadius: 1 }} />
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.65rem" }}>Objetivo</Typography>
            </Box>
            <StatusPill ok={!error && !loading} okLabel="Anual" />
          </Box>
        </Box>

        {!loading && !error && todasEnCero && (
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)", mb: 1, display: "block", fontSize: "0.7rem" }}>
            Sin ventas registradas — mostrando estructura del año
          </Typography>
        )}

        {loading ? (
          <ChartSkeleton height={185} />
        ) : error || chartData.length === 0 ? (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.3 }}>
            <Typography sx={{ color: "#fff" }}>Sin datos disponibles</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={185}>
            <ComposedChart data={displayData} barSize={20} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PRIMARY} stopOpacity={1} />
                  <stop offset="100%" stopColor={PRIMARY_DARK} stopOpacity={0.75} />
                </linearGradient>
                <linearGradient id="barGradientDim" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={PRIMARY_DARK} stopOpacity={0.12} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="mes" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis
                tick={tickStyle}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v === 0 ? "" : `$${(v / 1000).toFixed(0)}k`}
                domain={todasEnCero ? [0, Number(chartData[0]?.objetivo ?? 5000) * 1.2] : ["auto", "auto"]}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(v, name) => {
                  if (name === barKey) return [`$${Number(todasEnCero ? 0 : v).toLocaleString("es-AR")}`, "Ventas"];
                  if (name === "objetivo") return [`$${Number(v).toLocaleString("es-AR")}`, "Objetivo"];
                  return [v, name];
                }}
              />
              <Bar dataKey={barKey} fill={todasEnCero ? "url(#barGradientDim)" : "url(#barGradient)"} radius={[5, 5, 0, 0]} minPointSize={todasEnCero ? 3 : 0} />
              <Line type="monotone" dataKey="objetivo" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls={true} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Paper>
  );
}

// ─── GRÁFICO 2: Stock por categoría (donut) ───────────────────
const DONUT_COLORS = [PRIMARY, "#a78bfa", "#7c3aed", "#c4b5fd", "#818cf8", "#6d28d9", "#ddd6fe"];

function StockCategoriasChart() {
  const { data, loading, error } = useFetch(`${API}/estadisticas/stock/categorias`);

  const raw = data?.data ?? data ?? [];
  const chartData = Array.isArray(raw)
    ? raw.map((item) => ({
        name: item.categoria ?? item.name ?? item.nombre ?? "–",
        value: Number(item.total ?? item.cantidad ?? item.value ?? 0),
      })).filter((d) => d.value > 0)
    : [];

  const total = chartData.reduce((s, d) => s + d.value, 0);

  const tooltipStyle = {
    contentStyle: {
      background: "rgba(15,10,40,0.92)",
      border: `1px solid ${PRIMARY_BORDER}`,
      borderRadius: 12,
      color: "#fff",
      fontSize: "0.8rem",
      backdropFilter: "blur(12px)",
    },
  };

  return (
    <Paper sx={{
      ...cardBase,
      minHeight: { xs: 280, sm: 320 },
      "&:hover": { border: `1px solid ${PRIMARY_BORDER}`, boxShadow: "0 16px 40px rgba(0,0,0,0.4)" },
    }}>
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${PRIMARY_DARK}, ${PRIMARY})` }} />
      <Box sx={{ p: { xs: 3, sm: 4 }, display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.45, letterSpacing: "0.12em", fontSize: "0.7rem", fontWeight: 700, display: "block", mb: 0.5 }}>
              Stock por categoría
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff" }}>
              {total > 0 ? `${total.toLocaleString("es-AR")} unidades` : "Distribución"}
            </Typography>
          </Box>
          <StatusPill ok={!error && !loading} okLabel="Actual" />
        </Box>

        {loading ? (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Box sx={{
              width: 140, height: 140, borderRadius: "50%",
              background: `conic-gradient(${PRIMARY_GLOW} 0%, rgba(118,75,162,0.2) 60%, transparent 100%)`,
              animation: "pulse 1.6s ease-in-out infinite",
              "@keyframes pulse": { "0%,100%": { opacity: 0.4 }, "50%": { opacity: 0.9 } },
            }} />
          </Box>
        ) : error || chartData.length === 0 ? (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.3 }}>
            <Typography>Sin datos disponibles</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="55%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" strokeWidth={0}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} formatter={(v, name) => [`${v.toLocaleString("es-AR")} uds.`, name]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.55)", paddingTop: 4 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Paper>
  );
}

// ─── Secciones/Tablas ──────────────────────────────────────────
import KioscosTable         from "../components/tables/KioscosTable";
import StockTable           from "../components/tables/StockTableAdmin";
import EmpleadosTable       from "../components/tables/EmpleadosTable";
import UsuariosSistemaTable from "../components/tables/UsuariosSistemaTable";
import ProductosTable       from "../components/tables/ProductosTable";
import PedidosTable         from "../components/tables/PedidosTable";
import VentasTable          from "../components/caja/CajaVentas";
import VentasAdminTable     from "../components/tables/VentasAdminTable";
import CajasTable           from "../components/tables/Cajastable";

const sectionComponents = {
  kioscos:        KioscosTable,
  stock:          StockTable,
  ventas:         VentasTable,
  empleados:      EmpleadosTable,
  usuarios:       UsuariosSistemaTable,
  productos:      ProductosTable,
  pedidos:        PedidosTable,
  ventas_admin:   VentasAdminTable,
  cajas:          CajasTable,
};

// ─── Dashboard principal ───────────────────────────────────────
// ← CAMBIO: recibe selectedSection y onSectionChange desde App en lugar de estado local
export default function Admin({ sidebarOpen, onSidebarToggle, selectedSection, onSectionChange }) {

  const renderDashboard = () => (
    <motion.div variants={containerAnimation} initial="hidden" animate="show">

      {/* ── Header centrado ── */}
      <motion.div variants={itemAnimation}>
        <Box sx={{ mb: { xs: 4, md: 6 }, textAlign: "center" }}>
          <Typography variant="h1" fontWeight={900} sx={{
            color: "white",
            letterSpacing: "-0.04em", 
            lineHeight: 1,
            fontSize: { xs: "2rem", sm: "2.5rem", md: "3.5rem" }, 
            mb: 1,
          }}>
            Dashboard General
          </Typography>
          <Typography variant="body1" sx={{ 
            opacity: 0.7, 
            color: "white", 
            fontWeight: 400, 
            fontSize: { xs: "0.875rem", md: "1rem" } 
          }}>
            {new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </Typography>
        </Box>
      </motion.div>

      {/* ── Fila principal centrada ── */}
      <motion.div variants={itemAnimation}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: { xs: 2, md: 3 } }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 280px)", gap: 3 }}>
            <VentasCard />
            <VentasMensualesChart />
            <StockCard />
            <StockCategoriasChart />
          </Box>
        </Box>
      </motion.div>

      {/* ── Fila secundaria centrada ── */}
      <motion.div variants={itemAnimation}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: { xs: 3, md: 4 } }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 280px)", gap: 3 }}>
            <KioscosCard />
            <EmpleadosCard />
            <ProductosCard />
            <PedidosCard />
          </Box>
        </Box>
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
      {/* ← CAMBIO: onSectionChange viene del prop, no de setSelectedSection local */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => onSidebarToggle(false)}
        selectedSection={selectedSection}
        onSectionChange={onSectionChange}
      />
      <Box component="main" sx={{
        flexGrow: 1,
        marginLeft: sidebarOpen ? `${drawerWidth}px` : 0,
        transition: "margin-left 0.3s ease",
        width: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : "100%",
        minHeight: "100vh",
      }}>
        <Box sx={{ p: { xs: 2, sm: 3, md: 4, lg: 5 }, maxWidth: "1600px", mx: "auto" }}>
          {selectedSection === "dashboard" && renderDashboard()}
          {selectedSection !== "dashboard" && renderTableSection()}
        </Box>
      </Box>
    </Box>
  );
}