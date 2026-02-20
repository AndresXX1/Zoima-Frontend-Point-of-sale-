/* eslint-disable react-hooks/exhaustive-deps */
// components/dashboard/charts/VentasPorKioscoChart.jsx
import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartPanel } from "./ChartPanel";
import { apiFetch } from "../../../api/axios";

export const VentasPorKioscoChart = ({ data: externalData, loading: externalLoading }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Datos por defecto basados en tu DB real
  const defaultData = [
    { id: 1, kiosco: "Kiosco Central", ventas: 12450, pedidos: 1, ticket_promedio: 12450, cumplimiento: 40, meta: 3000 },
  ];

  useEffect(() => {
    if (externalData) {
      setData(externalData);
      setLoading(false);
      return;
    }

    const fetchVentasPorKiosco = async () => {
      try {
        setLoading(true);
        const response = await apiFetch('/api/estadisticas/ventas/por-kiosco');
        
        if (!response.ok) {
          throw new Error('Error al cargar ventas por kiosco');
        }
        
        const result = await response.json();
        
        // ✅ CORREGIDO: Accedemos a result.data
        if (result.data && result.data.length > 0) {
          setData(result.data);
        } else {
          setData(defaultData);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching ventas por kiosco:', err);
        setError(err.message);
        setData(defaultData);
      } finally {
        setLoading(false);
      }
    };

    fetchVentasPorKiosco();
  }, [externalData]);

  const chartData = data.length > 0 ? data : defaultData;
  const isLoading = loading || externalLoading;

  if (isLoading) {
    return (
      <ChartPanel 
        title="🏪 Ventas por Kiosco" 
        subtitle="Rendimiento individual del mes actual"
      >
        <Box sx={{ 
          height: 320, 
          bgcolor: "#f7fafc", 
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Typography color="#718096">Cargando ventas por kiosco...</Typography>
        </Box>
      </ChartPanel>
    );
  }

  if (error) {
    return (
      <ChartPanel 
        title="🏪 Ventas por Kiosco" 
        subtitle="Error al cargar datos"
      >
        <Box sx={{ 
          p: 3, 
          textAlign: 'center',
          color: 'error.main'
        }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </ChartPanel>
    );
  }

  const totalVentas = chartData.reduce((sum, item) => sum + (item.ventas || 0), 0);
  const promedioVentas = chartData.length > 0 ? totalVentas / chartData.length : 0;
  const kioscoDestacado = chartData.reduce((max, item) => 
    (item.ventas || 0) > (max.ventas || 0) ? item : max, chartData[0] || { kiosco: "N/A", ventas: 0 }
  );

  return (
    <ChartPanel 
      title="🏪 Ventas por Kiosco" 
      subtitle="Rendimiento individual del mes actual"
    >
      <Box sx={{ flexGrow: 1, minHeight: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            barSize={36}
          >
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={1} />
                <stop offset="100%" stopColor="#764ba2" stopOpacity={0.85} />
              </linearGradient>
              <linearGradient id="metaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f093fb" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f093fb" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e2e8f0" 
              vertical={false} 
              strokeOpacity={0.5} 
            />
            <XAxis 
              dataKey="kiosco" 
              stroke="#718096" 
              style={{ 
                fontSize: "0.85rem", 
                fontWeight: 600, 
                fontFamily: "'Inter', sans-serif" 
              }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="#718096" 
              style={{ 
                fontSize: "0.85rem", 
                fontWeight: 600, 
                fontFamily: "'Inter', sans-serif" 
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.98)",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                padding: "12px"
              }}
              formatter={(value, name) => {
                if (name === "ventas") return [`$${value.toLocaleString()}`, "Ventas"];
                if (name === "meta") return [`$${value.toLocaleString()}`, "Meta"];
                if (name === "pedidos") return [value, "Pedidos"];
                return [value, name];
              }}
              labelStyle={{ fontWeight: 700, color: "#1a202c" }}
            />
            <Bar 
              dataKey="ventas" 
              fill="url(#barGradient)" 
              radius={[10, 10, 0, 0]} 
              name="Ventas"
              animationDuration={1000}
            />
            {chartData.some(item => item.meta !== undefined && item.meta > 0) && (
              <Bar 
                dataKey="meta" 
                fill="url(#metaGradient)" 
                radius={[10, 10, 0, 0]} 
                name="Meta"
                animationDuration={1000}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
        
        {/* Resumen de rendimiento */}
        <Box sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          mt: 2,
          pt: 2,
          borderTop: "1px solid",
          borderColor: "rgba(102, 126, 234, 0.08)"
        }}>
          <Box>
            <Typography variant="caption" sx={{ color: "#718096", fontWeight: 600 }}>
              Total Ventas
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: "#1a202c" }}>
              ${totalVentas.toLocaleString()}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "#718096", fontWeight: 600 }}>
              Promedio por Kiosco
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: "#1a202c" }}>
              ${promedioVentas.toFixed(0)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "#718096", fontWeight: 600 }}>
              Kiosco Destacado
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: "var(--primary)" }}>
              {kioscoDestacado.kiosco}
            </Typography>
          </Box>
        </Box>

        {/* Información adicional de pedidos */}
        {chartData.some(item => item.pedidos > 0) && (
          <Box sx={{ 
            display: "flex", 
            justifyContent: "center",
            mt: 1,
            pt: 1,
            borderTop: "1px dashed",
            borderColor: "rgba(102, 126, 234, 0.08)"
          }}>
            <Typography variant="caption" sx={{ color: "#718096" }}>
              {chartData.map(item => `${item.kiosco}: ${item.pedidos} pedido${item.pedidos !== 1 ? 's' : ''}`).join(' • ')}
            </Typography>
          </Box>
        )}
      </Box>
    </ChartPanel>
  );
};

// Versión con fetch propio (exportación nombrada)
export const VentasPorKioscoChartWithFetch = () => {
  return <VentasPorKioscoChart />;
};