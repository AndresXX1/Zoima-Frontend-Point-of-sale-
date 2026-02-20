// components/hooks/useDashboardData.js
import { useState, useEffect } from 'react';

export const useDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    // Stats principales
    empleados: null,
    kioscos: null,
    productos: null,
    ventasHoy: null,
    // Stats secundarias
    cumplimiento: null,
    pedidosMes: null,
    ticketPromedio: null,
    asistencia: null,
    // Charts
    ventasMensuales: [],
    ventasPorKiosco: [],
    stockCategorias: [],
    actividadReciente: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Llamadas a los nuevos endpoints de estadísticas
        const [
          empleadosRes,
          kioscosRes,
          productosRes,
          ventasHoyRes,
          cumplimientoRes,
          pedidosRes,
          ticketRes,
          asistenciaRes,
          ventasMensualesRes,
          ventasKioscoRes,
          stockRes,
          actividadRes
        ] = await Promise.allSettled([
          fetch('/api/estadisticas/empleados').then(res => res.json()),
          fetch('/api/estadisticas/kioscos-activos').then(res => res.json()),
          fetch('/api/estadisticas/total-productos').then(res => res.json()),
          fetch('/api/estadisticas/ventas-hoy').then(res => res.json()),
          fetch('/api/estadisticas/cumplimiento').then(res => res.json()),
          fetch('/api/estadisticas/pedidos-mes').then(res => res.json()),
          fetch('/api/estadisticas/ticket-promedio').then(res => res.json()),
          fetch('/api/estadisticas/empleados/asistencia').then(res => res.json()),
          fetch('/api/estadisticas/ventas/mensuales').then(res => res.json()),
          fetch('/api/estadisticas/ventas/por-kiosco').then(res => res.json()),
          fetch('/api/estadisticas/stock/categorias').then(res => res.json()),
          fetch('/api/actividad/reciente').then(res => res.json())
        ]);

        setData({
          empleados: empleadosRes.status === 'fulfilled' ? empleadosRes.value : null,
          kioscos: kioscosRes.status === 'fulfilled' ? kioscosRes.value : null,
          productos: productosRes.status === 'fulfilled' ? productosRes.value : null,
          ventasHoy: ventasHoyRes.status === 'fulfilled' ? ventasHoyRes.value : null,
          cumplimiento: cumplimientoRes.status === 'fulfilled' ? cumplimientoRes.value : null,
          pedidosMes: pedidosRes.status === 'fulfilled' ? pedidosRes.value : null,
          ticketPromedio: ticketRes.status === 'fulfilled' ? ticketRes.value : null,
          asistencia: asistenciaRes.status === 'fulfilled' ? asistenciaRes.value : null,
          ventasMensuales: ventasMensualesRes.status === 'fulfilled' ? ventasMensualesRes.value : [],
          ventasPorKiosco: ventasKioscoRes.status === 'fulfilled' ? ventasKioscoRes.value : [],
          stockCategorias: stockRes.status === 'fulfilled' ? stockRes.value : [],
          actividadReciente: actividadRes.status === 'fulfilled' ? actividadRes.value : []
        });
        
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return { data, loading, error };
};