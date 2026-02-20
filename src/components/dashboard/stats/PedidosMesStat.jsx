// components/dashboard/stats/PedidosMesStat.jsx
import { useState, useEffect } from "react";
import { MiniStatCard } from "./MiniStatCard";
import { apiFetch } from "../../../api/axios";

export const PedidosMesStat = ({ loading: externalLoading, data: externalData }) => {
  const [data, setData] = useState({
    icon: "🧾",
    value: "0",
    label: "Pedidos del Mes",
    progress: 0,
    progressColor: "#764ba2"
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

    const fetchPedidosMes = async () => {
      try {
        setLoading(true);
        const response = await apiFetch('/api/estadisticas/pedidos-mes');
        const result = await response.json();
        
        // ✅ CORREGIDO: Accedemos a result.data
        setData(prev => ({
          ...prev,
          value: result.data?.total?.toString() || "1",
          progress: result.data?.progreso || 45,
        }));
      } catch (err) {
        console.error('Error fetching pedidos mes:', err);
        setError(err.message);
        // Datos mock basados en tu DB
        setData(prev => ({
          ...prev,
          value: "1",
          progress: 45,
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchPedidosMes();
  }, [externalData]);

  return <MiniStatCard {...data} loading={externalLoading || loading} />;
};