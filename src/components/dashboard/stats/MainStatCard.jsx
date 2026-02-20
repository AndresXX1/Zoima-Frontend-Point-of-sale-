/* eslint-disable no-unused-vars */
// components/dashboard/stats/MainStatCard.jsx
import { Box, Card, CardContent, Typography, Chip } from "@mui/material";
import { motion } from "framer-motion";

const itemAnimation = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export const MainStatCard = ({ 
  icon, 
  value, 
  label, 
  trend, 
  color, 
  gradient,
  loading = false 
}) => {
  if (loading) {
    return (
      <motion.div variants={itemAnimation} style={{ height: "100%" }}>
        <Card sx={{ height: "100%", borderRadius: "20px", background: "#f7fafc" }}>
          <CardContent sx={{ p: 3.5 }}>
            <Box sx={{ width: 64, height: 64, borderRadius: "16px", background: "#e2e8f0" }} />
            <Box sx={{ mt: 3 }}>
              <Box sx={{ width: 80, height: 44, background: "#e2e8f0", mb: 0.5 }} />
              <Box sx={{ width: 120, height: 24, background: "#e2e8f0" }} />
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={itemAnimation} 
      style={{ height: "100%" }}
      whileHover={{ scale: 1.03, zIndex: 10 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          background: gradient,
          backdropFilter: "blur(30px)",
          color: "white",
          boxShadow: `0 12px 40px ${color}40, 0 4px 16px ${color}20`,
          border: `1px solid ${color}30`,
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          borderRadius: "20px",
          "&:hover": {
            boxShadow: `0 20px 60px ${color}50, 0 8px 24px ${color}30`,
            transform: "translateY(-8px)",
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: -100,
            right: -100,
            width: "300px",
            height: "300px",
            background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
            borderRadius: "50%",
            animation: "pulse 4s ease-in-out infinite",
          },
          "@keyframes pulse": {
            "0%, 100%": { transform: "scale(1)", opacity: 0.5 },
            "50%": { transform: "scale(1.1)", opacity: 0.7 },
          }
        }}
      >
        <CardContent sx={{ 
          position: "relative", 
          zIndex: 1, 
          p: 3.5, 
          height: "100%", 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "space-between" 
        }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(10px)",
                fontSize: "2rem",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              }}
            >
              {icon}
            </Box>
            {trend && (
              <Chip
                label={trend}
                size="small"
                sx={{
                  background: "rgba(255, 255, 255, 0.25)",
                  backdropFilter: "blur(10px)",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  height: 28,
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  "& .MuiChip-label": {
                    px: 1.5
                  }
                }}
              />
            )}
          </Box>
          <Box sx={{ mt: 3 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 800, 
                fontSize: "2.75rem", 
                mb: 0.5, 
                lineHeight: 1,
                textShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                fontFamily: "'Outfit', sans-serif"
              }}
            >
              {value}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                opacity: 0.95, 
                fontSize: "1rem", 
                fontWeight: 500,
                letterSpacing: "0.3px",
                fontFamily: "'Inter', sans-serif"
              }}
            >
              {label}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};