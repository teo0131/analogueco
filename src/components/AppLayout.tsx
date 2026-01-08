import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import {
  LogOut,
  Package,
  History,
  Building2,
  ChefHat,
  BarChart3,
  Menu,
  Calendar,
  Box,
  ShoppingCart,
  Home,
  Sun,
  Moon,
  Receipt,
  Users,
  MessageSquare,
  TrendingUp,
  Settings,
  LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";

const navItems = [
  { path: "/home", label: "Inicio", icon: Home },
  { path: "/pos", label: "Facturación", icon: ShoppingCart },
  { path: "/menu", label: "Mi Menú", icon: Menu },
  { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { path: "/proveedores", label: "Proveedores", icon: Building2 },
  { path: "/recetas", label: "Recetas", icon: ChefHat },
  { path: "/inventario/ingreso", label: "Ingreso", icon: Package },
  { path: "/inventario/historial-ingresos", label: "Historial Ingresos", icon: Calendar },
  { path: "/inventario/historial", label: "Kardex", icon: History },
  { path: "/historial-diario", label: "Ventas Diarias", icon: Calendar },
  { path: "/utilidad", label: "Utilidad", icon: TrendingUp },
  { path: "/mesas", label: "Mesas", icon: LayoutGrid },
  { path: "/configuracion-fiscal", label: "Datos Fiscales", icon: Receipt },
  { path: "/configuracion-cuenta", label: "Mi Cuenta", icon: Settings },
];

const adminNavItems = [
  { path: "/admin/usuarios", label: "Usuarios", icon: Users },
  { path: "/admin/chat-insights", label: "Chat IA", icon: MessageSquare },
];

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { isAdmin } = useUserRole();
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState("");
  const [storeName, setStoreName] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserName(user.email?.split("@")[0] || "Usuario");

      const { data: settingsData } = await supabase
        .from("user_settings")
        .select("store_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (settingsData?.store_name) {
        setStoreName(settingsData.store_name);
      }
    };

    loadUserData();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error al cerrar sesión");
    } else {
      toast.success("Sesión cerrada");
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation Banner */}
      <header className="bg-primary text-primary-foreground py-3 px-4 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div 
                className="h-9 w-9 bg-primary-foreground rounded-lg flex items-center justify-center cursor-pointer"
                onClick={() => navigate("/home")}
              >
                <Box className="h-5 w-5 text-primary" />
              </div>
              <div 
                className="hidden sm:block cursor-pointer"
                onClick={() => navigate("/home")}
              >
                <h1 className="text-lg font-bold tracking-tight">{storeName || "AnalogueCo"}</h1>
                <p className="text-xs opacity-80">Hola, {userName}</p>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 flex justify-center">
              <div className="flex flex-wrap gap-1 justify-center max-w-4xl">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.path}
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => navigate(item.path)}
                      className={`text-xs px-2 py-1 h-8 ${
                        isActive 
                          ? "bg-primary-foreground text-primary" 
                          : "text-primary-foreground hover:bg-primary-foreground/20"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 mr-1" />
                      <span className="hidden md:inline">{item.label}</span>
                    </Button>
                  );
                })}
                {isAdmin && adminNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.path}
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => navigate(item.path)}
                      className={`text-xs px-2 py-1 h-8 ${
                        isActive 
                          ? "bg-primary-foreground text-primary" 
                          : "text-primary-foreground hover:bg-primary-foreground/20"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 mr-1" />
                      <span className="hidden md:inline">{item.label}</span>
                    </Button>
                  );
                })}
              </div>
            </nav>

            <div className="flex items-center gap-2">
              {mounted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="text-primary-foreground hover:bg-primary-foreground/20"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
