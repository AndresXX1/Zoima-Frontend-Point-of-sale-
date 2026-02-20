// components/dashboard/index.js
// Stats
export * from './stats/MainStatCard';
export * from './stats/MiniStatCard';
export * from './stats/TotalEmpleadosStat';
export * from './stats/KioscosActivosStat';
export * from './stats/TotalProductosStat';
export * from './stats/VentasHoyStat';
export * from './stats/CumplimientoObjetivoStat';
export * from './stats/PedidosMesStat';
export * from './stats/TicketPromedioStat';
export * from './stats/AsistenciaGeneralStat';

// Charts
export * from './charts/ChartPanel';
export * from './charts/VentasMensualesChart';
export * from './charts/StockCategoriasChart';
export * from './charts/VentasPorKioscoChart';

// Activity
export * from './activity/RecentActivity';
export * from './activity/ActivityItem';

// Versiones con fetch propio (opcional)
export { 
  StockCategoriasChartWithFetch,
  VentasPorKioscoChartWithFetch 
} from './charts/StockCategoriasChart';