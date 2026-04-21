import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Box,
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

  const getDisplayPrice = (monthly: number | null) => {
    if (monthly === null) return null;
    return yearly ? Math.round(monthly * 0.8) : monthly;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
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
      </section>

      {/* PRICING GRID */}
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

      {/* FINAL CTA */}
      <section className="border-t border-border">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
              <Box className="h-8 w-8 text-primary-foreground" />
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
