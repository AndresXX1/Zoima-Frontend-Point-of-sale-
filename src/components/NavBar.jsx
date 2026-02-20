// components/Navbar.jsx
import {
  AppBar, Toolbar, Box, IconButton, Menu, MenuItem,
  Typography, Avatar, Divider, Tooltip, Chip, Button,
} from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu as MenuIcon, Logout, Person, AdminPanelSettings, Store } from "@mui/icons-material";
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import ProfileModal from "./ProfileModal";

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

// Configuración visual del AppBar por tipo de ruta
const navTheme = {
  admin: {
    bg: "rgba(10, 22, 40, 0.97)",
    borderBottom: "1px solid rgba(102, 126, 234, 0.2)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(102, 126, 234, 0.15)",
    accentBar: "#667eea",          // línea de color en la parte inferior
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
    accentBar: null,               // sin línea de acento en rutas públicas
  },
};

export default function Navbar({ onToggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const [anchorEl, setAnchorEl] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const isAdmin  = location.pathname.startsWith("/admin");
  const isKiosco = location.pathname.startsWith("/kiosco");
  const isActive = (path) => location.pathname === path;

  const showSidebarButton = isAdmin || isKiosco;
  const showUserMenu      = isAdmin || isKiosco;

  // Tema activo del nav
  const theme = isAdmin ? navTheme.admin : isKiosco ? navTheme.kiosco : navTheme.public;

  const handleMenuOpen  = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    try {
      await fetch("http://localhost:3000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      logout();
      navigate("/login");
    }
  };

  const handleOpenProfile = () => {
    handleMenuClose();
    setProfileOpen(true);
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
          // Línea de acento inferior (solo en admin/kiosco)
          ...(theme.accentBar && {
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
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
                mr: 2,
                color: "white",
                background: "var(--button-bg, rgba(255,255,255,0.08))",
                "&:hover": { background: "var(--button-bg-hover, rgba(255,255,255,0.15))" },
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <Box
              component={Link}
              to="/"
              sx={{ display: "flex", alignItems: "center", textDecoration: "none", "&:hover": { opacity: 0.8 } }}
            >
              <Box
                component="img"
                src="/logo.png"
                alt="Logo"
                sx={{ width: 180, height: 65, borderRadius: 2, marginTop: "5px", objectFit: "cover", marginBottom: "-10px" }}
              />
            </Box>
          </Box>

          {/* Navegación */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>

            {/* Botones públicos (/ y /login) */}
            {!showUserMenu && (
              <>
                <Button
                  component={Link}
                  to="/"
                  sx={{
                    color: isActive("/") ? "#fff" : "rgba(255,255,255,0.55)",
                    backgroundColor: isActive("/") ? "rgba(255,255,255,0.1)" : "transparent",
                    px: 2,
                    fontWeight: isActive("/") ? 600 : 400,
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.08)", color: "white" },
                  }}
                >
                  Fichar
                </Button>
                <Button
                  component={Link}
                  to="/login"
                  sx={{
                    color: "#fff",
                    background: isActive("/login")
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    px: 3,
                    ml: 1,
                    fontWeight: 600,
                    "&:hover": {
                      background: "rgba(255,255,255,0.15)",
                      border: "1px solid rgba(255,255,255,0.25)",
                    },
                  }}
                >
                  Login
                </Button>
              </>
            )}

            {/* Menú de usuario autenticado */}
            {showUserMenu && usuario && (
              <>
                {/* Nombre + chip de rol (desktop) */}
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
                        background: `${role.color}30`,
                        color: role.color,
                        border: `1px solid ${role.color}50`,
                        "& .MuiChip-icon": { color: role.color, fontSize: 12 },
                        "& .MuiChip-label": { px: 0.8 },
                      }}
                    />
                  )}
                </Box>

                {/* Avatar */}
                <Tooltip title="Mi cuenta" arrow>
                  <IconButton onClick={handleMenuOpen} sx={{ p: 0.5 }}>
                    <Avatar
                      src={usuario.foto_url || undefined}
                      sx={{
                        width: 38, height: 38,
                        fontSize: "0.9rem", fontWeight: 700,
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

                {/* Dropdown */}
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
                      borderRadius: 3,
                      color: "white",
                      minWidth: 220,
                      boxShadow: `0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px ${role?.color || "#667eea"}15`,
                      overflow: "hidden",
                    },
                  }}
                >
                  {/* Header del dropdown */}
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
                        border: `1px solid ${role?.color || "#667eea"}40`,
                        flexShrink: 0,
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
    </>
  );
}