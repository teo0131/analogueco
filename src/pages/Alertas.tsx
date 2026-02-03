import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  Search,
  XCircle,
  Camera,
  DollarSign,
  Users,
  Shield,
} from "lucide-react";

// Demo alerts data
const demoAlerts = [
  {
    id: 1,
    type: "warning",
    category: "servicio",
    title: "Tiempo de espera alto en caja",
    description: "La fila en caja principal ha superado los 5 minutos de espera promedio",
    time: "Hace 12 min",
    timestamp: new Date(Date.now() - 12 * 60000),
    priority: "media",
    status: "activa",
    evidence: true,
    suggestedAction: "Verificar disponibilidad de personal para abrir segunda caja",
  },
  {
    id: 2,
    type: "info",
    category: "operacion",
    title: "Pico de flujo detectado",
    description: "32 personas en tienda (promedio histórico: 18)",
    time: "Hace 25 min",
    timestamp: new Date(Date.now() - 25 * 60000),
    priority: "baja",
    status: "activa",
    evidence: true,
    suggestedAction: "Considerar refuerzo de personal en horario pico",
  },
  {
    id: 3,
    type: "error",
    category: "seguridad",
    title: "Acceso fuera de horario",
    description: "Sensor de puerta principal activado a las 23:45 (horario: 08:00-21:00)",
    time: "Ayer 23:45",
    timestamp: new Date(Date.now() - 24 * 60 * 60000),
    priority: "alta",
    status: "resuelta",
    evidence: true,
    suggestedAction: "Revisar grabación de cámara y verificar identidad",
    resolution: "Verificado: empleado olvidó objeto personal",
  },
  {
    id: 4,
    type: "warning",
    category: "caja",
    title: "Anulaciones frecuentes",
    description: "5 anulaciones en las últimas 2 horas (promedio: 1)",
    time: "Hace 1 hora",
    timestamp: new Date(Date.now() - 60 * 60000),
    priority: "media",
    status: "activa",
    evidence: false,
    suggestedAction: "Revisar motivos de anulación con operador de caja",
  },
  {
    id: 5,
    type: "info",
    category: "operacion",
    title: "Checklist de apertura completado",
    description: "Todos los items verificados correctamente",
    time: "Hoy 08:15",
    timestamp: new Date().setHours(8, 15, 0, 0),
    priority: "baja",
    status: "resuelta",
    evidence: false,
    suggestedAction: null,
  },
];

const AlertCard = ({ alert, onResolve }: { alert: typeof demoAlerts[0]; onResolve: (id: number) => void }) => {
  const getTypeStyles = (type: string) => {
    switch (type) {
      case "error": return { border: "border-l-red-500", icon: XCircle, iconColor: "text-red-500" };
      case "warning": return { border: "border-l-yellow-500", icon: AlertTriangle, iconColor: "text-yellow-500" };
      default: return { border: "border-l-blue-500", icon: Bell, iconColor: "text-blue-500" };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "seguridad": return Shield;
      case "caja": return DollarSign;
      case "servicio": return Users;
      default: return Clock;
    }
  };

  const styles = getTypeStyles(alert.type);
  const Icon = styles.icon;
  const CategoryIcon = getCategoryIcon(alert.category);

  return (
    <Card className={`border-l-4 ${styles.border} ${alert.status === 'resuelta' ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Icon className={`h-4 w-4 ${styles.iconColor}`} />
              <span className="font-medium">{alert.title}</span>
              <Badge variant="outline" className="text-xs">
                <CategoryIcon className="h-3 w-3 mr-1" />
                {alert.category}
              </Badge>
              <Badge 
                variant={alert.priority === 'alta' ? 'destructive' : alert.priority === 'media' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {alert.priority}
              </Badge>
              {alert.status === 'resuelta' && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Resuelta
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
            {alert.suggestedAction && alert.status !== 'resuelta' && (
              <div className="bg-muted/50 p-2 rounded text-xs mb-2">
                <span className="font-medium">Acción sugerida:</span> {alert.suggestedAction}
              </div>
            )}
            {alert.resolution && (
              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-xs text-green-700 dark:text-green-400">
                <span className="font-medium">Resolución:</span> {alert.resolution}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">{alert.time}</p>
          </div>
          <div className="flex flex-col gap-2">
            {alert.evidence && (
              <Button size="sm" variant="outline" className="gap-1">
                <Eye className="h-3 w-3" />
                Evidencia
              </Button>
            )}
            {alert.status !== 'resuelta' && (
              <Button size="sm" variant="default" onClick={() => onResolve(alert.id)}>
                <CheckCircle className="h-3 w-3 mr-1" />
                Resolver
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Alertas = () => {
  const [alerts, setAlerts] = useState(demoAlerts);
  const [filter, setFilter] = useState("todas");
  const [priorityFilter, setPriorityFilter] = useState("todas");
  const [searchTerm, setSearchTerm] = useState("");

  const handleResolve = (id: number) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'resuelta' as const } : a
    ));
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter !== "todas" && alert.category !== filter) return false;
    if (priorityFilter !== "todas" && alert.priority !== priorityFilter) return false;
    if (searchTerm && !alert.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const activeAlerts = filteredAlerts.filter(a => a.status === 'activa');
  const resolvedAlerts = filteredAlerts.filter(a => a.status === 'resuelta');

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Bell className="h-7 w-7" />
            Alertas
          </h1>
          <p className="text-muted-foreground">
            Gestión de alertas operativas y de seguridad
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="gap-1">
            {activeAlerts.length} activas
          </Badge>
          <Badge variant="secondary" className="gap-1">
            {resolvedAlerts.length} resueltas hoy
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar alertas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="seguridad">Seguridad</SelectItem>
                  <SelectItem value="operacion">Operación</SelectItem>
                  <SelectItem value="servicio">Servicio</SelectItem>
                  <SelectItem value="caja">Caja</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Tabs */}
      <Tabs defaultValue="activas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activas" className="gap-1">
            <AlertTriangle className="h-4 w-4" />
            Activas ({activeAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="resueltas" className="gap-1">
            <CheckCircle className="h-4 w-4" />
            Resueltas ({resolvedAlerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activas" className="space-y-3">
          {activeAlerts.length > 0 ? (
            activeAlerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} onResolve={handleResolve} />
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="font-medium">No hay alertas activas</p>
                <p className="text-sm text-muted-foreground">Todas las alertas han sido atendidas</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resueltas" className="space-y-3">
          {resolvedAlerts.length > 0 ? (
            resolvedAlerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} onResolve={handleResolve} />
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">No hay alertas resueltas</p>
                <p className="text-sm text-muted-foreground">Las alertas resueltas aparecerán aquí</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Alertas;
