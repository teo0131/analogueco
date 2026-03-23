import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserRole } from "@/hooks/useUserRole";
import {
  LogOut, Package, History, Building2, ChefHat, BarChart3,
  Menu, Calendar, ShoppingCart, Home, Sun, Moon, Receipt,
  Users, MessageSquare, TrendingUp, Settings, LayoutGrid, Shield,
  Bell, Clock, AlertTriangle, Camera, Radio, Volume2,
  ClipboardCheck, Activity, DollarSign, Crown, ChevronDown,
  Warehouse, LineChart, UserCheck, Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import analoguecoLogo from "@/assets/analogueco-logo.png";
import analoguecoIcon from "@/assets/analogueco-icon.png";

// ── Types ──────────────────────────────────────────────────────────────────────
type AccessLevel = { user: boolean; admin: boolean; owner: boolean };

interface NavLeaf extends AccessLevel {
  path: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  admin: boolean;   // visible to admin+owner
  owner: boolean;   // visible only to owner
  user: boolean;    // visible to all (including user role)
  items: NavLeaf[];
}

// ── Navigation structure ───────────────────────────────────────────────────────

/** Always-visible top-level links */
const pinnedItems: NavLeaf[] = [
  { path: "/pos",   label: "Facturación", icon: ShoppingCart, user: true,  admin: true,  owner: true },
  { path: "/caja",  label: "Caja",        icon: DollarSign,   user: true,  admin: true,  owner: true },
  { path: "/mesas", label: "Mesas",       icon: LayoutGrid,   user: false, admin: true,  owner: true },
];

/** Grouped dropdown menus */
const navGroups: NavGroup[] = [
  {
    label: "Inventario",
    icon: Warehouse,
    user: false, admin: true, owner: true,
    items: [
      { path: "/menu",                          label: "Mi Menú",            icon: Menu,     user: false, admin: true, owner: true },
      { path: "/proveedores",                   label: "Proveedores",        icon: Building2,user: false, admin: true, owner: true },
      { path: "/recetas",                       label: "Recetas",            icon: ChefHat,  user: false, admin: true, owner: true },
      { path: "/inventario/ingreso",            label: "Ingreso",            icon: Package,  user: false, admin: true, owner: true },
      { path: "/inventario/historial-ingresos", label: "Historial Ingresos", icon: Calendar, user: false, admin: true, owner: true },
      { path: "/inventario/historial",          label: "Kardex",             icon: History,  user: false, admin: true, owner: true },
    ],
  },
  {
    label: "Finanzas",
    icon: LineChart,
    user: false, admin: true, owner: true,
    items: [
      { path: "/historial-diario", label: "Ventas Diarias", icon: Calendar,  user: false, admin: true, owner: true },
      { path: "/utilidad",         label: "Utilidad",       icon: TrendingUp,user: false, admin: true, owner: true },
      { path: "/dashboard",        label: "Dashboard",      icon: BarChart3, user: false, admin: true, owner: true },
      { path: "/reportes",         label: "Reportes",       icon: BarChart3, user: false, admin: true, owner: true },
    ],
  },
  {
    label: "Supervisión",
    icon: Activity,
    user: false, admin: true, owner: true,
    items: [
      { path: "/supervision",    label: "Centro",            icon: Activity,      user: false, admin: true, owner: true },
      { path: "/alertas",        label: "Alertas",           icon: Bell,          user: false, admin: true, owner: true },
      { path: "/timeline",       label: "Timeline",          icon: Clock,         user: false, admin: true, owner: true },
      { path: "/inconsistencias",label: "Motor POS vs Real", icon: AlertTriangle, user: false, admin: true, owner: true },
    ],
  },
  {
    label: "Seguridad",
    icon: Camera,
    user: false, admin: true, owner: true,
    items: [
      { path: "/camaras",  label: "Cámaras",  icon: Camera,  user: false, admin: true, owner: true },
      { path: "/sensores", label: "Sensores", icon: Radio,   user: false, admin: true, owner: true },
      { path: "/audio",    label: "Audio",    icon: Volume2, user: false, admin: true, owner: true },
    ],
  },
  {
    label: "RRHH",
    icon: UserCheck,
    user: false, admin: true, owner: true,
    items: [
      { path: "/rrhh/empleados",  label: "Empleados",  icon: Users,      user: false, admin: true, owner: true },
      { path: "/rrhh/asistencia", label: "Asistencia", icon: Clock,      user: false, admin: true, owner: true },
      { path: "/rrhh/nomina",     label: "Nómina",     icon: Briefcase,  user: false, admin: true, owner: true },
      { path: "/kiosko",          label: "Kiosko",     icon: UserCheck,  user: true,  admin: true, owner: true },
    ],
  },
  {
    label: "Operaciones",
    icon: ClipboardCheck,
    user: true, admin: true, owner: true,
    items: [
      { path: "/turnos", label: "Turnos y Checklists", icon: ClipboardCheck, user: true,  admin: true, owner: true },
    ],
  },
  {
    label: "Administración",
    icon: Crown,
    user: false, admin: false, owner: true,
    items: [
      { path: "/configuracion-fiscal",  label: "Datos Fiscales", icon: Receipt,      user: false, admin: false, owner: true },
      { path: "/admin/usuarios",        label: "Usuarios",       icon: Users,        user: false, admin: false, owner: true },
      { path: "/admin/chat-insights",   label: "Chat IA",        icon: MessageSquare,user: false, admin: false, owner: true },
    ],
  },
];

// ── Component ──────────────────────────────────────────────────────────────────
const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { isAdmin, isOwner } = useUserRole();
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState("");
  const [storeName, setStoreName] = useState("");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserName(user.email?.split("@")[0] || "Usuario");
      const { data } = await supabase
        .from("user_settings")
        .select("store_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.store_name) setStoreName(data.store_name);
    };
    loadUserData();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { toast.error("Error al cerrar sesión"); }
    else { toast.success("Sesión cerrada"); navigate("/auth"); }
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const canSeeLeaf = (item: AccessLevel) => {
    if (isOwner) return item.owner;
    if (isAdmin) return item.admin;
    return item.user;
  };

  const canSeeGroup = (group: NavGroup) => {
    if (isOwner) return group.owner;
    if (isAdmin) return group.admin;
    return group.user;
  };

  // Check if any item in a group is the current active route
  const groupIsActive = (group: NavGroup) =>
    group.items.some(i => isActive(i.path));

  // Flat nav link
  const NavBtn = ({ path, label, icon: Icon }: { path: string; label: string; icon: React.ElementType }) => (
    <button
      onClick={() => navigate(path)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap
        ${isActive(path)
          ? "bg-primary text-primary-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
      style={!isActive(path) ? { color: "hsl(0 0% 82%)" } : undefined}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </button>
  );

  // Dropdown group button
  const GroupDropdown = ({ group }: { group: NavGroup }) => {
    const visibleItems = group.items.filter(canSeeLeaf);
    if (visibleItems.length === 0) return null;

    const active = groupIsActive(group);
    const Icon = group.icon;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap
              ${active
                ? "bg-primary text-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {group.label}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-44">
          <DropdownMenuLabel className="text-xs text-muted-foreground">{group.label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {visibleItems.map((item) => {
            const ItemIcon = item.icon;
            return (
              <DropdownMenuItem
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`gap-2 cursor-pointer ${isActive(item.path) ? "bg-accent" : ""}`}
              >
                <ItemIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                {item.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-sidebar-background border-b-2 border-primary/40 sticky top-0 z-40 shadow-[0_2px_12px_rgba(30,94,255,0.12)]">
        <div className="flex items-center gap-1 px-4 py-2.5">

          {/* Logo */}
          <button
            className="flex items-center gap-2 mr-3 shrink-0"
            onClick={() => navigate(isAdmin || isOwner ? "/supervision" : "/pos")}
          >
            <img
              src={analoguecoIcon}
              alt="AnalogueCo"
              className="h-8 w-8 shrink-0 object-contain"
              style={{ mixBlendMode: "screen" }}
            />
            <div className="text-left hidden md:block">
              <p className="text-xs leading-tight flex items-center gap-1" style={{ color: "hsl(0 0% 55%)", fontFamily: "'Space Grotesk', monospace", fontSize: "10px", letterSpacing: "0.04em" }}>
                {isOwner
                  ? <><Crown className="h-3 w-3" style={{ color: "hsl(224 100% 65%)" }} />{userName}</>
                  : isAdmin
                  ? <><Shield className="h-3 w-3" style={{ color: "hsl(224 100% 65%)" }} />{userName}</>
                  : userName}
              </p>
            </div>
          </button>

          <div className="w-px h-5 bg-sidebar-border mx-1 shrink-0" />

          {/* Pinned direct links */}
          <nav className="flex items-center gap-1 flex-1 flex-wrap">
            <NavBtn path="/home" label="Inicio" icon={Home} />

            {pinnedItems.filter(canSeeLeaf).map((item) => (
              <NavBtn key={item.path} {...item} />
            ))}

            <div className="w-px h-5 bg-sidebar-border mx-1 shrink-0" />

            {/* Grouped dropdowns */}
            {navGroups.filter(canSeeGroup).map((group) => (
              <GroupDropdown key={group.label} group={group} />
            ))}

            <div className="w-px h-5 bg-sidebar-border mx-1 shrink-0" />
            <NavBtn path="/configuracion-cuenta" label="Mi Cuenta" icon={Settings} />
          </nav>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
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
      </header>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
