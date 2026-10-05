import { motion } from "framer-motion";
import SourceCite from "./SourceCite";

const snap = [0.19, 1, 0.22, 1] as const;

export default function PitchMacroContext() {
  return (
    <section className="bg-secondary min-h-screen flex items-center border-b border-white/10 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "120px 120px",
        }}
      />
      <div className="max-w-[1400px] mx-auto px-8 grid grid-cols-12 gap-12 relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: snap }}
          viewport={{ once: true }}
          className="col-span-12 md:col-span-8"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#9DB7FF] mb-8">
            MACRO CONTEXT
          </p>
          <h1 className="font-display text-white text-6xl md:text-7xl leading-[0.95] tracking-tight">
            The physical <span className="text-[#1E5EFF]">economy</span><br />
            still moves<br />
            the majority<br />
            of the real world.
          </h1>
          <p className="text-white/50 text-base mt-10 max-w-[56ch] leading-relaxed">
            Automation revolutionized digital work, but left behind
            much of the physical economy. Most commerce still
            happens in stores, cafes, warehouses, and counters — where there are
            no logs, no dashboards, and no AI.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
            <div>
              <p className="font-display text-white text-3xl leading-none">+12,7%</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 mt-1">
                Retail Colombia · Mar 2025
              </p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <p className="font-display text-white text-3xl leading-none">~80%</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 mt-1">
                Global sales still in physical channel
              </p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <SourceCite href="https://www.dane.gov.co/files/operaciones/EMC/bol-EMC-mar2025.pdf" label="DANE · EMC Mar 2025" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: snap }}
          viewport={{ once: true }}
          className="col-span-12 md:col-span-4 flex flex-col justify-end gap-8 border-l border-white/10 pl-8"
        >
          {[
            { k: "Digital world", v: "Instrumented", note: "Every click, every event, recorded and actionable." },
            { k: "Physical world", v: "Opaque", note: "Cameras that record, systems that don't cross-reference, no one supervises." },
            { k: "Pending debt", v: "Operational", note: "AI has not yet landed in the physical operation of SMEs." },
          ].map((s) => (
            <div key={s.k} className="border-t border-white/10 pt-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1">{s.k}</p>
              <p className="font-display text-white text-2xl mb-1">{s.v}</p>
              <p className="text-white/40 text-xs leading-relaxed">{s.note}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}