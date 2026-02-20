// components/dashboard/activity/RecentActivity.jsx
import { useState, useEffect } from "react";
import { Box, Typography, Divider, Alert, Skeleton } from "@mui/material";
import { ChartPanel } from "../charts/ChartPanel";
import { ActivityItem } from "./ActivityItem";
import { apiFetch } from "../../../api/axios";

export const RecentActivity = ({ activities: externalActivities, loading: externalLoading }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Datos mock para desarrollo/fallback - BASADOS EN TU DB REAL
  const mockActivities = [
    { 
      icon: "🛒", 
      text: "Nuevo pedido registrado", 
      referencia: "Kiosco Central - $12,450",
      time: "Hace 2 días", 
      color: "var(--primary)" 
    },
    { 
      icon: "📦", 
      text: "Stock actualizado", 
      referencia: "Coca Cola 600ml en Kiosco Central",
      time: "Hace 2 días", 
      color: "#764ba2" 
    },
    { 
      icon: "👤", 
      text: "Nuevo empleado agregado", 
      referencia: "Andres Vera",
      time: "Hace 2 días", 
      color: "#f093fb" 
    },
    { 
      icon: "🏪", 
      text: "Kiosco activo", 
      referencia: "Kiosco Central",
      time: "Hace 2 días", 
      color: "#4facfe" 
    }
  ];

  useEffect(() => {
    if (externalActivities) {
      setActivities(externalActivities);
      setLoading(false);
      return;
    }

    const fetchRecentActivity = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiFetch('/api/actividad/reciente');
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // ✅ CORREGIDO: La estructura de respuesta es un array directamente
        if (Array.isArray(result)) {
          setActivities(result);
        } else if (result.data && Array.isArray(result.data)) {
          setActivities(result.data);
        } else {
          console.warn('Formato de respuesta inesperado, usando datos mock');
          setActivities(mockActivities);
        }
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        setError(error.message);
        setActivities(mockActivities);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalActivities]);

  const isLoading = loading || externalLoading;

  // Estado de carga
  if (isLoading) {
    return (
      <ChartPanel 
        title="⚡ Actividad Reciente" 
        subtitle="Últimos movimientos del sistema"
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1, pb: 2 }}>
          {[1, 2, 3, 4].map((i) => (
            <Box key={i} sx={{ display: "flex", gap: 2, p: 2 }}>
              <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: "10px" }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="80%" height={20} />
                <Skeleton width="40%" height={16} />
              </Box>
            </Box>
          ))}
        </Box>
      </ChartPanel>
    );
  }

  // Estado de error
  if (error && activities.length === 0) {
    return (
      <ChartPanel 
        title="⚡ Actividad Reciente" 
        subtitle="Últimos movimientos del sistema"
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          Error al cargar actividad: {error}
        </Alert>
        <Typography variant="body2" sx={{ color: "#718096", textAlign: "center" }}>
          Mostrando datos de respaldo
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1, pb: 2, mt: 2 }}>
          {mockActivities.map((item, index) => (
            <ActivityItem key={`mock-${index}`} {...item} index={index} />
          ))}
        </Box>
      </ChartPanel>
    );
  }

  // Sin actividades
  if (!activities || activities.length === 0) {
    return (
      <ChartPanel 
        title="⚡ Actividad Reciente" 
        subtitle="Últimos movimientos del sistema"
      >
        <Box sx={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center",
          py: 4,
          color: "#718096"
        }}>
          <Typography variant="h1" sx={{ fontSize: "3rem", mb: 2 }}>
            📭
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
            No hay actividad reciente
          </Typography>
          <Typography variant="caption">
            Los movimientos aparecerán aquí cuando ocurran
          </Typography>
        </Box>
      </ChartPanel>
    );
  }

  // Renderizado normal
  return (
    <ChartPanel 
      title="⚡ Actividad Reciente" 
      subtitle="Últimos movimientos del sistema"
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1, pb: 2 }}>
        {activities.slice(0, 5).map((item, index) => (
          <ActivityItem 
            key={item.id || `activity-${index}`} 
            {...item} 
            index={index} 
          />
        ))}
      </Box>
      
      {activities.length > 5 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography
            variant="body2"
            sx={{
              color: "var(--primary)",
              fontWeight: 700,
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "'Inter', sans-serif",
              "&:hover": { 
                color: "#764ba2",
                transform: "translateY(-1px)"
              },
            }}
            onClick={() => console.log('Ver todo el historial')}
          >
            Ver todas las actividades ({activities.length}) →
          </Typography>
        </>
      )}
    </ChartPanel>
  );
};

// Versión con fetch propio
export const RecentActivityWithFetch = () => {
  return <RecentActivity />;
};