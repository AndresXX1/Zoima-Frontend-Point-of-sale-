import { Box, Button, TextField, Typography, Paper, Link, Divider, Alert } from "@mui/material";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext"; // Ajusta la ruta
// eslint-disable-next-line no-unused-vars
import { useEffect } from "react";
export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

   const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Importante para las cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al iniciar sesión");
      }

      // Guardar datos del usuario en localStorage (opcional, para persistencia)
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      
      // Actualizar el contexto de autenticación con los datos del usuario
      login(data.usuario); // ← AHORA FUNCIONA CORRECTAMENTE

      console.log("Login exitoso:", data);

      // Redirigir según el rol
      if (data.usuario.rol === "ADMIN") {
        navigate("/admin");
      } else if (data.usuario.rol === "KIOSCO") {
        navigate("/kiosco");
      } else {
        navigate("/"); // Página principal (Fichar)
      }

    } catch (error) {
      console.error("Error en login:", error);
      setErrorMessage(error.message || "Credenciales inválidas");
    } finally {
      setIsLoading(false);
    }
  };



  const handleForgotPassword = (e) => {
    e.preventDefault();
    console.log("Password reset for:", resetEmail);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setShowForgotPassword(false);
      setResetEmail("");
    }, 3000);
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        pt: 8,
        px: 2,
        pb: 4
      }}
    >
      <Paper
        elevation={10}
        sx={{ 
          p: 3.5, 
          width: { xs: "90%", sm: 400 },
          borderRadius: 4,
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(148, 196, 255, 0.2)",
          boxShadow: "0 8px 32px rgba(31, 38, 135, 0.15)"
        }}
      >
        {!showForgotPassword ? (
          <>
            <Box sx={{ textAlign: "center", mb: 2.5 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <Typography variant="h2" sx={{ mb: 1 }}>
                  🔐
                </Typography>
              </motion.div>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700,
                  background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  mb: 0.3
                }}
              >
                Bienvenido de vuelta
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ingresá a tu cuenta de administrador
              </Typography>
            </Box>

            {errorMessage && (
              <Alert 
                severity="error" 
                sx={{ mb: 2, py: 0.5 }}
                onClose={() => setErrorMessage("")}
              >
                {errorMessage}
              </Alert>
            )}

            <Box component="form" onSubmit={handleLogin}>
              <TextField 
                label="Email o DNI" 
                fullWidth 
                size="small"
                margin="dense"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                variant="outlined"
                required
                disabled={isLoading}
                autoComplete="username"
                sx={{
                  mb: 1,
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": {
                      borderColor: "var(--primary)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "var(--primary)",
                    }
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "var(--primary)"
                  }
                }}
              />
              <TextField
                label="Contraseña"
                type="password"
                fullWidth
                size="small"
                margin="dense"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="outlined"
                required
                disabled={isLoading}
                autoComplete="current-password"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": {
                      borderColor: "var(--primary)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "var(--primary)",
                    }
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "var(--primary)"
                  }
                }}
              />

              <Box sx={{ textAlign: "right", mt: 0.5, mb: 1.5 }}>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => setShowForgotPassword(true)}
                  disabled={isLoading}
                  sx={{
                    color: "var(--primary)",
                    textDecoration: "none",
                    fontSize: "0.8rem",
                    "&:hover": {
                      textDecoration: "underline"
                    }
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </Box>

              <Button 
                component={motion.button}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                type="submit"
                variant="contained" 
                fullWidth
                disabled={isLoading}
                sx={{ 
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: 600,
                  borderRadius: 2,
                  background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
                  boxShadow: isHovered 
                    ? "0 8px 25px rgba(102, 126, 234, 0.4)" 
                    : "0 4px 15px rgba(102, 126, 234, 0.3)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    background: "linear-gradient(135deg, #764ba2 0%, var(--primary) 100%)",
                  },
                  "&:disabled": {
                    opacity: 0.7,
                  }
                }}
              >
                <motion.span
                  animate={{ x: isHovered ? 5 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isLoading ? "⏳ INICIANDO..." : "🚀 INICIAR SESIÓN"}
                </motion.span>
              </Button>
            </Box>

            <Divider sx={{ my: 2 }}>
              <Typography variant="caption" color="text.secondary">
                o
              </Typography>
            </Divider>

            <Button
              onClick={() => navigate("/")}
              variant="outlined"
              fullWidth
              size="small"
              disabled={isLoading}
              sx={{
                py: 1.2,
                borderColor: "var(--primary)",
                color: "var(--primary)",
                fontSize: "0.9rem",
                "&:hover": {
                  borderColor: "#764ba2",
                  backgroundColor: "rgba(102, 126, 234, 0.05)"
                }
              }}
            >
              👤 Ir a Fichaje
            </Button>

            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                🔒 Acceso solo para personal autorizado
              </Typography>
            </Box>
          </>
        ) : (
          // FORMULARIO DE RECUPERACIÓN DE CONTRASEÑA
          <>
            <Box sx={{ textAlign: "center", mb: 2.5 }}>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Typography variant="h2" sx={{ mb: 1 }}>
                  🔑
                </Typography>
              </motion.div>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700,
                  background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  mb: 0.3
                }}
              >
                Recuperar contraseña
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Te enviaremos un link para restablecerla
              </Typography>
            </Box>

            {showSuccess && (
              <Alert 
                severity="success" 
                sx={{ mb: 2, py: 0.5 }}
                onClose={() => setShowSuccess(false)}
              >
                ✅ Email enviado! Revisá tu casilla.
              </Alert>
            )}

            <Box component="form" onSubmit={handleForgotPassword}>
              <TextField 
                label="Email corporativo" 
                type="email"
                fullWidth 
                size="small"
                margin="dense"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                variant="outlined"
                required
                placeholder="tu.email@zoima.com"
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": {
                      borderColor: "var(--primary)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "var(--primary)",
                    }
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "var(--primary)"
                  }
                }}
              />

              <Button 
                type="submit"
                variant="contained" 
                fullWidth 
                sx={{ 
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: 600,
                  borderRadius: 2,
                  background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #764ba2 0%, var(--primary) 100%)",
                  }
                }}
              >
                📧 Enviar link
              </Button>

              <Button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail("");
                }}
                fullWidth
                size="small"
                sx={{
                  mt: 1.5,
                  color: "var(--primary)",
                  fontSize: "0.9rem",
                  "&:hover": {
                    backgroundColor: "rgba(102, 126, 234, 0.05)"
                  }
                }}
              >
                ← Volver al login
              </Button>
            </Box>

            <Box sx={{ mt: 2, p: 1.5, backgroundColor: "rgba(102, 126, 234, 0.08)", borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                💡 Si no recibís el email, revisá spam o contactá a RRHH
              </Typography>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
