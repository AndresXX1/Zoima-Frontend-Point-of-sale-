// components/dashboard/stats/TotalProductosStat.jsx
import { useState, useEffect } from "react";
import { MainStatCard } from "./MainStatCard";
import { apiFetch } from "../../../api/axios";

export const TotalProductosStat = ({ loading: externalLoading, data: externalData }) => {
  const [data, setData] = useState({
    icon: "📦",
    value: "0",
    label: "Total Productos",
    trend: null,
    color: "#f093fb",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
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

     const fetchTotalProductos = async () => {
      try {
        setLoading(true);
        const response = await apiFetch('/api/estadisticas/total-productos');
        const result = await response.json();
        
        // ✅ CORREGIDO: Accedemos a result.data
        setData(prev => ({
          ...prev,
          value: result.data?.total?.toString() || "4",
          trend: result.data?.variacion || "0%",
        }));
      } catch (err) {
        console.error('Error fetching total productos:', err);
        setError(err.message);
        // Datos mock en caso de error
        setData(prev => ({
          ...prev,
          value: "4",
          trend: "0%",
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchTotalProductos();
  }, [externalData]);

  return <MainStatCard {...data} loading={externalLoading || loading} />;
};