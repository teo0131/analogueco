import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import IngresoInventario from "./pages/IngresoInventario";
import ProductosManagement from "./pages/ProductosManagement";
import HistorialMovimientos from "./pages/HistorialMovimientos";
import ProveedoresManagement from "./pages/ProveedoresManagement";
import RecetasManagement from "./pages/RecetasManagement";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/inventario/ingreso" 
            element={
              <ProtectedRoute>
                <IngresoInventario />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/productos" 
            element={
              <ProtectedRoute>
                <ProductosManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/inventario/historial" 
            element={
              <ProtectedRoute>
                <HistorialMovimientos />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/proveedores" 
            element={
              <ProtectedRoute>
                <ProveedoresManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recetas" 
            element={
              <ProtectedRoute>
                <RecetasManagement />
              </ProtectedRoute>
            } 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
