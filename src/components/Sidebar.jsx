// components/Sidebar.jsx
// eslint-disable-next-line no-unused-vars
import { useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Dashboard,
  People,
  Inventory,
  Store,
  Assignment,
  ShoppingCart,
  BarChart as BarChartIcon,
  AccessTime,
  ChevronLeft,
  PointOfSale
} from "@mui/icons-material";
import { useLocation } from "react-router-dom";

const drawerWidth = 260;

export default function Sidebar({ open, onClose, selectedSection, onSectionChange }) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isKioscoRoute = location.pathname.startsWith("/kiosco");

  // Definir todas las opciones del menú
  const allMenuItems = [
    { text: "Dashboard", icon: <Dashboard />, key: "dashboard" },
    { text: "Empleados", icon: <People />, key: "empleados" },
    { text: "Productos", icon: <Inventory />, key: "productos" },
    { text: "Kioscos", icon: <Store />, key: "kioscos" },
    { text: "Stock", icon: <BarChartIcon />, key: "stock" },
    { text: "Pedidos", icon: <ShoppingCart />, key: "pedidos" },
    { text: "Usuarios Sistema", icon: <Assignment />, key: "usuarios" },
    { text: "Ventas", icon: <PointOfSale />, key: "ventas" }
  ];

  // Filtrar menuItems según la ruta
  const getFilteredMenuItems = () => {
    if (isAdminRoute) {
      return allMenuItems.filter(item => item.key !== "ventas");
    } else if (isKioscoRoute) {
      return allMenuItems.filter(item => 
        item.key !== "empleados" && 
        item.key !== "usuarios" && 
        item.key !== "kioscos"
      );
    }
    return [];
  };

  const menuItems = getFilteredMenuItems();

  // Obtener el email y rol según la ruta
  const getUserInfo = () => {
    if (isAdminRoute) {
      return {
        email: "admin@zoima.com",
        role: "Administrador"
      };
    } else if (isKioscoRoute) {
      return {
        email: "kiosco@zoima.com",
        role: "Kiosco"
      };
    }
    return {
      email: "usuario@zoima.com",
      role: "Usuario"
    };
  };

  const userInfo = getUserInfo();

  // Determinar el gradiente del header según la ruta
  const getHeaderGradient = () => {
    if (isAdminRoute) {
      return "linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.8) 100%)";
    } else if (isKioscoRoute) {
      return "linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.8) 100%)";
    }
    return "var(--header-gradient, linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.8) 100%))";
  };

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true,
      }}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          background: "var(--sidebar-bg, linear-gradient(180deg, rgba(55, 65, 81, 0.95) 0%, rgba(31, 41, 55, 0.92) 100%))",
          backdropFilter: "blur(10px)",
          borderRight: "1px solid rgba(255, 255, 255, 0.1)",
          borderBottom: "none",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          height: "100vh",
          "&::-webkit-scrollbar": {
            width: "4px",
          },
          "&::-webkit-scrollbar-track": {
            background: "rgba(255, 255, 255, 0.05)",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "var(--scrollbar-thumb, rgba(102, 126, 234, 0.5))",
            borderRadius: "2px",
          },
        },
      }}
    >
      {/* Header de la sidebar */}
      <Box sx={{ 
        p: 3, 
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        background: getHeaderGradient(),
      }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ color: "white", fontWeight: 700 }}>
            {isAdminRoute ? "🎯 Admin Panel" : isKioscoRoute ? "🏪 Kiosco Panel" : "🎯 Panel"}
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{ 
              color: "white",
              background: "rgba(255, 255, 255, 0.1)",
              "&:hover": {
                background: "rgba(255, 255, 255, 0.2)",
              }
            }}
          >
            <ChevronLeft />
          </IconButton>
        </Box>
        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.9)", mt: 1.5 }}>
          {userInfo.email}
        </Typography>
        <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
          {userInfo.role}
        </Typography>
      </Box>

      {/* Menu items */}
      <Box sx={{ 
        overflow: "auto", 
        mt: 2, 
        pb: 2,
        height: "calc(100vh - 140px)",
      }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.key} disablePadding sx={{ mb: 0.5, px: 1 }}>
              <ListItemButton
                selected={selectedSection === item.key}
                onClick={() => onSectionChange(item.key)}
                sx={{
                  borderRadius: 2,
                  py: 1.25,
                  transition: "all 0.2s ease",
                  "&.Mui-selected": {
                    background: "var(--primary-gradient, linear-gradient(135deg, var(--primary) 0%, #764ba2 100%))",
                    color: "white",
                    boxShadow: "0 4px 12px var(--shadow-color, rgba(102, 126, 234, 0.4))",
                    "&:hover": {
                      background: "var(--secondary-gradient, linear-gradient(135deg, #764ba2 0%, var(--primary) 100%))",
                    },
                  },
                  "&:hover": {
                    backgroundColor: "var(--hover-bg, rgba(102, 126, 234, 0.15))",
                    transform: "translateX(2px)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: selectedSection === item.key ? "white" : "rgba(255, 255, 255, 0.85)",
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ 
                    fontSize: "0.95rem", 
                    fontWeight: 500,
                    color: selectedSection === item.key ? "white" : "rgba(255, 255, 255, 0.9)"
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {/* Footer */}
        <Box sx={{ 
          mt: 3, 
          px: 3, 
          pt: 2,
          borderTop: "1px solid rgba(255, 255, 255, 0.1)"
        }}>
          <Typography variant="caption" sx={{ 
            color: "rgba(255, 255, 255, 0.5)", 
            fontSize: "0.75rem"
          }}>
            Zoima v2.0 {isKioscoRoute ? "- Módulo Kiosco" : ""}
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
}