// stock/TabResumen.jsx
import {
  Box, Card, CardContent, Typography, Divider, LinearProgress,
  Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, Button, CircularProgress,
} from "@mui/material";
import { CheckCircle, Refresh } from "@mui/icons-material";

const TabResumen = ({
  resumen,
  alertas,
  loadingResumen,
  loadingAlertas,
  stock,
  getProductoPrecioCosto,
  onRefresh,
}) => {
  return (
    <Box>
      {loadingResumen ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="h6" sx={{ color: "white", fontWeight: 600, mb: 2 }}>
            💰 Valor del stock por kiosco
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 3, mb: 4 }}>
            {resumen.map(r => {
              const pct = r.total_productos > 0 ? (r.productos_agotados / r.total_productos) * 100 : 0;
              const stockDelKiosco = stock.filter(s => s.kiosco_id === r.kiosco_id);
              const costoTotal = stockDelKiosco.reduce((acc, s) => {
                const costo = getProductoPrecioCosto(s.producto_id);
                return costo !== null ? acc + costo * s.cantidad : acc;
              }, 0);
              const hayConCosto = stockDelKiosco.some(s => getProductoPrecioCosto(s.producto_id) !== null);
              const margenTotal = hayConCosto ? parseFloat(r.valor_total ?? 0) - costoTotal : null;
              const margenPct = costoTotal > 0 && margenTotal !== null ? (margenTotal / costoTotal * 100) : null;

              return (
                <Card key={r.kiosco_id} sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", border: "1px solid rgba(102,126,234,0.15)" }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{r.kiosco_nombre}</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>Valor de venta</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: "var(--primary)", mb: 1 }}>
                      ${parseFloat(r.valor_total ?? 0).toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </Typography>

                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mb: 1.5 }}>
                      <Box sx={{ p: 1, backgroundColor: "var(--bg-soft)", borderRadius: 1 }}>
                        <Typography variant="caption" color="textSecondary" display="block">Costo total</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: "var(--error)" }}>
                          {hayConCosto ? `$${costoTotal.toLocaleString("es-ES", { minimumFractionDigits: 0 })}` : "—"}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 1, backgroundColor: "var(--bg-soft)", borderRadius: 1 }}>
                        <Typography variant="caption" color="textSecondary" display="block">Margen estimado</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: margenTotal === null ? "#64748b" : margenTotal >= 0 ? "var(--primary-dark)" : "var(--error)" }}>
                          {margenTotal === null ? "—" : `$${margenTotal.toLocaleString("es-ES", { minimumFractionDigits: 0 })}`}
                          {margenPct !== null && (
                            <Typography component="span" variant="caption" sx={{ ml: 0.5, color: "inherit" }}>
                              {`(${margenPct.toFixed(0)}%)`}
                            </Typography>
                          )}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="caption" color="textSecondary">
                      {r.total_unidades} unidades · {r.total_productos} productos
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--error)" }}>{r.productos_agotados}</Typography>
                        <Typography variant="caption" color="textSecondary">Agotados</Typography>
                      </Box>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--warning)" }}>{r.productos_bajo_minimo}</Typography>
                        <Typography variant="caption" color="textSecondary">Bajo mínimo</Typography>
                      </Box>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--primary-dark)" }}>{r.productos_ok}</Typography>
                        <Typography variant="caption" color="textSecondary">OK</Typography>
                      </Box>
                    </Box>

                    {pct > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{ height: 6, borderRadius: 3, backgroundColor: "#f1f5f9", "& .MuiLinearProgress-bar": { backgroundColor: pct > 30 ? "var(--error)" : "var(--warning)" } }}
                        />
                        <Typography variant="caption" color="textSecondary">{pct.toFixed(0)}% agotados</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          {/* Alertas */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>🚨 Alertas ({alertas.length})</Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={onRefresh}
              sx={{ color: "white", borderColor: "rgba(255,255,255,0.5)", "&:hover": { borderColor: "white", backgroundColor: "rgba(255,255,255,0.1)" } }}
            >
              Actualizar
            </Button>
          </Box>

          {loadingAlertas ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress sx={{ color: "white" }} />
            </Box>
          ) : alertas.length === 0 ? (
            <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
              <CheckCircle sx={{ fontSize: 48, color: "var(--primary-dark)", mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>¡Todo en orden!</Typography>
              <Typography variant="body2" color="textSecondary">No hay alertas de stock</Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Producto", "Kiosco", "Mínimo", "Actual", "Estado"].map(c => (
                      <TableCell key={c} sx={{ fontWeight: 600, backgroundColor: "var(--bg-soft)" }}>{c}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alertas.map(a => (
                    <TableRow key={a.stock_id} hover>
                      <TableCell>{a.producto_nombre}</TableCell>
                      <TableCell>{a.kiosco_nombre}</TableCell>
                      <TableCell>{a.stock_minimo} unid.</TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, color: a.cantidad_actual === 0 ? "var(--error)" : "var(--warning)" }}>
                          {a.cantidad_actual} unid.
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={a.estado_alerta === "agotado" ? "AGOTADO" : "BAJO MÍNIMO"}
                          size="small"
                          sx={{
                            backgroundColor: a.estado_alerta === "agotado" ? "var(--error-light)" : "var(--warning-light)",
                            color: a.estado_alerta === "agotado" ? "#991b1b" : "#92400e",
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Box>
  );
};

export default TabResumen;