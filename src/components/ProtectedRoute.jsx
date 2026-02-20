// components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { CircularProgress, Box } from "@mui/material";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(usuario.rol)) {
    // Redirige a su propia ruta según su rol
    if (usuario.rol === "ADMIN") return <Navigate to="/admin" replace />;
    if (usuario.rol === "KIOSCO") return <Navigate to="/kiosco" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;