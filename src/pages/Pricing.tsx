import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/brand/Logo";
import heroDashboard from "@/assets/hero-dashboard.jpg";
import personaCarlos from "@/assets/persona-carlos.jpg";
import {
  Check,
  Camera,
  Cpu,
  Wrench,
  Eye,
  Link2,
  ShieldAlert,
  Smartphone,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Quote,
  Activity,
  Zap,
  Target,
  X,
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
    cta: "Empezar prueba",
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
    cta: "Empezar prueba",
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
    cta: "Empezar prueba",
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
    cta: "Contactar ventas",
  },
];

const setupTiers = [
  { name: "Starter Setup", price: 3220000 },
  { name: "Growth Setup", price: 4200000 },
  { name: "Scale Setup", price: 5800000 },
  { name: "Enterprise", price: null, label: "Custom" },
];

const valueProps = [
  { icon: Eye, title: "Ve lo que realmente pasa en tu tienda", desc: "Visión por computadora 24/7 sobre cada zona crítica." },
  { icon: Link2, title: "Conecta lo físico con lo transaccional", desc: "Cruza eventos de cámara con cada movimiento del POS." },
  { icon: ShieldAlert, title: "Detecta pérdidas en tiempo real", desc: "Alertas instantáneas antes de que la merma escale." },
  { icon: Smartphone, title: "Gestiona tu negocio remotamente", desc: "Inteligencia operativa accesible desde cualquier lugar." },
];

const detectionEvents = [
  { type: "INVENTARIO", color: "bg-amber-500", title: "Discrepancia de stock", meta: "Zona 3B · hace 2 min" },
  { type: "TRANSACCIÓN", color: "bg-destructive", title: "Venta no registrada", meta: "POS 02 · hace 4 min" },
  { type: "COMPORTAMIENTO", color: "bg-primary", title: "Alerta de empleado", meta: "Cámara 7 · hace 6 min" },
  { type: "ANALÍTICA", color: "bg-emerald-500", title: "Rendimiento +12%", meta: "Tienda Norte · hoy" },
];

const howItWorks = [
  { icon: Wrench, step: "01", title: "Instalamos hardware", desc: "Cámaras + edge device Jetson, instalados por nuestro equipo." },
  { icon: Cpu, step: "02", title: "Conectamos tu POS", desc: "Sincronización con tu sistema de ventas e inventario existente." },
  { icon: TrendingUp, step: "03", title: "Inteligencia 24/7", desc: "Insights accionables, en tiempo real, desde cualquier lugar." },
];

const metrics = [
  { value: "<200ms", label: "Latencia de detección", icon: Zap },
  { value: "99.4%", label: "Tasa de precisión", icon: Target },
  { value: "24/7", label: "Monitoreo continuo", icon: Activity },
];

const testimonials = [
  {
    quote: "Detectamos en una semana fugas que llevaban meses pasando desapercibidas. El ROI fue inmediato.",
    author: "Andrés M.",
    role: "Owner · Restaurante 3 sedes",
  },
  {
    quote: "Por fin tengo visibilidad real de lo que pasa cuando no estoy. El dashboard reemplazó 4 herramientas.",
    author: "Catalina R.",
    role: "Gerente de Operaciones · Retail",
  },
  {
    quote: "Cruzar cámara con POS cambió nuestra forma de auditar. Ya no es percepción, son datos.",
    author: "Felipe O.",
    role: "Director · Cadena de cafés",
  },
];

const personaObjetivos = [
  "Saber qué pasa remotamente, en tiempo real",
  "Detectar pérdidas de inventario antes de que escalen",
  "Entender patrones y comportamientos de empleados",
  "Tomar decisiones operativas más rápido",
  "Reducir dependencia de reportes manuales",
];

const personaDolores = [
  "Sin visibilidad cuando no está en la tienda",
  "No confía en los datos actuales de inventario",
  "No puede monitorear empleados remotamente",
  "Los datos del POS no coinciden con la realidad física",
  "Las pérdidas se descubren semanas después",
];

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
      <header className="fixed top-0 inset-x-0 z-50 border-b border-sidebar-border bg-sidebar/90 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="group">
            <Logo variant="light" />
          </button>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate("/auth")}
              variant="ghost"
              size="sm"
              className="text-sidebar-foreground hover:text-white hover:bg-sidebar-accent font-data tracking-widest text-xs uppercase"
            >
              Login
            </Button>
            <Button
              onClick={() => navigate("/auth")}
              size="sm"
              className="font-data tracking-widest text-xs uppercase"
            >
              Solicitar Demo
            </Button>
          </div>
        </div>
      </header>

      {/* HERO — brutalist split */}
      <section
        className="relative pt-16 text-white overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        {/* blueprint grid */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-foreground)) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* LEFT: copy */}
            <div className="lg:col-span-6 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/20 bg-white/5 backdrop-blur">
                <span className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
                <span className="text-[10px] font-data tracking-[0.2em] uppercase text-white/80">
                  Inteligencia Operacional
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.95]">
                VE LO QUE
                <br />
                REALMENTE
                <br />
                <span className="text-primary">PASA</span> EN TU
                <br />
                NEGOCIO.
              </h1>

              <p className="text-lg text-white/70 max-w-md leading-relaxed">
                Computer vision + POS + inventarios. Una sola plataforma para ver, medir y controlar tu negocio físico.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="font-data tracking-widest text-xs uppercase px-7"
                >
                  Solicitar Demo
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
                  className="font-data tracking-widest text-xs uppercase px-7 border-white/30 text-white bg-transparent hover:bg-white/10 hover:text-white"
                >
                  Ver Planes
                </Button>
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/15">
                {metrics.map((m) => (
                  <div key={m.label}>
                    <div className="font-data text-2xl md:text-3xl font-bold tracking-tight tabular-nums text-white">
                      {m.value}
                    </div>
                    <div className="text-[10px] font-data tracking-widest uppercase text-white/50 mt-1">
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: dashboard with detection cards */}
            <div className="lg:col-span-6 relative">
              {/* Corner brackets */}
              <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-primary z-10" />
              <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-primary z-10" />
              <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-primary z-10" />
              <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-primary z-10" />

              <div className="relative rounded-sm overflow-hidden border border-white/10 shadow-2xl shadow-primary/30">
                <img
                  src={heroDashboard}
                  alt="AnalogueCo dashboard de detección en tienda física"
                  width={1600}
                  height={1024}
                  className="w-full h-auto"
                />

                {/* Floating detection cards */}
                <div className="absolute top-4 left-4 bg-sidebar/95 backdrop-blur border border-sidebar-border p-3 rounded-sm max-w-[180px]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="h-2 w-2 bg-amber-500 rounded-sm" />
                    <span className="text-[9px] font-data tracking-widest uppercase text-white/60">
                      Inventario
                    </span>
                  </div>
                  <p className="text-xs text-white font-medium">Discrepancia · Zona 3B</p>
                </div>

                <div className="absolute top-4 right-4 bg-sidebar/95 backdrop-blur border border-sidebar-border p-3 rounded-sm max-w-[180px]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="h-2 w-2 bg-destructive rounded-sm" />
                    <span className="text-[9px] font-data tracking-widest uppercase text-white/60">
                      Transacción
                    </span>
                  </div>
                  <p className="text-xs text-white font-medium">Venta no registrada · POS 02</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DETECTION SYSTEM STRIP */}
      <section className="bg-sidebar text-white border-y border-sidebar-border">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[10px] font-data tracking-[0.25em] uppercase text-white/50">
              Sistema en vivo · Detecciones recientes
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {detectionEvents.map((e) => (
              <div
                key={e.title}
                className="border border-sidebar-border bg-sidebar-accent/40 p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`h-2 w-2 ${e.color} rounded-sm`} />
                  <span className="text-[10px] font-data tracking-widest uppercase text-white/60">
                    {e.type}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white mb-1">{e.title}</p>
                <p className="text-[11px] text-white/40 font-data">{e.meta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING GRID */}
      <section id="pricing" className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="text-[10px] font-data tracking-[0.25em] uppercase text-muted-foreground">
            03 — Inversión
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mt-3 mb-4">
            Planes que escalan con tu operación
          </h2>
          <p className="text-muted-foreground">
            Infraestructura operativa, no software barato. Elige el plan según el volumen de tu negocio físico.
          </p>

          <div className="inline-flex items-center gap-4 px-5 py-3 mt-8 border border-border bg-card shadow-sm">
            <span className={`text-xs font-data tracking-widest uppercase transition-colors ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>
              Mensual
            </span>
            <Switch checked={yearly} onCheckedChange={setYearly} />
            <span className={`text-xs font-data tracking-widest uppercase transition-colors flex items-center gap-2 ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
              Anual
              <Badge variant="secondary" className="font-data text-[9px] tracking-wider">
                -20%
              </Badge>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const price = getDisplayPrice(plan.monthly);
            return (
              <Card
                key={plan.name}
                className={`relative flex flex-col rounded-sm transition-all duration-300 hover:-translate-y-1 ${
                  plan.highlighted
                    ? "border-primary border-2 shadow-xl shadow-primary/10 lg:scale-[1.02]"
                    : "hover:border-primary/40 hover:shadow-lg"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground font-data text-[10px] tracking-widest uppercase px-3 py-1 shadow-lg rounded-sm">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <span className="text-[10px] font-data tracking-widest uppercase text-muted-foreground">
                    Plan
                  </span>
                  <div className="flex items-center justify-between mt-1 mb-3">
                    <h3 className="text-2xl font-bold tracking-tight">{plan.name}</h3>
                    {plan.highlighted && <Sparkles className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground min-h-[40px]">{plan.description}</p>

                  <div className="pt-4">
                    {price !== null ? (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="font-data text-3xl md:text-4xl font-bold tracking-tighter tabular-nums">
                            {formatCOP(price)}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-data tracking-widest uppercase mt-1">
                          / mes {yearly && "· facturado anual"}
                        </p>
                      </>
                    ) : (
                      <>
                        <span className="font-data text-3xl md:text-4xl font-bold tracking-tighter">
                          {plan.customLabel}
                        </span>
                        <p className="text-[10px] text-muted-foreground font-data tracking-widest uppercase mt-1">
                          pricing
                        </p>
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

                  <Button
                    className="w-full font-data tracking-widest text-xs uppercase"
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => navigate("/auth")}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-[10px] text-muted-foreground font-data tracking-widest uppercase mt-8">
          Precios en COP · IVA no incluido
        </p>
      </section>

      {/* HARDWARE & INSTALLATION */}
      <section className="bg-muted/40 border-y border-border">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] font-data tracking-[0.25em] uppercase text-muted-foreground">
                04 — Pago único
              </span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mt-3 mb-3">
                Hardware & Instalación
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Incluye cámaras, edge device (Jetson), instalación y configuración del sistema.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {setupTiers.map((tier) => (
                <Card key={tier.name} className="bg-background hover:border-primary/40 transition-colors rounded-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-9 w-9 rounded-sm bg-primary/10 flex items-center justify-center">
                        <Camera className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-sm">{tier.name}</h3>
                    </div>
                    <div className="font-data text-2xl font-bold tracking-tighter tabular-nums">
                      {tier.price !== null ? formatCOP(tier.price) : tier.label}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-data tracking-widest uppercase mt-1">
                      Pago único
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PROPOSITION */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[10px] font-data tracking-[0.25em] uppercase text-muted-foreground">
              05 — Por qué AnalogueCo
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mt-3 mb-3">
              No es software más.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Es la capa de inteligencia que conecta lo físico con lo digital.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {valueProps.map((vp) => (
              <div
                key={vp.title}
                className="group p-6 border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all rounded-sm"
              >
                <div className="h-10 w-10 rounded-sm bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                  <vp.icon className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
                </div>
                <p className="font-semibold leading-snug mb-2">{vp.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{vp.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PERSONA — para quien es */}
      <section className="bg-sidebar text-white">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-6xl mx-auto">
            <div className="mb-12">
              <span className="text-[10px] font-data tracking-[0.25em] uppercase text-white/50">
                06 — Para quién
              </span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mt-3 text-white">
                Hecho para dueños de operación.
              </h2>
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
              {/* persona card */}
              <div className="lg:col-span-4 border border-sidebar-border bg-sidebar-accent/30 p-6">
                <div className="relative mb-5">
                  <div className="absolute top-2 left-2 z-10 bg-primary px-2 py-1">
                    <p className="text-[9px] font-data tracking-widest uppercase text-primary-foreground leading-tight">
                      Dueño<br />Identificado
                    </p>
                  </div>
                  <img
                    src={personaCarlos}
                    alt="Carlos, dueño de tienda retail"
                    width={800}
                    height={1024}
                    loading="lazy"
                    className="w-full aspect-square object-cover grayscale"
                  />
                </div>
                <span className="text-[10px] font-data tracking-widest uppercase text-white/50">
                  Dueño de tienda retail
                </span>
                <h3 className="text-3xl font-bold tracking-tighter text-white mt-1 mb-4">CARLOS</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[{ k: "EDAD", v: "44" }, { k: "PAÍS", v: "MX" }, { k: "TECH", v: "Bajo" }].map((s) => (
                    <div key={s.k} className="border border-sidebar-border p-2 text-center">
                      <p className="text-[9px] font-data tracking-widest uppercase text-white/40">{s.k}</p>
                      <p className="text-sm font-bold text-white mt-0.5">{s.v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* description + lists */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="border border-sidebar-border bg-sidebar-accent/30 p-6">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {["Dueño del problema", "Dependiente de operación", "Tomador de decisiones"].map((t) => (
                      <span
                        key={t}
                        className="px-3 py-1 border border-sidebar-border text-[10px] font-data tracking-widest uppercase text-white/70"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="text-white/80 leading-relaxed">
                    Carlos tiene 44 años y es dueño de una tienda retail mediana. Construyó el negocio con sus propias manos y gestiona un equipo de 8 personas. No sabe qué pasa cuando no está — y eso le está costando. Confía en su gente, pero necesita un sistema en el que pueda confiar más.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border border-sidebar-border bg-sidebar-accent/30 p-6">
                    <p className="text-[10px] font-data tracking-widest uppercase text-primary mb-4">
                      Objetivos
                    </p>
                    <ul className="space-y-3">
                      {personaObjetivos.map((o) => (
                        <li key={o} className="flex gap-2 text-sm text-white/80">
                          <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border border-sidebar-border bg-sidebar-accent/30 p-6">
                    <p className="text-[10px] font-data tracking-widest uppercase text-destructive mb-4">
                      Puntos de dolor
                    </p>
                    <ul className="space-y-3">
                      {personaDolores.map((d) => (
                        <li key={d} className="flex gap-2 text-sm text-white/80">
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

      {/* HOW IT WORKS */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[10px] font-data tracking-[0.25em] uppercase text-muted-foreground">
              07 — Implementación
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mt-3">
              Tres pasos. Cero fricción.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {howItWorks.map((s) => (
              <div
                key={s.step}
                className="relative p-6 border border-border bg-card hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-5">
                  <span className="font-data text-xs tracking-widest text-primary">{s.step}</span>
                  <div className="h-10 w-10 rounded-sm bg-primary/10 flex items-center justify-center">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST / METRICS */}
      <section className="bg-muted/40 border-y border-border">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
              <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20 rounded-sm">
                <CardContent className="p-8">
                  <div className="font-data text-5xl md:text-6xl font-bold tracking-tighter text-primary tabular-nums">
                    +30%
                  </div>
                  <p className="text-lg font-semibold mt-2">Visibilidad operativa</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Métricas accionables que antes no existían.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20 rounded-sm">
                <CardContent className="p-8">
                  <div className="font-data text-5xl md:text-6xl font-bold tracking-tighter text-primary tabular-nums">
                    -25%
                  </div>
                  <p className="text-lg font-semibold mt-2">Reducción de pérdidas</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Detección temprana de mermas y anomalías operativas.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {testimonials.map((t) => (
                <Card key={t.author} className="hover:border-primary/40 transition-colors rounded-sm">
                  <CardContent className="p-6">
                    <Quote className="h-6 w-6 text-primary/40 mb-4" />
                    <p className="text-sm leading-relaxed mb-5 text-foreground/90">"{t.quote}"</p>
                    <div className="pt-4 border-t border-border">
                      <p className="font-semibold text-sm">{t.author}</p>
                      <p className="text-[10px] text-muted-foreground font-data tracking-widest uppercase mt-0.5">
                        {t.role}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section
        className="text-white relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-foreground)) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Logo variant="light" showWordmark={false} className="justify-center mb-8 [&>svg]:h-14 [&>svg]:w-14" />
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 leading-[0.95]">
              Bring intelligence to your
              <br />
              <span className="text-primary">physical operations.</span>
            </h2>
            <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto">
              Empieza con una demo. Despliegue en menos de 7 días.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="font-data tracking-widest text-xs uppercase px-8"
              >
                Solicitar Demo
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth")}
                className="font-data tracking-widest text-xs uppercase px-8 border-white/30 text-white bg-transparent hover:bg-white/10 hover:text-white"
              >
                Empezar prueba
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar text-white/60 border-t border-sidebar-border">
        <div className="container mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo variant="light" />
          <p className="text-[10px] font-data tracking-widest uppercase">
            © {new Date().getFullYear()} AnalogueCo · Data where it happens
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
