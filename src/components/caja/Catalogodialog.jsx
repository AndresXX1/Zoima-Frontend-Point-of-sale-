import {
  Dialog, DialogContent, DialogActions,
  Box, Button, TextField, Table, TableHead, TableRow,
  TableCell, TableBody, TablePagination, Checkbox,
  Typography, CircularProgress, Chip, InputAdornment,
} from "@mui/material";
import { AddShoppingCart, Search, Close } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";

const fmt = (n) =>
  Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0 });

const API = "http://localhost:3000/api";

const CatalogoDialog = ({
  open,
  onClose,
  productos,
  loadingProductos,
  busqueda,
  setBusqueda,
  seleccionados,
  toggleSeleccion,
  // setSelCantidad,
  confirmarSeleccion,
  prodPage,
  setProdPage,
  prodRowsPerPage,
  setProdRowsPerPage,
}) => {
  const [stockMap, setStockMap] = useState({});
  const [loadingStock, setLoadingStock] = useState(false);

  // Cargar stock cuando se abre
  useEffect(() => {
    if (!open) return;
    const cargar = async () => {
      setLoadingStock(true);
      try {
        const res = await fetch(`${API}/stock`, { credentials: "include" });
        if (!res.ok) throw new Error();
        const data = await res.json();
        // data: [{ producto_id, cantidad, ... }]
        const map = {};
        data.forEach(s => { map[s.producto_id] = Number(s.cantidad); });
        setStockMap(map);
      } catch {
        setStockMap({});
      } finally {
        setLoadingStock(false);
      }
    };
    cargar();
  }, [open]);

  const cantSeleccionados = Object.keys(seleccionados).length;

  // Filtrar y ordenar: con stock primero
  const productosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    const filtrados = productos.filter(p =>
      p.nombre.toLowerCase().includes(q) || (p.codigo_barra || "").includes(q)
    );
    return [
      ...filtrados.filter(p => (stockMap[p.id] ?? 0) > 0),
      ...filtrados.filter(p => (stockMap[p.id] ?? 0) <= 0),
    ];
  }, [productos, busqueda, stockMap]);

  const productosPaginados = productosFiltrados.slice(
    prodPage * prodRowsPerPage,
    prodPage * prodRowsPerPage + prodRowsPerPage
  );

  const isLoading = loadingProductos || loadingStock;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 24px 64px rgba(0,0,0,0.12)",
          overflow: "hidden",
        }
      }}
    >
      {/* ── Header ── */}
      <Box sx={{
        px: 3, py: 2.5,
        borderBottom: "1px solid #e2e8f0",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(135deg, #f8faff 0%, #f1f5f9 100%)",
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{
            backgroundColor: "rgba(102,126,234,0.12)", borderRadius: 2,
            p: 0.8, display: "flex", alignItems: "center",
          }}>
            <AddShoppingCart sx={{ color: "var(--primary)", fontSize: "1.2rem" }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1, fontSize: "1rem" }}>
              Catálogo de Productos
            </Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
              {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? "s" : ""}
            </Typography>
          </Box>
          {cantSeleccionados > 0 && (
            <Chip
              label={`${cantSeleccionados} seleccionado${cantSeleccionados > 1 ? "s" : ""}`}
              size="small"
              sx={{ backgroundColor: "rgba(102,126,234,0.12)", color: "var(--primary)", fontWeight: 700, border: "1px solid rgba(102,126,234,0.2)" }}
            />
          )}
        </Box>
        <Button size="small" onClick={onClose}
          sx={{ minWidth: 0, color: "#94a3b8", p: 0.7, borderRadius: 2,
            "&:hover": { backgroundColor: "#f1f5f9", color: "#64748b" } }}>
          <Close fontSize="small" />
        </Button>
      </Box>

      {/* ── Buscador ── */}
      <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #f1f5f9" }}>
        <TextField
          placeholder="Buscar por nombre o código de barras..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setProdPage(0); }}
          fullWidth size="small"
          autoFocus
          sx={{
            "& .MuiOutlinedInput-root": {
              fontWeight: 600, borderRadius: 2,
              backgroundColor: "white",
              "&:hover fieldset": { borderColor: "var(--primary)" },
              "&.Mui-focused fieldset": { borderColor: "var(--primary)" },
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: busqueda ? "var(--primary)" : "#94a3b8", fontSize: "1.1rem" }} />
              </InputAdornment>
            ),
            endAdornment: busqueda ? (
              <InputAdornment position="end">
                <Button size="small" onClick={() => { setBusqueda(""); setProdPage(0); }}
                  sx={{ minWidth: 0, p: 0.3, color: "#94a3b8" }}>
                  <Close sx={{ fontSize: "0.9rem" }} />
                </Button>
              </InputAdornment>
            ) : null,
          }}
        />
      </Box>

      {/* ── Tabla ── */}
      <DialogContent sx={{ p: 0, overflow: "auto" }}>
        {isLoading ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <CircularProgress sx={{ color: "var(--primary)" }} size={32} />
            <Typography variant="caption" sx={{ display: "block", mt: 1.5, color: "#94a3b8" }}>
              Cargando productos...
            </Typography>
          </Box>
        ) : productosFiltrados.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Search sx={{ fontSize: 40, color: "#e2e8f0", mb: 1.5 }} />
            <Typography sx={{ color: "#94a3b8", fontWeight: 600 }}>Sin resultados</Typography>
            <Typography variant="caption" sx={{ color: "#cbd5e1" }}>
              Probá con otro término de búsqueda
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#fafbff" }}>
                <TableCell padding="checkbox" sx={{ pl: 2 }} />
                <TableCell sx={{ fontWeight: 800, color: "#64748b", fontSize: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Producto
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "#64748b", fontSize: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Precio
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: "#64748b", fontSize: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Stock
                </TableCell>

              </TableRow>
            </TableHead>
            <TableBody>
              {productosPaginados.map((p) => {
                const stockActual = stockMap[p.id] ?? 0;
                const sinStock = stockActual <= 0;
                const stockBajo = !sinStock && stockActual <= (p.stock_minimo || 0);
                const estaSeleccionado = !!seleccionados[p.id];

                return (
                  <TableRow
                    key={p.id}
                    onClick={() => !sinStock && toggleSeleccion(p)}
                    sx={{
                      cursor: sinStock ? "not-allowed" : "pointer",
                      opacity: sinStock ? 0.45 : 1,
                      backgroundColor: estaSeleccionado ? "rgba(102,126,234,0.04)" : "transparent",
                      borderLeft: estaSeleccionado ? "3px solid var(--primary)" : "3px solid transparent",
                      transition: "all 0.12s ease",
                      "&:hover": !sinStock ? {
                        backgroundColor: estaSeleccionado ? "rgba(102,126,234,0.07)" : "#f8faff",
                      } : {},
                    }}
                  >
                    {/* Checkbox */}
                    <TableCell padding="checkbox" sx={{ pl: 2 }}>
                      <Checkbox
                        checked={estaSeleccionado}
                        disabled={sinStock}
                        size="small"
                        sx={{
                          color: "#cbd5e1",
                          "&.Mui-checked": { color: "var(--primary)" },
                          "&.Mui-disabled": { color: "#e2e8f0" },
                        }}
                      />
                    </TableCell>

                    {/* Nombre */}
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", color: sinStock ? "#94a3b8" : "var(--text-primary)" }}>
                        {p.nombre}
                      </Typography>
                      {p.codigo_barra && (
                        <Typography variant="caption" sx={{ color: "#cbd5e1", fontSize: "0.72rem" }}>
                          {p.codigo_barra}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Precio */}
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 800, color: sinStock ? "#94a3b8" : "var(--primary)", fontSize: "0.95rem" }}>
                        ${fmt(p.precio)}
                      </Typography>
                    </TableCell>

                    {/* Stock badge */}
                    <TableCell align="center">
                      {sinStock ? (
                        <Chip label="Sin stock" size="small"
                          sx={{ backgroundColor: "#fee2e2", color: "#991b1b", fontWeight: 700, fontSize: "0.68rem", height: 22 }} />
                      ) : stockBajo ? (
                        <Chip label={`⚠ ${stockActual}`} size="small"
                          sx={{ backgroundColor: "#fef3c7", color: "#92400e", fontWeight: 700, fontSize: "0.68rem", height: 22 }} />
                      ) : (
                        <Chip label={stockActual} size="small"
                          sx={{ backgroundColor: "#dcfce7", color: "#166534", fontWeight: 700, fontSize: "0.68rem", height: 22 }} />
                      )}
                    </TableCell>

                    {/* Campo cantidad
                    <TableCell align="center" onClick={e => e.stopPropagation()}>
                      {estaSeleccionado && (
                        <TextField
                          type="number"
                          value={seleccionados[p.id].cantidad}
                          onChange={(e) => setSelCantidad(p.id, e.target.value)}
                          size="small"
                          inputProps={{ min: 1, max: stockActual }}
                          sx={{
                            width: 70,
                            "& input": { textAlign: "center", fontWeight: 800, fontSize: "0.9rem" },
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 1.5,
                              "&.Mui-focused fieldset": { borderColor: "var(--primary)" },
                            }
                          }}
                        />
                      )}
                    </TableCell> */}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DialogContent>

      {/* ── Paginación + Footer ── */}
      <Box sx={{ borderTop: "1px solid #e2e8f0" }}>
        <TablePagination
          component="div"
          count={productosFiltrados.length}
          page={prodPage}
          onPageChange={(_, p) => setProdPage(p)}
          rowsPerPage={prodRowsPerPage}
          onRowsPerPageChange={(e) => { setProdRowsPerPage(parseInt(e.target.value)); setProdPage(0); }}
          labelRowsPerPage="Filas:"
          sx={{ borderBottom: "1px solid #f1f5f9", "& .MuiToolbar-root": { minHeight: 44 } }}
        />

        <DialogActions sx={{ px: 3, py: 2, gap: 1.5 }}>
          <Button onClick={onClose}
            sx={{ fontWeight: 700, color: "#64748b", "&:hover": { backgroundColor: "#f1f5f9" } }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={confirmarSeleccion}
            disabled={cantSeleccionados === 0}
            startIcon={<AddShoppingCart />}
            sx={{
              fontWeight: 800, px: 3,
              background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
              boxShadow: cantSeleccionados > 0 ? "0 4px 12px rgba(102,126,234,0.3)" : "none",
              "&:hover": { background: "linear-gradient(135deg, #764ba2 0%, var(--primary) 100%)" },
              "&:disabled": { background: "#e2e8f0", color: "#94a3b8" }
            }}
          >
            {cantSeleccionados > 0 ? `Agregar (${cantSeleccionados})` : "Seleccioná productos"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default CatalogoDialog;