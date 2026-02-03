import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardCheck,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Calendar,
  Plus,
  Play,
  AlertTriangle,
  Timer,
  Sunrise,
  Sunset,
} from "lucide-react";

// Demo shifts data
const demoShifts = [
  {
    id: 1,
    employee: "Carlos M.",
    role: "Cajero",
    date: "Hoy",
    startTime: "08:00",
    endTime: "16:00",
    status: "activo",
    checkIn: "07:58",
    checkOut: null,
  },
  {
    id: 2,
    employee: "María L.",
    role: "Asesora",
    date: "Hoy",
    startTime: "10:00",
    endTime: "18:00",
    status: "activo",
    checkIn: "09:55",
    checkOut: null,
  },
  {
    id: 3,
    employee: "Juan P.",
    role: "Bodeguero",
    date: "Hoy",
    startTime: "06:00",
    endTime: "14:00",
    status: "completado",
    checkIn: "06:02",
    checkOut: "14:05",
  },
];

// Demo checklists
const demoChecklists = {
  apertura: {
    name: "Checklist de Apertura",
    icon: Sunrise,
    status: "completado",
    completedAt: "08:12",
    completedBy: "Carlos M.",
    items: [
      { id: 1, task: "Desactivar alarma", completed: true, time: "08:00" },
      { id: 2, task: "Encender luces y equipos", completed: true, time: "08:02" },
      { id: 3, task: "Verificar caja inicial ($200,000)", completed: true, time: "08:05" },
      { id: 4, task: "Revisar limpieza general", completed: true, time: "08:08" },
      { id: 5, task: "Verificar stock de productos clave", completed: true, time: "08:10" },
      { id: 6, task: "Activar sistema POS", completed: true, time: "08:12" },
    ],
  },
  cierre: {
    name: "Checklist de Cierre",
    icon: Sunset,
    status: "pendiente",
    completedAt: null,
    completedBy: null,
    items: [
      { id: 1, task: "Realizar arqueo de caja", completed: false, time: null },
      { id: 2, task: "Registrar ventas del día", completed: false, time: null },
      { id: 3, task: "Verificar inventario crítico", completed: false, time: null },
      { id: 4, task: "Apagar equipos", completed: false, time: null },
      { id: 5, task: "Revisar puertas y ventanas", completed: false, time: null },
      { id: 6, task: "Activar alarma", completed: false, time: null },
    ],
  },
};

const ChecklistCard = ({ checklist, type }: { checklist: typeof demoChecklists.apertura; type: string }) => {
  const [items, setItems] = useState(checklist.items);
  const Icon = checklist.icon;
  const completedCount = items.filter(i => i.completed).length;
  const progress = (completedCount / items.length) * 100;

  const toggleItem = (id: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed, time: !item.completed ? new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : null } : item
    ));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${checklist.status === 'completado' ? 'bg-green-500/10' : 'bg-muted'}`}>
              <Icon className={`h-5 w-5 ${checklist.status === 'completado' ? 'text-green-500' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <CardTitle className="text-lg">{checklist.name}</CardTitle>
              {checklist.completedAt && (
                <CardDescription>
                  Completado a las {checklist.completedAt} por {checklist.completedBy}
                </CardDescription>
              )}
            </div>
          </div>
          <Badge variant={checklist.status === 'completado' ? 'default' : 'secondary'}>
            {checklist.status === 'completado' ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Completado
              </>
            ) : (
              <>
                <Clock className="h-3 w-3 mr-1" />
                Pendiente
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium">{completedCount}/{items.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Items */}
        <div className="space-y-2">
          {items.map(item => (
            <div 
              key={item.id} 
              className={`flex items-center gap-3 p-2 rounded-lg ${item.completed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-muted/30'}`}
            >
              <Checkbox 
                checked={item.completed} 
                onCheckedChange={() => toggleItem(item.id)}
              />
              <span className={`flex-1 text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                {item.task}
              </span>
              {item.time && (
                <span className="text-xs text-muted-foreground">{item.time}</span>
              )}
            </div>
          ))}
        </div>

        {checklist.status !== 'completado' && completedCount === items.length && (
          <Button className="w-full mt-4">
            <CheckCircle className="h-4 w-4 mr-2" />
            Marcar checklist como completado
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const TurnosChecklists = () => {
  const activeShifts = demoShifts.filter(s => s.status === 'activo').length;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-7 w-7" />
            Turnos y Checklists
          </h1>
          <p className="text-muted-foreground">
            Gestión operativa y cumplimiento de procesos
          </p>
        </div>
        <Badge variant="outline" className="gap-1 w-fit">
          <Users className="h-4 w-4" />
          {activeShifts} turnos activos
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">100%</p>
              <p className="text-xs text-muted-foreground">Apertura completada</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">0%</p>
              <p className="text-xs text-muted-foreground">Cierre pendiente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeShifts}</p>
              <p className="text-xs text-muted-foreground">Empleados activos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Timer className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">12 min</p>
              <p className="text-xs text-muted-foreground">Tiempo apertura</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="checklists" className="space-y-4">
        <TabsList>
          <TabsTrigger value="checklists">Checklists</TabsTrigger>
          <TabsTrigger value="turnos">Turnos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="checklists" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChecklistCard checklist={demoChecklists.apertura} type="apertura" />
            <ChecklistCard checklist={demoChecklists.cierre} type="cierre" />
          </div>

          {/* Custom checklist placeholder */}
          <Card className="border-dashed">
            <CardContent className="p-6 text-center">
              <Plus className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium mb-1">Crear checklist personalizado</p>
              <p className="text-sm text-muted-foreground mb-4">
                Agrega listas de verificación para otros procesos (limpieza, inventario, etc.)
              </p>
              <Button variant="outline">Crear checklist</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="turnos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Turnos de Hoy</CardTitle>
                  <CardDescription>
                    {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar turno
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {demoShifts.map(shift => (
                  <div key={shift.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{shift.employee}</span>
                        <Badge variant="outline" className="text-xs">{shift.role}</Badge>
                        <Badge 
                          variant={shift.status === 'activo' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {shift.status === 'activo' ? (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              Activo
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completado
                            </>
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {shift.startTime} - {shift.endTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Sunrise className="h-3 w-3 text-green-500" />
                          Entrada: {shift.checkIn}
                        </span>
                        {shift.checkOut && (
                          <span className="flex items-center gap-1">
                            <Sunset className="h-3 w-3 text-orange-500" />
                            Salida: {shift.checkOut}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Ver detalle
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">KPIs Operativos (Últimos 7 días)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/30 text-center">
                  <p className="text-3xl font-bold text-green-500">98%</p>
                  <p className="text-sm text-muted-foreground">Cumplimiento checklists</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 text-center">
                  <p className="text-3xl font-bold">14 min</p>
                  <p className="text-sm text-muted-foreground">Tiempo promedio apertura</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 text-center">
                  <p className="text-3xl font-bold text-green-500">100%</p>
                  <p className="text-sm text-muted-foreground">Puntualidad empleados</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Resumen semanal
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Checklists completados</span>
                    <span className="font-medium">14/14</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tareas omitidas</span>
                    <span className="font-medium">2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Turnos cubiertos</span>
                    <span className="font-medium">21/21</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Note about purpose */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="p-4 flex items-center gap-3">
          <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">Apoyo a procesos, no vigilancia</p>
            <p className="text-xs text-muted-foreground">
              Los checklists y turnos están diseñados para facilitar la operación y mejorar procesos, 
              no como herramientas de control laboral.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TurnosChecklists;
