import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  TrendingUp,
  Clock,
  Users,
  DollarSign,
  Eye,
  Bell,
  ArrowRight,
  Camera,
  Radio,
  Volume2,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Demo data - simulated for MVP
const demoData = {
  trustIndex: 87,
  statusIndicators: {
    operacion: { status: "ok", label: "Operación", description: "Flujo normal" },
    seguridad: { status: "ok", label: "Seguridad", description: "Sin incidentes" },
    servicio: { status: "warning", label: "Servicio", description: "Demora en caja" },
    caja: { status: "ok", label: "Caja", description: "Arqueo correcto" },
  },
  activeAlerts: [
    {
      id: 1,
      type: "warning",
      title: "Tiempo de espera alto",
      description: "Fila en caja principal > 5 min",
      time: "Hace 12 min",
      priority: "media",
    },
    {
      id: 2,
      type: "info",
      title: "Pico de flujo detectado",
      description: "32 personas en tienda (promedio: 18)",
      time: "Hace 25 min",
      priority: "baja",
    },
  ],
  recentEvents: [
    { id: 1, type: "venta", description: "Venta #1247 - $45,000", time: "10:32", icon: DollarSign },
    { id: 2, type: "sensor", description: "Entrada principal: 3 personas", time: "10:30", icon: Users },
    { id: 3, type: "camara", description: "Zona caja: Personal presente", time: "10:28", icon: Eye },
    { id: 4, type: "venta", description: "Venta #1246 - $23,500", time: "10:25", icon: DollarSign },
    { id: 5, type: "operacion", description: "Checklist apertura completado", time: "08:00", icon: CheckCircle },
  ],
  inconsistencies: [
    {
      id: 1,
      type: "Venta sin presencia",
      description: "Venta registrada sin cliente visible en cámara",
      confidence: "media",
      time: "Ayer 14:32",
      status: "pendiente",
    },
  ],
  metrics: {
    ventasHoy: 1245000,
    ventasAyer: 1180000,
    clientesHoy: 87,
    clientesAyer: 72,
    ticketPromedio: 14310,
    alertasResueltas: 12,
    alertasPendientes: 2,
  },
};

const StatusIndicator = ({ status, label, description }: { status: string; label: string; description: string }) => {
  const getStatusColor = (s: string) => {
    switch (s) {
      case "ok": return "bg-green-500";
      case "warning": return "bg-yellow-500";
      case "error": return "bg-red-500";
      default: return "bg-muted";
    }
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case "ok": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning": return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "error": return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
      <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {getStatusIcon(status)}
          <span className="font-medium text-sm">{label}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
};

const CentroSupervision = () => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const getTrustColor = (value: number) => {
    if (value >= 80) return "text-green-500";
    if (value >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Centro de Supervisión</h1>
          <p className="text-muted-foreground">
            Tu negocio funciona incluso cuando no estás
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            En vivo
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Trust Index + Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trust Index Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Índice de Confianza
            </CardTitle>
            <CardDescription>
              Basado en operación, ventas y eventos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-4">
              <span className={`text-6xl font-bold ${getTrustColor(demoData.trustIndex)}`}>
                {demoData.trustIndex}
              </span>
              <span className="text-muted-foreground text-sm mt-1">de 100</span>
              <Progress value={demoData.trustIndex} className="w-full mt-4 h-3" />
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Última actualización: hace 2 minutos
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status Indicators */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Estado General Hoy</CardTitle>
            <CardDescription>Semáforos de operación en tiempo real</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(demoData.statusIndicators).map(([key, value]) => (
                <StatusIndicator key={key} {...value} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="alertas" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="alertas" className="gap-1">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alertas</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="inconsistencias" className="gap-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">POS vs Real</span>
          </TabsTrigger>
          <TabsTrigger value="metricas" className="gap-1">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Métricas</span>
          </TabsTrigger>
        </TabsList>

        {/* Alertas Tab */}
        <TabsContent value="alertas" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Alertas Activas ({demoData.activeAlerts.length})</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate("/alertas")}>
              Ver todas <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {demoData.activeAlerts.map((alert) => (
              <Card key={alert.id} className={`border-l-4 ${
                alert.type === 'warning' ? 'border-l-yellow-500' : 
                alert.type === 'error' ? 'border-l-red-500' : 'border-l-blue-500'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className={`h-4 w-4 ${
                          alert.type === 'warning' ? 'text-yellow-500' : 
                          alert.type === 'error' ? 'text-red-500' : 'text-blue-500'
                        }`} />
                        <span className="font-medium">{alert.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {alert.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">{alert.time}</span>
                      <div className="mt-2">
                        <Button size="sm" variant="outline">Ver evidencia</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Eventos Recientes</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate("/timeline")}>
              Ver todos <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {demoData.recentEvents.map((event, index) => {
                  const Icon = event.icon;
                  return (
                    <div key={event.id} className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-medium text-muted-foreground">{event.time}</span>
                        {index < demoData.recentEvents.length - 1 && (
                          <div className="w-px h-8 bg-border mt-1" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-1 p-2 rounded-lg bg-muted/50">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{event.description}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inconsistencias Tab */}
        <TabsContent value="inconsistencias" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Inconsistencias Detectadas</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate("/inconsistencias")}>
              Ver motor <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          {demoData.inconsistencies.length > 0 ? (
            <div className="space-y-3">
              {demoData.inconsistencies.map((item) => (
                <Card key={item.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">{item.type}</span>
                          <Badge variant="outline">Confianza: {item.confidence}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge variant={item.status === 'pendiente' ? 'destructive' : 'secondary'}>
                          {item.status}
                        </Badge>
                        <Button size="sm" variant="outline">Revisar</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-muted-foreground">No hay inconsistencias pendientes</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Métricas Tab */}
        <TabsContent value="metricas" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs">Ventas Hoy</span>
                </div>
                <p className="text-2xl font-bold">${(demoData.metrics.ventasHoy / 1000).toFixed(0)}k</p>
                <p className="text-xs text-green-500">
                  +{((demoData.metrics.ventasHoy - demoData.metrics.ventasAyer) / demoData.metrics.ventasAyer * 100).toFixed(1)}% vs ayer
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xs">Clientes Hoy</span>
                </div>
                <p className="text-2xl font-bold">{demoData.metrics.clientesHoy}</p>
                <p className="text-xs text-green-500">
                  +{((demoData.metrics.clientesHoy - demoData.metrics.clientesAyer) / demoData.metrics.clientesAyer * 100).toFixed(1)}% vs ayer
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Activity className="h-4 w-4" />
                  <span className="text-xs">Ticket Promedio</span>
                </div>
                <p className="text-2xl font-bold">${(demoData.metrics.ticketPromedio / 1000).toFixed(1)}k</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Bell className="h-4 w-4" />
                  <span className="text-xs">Alertas</span>
                </div>
                <p className="text-2xl font-bold">
                  <span className="text-green-500">{demoData.metrics.alertasResueltas}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-yellow-500">{demoData.metrics.alertasPendientes}</span>
                </p>
                <p className="text-xs text-muted-foreground">resueltas / pendientes</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate("/camaras")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">Cámaras</p>
              <p className="text-sm text-muted-foreground">4 online • Vision activa</p>
            </div>
            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate("/sensores")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Radio className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">Sensores</p>
              <p className="text-sm text-muted-foreground">6 activos • 142 eventos hoy</p>
            </div>
            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate("/audio")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-muted">
              <Volume2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Audio</p>
              <p className="text-sm text-muted-foreground">Módulo opcional</p>
            </div>
            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Demo Mode Banner */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="p-4 flex items-center gap-3">
          <Eye className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">Modo Demo Activo</p>
            <p className="text-xs text-muted-foreground">
              Los datos mostrados son simulados. Conecta cámaras y sensores para datos reales.
            </p>
          </div>
          <Button variant="outline" size="sm">Configurar dispositivos</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CentroSupervision;
