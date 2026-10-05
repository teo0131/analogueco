import { motion } from "framer-motion";
import { useBrandbookDisplay } from "./brandbookContext";
import {
  Crown,
  Wrench,
  ShieldAlert,
  Calculator,
  ServerCog,
  Briefcase,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Map,
  Calendar,
  PlayCircle,
  Presentation,
  Coffee,
  Handshake,
  Award,
  Layers,
  Globe2,
  Target,
  Gauge,
  Lock,
  FileCheck,
  Database,
  ScrollText,
} from "lucide-react";

const snap = [0.19, 1, 0.22, 1] as const;

function Block({
  id,
  label,
  title,
  intro,
  children,
  provisional = false,
}: {
  id: string;
  label: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
  provisional?: boolean;
}) {
  const { hideNumbers } = useBrandbookDisplay();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: snap }}
      viewport={{ once: true, margin: "-80px" }}
      className="border-t border-border-subtle pt-10 mb-20"
      data-provisional={provisional ? "true" : undefined}
    >
      <div className="grid grid-cols-12 gap-8 mb-8">
        <div className="col-span-12 md:col-span-4">
          <div className="flex items-baseline gap-3 mb-3">
            {!hideNumbers && <span
              className={
                "font-mono text-primary text-2xl font-bold" +
                (provisional
                  ? " underline decoration-dotted decoration-primary/30 underline-offset-[6px]"
                  : "")
              }
            >
              {id}
            </span>}
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

/* 15 — MULTISTAKEHOLDER ----------------------------------------------------- */

const stakeholders = [
  {
    icon: Crown,
    role: "OWNER / FOUNDER",
    type: "ECONOMIC DECISION MAKER",
    pain: "Operates by presence. Loses control when delegating.",
    msg: "Regains control without having to be there.",
  },
  {
    icon: Wrench,
    role: "OPERATIONS MANAGER",
    type: "DAILY INFLUENCER",
    pain: "Oversees with passive CCTV, calls, and spreadsheets.",
    msg: "Moves from reactive to auditable in real time.",
  },
  {
    icon: ShieldAlert,
    role: "LOSS PREVENTION / SECURITY HEAD",
    type: "CRITICAL INFLUENCER",
    pain: "Detects fraud after, not during.",
    msg: "Actionable alerts cross-referenced with POS.",
  },
  {
    icon: Calculator,
    role: "CFO / ADMINISTRATION",
    type: "FINANCIAL APPROVER",
    pain: "Does not quantify invisible losses.",
    msg: "Measurable ROI: avoided losses > SaaS cost.",
  },
  {
    icon: ServerCog,
    role: "IT / INTEGRATION",
    type: "TECHNICAL APPROVER",
    pain: "Fears long integration projects.",
    msg: "Deploy in 7 days over existing POS and CCTV.",
  },
];

function Stakeholders() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 border-l border-t border-border-subtle">
      {stakeholders.map((s) => (
        <div
          key={s.role}
          className="border-r border-b border-border-subtle p-5 flex flex-col min-h-[260px]"
        >
          <s.icon className="w-6 h-6 text-primary mb-4" strokeWidth={1.5} />
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">
            {s.type}
          </p>
          <p className="font-display text-sm font-semibold text-foreground tracking-wide mb-3 leading-tight">
            {s.role}
          </p>
          <p className="text-xs text-foreground/65 leading-snug mb-3">{s.pain}</p>
          <p className="text-xs text-primary leading-snug mt-auto pt-3 border-t border-border-subtle">
            {s.msg}
          </p>
        </div>
      ))}
    </div>
  );
}

/* 16 — JOBS TO BE DONE ------------------------------------------------------ */

const jtbd = [
  {
    type: "FUNCTIONAL",
    jobs: [
      "Oversee multiple locations without being physically present.",
      "Cross-reference what happens on the floor with POS records.",
      "Detect losses, shrinkage, and deviations in real time.",
    ],
  },
  {
    type: "EMOTIONAL",
    jobs: [
      "Stop operating with anxiety and distrust.",
      "Feeling that the business does not depend on my presence.",
      "Having evidence, not suspicions.",
    ],
  },
  {
    type: "SOCIAL",
    jobs: [
      "Project a professional and auditable operation.",
      "Build a business that can scale locations.",
      "Transition from merchant to structured operator.",
    ],
  },
];

function JobsToBeDone() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 border-l border-t border-border-subtle">
      {jtbd.map((j) => (
        <div key={j.type} className="border-r border-b border-border-subtle p-6 flex flex-col">
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary mb-5">
            {j.type}
          </p>
          <ul className="space-y-3">
            {j.jobs.map((x) => (
              <li key={x} className="text-sm text-foreground/80 leading-snug flex gap-2">
                <span className="text-primary font-mono shrink-0">→</span>
                {x}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* 17 — PAINS & GAINS -------------------------------------------------------- */

const pgRows = [
  {
    seg: "RETAIL SMEs · 1–5 locations",
    pains: [
      "Daily invisible losses.",
      "Total dependence on the owner.",
      "CCTV is only reviewed after something has happened.",
    ],
    gains: [
      "Remote control from a cell phone.",
      "Actionable alerts, not noise.",
      "Auditable operation without hiring more people.",
    ],
  },
  {
    seg: "CHAINS · 5–20 locations",
    pains: [
      "Inconsistent operational oversight between locations.",
      "KPIs without physical context.",
      "Growth that breaks the operation.",
    ],
    gains: [
      "Measurable operational standard per location.",
      "Real-time location-to-location comparisons.",
      "Scaling with visibility.",
    ],
  },
  {
    seg: "FRANCHISES · 20+ locations",
    pains: [
      "Impossible to audit brand on-site.",
      "Reputational risk due to non-compliance.",
      "Manual and delayed reports.",
    ],
    gains: [
      "Continuous standards auditing.",
      "Enterprise operational traceability.",
      "Multi-site aggregated intelligence.",
    ],
  },
];

function PainsGains() {
  return (
    <div className="border border-border-subtle overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-foreground/[0.02]">
            <th className="text-left p-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground w-1/4">
              Segment
            </th>
            <th className="text-left p-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Pains
            </th>
            <th className="text-left p-4 font-mono text-[10px] uppercase tracking-widest text-primary">
              Gains with AnalogueCo
            </th>
          </tr>
        </thead>
        <tbody>
          {pgRows.map((r) => (
            <tr key={r.seg} className="border-b border-border-subtle last:border-0 align-top">
              <td className="p-4 font-display text-sm font-semibold text-foreground">
                {r.seg}
              </td>
              <td className="p-4">
                <ul className="space-y-1.5">
                  {r.pains.map((p) => (
                    <li key={p} className="text-xs text-foreground/70 flex gap-2">
                      <span className="text-foreground/40">−</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </td>
              <td className="p-4">
                <ul className="space-y-1.5">
                  {r.gains.map((g) => (
                    <li key={g} className="text-xs text-foreground/80 flex gap-2">
                      <span className="text-primary">+</span>
                      {g}
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* 18 — CUSTOMER JOURNEY COMERCIAL ------------------------------------------ */

const journey = [
  {
    stage: "DISCOVERY",
    think: "I know something isn't right at my locations.",
    pain: "Operates by intuition, without evidence.",
    touch: "LinkedIn / Instagram / Direct referral",
    action: "Field content + real cases.",
  },
  {
    stage: "CONSIDERATION",
    think: "Aren't POS and CCTV enough?",
    pain: "Does not understand what AnalogueCo does differently.",
    touch: "Web / Video demo / Comparison",
    action: "Cross-demo POS+vision in 5 minutes.",
  },
  {
    stage: "DIAGNOSIS",
    think: "I want to see my real losses.",
    pain: "Afraid to open the business's black box.",
    touch: "On-site visit · 30 min",
    action: "In-situ diagnosis + loss estimation.",
  },
  {
    stage: "PILOT",
    think: "Let's try one location first.",
    pain: "Fear of change and setup.",
    touch: "Pilot location · 30 days",
    action: "Guided setup + weekly report.",
  },
  {
    stage: "CONTRACTING",
    think: "I want this at all my locations.",
    pain: "Justifying investment to CFO/partners.",
    touch: "Enterprise proposal + ROI case",
    action: "Setup + SaaS per location, phased expansion.",
  },
  {
    stage: "EXPANSION",
    think: "What else can I automate?",
    pain: "Wants to extract more value from the system.",
    touch: "Monthly account management",
    action: "Insights, new modules, derivative cases.",
  },
];

function CommercialJourney() {
  return (
    <div className="border border-border-subtle overflow-x-auto">
      <table className="w-full text-sm min-w-[820px]">
        <thead>
          <tr className="border-b border-border-subtle bg-foreground/[0.02]">
            {["Stage", "What they think", "Pain", "Touchpoint", "AnalogueCo Action"].map((h) => (
              <th
                key={h}
                className="text-left p-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {journey.map((j, i) => (
            <tr
              key={j.stage}
              className="border-b border-border-subtle last:border-0 align-top"
            >
              <td className="p-4 w-[18%]">
                <span className="font-mono text-primary text-xs">0{i + 1}</span>
                <p className="font-display text-sm font-semibold text-foreground tracking-wide mt-1">
                  {j.stage}
                </p>
              </td>
              <td className="p-4 text-xs text-foreground/80 italic">"{j.think}"</td>
              <td className="p-4 text-xs text-foreground/70">{j.pain}</td>
              <td className="p-4 text-xs text-foreground/70">{j.touch}</td>
              <td className="p-4 text-xs text-foreground">{j.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* 19 — OBJECIONES ----------------------------------------------------------- */

const objections = [
  {
    o: "I already have cameras, why AnalogueCo?",
    a: "Your cameras record. AnalogueCo interprets and crosses data with your POS to alert you in the moment, not after.",
  },
  {
    o: "Does this integrate with my current POS?",
    a: "We work with the most used POS in retail. Guided integration during setup, without replacing systems.",
  },
  {
    o: "Will my employees feel watched?",
    a: "It is not individual surveillance. It is operational traceability: we validate processes, not people.",
  },
  {
    o: "How long does it take to implement?",
    a: "Site setup in less than a week. First 'aha moment' within the first 7 days.",
  },
  {
    o: "It is too expensive for my operation.",
    a: "The average ROI recovers the investment through avoided losses within the first quarter.",
  },
  {
    o: "What happens to my data?",
    a: "Encrypted information, controlled storage, and client-only access. Enterprise-level security.",
  },
];

function Objections() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 border-l border-t border-border-subtle">
      {objections.map((x, i) => (
        <div key={x.o} className="border-r border-b border-border-subtle p-6 flex gap-4">
          <span className="font-mono text-primary text-xl font-bold leading-none">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <p className="font-display text-sm font-semibold text-foreground leading-snug mb-2">
              "{x.o}"
            </p>
            <p className="text-xs text-foreground/70 leading-relaxed">
              <span className="font-mono text-[9px] uppercase tracking-widest text-primary mr-2">
                A:
              </span>
              {x.a}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* 20 — NARRATIVA DE ROI ----------------------------------------------------- */

function ROI() {
  const rows = [
    { k: "Average invisible loss per location / month", v: "$1.800.000 COP", neg: true },
    { k: "AnalogueCo SaaS investment / location / month", v: "$510.000 COP", neg: false },
    { k: "One-time setup per location", v: "$3.220.000 COP", neg: false },
    { k: "Estimated avoided losses (60%)", v: "$1.080.000 COP / month", neg: false, hl: true },
    { k: "Net monthly ROI per location", v: "+$570.000 COP", neg: false, hl: true },
    { k: "Setup recovery time", v: "≈ 4–5 months", neg: false, hl: true },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-7 border border-border-subtle p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-primary mb-4">
          ROI MODEL · PER LOCATION
        </p>
        <ul className="divide-y divide-border-subtle">
          {rows.map((r) => (
            <li
              key={r.k}
              className={`flex justify-between gap-4 py-3 text-sm ${
                r.hl ? "text-foreground" : "text-foreground/70"
              }`}
            >
              <span>{r.k}</span>
              <span
                className={`font-mono font-semibold ${
                  r.hl ? "text-primary" : r.neg ? "text-foreground/60" : "text-foreground"
                }`}
              >
                {r.v}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="md:col-span-5 bg-secondary text-secondary-foreground p-8 flex flex-col justify-center">
        <TrendingUp className="w-7 h-7 text-[#9DB7FF] mb-5" strokeWidth={1.5} />
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#9DB7FF] mb-3">
          ENTERPRISE NARRATIVE
        </p>
        <p className="font-display text-2xl text-white leading-tight mb-4">
          It is not an expense.<br />It is the first line of operational defense.
        </p>
        <p className="text-sm text-white/70 leading-relaxed">
          AnalogueCo pays for itself with what the business used to overlook. The SaaS replaces
          supervision man-hours and converts passive CCTV into operational
          intelligence infrastructure.
        </p>
      </div>
    </div>
  );
}

/* 21 — TAM / SAM / SOM ------------------------------------------------------ */

function TamSamSom() {
  const tiers = [
    {
      k: "TAM",
      label: "TOTAL ADDRESSABLE MARKET",
      v: "LatAm physical retail",
      n: "≈ 2.8M",
      sub: "physical points of sale with active POS",
      w: "100%",
    },
    {
      k: "SAM",
      label: "SERVICEABLE ADDRESSABLE MARKET",
      v: "Colombia + Andean Region",
      n: "≈ 180K",
      sub: "SMEs and retail chains with 1–50 locations",
      w: "60%",
    },
    {
      k: "SOM",
      label: "SERVICEABLE OBTAINABLE MARKET",
      v: "Medellín · Bogotá",
      n: "≈ 1.200",
      sub: "target locations in the first 24 months",
      w: "25%",
    },
  ];
  return (
    <div className="space-y-3">
      {tiers.map((t) => (
        <div
          key={t.k}
          className="border border-border-subtle p-5 grid grid-cols-12 gap-4 items-center"
        >
          <div className="col-span-12 md:col-span-2">
            <p className="font-mono text-primary text-3xl font-bold">{t.k}</p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mt-1">
              {t.label}
            </p>
          </div>
          <div className="col-span-12 md:col-span-4">
            <p className="font-display text-base font-semibold text-foreground">{t.v}</p>
            <p className="text-xs text-foreground/65 mt-1">{t.sub}</p>
          </div>
          <div className="col-span-12 md:col-span-6">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-foreground/[0.05]">
                <div
                  className="h-full bg-primary"
                  style={{ width: t.w }}
                />
              </div>
              <span className="font-mono text-sm text-foreground font-semibold w-20 text-right">
                {t.n}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* 22 — ROADMAP COMERCIAL POR FASES + 30-60-90 ------------------------------ */

const phases = [
  {
    n: "PHASE 0",
    name: "VALIDATION",
    months: "M0 – M3",
    goal: "Test the model in real locations.",
    bullets: ["3–5 paid pilots", "Consolidated Fraterno case", "Validated pricing"],
  },
  {
    n: "PHASE 1",
    name: "TRACTION",
    months: "M3 – M9",
    goal: "Commercial traction in Medellín.",
    bullets: ["15–25 active locations", "Founder-led outbound", "Replicable pipeline"],
  },
  {
    n: "PHASE 2",
    name: "SCALING",
    months: "M9 – M18",
    goal: "Replicate in Bogotá and chains.",
    bullets: ["Initial sales team", "Installation partners", "Target ARR"],
  },
  {
    n: "PHASE 3",
    name: "EXPANSION",
    months: "M18 – M36",
    goal: "Verticalization and LatAm.",
    bullets: ["Andean opening", "Enterprise cases", "Multi-vertical product"],
  },
];

function Roadmap() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 border-l border-t border-border-subtle">
      {phases.map((p) => (
        <div
          key={p.n}
          className="border-r border-b border-border-subtle p-5 flex flex-col min-h-[260px]"
        >
          <p className="font-mono text-primary text-xs font-bold">{p.n}</p>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mt-1 mb-3">
            {p.months}
          </p>
          <p className="font-display text-base font-semibold text-foreground tracking-wide mb-2">
            {p.name}
          </p>
          <p className="text-xs text-foreground/70 leading-snug mb-3">{p.goal}</p>
          <ul className="space-y-1 mt-auto pt-3 border-t border-border-subtle">
            {p.bullets.map((b) => (
              <li key={b} className="text-xs text-foreground/75 flex gap-2">
                <span className="text-primary font-mono">·</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

const plan906030 = [
  {
    d: "30",
    title: "VALIDATE ON-SITE",
    items: [
      "10 in-situ diagnostics performed",
      "3 pilots signed",
      "Fraterno Case Study published",
    ],
  },
  {
    d: "60",
    title: "CLOSE PILOTS",
    items: [
      "Pilot → SaaS conversion ≥ 60%",
      "Active outbound pipeline on LinkedIn",
      "First qualified referrals",
    ],
  },
  {
    d: "90",
    title: "SCALE THE MODEL",
    items: [
      "10+ active locations",
      "Documented sales playbook",
      "Stable and predictable base MRR",
    ],
  },
];

function Plan906030() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {plan906030.map((p) => (
        <div key={p.d} className="border border-border-subtle p-6">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-mono text-primary text-4xl font-bold leading-none">
              {p.d}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              DAYS
            </span>
          </div>
          <p className="font-display text-sm font-semibold text-foreground tracking-wide mb-4">
            {p.title}
          </p>
          <ul className="space-y-2">
            {p.items.map((i) => (
              <li key={i} className="text-xs text-foreground/75 leading-snug flex gap-2">
                <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                {i}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* 23 — PILOTOS Y DEMOS ------------------------------------------------------ */

const pilotSteps = [
  { n: "01", t: "DIAGNOSIS", d: "On-site visit, camera mapping, POS, and inventory." },
  { n: "02", t: "SETUP", d: "AI calibration and POS connection in less than 7 days." },
  { n: "03", t: "OPERATION", d: "30 days with alerts and weekly reporting to the client." },
  { n: "04", t: "EVALUATION", d: "ROI report and conversion to annual contract." },
];

const demoFormats = [
  { icon: PlayCircle, t: "REMOTE DEMO", d: "Dashboard walkthrough with real data from the Fraterno case." },
  { icon: Presentation, t: "ON-SITE DEMO", d: "Camera and AI running in their own store for 30 min." },
  { icon: Target, t: "IN-SITU DIAGNOSTIC", d: "Estimation of real losses before proposing a pilot." },
];

function PilotsAndDemos() {
  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
          23.1 — PILOT STRUCTURE · 30 DAYS
        </p>
        <div className="border border-border-subtle p-6">
          <div className="flex flex-col md:flex-row gap-3 md:gap-2">
            {pilotSteps.map((s, i) => (
              <div key={s.n} className="flex items-stretch flex-1">
                <div className="flex-1 border border-border-subtle p-4 flex flex-col">
                  <span className="font-mono text-primary text-xs mb-2">{s.n}</span>
                  <p className="font-display text-sm font-semibold text-foreground mb-1">
                    {s.t}
                  </p>
                  <p className="text-xs text-foreground/65 leading-snug">{s.d}</p>
                </div>
                {i < pilotSteps.length - 1 && (
                  <div className="hidden md:flex items-center px-1 font-mono text-primary">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
          23.2 — DEMO FORMATS
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 border-l border-t border-border-subtle">
          {demoFormats.map((d) => (
            <div
              key={d.t}
              className="border-r border-b border-border-subtle p-5 min-h-[180px] flex flex-col"
            >
              <d.icon className="w-5 h-5 text-primary mb-3" strokeWidth={1.5} />
              <p className="font-display text-sm font-semibold text-foreground tracking-wide mb-2">
                {d.t}
              </p>
              <p className="text-xs text-foreground/65 leading-snug">{d.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* 24 — EVENTOS · PARTNERSHIPS · CASOS DE ÉXITO ----------------------------- */

const events = [
  { icon: Coffee, t: "ENTERPRISE BREAKFASTS", d: "Closed sessions with chain and franchise owners." },
  { icon: Briefcase, t: "SECTOR FORUMS", d: "Participation in retail guilds and security events." },
  { icon: Map, t: "FIELD ROUTES", d: "Concentrated visits by commercial zone for diagnostics." },
];

const partners = [
  { t: "POS INTEGRATORS", d: "Partners of Siigo, Loyverse, Alegra, and others." },
  { t: "CCTV INSTALLERS", d: "Certified installation and infrastructure network." },
  { t: "RETAIL GUILDS", d: "Fenalco, chambers of commerce, and regional clusters." },
  { t: "INTELLIGENCE PARTNERS", d: "Vision hardware and edge computing providers." },
];

const cases = [
  { n: "01", t: "ANCHOR", d: "Foundational case — Fraterno Café." },
  { n: "02", t: "VERTICAL", d: "One flagship case per retail vertical." },
  { n: "03", t: "SCALE", d: "Chain with multi-location expansion." },
  { n: "04", t: "ENTERPRISE", d: "Audited structured retail or franchise." },
];

function EventsPartnersCases() {
  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
          24.1 — EVENT AND IN-PERSON STRATEGY
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 border-l border-t border-border-subtle">
          {events.map((e) => (
            <div
              key={e.t}
              className="border-r border-b border-border-subtle p-5 min-h-[160px]"
            >
              <e.icon className="w-5 h-5 text-primary mb-3" strokeWidth={1.5} />
              <p className="font-display text-sm font-semibold text-foreground tracking-wide mb-2">
                {e.t}
              </p>
              <p className="text-xs text-foreground/65 leading-snug">{e.d}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
          24.2 — PARTNERSHIPS AND ALLIANCES
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 border-l border-t border-border-subtle">
          {partners.map((p) => (
            <div
              key={p.t}
              className="border-r border-b border-border-subtle p-5 flex flex-col min-h-[160px]"
            >
              <Handshake className="w-5 h-5 text-primary mb-3" strokeWidth={1.5} />
              <p className="font-display text-sm font-semibold text-foreground tracking-wide mb-2">
                {p.t}
              </p>
              <p className="text-xs text-foreground/65 leading-snug mt-auto">{p.d}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
          24.3 — SUCCESS CASE STRATEGY
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 border-l border-t border-border-subtle">
          {cases.map((c) => (
            <div
              key={c.n}
              className="border-r border-b border-border-subtle p-5 min-h-[160px]"
            >
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-primary" strokeWidth={1.5} />
                <span className="font-mono text-primary text-xs">{c.n}</span>
              </div>
              <p className="font-display text-sm font-semibold text-foreground tracking-wide mb-2">
                {c.t}
              </p>
              <p className="text-xs text-foreground/65 leading-snug">{c.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* 25 — VERTICALIZACIÓN + EXPANSIÓN GEOGRÁFICA ------------------------------ */

const verticals = [
  { t: "CAFÉS AND RESTAURANTS", d: "Bar shrinkage, cash handling, and turnover." },
  { t: "MINIMARKETS", d: "Sensitive inventory control and transfers." },
  { t: "PHARMACIES", d: "Traceability and operational compliance." },
  { t: "FASHION AND RETAIL", d: "In-store conversion and customer experience." },
  { t: "HARDWARE STORES AND WAREHOUSES", d: "High-ticket inventory control." },
  { t: "FRANCHISES", d: "Continuous brand standard auditing." },
];

const geos = [
  { n: "01", t: "MEDELLÍN", d: "Foundational hub · validation and cases." },
  { n: "02", t: "BOGOTÁ", d: "Replication with chains and franchises." },
  { n: "03", t: "COLOMBIA REGIONS", d: "Cali, Barranquilla, Coffee Axis." },
  { n: "04", t: "ANDEAN / LATAM", d: "Peru, Ecuador, Chile · local partners." },
];

function VerticalsAndGeo() {
  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
          25.1 — RETAIL VERTICALIZATION
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 border-l border-t border-border-subtle">
          {verticals.map((v) => (
            <div
              key={v.t}
              className="border-r border-b border-border-subtle p-5 min-h-[140px]"
            >
              <Layers className="w-5 h-5 text-primary mb-3" strokeWidth={1.5} />
              <p className="font-display text-sm font-semibold text-foreground tracking-wide mb-2">
                {v.t}
              </p>
              <p className="text-xs text-foreground/65 leading-snug">{v.d}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
          25.2 — GEOGRAPHIC EXPANSION
        </p>
        <div className="border border-border-subtle p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {geos.map((g, i) => (
              <div key={g.n} className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Globe2 className="w-4 h-4 text-primary" strokeWidth={1.5} />
                  <span className="font-mono text-primary text-xs">{g.n}</span>
                </div>
                <p className="font-display text-sm font-semibold text-foreground tracking-wide mb-1">
                  {g.t}
                </p>
                <p className="text-xs text-foreground/65 leading-snug">{g.d}</p>
                {i < geos.length - 1 && (
                  <div className="hidden md:block absolute right-[-12px] top-2 font-mono text-primary">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* 26 — OKRs Y TRUST STACK -------------------------------------------------- */

const okrs = [
  {
    o: "VALIDATE COMMERCIAL MODEL",
    krs: ["≥ 5 paid pilots", "Pilot → SaaS conversion ≥ 60%", "NPS ≥ 50"],
  },
  {
    o: "BUILD PREDICTABLE PIPELINE",
    krs: ["≥ 30 diagnostics / quarter", "CAC ≤ 1 month of SaaS", "Sales cycle ≤ 30 days"],
  },
  {
    o: "SCALE COMMERCIAL INFRASTRUCTURE",
    krs: ["Quarterly target MRR", "Churn ≤ 3%", "Expansion: +2 locations per active client"],
  },
];

const trustStack = [
  { icon: Lock, t: "DATA SECURITY", d: "Encryption in transit and at rest, location-based access control." },
  { icon: FileCheck, t: "TRACEABILITY", d: "Auditable logs of alerts, events, and access." },
  { icon: Database, t: "ENTERPRISE ARCHITECTURE", d: "Platform designed for multi-location and multi-role." },
  { icon: ScrollText, t: "LEGAL FRAMEWORK", d: "Compliance with data processing and video usage." },
  { icon: Gauge, t: "OPERATIONAL SLA", d: "Continuous availability, support, and agreed response." },
  { icon: Award, t: "CASES AND EVIDENCE", d: "Verifiable results, not promises." },
];

function OkrsAndTrust() {
  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
          26.1 — GO-TO-MARKET OKRs
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 border-l border-t border-border-subtle">
          {okrs.map((o, i) => (
            <div
              key={o.o}
              className="border-r border-b border-border-subtle p-6 flex flex-col"
            >
              <span className="font-mono text-primary text-xs mb-3">
                OBJECTIVE 0{i + 1}
              </span>
              <p className="font-display text-sm font-semibold text-foreground tracking-wide mb-4 leading-snug">
                {o.o}
              </p>
              <ul className="space-y-2 mt-auto pt-4 border-t border-border-subtle">
                {o.krs.map((kr) => (
                  <li key={kr} className="text-xs text-foreground/75 flex gap-2 leading-snug">
                    <span className="font-mono text-primary">KR</span>
                    {kr}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
          26.2 — ENTERPRISE TRUST STACK
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 border-l border-t border-border-subtle">
          {trustStack.map((t) => (
            <div
              key={t.t}
              className="border-r border-b border-border-subtle p-5 min-h-[160px]"
            >
              <t.icon className="w-5 h-5 text-primary mb-3" strokeWidth={1.5} />
              <p className="font-display text-sm font-semibold text-foreground tracking-wide mb-2">
                {t.t}
              </p>
              <p className="text-xs text-foreground/65 leading-snug">{t.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------- */
/*  Componente exportado: bloques 15 → 26                                      */
/* --------------------------------------------------------------------------- */

type ExtProps = { showBlocks?: string[] };
export default function BrandbookMarketing360Extensions({ showBlocks }: ExtProps = {}) {
  const show = (id: string) => !showBlocks || showBlocks.includes(id);
  return (
    <div>
      {show("15") && <div id="m360-15" className="scroll-mt-24"><Block
        id="15"
        label="MULTISTAKEHOLDER MAP"
        title={"YOU DON'T SELL\nTO A SINGLE PERSON"}
        intro="AnalogueCo enters operations where economic, technical, and operational decision-makers coexist. Each role validates a different layer of the product."
              provisional
      >
        <Stakeholders />
      </Block></div>}

      {show("16") && <div id="m360-16" className="scroll-mt-24"><Block
        id="16"
        label="JOBS TO BE DONE"
        title={"WHAT THE\nCLIENT HIRES"}
        intro="The client does not hire cameras or software: they hire a change in the way they operate their business."
              provisional
      >
        <JobsToBeDone />
      </Block></div>}

      {show("17") && <div id="m360-17" className="scroll-mt-24"><Block
        id="17"
        label="PAINS / GAINS"
        title={"CURRENT PAIN,\nOPERATIONAL GAIN"}
        intro="Segment-based mapping of real physical retail pains and the gains that AnalogueCo activates."
              provisional
      >
        <PainsGains />
      </Block></div>}

      {show("18") && <div id="m360-18" className="scroll-mt-24"><Block
        id="18"
        label="COMMERCIAL CUSTOMER JOURNEY"
        title={"FROM DISCOVERY\nTO EXPANSION"}
        intro="Six stages structuring the conversation, touchpoints, and commercial action."
              provisional
      >
        <CommercialJourney />
      </Block></div>}

      {show("19") && <div id="m360-19" className="scroll-mt-24"><Block
        id="19"
        label="SALES OBJECTIONS"
        title={"WHAT THEY SAY\nHOW WE RESPOND"}
        intro="Recurring objections are mapped and answered. No closing is improvised."
              provisional
      >
        <Objections />
      </Block></div>}

      {show("20") && <div id="m360-20" className="scroll-mt-24"><Block
        id="20"
        label="ROI NARRATIVE"
        title={"MEASURABLE\nINVESTMENT"}
        intro="AnalogueCo is justified by a concrete return: avoided losses greater than the system cost."
              provisional
      >
        <ROI />
      </Block></div>}

      {show("21") && <div id="m360-21" className="scroll-mt-24"><Block
        id="21"
        label="MARKET SIZE"
        title={"TAM · SAM · SOM"}
        intro="Physical retail is one of the largest and least digitized markets in LatAm."
              provisional
      >
        <TamSamSom />
      </Block></div>}

      {show("22") && <div id="m360-22" className="scroll-mt-24"><Block
        id="22"
        label="COMMERCIAL ROADMAP"
        title={"FOUR PHASES\nONE DIRECTION"}
        intro="Each phase has a clear objective and measurable deliverables before moving to the next."
              provisional
      >
        <div className="space-y-8">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
              22.1 — COMMERCIAL PHASES
            </p>
            <Roadmap />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
              22.2 — 30 · 60 · 90 PLAN
            </p>
            <Plan906030 />
          </div>
        </div>
      </Block></div>}

      {show("23") && <div id="m360-23" className="scroll-mt-24"><Block
        id="23"
        label="PILOTS AND DEMOS"
        title={"EVIDENCE\nBEFORE DECIDING"}
        intro="The pilot converts skepticism into certainty. The demo is structured for any sales format."
              provisional
      >
        <PilotsAndDemos />
      </Block></div>}

      {show("24") && <div id="m360-24" className="scroll-mt-24"><Block
        id="24"
        label="EVENTS · PARTNERSHIPS · CASES"
        title={"RELATIONAL PRESENCE\nNOT SPECTACLE"}
        intro="We grow through controlled relationships: closed events, integration allies, and verifiable cases."
              provisional
      >
        <EventsPartnersCases />
      </Block></div>}

      {show("25") && <div id="m360-25" className="scroll-mt-24"><Block
        id="25"
        label="VERTICALIZATION AND EXPANSION"
        title={"SAME ENGINE,\nMULTIPLE VERTICALS"}
        intro="The platform adapts to each retail vertical and expands through prioritized geographies."
              provisional
      >
        <VerticalsAndGeo />
      </Block></div>}

      {show("26") && <div id="m360-26" className="scroll-mt-24"><Block
        id="26"
        label="OKRs AND TRUST STACK"
        title={"MEASURABLE.\nRELIABLE."}
        intro="Clear OKRs to drive commercial operations and a trust stack to sustain enterprise clients."
              provisional
      >
        <OkrsAndTrust />
      </Block></div>}
    </div>
  );
}