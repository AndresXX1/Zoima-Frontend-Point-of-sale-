// pages/Fichar.jsx
import { Box, Button, TextField, Typography, Paper, Alert, Snackbar } from "@mui/material";
import { motion } from "framer-motion";
import { useState } from "react";

const API_URL = "http://localhost:3000/api";

export default function Fichar() {
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

  const handleFichar = async () => {
    // Validar campos
    if (!dni.trim()) {
      showSnackbar("Por favor, ingresá tu DNI", "error");
      return;
    }

    if (!password.trim()) {
      showSnackbar("Por favor, ingresá tu contraseña", "error");
      return;
    }

    if (!/^\d{7,8}$/.test(dni)) {
      showSnackbar("El DNI debe tener 7 u 8 dígitos", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/asistencias/fichar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dni: dni.trim(),
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al fichar');
      }

      // Mostrar mensaje de éxito
      let mensaje = "";
      if (data.action === 'INGRESO') {
        mensaje = `✅ ¡Bienvenido ${data.empleado}! Hora de ingreso registrada`;
      } else if (data.action === 'EGRESO') {
        mensaje = `👋 ¡Hasta luego ${data.empleado}! Hora de egreso registrada`;
      } else {
        mensaje = "⏰ Fichaje registrado exitosamente";
      }

      showSnackbar(mensaje, "success");
      
      // Limpiar campos después de fichar exitosamente
      setDni("");
      setPassword("");
      
    } catch (error) {
      console.error("Error al fichar:", error);
      
      let mensajeError = error.message || "Error al registrar el fichaje";
      
      // Mensajes más amigables según el error
      if (mensajeError.includes('Credenciales')) {
        mensajeError = "❌ DNI o contraseña incorrectos";
      } else if (mensajeError.includes('jornada ya fue cerrada')) {
        mensajeError = "⏰ Ya registraste entrada y salida hoy";
      }
      
      showSnackbar(mensajeError, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleFichar();
    }
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
        pb: 4,
        background: "linear-gradient(135deg, var(--primary)15 0%, #764ba215 100%)",
      }}
    >
      <Paper
        elevation={10}
        sx={{ 
          p: 4, 
          width: { xs: "90%", sm: 400 },
          borderRadius: 4,
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(148, 196, 255, 0.2)",
          boxShadow: "0 8px 32px rgba(31, 38, 135, 0.15)"
        }}
      >
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Typography variant="h3" sx={{ mb: 1 }}>
              {loading ? '⏳' : '👤'}
            </Typography>
          </motion.div>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 600,
              background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 0.5
            }}
          >
            Fichaje de empleados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ingresá tu DNI y contraseña para registrar tu {new Date().getHours() < 12 ? 'entrada' : 'salida'}
          </Typography>
        </Box>

        <TextField 
          label="DNI" 
          fullWidth 
          margin="normal" 
          variant="outlined"
          value={dni}
          onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
          onKeyPress={handleKeyPress}
          disabled={loading}
          inputProps={{ 
            maxLength: 8,
            inputMode: 'numeric',
            pattern: '[0-9]*'
          }}
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
            mt: 3,
            py: 1.8,
            fontSize: "1.1rem",
            fontWeight: 600,
            borderRadius: 2,
            background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
            boxShadow: isHovered && !loading
              ? "0 8px 25px rgba(102, 126, 234, 0.4)" 
              : "0 4px 15px rgba(102, 126, 234, 0.3)",
            transition: "all 0.3s ease",
            opacity: loading ? 0.7 : 1,
            "&:hover": {
              background: !loading && "linear-gradient(135deg, #764ba2 0%, var(--primary) 100%)",
            }
          }}
        >
          <motion.span
            animate={{ x: isHovered && !loading ? 5 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? 'PROCESANDO...' : '✨ FICHAR AHORA'}
          </motion.span>
        </Button>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">
            🔒 Tus datos están seguros
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Typography>
        </Box>
      </Paper>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={5000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert 
          onClose={() => setOpenSnackbar(false)} 
          severity={snackbarSeverity}
          sx={{ 
            width: "100%",
            fontSize: "1rem",
            fontWeight: 500,
            borderRadius: 2,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}