import { motion } from "framer-motion";

const snap = [0.19, 1, 0.22, 1] as const;

const layers = [
  {
    k: "TAM",
    t: "Retail SME LatAm",
    v: "+17.2 million SMEs",
    note: "Micro, small, and medium-sized enterprises operating in Latin America, many still with low operational digitalization and fragmented systems.",
    source: { label: "PNUD · CEPAL · BID", href: "https://www.undp.org/latin-america/blog/yes-there-hope-msmes-region-and-beyond" },
  },
  {
    k: "SAM",
    t: "Gastronomy and small trade Colombia",
    v: "+128,000 gastronomic establishments",
    note: "Restaurants, coffee shops, and small gastronomic businesses operating in Colombia.",
    source: { label: "DANE · MinCIT · RNT", href: "https://repository.ces.edu.co/bitstreams/e778b6a4-6972-4d41-91af-d7e8afc384fe/download" },
  },
  {
    k: "SOM",
    t: "Medellín · Year 1",
    v: "10 – 50 operational pilots",
    note: "Initial adoption goal focused on coffee shops, restaurants, and retail SMEs during the first 12 months.",
  },
];

export default function PitchMarketAnalysis() {
  return (
    <section className="bg-background py-24 border-b border-border-subtle">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="grid grid-cols-12 mb-12">
          <div className="col-span-5">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
              MARKET ANALYSIS
            </p>
            <h2 className="font-display text-5xl text-foreground leading-[0.95]">
              MARKET<br />ANALYSIS.
            </h2>
          </div>
          <div className="col-span-7 flex items-end">
            <p className="text-muted-foreground text-base leading-relaxed max-w-[60ch]">
              The physical economy continues to grow, but millions of small
              businesses still operate with low operational visibility.
            </p>
          </div>
        </div>

        <hr className="border-t-2 border-foreground mb-12" />

        <div className="grid grid-cols-12 gap-10 items-center">
          {/* Círculos concéntricos */}
          <div className="col-span-12 md:col-span-5 flex items-center justify-center">
            <div className="relative w-[400px] h-[400px] flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: snap }}
                viewport={{ once: true }}
                className="absolute inset-0 rounded-full border border-foreground/15 bg-foreground/[0.02] flex flex-col items-center justify-start pt-6"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/50">TAM</span>
                <span className="font-display text-foreground text-lg mt-1">+17.2M</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-foreground/50">SMEs LatAm</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.6, ease: snap }}
                viewport={{ once: true }}
                className="absolute inset-[18%] rounded-full border border-primary/30 bg-primary/[0.04] flex flex-col items-center justify-start pt-6"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/80">SAM</span>
                <span className="font-display text-foreground text-lg mt-1">+128K</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-foreground/60">Gastro Colombia</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6, ease: snap }}
                viewport={{ once: true }}
                className="absolute inset-[38%] rounded-full bg-primary text-primary-foreground flex flex-col items-center justify-center"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] mb-1">SOM</span>
                <span className="font-display text-xl leading-none">10–50</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] mt-1">Pilots · Year 1</span>
              </motion.div>
            </div>
          </div>

          {/* Detalle */}
          <div className="col-span-12 md:col-span-7 space-y-5">
            {layers.map((l, i) => (
              <motion.div
                key={l.k}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4, ease: snap }}
                viewport={{ once: true }}
                className="grid grid-cols-12 gap-4 border-l-2 border-primary pl-5"
              >
                <div className="col-span-2">
                  <p className="font-mono text-primary text-xl font-bold">{l.k}</p>
                </div>
                <div className="col-span-10">
                  <p className="font-display text-foreground text-2xl leading-tight">{l.t}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-1 mb-2">{l.v}</p>
                  <p className="text-foreground/60 text-sm leading-relaxed">{l.note}</p>
                  {l.source && (
                    <a
                      href={l.source.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground underline-offset-4 hover:underline mt-3"
                    >
                      Source: {l.source.label} ↗
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground pt-4 border-t border-border-subtle">
              SOM built as an adoption goal for the first 12 months in Medellín.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}