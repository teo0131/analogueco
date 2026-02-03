import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Shield,
  FileText,
  Info,
  Mic,
  MicOff,
  Activity,
} from "lucide-react";

// Demo audio data
const demoAudioMetrics = {
  currentLevel: 45, // decibels
  avgLevel: 42,
  maxToday: 78,
  alertThreshold: 70,
  status: "normal",
};

const demoAudioEvents = [
  { id: 1, type: "pico", description: "Pico de ruido detectado (78 dB)", time: "14:32", duration: "3 seg", action: "Revisar cámara zona entrada" },
  { id: 2, type: "normal", description: "Nivel ambiente normal", time: "14:00", duration: "continuo", action: null },
  { id: 3, type: "bajo", description: "Silencio prolongado detectado", time: "13:45", duration: "15 min", action: "Verificar operación" },
  { id: 4, type: "pico", description: "Ruido fuerte detectado (72 dB)", time: "12:20", duration: "5 seg", action: "Verificado: carga de mercancía" },
];

const AudioMonitoreo = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [threshold, setThreshold] = useState([70]);
  const [consentAcknowledged, setConsentAcknowledged] = useState(false);

  const getLevelColor = (level: number) => {
    if (level < 50) return "bg-green-500";
    if (level < 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getLevelStatus = (level: number) => {
    if (level < 50) return { text: "Normal", color: "text-green-500" };
    if (level < 70) return { text: "Elevado", color: "text-yellow-500" };
    return { text: "Alto", color: "text-red-500" };
  };

  const status = getLevelStatus(demoAudioMetrics.currentLevel);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Volume2 className="h-7 w-7" />
            Monitoreo de Audio
          </h1>
          <p className="text-muted-foreground">
            Métricas de ambiente (sin grabación de contenido)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isEnabled ? "default" : "secondary"} className="gap-1">
            {isEnabled ? (
              <>
                <Mic className="h-3 w-3" />
                Activo
              </>
            ) : (
              <>
                <MicOff className="h-3 w-3" />
                Desactivado
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Privacy Warning Banner */}
      <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-yellow-700 dark:text-yellow-300 mb-1">
                Módulo Opcional - Diseñado con Privacidad
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-200 mb-3">
                Este módulo solo captura métricas de nivel de ruido (decibelios). 
                <strong> NO graba ni transcribe conversaciones.</strong> El objetivo es detectar 
                eventos anómalos (gritos, discusiones, alarmas) para alertar y correlacionar con video.
              </p>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="consent" 
                  checked={consentAcknowledged}
                  onChange={(e) => setConsentAcknowledged(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="consent" className="text-sm text-yellow-600 dark:text-yellow-200">
                  Entiendo que debo informar a empleados y clientes sobre el monitoreo de ambiente
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Enable/Disable */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Habilitar monitoreo de audio</p>
              <p className="text-sm text-muted-foreground">
                Captura métricas de nivel de ruido ambiente
              </p>
            </div>
            <Switch 
              checked={isEnabled} 
              onCheckedChange={setIsEnabled}
              disabled={!consentAcknowledged}
            />
          </div>
          {!consentAcknowledged && (
            <p className="text-xs text-muted-foreground mt-2">
              Debes aceptar el aviso de privacidad para habilitar este módulo
            </p>
          )}
        </CardContent>
      </Card>

      {isEnabled ? (
        <Tabs defaultValue="metricas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="metricas">Métricas en Vivo</TabsTrigger>
            <TabsTrigger value="eventos">Eventos</TabsTrigger>
            <TabsTrigger value="config">Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="metricas" className="space-y-4">
            {/* Current Level */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Nivel de Ruido Actual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className={`text-5xl font-bold ${status.color}`}>
                        {demoAudioMetrics.currentLevel}
                      </p>
                      <p className="text-sm text-muted-foreground">dB</p>
                      <Badge variant="outline" className={`mt-2 ${status.color}`}>
                        {status.text}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Silencio</span>
                          <span>Normal</span>
                          <span>Alto</span>
                          <span>Alerta</span>
                        </div>
                        <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`absolute left-0 top-0 h-full transition-all ${getLevelColor(demoAudioMetrics.currentLevel)}`}
                            style={{ width: `${Math.min(demoAudioMetrics.currentLevel, 100)}%` }}
                          />
                          <div 
                            className="absolute top-0 h-full w-px bg-red-500"
                            style={{ left: `${demoAudioMetrics.alertThreshold}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>0 dB</span>
                          <span className="text-red-500">Umbral: {demoAudioMetrics.alertThreshold} dB</span>
                          <span>100 dB</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Estadísticas Hoy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Promedio</span>
                    <span className="font-medium">{demoAudioMetrics.avgLevel} dB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Máximo</span>
                    <span className="font-medium text-yellow-500">{demoAudioMetrics.maxToday} dB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Alertas</span>
                    <span className="font-medium">2</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Visual indicator animation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Visualización en Tiempo Real
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-center gap-1 h-24">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const height = Math.random() * 60 + 20;
                    return (
                      <div
                        key={i}
                        className={`w-2 rounded-t transition-all ${
                          height > 70 ? 'bg-red-500' : height > 50 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Representación visual del nivel de audio (simulado)
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="eventos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Eventos de Audio</CardTitle>
                <CardDescription>
                  Picos y anomalías detectadas automáticamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {demoAudioEvents.map(event => (
                    <div key={event.id} className={`flex items-start gap-4 p-3 rounded-lg ${
                      event.type === 'pico' ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-muted/30'
                    }`}>
                      <div className="w-14 text-right">
                        <span className="text-sm font-medium">{event.time}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {event.type === 'pico' ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          ) : event.type === 'bajo' ? (
                            <VolumeX className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Volume2 className="h-4 w-4 text-green-500" />
                          )}
                          <span className="text-sm font-medium">{event.description}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Duración: {event.duration}</p>
                        {event.action && (
                          <p className="text-xs mt-1">
                            <span className="font-medium">Acción:</span> {event.action}
                          </p>
                        )}
                      </div>
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
                  <Settings className="h-5 w-5" />
                  Configuración de Audio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Umbral de alerta</p>
                    <span className="text-sm text-muted-foreground">{threshold[0]} dB</span>
                  </div>
                  <Slider
                    value={threshold}
                    onValueChange={setThreshold}
                    min={50}
                    max={90}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Se generará alerta cuando el nivel supere este umbral
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Alertas de picos</p>
                    <p className="text-sm text-muted-foreground">
                      Notificar ruidos fuertes repentinos
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Alertas de silencio</p>
                    <p className="text-sm text-muted-foreground">
                      Notificar silencio prolongado en horario operativo
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Correlación con cámaras</p>
                    <p className="text-sm text-muted-foreground">
                      Asociar eventos de audio con clips de video
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Legal Notice */}
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-sm mb-1">Requisitos Legales</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Informar a empleados sobre el monitoreo de ambiente</li>
                      <li>• Colocar señalización visible en el establecimiento</li>
                      <li>• No grabar ni transcribir conversaciones</li>
                      <li>• Cumplir con normativas locales de privacidad</li>
                    </ul>
                    <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                      Descargar plantilla de aviso
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <VolumeX className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium mb-2">Módulo de Audio Desactivado</p>
            <p className="text-sm text-muted-foreground mb-4">
              Este módulo es opcional y está desactivado por defecto. 
              Habilítalo arriba para capturar métricas de ambiente.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Info className="h-4 w-4" />
              Solo métricas de ruido. Sin grabación de contenido.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demo Mode Banner */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="p-4 flex items-center gap-3">
          <Volume2 className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">Modo Demo - Audio Simulado</p>
            <p className="text-xs text-muted-foreground">
              Los datos mostrados son simulados. Conecta micrófonos para datos reales.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AudioMonitoreo;
