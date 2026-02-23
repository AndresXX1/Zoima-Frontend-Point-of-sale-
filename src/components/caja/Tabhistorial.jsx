import {
  Box, Paper, Typography, Button, Table, TableHead,
  TableRow, TableCell, TableBody, IconButton, CircularProgress,
  Chip, FormControl, InputLabel, Select, MenuItem, Tooltip,
  TablePagination,
} from "@mui/material";
import {
  Clear, ViewList, CheckCircle, Cancel,
  Refresh, Person,
} from "@mui/icons-material";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import TicketDialog from "./Ticketdialog";

const fmt = (n) =>
  Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0 });

const fmtFecha = (iso) =>
  new Date(iso).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

/* ─── TAB HISTORIAL ──────────────────────────────────────────────── */
const TabHistorial = ({
  ventas, loadingHistorial,
  filtroEstado, setFiltroEstado,
  filtroFecha, setFiltroFecha,
  ventaDetalle, detalleOpen, setDetalleOpen,
  isAdmin, onVerDetalle, onAnularVenta, onRecargar,
}) => {
  const [page, setPage]               = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const ventasFiltradas = ventas.filter((v) => {
    if (filtroEstado === "ok"       && v.anulada)  return false;
    if (filtroEstado === "anuladas" && !v.anulada) return false;
    if (filtroFecha) {
      const fechaVenta = new Date(v.fecha).toISOString().slice(0, 10);
      if (fechaVenta !== filtroFecha) return false;
    }
    return true;
  });

  const totalHistorial = ventasFiltradas
    .filter((v) => !v.anulada)
    .reduce((acc, v) => acc + Number(v.total), 0);

  // Resetear página al cambiar filtros
  const handleFiltroEstado = (v) => { setFiltroEstado(v); setPage(0); };
  const handleFiltroFecha  = (v) => { setFiltroFecha(v);  setPage(0); };
  const handleLimpiar      = ()  => { setFiltroEstado("todas"); setFiltroFecha(""); setPage(0); };

  const ventasPaginadas = ventasFiltradas.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      {/* Filtros y stats */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", mb: 3 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Estado</InputLabel>
            <Select value={filtroEstado} onChange={(e) => handleFiltroEstado(e.target.value)} label="Estado" sx={{ fontWeight: 700 }}>
              <MenuItem value="todas">📋 Todas</MenuItem>
              <MenuItem value="ok">✅ Confirmadas</MenuItem>
              <MenuItem value="anuladas">❌ Anuladas</MenuItem>
            </Select>
          </FormControl>

          <TextField type="date" label="Fecha" value={filtroFecha}
            onChange={(e) => handleFiltroFecha(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 200, "& .MuiOutlinedInput-root": { fontWeight: 700 } }}
          />

          <Button variant="outlined" onClick={handleLimpiar}
            startIcon={<Clear />} sx={{ fontWeight: 700, borderColor: "#cbd5e1", color: "#64748b" }}>
            Limpiar
          </Button>

          <Box sx={{ flex: 1 }} />

          <Tooltip title="Recargar historial">
            <IconButton onClick={onRecargar} sx={{ backgroundColor: "var(--bg-soft)", "&:hover": { backgroundColor: "#e2e8f0" } }}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Stats */}
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2 }}>
          {[
            { label: "Total ventas",    value: ventasFiltradas.length,                         icon: "📊" },
            { label: "Confirmadas",     value: ventasFiltradas.filter(v => !v.anulada).length, icon: "✅" },
            { label: "Anuladas",        value: ventasFiltradas.filter(v => v.anulada).length,  icon: "❌" },
            { label: "Total facturado", value: `$${fmt(totalHistorial)}`,                      icon: "💰" },
          ].map(({ label, value, icon }) => (
            <Box key={label} sx={{ p: 2, backgroundColor: "var(--bg-soft)", borderRadius: 2, border: "1px solid #e2e8f0", transition: "all 0.2s ease", "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)", transform: "translateY(-2px)" } }}>
              <Typography variant="caption" sx={{ color: "#64748b", display: "flex", alignItems: "center", gap: 0.5, mb: 0.5, fontSize: "0.7rem" }}>
                <span>{icon}</span> {label}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: "var(--text-primary)" }}>{value}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Tabla */}
      {loadingHistorial ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress sx={{ color: "var(--primary)" }} />
          <Typography sx={{ mt: 2, color: "#64748b" }}>Cargando historial...</Typography>
        </Box>
      ) : ventasFiltradas.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, textAlign: "center", borderRadius: 3, border: "2px dashed #cbd5e1" }}>
          <ViewList sx={{ fontSize: 64, color: "#cbd5e1", mb: 2 }} />
          <Typography sx={{ color: "#94a3b8", fontWeight: 600 }}>No hay ventas registradas</Typography>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", overflow: "hidden" }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "var(--bg-soft)" }}>
                <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)" }}>Ticket</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)" }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)" }}>Usuario</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "var(--text-secondary)" }}>Realizado por</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "var(--text-secondary)" }}>Total</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-secondary)" }}>Estado</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: "var(--text-secondary)" }}>-</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ventasPaginadas.map((v) => {
                const empleados = v.empleados ?? [];
                return (
                  <TableRow key={v.id} sx={{ backgroundColor: v.anulada ? "#fef2f2" : "white", "&:hover": { backgroundColor: v.anulada ? "var(--error-light)" : "var(--bg-soft)" }, transition: "all 0.2s ease" }}>
                    <TableCell sx={{ fontWeight: 800, color: "var(--primary)" }}>#{v.ticket_numero}</TableCell>
                    <TableCell>{fmtFecha(v.fecha)}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{v.usuario_nombre || "N/A"}</TableCell>
                    <TableCell>
                      {empleados.length === 0 ? (
                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>—</Typography>
                      ) : (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {empleados.map((emp, i) => (
                            <Chip key={i} icon={<Person sx={{ fontSize: "0.8rem !important" }} />}
                              label={typeof emp === "string" ? emp : `${emp.nombre} ${emp.apellido}`}
                              size="small" sx={{ backgroundColor: "rgba(102,126,234,0.1)", color: "var(--primary)", fontWeight: 600, fontSize: "0.72rem", height: 22 }} />
                          ))}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: "1.05rem" }}>${fmt(v.total)}</TableCell>
                    <TableCell align="center">
                      {v.anulada
                        ? <Chip icon={<Cancel />} label="Anulada" size="small" sx={{ backgroundColor: "var(--error-light)", color: "#991b1b", fontWeight: 700 }} />
                        : <Chip icon={<CheckCircle />} label="OK" size="small" sx={{ backgroundColor: "#dcfce7", color: "#166534", fontWeight: 700 }} />}
                    </TableCell>
                    <TableCell align="center">
                      <Button size="small" onClick={() => onVerDetalle(v.id)}
                        sx={{ fontWeight: 700, color: "var(--primary)", "&:hover": { backgroundColor: "rgba(102,126,234,0.1)" } }}>
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Paginado */}
          <TablePagination
            component="div"
            count={ventasFiltradas.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
            rowsPerPageOptions={[5, 20, 50]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            sx={{
              borderTop: "1px solid #e2e8f0",
              backgroundColor: "var(--bg-soft)",
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                fontWeight: 600, color: "#64748b", fontSize: "0.82rem",
              },
              "& .MuiTablePagination-select": { fontWeight: 700 },
              "& .MuiIconButton-root": {
                color: "var(--primary)",
                "&:disabled": { color: "#cbd5e1" },
              },
            }}
          />
        </Paper>
      )}

      {/* TicketDialog como detalle único */}
      <TicketDialog
        open={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        ticket={ventaDetalle}
        isAdmin={isAdmin}
        onAnular={onAnularVenta}
      />
    </Box>
  );
};

export default TabHistorial;