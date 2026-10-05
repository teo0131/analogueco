import { motion } from "framer-motion";

const snap = [0.19, 1, 0.22, 1] as const;

const rows = [
  {
    area: "PRODUCT",
    m12: "Perception layer v1 (vision + pilot audio)",
    m24: "Anomaly detection in production",
    m36: "Autonomous multi-site oversight",
  },
  {
    area: "GTM",
    m12: "10 – 50 paid pilots · Medellín gastro",
    m24: "Expansion to Colombia SME retail · channel",
    m36: "Entry to 2 LatAm countries · integrations",
  },
  {
    area: "TEAM",
    m12: "Mechatronic co-founder + CV · 1 engineer",
    m24: "Product/engineering team 5–7 people",
    m36: "Commercial structure + regional support",
  },
  {
    area: "INFRA",
    m12: "Standardized pilot hardware",
    m24: "Scalable multi-sensor capture stack",
    m36: "Edge AI at every point of operation",
  },
];

export default function PitchProjection() {
  return (
    <section className="bg-background py-24 border-b border-border-subtle">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="grid grid-cols-12 mb-12">
          <div className="col-span-5">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
              HORIZON
            </p>
            <h2 className="font-display text-5xl text-foreground leading-[0.95]">
              FUTURE<br />PROJECTION.
            </h2>
          </div>
          <div className="col-span-7 flex items-end">
            <p className="text-muted-foreground text-base leading-relaxed max-w-[60ch]">
              Target milestones by horizon. We declare them so they are measurable —
              not as a promise, but as an execution thesis.
            </p>
          </div>
        </div>

        <hr className="border-t-2 border-foreground mb-0" />

        <div className="border border-border-subtle border-t-0">
          <div className="grid grid-cols-12 bg-secondary text-white">
            <div className="col-span-3 p-5 border-r border-white/10">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">AREA</span>
            </div>
            <div className="col-span-3 p-5 border-r border-white/10">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#9DB7FF]">12 MONTHS</span>
            </div>
            <div className="col-span-3 p-5 border-r border-white/10">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#9DB7FF]">24 MONTHS</span>
            </div>
            <div className="col-span-3 p-5">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#9DB7FF]">36 MONTHS</span>
            </div>
          </div>

          {rows.map((r, i) => (
            <motion.div
              key={r.area}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: snap }}
              viewport={{ once: true }}
              className="grid grid-cols-12 border-t border-border-subtle"
            >
              <div className="col-span-3 p-5 border-r border-border-subtle">
                <p className="font-mono text-xs text-foreground font-bold">{r.area}</p>
              </div>
              <div className="col-span-3 p-5 border-r border-border-subtle">
                <p className="text-foreground/70 text-sm leading-relaxed">{r.m12}</p>
              </div>
              <div className="col-span-3 p-5 border-r border-border-subtle">
                <p className="text-foreground/70 text-sm leading-relaxed">{r.m24}</p>
              </div>
              <div className="col-span-3 p-5">
                <p className="text-foreground/70 text-sm leading-relaxed">{r.m36}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}