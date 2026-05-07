import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  TrendingDown,
  RefreshCw,
  Filter,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Inconsistencia {
  id: string;
  comercio_id: string | null;
  user_id: string;
  created_at: string;
  tipo: string;
  evento_fisico_id: string | null;
  orden_pos_id: string | null;
  descripcion: string | null;
  monto_estimado: number | null;
  estado: string;
  resuelto_at: string | null;
  notas: string | null;
  severidad: string;
}

const inconsistencyTypes = [
  { value: "todos", label: "Todos los tipos" },
  { value: "venta_sin_presencia", label: "Venta sin presencia" },
  { value: "flujo_sin_ventas", label: "Flujo sin ventas" },
  { value: "anulaciones_frecuentes", label: "Anulaciones frecuentes" },
  { value: "presencia_sin_venta", label: "Presencia sin venta" },
];

const formatType = (tipo: string) =>
  tipo.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const getStatusVariant = (status: string) => {
  switch (status) {
    case "pendiente":
      return "destructive";
    case "en_revision":
      return "default";
    case "resuelta":
      return "secondary";
    default:
      return "outline";
  }
};

const getSeverityProgress = (sev: string) =>
  sev === "alta" ? 90 : sev === "media" ? 60 : 30;

const InconsistencyCard = ({
  item,
  onUpdate,
}: {
  item: Inconsistencia;
  onUpdate: (id: string, estado: string) => void;
}) => {
  const borderColor =
    item.estado === "pendiente"
      ? "border-l-red-500"
      : item.estado === "en_revision"
      ? "border-l-yellow-500"
      : item.estado === "resuelta"
      ? "border-l-green-500"
      : "border-l-gray-400";

  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <AlertTriangle
                className={`h-4 w-4 ${
                  item.estado === "pendiente" ? "text-red-500" : "text-muted-foreground"
                }`}
              />
              <span className="font-medium">{formatType(item.tipo)}</span>
              <Badge variant={getStatusVariant(item.estado) as any}>
                {item.estado.replace("_", " ")}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                Severidad: {item.severidad}
              </Badge>
            </div>

            {item.descripcion && (
              <p className="text-sm text-muted-foreground mb-3">{item.descripcion}</p>
            )}

            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Severidad</span>
                <span className="font-medium capitalize">{item.severidad}</span>
              </div>
              <Progress value={getSeverityProgress(item.severidad)} className="h-2" />
            </div>

            {item.notas && (
              <div className="bg-muted/30 rounded-lg p-3 mb-3">
                <p className="text-xs font-medium mb-1">Notas:</p>
                <p className="text-xs text-muted-foreground">{item.notas}</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-3">
              Detectado: {new Date(item.created_at).toLocaleString("es-CO")}
              {item.monto_estimado != null &&
                ` • Monto estimado: $${Number(item.monto_estimado).toLocaleString("es-CO")}`}
            </p>
          </div>

          <div className="flex flex-col gap-2 lg:w-48">
            <div className="flex gap-1 flex-wrap">
              {item.evento_fisico_id && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Eye className="h-3 w-3" />
                  Evento físico
                </Badge>
              )}
              {item.orden_pos_id && (
                <Badge variant="outline" className="text-xs gap-1">
                  <FileText className="h-3 w-3" />
                  POS
                </Badge>
              )}
            </div>

            {item.estado === "pendiente" && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  className="w-full"
                  onClick={() => onUpdate(item.id, "resuelta")}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Resolver
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full"
                  onClick={() => onUpdate(item.id, "descartada")}
                >
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
  const [items, setItems] = useState<Inconsistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("inconsistencias_pos_real")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Error al cargar inconsistencias");
      console.error(error);
    } else {
      setItems((data || []) as Inconsistencia[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("inconsistencias-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inconsistencias_pos_real" },
        () => fetchData()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdate = async (id: string, estado: string) => {
    const { error } = await supabase
      .from("inconsistencias_pos_real")
      .update({
        estado,
        resuelto_at: estado === "resuelta" ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) {
      toast.error("No se pudo actualizar el estado");
    } else {
      toast.success(`Marcada como ${estado}`);
    }
  };

  const filteredItems = items.filter((item) => {
    if (typeFilter !== "todos" && item.tipo !== typeFilter) return false;
    if (statusFilter !== "todos" && item.estado !== statusFilter) return false;
    return true;
  });

  const pendingCount = items.filter((i) => i.estado === "pendiente").length;
  const reviewCount = items.filter((i) => i.estado === "en_revision").length;
  const resolvedCount = items.filter((i) => {
    if (i.estado !== "resuelta" || !i.resuelto_at) return false;
    const days = (Date.now() - new Date(i.resuelto_at).getTime()) / (1000 * 60 * 60 * 24);
    return days <= 7;
  }).length;
  const totalAmount = items
    .filter((i) => i.estado !== "descartada")
    .reduce((sum, i) => sum + Number(i.monto_estimado || 0), 0);

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
        <Button variant="outline" className="gap-2" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

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
                <p className="text-2xl font-bold">{resolvedCount}</p>
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
                <p className="text-2xl font-bold">
                  ${(totalAmount / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-muted-foreground">Monto involucrado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Eye className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-sm mb-1">¿Cómo funciona el motor?</p>
              <p className="text-xs text-muted-foreground">
                El motor cruza datos del POS (ventas, anulaciones) con eventos físicos
                (cámaras, sensores) para detectar pérdidas, errores o riesgos. Cada
                inconsistencia incluye un nivel de severidad según la evidencia disponible.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {inconsistencyTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
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

      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </CardContent>
          </Card>
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <InconsistencyCard key={item.id} item={item} onUpdate={handleUpdate} />
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="font-medium">No hay inconsistencias registradas</p>
              <p className="text-sm text-muted-foreground">
                Cuando el motor detecte cruces sospechosos entre POS y eventos físicos,
                aparecerán aquí.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MotorInconsistencias;
