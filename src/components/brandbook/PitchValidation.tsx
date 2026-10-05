import { motion } from "framer-motion";
import fraternoImg from "@/assets/fraterno-intraemprendimiento.png";

const snap = [0.19, 1, 0.22, 1] as const;

const points = [
  { k: "PILOT ENVIRONMENT", v: "Real operation, not a demo. Fraterno runs on AnalogueCo every day." },
  { k: "OBSERVATION SOURCE", v: "Every feature is born from a pain point observed in daily operations." },
  { k: "DIRECT VALIDATION", v: "The system is tested against real friction: checkout, inventory, shifts, customers." },
  { k: "RAPID ITERATION", v: "Product changes are validated in hours, not sprints." },
];

export default function PitchValidation() {
  return (
    <section className="bg-secondary py-24 border-b border-white/10 relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-8 grid grid-cols-12 gap-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: snap }}
          viewport={{ once: true }}
          className="col-span-12 md:col-span-5"
        >
          <div className="relative border border-white/15 aspect-[4/5] overflow-hidden">
            <img
              src={fraternoImg}
              alt="Real operation at Fraterno Café — AnalogueCo's operational laboratory"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1540]/95 via-[#0A1540]/30 to-transparent" />
            {/* corner brackets */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#1E5EFF]" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#1E5EFF]" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#1E5EFF]" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#1E5EFF]" />
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#1E5EFF] px-3 py-1">
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white">OPERATIONAL LABORATORY</span>
            </div>
            <div className="absolute bottom-6 left-6 right-6 z-10">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#9DB7FF] mb-2">INTRAPRENEURSHIP</p>
              <p className="font-display text-white text-4xl leading-none mb-2">FRATERNO CAFÉ</p>
              <p className="text-white/70 text-xs leading-relaxed max-w-[36ch]">
                AnalogueCo emerges as an intrapreneurship developed from
                the operational needs of Fraterno Café, seeking to design
                an operational digitalization solution for SMEs in the retail sector.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="col-span-12 md:col-span-7 flex flex-col justify-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#9DB7FF] mb-4">
            REAL VALIDATION
          </p>
          <h2 className="font-display text-white text-6xl leading-[0.95] mb-8">
            AnalogueCo is born<br />from real operation.
          </h2>
          <p className="text-white/60 text-base leading-relaxed max-w-[56ch] mb-10">
            Fraterno Café is not a fictional client. It is our operational laboratory —
            the environment where every hypothesis confronts reality before release.
          </p>

          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            {points.map((p, i) => (
              <motion.div
                key={p.k}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4, ease: snap }}
                viewport={{ once: true }}
                className="border-t border-white/15 pt-4"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1E5EFF] mb-2">{p.k}</p>
                <p className="text-white/75 text-sm leading-relaxed">{p.v}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}