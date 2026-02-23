// components/dashboard/charts/StockCategoriasChart.jsx
import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ChartPanel } from "./ChartPanel";
import { apiFetch } from "../../../api/axios";

const COLORS = ["var(--primary)", "#764ba2", "#f093fb", "#4facfe", "#ff6b6b", "#48dbfb"];

export const StockCategoriasChart = ({ data: externalData, loading: externalLoading }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Datos por defecto basados en tu DB real
  const defaultData = [
    { nombre: "Bebidas", cantidad: 85, color: "var(--primary)" },
    { nombre: "Golosinas", cantidad: 0, color: "#764ba2" },
    { nombre: "Otros", cantidad: 0, color: "#4facfe" },
  ];

  useEffect(() => {
    if (externalData) {
      setData(externalData);
      setLoading(false);
      return;
    }

    const fetchStockCategorias = async () => {
      try {
        setLoading(true);
        const response = await apiFetch('/api/estadisticas/stock/categorias');
        
        if (!response.ok) {
          throw new Error('Error al cargar stock por categorías');
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
        console.error('Error fetching stock categorias:', err);
        setError(err.message);
        setData(defaultData);
      } finally {
        setLoading(false);
      }
    };

    fetchStockCategorias();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalData]);

  const chartData = data.length > 0 ? data : defaultData;
  const isLoading = loading || externalLoading;

  if (isLoading) {
    return (
      <ChartPanel 
        title="📦 Stock por Categoría" 
        subtitle="Distribución actual de inventario"
      >
        <Box sx={{ 
          flexGrow: 1, 
          minHeight: 280, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          bgcolor: "#f7fafc",
          borderRadius: 2
        }}>
          <Typography color="#718096">Cargando distribución de stock...</Typography>
        </Box>
      </ChartPanel>
    );
  }

  if (error) {
    return (
      <ChartPanel 
        title="📦 Stock por Categoría" 
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

  // Filtrar categorías con cantidad > 0 para el gráfico
  const chartDataWithColors = chartData
    .filter(item => item.cantidad > 0)
    .map((item, index) => ({
      ...item,
      color: item.color || COLORS[index % COLORS.length]
    }));

  const total = chartDataWithColors.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <ChartPanel 
      title="📦 Stock por Categoría" 
      subtitle="Distribución actual de inventario"
    >
      <Box sx={{ flexGrow: 1, minHeight: 280, display: "flex", flexDirection: "column" }}>
        {chartDataWithColors.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={chartDataWithColors}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="cantidad"
                  nameKey="nombre"
                  animationDuration={1000}
                  label={({ name, percent }) => 
                    percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                  }
                  labelLine={{ stroke: '#718096', strokeWidth: 1 }}
                >
                  {chartDataWithColors.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      stroke="white"
                      strokeWidth={3}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.98)",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    padding: "12px"
                  }}
                  // eslint-disable-next-line no-unused-vars
                  formatter={(value, name, props) => {
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                    return [`${value} unidades (${percentage}%)`, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Leyenda custom mejorada */}
            <Box sx={{ 
              display: "flex", 
              flexWrap: "wrap", 
              gap: 2, 
              mt: 2, 
              justifyContent: "center",
              px: 2
            }}>
              {chartDataWithColors.map((item, i) => {
                const percentage = total > 0 ? ((item.cantidad / total) * 100).toFixed(1) : 0;
                
                return (
                  <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box 
                      sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: "3px", 
                        backgroundColor: item.color,
                        boxShadow: `0 2px 8px ${item.color}50`
                      }} 
                    />
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: "#4a5568", 
                        fontWeight: 600,
                        fontFamily: "'Inter', sans-serif"
                      }}
                    >
                      {item.nombre}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: "#a0aec0", 
                        fontWeight: 700
                      }}
                    >
                      ({item.cantidad} | {percentage}%)
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </>
        ) : (
          <Box sx={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            height: 240,
            color: "#718096"
          }}>
            <Typography>No hay stock disponible</Typography>
          </Box>
        )}
      </Box>
    </ChartPanel>
  );
};
