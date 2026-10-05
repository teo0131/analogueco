import { motion } from "framer-motion";

const snap = [0.19, 1, 0.22, 1] as const;

const horizons = [
  {
    h: "H1",
    when: "0 – 6 MONTHS",
    title: "Coffee shops and gastronomy Medellín",
    bullets: [
      "Direct sales by the founder, short cycle",
      "On-site white-glove onboarding",
      "Each client feeds the R&D roadmap",
    ],
  },
  {
    h: "H2",
    when: "6 – 18 MONTHS",
    title: "SME Retail Colombia",
    bullets: [
      "Expansion to other physical retail categories",
      "Local partners + installation channel",
      "First release of the perception layer",
    ],
  },
  {
    h: "H3",
    when: "18 – 36 MONTHS",
    title: "LatAm Expansion",
    bullets: [
      "Integrations with third-party POS and ERPs",
      "Multi-country operation with local compliance",
      "Vertical models by sector",
    ],
  },
];

export default function PitchGTM() {
  return (
    <section className="bg-secondary py-24 border-b border-white/10">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="grid grid-cols-12 mb-12">
          <div className="col-span-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#9DB7FF] mb-3">
              GO TO MARKET
            </p>
            <h2 className="font-display text-5xl text-white leading-[0.95]">
              STRATEGIC<br />EXPANSION<br />PHASES.
            </h2>
          </div>
          <div className="col-span-7 flex items-end">
            <p className="text-white/50 text-base leading-relaxed max-w-[60ch]">
              We start where the pain is acute and the sales cycle is short.
              Only after proving adoption do we open channels and geographies.
            </p>
          </div>
        </div>

        <hr className="border-t border-white/20 mb-10" />

        <div className="grid grid-cols-3 gap-5">
          {horizons.map((h, i) => (
            <motion.div
              key={h.h}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: snap }}
              viewport={{ once: true }}
              className="border border-white/10 bg-white/[0.02] p-7 flex flex-col min-h-[340px]"
            >
              <div className="flex items-baseline justify-between mb-6">
                <span className="font-display text-[#1E5EFF] text-5xl leading-none">{h.h}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">{h.when}</span>
              </div>
              <h3 className="font-display text-white text-2xl leading-tight mb-5">{h.title}</h3>
              <ul className="space-y-2.5 mt-auto">
                {h.bullets.map((b) => (
                  <li key={b} className="flex gap-2.5 text-sm text-white/75 leading-relaxed">
                    <span className="font-mono text-[#1E5EFF] mt-0.5">→</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}