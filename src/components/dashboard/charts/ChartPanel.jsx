// components/dashboard/charts/ChartPanel.jsx
import { Box, Paper, Typography } from "@mui/material";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

const itemAnimation = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export const ChartPanel = ({ children, title, subtitle, action, sx = {} }) => (
  <motion.div variants={itemAnimation} style={{ height: "100%" }}>
    <Paper
      sx={{
        p: 4,
        borderRadius: "20px",
        boxShadow: "0 8px 32px rgba(102, 126, 234, 0.08)",
        backdropFilter: "blur(10px)",
        background: "rgba(255, 255, 255, 0.98)",
        border: "1px solid rgba(102, 126, 234, 0.08)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: "0 12px 40px rgba(102, 126, 234, 0.12)",
        },
        ...sx,
      }}
    >
      {(title || subtitle || action) && (
        <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            {title && (
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 800, 
                  color: "#1a202c", 
                  mb: 0.5,
                  fontSize: "1.25rem",
                  fontFamily: "'Outfit', sans-serif"
                }}
              >
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" sx={{ color: "#718096", fontWeight: 500 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {action}
        </Box>
      )}
      {children}
    </Paper>
  </motion.div>
);