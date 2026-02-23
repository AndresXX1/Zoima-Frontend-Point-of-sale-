import {
  Dialog, DialogContent, DialogActions, Button, Box, Typography,
  Divider, Chip, Table, TableHead, TableRow, TableCell, TableBody,
  CircularProgress,
} from "@mui/material";
import {
  Print, Download, Close, CheckCircle, Contactless,
  AttachMoney, CreditCard, Receipt, Person, Cancel,
} from "@mui/icons-material";
import { useState } from "react";

const fmt = (n) =>
  Number(n).toLocaleString("es-AR", { minimumFractionDigits: 0 });

const fmtFecha = (iso) =>
  new Date(iso).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const METODO_CONFIG = {
  EFECTIVO: { icon: <AttachMoney sx={{ fontSize: "1rem" }} />, color: "#16a34a", bg: "#dcfce7", border: "#86efac", label: "Efectivo" },
  MP:       { icon: <CreditCard  sx={{ fontSize: "1rem" }} />, color: "#1e40af", bg: "#eff6ff", border: "#93c5fd", label: "Mercado Pago" },
  POSNET:   { icon: <Contactless sx={{ fontSize: "1rem" }} />, color: "#6b21a8", bg: "#f3e8ff", border: "#d8b4fe", label: "Posnet" },
};

const PRINT_STYLES = `
  @media print {
    body * { visibility: hidden !important; }
    #ticket-print-area, #ticket-print-area * { visibility: visible !important; }
    #ticket-print-area {
      position: fixed !important; top: 0 !important; left: 0 !important;
      width: 80mm !important; padding: 8mm !important;
      font-size: 11px !important; box-shadow: none !important;
    }
  }
`;

// ─── Helpers exportados ───────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export const generarHTMLTicket = (ticket) => {
  const detalles  = ticket?.detalles  ?? ticket?.productos ?? [];
  const pagos     = ticket?.pagos     ?? [];
  const empleados = ticket?.empleados ?? [];
  const numero    = ticket?.ticket_numero ?? ticket?.numero ?? "—";

  return `<!DOCTYPE html><html>
  <head>
    <meta charset="utf-8"/>
    <title>Ticket #${numero}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Segoe UI', Arial, sans-serif; padding: 16px; width: 80mm; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th, td { padding: 4px 6px; text-align: left; border-bottom: 1px solid #e2e8f0; }
      th { background: #f8fafc; font-weight: 800; color: #64748b; }
      .total-box { background: #667eea; color: white; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; margin-top: 12px; }
      .total-box span:first-child { font-size: 1rem; font-weight: 800; }
      .total-box span:last-child  { font-size: 1.4rem; font-weight: 900; }
      .header { text-align: center; margin-bottom: 16px; }
      .header h2 { color: #166534; font-size: 1.2rem; margin-top: 8px; }
      .check { width: 48px; height: 48px; background: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
      .ticket-meta { display: flex; justify-content: space-between; background: #f1f5f9; padding: 10px; border-radius: 6px; margin-bottom: 12px; }
      .label { font-size: 0.6rem; color: #64748b; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; }
      .value { font-weight: 800; color: #334155; }
      .value.primary { color: #667eea; font-size: 1.1rem; }
      .section-title { font-size: 0.65rem; font-weight: 800; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase; margin: 10px 0 6px; }
      .pago-row { display: flex; justify-content: space-between; padding: 6px 10px; border-radius: 6px; margin-bottom: 4px; font-weight: 700; font-size: 0.85rem; }
      .pago-efectivo { background: #dcfce7; color: #166534; }
      .pago-mp       { background: #eff6ff; color: #1e40af; }
      .pago-posnet   { background: #f3e8ff; color: #6b21a8; }
      .vuelto { background: #fef9c3; color: #854d0e; display: flex; justify-content: space-between; padding: 8px 10px; border-radius: 6px; margin-bottom: 10px; font-weight: 800; }
      .empleados { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px; }
      .emp-chip { background: rgba(102,126,234,0.12); color: #667eea; font-weight: 700; font-size: 0.72rem; padding: 2px 8px; border-radius: 99px; }
      hr { border: none; border-top: 1px solid #e2e8f0; margin: 10px 0; }
      @media print { @page { size: 80mm auto; margin: 0; } body { padding: 8mm; } }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="check"><span style="color:white;font-size:24px;">✓</span></div>
      <h2>Comprobante de venta</h2>
      ${ticket?.kiosco_nombre ? `<p style="color:#64748b;font-size:0.8rem;margin-top:4px;">${ticket.kiosco_nombre}</p>` : ""}
    </div>
    <div class="ticket-meta">
      <div><div class="label">Ticket</div><div class="value primary">#${numero}</div></div>
      <div style="text-align:right"><div class="label">Fecha</div><div class="value" style="font-size:0.8rem;">${fmtFecha(ticket?.fecha ?? new Date().toISOString())}</div></div>
    </div>
    ${empleados.length > 0 ? `
      <div class="section-title">👤 Atendido por</div>
      <div class="empleados">${empleados.map(e => `<span class="emp-chip">${typeof e === "string" ? e : `${e.nombre} ${e.apellido}`}</span>`).join("")}</div>` : ""}
    ${detalles.length > 0 ? `
      <div class="section-title">🛍️ Productos</div>
      <table>
        <thead><tr><th>Producto</th><th style="text-align:center">Cant.</th><th style="text-align:right">P.Unit.</th><th style="text-align:right">Sub.</th></tr></thead>
        <tbody>${detalles.map(p => {
          const precio = Number(p.precio_unitario ?? p.precio ?? 0);
          const nombre = p.producto_nombre ?? p.nombre ?? "—";
          return `<tr><td>${nombre}</td><td style="text-align:center">${p.cantidad}</td><td style="text-align:right">$${fmt(precio)}</td><td style="text-align:right;font-weight:800;color:#667eea;">$${fmt(p.cantidad * precio)}</td></tr>`;
        }).join("")}</tbody>
      </table>` : ""}
    ${pagos.length > 0 ? `
      <div class="section-title">💳 Forma de pago</div>
      ${pagos.map(p => {
        const cls = p.tipo === "EFECTIVO" ? "pago-efectivo" : p.tipo === "MP" ? "pago-mp" : "pago-posnet";
        const lbl = p.tipo === "EFECTIVO" ? "Efectivo" : p.tipo === "MP" ? "Mercado Pago" : "Posnet";
        return `<div class="pago-row ${cls}"><span>${lbl}</span><span>$${fmt(p.monto)}</span></div>`;
      }).join("")}` : ""}
    ${(ticket?.vuelto ?? 0) > 0 ? `<hr/><div class="vuelto"><span>Vuelto</span><span>$${fmt(ticket.vuelto)}</span></div>` : ""}
    <div class="total-box"><span>TOTAL</span><span>$${fmt(ticket?.total ?? 0)}</span></div>
    <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
  </body></html>`;
};

// eslint-disable-next-line react-refresh/only-export-components
export const imprimirTicket = () => {
  if (!document.getElementById("ticket-print-styles")) {
    const style = document.createElement("style");
    style.id = "ticket-print-styles";
    style.innerHTML = PRINT_STYLES;
    document.head.appendChild(style);
  }
  window.print();
};

// eslint-disable-next-line react-refresh/only-export-components
export const descargarPDFTicket = (ticket) => {
  const w = window.open("", "_blank", "width=400,height=700");
  if (!w) return;
  w.document.write(generarHTMLTicket(ticket));
  w.document.close();
};

// ─── Área imprimible ──────────────────────────────────────────────────────────
const TicketPrintArea = ({ ticket }) => {
  if (!ticket) return null;
  const detalles  = ticket.detalles  ?? ticket.productos ?? [];
  const pagos     = ticket.pagos     ?? [];
  const empleados = ticket.empleados ?? [];

  return (
    <Box id="ticket-print-area">
      {/* Cabecera */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Box sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", mb: 2, boxShadow: "0 4px 16px rgba(22,163,74,0.35)" }}>
          <CheckCircle sx={{ color: "white", fontSize: 34 }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 900, color: "#166534", letterSpacing: "-0.5px" }}>¡Venta exitosa!</Typography>
        {ticket.kiosco_nombre && (
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5, fontWeight: 600 }}>{ticket.kiosco_nombre}</Typography>
        )}
      </Box>

      {/* Número + fecha */}
      <Box sx={{ mb: 2.5, p: 2, background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", borderRadius: 2, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.08em" }}>TICKET</Typography>
          <Typography variant="h6" sx={{ fontWeight: 900, color: "var(--primary)", lineHeight: 1.1 }}>#{ticket.ticket_numero ?? ticket.numero}</Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.08em" }}>FECHA</Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: "#334155" }}>{fmtFecha(ticket.fecha ?? new Date().toISOString())}</Typography>
        </Box>
      </Box>

      {/* Info extra del historial: usuario y kiosco */}
      {(ticket.usuario_nombre || ticket.usuario_email) && (
        <Box sx={{ mb: 2.5, p: 1.5, backgroundColor: "var(--bg-soft, #f8fafc)", borderRadius: 2, border: "1px solid #e2e8f0" }}>
          {[
            { label: "Usuario", value: ticket.usuario_email || ticket.usuario_nombre },
            ticket.kiosco_nombre && { label: "Kiosco", value: ticket.kiosco_nombre },
          ].filter(Boolean).map(({ label, value }) => (
            <Box key={label} sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>{label}:</Typography>
              <Typography variant="caption" sx={{ fontWeight: 800 }}>{value}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Empleados */}
      {empleados.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="caption" sx={{ display: "block", mb: 1, color: "#64748b", fontWeight: 800, letterSpacing: "0.05em" }}>👤 ATENDIDO POR</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
            {empleados.map((emp, i) => (
              <Chip key={i} icon={<Person sx={{ fontSize: "0.85rem !important" }} />}
                label={typeof emp === "string" ? emp : `${emp.nombre} ${emp.apellido}`}
                size="small" sx={{ backgroundColor: "rgba(102,126,234,0.1)", color: "var(--primary)", fontWeight: 700, fontSize: "0.75rem" }} />
            ))}
          </Box>
        </Box>
      )}

      {/* Productos */}
      <Typography variant="caption" sx={{ display: "block", mb: 1, color: "#64748b", fontWeight: 800, letterSpacing: "0.05em" }}>🛍️ PRODUCTOS</Typography>
      <Box sx={{ border: "1px solid #e2e8f0", borderRadius: 2, overflow: "hidden", mb: 2.5 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f8fafc" }}>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", fontSize: "0.75rem" }}>Producto</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800, color: "#64748b", fontSize: "0.75rem" }}>Cant.</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: "#64748b", fontSize: "0.75rem" }}>P. Unit.</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: "#64748b", fontSize: "0.75rem" }}>Subtotal</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {detalles.map((p, i) => {
              const precio = Number(p.precio_unitario ?? p.precio ?? 0);
              const nombre = p.producto_nombre ?? p.nombre ?? "—";
              return (
                <TableRow key={i} sx={{ "&:last-child td": { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.82rem" }}>{nombre}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>{p.cantidad}</TableCell>
                  <TableCell align="right" sx={{ fontSize: "0.82rem" }}>${fmt(precio)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: "var(--primary)" }}>${fmt(p.cantidad * precio)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>

      {/* Pagos */}
      {pagos.length > 0 && (
        <>
          <Typography variant="caption" sx={{ display: "block", mb: 1, color: "#64748b", fontWeight: 800, letterSpacing: "0.05em" }}>💳 FORMA DE PAGO</Typography>
          <Box sx={{ mb: 2.5, display: "flex", flexDirection: "column", gap: 1 }}>
            {pagos.map((pago, i) => {
              const cfg = METODO_CONFIG[pago.tipo] ?? METODO_CONFIG.EFECTIVO;
              return (
                <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.5, borderRadius: 2, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ color: cfg.color }}>{cfg.icon}</Box>
                    <Typography sx={{ fontWeight: 700, color: cfg.color, fontSize: "0.88rem" }}>{cfg.label}</Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 900, color: cfg.color }}>${fmt(pago.monto)}</Typography>
                </Box>
              );
            })}
          </Box>
        </>
      )}

      {/* Vuelto */}
      {(ticket.vuelto ?? 0) > 0 && (
        <Box sx={{ mb: 2.5, p: 1.5, borderRadius: 2, backgroundColor: "#fef9c3", border: "1px solid #fde047", display: "flex", justifyContent: "space-between" }}>
          <Typography sx={{ fontWeight: 700, color: "#854d0e" }}>Vuelto:</Typography>
          <Typography sx={{ fontWeight: 900, color: "#854d0e" }}>${fmt(ticket.vuelto)}</Typography>
        </Box>
      )}

      <Divider sx={{ mb: 2 }} />

      {/* Total */}
      <Box sx={{ p: 2.5, background: "linear-gradient(135deg, var(--primary, #667eea) 0%, #764ba2 100%)", borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 16px rgba(102,126,234,0.3)" }}>
        <Typography variant="h6" sx={{ color: "white", fontWeight: 800 }}>TOTAL</Typography>
        <Typography variant="h4" sx={{ color: "white", fontWeight: 900, textShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>${fmt(ticket.total)}</Typography>
      </Box>
    </Box>
  );
};

// ─── TicketDialog ─────────────────────────────────────────────────────────────
/**
 * Props:
 *   open        boolean
 *   onClose     () => void
 *   ticket      objeto con los datos de la venta
 *   isAdmin     boolean (opcional) — muestra botón Anular
 *   onAnular    async (id) => void (opcional) — callback para anular desde historial
 */
const TicketDialog = ({ open, onClose, ticket, isAdmin = false, onAnular }) => {
  const [confirmando, setConfirmando] = useState(false);
  const [anulando, setAnulando]       = useState(false);

  const normalized = ticket
    ? { ...ticket, ticket_numero: ticket.ticket_numero ?? ticket.numero }
    : null;

  const handleAnular = async () => {
    setAnulando(true);
    await onAnular?.(normalized.id);
    setAnulando(false);
    setConfirmando(false);
    onClose();
  };

  const handleClose = () => {
    if (anulando) return;
    setConfirmando(false);
    onClose();
  };

  const puedeAnular = isAdmin && onAnular && normalized && !normalized.anulada;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3, boxShadow: "0 8px 40px rgba(0,0,0,0.15)" } }}>

      {/* Header */}
      <Box sx={{ px: 3, pt: 2.5, pb: 1.5, borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Receipt sx={{ color: "var(--primary)" }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Ticket #{normalized?.ticket_numero ?? "—"}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {normalized?.anulada && (
            <Chip icon={<Cancel />} label="ANULADA" size="small"
              sx={{ backgroundColor: "#fee2e2", color: "#991b1b", fontWeight: 800 }} />
          )}
          <Button size="small" onClick={handleClose} disabled={anulando}
            sx={{ minWidth: 0, p: 0.5, color: "#64748b", "&:hover": { backgroundColor: "var(--bg-soft, #f8fafc)" } }}>
            <Close fontSize="small" />
          </Button>
        </Box>
      </Box>

      <DialogContent sx={{ pt: 3 }}>
        <TicketPrintArea ticket={normalized} />

        {/* Confirmación de anulación inline */}
        {confirmando && (
          <Box sx={{ mt: 3, p: 2.5, borderRadius: 2, background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)", border: "2px solid #fca5a5", boxShadow: "0 4px 12px rgba(239,68,68,0.15)" }}>
            <Typography variant="body2" sx={{ fontWeight: 800, color: "#991b1b", mb: 0.5 }}>
              ⚠️ ¿Seguro que querés anular esta venta?
            </Typography>
            <Typography variant="caption" sx={{ color: "#b91c1c", display: "block", mb: 2 }}>
              Esta acción revertirá el stock de los productos y no se puede deshacer.
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Button variant="outlined" fullWidth onClick={() => setConfirmando(false)} disabled={anulando}
                sx={{ fontWeight: 700, borderColor: "#fca5a5", color: "#991b1b", "&:hover": { backgroundColor: "#fef2f2" } }}>
                No, volver
              </Button>
              <Button variant="contained" fullWidth onClick={handleAnular} disabled={anulando}
                startIcon={anulando ? <CircularProgress size={16} sx={{ color: "white" }} /> : <Cancel />}
                sx={{ fontWeight: 800, backgroundColor: "#dc2626", boxShadow: "0 4px 12px rgba(220,38,38,0.3)", "&:hover": { backgroundColor: "#b91c1c" }, "&:disabled": { backgroundColor: "#fca5a5" } }}>
                {anulando ? "Anulando..." : "Sí, anular"}
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={{ p: 2.5, borderTop: "1px solid #e2e8f0", gap: 1, flexWrap: "wrap" }}>
        <Button onClick={handleClose} disabled={anulando} sx={{ fontWeight: 700, color: "#64748b" }}>
          Cerrar
        </Button>

        <Box sx={{ flex: 1 }} />

        {/* Anular — solo desde historial con isAdmin */}
        {puedeAnular && !confirmando && (
          <Button variant="outlined" onClick={() => setConfirmando(true)} startIcon={<Cancel />}
            sx={{ fontWeight: 800, borderColor: "#dc2626", color: "#dc2626", "&:hover": { backgroundColor: "#fef2f2" } }}>
            Anular
          </Button>
        )}

        {/* Imprimir y PDF — solo si no está anulada */}
        {!normalized?.anulada && (
          <>
            <Button variant="outlined" startIcon={<Print />} onClick={() => imprimirTicket()}
              sx={{ fontWeight: 700, borderColor: "var(--primary)", color: "var(--primary)", "&:hover": { backgroundColor: "rgba(102,126,234,0.08)" } }}>
              Imprimir
            </Button>
            <Button variant="contained" startIcon={<Download />} onClick={() => descargarPDFTicket(normalized)}
              sx={{ fontWeight: 800, background: "linear-gradient(135deg, var(--primary, #667eea) 0%, #764ba2 100%)", boxShadow: "0 4px 12px rgba(102,126,234,0.3)", "&:hover": { filter: "brightness(0.92)" } }}>
              Descargar PDF
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TicketDialog;