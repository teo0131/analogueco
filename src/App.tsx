import { Toaster } from "@/components/ui/toaster";
import MenuManagement from "./pages/MenuManagement";
import HistorialDiario from "./pages/HistorialDiario";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import POS from "./pages/POS";
import Landing from "./pages/Landing";
import IngresoUnificado from "./pages/IngresoUnificado";
import HistorialIngresos from "./pages/HistorialIngresos";
import HistorialMovimientos from "./pages/HistorialMovimientos";
import ProveedoresManagement from "./pages/ProveedoresManagement";
import RecetasManagement from "./pages/RecetasManagement";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import ConfiguracionFiscal from "./pages/ConfiguracionFiscal";
import ConfiguracionCuenta from "./pages/ConfiguracionCuenta";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import PendingApproval from "./pages/PendingApproval";
import AdminUsuarios from "./pages/AdminUsuarios";
import AdminChatInsights from "./pages/AdminChatInsights";
import UtilidadDiaria from "./pages/UtilidadDiaria";
import ConfiguracionMesas from "./pages/ConfiguracionMesas";
import AbrirCaja from "./pages/AbrirCaja";

// New modules - Supervisión y Seguridad
import CentroSupervision from "./pages/CentroSupervision";
import Alertas from "./pages/Alertas";
import TimelineEventos from "./pages/TimelineEventos";
import MotorInconsistencias from "./pages/MotorInconsistencias";
import Camaras from "./pages/Camaras";
import Sensores from "./pages/Sensores";
import AudioMonitoreo from "./pages/AudioMonitoreo";
import TurnosChecklists from "./pages/TurnosChecklists";
import ReportesAvanzados from "./pages/ReportesAvanzados";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          
          {/* Redirect root to Centro de Supervisión (new home) */}
          <Route path="/" element={<Navigate to="/supervision" replace />} />
          
          {/* Protected routes with AppLayout */}
          <Route 
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Landing/Home */}
            <Route path="/home" element={<Landing />} />
            
            {/* SUPERVISIÓN - Core AnalogueCo */}
            <Route path="/supervision" element={<CentroSupervision />} />
            <Route path="/alertas" element={<Alertas />} />
            <Route path="/timeline" element={<TimelineEventos />} />
            <Route path="/inconsistencias" element={<MotorInconsistencias />} />
            
            {/* OPERACIÓN - Existing modules */}
            <Route path="/pos" element={<POS />} />
            <Route path="/menu" element={<MenuManagement />} />
            <Route path="/mesas" element={<ConfiguracionMesas />} />
            <Route path="/proveedores" element={<ProveedoresManagement />} />
            <Route path="/recetas" element={<RecetasManagement />} />
            <Route path="/inventario/ingreso" element={<IngresoUnificado />} />
            <Route path="/inventario/historial-ingresos" element={<HistorialIngresos />} />
            <Route path="/inventario/historial" element={<HistorialMovimientos />} />
            
            {/* SEGURIDAD - New modules */}
            <Route path="/camaras" element={<Camaras />} />
            <Route path="/sensores" element={<Sensores />} />
            <Route path="/audio" element={<AudioMonitoreo />} />
            
            {/* ADMINISTRACIÓN */}
            <Route path="/turnos" element={<TurnosChecklists />} />
            <Route path="/reportes" element={<ReportesAvanzados />} />
            <Route path="/historial-diario" element={<HistorialDiario />} />
            <Route path="/utilidad" element={<UtilidadDiaria />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/configuracion-fiscal" element={<ConfiguracionFiscal />} />
            <Route path="/configuracion-cuenta" element={<ConfiguracionCuenta />} />
            
            {/* Admin routes */}
            <Route path="/admin/usuarios" element={<AdminUsuarios />} />
            <Route path="/admin/chat-insights" element={<AdminChatInsights />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
