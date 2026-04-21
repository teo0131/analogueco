import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import analoguecoIcon from "@/assets/analogueco-icon.svg";

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

const valueProps = [
  { icon: Eye, title: "See what really happens in your store" },
  { icon: Link2, title: "Connect physical and transactional data" },
  { icon: ShieldAlert, title: "Detect losses in real time" },
  { icon: Smartphone, title: "Manage your business remotely" },
];

const howItWorks = [
  { icon: Wrench, step: "01", title: "Install hardware", desc: "Cámaras + edge device Jetson instalados por nuestro equipo." },
  { icon: Cpu, step: "02", title: "Connect POS", desc: "Sincronización con tu sistema de ventas e inventario existente." },
  { icon: TrendingUp, step: "03", title: "Get real-time insights", desc: "Inteligencia operativa accionable, 24/7, desde cualquier lugar." },
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
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 group"
          >
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-primary/30 transition-shadow text-primary-foreground">
              <img src={analoguecoIcon} alt="" className="h-5 w-5" style={{ filter: "brightness(0) invert(1)" }} />
            </div>
            <span className="font-bold tracking-tight">AnalogueCo</span>
          </button>
          <Button
            onClick={() => navigate("/auth")}
            size="sm"
            className="font-medium"
          >
            Login
          </Button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.15),transparent_60%)] pointer-events-none" />

        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/50 backdrop-blur mb-6">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-data tracking-wider uppercase text-muted-foreground">
                Data where it happens
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5">
              Inteligencia operativa
              <br />
              <span className="text-primary">en tiempo real.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Computer vision + POS + inventarios. Una sola plataforma para ver, medir y controlar tu negocio físico.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-4 px-5 py-3 rounded-full border border-border bg-card shadow-sm">
              <span className={`text-sm font-medium transition-colors ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>
                Monthly
              </span>
              <Switch checked={yearly} onCheckedChange={setYearly} />
              <span className={`text-sm font-medium transition-colors flex items-center gap-2 ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
                Yearly
                <Badge variant="secondary" className="font-data text-[10px] tracking-wider">
                  -20%
                </Badge>
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard preview */}
        <div className="container mx-auto px-4 pb-16 md:pb-20 relative">
          <div className="max-w-6xl mx-auto">
            {/* Browser-style chrome wrapping a literal mock of the platform */}
            <div className="relative rounded-xl overflow-hidden border border-border shadow-2xl shadow-primary/10 bg-card">
              {/* Top bar */}
              <div className="flex items-center gap-2 px-4 h-9 border-b border-border bg-muted/40">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-primary/40" />
                  <span className="h-2.5 w-2.5 rounded-full bg-primary/70" />
                </div>
                <div className="flex-1 mx-4 h-5 rounded-md bg-background/60 border border-border flex items-center px-3">
                  <span className="text-[10px] font-data tracking-wider text-muted-foreground/70">
                    app.analogueco.com / supervision
                  </span>
                </div>
              </div>

              {/* App body */}
              <div className="grid grid-cols-12 min-h-[420px]">
                {/* Sidebar */}
                <aside className="col-span-3 border-r border-border bg-muted/30 p-4 hidden md:block">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
                      <img src={analoguecoIcon} alt="" className="h-4 w-4" style={{ filter: "brightness(0) invert(1)" }} />
                    </div>
                    <span className="font-bold text-sm tracking-tight">AnalogueCo</span>
                  </div>
                  <nav className="space-y-1">
                    {[
                      { l: "Supervisión", active: true },
                      { l: "Cámaras" },
                      { l: "Alertas" },
                      { l: "POS" },
                      { l: "Inventario" },
                      { l: "Finanzas" },
                      { l: "Empleados" },
                    ].map((it) => (
                      <div
                        key={it.l}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs ${
                          it.active
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${it.active ? "bg-primary" : "bg-muted-foreground/40"}`} />
                        {it.l}
                      </div>
                    ))}
                  </nav>
                </aside>

                {/* Main */}
                <main className="col-span-12 md:col-span-9 p-5 space-y-4">
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-data tracking-widest uppercase text-muted-foreground">
                        Centro de supervisión
                      </p>
                      <h3 className="text-lg font-bold tracking-tight">Tienda Centro · En vivo</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        Online
                      </span>
                      <span className="text-[10px] font-data tracking-wider text-muted-foreground">
                        14:32
                      </span>
                    </div>
                  </div>

                  {/* KPI cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { l: "Ventas hoy", v: "$2.4M", d: "+12%" },
                      { l: "Alertas activas", v: "3", d: "−1" },
                      { l: "Inconsistencias", v: "0.8%", d: "−0.3" },
                    ].map((k) => (
                      <div key={k.l} className="rounded-md border border-border bg-background p-3">
                        <div className="text-[10px] font-data tracking-wider uppercase text-muted-foreground">
                          {k.l}
                        </div>
                        <div className="font-data text-xl font-bold tracking-tight tabular-nums mt-1">
                          {k.v}
                        </div>
                        <div className="text-[10px] text-primary font-data mt-0.5">{k.d}</div>
                      </div>
                    ))}
                  </div>

                  {/* Camera + activity */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 rounded-md border border-border bg-foreground/95 aspect-video relative overflow-hidden">
                      {/* Fake camera grid */}
                      <div className="absolute inset-0 opacity-30 bg-[linear-gradient(to_right,hsl(var(--background))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--background))_1px,transparent_1px)] bg-[size:24px_24px]" />
                      {/* ROI box */}
                      <div className="absolute top-4 left-6 w-20 h-14 border-2 border-primary rounded-sm">
                        <span className="absolute -top-4 left-0 text-[9px] font-data tracking-wider text-primary">
                          ROI · CAJA
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3 px-1.5 py-0.5 bg-destructive rounded-sm text-destructive-foreground text-[9px] font-data tracking-wider">
                        ● REC
                      </div>
                      <div className="absolute bottom-3 left-3 text-[9px] font-data tracking-wider text-background/80">
                        CAM 01 · CAJA PRINCIPAL
                      </div>
                    </div>

                    <div className="rounded-md border border-border bg-background p-3 space-y-2">
                      <div className="text-[10px] font-data tracking-wider uppercase text-muted-foreground mb-1">
                        Actividad
                      </div>
                      {[
                        { t: "Venta #1284", s: "$45.000", c: "bg-primary" },
                        { t: "Alerta movimiento", s: "Bodega", c: "bg-destructive" },
                        { t: "Empleado in", s: "C. Ruiz", c: "bg-muted-foreground" },
                        { t: "Venta #1283", s: "$12.500", c: "bg-primary" },
                      ].map((a, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] py-1 border-b border-border/60 last:border-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`h-1.5 w-1.5 rounded-full ${a.c} shrink-0`} />
                            <span className="truncate">{a.t}</span>
                          </div>
                          <span className="font-data text-muted-foreground tabular-nums">{a.s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const price = getDisplayPrice(plan.monthly);
            return (
              <Card
                key={plan.name}
                className={`relative flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                  plan.highlighted
                    ? "border-primary border-2 shadow-xl shadow-primary/10 lg:scale-105"
                    : "hover:border-primary/40 hover:shadow-lg"
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
                          <span className="font-data text-3xl md:text-4xl font-bold tracking-tight tabular-nums">
                            {formatCOP(price)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-data tracking-wider uppercase mt-1">
                          / mes {yearly && "· facturado anual"}
                        </p>
                      </>
                    ) : (
                      <>
                        <span className="font-data text-3xl md:text-4xl font-bold tracking-tight">
                          {plan.customLabel}
                        </span>
                        <p className="text-xs text-muted-foreground font-data tracking-wider uppercase mt-1">
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
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => navigate(plan.monthly === null ? "/auth" : "/auth")}
                  >
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
      </section>

      {/* HARDWARE & INSTALLATION */}
      <section className="bg-muted/40 border-y border-border">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-background mb-4">
                <Wrench className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-data tracking-wider uppercase text-muted-foreground">
                  One-time investment
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                Hardware & Installation
              </h2>
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
                    <p className="text-[11px] text-muted-foreground font-data tracking-wider uppercase mt-1">
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
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              ¿Por qué AnalogueCo?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              No es software más. Es la capa de inteligencia que conecta lo físico con lo digital.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {valueProps.map((vp) => (
              <div
                key={vp.title}
                className="group p-6 rounded-lg border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <vp.icon className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
                </div>
                <p className="font-semibold leading-snug">{vp.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-sidebar text-sidebar-foreground">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <span className="text-xs font-data tracking-widest uppercase text-sidebar-foreground/60">
                How it works
              </span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-2 text-white">
                Tres pasos. Cero fricción.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {howItWorks.map((s, i) => (
                <div
                  key={s.step}
                  className="relative p-6 rounded-lg border border-sidebar-border bg-sidebar-accent/30 backdrop-blur"
                >
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-data text-xs tracking-widest text-primary">{s.step}</span>
                    <div className="h-10 w-10 rounded-md bg-primary/20 flex items-center justify-center">
                      <s.icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{s.title}</h3>
                  <p className="text-sm text-sidebar-foreground/70 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TRUST / METRICS */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <CardContent className="p-8">
                <div className="font-data text-5xl md:text-6xl font-bold tracking-tight text-primary tabular-nums">
                  +30%
                </div>
                <p className="text-lg font-medium mt-2">Operational visibility</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Métricas accionables que antes no existían.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <CardContent className="p-8">
                <div className="font-data text-5xl md:text-6xl font-bold tracking-tight text-primary tabular-nums">
                  -25%
                </div>
                <p className="text-lg font-medium mt-2">Reducción de pérdidas</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Detección temprana de mermas y anomalías operativas.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <Card key={t.author} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-6">
                  <Quote className="h-6 w-6 text-primary/40 mb-4" />
                  <p className="text-sm leading-relaxed mb-5 text-foreground/90">"{t.quote}"</p>
                  <div className="pt-4 border-t border-border">
                    <p className="font-semibold text-sm">{t.author}</p>
                    <p className="text-xs text-muted-foreground font-data tracking-wider uppercase mt-0.5">
                      {t.role}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PERSONA — built for */}
      <section className="bg-sidebar text-sidebar-foreground border-t border-sidebar-border">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs font-data tracking-widest uppercase text-primary">
                Built for
              </span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-2 text-white">
                Dueños que necesitan ver lo invisible.
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile card */}
              <div className="rounded-lg overflow-hidden border border-sidebar-border bg-sidebar-accent/30 backdrop-blur">
                <div className="aspect-[4/5] relative bg-gradient-to-br from-sidebar-accent to-sidebar overflow-hidden">
                  {/* Tech grid overlay */}
                  <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,hsl(var(--sidebar-foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--sidebar-foreground))_1px,transparent_1px)] bg-[size:32px_32px]" />
                  {/* ROI corner brackets */}
                  <div className="absolute top-4 left-4 h-5 w-5 border-l-2 border-t-2 border-primary" />
                  <div className="absolute top-4 right-4 h-5 w-5 border-r-2 border-t-2 border-primary" />
                  <div className="absolute bottom-4 left-4 h-5 w-5 border-l-2 border-b-2 border-primary" />
                  <div className="absolute bottom-4 right-4 h-5 w-5 border-r-2 border-b-2 border-primary" />
                  {/* Identified tag */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-primary rounded-sm">
                    <p className="text-[9px] font-data tracking-widest uppercase text-primary-foreground leading-none">
                      Sujeto identificado
                    </p>
                  </div>
                  {/* Initials */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="font-data text-7xl font-bold text-white/90 tracking-tight">C</div>
                      <div className="text-[10px] font-data tracking-widest uppercase text-sidebar-foreground/50 mt-2">
                        ID · 044-MX
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-[10px] font-data tracking-widest uppercase text-sidebar-foreground/60 mb-2">
                    Dueño de tienda retail
                  </p>
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

              {/* Description + tags */}
              <div className="lg:col-span-2 flex flex-col gap-5">
                <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/30 backdrop-blur p-6">
                  <div className="flex flex-wrap gap-2 mb-5">
                    {["Dueño del problema", "Dependiente de operación", "Tomador de decisiones"].map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-data tracking-widest uppercase px-3 py-1.5 rounded-md border border-sidebar-border text-sidebar-foreground/80"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="text-sidebar-foreground/90 leading-relaxed">
                    Carlos es dueño de una tienda retail mediana. Construyó el negocio con sus
                    propias manos y gestiona un equipo de 8 personas. No sabe qué pasa cuando no
                    está — y eso le está costando. Confía en su gente, pero necesita un sistema en
                    el que pueda confiar más.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Objetivos */}
                  <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/30 backdrop-blur p-6">
                    <p className="text-[10px] font-data tracking-widest uppercase text-primary mb-4">
                      Objetivos
                    </p>
                    <ul className="space-y-3">
                      {[
                        "Saber qué pasa remotamente, en tiempo real",
                        "Detectar pérdidas antes de que se acumulen",
                        "Entender patrones de comportamiento del equipo",
                        "Tomar decisiones operativas más rápido",
                        "Reducir dependencia de reportes manuales",
                      ].map((o) => (
                        <li key={o} className="flex items-start gap-2 text-sm text-sidebar-foreground/90">
                          <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Puntos de dolor */}
                  <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/30 backdrop-blur p-6">
                    <p className="text-[10px] font-data tracking-widest uppercase text-destructive mb-4">
                      Puntos de dolor
                    </p>
                    <ul className="space-y-3">
                      {[
                        "Sin visibilidad cuando no está en la tienda",
                        "No confía en los datos actuales de inventario",
                        "No puede monitorear al equipo remotamente",
                        "Los datos del POS no coinciden con la realidad física",
                        "Las pérdidas se descubren semanas después",
                      ].map((d) => (
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

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center">
        <p className="text-xs text-muted-foreground font-data tracking-wider uppercase">
          © {new Date().getFullYear()} AnalogueCo · Data where it happens
        </p>
      </footer>
    </div>
  );
};

export default Pricing;
