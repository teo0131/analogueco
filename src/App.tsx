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
import IngresoInventario from "./pages/IngresoInventario";
import ProductosManagement from "./pages/ProductosManagement";
import HistorialMovimientos from "./pages/HistorialMovimientos";
import ProveedoresManagement from "./pages/ProveedoresManagement";
import RecetasManagement from "./pages/RecetasManagement";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          
          {/* Redirect root to /home */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          
          {/* Protected routes with AppLayout */}
          <Route 
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/home" element={<Landing />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/menu" element={<MenuManagement />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/productos" element={<ProductosManagement />} />
            <Route path="/proveedores" element={<ProveedoresManagement />} />
            <Route path="/recetas" element={<RecetasManagement />} />
            <Route path="/inventario/ingreso" element={<IngresoInventario />} />
            <Route path="/inventario/historial" element={<HistorialMovimientos />} />
            <Route path="/historial-diario" element={<HistorialDiario />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
