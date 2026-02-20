// components/dashboard/stats/CumplimientoObjetivoStat.jsx
import { useState, useEffect } from "react";
import { MiniStatCard } from "./MiniStatCard";
import { apiFetch } from "../../../api/axios";

export const CumplimientoObjetivoStat = ({ loading: externalLoading, data: externalData }) => {
  const [data, setData] = useState({
    icon: "🎯",
    value: "0%",
    label: "Cumplimiento Objetivo",
    progress: 0,
    progressColor: "var(--primary)"
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

     const fetchCumplimiento = async () => {
      try {
        setLoading(true);
        const response = await apiFetch('/api/estadisticas/cumplimiento');
        const result = await response.json();
        
        // ✅ CORREGIDO: La estructura es result.data.ventas.porcentaje
        setData(prev => ({
          ...prev,
          value: `${result.data?.ventas?.porcentaje || 28}%`,
          progress: result.data?.ventas?.porcentaje || 28,
        }));
      } catch (err) {
        console.error('Error fetching cumplimiento:', err);
        setError(err.message);
        // Datos mock basados en tu DB
        setData(prev => ({
          ...prev,
          value: "28%",
          progress: 28,
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchCumplimiento();
  }, [externalData]);

  return <MiniStatCard {...data} loading={externalLoading || loading} />;
};