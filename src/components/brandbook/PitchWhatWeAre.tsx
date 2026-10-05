import { motion } from "framer-motion";

const snap = [0.19, 1, 0.22, 1] as const;

const pillars = [
  { k: "01", t: "PHYSICAL RETAIL ERP", d: "We centralize POS, inventory, finance, shifts, and reports in a single system." },
  { k: "02", t: "OPERATIONAL INTELLIGENCE", d: "We cross-reference what happens with what is recorded. Actionable alerts, not passive dashboards." },
  { k: "03", t: "SYSTEMIC TRACEABILITY", d: "Every event is recorded and auditable. Operations no longer depend on memory." },
];

export default function PitchWhatWeAre() {
  return (
    <section className="bg-background min-h-screen flex flex-col justify-center py-24 border-b border-border-subtle">
      <div className="max-w-[1400px] mx-auto px-8 w-full">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-8">
          WHAT IS ANALOGUECO
        </p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: snap }}
          viewport={{ once: true }}
          className="font-display text-foreground text-6xl md:text-7xl leading-[0.95] tracking-tight max-w-[18ch] mb-6"
        >
          The intelligent operational infrastructure for physical retail.
        </motion.h2>

        <p className="text-muted-foreground text-lg leading-relaxed max-w-[64ch] mb-16">
          A platform that already centralizes the operation of a physical business —
          and is building its next layer of intelligence with
          computer vision, audio, and sensors.
        </p>

        <hr className="border-t-2 border-foreground mb-10" />

        <div className="grid grid-cols-3 gap-0 border-l border-t border-border-subtle">
          {pillars.map((p, i) => (
            <motion.div
              key={p.k}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: snap }}
              viewport={{ once: true }}
              className="border-r border-b border-border-subtle p-8 min-h-[220px]"
            >
              <span className="font-mono text-primary text-xl font-bold mb-4 block">{p.k}</span>
              <h3 className="font-display text-2xl text-foreground leading-tight mb-3">{p.t}</h3>
              <p className="text-foreground/60 text-sm leading-relaxed">{p.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}