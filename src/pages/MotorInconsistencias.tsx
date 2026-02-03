import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  Camera,
  TrendingDown,
  RefreshCw,
  Filter,
  FileText,
  Play,
} from "lucide-react";

// Demo inconsistencies data
const demoInconsistencies = [
  {
    id: 1,
    type: "venta_sin_presencia",
    title: "Venta sin presencia visible",
    description: "Venta #1234 registrada sin cliente detectado en zona de caja durante la transacción",
    detectedAt: "Hoy 14:32",
    confidence: 78,
    confidenceLevel: "media",
    status: "pendiente",
    amount: 45000,
    evidence: {
      hasVideo: true,
      hasSnapshot: true,
      posData: true,
    },
    suggestedAction: "Revisar grabación de cámara en zona caja y verificar con operador",
    relatedEvents: [
      { type: "venta", description: "Venta #1234 - $45,000", time: "14:32" },
      { type: "camara", description: "Zona caja: Sin detección de personas", time: "14:30-14:35" },
    ],
  },
  {
    id: 2,
    type: "flujo_sin_ventas",
    title: "Alto flujo sin ventas correlativas",
    description: "28 personas detectadas en ventana de 30 min con solo 3 ventas registradas",
    detectedAt: "Hoy 11:45",
    confidence: 65,
    confidenceLevel: "media",
    status: "en_revision",
    amount: null,
    evidence: {
      hasVideo: true,
      hasSnapshot: false,
      posData: true,
    },
    suggestedAction: "Verificar si hubo problemas técnicos con POS o revisar conversión de ventas",
    relatedEvents: [
      { type: "sensor", description: "Entrada: 28 personas", time: "11:15-11:45" },
      { type: "venta", description: "Solo 3 ventas en período", time: "11:15-11:45" },
    ],
  },
  {
    id: 3,
    type: "anulaciones_frecuentes",
    title: "Patrón de anulaciones inusual",
    description: "8 anulaciones en 2 horas por el mismo operador (promedio diario: 2)",
    detectedAt: "Ayer 16:20",
    confidence: 85,
    confidenceLevel: "alta",
    status: "resuelta",
    amount: 156000,
    evidence: {
      hasVideo: false,
      hasSnapshot: false,
      posData: true,
    },
    suggestedAction: "Revisar motivos de anulación y hablar con operador",
    resolution: "Verificado: Errores de digitación por producto nuevo en sistema",
    relatedEvents: [
      { type: "caja", description: "8 anulaciones consecutivas", time: "14:00-16:00" },
    ],
  },
  {
    id: 4,
    type: "presencia_sin_venta",
    title: "Clientes en zona sin atención",
    description: "Grupo de 4 personas detectado en zona productos premium por 12 min sin interacción",
    detectedAt: "Hoy 15:08",
    confidence: 45,
    confidenceLevel: "baja",
    status: "descartada",
    amount: null,
    evidence: {
      hasVideo: true,
      hasSnapshot: true,
      posData: false,
    },
    suggestedAction: "Considerar mejorar señalización o disponibilidad de asesores",
    resolution: "Descartado: Clientes solo mirando, sin intención de compra confirmada",
    relatedEvents: [
      { type: "camara", description: "Zona premium: 4 personas detectadas", time: "14:56-15:08" },
    ],
  },
];

const inconsistencyTypes = [
  { value: "todos", label: "Todos los tipos" },
  { value: "venta_sin_presencia", label: "Venta sin presencia" },
  { value: "flujo_sin_ventas", label: "Flujo sin ventas" },
  { value: "anulaciones_frecuentes", label: "Anulaciones frecuentes" },
  { value: "presencia_sin_venta", label: "Presencia sin venta" },
];

const InconsistencyCard = ({ item }: { item: typeof demoInconsistencies[0] }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendiente": return "destructive";
      case "en_revision": return "default";
      case "resuelta": return "secondary";
      case "descartada": return "outline";
      default: return "outline";
    }
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case "alta": return "text-red-500";
      case "media": return "text-yellow-500";
      case "baja": return "text-blue-500";
      default: return "text-muted-foreground";
    }
  };

  return (
    <Card className={`border-l-4 ${
      item.status === 'pendiente' ? 'border-l-red-500' :
      item.status === 'en_revision' ? 'border-l-yellow-500' :
      item.status === 'resuelta' ? 'border-l-green-500' : 'border-l-gray-400'
    }`}>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <AlertTriangle className={`h-4 w-4 ${
                item.status === 'pendiente' ? 'text-red-500' : 'text-muted-foreground'
              }`} />
              <span className="font-medium">{item.title}</span>
              <Badge variant={getStatusColor(item.status) as any}>
                {item.status.replace('_', ' ')}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
            
            {/* Confidence meter */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Confianza del modelo</span>
                <span className={`font-medium ${getConfidenceColor(item.confidenceLevel)}`}>
                  {item.confidence}% ({item.confidenceLevel})
                </span>
              </div>
              <Progress value={item.confidence} className="h-2" />
            </div>

            {/* Related events */}
            <div className="bg-muted/30 rounded-lg p-3 mb-3">
              <p className="text-xs font-medium mb-2">Eventos relacionados:</p>
              <div className="space-y-1">
                {item.relatedEvents.map((event, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{event.time}</span>
                    <span>{event.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested action */}
            {item.status === 'pendiente' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 mb-3">
                <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                  Acción sugerida:
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-300">{item.suggestedAction}</p>
              </div>
            )}

            {/* Resolution */}
            {item.resolution && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                  Resolución:
                </p>
                <p className="text-xs text-green-600 dark:text-green-300">{item.resolution}</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-3">
              Detectado: {item.detectedAt}
              {item.amount && ` • Monto involucrado: $${item.amount.toLocaleString()}`}
            </p>
          </div>

          {/* Actions and Evidence */}
          <div className="flex flex-col gap-2 lg:w-48">
            <div className="flex gap-1 flex-wrap">
              {item.evidence.hasVideo && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Play className="h-3 w-3" />
                  Video
                </Badge>
              )}
              {item.evidence.hasSnapshot && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Camera className="h-3 w-3" />
                  Snapshot
                </Badge>
              )}
              {item.evidence.posData && (
                <Badge variant="outline" className="text-xs gap-1">
                  <FileText className="h-3 w-3" />
                  POS
                </Badge>
              )}
            </div>
            
            {(item.evidence.hasVideo || item.evidence.hasSnapshot) && (
              <Button size="sm" variant="outline" className="w-full">
                <Eye className="h-4 w-4 mr-1" />
                Ver evidencia
              </Button>
            )}
            
            {item.status === 'pendiente' && (
              <>
                <Button size="sm" variant="default" className="w-full">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Resolver
                </Button>
                <Button size="sm" variant="ghost" className="w-full">
                  <XCircle className="h-4 w-4 mr-1" />
                  Descartar
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MotorInconsistencias = () => {
  const [typeFilter, setTypeFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");

  const filteredItems = demoInconsistencies.filter(item => {
    if (typeFilter !== "todos" && item.type !== typeFilter) return false;
    if (statusFilter !== "todos" && item.status !== statusFilter) return false;
    return true;
  });

  const pendingCount = demoInconsistencies.filter(i => i.status === 'pendiente').length;
  const reviewCount = demoInconsistencies.filter(i => i.status === 'en_revision').length;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-7 w-7" />
            Motor de Inconsistencias
          </h1>
          <p className="text-muted-foreground">
            Auditoría operativa: POS vs Realidad física
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Ejecutar análisis
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{reviewCount}</p>
                <p className="text-xs text-muted-foreground">En revisión</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Resueltas (7d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-gray-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">$201k</p>
                <p className="text-xs text-muted-foreground">Monto involucrado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Explanation Card */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Eye className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-sm mb-1">¿Cómo funciona el motor?</p>
              <p className="text-xs text-muted-foreground">
                El motor cruza automáticamente los datos del POS (ventas, anulaciones, horarios) con 
                los eventos del mundo físico (cámaras, sensores, flujo de personas) para detectar 
                patrones que sugieren pérdidas, errores o riesgos. Cada inconsistencia incluye un 
                nivel de confianza basado en la calidad y cantidad de evidencia disponible.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {inconsistencyTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="en_revision">En revisión</SelectItem>
            <SelectItem value="resuelta">Resueltas</SelectItem>
            <SelectItem value="descartada">Descartadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inconsistencies List */}
      <div className="space-y-4">
        {filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <InconsistencyCard key={item.id} item={item} />
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="font-medium">No hay inconsistencias que mostrar</p>
              <p className="text-sm text-muted-foreground">
                Ajusta los filtros o ejecuta un nuevo análisis
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MotorInconsistencias;
