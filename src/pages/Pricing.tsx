import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import analoguecoIcon from "@/assets/analogueco-icon.svg";
import dashboardPreview from "@/assets/dashboard-preview.png";
import personaCarlos from "@/assets/persona-carlos.png";
import {
  Check,
  Camera,
  Cpu,
  Wrench,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Quote,
  X,
  Activity,
  Users,
  Boxes,
  ShieldCheck,
  BarChart3,
  Target,
  Lightbulb,
  Rocket,
  Briefcase,
  Store,
  Monitor,
  Layers,
  Radar,
  Type,
  Palette,
  Square,
} from "lucide-react";

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

interface Plan {
  name: string;
  monthly: number | null;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  customLabel?: string;
}

const plans: Plan[] = [
  {
    name: "Starter",
    monthly: 510000,
    description: "MVP para empezar a ver lo invisible.",
    features: ["1 cámara", "Alertas en tiempo real", "Monitoreo básico"],
    cta: "Start Free Trial",
  },
  {
    name: "Growth",
    monthly: 990000,
    description: "Para operaciones que ya facturan en serio.",
    features: [
      "Hasta 3 cámaras",
      "Alertas en tiempo real",
      "Dashboard & insights",
      "Integración POS",
      "Reportes",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Scale",
    monthly: 1890000,
    description: "Multi-sede, automatización y analítica avanzada.",
    features: [
      "Hasta 8 cámaras",
      "Analítica avanzada",
      "Automatizaciones",
      "Soporte multi-sede",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Enterprise",
    monthly: null,
    customLabel: "Custom",
    description: "Infraestructura a la medida de tu operación.",
    features: [
      "Cámaras ilimitadas",
      "Integraciones completas",
      "Soporte dedicado",
      "Modelos de IA personalizados",
    ],
    cta: "Contact Sales",
  },
];

const setupTiers = [
  { name: "Starter Setup", price: 3220000 },
  { name: "Growth Setup", price: 4200000 },
  { name: "Scale Setup", price: 5800000 },
  { name: "Enterprise", price: null, label: "Custom" },
];

// 00 — Resumen
const personalityTags = [
  "Analítico",
  "Preciso",
  "Minimal",
  "Estratégico",
  "Sistémico",
  "Inteligencia Invisible",
];

// 02 — Paleta
const palette = [
  { name: "Negro Profundo", hex: "#0B0B0B", hsl: "HSL(0, 0%, 4%)", role: "Fondo principal", swatch: "bg-[#0B0B0B]", text: "text-white" },
  { name: "Gris Oscuro", hex: "#2A2A2A", hsl: "HSL(0, 0%, 16%)", role: "Superficie secundaria", swatch: "bg-[#2A2A2A]", text: "text-white" },
  { name: "Azul Eléctrico", hex: "#1E5EFF", hsl: "HSL(224, 100%, 56%)", role: "Acción primaria · CV", swatch: "bg-[#1E5EFF]", text: "text-white", accent: true },
  { name: "Azul Claro", hex: "#4D7FFF", hsl: "HSL(224, 100%, 65%)", role: "Hover · acento secundario", swatch: "bg-[#4D7FFF]", text: "text-white" },
  { name: "Blanco Puro", hex: "#FFFFFF", hsl: "HSL(0, 0%, 100%)", role: "Texto sobre oscuro", swatch: "bg-white border", text: "text-foreground" },
  { name: "Gris Frío", hex: "#EBEBEB", hsl: "HSL(0, 0%, 92%)", role: "Superficies atenuadas", swatch: "bg-[#EBEBEB]", text: "text-foreground" },
];

// 03 — Tipografía
const typeScale = [
  { label: "Display XL", spec: "72px / 900 · Inter", sample: "DATA WHERE IT HAPPENS.", className: "text-5xl md:text-6xl font-black tracking-tight" },
  { label: "Display LG", spec: "48px / 800 · Inter", sample: "INTELIGENCIA OPERACIONAL.", className: "text-3xl md:text-5xl font-extrabold tracking-tight" },
  { label: "Titular", spec: "32px / 700 · Inter", sample: "Monitoreo en Tiempo Real", className: "text-2xl md:text-3xl font-bold" },
  { label: "Subtítulo", spec: "20px / 600 · Inter", sample: "Discrepancia de stock detectada — Zona 3B", className: "text-lg md:text-xl font-semibold" },
  { label: "Cuerpo", spec: "16px / 400 · Inter", sample: "Un sistema que conecta operaciones físicas con datos en tiempo real para impulsar decisiones, control y escalabilidad.", className: "text-base font-normal" },
  { label: "Datos / Labels", spec: "13px / 500 · Space Grotesk", sample: "TOLERANCIA: 0.001mm / CALIBRE: 8932-A / ZONA: 3B", className: "text-sm font-data font-medium tracking-wider" },
];

// 04 — Persona Carlos (datos reusados)

// 06 — Módulos del sistema
const modules = [
  { n: "01", icon: Activity, title: "Monitoreo en tiempo real", desc: "Inteligencia de video continua en cada zona. Sabe qué está pasando en el momento exacto — desde actividad en estantes hasta patrones de tráfico.", tags: ["Visión por computadora", "Feed en vivo", "Mapeo de zonas"], metric: "< 200ms latencia" },
  { n: "02", icon: Users, title: "Tracking de comportamiento", desc: "Detecta y clasifica patrones de empleados y clientes sin auditorías manuales. Revela anomalías antes de que se conviertan en pérdidas.", tags: ["Clasificación ML", "Detección de anomalías", "Análisis de patrones"], metric: "99.4% precisión" },
  { n: "03", icon: Boxes, title: "Inventario: realidad vs sistema", desc: "Compara lo que la cámara ve en los estantes contra lo que tu sistema dice que debería haber. Elimina stock fantasma y merma no rastreada.", tags: ["Detección de SKU", "Reconciliación", "Alertas de discrepancia"], metric: "±0.3% tolerancia" },
  { n: "04", icon: ShieldCheck, title: "Detección de pérdidas", desc: "Marca transacciones no registradas, movimiento no autorizado de mercancía e indicadores de robo interno o externo.", tags: ["Correlación transaccional", "Indicadores de robo", "Alertas en tiempo real"], metric: "Prom. 3.1s detección" },
  { n: "05", icon: BarChart3, title: "Analítica operacional", desc: "Inteligencia de series de tiempo sobre el rendimiento de tu tienda. Entiende horas pico, zonas de bajo rendimiento y brechas de personal.", tags: ["Series de tiempo", "Mapas de calor", "Dashboard KPI"], metric: "Reportes diarios + semanales" },
];

// 07 — Matriz competitiva
const competitive = [
  { cap: "Registro de transacciones", pos: "✓", cctv: "✕", us: "✓" },
  { cap: "Captura de realidad física", pos: "✕", cctv: "✓", us: "✓" },
  { cap: "Alertas en tiempo real", pos: "~", cctv: "✕", us: "✓" },
  { cap: "Detección de discrepancia de inventario", pos: "✕", cctv: "✕", us: "✓" },
  { cap: "Análisis de comportamiento de empleados", pos: "✕", cctv: "~", us: "✓" },
  { cap: "Detección de pérdidas", pos: "✕", cctv: "~", us: "✓" },
  { cap: "Datos para decisiones operativas", pos: "~", cctv: "✕", us: "✓" },
  { cap: "Monitoreo remoto", pos: "~", cctv: "✓", us: "✓" },
  { cap: "Inteligencia con IA", pos: "✕", cctv: "✕", us: "✓" },
];

// 08 — Tarjetas de alerta (sistema UI)
const alertCards = [
  { level: "CRÍTICO", title: "Discrepancia de stock", desc: "Zona 3B — 4 SKUs sin contabilizar", color: "border-destructive bg-destructive/5", labelColor: "text-destructive" },
  { level: "ADVERTENCIA", title: "Venta no registrada", desc: "Terminal POS 02 — 09:31", color: "border-yellow-500/60 bg-yellow-500/5", labelColor: "text-yellow-600 dark:text-yellow-500" },
  { level: "INFO", title: "Comportamiento marcado", desc: "Cámara 7 — Desviación de empleado", color: "border-primary bg-primary/5", labelColor: "text-primary" },
  { level: "NOMINAL", title: "Rendimiento de tienda", desc: "+12% vs martes pasado", color: "border-green-500/60 bg-green-500/5", labelColor: "text-green-600 dark:text-green-500" },
];

// 11 — Pitch (sin Equipo ni Mentalidad)
const pitchBlocks = [
  { n: "01", label: "Problema", icon: Target, title: "El dolor invisible del retail físico", desc: "Los dueños operan a ciegas y dependen de estar presentes para tener control.", points: ["Sin visibilidad en tiempo real de lo que ocurre en tienda", "Pérdidas, errores y fugas que nadie ve", "El POS no sabe lo que pasó frente al mostrador"], quote: "Le pasa a cada dueño de retail físico que no puede estar en dos lugares." },
  { n: "02", label: "Solución", icon: Lightbulb, title: "Visión + datos, en tiempo real", desc: "Cruzamos visión por computador con el POS para validar la operación al instante.", points: ["Cámaras + IA observan lo que ocurre", "El sistema lo cruza con ventas e inventario", "Detecta inconsistencias y dispara alertas"], quote: "Data where it happens." },
  { n: "03", label: "Impacto", icon: Rocket, title: "Del esfuerzo a la escala", desc: "Reducimos pérdidas y liberamos al dueño de la operación física.", points: ["Menos pérdidas operativas", "Supervisión remota y transparencia real", "Decisiones basadas en lo que de verdad pasa"], quote: "El control del negocio no debería depender de estar presente." },
  { n: "04", label: "Modelo de negocio", icon: Briefcase, title: "SaaS + Setup", desc: "Setup inicial de hardware + suscripción mensual de software e IA.", points: ["Setup desde $3.220.000 COP — hardware, instalación y calibración", "Mensual desde $510.000 COP — software, IA y monitoreo continuo", "El cliente paga por visibilidad, control y escalabilidad"], quote: "Cobramos por el control que antes solo daba la presencia." },
];

const ecosystem = [
  { icon: Store, title: "Presencia física", desc: "Señalética, retail, espacios F&B" },
  { icon: Monitor, title: "Identidad digital", desc: "Plataforma, dashboard, app móvil" },
  { icon: Layers, title: "Sistema de logotipo", desc: "Ícono origami + wordmark" },
  { icon: Radar, title: "Inteligencia en campo", desc: "Visión por computadora en tiempo real" },
];

// Capítulo helper
const ChapterLabel = ({ n, title }: { n: string; title: string }) => (
  <span className="text-xs font-data tracking-widest uppercase text-muted-foreground">
    {n} — {title}
  </span>
);

const Pricing = () => {
  const navigate = useNavigate();
  const [yearly, setYearly] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session) navigate("/supervision", { replace: true });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/supervision", { replace: true });
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [navigate]);

  const getDisplayPrice = (monthly: number | null) => {
    if (monthly === null) return null;
    return yearly ? Math.round(monthly * 0.8) : monthly;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* TOP NAV */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 group">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-sm text-primary-foreground">
              <img src={analoguecoIcon} alt="" className="h-5 w-5" style={{ filter: "brightness(0) invert(1)" }} />
            </div>
            <span className="font-bold tracking-tight">AnalogueCo</span>
            <span className="hidden sm:inline ml-2 text-[10px] font-data tracking-widest uppercase text-muted-foreground border-l border-border pl-2">
              Manual de marca · v1.0
            </span>
          </button>
          <Button onClick={() => navigate("/auth")} size="sm" className="font-medium">
            Login
          </Button>
        </div>
      </header>

      {/* HERO — Inteligencia operacional */}
      <section className="relative overflow-hidden border-b border-border pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.15),transparent_60%)] pointer-events-none" />

        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/50 backdrop-blur mb-6">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-data tracking-wider uppercase text-muted-foreground">
                Inteligencia operacional
              </span>
            </div>

            <h1 className="text-4xl md:text-7xl font-black tracking-tight mb-5 leading-[1.05]">
              DATA WHERE
              <br />
              <span className="text-primary">IT HAPPENS.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Un sistema que conecta operaciones físicas con datos en tiempo real para impulsar decisiones, control y escalabilidad.
            </p>

            {/* Hero metrics */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-10">
              {[
                { v: "< 200ms", l: "Latencia de detección" },
                { v: "99.4%", l: "Tasa de precisión" },
                { v: "24/7", l: "Monitoreo continuo" },
              ].map((m) => (
                <div key={m.l} className="border border-border rounded-md p-4 bg-card/40 backdrop-blur">
                  <div className="font-data text-xl md:text-2xl font-bold tracking-tight text-primary tabular-nums">{m.v}</div>
                  <div className="text-[10px] font-data tracking-widest uppercase text-muted-foreground mt-1">{m.l}</div>
                </div>
              ))}
            </div>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-4 px-5 py-3 rounded-full border border-border bg-card shadow-sm">
              <span className={`text-sm font-medium transition-colors ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
              <Switch checked={yearly} onCheckedChange={setYearly} />
              <span className={`text-sm font-medium transition-colors flex items-center gap-2 ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
                Yearly
                <Badge variant="secondary" className="font-data text-[10px] tracking-wider">-20%</Badge>
              </span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-16 md:pb-20 relative">
          <div className="max-w-5xl mx-auto">
            <div className="relative rounded-xl overflow-hidden border border-border shadow-2xl shadow-primary/10 bg-card">
              <img src={dashboardPreview} alt="AnalogueCo dashboard preview" className="w-full h-auto block" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* 00 — RESUMEN / Acerca del proyecto */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <ChapterLabel n="00" title="Resumen" />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-2">Acerca del proyecto</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto mt-4 leading-relaxed">
              AnalogueCo es un sistema de inteligencia operacional diseñado para negocios físicos. Al integrar visión por computadora con datos transaccionales, permite visibilidad en tiempo real, control y toma de decisiones en el punto donde el negocio realmente sucede.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {[
              { label: "Industria", value: "Retail, F&B, Comercio Físico" },
              { label: "Visión", value: "Cerrar la brecha entre las operaciones físicas y la inteligencia digital." },
              { label: "Misión", value: "Transformar la actividad del mundo real en datos de negocio accionables." },
            ].map((b) => (
              <Card key={b.label}>
                <CardContent className="p-6">
                  <p className="text-[10px] font-data tracking-widest uppercase text-primary mb-3">{b.label}</p>
                  <p className="text-foreground/90 leading-relaxed">{b.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="border border-border rounded-lg p-6 bg-muted/30">
            <p className="text-[10px] font-data tracking-widest uppercase text-muted-foreground mb-4">Personalidad del proyecto</p>
            <div className="flex flex-wrap gap-2">
              {personalityTags.map((t) => (
                <span key={t} className="text-xs font-data tracking-wider uppercase px-3 py-1.5 rounded border border-border bg-background">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PLANS — conservado */}
      <section className="bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-10">
            <ChapterLabel n="—" title="Planes" />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-2">Elige tu nivel de inteligencia</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto">
            {plans.map((plan) => {
              const price = getDisplayPrice(plan.monthly);
              return (
                <Card
                  key={plan.name}
                  className={`relative flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                    plan.highlighted ? "border-primary border-2 shadow-xl shadow-primary/10 lg:scale-105" : "hover:border-primary/40 hover:shadow-lg"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground font-data text-[10px] tracking-widest uppercase px-3 py-1 shadow-lg">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold tracking-tight">{plan.name}</h3>
                      {plan.highlighted && <Sparkles className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground min-h-[40px]">{plan.description}</p>

                    <div className="pt-4">
                      {price !== null ? (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className="font-data text-3xl md:text-4xl font-bold tracking-tight tabular-nums">{formatCOP(price)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground font-data tracking-wider uppercase mt-1">
                            / mes {yearly && "· facturado anual"}
                          </p>
                        </>
                      ) : (
                        <>
                          <span className="font-data text-3xl md:text-4xl font-bold tracking-tight">{plan.customLabel}</span>
                          <p className="text-xs text-muted-foreground font-data tracking-wider uppercase mt-1">pricing</p>
                        </>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-3 mb-6 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-foreground/90">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Button className="w-full" variant={plan.highlighted ? "default" : "outline"} onClick={() => navigate("/auth")}>
                      {plan.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground font-data tracking-wider uppercase mt-8">
            Precios en COP · IVA no incluido
          </p>
        </div>
      </section>

      {/* HARDWARE & INSTALLATION — conservado */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-background mb-4">
                <Wrench className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-data tracking-wider uppercase text-muted-foreground">One-time investment</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Hardware & Installation</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Incluye cámaras, edge device (Jetson), instalación y configuración del sistema.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {setupTiers.map((tier) => (
                <Card key={tier.name} className="bg-background hover:border-primary/40 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
                        <Camera className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-sm">{tier.name}</h3>
                    </div>
                    <div className="font-data text-2xl font-bold tracking-tight tabular-nums">
                      {tier.price !== null ? formatCOP(tier.price) : tier.label}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-data tracking-wider uppercase mt-1">Pago único</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 01 — IDENTIDAD / Sistema de logo */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <ChapterLabel n="01" title="Identidad" />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-2">Sistema de logo</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mt-4">
              Forma geométrica origami — plegada con precisión, mecánicamente exacta. Comunica inteligencia estructural. Nunca distorsionar, recolorear ni añadir efectos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Logo on dark */}
            <Card className="overflow-hidden">
              <div className="aspect-square bg-[#0B0B0B] flex items-center justify-center">
                <div className="h-20 w-20 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/30">
                  <img src={analoguecoIcon} alt="" className="h-12 w-12" style={{ filter: "brightness(0) invert(1)" }} />
                </div>
              </div>
              <CardContent className="p-4 border-t border-border">
                <p className="text-[10px] font-data tracking-widest uppercase text-muted-foreground">Sobre fondo oscuro</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <div className="aspect-square bg-white flex items-center justify-center">
                <div className="h-20 w-20 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
                  <img src={analoguecoIcon} alt="" className="h-12 w-12" style={{ filter: "brightness(0) invert(1)" }} />
                </div>
              </div>
              <CardContent className="p-4 border-t border-border">
                <p className="text-[10px] font-data tracking-widest uppercase text-muted-foreground">Sobre fondo claro</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <div className="aspect-square bg-primary flex items-center justify-center">
                <div className="h-20 w-20 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                  <img src={analoguecoIcon} alt="" className="h-12 w-12" />
                </div>
              </div>
              <CardContent className="p-4 border-t border-border">
                <p className="text-[10px] font-data tracking-widest uppercase text-muted-foreground">Sobre acento eléctrico</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            {[
              { label: "Mínimo digital", value: "32px" },
              { label: "Mínimo impreso", value: "16mm" },
              { label: "Mínimo favicon", value: "24px" },
            ].map((s) => (
              <div key={s.label} className="border border-border rounded-md p-5 text-center bg-card">
                <div className="font-data text-3xl font-bold tracking-tight text-primary">{s.value}</div>
                <p className="text-[10px] font-data tracking-widest uppercase text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 02 — PALETA / Sistema de color */}
      <section className="bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <ChapterLabel n="02" title="Paleta" />
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-2">Sistema de color</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mt-4 flex items-center justify-center gap-2">
                <Palette className="h-4 w-4" />
                Paleta fría e industrial. El único momento cromático — Azul Eléctrico — está dirigido con precisión.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {palette.map((c) => (
                <Card key={c.name} className={`overflow-hidden ${c.accent ? "ring-2 ring-primary" : ""}`}>
                  <div className={`aspect-[5/3] ${c.swatch} flex items-end p-4`}>
                    <span className={`font-data text-xs tracking-widest uppercase ${c.text}`}>{c.hex}</span>
                  </div>
                  <CardContent className="p-4">
                    <p className="font-semibold text-sm">{c.name}</p>
                    <p className="text-[10px] font-data tracking-wider uppercase text-muted-foreground mt-1">{c.hsl}</p>
                    <p className="text-xs text-muted-foreground mt-2">{c.role}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Gradients */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Card className="overflow-hidden">
                <div className="h-32" style={{ background: "linear-gradient(160deg, #0A1540 0%, #1533B0 65%, #1E5EFF 100%)" }} />
                <CardContent className="p-4">
                  <p className="font-semibold text-sm">Degradado Hero</p>
                  <p className="text-[10px] font-data tracking-wider uppercase text-muted-foreground mt-1">160° · #0A1540 → #1E5EFF</p>
                </CardContent>
              </Card>
              <Card className="overflow-hidden">
                <div className="h-32" style={{ background: "linear-gradient(180deg, #0A1540 0%, #1E3A8A 100%)" }} />
                <CardContent className="p-4">
                  <p className="font-semibold text-sm">Degradado Superficie</p>
                  <p className="text-[10px] font-data tracking-wider uppercase text-muted-foreground mt-1">180° · #0A1540 → #1E3A8A</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 03 — TIPOGRAFÍA */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <ChapterLabel n="03" title="Tipografía" />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-2">Sistema tipográfico</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mt-4 flex items-center justify-center gap-2">
              <Type className="h-4 w-4" />
              Dos voces. Inter para display y UI. Space Grotesk para datos, timestamps y lecturas técnicas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
            <Card>
              <CardContent className="p-8">
                <p className="text-[10px] font-data tracking-widest uppercase text-primary mb-4">Primaria — Inter</p>
                <div className="text-7xl font-black tracking-tight mb-4">Aa</div>
                <p className="text-sm text-muted-foreground">Display, UI, geométrica, autoritativa.</p>
                <div className="grid grid-cols-9 gap-1 mt-6">
                  {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((w) => (
                    <div key={w} className="text-center">
                      <div className="text-lg" style={{ fontWeight: w }}>A</div>
                      <div className="text-[9px] font-data text-muted-foreground">{w}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-8">
                <p className="text-[10px] font-data tracking-widest uppercase text-primary mb-4">Datos — Space Grotesk</p>
                <div className="text-7xl font-data font-bold tracking-tight mb-4">Aa</div>
                <p className="text-sm text-muted-foreground">Precios, métricas, timestamps, IDs, especificaciones.</p>
                <div className="font-data text-2xl tracking-wider mt-6">0123456789:.</div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            {typeScale.map((t) => (
              <div key={t.label} className="border border-border rounded-md p-5 bg-card flex flex-col md:flex-row md:items-center gap-4">
                <div className="md:w-44 shrink-0">
                  <p className="text-[10px] font-data tracking-widest uppercase text-primary">{t.label}</p>
                  <p className="text-[10px] font-data tracking-wider uppercase text-muted-foreground mt-1">{t.spec}</p>
                </div>
                <div className={`flex-1 ${t.className} text-foreground/90`}>{t.sample}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 04 — PERSONA */}
      <section className="bg-sidebar text-sidebar-foreground border-y border-sidebar-border">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs font-data tracking-widest uppercase text-primary">04 — Persona de usuario</span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-2 text-white">Usuario principal</h2>
              <p className="text-sidebar-foreground/70 max-w-2xl mx-auto mt-4">
                No es el operador tech-first. Es el dueño que construyó todo con sus manos — y ahora necesita ojos en todos los lugares donde no puede estar.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="rounded-lg overflow-hidden border border-sidebar-border bg-sidebar-accent/30 backdrop-blur">
                <div className="aspect-[4/5] overflow-hidden bg-sidebar-accent">
                  <img src={personaCarlos} alt="Carlos, dueño de tienda retail" className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-5">
                  <p className="text-[10px] font-data tracking-widest uppercase text-sidebar-foreground/60 mb-2">Dueño de tienda retail</p>
                  <h3 className="text-2xl font-bold tracking-tight text-white mb-4">CARLOS</h3>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="border border-sidebar-border rounded-md py-2">
                      <div className="text-[10px] font-data tracking-wider uppercase text-sidebar-foreground/60">Edad</div>
                      <div className="font-data font-bold text-white">44</div>
                    </div>
                    <div className="border border-sidebar-border rounded-md py-2">
                      <div className="text-[10px] font-data tracking-wider uppercase text-sidebar-foreground/60">País</div>
                      <div className="font-data font-bold text-white">MX</div>
                    </div>
                    <div className="border border-sidebar-border rounded-md py-2">
                      <div className="text-[10px] font-data tracking-wider uppercase text-sidebar-foreground/60">Tech</div>
                      <div className="font-data font-bold text-white">Bajo</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 flex flex-col gap-5">
                <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/30 backdrop-blur p-6">
                  <div className="flex flex-wrap gap-2 mb-5">
                    {["Dueño del problema", "Dependiente de operación", "Tomador de decisiones"].map((t) => (
                      <span key={t} className="text-[10px] font-data tracking-widest uppercase px-3 py-1.5 rounded-md border border-sidebar-border text-sidebar-foreground/80">
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="text-sidebar-foreground/90 leading-relaxed mb-4">
                    Carlos es dueño de una tienda retail mediana en Ciudad de México. Construyó el negocio con sus propias manos y gestiona un equipo de 8 personas. No sabe qué pasa cuando no está — y eso le está costando.
                  </p>
                  <blockquote className="text-sidebar-foreground/80 italic border-l-2 border-primary pl-4">
                    "Sé que algo no cuadra. Los números no coinciden con lo que veo. Pero no puedo estar ahí a cada momento."
                  </blockquote>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/30 backdrop-blur p-6">
                    <p className="text-[10px] font-data tracking-widest uppercase text-primary mb-4">Objetivos</p>
                    <ul className="space-y-3">
                      {["Saber qué pasa remotamente, en tiempo real", "Detectar pérdidas antes de que se acumulen", "Entender patrones del equipo", "Tomar decisiones operativas más rápido", "Reducir dependencia de reportes manuales"].map((o) => (
                        <li key={o} className="flex items-start gap-2 text-sm text-sidebar-foreground/90">
                          <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/30 backdrop-blur p-6">
                    <p className="text-[10px] font-data tracking-widest uppercase text-destructive mb-4">Puntos de dolor</p>
                    <ul className="space-y-3">
                      {["Sin visibilidad cuando no está en la tienda", "No confía en los datos actuales de inventario", "No puede monitorear al equipo remotamente", "Los datos del POS no coinciden con la realidad física", "Las pérdidas se descubren semanas después"].map((d) => (
                        <li key={d} className="flex items-start gap-2 text-sm text-sidebar-foreground/90">
                          <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 06 — MÓDULOS DEL SISTEMA */}
      <section className="border-t border-border">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <ChapterLabel n="06" title="Módulos del sistema" />
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-2">Conjunto de funciones</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mt-3">
                Cinco módulos. Una plataforma. Diseñada para hacer visible lo invisible.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {modules.map((m) => (
                <Card key={m.n} className="hover:border-primary/40 hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-data text-xs tracking-widest text-primary">{m.n}</span>
                      <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                        <m.icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold tracking-tight mb-2 uppercase">{m.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{m.desc}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {m.tags.map((t) => (
                        <span key={t} className="text-[10px] font-data tracking-wider uppercase px-2 py-1 rounded border border-border bg-muted/50 text-muted-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="pt-3 border-t border-border">
                      <span className="font-data text-xs tracking-wider text-primary">{m.metric}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 07 — MATRIZ COMPETITIVA */}
      <section className="bg-muted/40 border-y border-border">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <ChapterLabel n="07" title="Posición de mercado" />
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-2">Matriz competitiva</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mt-3">
                POS ve transacciones. CCTV ve grabaciones. AnalogueCo ve ambos — y los conecta en inteligencia accionable.
              </p>
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background">
                      <th className="text-left p-4 font-data text-xs tracking-widest uppercase text-muted-foreground">Capacidad</th>
                      <th className="p-4 font-data text-xs tracking-widest uppercase text-muted-foreground">POS</th>
                      <th className="p-4 font-data text-xs tracking-widest uppercase text-muted-foreground">CCTV</th>
                      <th className="p-4 font-data text-xs tracking-widest uppercase text-primary">AnalogueCo ↗</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitive.map((row, i) => (
                      <tr key={row.cap} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-background"}`}>
                        <td className="p-4 text-foreground/90">{row.cap}</td>
                        <td className="p-4 text-center font-data text-muted-foreground">{row.pos}</td>
                        <td className="p-4 text-center font-data text-muted-foreground">{row.cctv}</td>
                        <td className="p-4 text-center font-data font-bold text-primary">{row.us}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-border bg-background flex flex-wrap gap-x-6 gap-y-1 text-[11px] font-data tracking-wider uppercase text-muted-foreground">
                <span>✓ Capacidad completa</span>
                <span>~ Parcial</span>
                <span>✕ No soportado</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 08 — COMPONENTES / Sistema de UI */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <ChapterLabel n="08" title="Componentes" />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-2">Sistema de UI</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mt-4 flex items-center justify-center gap-2">
              <Square className="h-4 w-4" />
              Cada componente es un interruptor mecánico. Sensación de click, no de squish.
            </p>
          </div>

          {/* Buttons */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <p className="text-[10px] font-data tracking-widest uppercase text-muted-foreground mb-4">Botones</p>
              <div className="flex flex-wrap gap-3">
                <Button>Acción primaria</Button>
                <Button variant="secondary">Secundario</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </CardContent>
          </Card>

          {/* Alert cards */}
          <p className="text-[10px] font-data tracking-widest uppercase text-muted-foreground mb-3">Tarjetas de alerta</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {alertCards.map((a) => (
              <div key={a.level} className={`rounded-md border-l-4 border p-4 ${a.color}`}>
                <p className={`text-[10px] font-data tracking-widest uppercase ${a.labelColor} mb-2`}>{a.level}</p>
                <p className="font-semibold text-sm mb-1">{a.title}</p>
                <p className="text-xs text-muted-foreground font-data">{a.desc}</p>
              </div>
            ))}
          </div>

          {/* Badges */}
          <p className="text-[10px] font-data tracking-widest uppercase text-muted-foreground mb-3">Insignias y etiquetas</p>
          <div className="flex flex-wrap gap-2">
            {[
              { l: "EN VIVO", v: "default" as const },
              { l: "ACTIVO", v: "default" as const },
              { l: "ZONA A", v: "secondary" as const },
              { l: "ALERTA", v: "destructive" as const },
              { l: "ADVERTENCIA", v: "outline" as const },
              { l: "DESCONECTADO", v: "outline" as const },
              { l: "NOMINAL", v: "secondary" as const },
            ].map((b) => (
              <Badge key={b.l} variant={b.v} className="font-data text-[10px] tracking-widest">{b.l}</Badge>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST / METRICS */}
      <section className="bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
              <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                <CardContent className="p-8">
                  <div className="font-data text-5xl md:text-6xl font-bold tracking-tight text-primary tabular-nums">+30%</div>
                  <p className="text-lg font-medium mt-2">Operational visibility</p>
                  <p className="text-sm text-muted-foreground mt-1">Métricas accionables que antes no existían.</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                <CardContent className="p-8">
                  <div className="font-data text-5xl md:text-6xl font-bold tracking-tight text-primary tabular-nums">-25%</div>
                  <p className="text-lg font-medium mt-2">Reducción de pérdidas</p>
                  <p className="text-sm text-muted-foreground mt-1">Detección temprana de mermas y anomalías operativas.</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { quote: "Detectamos en una semana fugas que llevaban meses pasando desapercibidas. El ROI fue inmediato.", author: "Andrés M.", role: "Owner · Restaurante 3 sedes" },
                { quote: "Por fin tengo visibilidad real de lo que pasa cuando no estoy. El dashboard reemplazó 4 herramientas.", author: "Catalina R.", role: "Gerente de Operaciones · Retail" },
                { quote: "Cruzar cámara con POS cambió nuestra forma de auditar. Ya no es percepción, son datos.", author: "Felipe O.", role: "Director · Cadena de cafés" },
              ].map((t) => (
                <Card key={t.author} className="hover:border-primary/40 transition-colors">
                  <CardContent className="p-6">
                    <Quote className="h-6 w-6 text-primary/40 mb-4" />
                    <p className="text-sm leading-relaxed mb-5 text-foreground/90">"{t.quote}"</p>
                    <div className="pt-4 border-t border-border">
                      <p className="font-semibold text-sm">{t.author}</p>
                      <p className="text-xs text-muted-foreground font-data tracking-wider uppercase mt-0.5">{t.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 11 — PITCH 2 MIN (sin Equipo ni Mentalidad) */}
      <section className="border-t border-border">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <ChapterLabel n="11" title="Presentación empresarial" />
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-2">Pitch 2 minutos</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mt-3">
                Cuatro bloques. Una idea fuerte por bloque. Claridad, orden y ritmo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {pitchBlocks.map((b) => (
                <Card key={b.n} className="hover:border-primary/40 hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="font-data text-xs tracking-widest text-primary">{b.n}</span>
                      <span className="text-[10px] font-data tracking-widest uppercase text-muted-foreground border-l border-border pl-3">{b.label}</span>
                      <div className="ml-auto h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
                        <b.icon className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold tracking-tight mb-2 uppercase">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{b.desc}</p>
                    <ul className="space-y-2 mb-5">
                      {b.points.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-sm">
                          <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-foreground/90">{p}</span>
                        </li>
                      ))}
                    </ul>
                    <blockquote className="text-sm italic text-foreground/80 border-l-2 border-primary pl-3">
                      "{b.quote}"
                    </blockquote>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ECOSISTEMA DE MARCA */}
      <section className="bg-sidebar text-sidebar-foreground border-t border-sidebar-border">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs font-data tracking-widest uppercase text-primary">Marca en contexto</span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-2 text-white">Ecosistema AnalogueCo</h2>
              <p className="text-sidebar-foreground/70 max-w-2xl mx-auto mt-3">
                Operamos en todos los puntos de contacto del negocio físico — desde la señalética exterior hasta el dashboard operacional.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {ecosystem.map((e) => (
                <div key={e.title} className="p-6 rounded-lg border border-sidebar-border bg-sidebar-accent/30 backdrop-blur">
                  <div className="h-10 w-10 rounded-md bg-primary/20 flex items-center justify-center mb-4">
                    <e.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">{e.title}</h3>
                  <p className="text-sm text-sidebar-foreground/70 leading-relaxed">{e.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-border">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
              <img src={analoguecoIcon} alt="" className="h-8 w-8" style={{ filter: "brightness(0) invert(1)" }} />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5">
              Bring intelligence to your
              <br />
              <span className="text-primary">physical operations.</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Empieza gratis. Sin tarjeta de crédito. Despliegue en menos de 7 días.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => navigate("/auth")} className="text-base px-8">
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-base px-8">
                Book a Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center">
        <p className="text-xs text-muted-foreground font-data tracking-wider uppercase">
          © {new Date().getFullYear()} AnalogueCo · Manual de marca v1.0 · Data where it happens
        </p>
      </footer>
    </div>
  );
};

export default Pricing;
