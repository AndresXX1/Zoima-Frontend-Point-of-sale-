/* eslint-disable no-unused-vars */
// components/dashboard/activity/ActivityItem.jsx
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import PropTypes from 'prop-types';

export const ActivityItem = ({ icon, text, time, color, index, referencia }) => {
  // Colores por defecto si no se proporciona uno
  const itemColor = color || "var(--primary)";
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      whileHover={{ x: 4 }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          p: 2,
          borderRadius: "12px",
          backgroundColor: `${itemColor}06`,
          borderLeft: `3px solid ${itemColor}`,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            backgroundColor: `${itemColor}10`,
            boxShadow: `0 4px 16px ${itemColor}20`,
          },
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(135deg, ${itemColor}20, ${itemColor}10)`,
            fontSize: "1.3rem",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 700, 
              color: "#1a202c",
              mb: 0.25,
              fontFamily: "'Inter', sans-serif",
              lineHeight: 1.2
            }}
          >
            {text}
          </Typography>
          {referencia && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: "#a0aec0",
                fontWeight: 500,
                fontSize: "0.7rem",
                display: "block",
                mb: 0.25
              }}
            >
              {referencia}
            </Typography>
          )}
          <Typography 
            variant="caption" 
            sx={{ 
              color: "#718096",
              fontWeight: 600,
              fontSize: "0.75rem",
              display: "block"
            }}
          >
            {time}
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
};

// PropTypes para validación
ActivityItem.propTypes = {
  icon: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  time: PropTypes.string.isRequired,
  color: PropTypes.string,
  index: PropTypes.number.isRequired,
  referencia: PropTypes.string
};

// Valores por defecto
ActivityItem.defaultProps = {
  color: "var(--primary)",
  referencia: null
};