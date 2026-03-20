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
  Shield,
  Eye,
  Bell,
  Clock,
  AlertTriangle,
  Camera,
  Radio,
  Volume2,
  ClipboardCheck,
  Activity,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

const navRow1 = [
  { path: "/home",                        label: "Inicio",            icon: Home },
  { path: "/pos",                          label: "Facturación",       icon: ShoppingCart },
  { path: "/menu",                         label: "Mi Menú",           icon: Menu },
  { path: "/dashboard",                    label: "Dashboard",         icon: BarChart3 },
  { path: "/proveedores",                  label: "Proveedores",       icon: Building2 },
  { path: "/recetas",                      label: "Recetas",           icon: ChefHat },
  { path: "/inventario/ingreso",           label: "Ingreso",           icon: Package },
  { path: "/inventario/historial-ingresos",label: "Historial Ingresos",icon: Calendar },
];

const navRow2 = [
  { path: "/caja",                         label: "Caja",              icon: DollarSign },
  { path: "/inventario/historial",         label: "Kardex",            icon: History },
  { path: "/historial-diario",             label: "Ventas Diarias",    icon: Calendar },
  { path: "/utilidad",                     label: "Utilidad",          icon: TrendingUp },
  { path: "/mesas",                        label: "Mesas",             icon: LayoutGrid },
  { path: "/configuracion-fiscal",         label: "Datos Fiscales",    icon: Receipt },
  { path: "/configuracion-cuenta",         label: "Mi Cuenta",         icon: Settings },
];

const navSupervision = [
  { path: "/supervision",   label: "Supervisión",        icon: Activity },
  { path: "/alertas",       label: "Alertas",            icon: Bell },
  { path: "/timeline",      label: "Timeline",           icon: Clock },
  { path: "/inconsistencias",label: "Motor POS vs Real", icon: AlertTriangle },
  { path: "/camaras",       label: "Cámaras",            icon: Camera },
  { path: "/sensores",      label: "Sensores",           icon: Radio },
  { path: "/audio",         label: "Audio",              icon: Volume2 },
  { path: "/turnos",        label: "Turnos",             icon: ClipboardCheck },
  { path: "/reportes",      label: "Reportes",           icon: BarChart3 },
];

const adminNavItems = [
  { path: "/admin/usuarios",      label: "Usuarios", icon: Users },
  { path: "/admin/chat-insights", label: "Chat IA",  icon: MessageSquare },
];

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { isAdmin } = useUserRole();
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState("");
  const [storeName, setStoreName] = useState("");

  useEffect(() => { setMounted(true); }, []);

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
      if (settingsData?.store_name) setStoreName(settingsData.store_name);
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

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const NavBtn = ({ path, label, icon: Icon }: { path: string; label: string; icon: React.ElementType }) => (
    <button
      onClick={() => navigate(path)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap
        ${isActive(path)
          ? "bg-primary text-primary-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-sidebar-background border-b border-sidebar-border sticky top-0 z-40">
        {/* Row 1: Logo + Main nav + User controls */}
        <div className="flex items-center gap-2 px-4 py-2">
          {/* Logo */}
          <button
            className="flex items-center gap-2 mr-4 shrink-0"
            onClick={() => navigate("/supervision")}
          >
            <div className="h-9 w-9 bg-primary rounded-lg flex items-center justify-center">
              <Box className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-bold text-sidebar-foreground leading-tight">
                {storeName || "AnalogueCo"}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">Hola, {userName}</p>
            </div>
          </button>

          {/* Row 1 nav items */}
          <nav className="flex items-center gap-1 flex-wrap flex-1">
            {navRow1.map((item) => (
              <NavBtn key={item.path} {...item} />
            ))}
          </nav>

          {/* User controls */}
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-sidebar-foreground hover:bg-sidebar-accent gap-1.5"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>

        {/* Row 2: Secondary nav */}
        <div className="flex items-center gap-1 px-4 py-1.5 border-t border-sidebar-border/60 flex-wrap">
          {navRow2.map((item) => (
            <NavBtn key={item.path} {...item} />
          ))}

          {/* Supervision section */}
          <div className="w-px h-5 bg-sidebar-border mx-1 hidden sm:block" />
          {navSupervision.map((item) => (
            <NavBtn key={item.path} {...item} />
          ))}

          {/* Admin section */}
          {isAdmin && (
            <>
              <div className="w-px h-5 bg-sidebar-border mx-1 hidden sm:block" />
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              {adminNavItems.map((item) => (
                <NavBtn key={item.path} {...item} />
              ))}
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
