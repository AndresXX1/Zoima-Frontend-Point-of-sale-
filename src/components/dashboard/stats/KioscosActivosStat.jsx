// components/dashboard/stats/KioscosActivosStat.jsx
import { useState, useEffect } from "react";
import { MainStatCard } from "./MainStatCard";
import { apiFetch } from "../../../api/axios";

export const KioscosActivosStat = ({ loading: externalLoading, data: externalData }) => {
  const [data, setData] = useState({
    icon: "🏪",
    value: "0",
    label: "Kioscos Activos",
    trend: null,
    color: "#764ba2",
    gradient: "linear-gradient(135deg, #764ba2 0%, #f093fb 100%)",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Si recibimos datos externos, los usamos
    if (externalData) {
      setData(prev => ({
        ...prev,
        value: externalData.value || prev.value,
        trend: externalData.trend || prev.trend,
      }));
      setLoading(false);
      return;
    }

       const fetchKioscosActivos = async () => {
      try {
        setLoading(true);
        // ✅ Usar apiFetch que incluye credentials: 'include'
        const response = await apiFetch('/api/estadisticas/kioscos-activos');
        
        if (!response.ok) {
          throw new Error('Error al cargar kioscos activos');
        }
        
        const result = await response.json();
        
        setData(prev => ({
          ...prev,
          value: result.data?.total?.toString() || "0",
          trend: result.data?.variacion || "+0",
        }));
        
        setError(null);
      } catch (err) {
        console.error('Error fetching kioscos activos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchKioscosActivos();
  }, [externalData]);

  if (error) {
    return (
      <MainStatCard 
        {...data} 
        loading={false}
        trend="Error"
        color="#f44336"
        gradient="linear-gradient(135deg, #f44336 0%, #ff7961 100%)"
      />
    );
  }

  return <MainStatCard {...data} loading={externalLoading || loading} />;
};

// También exportamos una versión con datos mock para desarrollo
export const MockKioscosActivosStat = () => (
  <MainStatCard 
    icon="🏪"
    value="8"
    label="Kioscos Activos"
    trend="+2"
    color="#764ba2"
    gradient="linear-gradient(135deg, #764ba2 0%, #f093fb 100%)"
  />
);