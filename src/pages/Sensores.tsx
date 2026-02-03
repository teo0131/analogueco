import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Radio,
  DoorOpen,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  RefreshCw,
  Bell,
  Shield,
  Activity,
  Zap,
} from "lucide-react";

// Demo sensors data
const demoSensors = [
  {
    id: 1,
    name: "Sensor Puerta Principal",
    type: "puerta",
    location: "Entrada",
    status: "online",
    lastEvent: "Apertura detectada",
    lastEventTime: "Hace 3 min",
    todayEvents: 142,
    battery: 85,
  },
  {
    id: 2,
    name: "Contador de Personas",
    type: "contador",
    location: "Entrada",
    status: "online",
    lastEvent: "2 personas ingresaron",
    lastEventTime: "Hace 5 min",
    todayEvents: 89,
    battery: 72,
  },
  {
    id: 3,
    name: "Sensor Puerta Trasera",
    type: "puerta",
    location: "Bodega",
    status: "online",
    lastEvent: "Sin actividad",
    lastEventTime: "Hace 2 horas",
    todayEvents: 3,
    battery: 95,
  },
  {
    id: 4,
    name: "Sensor Movimiento Bodega",
    type: "movimiento",
    location: "Bodega",
    status: "online",
    lastEvent: "Movimiento detectado",
    lastEventTime: "Hace 45 min",
    todayEvents: 12,
    battery: 60,
  },
  {
    id: 5,
    name: "Sensor Caja Registradora",
    type: "apertura",
    location: "Caja",
    status: "offline",
    lastEvent: "Desconectado",
    lastEventTime: "Hace 1 día",
    todayEvents: 0,
    battery: 15,
  },
  {
    id: 6,
    name: "Detector de Humo",
    type: "seguridad",
    location: "General",
    status: "online",
    lastEvent: "Test exitoso",
    lastEventTime: "Hace 1 semana",
    todayEvents: 0,
    battery: 90,
  },
];

const demoSensorEvents = [
  { id: 1, sensor: "Puerta Principal", type: "apertura", description: "Apertura normal", time: "10:32", correlated: true },
  { id: 2, sensor: "Contador", type: "ingreso", description: "3 personas ingresaron", time: "10:32", correlated: true },
  { id: 3, sensor: "Puerta Principal", type: "apertura", description: "Apertura normal", time: "10:28", correlated: true },
  { id: 4, sensor: "Contador", type: "ingreso", description: "2 personas ingresaron", time: "10:28", correlated: true },
  { id: 5, sensor: "Movimiento Bodega", type: "movimiento", description: "Movimiento detectado", time: "09:45", correlated: false },
  { id: 6, sensor: "Puerta Trasera", type: "apertura", description: "Apertura normal", time: "09:15", correlated: true },
];

const SensorCard = ({ sensor }: { sensor: typeof demoSensors[0] }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "puerta": return DoorOpen;
      case "contador": return Users;
      case "movimiento": return Activity;
      case "apertura": return DoorOpen;
      case "seguridad": return Shield;
      default: return Radio;
    }
  };

  const Icon = getTypeIcon(sensor.type);

  return (
    <Card className={sensor.status === 'offline' ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${sensor.status === 'online' ? 'bg-primary/10' : 'bg-muted'}`}>
            <Icon className={`h-5 w-5 ${sensor.status === 'online' ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-sm">{sensor.name}</h3>
              <Badge variant={sensor.status === 'online' ? 'default' : 'destructive'} className="text-xs">
                {sensor.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{sensor.location}</p>
            
            <div className="flex items-center gap-4 text-xs mb-2">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {sensor.todayEvents} eventos hoy
              </span>
            </div>

            {/* Battery indicator */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground">Batería:</span>
              <Progress 
                value={sensor.battery} 
                className={`h-2 flex-1 ${sensor.battery < 20 ? '[&>div]:bg-red-500' : sensor.battery < 50 ? '[&>div]:bg-yellow-500' : ''}`}
              />
              <span className="text-xs">{sensor.battery}%</span>
            </div>

            <div className="text-xs text-muted-foreground">
              <Clock className="h-3 w-3 inline mr-1" />
              {sensor.lastEvent} • {sensor.lastEventTime}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Sensores = () => {
  const onlineSensors = demoSensors.filter(s => s.status === 'online').length;
  const totalEvents = demoSensors.reduce((acc, s) => acc + s.todayEvents, 0);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Radio className="h-7 w-7" />
            Sensores
          </h1>
          <p className="text-muted-foreground">
            Monitoreo de puertas, movimiento y conteo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <div className={`w-2 h-2 rounded-full ${onlineSensors > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
            {onlineSensors}/{demoSensors.length} activos
          </Badge>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Sincronizar
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
              <p className="text-2xl font-bold">{onlineSensors}</p>
              <p className="text-xs text-muted-foreground">Sensores activos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalEvents}</p>
              <p className="text-xs text-muted-foreground">Eventos hoy</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">89</p>
              <p className="text-xs text-muted-foreground">Personas contadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">1</p>
              <p className="text-xs text-muted-foreground">Sin correlación</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sensores" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sensores">Sensores</TabsTrigger>
          <TabsTrigger value="eventos">Eventos</TabsTrigger>
          <TabsTrigger value="correlacion">Correlación POS</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="sensores" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demoSensors.map(sensor => (
              <SensorCard key={sensor.id} sensor={sensor} />
            ))}
          </div>

          {/* Add sensor placeholder */}
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Radio className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium mb-1">Agregar nuevo sensor</p>
              <p className="text-sm text-muted-foreground mb-4">
                Conecta sensores IoT compatibles (Zigbee, Z-Wave, WiFi)
              </p>
              <Button variant="outline">Configurar sensor</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eventos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Eventos de Sensores Hoy</CardTitle>
              <CardDescription>Actividad detectada por todos los sensores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {demoSensorEvents.map(event => (
                  <div key={event.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                    <div className="w-14 text-right">
                      <span className="text-sm font-medium">{event.time}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{event.sensor}</Badge>
                        <Badge variant="secondary" className="text-xs">{event.type}</Badge>
                      </div>
                      <p className="text-sm">{event.description}</p>
                    </div>
                    <div>
                      {event.correlated ? (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Correlacionado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Sin correlación
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlacion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Correlación Sensores vs POS</CardTitle>
              <CardDescription>
                Análisis de eventos de sensores comparados con transacciones POS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-green-50 dark:bg-green-900/20">
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">94%</p>
                    <p className="text-sm text-green-600 dark:text-green-300">Correlación exitosa</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Entradas con ventas correspondientes
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-50 dark:bg-yellow-900/20">
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">5</p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-300">Sin correlación</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Entradas sin venta en ventana de 15 min
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 dark:bg-blue-900/20">
                  <CardContent className="p-4 text-center">
                    <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">8 min</p>
                    <p className="text-sm text-blue-600 dark:text-blue-300">Tiempo promedio</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Entre entrada y primera venta
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 inline mr-1 text-yellow-500" />
                  <strong>Alerta:</strong> Se detectaron 5 eventos de entrada sin ventas correlativas 
                  en los últimos 30 minutos. Esto puede indicar clientes que abandonaron sin comprar 
                  o posibles pérdidas.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración de Sensores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertas fuera de horario</p>
                  <p className="text-sm text-muted-foreground">
                    Notificar apertura de puertas fuera del horario operativo
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Correlación automática</p>
                  <p className="text-sm text-muted-foreground">
                    Cruzar eventos de sensores con transacciones POS
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertas de batería baja</p>
                  <p className="text-sm text-muted-foreground">
                    Notificar cuando la batería sea menor al 20%
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Modo seguridad nocturna</p>
                  <p className="text-sm text-muted-foreground">
                    Activar alertas de intrusión fuera de horario
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Demo Mode Banner */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="p-4 flex items-center gap-3">
          <Radio className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">Modo Demo - Sensores Simulados</p>
            <p className="text-xs text-muted-foreground">
              Los datos mostrados son simulados. Conecta sensores IoT para datos reales.
            </p>
          </div>
          <Button variant="outline" size="sm">Integraciones</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sensores;
