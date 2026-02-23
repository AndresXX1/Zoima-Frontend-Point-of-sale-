import {
  Box, Paper, Typography, TextField, Button, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, InputAdornment,
} from "@mui/material";
import {
  CheckCircle, Lock, LockOpen, AttachMoney,
} from "@mui/icons-material";

const fmt = (n) =>
  Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0 });

const fmtFecha = (iso) =>
  new Date(iso).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

/* ─── RESUMEN DE CIERRE ──────────────────────────────────────────── */
const ResumenCierre = ({ ventas, montoInicial, montoContado }) => {
  const ventasValidas = ventas.filter((v) => !v.anulada);
  const totalEfectivo = ventasValidas.reduce((acc, v) => acc + Number(v.total_efectivo || 0), 0);
  const totalMP = ventasValidas.reduce((acc, v) => acc + Number(v.total_mp || 0), 0);
  const totalVendido = ventasValidas.reduce((acc, v) => acc + Number(v.total), 0);
  const efectivoEsperado = Number(montoInicial) + totalEfectivo;
  const diferencia = Number(montoContado) - efectivoEsperado;

  return (
    <Box sx={{
      mt: 2.5, p: 3,
      background: "linear-gradient(135deg, var(--bg-soft) 0%, #f1f5f9 100%)",
      borderRadius: 3, border: "1px solid #e2e8f0",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)", transition: "all 0.3s ease"
    }}>
      <Typography variant="caption" sx={{
        fontWeight: 800, color: "var(--text-secondary)", display: "block",
        mb: 2, letterSpacing: "0.1em", fontSize: "0.8rem"
      }}>
        📊 RESUMEN DEL TURNO
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 2 }}>
        {[
          { label: "Ventas realizadas", value: ventasValidas.length, icon: "🛍️" },
          { label: "Total vendido", value: `$${fmt(totalVendido)}`, icon: "💰" },
          { label: "Cobrado efectivo", value: `$${fmt(totalEfectivo)}`, icon: "💵" },
          { label: "Cobrado MP", value: `$${fmt(totalMP)}`, icon: "💳" },
        ].map(({ label, value, icon }) => (
          <Box key={label} sx={{
            p: 1.5, backgroundColor: "white", borderRadius: 2,
            border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
            transition: "all 0.2s ease",
            "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)", transform: "translateY(-2px)" }
          }}>
            <Typography variant="caption" sx={{
              color: "#64748b", display: "flex", alignItems: "center",
              gap: 0.5, fontSize: "0.7rem", mb: 0.5
            }}>
              <span>{icon}</span> {label}
            </Typography>
            <Typography variant="body2" sx={{
              fontWeight: 800, color: "var(--text-primary)",
              fontFamily: "monospace", fontSize: "1rem"
            }}>
              {value}
            </Typography>
          </Box>
        ))}
      </Box>
      {montoContado && (
        <Box sx={{
          p: 2, borderRadius: 2,
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
            <Typography variant="caption" sx={{
              color: diferencia >= 0 ? "#166534" : "#991b1b",
              fontWeight: 800, fontSize: "0.85rem"
            }}>
              {diferencia >= 0 ? "✅ Sobrante" : "⚠️ Faltante"}
            </Typography>
            <Typography variant="body1" sx={{
              color: diferencia >= 0 ? "#166534" : "#991b1b",
              fontWeight: 900, fontFamily: "monospace", fontSize: "1.1rem"
            }}>
              ${fmt(Math.abs(diferencia))}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem", display: "block" }}>
            Esperado: ${fmt(efectivoEsperado)} · Contado: ${fmt(montoContado)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

/* ─── TAB GESTIÓN DE CAJA ────────────────────────────────────────── */
const TabGestionCaja = ({
  caja,
  loadingCaja,
  montoInicial,
  setMontoInicial,
  montoCierre,
  setMontoCierre,
  kioscos,
  selectedKiosco,
  setSelectedKiosco,
  isAdmin,
  user,
  ventas,
  onAbrirCaja,
  onCerrarCaja,
}) => {
  if (loadingCaja) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <CircularProgress sx={{ color: "var(--primary)" }} />
        <Typography sx={{ mt: 2, color: "#64748b" }}>Cargando estado...</Typography>
      </Box>
    );
  }

  if (caja) {
    return (
      <Paper elevation={0} sx={{
        p: 4, borderRadius: 3,
        border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
      }}>
        {/* Header caja abierta */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Box sx={{ backgroundColor: "#dcfce7", borderRadius: 2, p: 1.5, display: "flex" }}>
            <CheckCircle sx={{ color: "#16a34a", fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--text-primary)" }}>
              Caja Abierta
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              {fmtFecha(caja.fecha_apertura)}
            </Typography>
          </Box>
        </Box>

        {/* Info cards */}
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2, mb: 3 }}>
          {[
            { label: "Monto inicial", value: `$${fmt(caja.monto_inicial)}`, icon: "💵" },
            {
              label: "Usuario",
              value: user?.nombre && user?.apellido
                ? `${user.nombre} ${user.apellido}`
                : user?.email?.split("@")[0] || "N/A",
              icon: "👤"
            },
            {
              label: "Kiosco",
              value: user?.kiosco_nombre
                || kioscos.find(k => Number(k.id) === Number(user?.kiosco_id))?.nombre
                || (user?.kiosco_id ? `Kiosco #${user.kiosco_id}` : "N/A"),
              icon: "🏪"
            },
          ].map(({ label, value, icon }) => (
            <Box key={label} sx={{
              p: 2.5, backgroundColor: "var(--bg-soft)", borderRadius: 2,
              border: "1px solid #e2e8f0", transition: "all 0.2s ease",
              "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)", transform: "translateY(-2px)" }
            }}>
              <Typography variant="caption" sx={{
                color: "#64748b", display: "flex", alignItems: "center",
                gap: 0.5, mb: 0.5, fontSize: "0.75rem"
              }}>
                <span>{icon}</span> {label}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "1.1rem" }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Cierre */}
        <Box sx={{
          display: "flex", gap: 2, alignItems: "flex-end", p: 3,
          backgroundColor: "var(--warning-light)", borderRadius: 2, border: "2px solid #fbbf24"
        }}>
          <TextField
            label="Monto en efectivo contado"
            type="number"
            value={montoCierre}
            onChange={(e) => setMontoCierre(e.target.value)}
            fullWidth
            variant="outlined"
            sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "white", fontWeight: 700 } }}
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
            onClick={onCerrarCaja}
            startIcon={<Lock />}
            sx={{
              minWidth: 160, py: 1.8, px: 3, fontWeight: 800,
              background: "linear-gradient(135deg, #f59e0b 0%, var(--warning) 100%)",
              boxShadow: "0 4px 12px rgba(245,158,11,0.3)",
              "&:hover": {
                background: "linear-gradient(135deg, var(--warning) 0%, #b45309 100%)",
                transform: "translateY(-2px)", boxShadow: "0 6px 20px rgba(245,158,11,0.4)"
              },
              transition: "all 0.3s ease"
            }}
          >
            Cerrar Caja
          </Button>
        </Box>

        <ResumenCierre ventas={ventas} montoInicial={caja.monto_inicial} montoContado={montoCierre} />
      </Paper>
    );
  }

  /* Caja cerrada */
  return (
    <Paper elevation={0} sx={{
      p: 5, textAlign: "center", borderRadius: 3,
      border: "2px dashed #cbd5e1", boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
    }}>
      <Box sx={{ display: "inline-flex", backgroundColor: "var(--error-light)", borderRadius: 3, p: 2, mb: 3 }}>
        <Lock sx={{ fontSize: 48, color: "var(--error)" }} />
      </Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 800, color: "var(--text-primary)" }}>
        Caja Cerrada
      </Typography>
      <Typography sx={{ mb: 4, color: "#64748b", maxWidth: 400, mx: "auto" }}>
        Para comenzar a operar, abrí una nueva caja ingresando el monto inicial en efectivo.
      </Typography>

      {isAdmin && kioscos.length > 0 && (
        <FormControl fullWidth sx={{ mb: 3, maxWidth: 400, mx: "auto" }}>
          <InputLabel>Seleccionar kiosco</InputLabel>
          <Select
            value={selectedKiosco}
            onChange={(e) => setSelectedKiosco(e.target.value)}
            label="Seleccionar kiosco"
            sx={{ backgroundColor: "white", fontWeight: 700 }}
          >
            {kioscos.map((k) => (
              <MenuItem key={k.id} value={k.id}>🏪 {k.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", maxWidth: 500, mx: "auto" }}>
        <TextField
          label="Monto inicial en efectivo"
          type="number"
          value={montoInicial}
          onChange={(e) => setMontoInicial(e.target.value)}
          fullWidth
          variant="outlined"
          sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "white", fontWeight: 700 } }}
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
          onClick={onAbrirCaja}
          startIcon={<LockOpen />}
          sx={{
            minWidth: 160, py: 1.8, px: 3, fontWeight: 800,
            background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
            boxShadow: "0 4px 12px rgba(102,126,234,0.3)",
            "&:hover": {
              background: "linear-gradient(135deg, #764ba2 0%, var(--primary) 100%)",
              transform: "translateY(-2px)", boxShadow: "0 6px 20px rgba(102,126,234,0.4)"
            },
            transition: "all 0.3s ease"
          }}
        >
          Abrir Caja
        </Button>
      </Box>
    </Paper>
  );
};

export default TabGestionCaja;