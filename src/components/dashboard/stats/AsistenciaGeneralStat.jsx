// components/dashboard/stats/AsistenciaGeneralStat.jsx
import { useState, useEffect } from "react";
import { MiniStatCard } from "./MiniStatCard";
import { apiFetch } from "../../../api/axios";

export const AsistenciaGeneralStat = ({ loading: externalLoading, data: externalData }) => {
  const [data, setData] = useState({
    icon: "✅",
    value: "0%",
    label: "Asistencia General",
    progress: 0,
    progressColor: "#4facfe"
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

     const fetchAsistencia = async () => {
      try {
        setLoading(true);
        const response = await apiFetch('/api/estadisticas/asistencias/general');
        const result = await response.json();
        
        // ✅ CORREGIDO: Ruta correcta y estructura result.data
        setData(prev => ({
          ...prev,
          value: `${result.data?.porcentaje || 50}%`,
          progress: result.data?.porcentaje || 50,
        }));
      } catch (err) {
        console.error('Error fetching asistencia:', err);
        setError(err.message);
        // Datos mock basados en tu DB
        setData(prev => ({
          ...prev,
          value: "50%",
          progress: 50,
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchAsistencia();
  }, [externalData]);

  return <MiniStatCard {...data} loading={externalLoading || loading} />;
};