import { Box, Typography, Link, Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton } from "@mui/material";
import { motion } from "framer-motion";
import { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";

export default function Footer() {
  const [openTerminos, setOpenTerminos] = useState(false);
  const [openPrivacidad, setOpenPrivacidad] = useState(false);
  const [openSoporte, setOpenSoporte] = useState(false);

  return (
    <>
      <Box
        component={motion.footer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        sx={{
          width: "100%",
          py: 3,
          px: 2,
          mt: "auto",
          borderTop: "1px solid rgba(148, 196, 255, 0.2)",
          backgroundColor: "rgba(10, 22, 40, 0.5)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: "auto", textAlign: "center" }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: "#b8d4ff",
              mb: 1,
              fontSize: "0.9rem"
            }}
          >
            Sistema de Fichaje de Empleados 2026 ⚡
          </Typography>
          
          <Typography 
            variant="caption" 
            sx={{ 
              color: "rgba(184, 212, 255, 0.7)",
              display: "block",
              mb: 1.5
            }}
          >
            Hecho con 💜 por tu equipo de desarrollo
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
            <Link 
              component="button"
              onClick={() => setOpenTerminos(true)}
              underline="hover"
              sx={{ 
                color: "#94c4ff",
                fontSize: "0.85rem",
                cursor: "pointer",
                background: "none",
                border: "none",
                "&:hover": { color: "#fff" }
              }}
            >
              📋 Términos
            </Link>
            <Typography sx={{ color: "rgba(184, 212, 255, 0.5)" }}>•</Typography>
            <Link 
              component="button"
              onClick={() => setOpenPrivacidad(true)}
              underline="hover"
              sx={{ 
                color: "#94c4ff",
                fontSize: "0.85rem",
                cursor: "pointer",
                background: "none",
                border: "none",
                "&:hover": { color: "#fff" }
              }}
            >
              🔒 Privacidad
            </Link>
            <Typography sx={{ color: "rgba(184, 212, 255, 0.5)" }}>•</Typography>
            <Link 
              component="button"
              onClick={() => setOpenSoporte(true)}
              underline="hover"
              sx={{ 
                color: "#94c4ff",
                fontSize: "0.85rem",
                cursor: "pointer",
                background: "none",
                border: "none",
                "&:hover": { color: "#fff" }
              }}
            >
              📞 Soporte
            </Link>
          </Box>
        </Box>
      </Box>

      {/* Dialog de Términos */}
      <Dialog 
        open={openTerminos} 
        onClose={() => setOpenTerminos(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(245, 247, 250, 0.98) 100%)",
          }
        }}
      >
        <DialogTitle sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
          color: "white",
          pb: 2
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <span>📋</span>
            <Typography variant="h6">Términos y Condiciones</Typography>
          </Box>
          <IconButton 
            onClick={() => setOpenTerminos(false)}
            sx={{ color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1" paragraph>
            <strong>1. Uso del Sistema</strong>
          </Typography>
          <Typography variant="body2" paragraph color="text.secondary">
            Este sistema está diseñado exclusivamente para el registro de entrada y salida de empleados. El uso indebido del mismo puede resultar en sanciones disciplinarias.
          </Typography>

          <Typography variant="body1" paragraph sx={{ mt: 2 }}>
            <strong>2. Responsabilidad del Usuario</strong>
          </Typography>
          <Typography variant="body2" paragraph color="text.secondary">
            Cada empleado es responsable de mantener la confidencialidad de sus credenciales de acceso (DNI y contraseña). No está permitido compartir estas credenciales con terceros.
          </Typography>

          <Typography variant="body1" paragraph sx={{ mt: 2 }}>
            <strong>3. Registros de Fichaje</strong>
          </Typography>
          <Typography variant="body2" paragraph color="text.secondary">
            Todos los fichajes quedan registrados en el sistema con fecha, hora y ubicación. Estos datos pueden ser utilizados para cálculos de nómina y auditorías internas.
          </Typography>

          <Typography variant="body1" paragraph sx={{ mt: 2 }}>
            <strong>4. Modificaciones</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            La empresa se reserva el derecho de modificar estos términos en cualquier momento. Los usuarios serán notificados de cambios significativos.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setOpenTerminos(false)}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #764ba2 0%, var(--primary) 100%)",
              }
            }}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Privacidad */}
      <Dialog 
        open={openPrivacidad} 
        onClose={() => setOpenPrivacidad(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(245, 247, 250, 0.98) 100%)",
          }
        }}
      >
        <DialogTitle sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
          color: "white",
          pb: 2
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <span>🔒</span>
            <Typography variant="h6">Política de Privacidad</Typography>
          </Box>
          <IconButton 
            onClick={() => setOpenPrivacidad(false)}
            sx={{ color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1" paragraph>
            <strong>1. Recopilación de Datos</strong>
          </Typography>
          <Typography variant="body2" paragraph color="text.secondary">
            Recopilamos únicamente los datos necesarios para el funcionamiento del sistema de fichaje: DNI, contraseña (encriptada), horarios de entrada/salida y datos de perfil del empleado.
          </Typography>

          <Typography variant="body1" paragraph sx={{ mt: 2 }}>
            <strong>2. Uso de la Información</strong>
          </Typography>
          <Typography variant="body2" paragraph color="text.secondary">
            Tus datos se utilizan exclusivamente para: registro de asistencia, cálculo de horas trabajadas, generación de reportes para nómina y cumplimiento de obligaciones legales laborales.
          </Typography>

          <Typography variant="body1" paragraph sx={{ mt: 2 }}>
            <strong>3. Protección de Datos</strong>
          </Typography>
          <Typography variant="body2" paragraph color="text.secondary">
            Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos personales contra acceso no autorizado, alteración, divulgación o destrucción.
          </Typography>

          <Typography variant="body1" paragraph sx={{ mt: 2 }}>
            <strong>4. Tus Derechos</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tenés derecho a acceder, rectificar, cancelar u oponerte al tratamiento de tus datos personales. Para ejercer estos derechos, contactá al departamento de Recursos Humanos.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setOpenPrivacidad(false)}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #764ba2 0%, var(--primary) 100%)",
              }
            }}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Soporte */}
      <Dialog 
        open={openSoporte} 
        onClose={() => setOpenSoporte(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(245, 247, 250, 0.98) 100%)",
          }
        }}
      >
        <DialogTitle sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
          color: "white",
          pb: 2
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <span>📞</span>
            <Typography variant="h6">Soporte Técnico</Typography>
          </Box>
          <IconButton 
            onClick={() => setOpenSoporte(false)}
            sx={{ color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1" paragraph>
            <strong>¿Necesitás ayuda?</strong>
          </Typography>
          <Typography variant="body2" paragraph color="text.secondary">
            Nuestro equipo de soporte está disponible para asistirte con cualquier problema o consulta relacionada con el sistema de fichaje.
          </Typography>

          <Box sx={{ mt: 3, p: 2, bgcolor: "rgba(102, 126, 234, 0.08)", borderRadius: 2 }}>
            <Typography variant="body2" paragraph sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <span>📧</span> <strong>Email:</strong> soporte@fichaje.com
            </Typography>
            <Typography variant="body2" paragraph sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <span>📱</span> <strong>WhatsApp:</strong> +54 9 11 1234-5678
            </Typography>
            <Typography variant="body2" paragraph sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <span>☎️</span> <strong>Teléfono:</strong> (011) 4567-8900
            </Typography>
            <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <span>🕐</span> <strong>Horario:</strong> Lunes a Viernes, 9:00 - 18:00 hs
            </Typography>
          </Box>

          <Typography variant="body1" paragraph sx={{ mt: 3 }}>
            <strong>Problemas Comunes:</strong>
          </Typography>
          <Typography variant="body2" component="div" color="text.secondary">
            • <strong>No puedo fichar:</strong> Verificá tu DNI y contraseña<br/>
            • <strong>Olvidé mi contraseña:</strong> Contactá a Recursos Humanos<br/>
            • <strong>Error en el registro:</strong> Envianos un screenshot del error<br/>
            • <strong>Consultas generales:</strong> Escribinos por email
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setOpenSoporte(false)}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #764ba2 0%, var(--primary) 100%)",
              }
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}