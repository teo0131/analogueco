import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Camera,
  Eye,
  EyeOff,
  Settings,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Users,
  Clock,
  Shield,
  Maximize2,
  Grid3X3,
} from "lucide-react";

// Demo cameras data
const demoCameras = [
  {
    id: 1,
    name: "Cámara Caja Principal",
    zone: "caja",
    status: "online",
    lastEvent: "Persona detectada",
    lastEventTime: "Hace 2 min",
    detections: { people: 3, alerts: 0 },
    features: ["conteo", "presencia", "zona_interes"],
  },
  {
    id: 2,
    name: "Cámara Entrada",
    zone: "entrada",
    status: "online",
    lastEvent: "2 personas ingresaron",
    lastEventTime: "Hace 5 min",
    detections: { people: 142, alerts: 1 },
    features: ["conteo", "flujo", "intrusion"],
  },
  {
    id: 3,
    name: "Cámara Pasillo Central",
    zone: "pasillo",
    status: "online",
    lastEvent: "Flujo normal",
    lastEventTime: "Hace 1 min",
    detections: { people: 87, alerts: 0 },
    features: ["conteo", "tiempo_permanencia"],
  },
  {
    id: 4,
    name: "Cámara Bodega",
    zone: "bodega",
    status: "offline",
    lastEvent: "Desconectada",
    lastEventTime: "Hace 2 horas",
    detections: { people: 0, alerts: 2 },
    features: ["intrusion", "movimiento"],
  },
];

const demoEvents = [
  { id: 1, camera: "Entrada", type: "conteo", description: "3 personas ingresaron", time: "10:32", confidence: 95 },
  { id: 2, camera: "Caja", type: "presencia", description: "Operador presente", time: "10:30", confidence: 98 },
  { id: 3, camera: "Pasillo", type: "flujo", description: "Alto flujo detectado", time: "10:28", confidence: 87 },
  { id: 4, camera: "Entrada", type: "conteo", description: "2 personas salieron", time: "10:25", confidence: 92 },
  { id: 5, camera: "Caja", type: "fila", description: "Fila > 3 personas", time: "10:20", confidence: 90 },
];

const CameraCard = ({ camera }: { camera: typeof demoCameras[0] }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={`${camera.status === 'offline' ? 'opacity-60' : ''}`}>
      <CardContent className="p-0">
        {/* Camera preview placeholder */}
        <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            {camera.status === 'online' ? (
              <div className="text-center">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Vista previa disponible</p>
                <Badge variant="outline" className="mt-2 gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  En vivo
                </Badge>
              </div>
            ) : (
              <div className="text-center">
                <EyeOff className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Cámara desconectada</p>
                <Badge variant="destructive" className="mt-2">Offline</Badge>
              </div>
            )}
          </div>
          
          {/* Camera controls overlay */}
          {camera.status === 'online' && (
            <div className="absolute bottom-2 right-2 flex gap-1">
              <Button size="icon" variant="secondary" className="h-8 w-8">
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="secondary" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Camera info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-medium text-sm">{camera.name}</h3>
              <p className="text-xs text-muted-foreground">Zona: {camera.zone}</p>
            </div>
            <Badge variant={camera.status === 'online' ? 'default' : 'destructive'}>
              {camera.status}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {camera.detections.people} detectados hoy
            </span>
            {camera.detections.alerts > 0 && (
              <span className="flex items-center gap-1 text-yellow-500">
                <AlertTriangle className="h-3 w-3" />
                {camera.detections.alerts} alertas
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            {camera.features.map(feature => (
              <Badge key={feature} variant="outline" className="text-xs">
                {feature.replace('_', ' ')}
              </Badge>
            ))}
          </div>

          <div className="text-xs text-muted-foreground">
            <Clock className="h-3 w-3 inline mr-1" />
            {camera.lastEvent} • {camera.lastEventTime}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Camaras = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [privacyBlur, setPrivacyBlur] = useState(true);

  const onlineCameras = demoCameras.filter(c => c.status === 'online').length;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Camera className="h-7 w-7" />
            Cámaras y Vision
          </h1>
          <p className="text-muted-foreground">
            Monitoreo visual y detección inteligente
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <div className={`w-2 h-2 rounded-full ${onlineCameras > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
            {onlineCameras}/{demoCameras.length} online
          </Badge>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{onlineCameras}</p>
              <p className="text-xs text-muted-foreground">Cámaras activas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">232</p>
              <p className="text-xs text-muted-foreground">Personas hoy</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Eye className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">89</p>
              <p className="text-xs text-muted-foreground">Detecciones</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">3</p>
              <p className="text-xs text-muted-foreground">Alertas hoy</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="camaras" className="space-y-4">
        <TabsList>
          <TabsTrigger value="camaras">Cámaras</TabsTrigger>
          <TabsTrigger value="eventos">Eventos Vision</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="camaras" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demoCameras.map(camera => (
              <CameraCard key={camera.id} camera={camera} />
            ))}
          </div>

          {/* Add camera placeholder */}
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium mb-1">Agregar nueva cámara</p>
              <p className="text-sm text-muted-foreground mb-4">
                Conecta cámaras IP compatibles para habilitar vision
              </p>
              <Button variant="outline">Configurar cámara</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eventos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Eventos de Vision Recientes</CardTitle>
              <CardDescription>Detecciones automáticas de las cámaras</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {demoEvents.map(event => (
                  <div key={event.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                    <div className="w-16 text-right">
                      <span className="text-sm font-medium">{event.time}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{event.camera}</Badge>
                        <Badge variant="secondary" className="text-xs">{event.type}</Badge>
                      </div>
                      <p className="text-sm">{event.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">
                        Confianza: {event.confidence}%
                      </span>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacidad y Configuración
              </CardTitle>
              <CardDescription>
                Configuración de detección y privacidad para todas las cámaras
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Desenfoque de rostros</p>
                  <p className="text-sm text-muted-foreground">
                    Aplica desenfoque automático a rostros detectados
                  </p>
                </div>
                <Switch checked={privacyBlur} onCheckedChange={setPrivacyBlur} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Detección de intrusión</p>
                  <p className="text-sm text-muted-foreground">
                    Alertar movimiento fuera de horario operativo
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Conteo de personas</p>
                  <p className="text-sm text-muted-foreground">
                    Registrar flujo de entrada y salida
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Detección de filas</p>
                  <p className="text-sm text-muted-foreground">
                    Alertar cuando la fila supere umbral configurado
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  <Shield className="h-3 w-3 inline mr-1" />
                  Las grabaciones se almacenan localmente por 7 días. No se utiliza reconocimiento facial.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Demo Mode Banner */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="p-4 flex items-center gap-3">
          <Eye className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">Modo Demo - Vision Simulada</p>
            <p className="text-xs text-muted-foreground">
              Los datos mostrados son simulados. Conecta cámaras IP compatibles para habilitar vision real.
            </p>
          </div>
          <Button variant="outline" size="sm">Documentación</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Camaras;
