import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  ChevronDown,
  ChevronRight,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

// Navigation structure by categories
const navCategories = [
  {
    id: "supervision",
    label: "Supervisión",
    icon: Eye,
    items: [
      { path: "/supervision", label: "Centro", icon: Activity },
      { path: "/alertas", label: "Alertas", icon: Bell },
      { path: "/timeline", label: "Timeline", icon: Clock },
      { path: "/inconsistencias", label: "Motor POS vs Real", icon: AlertTriangle },
    ],
  },
  {
    id: "operacion",
    label: "Operación",
    icon: ShoppingCart,
    items: [
      { path: "/caja", label: "Caja", icon: DollarSign },
      { path: "/pos", label: "Facturación", icon: ShoppingCart },
      { path: "/menu", label: "Mi Menú", icon: Menu },
      { path: "/mesas", label: "Mesas", icon: LayoutGrid },
      { path: "/inventario/ingreso", label: "Ingreso Stock", icon: Package },
      { path: "/inventario/historial-ingresos", label: "Historial Ingresos", icon: Calendar },
      { path: "/inventario/historial", label: "Kardex", icon: History },
      { path: "/proveedores", label: "Proveedores", icon: Building2 },
      { path: "/recetas", label: "Recetas", icon: ChefHat },
    ],
  },
  {
    id: "seguridad",
    label: "Seguridad",
    icon: Shield,
    items: [
      { path: "/camaras", label: "Cámaras", icon: Camera },
      { path: "/sensores", label: "Sensores", icon: Radio },
      { path: "/audio", label: "Audio", icon: Volume2 },
    ],
  },
  {
    id: "administracion",
    label: "Administración",
    icon: Settings,
    items: [
      { path: "/turnos", label: "Turnos/Checklists", icon: ClipboardCheck },
      { path: "/reportes", label: "Reportes", icon: BarChart3 },
      { path: "/historial-diario", label: "Ventas Diarias", icon: Calendar },
      { path: "/utilidad", label: "Utilidad", icon: TrendingUp },
      { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
      { path: "/configuracion-fiscal", label: "Datos Fiscales", icon: Receipt },
      { path: "/configuracion-cuenta", label: "Mi Cuenta", icon: Settings },
    ],
  },
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
  const [openCategories, setOpenCategories] = useState<string[]>(["supervision", "operacion"]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  // Determine which category should be open based on current path
  useEffect(() => {
    for (const category of navCategories) {
      if (category.items.some(item => location.pathname === item.path || location.pathname.startsWith(item.path + '/'))) {
        if (!openCategories.includes(category.id)) {
          setOpenCategories(prev => [...prev, category.id]);
        }
        break;
      }
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error al cerrar sesión");
    } else {
      toast.success("Sesión cerrada");
      navigate("/auth");
    }
  };

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const isPathActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Floating open button when sidebar is closed */}
      {!sidebarOpen && (
        <Button
          variant="outline"
          size="icon"
          className="fixed top-3 left-3 z-50 h-10 w-10 rounded-lg shadow-md bg-card border"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Sidebar Navigation */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-card border-r flex flex-col sticky top-0 h-screen overflow-hidden transition-all duration-200`}>
        {/* Logo Header */}
        <div 
          className="p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between min-w-[16rem]"
        >
          <div className="flex items-center gap-3" onClick={() => navigate("/supervision")}>
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Box className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{storeName || "AnalogueCo"}</h1>
              <p className="text-xs text-muted-foreground">Supervisión Operativa</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setSidebarOpen(false)}
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          {/* Home link */}
          <Button
            variant={location.pathname === "/home" ? "secondary" : "ghost"}
            className="w-full justify-start mb-2"
            onClick={() => navigate("/home")}
          >
            <Home className="h-4 w-4 mr-2" />
            Inicio
          </Button>

          {/* Categories */}
          {navCategories.map((category) => {
            const CategoryIcon = category.icon;
            const isOpen = openCategories.includes(category.id);
            const hasActiveItem = category.items.some(item => isPathActive(item.path));

            return (
              <Collapsible
                key={category.id}
                open={isOpen}
                onOpenChange={() => toggleCategory(category.id)}
                className="mb-1"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant={hasActiveItem ? "secondary" : "ghost"}
                    className="w-full justify-between"
                  >
                    <span className="flex items-center">
                      <CategoryIcon className="h-4 w-4 mr-2" />
                      {category.label}
                    </span>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 mt-1 space-y-1">
                  {category.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isPathActive(item.path);
                    return (
                      <Button
                        key={item.path}
                        variant={isActive ? "secondary" : "ghost"}
                        size="sm"
                        className={`w-full justify-start ${isActive ? 'bg-primary/10 text-primary' : ''}`}
                        onClick={() => navigate(item.path)}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {item.label}
                      </Button>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}

          {/* Admin section */}
          {isAdmin && (
            <Collapsible className="mt-4 pt-4 border-t">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </span>
                  <Badge variant="outline" className="text-xs">Admin</Badge>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 mt-1 space-y-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Button
                      key={item.path}
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => navigate(item.path)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">
                  {isAdmin ? "Administrador" : "Usuario"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {mounted && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
