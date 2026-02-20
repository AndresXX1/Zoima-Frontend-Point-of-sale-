// components/dashboard/stats/TotalEmpleadosStat.jsx
import { useState, useEffect } from "react";
import { MainStatCard } from "./MainStatCard";
import { apiFetch } from "../../../api/axios";

export const TotalEmpleadosStat = ({ loading: externalLoading, data: externalData }) => {
  const [data, setData] = useState({
    icon: "👥",
    value: "0",
    label: "Total Empleados",
    trend: null,
    color: "var(--primary)",
    gradient: "linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)",
  });
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null);

  useEffect(() => {
    if (externalData) {
      setData(prev => ({
        ...prev,
        value: externalData.value || prev.value,
        trend: externalData.trend || prev.trend,
      }));
      setLoading(false);
      return;
    }

      const fetchTotalEmpleados = async () => {
      try {
        setLoading(true);
        // ✅ Usar apiFetch que incluye credentials: 'include'
        const response = await apiFetch('/api/estadisticas/empleados');
        
        if (!response.ok) {
          throw new Error('Error al cargar empleados');
        }
        
        const result = await response.json();
        
        setData(prev => ({
          ...prev,
          value: result.data?.total?.toString() || "45",
          trend: result.data?.variacion || "+5%",
        }));
      } catch (err) {
        console.error('Error fetching total empleados:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTotalEmpleados();
  }, [externalData]);

  return <MainStatCard {...data} loading={externalLoading || loading} />;
};