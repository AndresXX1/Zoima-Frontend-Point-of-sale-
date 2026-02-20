// components/ProfileModal.jsx
import {
  Dialog, DialogContent, Box, Typography, Avatar, Chip, Divider,
  IconButton, Button, TextField, Tab, Tabs, Alert, CircularProgress,
} from "@mui/material";
import {
  Close, Email, AdminPanelSettings, Store, Edit, Person,
  Lock, PhotoCamera, CheckCircle,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

const API = "http://localhost:3000/api/auth";

// ─── Validaciones (espejo de src/utils/validators.js del back) ───────────────
const isValidNombre = (v) => /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,50}$/.test(v);
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPassword = (v) => typeof v === "string" && v.length >= 6;

// ─── Config de roles ─────────────────────────────────────────────────────────
const roleConfig = {
  ADMIN: {
    label: "Administrador",
    icon: <AdminPanelSettings sx={{ fontSize: 16 }} />,
    color: "#667eea",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    bg: "rgba(102, 126, 234, 0.15)",
  },
  KIOSCO: {
    label: "Kiosco",
    icon: <Store sx={{ fontSize: 16 }} />,
    color: "#11998e",
    gradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    bg: "rgba(17, 153, 142, 0.15)",
  },
};

// ─── EditDatos ────────────────────────────────────────────────────────────────
function EditDatos({ usuario, onSuccess }) {
  const [nombre, setNombre] = useState(usuario.nombre || "");
  const [email, setEmail] = useState(usuario.email || "");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [ok, setOk] = useState(false);

  const validate = () => {
    const e = {};
    if (nombre && !isValidNombre(nombre.trim()))
      e.nombre = "Solo letras y espacios, entre 2 y 50 caracteres";
    if (email && !isValidEmail(email.trim()))
      e.email = "El email no tiene un formato válido";
    if (!nombre && !email)
      e.general = "Completá al menos un campo para guardar";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const body = {};
      if (nombre.trim()) body.nombre = nombre.trim();
      if (email.trim()) body.email = email.trim();
      const res = await fetch(`${API}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOk(true);
      onSuccess({ nombre: data.usuario.nombre, email: data.usuario.email });
      setTimeout(() => setOk(false), 3000);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {serverError && <Alert severity="error" onClose={() => setServerError("")} sx={{ py: 0.5 }}>{serverError}</Alert>}
      {errors.general && <Alert severity="warning" sx={{ py: 0.5 }}>{errors.general}</Alert>}
      {ok && <Alert severity="success" icon={<CheckCircle />} sx={{ py: 0.5 }}>Datos actualizados correctamente</Alert>}
      <StyledTextField
        label="Nombre"
        value={nombre}
        onChange={(e) => { setNombre(e.target.value); setErrors((p) => ({ ...p, nombre: "" })); }}
        disabled={loading}
        error={!!errors.nombre}
        helperText={errors.nombre}
      />
      <StyledTextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }}
        disabled={loading}
        error={!!errors.email}
        helperText={errors.email}
      />
      <Button type="submit" variant="contained" disabled={loading} sx={submitBtnSx}>
        {loading ? <CircularProgress size={20} color="inherit" /> : "Guardar cambios"}
      </Button>
    </Box>
  );
}

// ─── EditPassword ─────────────────────────────────────────────────────────────
function EditPassword() {
  const [actual, setActual] = useState("");
  const [nuevo, setNuevo] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [ok, setOk] = useState(false);

  const validate = () => {
    const e = {};
    if (!actual) e.actual = "Ingresá tu contraseña actual";
    if (!nuevo) e.nuevo = "Ingresá la nueva contraseña";
    else if (!isValidPassword(nuevo)) e.nuevo = "Mínimo 6 caracteres";
    if (!confirmar) e.confirmar = "Confirmá la nueva contraseña";
    else if (nuevo && confirmar !== nuevo) e.confirmar = "Las contraseñas no coinciden";
    if (actual && nuevo && actual === nuevo) e.nuevo = "La nueva contraseña debe ser diferente a la actual";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/profile/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ passwordActual: actual, passwordNuevo: nuevo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOk(true);
      setActual(""); setNuevo(""); setConfirmar("");
      setTimeout(() => setOk(false), 3000);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const field = (key, setter) => ({
    onChange: (e) => { setter(e.target.value); setErrors((p) => ({ ...p, [key]: "" })); },
    error: !!errors[key],
    helperText: errors[key],
  });

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {serverError && <Alert severity="error" onClose={() => setServerError("")} sx={{ py: 0.5 }}>{serverError}</Alert>}
      {ok && <Alert severity="success" icon={<CheckCircle />} sx={{ py: 0.5 }}>Contraseña actualizada correctamente</Alert>}
      <StyledTextField label="Contraseña actual" type="password" value={actual} disabled={loading} {...field("actual", setActual)} />
      <StyledTextField label="Nueva contraseña" type="password" value={nuevo} disabled={loading} {...field("nuevo", setNuevo)} />
      <StyledTextField label="Confirmar nueva contraseña" type="password" value={confirmar} disabled={loading} {...field("confirmar", setConfirmar)} />
      <Button type="submit" variant="contained" disabled={loading} sx={submitBtnSx}>
        {loading ? <CircularProgress size={20} color="inherit" /> : "Cambiar contraseña"}
      </Button>
    </Box>
  );
}

// ─── EditFoto ─────────────────────────────────────────────────────────────────
function EditFoto({ usuario, onSuccess }) {
  const [preview, setPreview] = useState(usuario.foto_url || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const inputRef = useRef();

  const role = roleConfig[usuario.rol] || roleConfig.ADMIN;
  const displayName = usuario.nombre || usuario.kiosco_nombre || usuario.email?.split("@")[0] || "U";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    const tiposPermitidos = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!tiposPermitidos.includes(file.type)) {
      setError("Solo se permiten imágenes JPG, PNG o WebP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("La imagen no puede superar los 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview || preview === usuario.foto_url) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/profile/foto`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ foto: preview }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOk(true);
      onSuccess({ foto_url: data.foto_url });
      setTimeout(() => setOk(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2.5 }}>
      {error && <Alert severity="error" onClose={() => setError("")} sx={{ py: 0.5, width: "100%" }}>{error}</Alert>}
      {ok && <Alert severity="success" icon={<CheckCircle />} sx={{ py: 0.5, width: "100%" }}>Foto actualizada correctamente</Alert>}
      <Box sx={{ position: "relative" }}>
        <Avatar
          src={preview || undefined}
          sx={{
            width: 100, height: 100, fontSize: "2rem", fontWeight: 700,
            background: role.gradient,
            border: `3px solid ${role.color}60`,
            boxShadow: `0 8px 24px rgba(0,0,0,0.3)`,
          }}
        >
          {!preview && initials}
        </Avatar>
        <IconButton
          onClick={() => inputRef.current.click()}
          size="small"
          sx={{
            position: "absolute", bottom: 0, right: 0,
            background: role.gradient, color: "white",
            width: 30, height: 30,
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            "&:hover": { opacity: 0.85 },
          }}
        >
          <PhotoCamera sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
      <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" style={{ display: "none" }} onChange={handleFile} />
      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
        JPG, PNG o WebP · Máximo 2MB
      </Typography>
      <Button onClick={() => inputRef.current.click()} variant="outlined" fullWidth sx={{ borderColor: "rgba(102,126,234,0.3)", color: "rgba(255,255,255,0.7)", "&:hover": { borderColor: "#667eea", background: "rgba(102,126,234,0.1)", color: "white" } }}>
        Seleccionar imagen
      </Button>
      {preview && preview !== usuario.foto_url && (
        <Button onClick={handleUpload} variant="contained" fullWidth disabled={loading} sx={submitBtnSx}>
          {loading ? <CircularProgress size={20} color="inherit" /> : "Guardar foto"}
        </Button>
      )}
    </Box>
  );
}

// ─── ProfileModal principal ───────────────────────────────────────────────────
export default function ProfileModal({ open, onClose }) {
  const { usuario, login } = useAuth();
  const [tab, setTab] = useState(0);
  const [editSection, setEditSection] = useState("datos");

  // ← Cada vez que el modal se abre, vuelve al tab "Ver perfil"
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTab(0);
      setEditSection("datos");
    }
  }, [open]);

  if (!usuario) return null;

  const role = roleConfig[usuario.rol] || roleConfig.ADMIN;
  const displayName = usuario.nombre || usuario.kiosco_nombre || usuario.email?.split("@")[0] || "Usuario";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleSuccess = (cambios) => login({ ...usuario, ...cambios });

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={onClose}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            component: motion.div,
            initial: { opacity: 0, scale: 0.9, y: -20 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.9, y: -20 },
            transition: { type: "spring", stiffness: 300, damping: 25 },
            sx: {
              background: "rgba(15, 23, 42, 0.97)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(102, 126, 234, 0.25)",
              borderRadius: 4,
              boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
              overflow: "visible",
            },
          }}
          slotProps={{ backdrop: { sx: { backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.6)" } } }}
        >
          {/* Header */}
          <Box
            sx={{
              position: "relative", pt: 4, pb: 6, px: 3,
              background: role.gradient,
              borderRadius: "16px 16px 0 0",
              overflow: "hidden",
              "&::before": { content: '""', position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)" },
            }}
          >
            <IconButton onClick={onClose} size="small" sx={{ position: "absolute", top: 12, right: 12, color: "rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.1)", "&:hover": { background: "rgba(255,255,255,0.2)" } }}>
              <Close fontSize="small" />
            </IconButton>
            <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.75)", letterSpacing: 2, fontSize: "0.7rem", display: "block", mb: 0.5 }}>
              Mi Perfil
            </Typography>
            <Typography variant="h6" sx={{ color: "white", fontWeight: 700, lineHeight: 1.2 }}>
              {displayName}
            </Typography>
          </Box>

          {/* Avatar flotante */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: -4, position: "relative", zIndex: 1 }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 250 }}>
              <Avatar
                src={usuario.foto_url || undefined}
                sx={{
                  width: 72, height: 72, fontSize: "1.6rem", fontWeight: 700,
                  background: role.gradient,
                  border: "4px solid rgba(15, 23, 42, 0.97)",
                  boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 0 2px ${role.color}40`,
                }}
              >
                {!usuario.foto_url && initials}
              </Avatar>
            </motion.div>
          </Box>

          <DialogContent sx={{ pt: 1.5, pb: 3, px: 3 }}>
            {/* Chip de rol */}
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <Chip icon={role.icon} label={role.label} size="small" sx={{ background: role.bg, color: role.color, border: `1px solid ${role.color}40`, fontWeight: 600, "& .MuiChip-icon": { color: role.color } }} />
            </Box>

            {/* Tabs */}
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{
                mb: 2.5,
                "& .MuiTabs-indicator": { background: role.gradient },
                "& .MuiTab-root": { color: "rgba(255,255,255,0.4)", minHeight: 36, fontSize: "0.8rem" },
                "& .Mui-selected": { color: "white !important" },
              }}
            >
              <Tab label="Ver perfil" icon={<Person sx={{ fontSize: 16 }} />} iconPosition="start" />
              <Tab label="Editar" icon={<Edit sx={{ fontSize: 16 }} />} iconPosition="start" />
            </Tabs>

            {/* TAB 0: VER */}
            {tab === 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {usuario.nombre && <InfoRow icon={<Person sx={{ fontSize: 18, color: "#667eea" }} />} label="Nombre" value={usuario.nombre} />}
                {usuario.email && <InfoRow icon={<Email sx={{ fontSize: 18, color: "#667eea" }} />} label="Email" value={usuario.email} />}
                {usuario.kiosco_nombre && <InfoRow icon={<Store sx={{ fontSize: 18, color: "#11998e" }} />} label="Kiosco" value={usuario.kiosco_nombre} />}
              </Box>
            )}

            {/* TAB 1: EDITAR */}
            {tab === 1 && (
              <Box>
                <Box sx={{ display: "flex", gap: 1, mb: 2.5 }}>
                  {[
                    { key: "datos", icon: <Person sx={{ fontSize: 15 }} />, label: "Datos" },
                    { key: "password", icon: <Lock sx={{ fontSize: 15 }} />, label: "Contraseña" },
                    { key: "foto", icon: <PhotoCamera sx={{ fontSize: 15 }} />, label: "Foto" },
                  ].map((s) => (
                    <Button
                      key={s.key}
                      onClick={() => setEditSection(s.key)}
                      size="small"
                      startIcon={s.icon}
                      variant={editSection === s.key ? "contained" : "outlined"}
                      sx={{
                        flex: 1, fontSize: "0.72rem", py: 0.8,
                        ...(editSection === s.key
                          ? { background: role.gradient, boxShadow: "none" }
                          : { borderColor: "rgba(102,126,234,0.25)", color: "rgba(255,255,255,0.5)", "&:hover": { borderColor: "#667eea", color: "white", background: "rgba(102,126,234,0.1)" } }),
                      }}
                    >
                      {s.label}
                    </Button>
                  ))}
                </Box>

                <Divider sx={{ borderColor: "rgba(102,126,234,0.1)", mb: 2.5 }} />

                <AnimatePresence mode="wait">
                  <motion.div key={editSection} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
                    {editSection === "datos" && <EditDatos usuario={usuario} onSuccess={handleSuccess} />}
                    {editSection === "password" && <EditPassword />}
                    {editSection === "foto" && <EditFoto usuario={usuario} onSuccess={handleSuccess} />}
                  </motion.div>
                </AnimatePresence>
              </Box>
            )}

            <Button onClick={onClose} fullWidth variant="outlined" sx={{ mt: 3, py: 1.2, borderColor: "rgba(102,126,234,0.2)", color: "rgba(255,255,255,0.5)", borderRadius: 2, "&:hover": { borderColor: "#667eea", background: "rgba(102,126,234,0.1)", color: "white" } }}>
              Cerrar
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: 2, background: "rgba(102,126,234,0.06)", border: "1px solid rgba(102,126,234,0.12)" }}>
      <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", display: "block", lineHeight: 1 }}>{label}</Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 500, mt: 0.3, wordBreak: "break-word" }}>{value}</Typography>
      </Box>
    </Box>
  );
}

function StyledTextField({ label, type = "text", value, onChange, disabled, error, helperText }) {
  return (
    <TextField
      label={label} type={type} fullWidth size="small"
      value={value} onChange={onChange} disabled={disabled}
      error={error} helperText={helperText}
      sx={{
        "& .MuiOutlinedInput-root": {
          color: "white",
          "& fieldset": { borderColor: error ? "#f44336" : "rgba(102,126,234,0.25)" },
          "&:hover fieldset": { borderColor: error ? "#f44336" : "rgba(102,126,234,0.5)" },
          "&.Mui-focused fieldset": { borderColor: error ? "#f44336" : "#667eea" },
        },
        "& .MuiInputLabel-root": { color: error ? "#f44336" : "rgba(255,255,255,0.4)" },
        "& .MuiInputLabel-root.Mui-focused": { color: error ? "#f44336" : "#667eea" },
        "& .MuiFormHelperText-root": { color: "#f44336", fontSize: "0.72rem" },
      }}
    />
  );
}

const submitBtnSx = {
  py: 1.3,
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  fontWeight: 600,
  "&:hover": { background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)" },
  "&:disabled": { opacity: 0.6 },
};