import { motion } from "framer-motion";
import StatusPill from "./StatusPill";

const snap = [0.19, 1, 0.22, 1] as const;

const live = ["POS", "Kardex", "Roles and permissions", "Clock in / out", "Calendar", "Alerts", "Dashboard", "Cash flow", "Finance", "Operational reports"];
const rnd = ["Computer vision", "Hardware integration", "Sensors", "Whisper / audio intelligence"];
const vision = ["Autonomous AI oversight", "Real-time anomaly detection", "Operational automation", "Vertical models by sector"];

function Col({ variant, items, title, desc }: { variant: "live" | "rnd" | "vision"; items: string[]; title: string; desc: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: snap }}
      viewport={{ once: true }}
      className="border border-white/10 bg-white/[0.02] p-7 flex flex-col"
    >
      <StatusPill variant={variant} />
      <h3 className="font-display text-white text-2xl mt-5 mb-2 leading-tight">{title}</h3>
      <p className="text-white/40 text-xs leading-relaxed mb-6">{desc}</p>
      <ul className="space-y-2.5">
        {items.map((it) => (
          <li key={it} className="flex gap-2.5 text-sm text-white/80">
            <span className="font-mono text-[#1E5EFF] mt-0.5">→</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function PitchMVPStatus() {
  return (
    <section className="bg-secondary py-24 border-b border-white/10">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="grid grid-cols-12 mb-12">
          <div className="col-span-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#9DB7FF] mb-3">
              MVP · CURRENT STATUS
            </p>
            <h2 className="font-display text-5xl text-white leading-[0.95]">
              WHAT ALREADY WORKS.<br />
              <span className="text-white/40">WHAT WE ARE</span><br />
              <span className="text-white/40">BUILDING.</span>
            </h2>
          </div>
          <div className="col-span-7 flex items-end">
            <p className="text-white/50 text-base leading-relaxed max-w-[60ch]">
              These are the modules in production today, those in R&D
              and the vision we are moving towards.
            </p>
          </div>
        </div>

        <hr className="border-t border-white/20 mb-10" />

        <div className="grid grid-cols-3 gap-5">
          <Col
            variant="live"
            title="Operational platform"
            desc="In production. Complete centralization of the physical business."
            items={live}
          />
          <Col
            variant="rnd"
            title="Perception layer"
            desc="In active research and development."
            items={rnd}
          />
          <Col
            variant="vision"
            title="Autonomous intelligence"
            desc="Declared roadmap. Where we are heading the product."
            items={vision}
          />
        </div>
      </div>
    </section>
  );
}