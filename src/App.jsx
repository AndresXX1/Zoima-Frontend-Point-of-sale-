// App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import AnimatedBackground from "./components/AnimatedBackground";
import Navbar from "./components/NavBar";
import Footer from "./components/Footer";
import Fichar from "./pages/Fichar";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Kiosco from "./pages/Kiosco";
import { Box } from "@mui/material";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSection, setSelectedSection] = useState("dashboard"); // ← NUEVO
  const location = useLocation();

  useEffect(() => {
    const root = document.documentElement;

    if (location.pathname.startsWith("/admin")) {
      root.style.setProperty("--primary", "#667eea");
      root.style.setProperty("--primary-gradient", "linear-gradient(135deg, #667eea 0%, #764ba2 100%)");
      root.style.setProperty("--secondary-gradient", "linear-gradient(135deg, #764ba2 0%, #667eea 100%)");
      root.style.setProperty("--header-bg", "rgba(10, 22, 40, 0.95)");
      root.style.setProperty("--header-border", "rgba(102, 126, 234, 0.25)");
      root.style.setProperty("--header-accent", "#667eea");
      root.style.setProperty("--sidebar-bg", "linear-gradient(180deg, rgba(55, 65, 81, 0.95) 0%, rgba(31, 41, 55, 0.92) 100%)");
      root.style.setProperty("--scrollbar-thumb", "rgba(102, 126, 234, 0.5)");
      root.style.setProperty("--shadow-color", "rgba(102, 126, 234, 0.3)");
      root.style.setProperty("--button-bg", "rgba(102, 126, 234, 0.2)");
      root.style.setProperty("--button-bg-hover", "rgba(102, 126, 234, 0.35)");
      root.style.setProperty("--hover-bg", "rgba(102, 126, 234, 0.15)");
      root.style.setProperty("--active-bg", "rgba(102, 126, 234, 0.3)");

    } else if (location.pathname.startsWith("/kiosco")) {
      root.style.setProperty("--primary", "#10b981");
      root.style.setProperty("--primary-gradient", "linear-gradient(135deg, #10b981 0%, #059669 100%)");
      root.style.setProperty("--secondary-gradient", "linear-gradient(135deg, #059669 0%, #10b981 100%)");
      root.style.setProperty("--header-bg", "rgba(2, 44, 34, 0.97)");
      root.style.setProperty("--header-border", "rgba(16, 185, 129, 0.3)");
      root.style.setProperty("--header-accent", "#10b981");
      root.style.setProperty("--sidebar-bg", "linear-gradient(180deg, rgba(6, 78, 59, 0.95) 0%, rgba(4, 120, 87, 0.92) 100%)");
      root.style.setProperty("--scrollbar-thumb", "rgba(16, 185, 129, 0.5)");
      root.style.setProperty("--shadow-color", "rgba(16, 185, 129, 0.3)");
      root.style.setProperty("--button-bg", "rgba(16, 185, 129, 0.2)");
      root.style.setProperty("--button-bg-hover", "rgba(16, 185, 129, 0.35)");
      root.style.setProperty("--hover-bg", "rgba(16, 185, 129, 0.15)");
      root.style.setProperty("--active-bg", "rgba(16, 185, 129, 0.3)");

    } else {
      root.style.setProperty("--primary", "#94a3b8");
      root.style.setProperty("--primary-gradient", "linear-gradient(135deg, #475569 0%, #334155 100%)");
      root.style.setProperty("--secondary-gradient", "linear-gradient(135deg, #334155 0%, #475569 100%)");
      root.style.setProperty("--header-bg", "rgba(15, 23, 42, 0.97)");
      root.style.setProperty("--header-border", "rgba(148, 163, 184, 0.1)");
      root.style.setProperty("--header-accent", "#475569");
      root.style.setProperty("--shadow-color", "rgba(0, 0, 0, 0.3)");
      root.style.setProperty("--shadow-color-hover", "rgba(0, 0, 0, 0.4)");
      root.style.setProperty("--button-bg", "rgba(148, 163, 184, 0.1)");
      root.style.setProperty("--button-bg-hover", "rgba(148, 163, 184, 0.2)");
      root.style.setProperty("--hover-bg", "rgba(148, 163, 184, 0.1)");
      root.style.setProperty("--active-bg", "rgba(148, 163, 184, 0.2)");
      root.style.setProperty("--primary-dark", "#2563eb");
      root.style.setProperty("--primary-light", "#60a5fa");
      root.style.setProperty("--success", "#059669");
      root.style.setProperty("--success-light", "#d1fae5");
      root.style.setProperty("--warning", "#d97706");
      root.style.setProperty("--warning-light", "#fef3c7");
      root.style.setProperty("--error", "#dc2626");
      root.style.setProperty("--error-light", "#fee2e2");
      root.style.setProperty("--bg-soft", "#f8fafc");
      root.style.setProperty("--text-primary", "#0f172a");
      root.style.setProperty("--text-secondary", "#475569");
    }
  }, [location]);

  return (
    <AnimatedBackground>
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Navbar 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          onSectionChange={setSelectedSection} // ← NUEVO
        />
        <Box sx={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Fichar />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <Admin 
                    sidebarOpen={sidebarOpen} 
                    onSidebarToggle={setSidebarOpen}
                    selectedSection={selectedSection}       
                    onSectionChange={setSelectedSection}     
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kiosco"
              element={
                <ProtectedRoute allowedRoles={["KIOSCO"]}>
                  <Kiosco 
                    sidebarOpen={sidebarOpen} 
                    onSidebarToggle={setSidebarOpen}
                    selectedSection={selectedSection}       
                    onSectionChange={setSelectedSection}    
                  />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Box>
        <Footer />
      </Box>
    </AnimatedBackground>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;