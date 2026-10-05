import { motion } from "framer-motion";

const snap = [0.19, 1, 0.22, 1] as const;

type Section = {
  id: string;
  label: string;
  title: string;
  headline: string;
  bullets: string[];
  quote: string;
};

const sections: Section[] = [
  {
    id: "01",
    label: "PROBLEM",
    title: "THE INVISIBLE PAIN OF PHYSICAL RETAIL",
    headline: "Owners operate blindly and depend on being present to maintain control.",
    bullets: [
      "No real-time visibility of what happens in-store",
      "Losses, errors, and leaks that no one sees",
      "The POS doesn't know what happened in front of the counter",
    ],
    quote: "It happens to every physical retail owner who cannot be in two places at once.",
  },
  {
    id: "02",
    label: "SOLUTION",
    title: "VISION + DATA, IN REAL TIME",
    headline: "We cross-reference computer vision with the POS to validate operations instantly.",
    bullets: [
      "Cameras + AI observe what occurs",
      "The system cross-references it with sales and inventory",
      "Detects inconsistencies and triggers alerts",
    ],
    quote: "Data where it happens.",
  },
  {
    id: "03",
    label: "IMPACT",
    title: "FROM EFFORT TO SCALE",
    headline: "We reduce losses and free the owner from physical operations.",
    bullets: [
      "Fewer operational losses",
      "Remote operational oversight and real transparency",
      "Decisions based on what actually happens",
    ],
    quote: "Business control should not depend on being present.",
  },
  {
    id: "04",
    label: "BUSINESS MODEL",
    title: "SAAS + SETUP",
    headline: "Initial hardware setup + monthly software and AI subscription.",
    bullets: [
      "Setup: $3.220.000 COP — hardware, installation, and calibration",
      "Monthly: $510.000 COP — software, AI, and continuous monitoring",
      "The client pays for visibility, control, and scalability",
    ],
    quote: "We charge for the control that previously only physical presence provided.",
  },
  {
    id: "05",
    label: "TEAM AND RESOURCES",
    title: "SYSTEM DESIGNERS WITH REAL-WORLD OPERATIONS",
    headline: "Team based in design, business, and technology — operating their own retail.",
    bullets: [
      "Direct experience operating Fraterno Café",
      "We need: early adopters",
      "We need: alliances and support to scale technically",
    ],
    quote: "We build from operations, not from theory.",
  },
  {
    id: "06",
    label: "MINDSET",
    title: "BUILT FROM REALITY",
    headline: "We validate in the streets: every iteration is born from an observed problem.",
    bullets: [
      "We learned that the pain point isn't the technology, it's the operational blindness",
      "We adjusted: from passive dashboards to actionable alerts",
      "We iterate fast with real businesses",
    ],
    quote: "We don't assume — we build from what actually happens.",
  },
];

export default function BrandbookBusinessPresentation() {
  return (
    <section className="bg-background py-24 border-b border-border-subtle">
      <div className="max-w-[1400px] mx-auto px-8">
        {/* Encabezado */}
        <div className="grid grid-cols-12 mb-10">
          <div className="col-span-5">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
              11
            </p>
            <h2 className="font-display text-5xl text-foreground leading-[0.95]">
              BUSINESS<br />PRESENTATION
            </h2>
          </div>
          <div className="col-span-7 flex items-end" />
        </div>

        <hr className="border-t-2 border-foreground mb-10" />

        {/* Grid de 6 bloques */}
        <div className="grid grid-cols-2 border-l border-t border-border-subtle">
          {sections.map((s, i) => (
            <motion.article
              key={s.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.45, ease: snap }}
              viewport={{ once: true, margin: "-80px" }}
              className="border-r border-b border-border-subtle p-8 flex flex-col min-h-[320px]"
            >
              <div className="flex items-baseline justify-between mb-4">
                <span className="font-mono text-primary text-xl font-bold">{s.id}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </span>
              </div>
              <h3 className="font-display text-2xl text-foreground leading-tight mb-3">
                {s.title}
              </h3>
              <p className="text-foreground/80 text-sm leading-relaxed mb-5">
                {s.headline}
              </p>
              <ul className="space-y-1.5 mb-5">
                {s.bullets.map((b, idx) => (
                  <li key={idx} className="flex gap-2.5 text-xs text-foreground/70 leading-relaxed">
                    <span className="font-mono text-primary mt-0.5">→</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-4 border-t border-border-subtle">
                <div className="w-1.5 h-1.5 bg-primary mb-2" />
                <p className="font-display text-sm text-foreground leading-snug italic">
                  "{s.quote}"
                </p>
              </div>
            </motion.article>
          ))}
        </div>

      </div>
    </section>
  );
}