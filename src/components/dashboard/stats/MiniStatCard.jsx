// components/dashboard/stats/MiniStatCard.jsx
import { Box, Paper, Typography, LinearProgress } from "@mui/material";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

const itemAnimation = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export const MiniStatCard = ({ icon, value, label, progress, progressColor, loading = false }) => {
  if (loading) {
    return (
      <motion.div variants={itemAnimation} style={{ height: "100%" }}>
        <Paper sx={{ p: 3, height: "100%", background: "#f7fafc" }}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: "12px", background: "#e2e8f0" }} />
            <Box sx={{ flex: 1 }}>
              <Box sx={{ width: 80, height: 20, background: "#e2e8f0", mb: 1 }} />
              <Box sx={{ width: 60, height: 32, background: "#e2e8f0" }} />
            </Box>
          </Box>
        </Paper>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={itemAnimation} 
      style={{ height: "100%" }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Paper
        sx={{
          p: 3,
          borderRadius: "16px",
          background: "rgba(255, 255, 255, 0.98)",
          border: "1px solid rgba(102, 126, 234, 0.08)",
          boxShadow: "0 4px 24px rgba(102, 126, 234, 0.06)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            boxShadow: "0 8px 32px rgba(102, 126, 234, 0.12)",
            borderColor: `${progressColor}30`,
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${progressColor}15, ${progressColor}08)`,
              fontSize: "1.5rem",
              flexShrink: 0,
              boxShadow: `0 4px 12px ${progressColor}15`,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: "#718096", 
                fontSize: "0.85rem", 
                fontWeight: 600,
                mb: 0.5,
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              {label}
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 800, 
                color: "#1a202c", 
                lineHeight: 1,
                fontFamily: "'Outfit', sans-serif"
              }}
            >
              {value}
            </Typography>
          </Box>
        </Box>
        {progress !== undefined && (
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: "#718096", fontWeight: 600 }}>
                Progreso
              </Typography>
              <Typography variant="caption" sx={{ color: progressColor, fontWeight: 700 }}>
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: `${progressColor}12`,
                "& .MuiLinearProgress-bar": {
                  borderRadius: 4,
                  background: `linear-gradient(90deg, ${progressColor}dd, ${progressColor})`,
                  boxShadow: `0 0 8px ${progressColor}60`,
                },
              }}
            />
          </Box>
        )}
      </Paper>
    </motion.div>
  );
};