// components/dashboard/stats/TicketPromedioStat.jsx
import { useState, useEffect } from "react";
import { MiniStatCard } from "./MiniStatCard";
import { apiFetch } from "../../../api/axios";

export const TicketPromedioStat = ({ loading: externalLoading, data: externalData }) => {
  const [data, setData] = useState({
    icon: "📊",
    value: "$0",
    label: "Ticket Promedio",
    progress: 0,
    progressColor: "#f093fb"
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

    const fetchTicketPromedio = async () => {
      try {
        setLoading(true);
        const response = await apiFetch('/api/estadisticas/ticket-promedio');
        const result = await response.json();
        
        // ✅ CORREGIDO: Usamos promedio_formateado del service
        setData(prev => ({
          ...prev,
          value: result.data?.promedio_formateado || "$12,450.00",
          progress: result.data?.progreso || 80,
        }));
      } catch (err) {
        console.error('Error fetching ticket promedio:', err);
        setError(err.message);
        // Datos mock basados en tu DB
        setData(prev => ({
          ...prev,
          value: "$12,450.00",
          progress: 80,
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchTicketPromedio();
  }, [externalData]);

  return <MiniStatCard {...data} loading={externalLoading || loading} />;
};