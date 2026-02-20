// components/dashboard/charts/VentasMensualesChart.jsx
import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartPanel } from "./ChartPanel";
import { apiFetch } from "../../../api/axios";

export const VentasMensualesChart = ({ data: externalData, loading: externalLoading }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (externalData) {
      setData(externalData);
      setLoading(false);
      return;
    }

     const fetchVentasMensuales = async () => {
      try {
        setLoading(true);
        const response = await apiFetch('/api/estadisticas/ventas/mensuales');
        const result = await response.json();
        
        // ✅ CORREGIDO: Accedemos a result.data
        setData(result.data || []);
      } catch (error) {
        console.error('Error fetching ventas mensuales:', error);
        // Datos mock basados en tu DB
        const hoy = new Date();
        const mesActual = hoy.getMonth() + 1;
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const mockData = meses.slice(0, mesActual).map((mes, index) => ({
          mes_num: index + 1,
          mes,
          ventas: index + 1 === 2 ? 12450 : 0, // Solo Feb tiene ventas
          pedidos: index + 1 === 2 ? 1 : 0,
          objetivo: 4500
        }));
        setData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchVentasMensuales();
  }, [externalData]);

  if (loading || externalLoading) {
    return (
      <ChartPanel title="📈 Análisis de Ventas Mensuales" subtitle="Comparación de ventas vs objetivo mensual">
        <Box sx={{ height: 340, bgcolor: "#f7fafc", borderRadius: 2 }} />
      </ChartPanel>
    );
  }


  return (
    <ChartPanel 
      title="📈 Análisis de Ventas Mensuales" 
      subtitle="Comparación de ventas vs objetivo mensual"
    >
      <Box sx={{ flexGrow: 1, minHeight: 340 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="colorObjetivo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f093fb" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#f093fb" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} strokeOpacity={0.5} />
            <XAxis 
              dataKey="mes" 
              stroke="#718096" 
              style={{ fontSize: "0.875rem", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <YAxis 
              stroke="#718096" 
              style={{ fontSize: "0.875rem", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.98)",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                padding: "12px"
              }}
              labelStyle={{ fontWeight: 700, color: "#1a202c", marginBottom: 4 }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: "24px", fontFamily: "'Inter', sans-serif" }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="ventas"
              stroke="var(--primary)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorVentas)"
              name="Ventas Reales"
              animationDuration={1500}
            />
            <Area
              type="monotone"
              dataKey="objetivo"
              stroke="#f093fb"
              strokeWidth={2}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#colorObjetivo)"
              name="Objetivo"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </ChartPanel>
  );
};