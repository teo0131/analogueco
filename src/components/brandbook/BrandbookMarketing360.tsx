import { motion } from "framer-motion";
import BrandbookMarketing360Extensions from "./BrandbookMarketing360Extensions";
import { BrandbookDisplayContext, useBrandbookDisplay } from "./brandbookContext";
import {
  Megaphone,
  Globe,
  FileText,
  BarChart3,
  Heart,
  Newspaper,
  Target,
  MessageCircle,
  Users,
  Store,
  Building2,
  Network,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
  Handshake,
} from "lucide-react";

const snap = [0.19, 1, 0.22, 1] as const;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function Block({
  id,
  label,
  title,
  children,
  intro,
}: {
  id: string;
  label: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  const { hideNumbers } = useBrandbookDisplay();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: snap }}
      viewport={{ once: true, margin: "-80px" }}
      className="border-t border-border-subtle pt-10 mb-20"
    >
      <div className="grid grid-cols-12 gap-8 mb-8">
        <div className="col-span-12 md:col-span-4">
          <div className="flex items-baseline gap-3 mb-3">
            {!hideNumbers && (
              <span className="font-mono text-primary text-2xl font-bold">{id}</span>
            )}
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              {label}
            </span>
          </div>
          <h3 className="font-display text-3xl text-foreground leading-tight whitespace-pre-line">
            {title}
          </h3>
        </div>
        {intro && (
          <div className="col-span-12 md:col-span-8 flex items-end">
            <p className="text-foreground/70 text-sm leading-relaxed max-w-[60ch]">
              {intro}
            </p>
          </div>
        )}
      </div>
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-bloques                                                                */
/* -------------------------------------------------------------------------- */

const segments = [
  {
    n: "S1",
    tag: "PRIORITY",
    title: "RETAIL SMEs",
    size: "1–5 locations",
    pain: "The owner cannot be at all locations. Operates by intuition and phone calls.",
    icon: Store,
  },
  {
    n: "S2",
    tag: "EXPANSION",
    title: "SMALL CHAINS",
    size: "5–20 locations",
    pain: "Growth broke their operational oversight. Passive CCTV, KPIs without context.",
    icon: Building2,
  },
  {
    n: "S3",
    tag: "SCALE",
    title: "FRANCHISES / STRUCTURED RETAIL",
    size: "20+ locations",
    pain: "Need to audit brand and operational standards at scale, without staff on-site.",
    icon: Network,
  },
];

function Segmentation() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 border-l border-t border-border-subtle">
      {segments.map((s) => (
        <div
          key={s.n}
          className="border-r border-b border-border-subtle p-6 flex flex-col min-h-[260px]"
        >
          <div className="flex items-center justify-between mb-5">
            <s.icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              {s.tag}
            </span>
          </div>
          <p className="font-mono text-primary text-xs mb-2">{s.n}</p>
          <h4 className="font-display text-xl text-foreground leading-tight mb-1">
            {s.title}
          </h4>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
            {s.size}
          </p>
          <div className="mt-auto pt-4 border-t border-border-subtle">
            <p className="text-xs text-foreground/70 leading-relaxed">{s.pain}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const funnel = [
  {
    stage: "AWARENESS",
    width: "100%",
    goal: "Making invisible pain visible",
    content: "Field posts, short video, real cases",
    channel: "Instagram, organic LinkedIn",
  },
  {
    stage: "CONSIDERATION",
    width: "78%",
    goal: "Demonstrating a concrete solution exists",
    content: "Video demo, POS+CCTV vs AnalogueCo comparison",
    channel: "Web, LinkedIn, retargeting",
  },
  {
    stage: "CONVERSION",
    width: "52%",
    goal: "Closing a pilot in a real location",
    content: "On-site diagnosis, SaaS + setup proposal",
    channel: "WhatsApp, direct sales, demo",
  },
  {
    stage: "LOYALTY",
    width: "32%",
    goal: "Client who expands locations and refers",
    content: "Reports, monthly insights, success stories",
    channel: "Email, CRM, account management",
  },
];

function Funnel() {
  return (
    <div className="border border-border-subtle p-6">
      <div className="space-y-3">
        {funnel.map((f, i) => (
          <div key={f.stage} className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-12 md:col-span-5">
              <div
                className="bg-primary/10 border-l-2 border-primary py-3 pl-4"
                style={{ width: f.width }}
              >
                <p className="font-mono text-[9px] text-muted-foreground">
                  0{i + 1}
                </p>
                <p className="font-display text-sm font-semibold text-foreground tracking-wide">
                  {f.stage}
                </p>
              </div>
            </div>
            <div className="col-span-12 md:col-span-7 grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
                  Objective
                </p>
                <p className="text-foreground/80 leading-snug">{f.goal}</p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
                  Content
                </p>
                <p className="text-foreground/80 leading-snug">{f.content}</p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
                  Channel
                </p>
                <p className="text-foreground/80 leading-snug">{f.channel}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const wheel = [
  { label: "ONLINE", icon: Globe, desc: "Web, ads, social" },
  { label: "OFFLINE", icon: Store, desc: "Field, demo, events" },
  { label: "CONTENT", icon: FileText, desc: "Educate and demonstrate" },
  { label: "DATA & ANALYTICS", icon: BarChart3, desc: "CAC, LTV, attribution" },
  { label: "EXPERIENCE", icon: Heart, desc: "Onboarding, loyalty" },
  { label: "PR & RELATIONS", icon: Newspaper, desc: "Press, community" },
];

function Wheel360() {
  return (
    <div className="grid grid-cols-12 gap-6 items-center">
      <div className="col-span-12 md:col-span-7">
        <div className="grid grid-cols-2 md:grid-cols-3 border-l border-t border-border-subtle">
          {wheel.map((w) => (
            <div
              key={w.label}
              className="border-r border-b border-border-subtle p-5 flex flex-col"
            >
              <w.icon className="w-5 h-5 text-primary mb-3" strokeWidth={1.5} />
              <p className="font-display text-sm font-semibold text-foreground mb-1">
                {w.label}
              </p>
              <p className="text-xs text-foreground/60 leading-snug">{w.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="col-span-12 md:col-span-5">
        <div className="aspect-square relative max-w-[320px] mx-auto">
          <div className="absolute inset-0 rounded-full border border-border-subtle" />
          <div className="absolute inset-6 rounded-full border border-border-subtle" />
          <div className="absolute inset-12 rounded-full border border-primary/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
                OPERATIONAL
              </p>
              <p className="font-display text-lg text-foreground leading-tight">
                CONTROL<br />CENTER
              </p>
            </div>
          </div>
          {wheel.map((w, i) => {
            const angle = (i / wheel.length) * 2 * Math.PI - Math.PI / 2;
            const x = 50 + 46 * Math.cos(angle);
            const y = 50 + 46 * Math.sin(angle);
            return (
              <div
                key={w.label}
                className="absolute w-3 h-3 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${y}%` }}
              />
            );
          })}
        </div>
        <p className="text-xs text-foreground/60 leading-relaxed text-center mt-4 max-w-[40ch] mx-auto">
          Each axis feeds the next: content generates data, data refines
          the experience, experience feeds PR and referrals.
        </p>
      </div>
    </div>
  );
}

function Channels() {
  const direct = [
    "Field sales",
    "LinkedIn",
    "Instagram",
    "Website",
    "WhatsApp",
  ];
  const indirect = ["Installers", "Distributors", "Integration partners"];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="border border-primary p-6 bg-primary/5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
            DIRECT
          </p>
          <span className="font-mono text-[9px] uppercase tracking-widest bg-primary text-primary-foreground px-2 py-1">
            PRIMARY CHANNEL · MVP
          </span>
        </div>
        <ul className="space-y-2">
          {direct.map((c) => (
            <li key={c} className="flex gap-3 text-sm text-foreground">
              <span className="font-mono text-primary">→</span>
              {c}
            </li>
          ))}
        </ul>
      </div>
      <div className="border border-border-subtle p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
          INDIRECT · PHASE 2
        </p>
        <ul className="space-y-2">
          {indirect.map((c) => (
            <li key={c} className="flex gap-3 text-sm text-foreground/70">
              <span className="font-mono text-muted-foreground">→</span>
              {c}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const pillars = [
  {
    n: "01",
    name: "PROBLEM",
    example: "\"Your CCTV only shows you what already happened.\"",
  },
  {
    n: "02",
    name: "DEMONSTRATION",
    example: "Live alert video crossing POS + camera.",
  },
  {
    n: "03",
    name: "EDUCATION",
    example: "Why POS and CCTV don't talk to each other.",
  },
  {
    n: "04",
    name: "BUILD IN PUBLIC",
    example: "Product log, decisions, mistakes.",
  },
  {
    n: "05",
    name: "REAL-WORLD CASE",
    example: "Fraterno Café: how it's used every day.",
  },
];

function ContentPillars() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 border-l border-t border-border-subtle">
      {pillars.map((p) => (
        <div
          key={p.n}
          className="border-r border-b border-border-subtle p-5 flex flex-col min-h-[200px]"
        >
          <span className="font-mono text-primary text-sm font-bold mb-3">
            {p.n}
          </span>
          <p className="font-display text-sm font-semibold text-foreground tracking-wide mb-3">
            {p.name}
          </p>
          <p className="text-xs text-foreground/65 italic leading-snug mt-auto">
            {p.example}
          </p>
        </div>
      ))}
    </div>
  );
}

function MediaPlan() {
  return (
    <div className="border border-border-subtle p-6">
      <div className="flex h-12 mb-5 border border-border-subtle">
        <div className="bg-primary text-primary-foreground flex items-center px-4 font-mono text-xs tracking-widest" style={{ width: "80%" }}>
          ORGANIC · 80%
        </div>
        <div className="bg-secondary text-secondary-foreground flex items-center px-4 font-mono text-xs tracking-widest" style={{ width: "20%" }}>
          PAID · 20%
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary mb-2">
            ORGANIC
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">
            LinkedIn (authority and B2B) · Instagram (field and product) · Community
            and founder-led newsletter.
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            PAID
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Meta Ads segmented by geography and industry · Retargeting to demo
            visitors · LinkedIn Ads for chains.
          </p>
        </div>
      </div>
    </div>
  );
}

const crmFlow = [
  { step: "LEAD", tool: "Form / Ads / Referral" },
  { step: "WHATSAPP", tool: "First human contact" },
  { step: "QUALIFICATION", tool: "CRM · score by locations" },
  { step: "DEMO", tool: "On-site or remote" },
  { step: "CLOSING", tool: "Setup + SaaS signed" },
];

function CRMFlow() {
  return (
    <div className="border border-border-subtle p-6">
      <div className="flex flex-col md:flex-row gap-3 md:gap-2 items-stretch">
        {crmFlow.map((s, i) => (
          <div key={s.step} className="flex items-stretch flex-1">
            <div className="flex-1 border border-border-subtle p-4 flex flex-col">
              <span className="font-mono text-primary text-xs mb-2">
                0{i + 1}
              </span>
              <p className="font-display text-sm font-semibold text-foreground mb-1">
                {s.step}
              </p>
              <p className="text-xs text-foreground/60 leading-snug">{s.tool}</p>
            </div>
            {i < crmFlow.length - 1 && (
              <div className="hidden md:flex items-center px-1 font-mono text-primary">
                →
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-5 pt-5 border-t border-border-subtle flex flex-wrap gap-2">
        {["CRM", "WhatsApp Business", "Email automation", "Demo calendar"].map(
          (t) => (
            <span
              key={t}
              className="font-mono text-[10px] uppercase tracking-widest border border-border-subtle px-2 py-1 text-foreground/70"
            >
              {t}
            </span>
          )
        )}
      </div>
    </div>
  );
}

function Experience() {
  const items = [
    { n: "01", t: "ONBOARDING", d: "Guided setup, calibration, and first 'aha moment' in less than 7 days." },
    { n: "02", t: "ALERTS", d: "Actionable notifications — not noise. The owner knows what to do upon receiving them." },
    { n: "03", t: "REPORTS", d: "Clear weekly summaries: what happened, what changed, what to review." },
    { n: "04", t: "INSIGHTS", d: "Recommendations derived from patterns — converting data into decisions." },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 border-l border-t border-border-subtle">
      {items.map((i) => (
        <div
          key={i.n}
          className="border-r border-b border-border-subtle p-5 min-h-[180px]"
        >
          <p className="font-mono text-primary text-xs mb-2">{i.n}</p>
          <p className="font-display text-sm font-semibold text-foreground tracking-wide mb-2">
            {i.t}
          </p>
          <p className="text-xs text-foreground/65 leading-snug">{i.d}</p>
        </div>
      ))}
    </div>
  );
}

const gtm = [
  {
    p: "PRODUCT",
    v: "Operational oversight platform: vision + POS + actionable alerts.",
  },
  {
    p: "PRICE",
    v: "Setup $3.220.000 COP + SaaS $510.000 COP / month per location.",
  },
  {
    p: "PLACE",
    v: "Colombia (Medellín and Bogotá) — physical retail with active POS.",
  },
  {
    p: "PROMOTION",
    v: "Direct sales + founder-led content + real cases (Fraterno).",
  },
];

function GoToMarket() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 border-l border-t border-border-subtle">
      {gtm.map((g) => (
        <div
          key={g.p}
          className="border-r border-b border-border-subtle p-6 min-h-[140px]"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary mb-3">
            {g.p}
          </p>
          <p className="text-sm text-foreground leading-relaxed">{g.v}</p>
        </div>
      ))}
    </div>
  );
}

function Metrics() {
  const m = [
    { k: "CAC", g: "Acquisition cost per new customer" },
    { k: "CONVERSION", g: "Lead → demo → closing" },
    { k: "LEADS", g: "Volume and quality by channel" },
  ];
  const b = [
    { k: "LTV", g: "Customer lifetime value (fee × active months)" },
    { k: "RETENTION", g: "Monthly and quarterly churn" },
    { k: "CUSTOMER ROI", g: "Losses avoided vs. cost of AnalogueCo" },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="border border-border-subtle p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-primary mb-4">
          MARKETING
        </p>
        <ul className="space-y-3">
          {m.map((x) => (
            <li key={x.k} className="flex justify-between gap-4 border-b border-border-subtle pb-2">
              <span className="font-display text-sm font-semibold text-foreground">
                {x.k}
              </span>
              <span className="text-xs text-foreground/65 text-right max-w-[28ch]">
                {x.g}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="border border-border-subtle p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-primary mb-4">
          BUSINESS
        </p>
        <ul className="space-y-3">
          {b.map((x) => (
            <li key={x.k} className="flex justify-between gap-4 border-b border-border-subtle pb-2">
              <span className="font-display text-sm font-semibold text-foreground">
                {x.k}
              </span>
              <span className="text-xs text-foreground/65 text-right max-w-[28ch]">
                {x.g}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function OfflineHighlight() {
  return (
    <div className="bg-secondary text-secondary-foreground p-10 border border-secondary">
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 md:col-span-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#9DB7FF] mb-3">
            SPECIAL BLOCK
          </p>
          <h4 className="font-display text-3xl text-white leading-tight mb-4">
            THE TOP CHANNEL<br />IMPORTANT IN<br />INITIAL STAGE
          </h4>
          <p className="text-white/70 text-sm leading-relaxed max-w-[40ch]">
            In MVP, AnalogueCo is sold by walking. The street is the channel with the highest
            conversion rate: see the pain, show the solution, install.
          </p>
        </div>
        <div className="col-span-12 md:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { t: "FIELD SALES", d: "Direct visit to the business." },
            { t: "ON-SITE DEMO", d: "Camera + AI running in their store." },
            { t: "LIVE DIAGNOSIS", d: "Show real losses in 30 min." },
          ].map((x) => (
            <div key={x.t} className="border border-white/15 p-5">
              <Target className="w-5 h-5 text-[#9DB7FF] mb-3" strokeWidth={1.5} />
              <p className="font-display text-sm font-semibold text-white mb-2 tracking-wide">
                {x.t}
              </p>
              <p className="text-xs text-white/60 leading-snug">{x.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Componente principal                                                       */
/* -------------------------------------------------------------------------- */

/* ---------- Founder-Led Privado: sub-bloques ---------- */

const brandPrinciples = [
  { icon: ShieldCheck, label: "SERIOUSNESS", desc: "Institutional communication, without personal noise." },
  { icon: Lock, label: "ROBUSTNESS", desc: "System designed to support critical operation." },
  { icon: Handshake, label: "TRUST", desc: "Built with evidence, not with exposure." },
  { icon: Eye, label: "CONTROL", desc: "The client sees their operation, not the brand." },
];

function BrandPrinciples() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 border-l border-t border-border-subtle">
      {brandPrinciples.map((p) => (
        <div
          key={p.label}
          className="border-r border-b border-border-subtle p-6 flex flex-col min-h-[180px]"
        >
          <p.icon className="w-6 h-6 text-primary mb-5" strokeWidth={1.5} />
          <p className="font-display text-base font-semibold text-foreground tracking-wide mb-2">
            {p.label}
          </p>
          <p className="text-xs text-foreground/70 leading-relaxed mt-auto">{p.desc}</p>
        </div>
      ))}
    </div>
  );
}

function VisibilityLayers() {
  const publico = [
    "AnalogueCo brand as protagonist",
    "Institutional communication",
    "Technical and demonstrative content",
    "Focus on product, not on people",
  ];
  const privado = [
    "Direct interaction with clients",
    "Founder present in key meetings",
    "1-on-1 trust building",
    "Technical validation and commercial closing",
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 border border-border-subtle">
      {/* Público */}
      <div className="p-6 border-b md:border-b-0 md:border-r border-border-subtle">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              EXTERNAL LAYER
            </span>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-primary">
            VISIBLE
          </span>
        </div>
        <h4 className="font-display text-2xl text-foreground leading-tight mb-5">
          PUBLIC LEVEL
        </h4>
        <ul className="space-y-2">
          {publico.map((l) => (
            <li key={l} className="text-xs text-foreground/70 flex gap-2">
              <span className="text-primary font-mono">→</span>
              {l}
            </li>
          ))}
        </ul>
      </div>
      {/* Privado */}
      <div className="p-6 bg-foreground/[0.02]">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              INTERNAL LAYER
            </span>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-foreground/60">
            CONTROLLED
          </span>
        </div>
        <h4 className="font-display text-2xl text-foreground leading-tight mb-5">
          PRIVATE LEVEL
        </h4>
        <ul className="space-y-2">
          {privado.map((l) => (
            <li key={l} className="text-xs text-foreground/70 flex gap-2">
              <span className="text-primary font-mono">→</span>
              {l}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const justifications = [
  { n: "01", t: "SENSITIVE DATA", d: "The product manages critical operational information of the client." },
  { n: "02", t: "BACKING, NOT EXPOSURE", d: "The client seeks a solid provider, not a media figure." },
  { n: "03", t: "TRUST IN PRIVATE", d: "Built in controlled spaces: demos, meetings, and diagnoses." },
  { n: "04", t: "COMPANY OVER PERSON", d: "The perception of a solid company prevails over the personal brand." },
];

function Justification() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 border-l border-t border-border-subtle">
      {justifications.map((j) => (
        <div
          key={j.n}
          className="border-r border-b border-border-subtle p-6 flex gap-4"
        >
          <span className="font-mono text-primary text-xl font-bold leading-none">{j.n}</span>
          <div>
            <p className="font-display text-base font-semibold text-foreground tracking-wide mb-2">
              {j.t}
            </p>
            <p className="text-xs text-foreground/70 leading-relaxed">{j.d}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const journey = [
  { label: "CLIENT", icon: Users },
  { label: "ANALOGUECO BRAND", icon: ShieldCheck },
  { label: "TRUST", icon: Handshake },
  { label: "DIRECT INTERACTION", icon: MessageCircle },
  { label: "FOUNDER APPEARS", icon: UserCheck },
  { label: "CLOSING", icon: Target },
];

function CustomerJourney() {
  return (
    <div className="border border-border-subtle p-6">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {journey.map((s, i) => (
          <div key={s.label} className="flex flex-col items-center text-center relative">
            <div className="w-12 h-12 border border-border-subtle flex items-center justify-center mb-3">
              <s.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
            </div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
              0{i + 1}
            </p>
            <p className="font-display text-[11px] font-semibold text-foreground tracking-wide leading-tight">
              {s.label}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-8 pt-6 border-t border-border-subtle grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { l: "EXPERT", d: "Technical voice that validates the solution." },
          { l: "BACKING", d: "Figure present when there is risk or decision." },
          { l: "GUARANTEE", d: "Human commitment behind the system." },
        ].map((p) => (
          <div key={p.l} className="border-l-2 border-primary pl-4">
            <p className="font-display text-sm font-semibold text-foreground tracking-wide mb-1">
              {p.l}
            </p>
            <p className="text-xs text-foreground/70 leading-relaxed">{p.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const guidelines = [
  { ok: false, t: "Influencer-type or personal branding content" },
  { ok: false, t: "Exposure of the founder's personal life" },
  { ok: false, t: "Excessively humanizing the brand" },
  { ok: true, t: "Technical, precise, and reliable tone" },
  { ok: true, t: "Evidence, data, and real system operation" },
  { ok: true, t: "Institutional communication centered on product" },
];

function Guidelines() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 border-l border-t border-border-subtle">
      {guidelines.map((g) => (
        <div
          key={g.t}
          className="border-r border-b border-border-subtle p-5 flex items-start gap-4"
        >
          {g.ok ? (
            <Eye className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
          ) : (
            <EyeOff className="w-5 h-5 text-foreground/40 shrink-0 mt-0.5" strokeWidth={1.5} />
          )}
          <div className="flex-1">
            <p className="font-mono text-[9px] uppercase tracking-widest mb-1 text-muted-foreground">
              {g.ok ? "SÍ" : "NO"}
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed">{g.t}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FounderRole() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 border border-border-subtle">
      <div className="p-6 border-b md:border-b-0 md:border-r border-border-subtle">
        <div className="flex items-center gap-2 mb-4">
          <EyeOff className="w-5 h-5 text-foreground/50" strokeWidth={1.5} />
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            DOES NOT DO
          </span>
        </div>
        <p className="text-sm text-foreground/70 leading-relaxed">
          Does not post on social media. Does not generate public content. Does not act as the public face of the brand.
        </p>
      </div>
      <div className="p-6 border-b md:border-b-0 md:border-r border-border-subtle">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck className="w-5 h-5 text-primary" strokeWidth={1.5} />
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            WHEN THEY ENTER
          </span>
        </div>
        <p className="text-sm text-foreground/70 leading-relaxed">
          Only in advanced stages of the commercial process: demos, on-site diagnostics, and closings.
        </p>
      </div>
      <div className="p-6 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5" strokeWidth={1.5} />
          <span className="font-mono text-[10px] uppercase tracking-widest opacity-80">
            HOW THEY APPEAR
          </span>
        </div>
        <p className="text-sm leading-relaxed">
          As a technical authority and strategic support. The human guarantee behind the system.
        </p>
      </div>
    </div>
  );
}

type Props = {
  showBlocks?: string[];
  hideHeader?: boolean;
  hideClosing?: boolean;
  hideNumbers?: boolean;
};

export default function BrandbookMarketing360({
  showBlocks,
  hideHeader,
  hideClosing,
  hideNumbers,
}: Props = {}) {
  const show = (id: string) => !showBlocks || showBlocks.includes(id);
  return (
    <BrandbookDisplayContext.Provider value={{ hideNumbers }}>
    <section className="bg-background py-24 border-b border-border-subtle">
      <div className="max-w-[1400px] mx-auto px-8">
        {!hideHeader && (
        <div className="grid grid-cols-12 mb-10">
          <div className="col-span-12 md:col-span-5">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
              12 — 360 MARKETING STRATEGY
            </p>
            <h2 className="font-display text-5xl text-foreground leading-[0.95]">
              GO-TO-MARKET<br />360°
            </h2>
          </div>
          <div className="col-span-12 md:col-span-7 flex items-end">
            <p className="text-muted-foreground text-sm leading-relaxed max-w-[60ch]">
              How AnalogueCo brings its product to market: segments, channels,
              content, metrics, and experience, articulated in a single
              coherent strategy.
            </p>
          </div>
        </div>
        )}
        {!hideHeader && <hr className="border-t-2 border-foreground mb-12" />}

        {/* 01 — Insight estratégico */}
        {show("01") && <div id="m360-01" className="scroll-mt-24"><Block
          id="01"
          label="STRATEGIC INTRODUCTION"
          title={"WE DO NOT SELL\nCAMERAS OR SOFTWARE"}
          intro="AnalogueCo sells operational control of the physical business in real time. The camera and software are the means — the product is certainty."
        >
          <div className="bg-primary text-primary-foreground p-10 flex items-center justify-center">
            <p className="font-display text-3xl md:text-4xl text-center leading-tight max-w-[28ch]">
              "Your business should be in your pocket."
            </p>
          </div>
        </Block></div>}

        {/* 02 — Segmentación */}
        {show("02") && <div id="m360-02" className="scroll-mt-24"><Block
          id="02"
          label="MARKET SEGMENTATION"
          title={"THREE LEVELS,\nONE ENTRY ROUTE"}
          intro="We enter through retail SMEs, validate the model, and scale to chains and franchises. Each segment has a different pain point, but the same origin: operational blindness."
        >
          <Segmentation />
        </Block></div>}

        {/* 03 — Funnel */}
        {show("03") && <div id="m360-03" className="scroll-mt-24"><Block
          id="03"
          label="CONVERSION FUNNEL"
          title={"FROM PAIN\nTO LOYALTY"}
          intro="Four stages with defined objectives, content, and channels to avoid improvising the acquisition flow."
        >
          <Funnel />
        </Block></div>}

        {/* 04 — Estrategia 360 */}
        {show("04") && <div id="m360-04" className="scroll-mt-24"><Block
          id="04"
          label="360 STRATEGY"
          title={"SIX AXES\nONE CENTER"}
          intro="Everything revolves around operational control. No channel operates in isolation: each axis feeds the others."
        >
          <Wheel360 />
        </Block></div>}

        {/* 05 — Canales de adquisición */}
        {show("05") && <div id="m360-05" className="scroll-mt-24"><Block
          id="05"
          label="ACQUISITION CHANNELS"
          title={"DIRECT\nFIRST"}
          intro="In MVP, direct sales lead. Indirect channels are activated in the scaling phase."
        >
          <Channels />
        </Block></div>}

        {/* 06 — Estrategia de contenido */}
        {show("06") && <div id="m360-06" className="scroll-mt-24"><Block
          id="06"
          label="CONTENT STRATEGY"
          title={"FIVE\nPILLARS"}
          intro="A content system that teaches, demonstrates, and builds credibility without falling into product advertising."
        >
          <ContentPillars />
        </Block></div>}

        {/* 07 — Plan de medios */}
        {show("07") && <div id="m360-07" className="scroll-mt-24"><Block
          id="07"
          label="MEDIA PLAN"
          title={"80% ORGANIC\n20% PAID"}
          intro="The brand is built with authority and its own narrative. Paid media amplifies what already works organically."
        >
          <MediaPlan />
        </Block></div>}

        {/* 08 — CRM */}
        {show("08") && <div id="m360-08" className="scroll-mt-24"><Block
          id="08"
          label="CRM AND CONVERSION"
          title={"FROM LEAD\nTO CLOSING"}
          intro="A simple, human, and traceable flow. Without unnecessary friction."
        >
          <CRMFlow />
        </Block></div>}

        {/* 09 — Experiencia */}
        {show("09") && <div id="m360-09" className="scroll-mt-24"><Block
          id="09"
          label="CUSTOMER EXPERIENCE"
          title={"LOYALTY IS\nGIVING CONTROL"}
          intro="Loyalty occurs when the client perceives they no longer operate blindly — onboarding, alerts, reports, and insights are designed to reinforce that perception."
        >
          <Experience />
        </Block></div>}

        {/* 10 — Go-to-market */}
        {show("10") && <div id="m360-10" className="scroll-mt-24"><Block
          id="10"
          label="GO-TO-MARKET"
          title={"4P\nMATRIX"}
          intro="Product, price, place, and promotion decisions for this stage."
        >
          <GoToMarket />
        </Block></div>}

        {/* 11 — Métricas */}
        {show("11") && <div id="m360-11" className="scroll-mt-24"><Block
          id="11"
          label="KEY METRICS"
          title={"WHAT WE MEASURE,\nWHAT WE DECIDE"}
          intro="Marketing and business share a dashboard. No marketing metric makes sense without its business counterpart."
        >
          <Metrics />
        </Block></div>}

        {/* 12 — Estrategia offline destacada */}
        {show("12") && <div id="m360-12" className="scroll-mt-24"><Block
          id="12"
          label="OFFLINE STRATEGY"
          title={"THE STREET\nIS THE CHANNEL"}
          intro="In the initial stage, no ad performs like a diagnostic done in front of the owner in their own store."
        >
          <OfflineHighlight />
        </Block></div>}

        {/* 13 — Founder-Led Privado */}
        {show("13") && <div id="m360-13" className="scroll-mt-24"><Block
          id="13"
          label="PRESENCE AND TRUST STRATEGY"
          title={"PRIVATE\nFOUNDER-LED"}
          intro="AnalogueCo does not operate with a visible founder on social media. Authority is built in private, aligned with the nature of the product: security, operational oversight, and sensitive data."
        >
          <div className="space-y-10">
            {/* Principios de marca */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
                13.1 — BRAND PRINCIPLE
              </p>
              <BrandPrinciples />
              <p className="text-xs text-muted-foreground mt-3 max-w-[60ch]">
                We avoid all perception of a personal brand or dependence on the founder.
              </p>
            </div>

            {/* Founder-led privado */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
                13.2 — ROLE OF THE FOUNDER
              </p>
              <FounderRole />
            </div>

            {/* Estrategia de visibilidad */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
                13.3 — VISIBILITY STRATEGY
              </p>
              <VisibilityLayers />
            </div>

            {/* Justificación */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
                13.4 — STRATEGIC JUSTIFICATION
              </p>
              <Justification />
            </div>

            {/* Experiencia del cliente */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
                13.5 — CUSTOMER EXPERIENCE
              </p>
              <CustomerJourney />
            </div>

            {/* Lineamientos */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
                13.6 — COMMUNICATION GUIDELINES
              </p>
              <Guidelines />
            </div>

            {/* Cierre conceptual de la sección */}
            <div className="bg-foreground text-background p-10">
              <p className="font-display text-2xl md:text-3xl leading-tight max-w-[40ch]">
                "The founder is not the attraction channel."
                <span className="text-primary"> It is the support that appears when the client needs certainty.</span>"
              </p>
            </div>
          </div>
        </Block></div>}

        {/* 15 → 26 — Extensiones estratégicas (multistakeholder, JTBD, journey,
            objeciones, ROI, TAM/SAM/SOM, roadmap, pilotos, eventos, etc.) */}
        <BrandbookMarketing360Extensions showBlocks={showBlocks} />

        {/* 27 — Cierre */}
        {!hideClosing && show("27") && <motion.div
          id="m360-27"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: snap }}
          viewport={{ once: true }}
          className="border-t-2 border-foreground pt-10 mt-10 scroll-mt-24"
        >
          <div className="grid grid-cols-12 gap-8 items-center">
            <div className="col-span-12 md:col-span-3">
              {!hideNumbers && (
                <span className="font-mono text-primary text-2xl font-bold">27</span>
              )}
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-2">
                STRATEGIC CLOSING
              </p>
            </div>
            <div className="col-span-12 md:col-span-9">
              <p className="font-display text-3xl md:text-4xl text-foreground leading-tight">
                "AnalogueCo doesn't show what happened.<br />
                <span className="text-primary">
                  It shows what is happening and what to do about it."
                </span>
                "
              </p>
            </div>
          </div>
        </motion.div>}
      </div>
    </section>
    </BrandbookDisplayContext.Provider>
  );
}