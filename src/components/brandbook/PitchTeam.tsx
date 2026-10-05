import { motion } from "framer-motion";

const snap = [0.19, 1, 0.22, 1] as const;

export default function PitchTeam() {
  return (
    <section className="bg-background py-32 border-b border-border-subtle">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="grid grid-cols-12 mb-12">
          <div className="col-span-4">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
              05.1 — TEAM
            </p>
            <h3 className="font-display text-4xl text-foreground leading-tight">
              THE<br />TEAM
            </h3>
          </div>
          <div className="col-span-8 flex items-end">
            <p className="text-muted-foreground text-base leading-relaxed max-w-[56ch]">
              Today AnalogueCo is built by a single person: a product design
              engineer.
            </p>
          </div>
        </div>

        <hr className="border-t-2 border-foreground mb-12" />

        <div className="grid grid-cols-12 gap-0 border border-border-subtle">
          <div className="col-span-12 md:col-span-7 p-10 border-r border-border-subtle">
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary mb-6">
              TEAM
            </p>
            <ul className="space-y-5">
              {[
                { rol: "FOUNDER", desc: "Product design engineer. System, identity, and product." },
                { rol: "SEARCHING", desc: "Mechatronics engineer specializing in computer vision to accelerate development." },
              ].map((m) => (
                <li key={m.rol} className="grid grid-cols-12 gap-4 border-b border-border-subtle pb-4">
                  <div className="col-span-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-foreground">{m.rol}</p>
                  </div>
                  <div className="col-span-8">
                    <p className="text-foreground/70 text-sm leading-relaxed">{m.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: snap }}
            viewport={{ once: true }}
            className="col-span-12 md:col-span-5 p-10 bg-secondary text-white"
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#9DB7FF] mb-6">
              WHAT WE NEED TODAY
            </p>
            <ul className="space-y-4">
              {[
                "Mechatronics engineer specializing in computer vision",
                "Early adopter clients in retail / F&B",
                "Strategic alliances and capital support to scale",
              ].map((n) => (
                <li key={n} className="flex gap-3 text-sm text-white/80 leading-relaxed">
                  <span className="text-[#1E5EFF] mt-0.5 font-mono">→</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
