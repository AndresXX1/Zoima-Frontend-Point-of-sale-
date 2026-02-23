// components/Navbar.jsx
import {
  AppBar, Toolbar, Box, IconButton, Menu, MenuItem,
  Typography, Avatar, Divider, Tooltip, Chip, Button,
  Dialog, DialogContent, TextField, Alert, Snackbar,
} from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu as MenuIcon, Logout, Person, AdminPanelSettings, Store, AccessTime } from "@mui/icons-material";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import ProfileModal from "./ProfileModal";

const API_URL = "http://localhost:3000/api";

const roleConfig = {
  ADMIN: {
    label: "Admin",
    icon: <AdminPanelSettings sx={{ fontSize: 14 }} />,
    color: "#667eea",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  KIOSCO: {
    label: "Kiosco",
    icon: <Store sx={{ fontSize: 14 }} />,
    color: "#10b981",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  },
};

const navTheme = {
  admin: {
    bg: "rgba(10, 22, 40, 0.97)",
    borderBottom: "1px solid rgba(102, 126, 234, 0.2)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(102, 126, 234, 0.15)",
    accentBar: "#667eea",
  },
  kiosco: {
    bg: "rgba(2, 44, 34, 0.97)",
    borderBottom: "1px solid rgba(16, 185, 129, 0.25)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(16, 185, 129, 0.2)",
    accentBar: "#10b981",
  },
  public: {
    bg: "rgba(15, 23, 42, 0.97)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
    accentBar: null,
  },
};

// ─── Dialog de Fichaje ────────────────────────────────────────
function FicharDialog({ open, onClose }) {
  const location = useLocation();
  const isKiosco = location.pathname.startsWith("/kiosco");

  // Colores dinámicos según la ruta, igual que App.jsx
  const accent   = isKiosco ? "#10b981" : "#667eea";
  const accent2  = isKiosco ? "#059669" : "#764ba2";
  const gradient = `linear-gradient(135deg, ${accent} 0%, ${accent2} 100%)`;

  const [isHovered, setIsHovered] = useState(false);
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const handleClose = () => {
    setDni("");
    setPassword("");
    onClose();
  };

  const handleFichar = async () => {
    if (!dni.trim()) { showSnackbar("Por favor, ingresá tu DNI", "error"); return; }
    if (!password.trim()) { showSnackbar("Por favor, ingresá tu contraseña", "error"); return; }
    if (!/^\d{7,8}$/.test(dni)) { showSnackbar("El DNI debe tener 7 u 8 dígitos", "error"); return; }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/asistencias/fichar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dni: dni.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al fichar");

      let mensaje = "";
      if (data.action === "INGRESO")      mensaje = `✅ ¡Bienvenido ${data.empleado}! Hora de ingreso registrada`;
      else if (data.action === "EGRESO")  mensaje = `👋 ¡Hasta luego ${data.empleado}! Hora de egreso registrada`;
      else                                mensaje = "⏰ Fichaje registrado exitosamente";

      showSnackbar(mensaje, "success");
      setDni("");
      setPassword("");
      setTimeout(() => handleClose(), 1500);

    } catch (error) {
      let mensajeError = error.message || "Error al registrar el fichaje";
      if (mensajeError.includes("Credenciales"))          mensajeError = "❌ DNI o contraseña incorrectos";
      else if (mensajeError.includes("jornada ya fue cerrada")) mensajeError = "⏰ Ya registraste entrada y salida hoy";
      showSnackbar(mensajeError, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => { if (e.key === "Enter") handleFichar(); };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: "rgba(255,255,255,0.98)",
            backdropFilter: "blur(15px)",
            border: "1px solid rgba(148, 196, 255, 0.2)",
            boxShadow: "0 24px 60px rgba(31, 38, 135, 0.25)",
            overflow: "visible",
          },
        }}
        slotProps={{
          backdrop: {
            sx: { backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.5)" },
          },
        }}
      >
        {/* Snackbar dentro del Dialog para que no quede borroso detrás del backdrop */}
        <Snackbar
          open={openSnackbar}
          autoHideDuration={5000}
          onClose={() => setOpenSnackbar(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          sx={{ position: "absolute", top: "16px !important", left: "50% !important", transform: "translateX(-50%) !important", width: "90%" }}
        >
          <Alert
            onClose={() => setOpenSnackbar(false)}
            severity={snackbarSeverity}
            sx={{ width: "100%", fontSize: "0.95rem", fontWeight: 500, borderRadius: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>

        <DialogContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Typography variant="h3" sx={{ mb: 1 }}>
                {loading ? "⏳" : "👤"}
              </Typography>
            </motion.div>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                background: gradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 0.5,
              }}
            >
              Fichaje de empleados
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ingresá tu DNI y contraseña para registrar tu{" "}
              {new Date().getHours() < 12 ? "entrada" : "salida"}
            </Typography>
          </Box>

          {/* Campos */}
          <TextField
            label="DNI"
            fullWidth
            margin="normal"
            variant="outlined"
            value={dni}
            onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
            onKeyPress={handleKeyPress}
            disabled={loading}
            inputProps={{ maxLength: 8, inputMode: "numeric", pattern: "[0-9]*" }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "&:hover fieldset": { borderColor: accent },
                "&.Mui-focused fieldset": { borderColor: accent },
              },
              "& .MuiInputLabel-root.Mui-focused": { color: accent },
            }}
          />
          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            margin="normal"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            sx={{
              "& .MuiOutlinedInput-root": {
                "&:hover fieldset": { borderColor: accent },
                "&.Mui-focused fieldset": { borderColor: accent },
              },
              "& .MuiInputLabel-root.Mui-focused": { color: accent },
            }}
          />

          {/* Botón */}
          <Button
            component={motion.button}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            variant="contained"
            fullWidth
            disabled={loading}
            onClick={handleFichar}
            sx={{
              mt: 3, py: 1.8,
              fontSize: "1.1rem", fontWeight: 600, borderRadius: 2,
              background: gradient,
              boxShadow: isHovered && !loading
                ? `0 8px 25px ${accent}66`
                : `0 4px 15px ${accent}4d`,
              transition: "all 0.3s ease",
              opacity: loading ? 0.7 : 1,
              "&:hover": { background: !loading && `linear-gradient(135deg, ${accent2} 0%, ${accent} 100%)` },
            }}
          >
            <motion.span animate={{ x: isHovered && !loading ? 5 : 0 }} transition={{ duration: 0.2 }}>
              {loading ? "PROCESANDO..." : "✨ FICHAR AHORA"}
            </motion.span>
          </Button>

          {/* Footer info */}
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">🔒 Tus datos están seguros</Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              {new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

    </>
  );
}

// ─── Navbar principal ─────────────────────────────────────────
export default function Navbar({ onToggleSidebar, onSectionChange }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const [anchorEl, setAnchorEl]       = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [ficharOpen, setFicharOpen]   = useState(false); // ← NUEVO

  const isAdmin  = location.pathname.startsWith("/admin");
  const isKiosco = location.pathname.startsWith("/kiosco");
  const isPublic = location.pathname === "/" || location.pathname === "/login";

  const isActive = (path) => location.pathname === path;

  const showSidebarButton = isAdmin || isKiosco;
  const showUserMenu      = isAdmin || isKiosco;
  const showLogo          = true; // ← CAMBIADO: siempre mostrar logo
  const showFicharButton  = isAdmin || isKiosco; // ← NUEVO

  const theme = isAdmin ? navTheme.admin : isKiosco ? navTheme.kiosco : navTheme.public;

  const handleMenuOpen  = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    try {
      await fetch("http://localhost:3000/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      logout();
      navigate("/login");
    }
  };

  const handleOpenProfile = () => { handleMenuClose(); setProfileOpen(true); };

  const handleLogoClick = (e) => {
    e.preventDefault();
    const targetPath = usuario?.rol === "KIOSCO" ? "/kiosco" : "/admin";
    if (!location.pathname.startsWith(targetPath)) navigate(targetPath);
    if (onSectionChange) onSectionChange("dashboard");
  };

  const role        = usuario ? roleConfig[usuario.rol] : null;
  const displayName = usuario?.nombre || usuario?.kiosco_nombre || usuario?.email?.split("@")[0] || "Usuario";
  const initials    = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <AppBar
        position="static"
        sx={{
          background: theme.bg,
          borderBottom: theme.borderBottom,
          boxShadow: theme.boxShadow,
          backdropFilter: "blur(12px)",
          zIndex: 1100,
          ...(theme.accentBar && {
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: 0, left: 0, right: 0,
              height: "2px",
              background: `linear-gradient(90deg, transparent, ${theme.accentBar}80, ${theme.accentBar}, ${theme.accentBar}80, transparent)`,
            },
          }),
        }}
      >
        <Toolbar sx={{ py: 0.5 }}>

          {/* Botón sidebar */}
          {showSidebarButton && (
            <IconButton
              onClick={onToggleSidebar}
              sx={{
                mr: 2, color: "white",
                background: "rgba(255,255,255,0.08)",
                "&:hover": { background: "rgba(255,255,255,0.15)" },
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            {showLogo && (
              <>
                {/* En rutas públicas (/ y /login) - solo imagen, no botón */}
                {isPublic ? (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box
                      component="img"
                      src="/logo.png"
                      alt="Logo"
                      sx={{ width: 180, height: 65, borderRadius: 2, marginTop: "5px", objectFit: "cover", marginBottom: "-10px" }}
                    />
                  </Box>
                ) : (
                  /* En rutas privadas - sigue siendo botón navegable */
                  <Box
                    component={Link}
                    to={usuario?.rol === "KIOSCO" ? "/kiosco" : "/admin"}
                    onClick={handleLogoClick}
                    sx={{ display: "flex", alignItems: "center", textDecoration: "none", "&:hover": { opacity: 0.8 } }}
                  >
                    <Box
                      component="img"
                      src="/logo.png"
                      alt="Logo"
                      sx={{ width: 180, height: 65, borderRadius: 2, marginTop: "5px", objectFit: "cover", marginBottom: "-10px" }}
                    />
                  </Box>
                )}
              </>
            )}
          </Box>

          {/* Acciones de navegación */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>

            {/* ── Botón Fichar (solo en /admin y /kiosco) ── */}
            {showFicharButton && (
              <Tooltip title="Registrar fichaje de empleado" arrow>
                <Button
                  onClick={() => setFicharOpen(true)}
                  startIcon={<AccessTime sx={{ fontSize: 18 }} />}
                  sx={{
                    color: "rgba(255,255,255,0.85)",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 2,
                    px: 2, py: 0.8,
                    fontSize: "0.85rem", fontWeight: 600,
                    mr: 1,
                    "&:hover": {
                      background: "rgba(255,255,255,0.15)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      color: "#fff",
                    },
                  }}
                >
                  Fichar
                </Button>
              </Tooltip>
            )}

            {/* Botones públicos (/ y /login) */}
            {!showUserMenu && (
              <>
                <Button
                  component={Link} to="/"
                  sx={{
                    color: isActive("/") ? "#fff" : "rgba(255,255,255,0.55)",
                    backgroundColor: isActive("/") ? "rgba(255,255,255,0.1)" : "transparent",
                    px: 2, fontWeight: isActive("/") ? 600 : 400,
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.08)", color: "white" },
                  }}
                >
                  Fichar
                </Button>
                <Button
                  component={Link} to="/login"
                  sx={{
                    color: "#fff",
                    background: isActive("/login") ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    px: 3, ml: 1, fontWeight: 600,
                    "&:hover": { background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" },
                  }}
                >
                  Login
                </Button>
              </>
            )}

            {/* Menú usuario autenticado */}
            {showUserMenu && usuario && (
              <>
                <Box sx={{ display: { xs: "none", sm: "flex" }, flexDirection: "column", alignItems: "flex-end", mr: 1 }}>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 600, lineHeight: 1.2 }}>
                    {displayName}
                  </Typography>
                  {role && (
                    <Chip
                      icon={role.icon}
                      label={role.label}
                      size="small"
                      sx={{
                        height: 18, fontSize: "0.65rem",
                        background: `${role.color}30`, color: role.color,
                        border: `1px solid ${role.color}50`,
                        "& .MuiChip-icon": { color: role.color, fontSize: 12 },
                        "& .MuiChip-label": { px: 0.8 },
                      }}
                    />
                  )}
                </Box>

                <Tooltip title="Mi cuenta" arrow>
                  <IconButton onClick={handleMenuOpen} sx={{ p: 0.5 }}>
                    <Avatar
                      src={usuario.foto_url || undefined}
                      sx={{
                        width: 38, height: 38, fontSize: "0.9rem", fontWeight: 700,
                        background: role?.gradient || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        border: `2px solid ${role?.color || "#667eea"}50`,
                        boxShadow: `0 2px 12px ${role?.color || "#667eea"}40`,
                        transition: "all 0.2s ease",
                        "&:hover": { transform: "scale(1.06)", boxShadow: `0 4px 18px ${role?.color || "#667eea"}60` },
                      }}
                    >
                      {!usuario.foto_url && initials}
                    </Avatar>
                  </IconButton>
                </Tooltip>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                  sx={{
                    mt: 1,
                    "& .MuiPaper-root": {
                      background: "rgba(10, 18, 35, 0.98)",
                      backdropFilter: "blur(20px)",
                      border: `1px solid ${role?.color || "#667eea"}30`,
                      borderRadius: 3, color: "white", minWidth: 220,
                      boxShadow: `0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px ${role?.color || "#667eea"}15`,
                      overflow: "hidden",
                    },
                  }}
                >
                  <Box
                    sx={{
                      px: 2, py: 1.5,
                      display: "flex", alignItems: "center", gap: 1.5,
                      background: `linear-gradient(135deg, ${role?.color || "#667eea"}20 0%, ${role?.color || "#667eea"}05 100%)`,
                      borderBottom: `1px solid ${role?.color || "#667eea"}20`,
                    }}
                  >
                    <Avatar
                      src={usuario.foto_url || undefined}
                      sx={{
                        width: 34, height: 34, fontSize: "0.8rem", fontWeight: 700,
                        background: role?.gradient || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        border: `1px solid ${role?.color || "#667eea"}40`, flexShrink: 0,
                      }}
                    >
                      {!usuario.foto_url && initials}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ color: "white", fontWeight: 600, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {displayName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                        {usuario.email || ""}
                      </Typography>
                    </Box>
                  </Box>

                  <MenuItem
                    onClick={handleOpenProfile}
                    sx={{ py: 1.2, px: 2, gap: 1.5, color: "rgba(255,255,255,0.8)", "&:hover": { background: `${role?.color || "#667eea"}20`, color: "white" } }}
                  >
                    <Person sx={{ fontSize: 20, color: role?.color || "#667eea" }} />
                    Mi Perfil
                  </MenuItem>

                  <Divider sx={{ borderColor: `${role?.color || "#667eea"}20`, my: 0.5 }} />

                  <MenuItem
                    onClick={handleLogout}
                    sx={{ py: 1.2, px: 2, gap: 1.5, color: "rgba(255,100,100,0.8)", "&:hover": { background: "rgba(255,80,80,0.1)", color: "#ff6b6b" } }}
                  >
                    <Logout sx={{ fontSize: 20 }} />
                    Cerrar Sesión
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      <FicharDialog open={ficharOpen} onClose={() => setFicharOpen(false)} />
    </>
  );
}