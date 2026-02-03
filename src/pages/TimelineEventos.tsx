import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  DollarSign,
  Users,
  Camera,
  Radio,
  Shield,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  Eye,
  Volume2,
} from "lucide-react";

// Demo timeline events
const demoEvents = [
  { id: 1, type: "venta", title: "Venta #1247", description: "Total: $45,000 - 3 productos", time: "10:32", icon: DollarSign, color: "text-green-500" },
  { id: 2, type: "sensor", title: "Entrada principal", description: "3 personas ingresaron", time: "10:30", icon: Users, color: "text-blue-500" },
  { id: 3, type: "camara", title: "Zona caja", description: "Personal presente detectado", time: "10:28", icon: Camera, color: "text-purple-500" },
  { id: 4, type: "venta", title: "Venta #1246", description: "Total: $23,500 - 2 productos", time: "10:25", icon: DollarSign, color: "text-green-500" },
  { id: 5, type: "sensor", title: "Entrada principal", description: "2 personas ingresaron", time: "10:22", icon: Users, color: "text-blue-500" },
  { id: 6, type: "alerta", title: "Alerta resuelta", description: "Tiempo de espera normalizado", time: "10:20", icon: CheckCircle, color: "text-green-500" },
  { id: 7, type: "camara", title: "Zona entrada", description: "Alto flujo detectado", time: "10:15", icon: Camera, color: "text-purple-500" },
  { id: 8, type: "alerta", title: "Alerta generada", description: "Tiempo de espera > 5 min", time: "10:08", icon: AlertTriangle, color: "text-yellow-500" },
  { id: 9, type: "venta", title: "Venta #1245", description: "Total: $67,800 - 5 productos", time: "10:05", icon: DollarSign, color: "text-green-500" },
  { id: 10, type: "sensor", title: "Sensor puerta trasera", description: "Apertura registrada", time: "09:58", icon: Radio, color: "text-orange-500" },
  { id: 11, type: "operacion", title: "Checklist apertura", description: "Completado al 100%", time: "08:15", icon: CheckCircle, color: "text-green-500" },
  { id: 12, type: "seguridad", title: "Sistema armado", description: "Alarma desactivada por apertura", time: "08:00", icon: Shield, color: "text-blue-500" },
];

const TimelineEventos = () => {
  const [filter, setFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("hoy");

  const filteredEvents = demoEvents.filter(event => {
    if (filter !== "todos" && event.type !== filter) return false;
    if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getEventTypeBadge = (type: string) => {
    const types: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      venta: { label: "Venta", variant: "default" },
      sensor: { label: "Sensor", variant: "secondary" },
      camara: { label: "Cámara", variant: "outline" },
      alerta: { label: "Alerta", variant: "destructive" },
      operacion: { label: "Operación", variant: "secondary" },
      seguridad: { label: "Seguridad", variant: "outline" },
    };
    return types[type] || { label: type, variant: "outline" as const };
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Clock className="h-7 w-7" />
            Timeline de Eventos
          </h1>
          <p className="text-muted-foreground">
            Historial cronológico de toda la actividad del negocio
          </p>
        </div>
        <Badge variant="outline" className="gap-1 w-fit">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Actualización en tiempo real
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar eventos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[130px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoy">Hoy</SelectItem>
                  <SelectItem value="ayer">Ayer</SelectItem>
                  <SelectItem value="semana">Esta semana</SelectItem>
                  <SelectItem value="mes">Este mes</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="venta">Ventas</SelectItem>
                  <SelectItem value="sensor">Sensores</SelectItem>
                  <SelectItem value="camara">Cámaras</SelectItem>
                  <SelectItem value="alerta">Alertas</SelectItem>
                  <SelectItem value="operacion">Operación</SelectItem>
                  <SelectItem value="seguridad">Seguridad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-3 text-center">
            <DollarSign className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-lg font-bold">47</p>
            <p className="text-xs text-muted-foreground">Ventas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Users className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-lg font-bold">142</p>
            <p className="text-xs text-muted-foreground">Entradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Camera className="h-5 w-5 mx-auto text-purple-500 mb-1" />
            <p className="text-lg font-bold">89</p>
            <p className="text-xs text-muted-foreground">Detecciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
            <p className="text-lg font-bold">3</p>
            <p className="text-xs text-muted-foreground">Alertas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Radio className="h-5 w-5 mx-auto text-orange-500 mb-1" />
            <p className="text-lg font-bold">24</p>
            <p className="text-xs text-muted-foreground">Sensores</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Eventos del día</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[39px] top-0 bottom-0 w-px bg-border" />
            
            <div className="space-y-4">
              {filteredEvents.map((event) => {
                const Icon = event.icon;
                const badgeInfo = getEventTypeBadge(event.type);
                return (
                  <div key={event.id} className="flex items-start gap-4 relative">
                    {/* Time */}
                    <div className="w-14 text-right shrink-0">
                      <span className="text-sm font-medium">{event.time}</span>
                    </div>
                    
                    {/* Icon dot */}
                    <div className="relative z-10 shrink-0">
                      <div className="w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center">
                        <Icon className={`h-4 w-4 ${event.color}`} />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{event.title}</span>
                          <Badge variant={badgeInfo.variant} className="text-xs">
                            {badgeInfo.label}
                          </Badge>
                        </div>
                        {(event.type === 'camara' || event.type === 'alerta') && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {filteredEvents.length === 0 && (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No hay eventos que coincidan con los filtros</p>
            </div>
          )}
          
          {filteredEvents.length > 0 && (
            <div className="mt-6 text-center">
              <Button variant="outline">Cargar más eventos</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TimelineEventos;
