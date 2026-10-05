import { motion } from "framer-motion";

const snap = [0.19, 1, 0.22, 1] as const;

const pains = [
  { n: "01", title: "FOUNDER DEPENDENCY", note: "If the owner is not present, the business destabilizes." },
  { n: "02", title: "NO CENTRALIZATION", note: "Data scattered across POS, spreadsheets, WhatsApp, and memory." },
  { n: "03", title: "IMPOSSIBLE OVERSIGHT", note: "Impossible to know what is happening in real time without being there." },
  { n: "04", title: "MANUAL PROCESSES", note: "Inventory, cash, and shifts are handled manually, prone to error." },
  { n: "05", title: "FRAGMENTED INFORMATION", note: "Each tool lives in its own silo. Nothing crosses automatically." },
  { n: "06", title: "NO TRACEABILITY", note: "When something fails, there is no way to reconstruct what happened." },
];

export default function PitchPainPoints() {
  return (
    <section className="bg-background py-24 border-b border-border-subtle">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="grid grid-cols-12 mb-12">
          <div className="col-span-5">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
              REAL OPERATIONAL PAIN
            </p>
            <h2 className="font-display text-5xl text-foreground leading-[0.95]">
              SIX PAIN POINTS<br />OBSERVED<br />IN OPERATION.
            </h2>
          </div>
          <div className="col-span-7 flex items-end">
            <p className="text-muted-foreground text-base leading-relaxed max-w-[60ch]">
              These don't come from a study. They come from operating Fraterno Café every day —
              and from talking to other owners who experience the exact same thing.
            </p>
          </div>
        </div>

        <hr className="border-t-2 border-foreground mb-10" />

        <div className="grid grid-cols-3 border-l border-t border-border-subtle">
          {pains.map((p, i) => (
            <motion.div
              key={p.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: snap }}
              viewport={{ once: true }}
              className="border-r border-b border-border-subtle p-8 min-h-[200px] flex flex-col"
            >
              <span className="font-mono text-primary text-xl font-bold mb-4">{p.n}</span>
              <h3 className="font-display text-foreground text-xl leading-tight mb-3">{p.title}</h3>
              <p className="text-foreground/60 text-sm leading-relaxed mt-auto">{p.note}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-3">
          <span className="w-1.5 h-1.5 bg-primary" />
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            OBSERVED IN REAL OPERATION — FRATERNO CAFÉ
          </p>
        </div>
      </div>
    </section>
  );
}