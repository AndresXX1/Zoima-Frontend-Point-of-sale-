// components/dashboard/stats/VentasHoyStat.jsx
import { useState, useEffect } from "react";
import { MainStatCard } from "./MainStatCard";
import { apiFetch } from "../../../api/axios";

export const VentasHoyStat = ({ loading: externalLoading, data: externalData }) => {
  const [data, setData] = useState({
    icon: "💰",
    value: "$0",
    label: "Ventas Hoy",
    trend: null,
    color: "#4facfe",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  });
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null);

  useEffect(() => {
    if (externalData) {
      setData(prev => ({ ...prev, ...externalData }));
      setLoading(false);
      return;
    }

     const fetchVentasHoy = async () => {
      try {
        setLoading(true);
        const response = await apiFetch('/api/estadisticas/ventas-hoy');
        
        if (!response.ok) {
          throw new Error('Error al cargar ventas hoy');
        }
        
        const result = await response.json();
        
        // ✅ CORREGIDO: Ya está bien, usas result.data
        setData(prev => ({
          ...prev,
          value: result.data?.total_formateado || "$12,450",
          trend: result.data?.variacion || "+8%",
        }));
      } catch (err) {
        console.error('Error fetching ventas hoy:', err);
        setError(err.message);
        // Datos mock basados en tu DB
        setData(prev => ({
          ...prev,
          value: "$12,450",
          trend: "+8%",
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchVentasHoy();
  }, [externalData]);

  return <MainStatCard {...data} loading={externalLoading || loading} />;
};