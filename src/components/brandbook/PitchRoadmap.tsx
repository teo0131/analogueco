import { motion } from "framer-motion";
import StatusPill from "./StatusPill";

const snap = [0.19, 1, 0.22, 1] as const;

const phases = [
  { n: "PHASE 01", t: "Operational centralization", d: "Physical retail ERP: POS, inventory, finance, shifts, and reports on a single platform.", variant: "live" as const, status: "LIVE" },
  { n: "PHASE 02", t: "Hardware integration", d: "Sensors, cameras, and capture devices connected to the operational system.", variant: "rnd" as const, status: "IN DEVELOPMENT" },
  { n: "PHASE 03", t: "Computer vision + operational AI", d: "Vision and audio models that interpret physical operation in real time.", variant: "rnd" as const, status: "R&D" },
  { n: "PHASE 04", t: "Autonomous oversight", d: "Anomaly detection and automatic response. The operation monitors itself.", variant: "vision" as const, status: "VISION" },
];

export default function PitchRoadmap() {
  return (
    <section className="bg-background py-24 border-b border-border-subtle">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="grid grid-cols-12 mb-12">
          <div className="col-span-5">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
              TECHNOLOGICAL ROADMAP
            </p>
            <h2 className="font-display text-5xl text-foreground leading-[0.95]">
              PROJECT<br />PHASES.
            </h2>
          </div>
          <div className="col-span-7 flex items-end">
            <p className="text-muted-foreground text-base leading-relaxed max-w-[60ch]">
              Centralize first. Instrument second. Interpret later. Automate at the end.
              Today we are between Phase 01 and Phase 02.
            </p>
          </div>
        </div>

        <hr className="border-t-2 border-foreground mb-12" />

        {/* Timeline */}
        <div className="relative">
          {/* línea horizontal */}
          <div className="absolute top-6 left-0 right-0 h-px bg-border-subtle" />
          <div className="absolute top-6 left-0 h-px bg-primary" style={{ width: "37.5%" }} />

          <div className="grid grid-cols-4 gap-6 relative">
            {phases.map((p, i) => (
              <motion.div
                key={p.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12, duration: 0.5, ease: snap }}
                viewport={{ once: true }}
                className="flex flex-col"
              >
                <div className="relative h-12 flex items-center">
                  <div className={`w-3 h-3 rounded-full ${i < 2 ? "bg-primary" : "bg-border-subtle border border-foreground/30"}`} />
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">{p.n}</p>
                <h3 className="font-display text-2xl text-foreground leading-tight mb-3">{p.t}</h3>
                <p className="text-foreground/60 text-sm leading-relaxed mb-5 flex-1">{p.d}</p>
                <StatusPill variant={p.variant} label={p.status} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}