// pages/Admin.jsx
import { useState } from "react";
import { Box, Grid, Typography } from "@mui/material";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import { useDashboardData } from "../hooks/useDashboardData";

// Stats
import { TotalEmpleadosStat } from "../components/dashboard/stats/TotalEmpleadosStat";
import { KioscosActivosStat } from "../components/dashboard/stats/KioscosActivosStat";
import { TotalProductosStat } from "../components/dashboard/stats/TotalProductosStat";
// import { VentasHoyStat } from "../components/dashboard/stats/VentasHoyStat";
// import { CumplimientoObjetivoStat } from "../components/dashboard/stats/CumplimientoObjetivoStat";
import { PedidosMesStat } from "../components/dashboard/stats/PedidosMesStat";
// import { TicketPromedioStat } from "../components/dashboard/stats/TicketPromedioStat";
import { AsistenciaGeneralStat } from "../components/dashboard/stats/AsistenciaGeneralStat";

// Charts
// import { VentasMensualesChart } from "../components/dashboard/charts/VentasMensualesChart";
import { StockCategoriasChart } from "../components/dashboard/charts/StockCategoriasChart";
// import { VentasPorKioscoChart } from "../components/dashboard/charts/VentasPorKioscoChart";

// Activity
// import { RecentActivity } from "../components/dashboard/activity/RecentActivity";

// Tables
import KioscosTable from "../components/tables/KioscosTable";
import StockTable from "../components/tables/StockTable";
// import AsistenciasTable from "../components/tables/AsistenciasTable";
import EmpleadosTable from "../components/tables/EmpleadosTable";
import UsuariosSistemaTable from "../components/tables/UsuariosSistemaTable";
import ProductosTable from "../components/tables/ProductosTable";
import PedidosTable from "../components/tables/PedidosTable";
import VentasTable from "../components/caja/CajaVentas";
const drawerWidth = 260;

// Animaciones
const containerAnimation = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemAnimation = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// Mapeo de secciones a componentes de tabla
const sectionComponents = {
  kioscos: KioscosTable,
  stock: StockTable,
  ventas: VentasTable,
  // asistencias: AsistenciasTable,
  empleados: EmpleadosTable,
  usuarios: UsuariosSistemaTable,
  productos: ProductosTable,
  pedidos: PedidosTable,
  
};

export default function Admin({ sidebarOpen, onSidebarToggle }) {
  const [selectedSection, setSelectedSection] = useState("dashboard");
  const { data, loading } = useDashboardData();

  const renderDashboard = () => (
    <motion.div variants={containerAnimation} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={itemAnimation}>
        <Box sx={{ mb: 5, position: "relative", ml: "180px" }}>
          <Box 
            sx={{ 
              position: "absolute",
              top: -20,
              left: -20,
              width: 120,
              height: 120,
              background: "radial-gradient(circle, rgba(102, 126, 234, 0.15) 0%, transparent 70%)",
              borderRadius: "50%",
              filter: "blur(40px)",
              zIndex: 0,
            }}
          />
          <Typography 
            variant="h2" 
            sx={{ 
              fontWeight: 900, 
              background: "linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 1,
              fontSize: "3rem",
              letterSpacing: "-1px",
              fontFamily: "'Outfit', sans-serif",
              position: "relative",
              zIndex: 1,
            }}
          >
            Dashboard General
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: "rgba(255, 255, 255, 0.75)", 
              fontSize: "1.15rem",
              fontWeight: 500,
              letterSpacing: "0.3px"
            }}
          >
            Resumen ejecutivo de tu negocio · Actualizado hace 2 minutos
          </Typography>
        </Box>
      </motion.div>

      {/* KPIs principales */}
      <Grid container spacing={3} sx={{ mb: 4, ml: "180px" }}>
        <Grid item xs={12} sm={6} lg={3}>
          <TotalEmpleadosStat loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KioscosActivosStat loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <TotalProductosStat loading={loading} />
        </Grid>
        {/* <Grid item xs={12} sm={6} lg={3}>
          <VentasHoyStat loading={loading} />
        </Grid> */}
      </Grid>

      {/* Métricas secundarias */}
      <Grid container spacing={3} sx={{ mb: 4, ml: "180px"  }}>
        {/* <Grid item xs={6} sm={6} md={3}>
          <CumplimientoObjetivoStat loading={loading} />
        </Grid> */}
        <Grid item xs={6} sm={6} md={3}>
          <PedidosMesStat loading={loading} />
        </Grid>
        {/* <Grid item xs={6} sm={6} md={3}>
          <TicketPromedioStat loading={loading} />
        </Grid> */}
        <Grid item xs={6} sm={6} md={3}>
          <AsistenciaGeneralStat loading={loading} />
        </Grid>
      </Grid>

      {/* Gráficos principales */}
      <Grid container spacing={3} sx={{ mb: 4, ml: "180px"  }}>
        {/* <Grid item xs={12} lg={8}>
          <VentasMensualesChart data={data.ventasMensuales} loading={loading} />
        </Grid> */}
        <Grid item xs={12} lg={4}>
          <StockCategoriasChart data={data.stockCategorias} loading={loading} />
        </Grid>
      </Grid>

      {/* Barras + Actividad reciente */}
      <Grid container spacing={3}>
        {/* <Grid item xs={12} lg={8}>
          <VentasPorKioscoChart data={data.ventasPorKiosco} loading={loading} />
        </Grid> */}
        {/* <Grid item xs={12} lg={4}>
          <RecentActivity activities={data.actividadReciente} loading={loading} />
        </Grid> */}
      </Grid>
    </motion.div>
  );

  // Renderizar secciones de tabla
  const renderTableSection = () => {
    const TableComponent = sectionComponents[selectedSection];
    if (TableComponent) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <TableComponent />
        </motion.div>
      );
    }
    return null;
  };



  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap');
        `}
      </style>
      
      <Box sx={{ display: "flex", minHeight: "calc(100vh - 64px)" }}>
        <Sidebar
          open={sidebarOpen}
          onClose={() => onSidebarToggle(false)}
          selectedSection={selectedSection}
          onSectionChange={setSelectedSection}
        />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            marginLeft: sidebarOpen ? `${drawerWidth}px` : 0,
            width: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : "100%",
            minHeight: "100vh",
          }}
        >
          <Box sx={{ maxWidth: "1600px", margin: "0 auto", p: 4 }}>
            {selectedSection === "dashboard" && renderDashboard()}
            {renderTableSection()}
          </Box>
        </Box>
      </Box>
    </>
  );
}