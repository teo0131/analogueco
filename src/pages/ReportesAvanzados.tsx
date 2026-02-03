import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  DollarSign,
  Users,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";

const ReportesAvanzados = () => {
  const [period, setPeriod] = useState("semana");

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-7 w-7" />
            Reportes
          </h1>
          <p className="text-muted-foreground">
            Análisis operativo, de seguridad y financiero
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoy">Hoy</SelectItem>
              <SelectItem value="semana">Esta semana</SelectItem>
              <SelectItem value="mes">Este mes</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="operativo" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="operativo">Operativo</TabsTrigger>
          <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
          <TabsTrigger value="caja">Caja y Riesgo</TabsTrigger>
          <TabsTrigger value="ejecutivo">Ejecutivo</TabsTrigger>
        </TabsList>

        {/* Reporte Operativo */}
        <TabsContent value="operativo" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs">Alertas Totales</span>
                </div>
                <p className="text-2xl font-bold">23</p>
                <div className="flex items-center gap-1 text-xs text-green-500">
                  <TrendingDown className="h-3 w-3" />
                  -15% vs semana anterior
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-xs">Alertas Resueltas</span>
                </div>
                <p className="text-2xl font-bold">21</p>
                <p className="text-xs text-muted-foreground">91% tasa resolución</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">Tiempo Resolución</span>
                </div>
                <p className="text-2xl font-bold">25 min</p>
                <p className="text-xs text-muted-foreground">Promedio</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xs">Flujo Personas</span>
                </div>
                <p className="text-2xl font-bold">847</p>
                <div className="flex items-center gap-1 text-xs text-green-500">
                  <TrendingUp className="h-3 w-3" />
                  +8% vs semana anterior
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alertas por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: "Servicio", count: 12, color: "bg-yellow-500" },
                  { type: "Operación", count: 6, color: "bg-blue-500" },
                  { type: "Seguridad", count: 3, color: "bg-red-500" },
                  { type: "Caja", count: 2, color: "bg-purple-500" },
                ].map((item) => (
                  <div key={item.type} className="flex items-center gap-4">
                    <span className="w-24 text-sm">{item.type}</span>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color}`} 
                        style={{ width: `${(item.count / 23) * 100}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Inconsistencias Detectadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/30 text-center">
                  <p className="text-3xl font-bold">8</p>
                  <p className="text-sm text-muted-foreground">Total detectadas</p>
                </div>
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
                  <p className="text-3xl font-bold text-green-600">6</p>
                  <p className="text-sm text-muted-foreground">Verificadas OK</p>
                </div>
                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-center">
                  <p className="text-3xl font-bold text-yellow-600">2</p>
                  <p className="text-sm text-muted-foreground">Pendientes revisión</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reporte de Seguridad */}
        <TabsContent value="seguridad" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Shield className="h-4 w-4" />
                  <span className="text-xs">Estado General</span>
                </div>
                <p className="text-2xl font-bold text-green-500">Seguro</p>
                <p className="text-xs text-muted-foreground">Sin incidentes críticos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs">Eventos Fuera Horario</span>
                </div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-xs text-muted-foreground">Verificado: empleado</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <XCircle className="h-4 w-4" />
                  <span className="text-xs">Cámaras Offline</span>
                </div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-xs text-muted-foreground">Bodega - 2 horas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <FileText className="h-4 w-4" />
                  <span className="text-xs">Incidentes</span>
                </div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-green-500">Sin incidentes reportados</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Eventos de Seguridad</CardTitle>
              <CardDescription>Últimos 7 días</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: "Lunes", events: 0, status: "ok" },
                  { date: "Martes", events: 0, status: "ok" },
                  { date: "Miércoles", events: 1, status: "warning", detail: "Acceso fuera horario (verificado)" },
                  { date: "Jueves", events: 0, status: "ok" },
                  { date: "Viernes", events: 0, status: "ok" },
                  { date: "Sábado", events: 0, status: "ok" },
                  { date: "Domingo", events: 0, status: "ok" },
                ].map((day) => (
                  <div key={day.date} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                    <span className="w-24 text-sm font-medium">{day.date}</span>
                    <div className="flex-1 flex items-center gap-2">
                      {day.status === 'ok' ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Sin eventos
                        </Badge>
                      ) : (
                        <>
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {day.events} evento
                          </Badge>
                          <span className="text-xs text-muted-foreground">{day.detail}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reporte de Caja y Riesgo */}
        <TabsContent value="caja" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs">Ventas Período</span>
                </div>
                <p className="text-2xl font-bold">$8.7M</p>
                <div className="flex items-center gap-1 text-xs text-green-500">
                  <TrendingUp className="h-3 w-3" />
                  +12% vs período anterior
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <XCircle className="h-4 w-4" />
                  <span className="text-xs">Anulaciones</span>
                </div>
                <p className="text-2xl font-bold">$156k</p>
                <p className="text-xs text-muted-foreground">1.8% del total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs">Diferencias Arqueo</span>
                </div>
                <p className="text-2xl font-bold">$12k</p>
                <p className="text-xs text-muted-foreground">0.1% del total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xs">Ticket Promedio</span>
                </div>
                <p className="text-2xl font-bold">$45k</p>
                <div className="flex items-center gap-1 text-xs text-green-500">
                  <TrendingUp className="h-3 w-3" />
                  +5% vs período anterior
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Patrones de Riesgo</CardTitle>
              <CardDescription>Análisis de anulaciones y devoluciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-green-700 dark:text-green-300">Sin patrones anómalos</span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-200">
                    Las anulaciones y devoluciones están dentro de rangos normales. 
                    No se detectaron patrones sospechosos de fraude.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="font-medium mb-2">Anulaciones por Motivo</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Error de digitación</span>
                        <span>45%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Producto incorrecto</span>
                        <span>30%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cliente canceló</span>
                        <span>25%</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="font-medium mb-2">Correlación con Eventos</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Con cliente visible</span>
                        <span className="text-green-500">98%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sin evidencia visual</span>
                        <span className="text-yellow-500">2%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reporte Ejecutivo */}
        <TabsContent value="ejecutivo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen Ejecutivo</CardTitle>
              <CardDescription>
                {period === 'semana' ? 'Última semana' : period === 'mes' ? 'Último mes' : 'Período seleccionado'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Trust Score */}
              <div className="text-center p-6 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5">
                <p className="text-sm text-muted-foreground mb-2">Índice de Confianza del Negocio</p>
                <p className="text-6xl font-bold text-primary">87</p>
                <p className="text-sm text-muted-foreground mt-2">de 100 puntos</p>
                <Badge variant="outline" className="mt-3 text-green-600 border-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +3 puntos vs período anterior
                </Badge>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">$8.7M</p>
                  <p className="text-xs text-muted-foreground">Ventas</p>
                  <Badge variant="outline" className="text-xs text-green-500 mt-1">+12%</Badge>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">847</p>
                  <p className="text-xs text-muted-foreground">Clientes</p>
                  <Badge variant="outline" className="text-xs text-green-500 mt-1">+8%</Badge>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">91%</p>
                  <p className="text-xs text-muted-foreground">Alertas resueltas</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Incidentes seguridad</p>
                </div>
              </div>

              {/* Summary Points */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-300">Operación estable</p>
                    <p className="text-sm text-green-600 dark:text-green-200">
                      El negocio operó sin incidentes críticos. 98% de cumplimiento en checklists.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-300">Seguridad controlada</p>
                    <p className="text-sm text-green-600 dark:text-green-200">
                      Solo 1 evento fuera de horario, verificado como acceso autorizado.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-700 dark:text-yellow-300">Oportunidad de mejora</p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-200">
                      12 alertas de servicio por tiempos de espera. Considerar refuerzo en horas pico.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Descargar PDF
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Enviar por correo
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportesAvanzados;
