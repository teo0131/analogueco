import { motion } from "framer-motion";

const snap = [0.19, 1, 0.22, 1];

type CheckVal = "yes" | "no" | "partial";

const Check = ({ val }: { val: CheckVal }) => {
  if (val === "yes") return <div className="w-6 h-6 bg-primary flex items-center justify-center mx-auto"><span className="text-primary-foreground text-xs">✓</span></div>;
  if (val === "no") return <div className="w-6 h-6 border-2 border-destructive/60 flex items-center justify-center mx-auto"><span className="text-destructive/80 text-xs">✕</span></div>;
  return <div className="w-6 h-6 border-2 border-yellow-500/60 flex items-center justify-center mx-auto"><span className="text-yellow-500/80 text-xs">~</span></div>;
};

const rows: { feature: string; pos: CheckVal; cctv: CheckVal; analogueco: CheckVal }[] = [
  { feature: "Transaction Log", pos: "yes", cctv: "no", analogueco: "yes" },
  { feature: "Physical Reality Capture", pos: "no", cctv: "yes", analogueco: "yes" },
  { feature: "Real-Time Alerts", pos: "partial", cctv: "no", analogueco: "yes" },
  { feature: "Inventory Discrepancy Detection", pos: "no", cctv: "no", analogueco: "yes" },
  { feature: "Employee Behavior Analysis", pos: "no", cctv: "partial", analogueco: "yes" },
  { feature: "Loss Detection", pos: "no", cctv: "partial", analogueco: "yes" },
  { feature: "Data for Operational Decisions", pos: "partial", cctv: "no", analogueco: "yes" },
  { feature: "Remote Monitoring", pos: "partial", cctv: "yes", analogueco: "yes" },
  { feature: "AI Intelligence", pos: "no", cctv: "no", analogueco: "yes" },
];

type Props = { part?: 0 | 1 | 2; compact?: boolean; hideNumber?: boolean };

export default function BrandbookComparison({ part = 0, compact = false, hideNumber = false }: Props) {
  const py = compact ? "py-12" : "py-32";
  const mb = compact ? "mb-8" : "mb-16";
  const list = part === 1 ? rows.slice(0, 5) : part === 2 ? rows.slice(5) : rows;
  return (
    <section className={`bg-background ${py} border-b border-border-subtle`}>
      <div className="max-w-[1400px] mx-auto px-8">
        <div className={`grid grid-cols-12 ${mb}`}>
          <div className="col-span-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
                {part === 2
                  ? hideNumber ? "MATRIX (CONT.)" : "07 — MATRIX (CONT.)"
                  : hideNumber ? "MARKET POSITION" : "07 — MARKET POSITION"}
              </p>
              <h2 className="font-display text-5xl text-foreground">COMPETITIVE<br />MATRIX</h2>
            </motion.div>
          </div>
          <div className="col-span-8 flex items-end">
            <p className="text-muted-foreground text-base leading-relaxed max-w-[56ch]">
              POS sees transactions. CCTV sees recordings. AnalogueCo sees both —
              and connects them into actionable intelligence. No category comes close.
            </p>
          </div>
        </div>

        <hr className={`border-t-2 border-foreground ${compact ? "mb-6" : "mb-12"}`} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: snap }}
          viewport={{ once: true }}
          className="border border-border-subtle"
        >
          <div className="grid grid-cols-12 border-b-2 border-foreground bg-secondary">
            <div className="col-span-5 p-5 border-r border-white/10">
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">CAPABILITY</span>
            </div>
            <div className="col-span-2 p-5 border-r border-white/10 text-center">
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">POS SYSTEM</span>
            </div>
            <div className="col-span-2 p-5 border-r border-white/10 text-center">
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">CCTV</span>
            </div>
            <div className="col-span-3 p-5 text-center bg-primary/10 border-l border-primary/30">
              <span className="font-mono text-[10px] uppercase tracking-widest text-primary font-bold">ANALOGUECO ↗</span>
            </div>
          </div>

          {list.map((row, i) => (
            <motion.div
              key={row.feature}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              viewport={{ once: true }}
              className="grid grid-cols-12 border-b border-border-subtle last:border-b-0 hover:bg-muted/30 transition-colors duration-100"
            >
              <div className="col-span-5 p-5 border-r border-border-subtle flex items-center">
                <span className="font-mono text-xs text-foreground">{row.feature}</span>
              </div>
              <div className="col-span-2 p-5 border-r border-border-subtle flex items-center justify-center">
                <Check val={row.pos} />
              </div>
              <div className="col-span-2 p-5 border-r border-border-subtle flex items-center justify-center">
                <Check val={row.cctv} />
              </div>
              <div className="col-span-3 p-5 flex items-center justify-center bg-primary/[0.03] border-l border-primary/20">
                <Check val={row.analogueco} />
              </div>
            </motion.div>
          ))}

          {part !== 1 && (
          <div className="border-t border-border-subtle p-5 bg-muted/20 flex items-center gap-8">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mr-4">LEGEND:</span>
            {[
              { icon: "✓", color: "text-primary", label: "Full capability" },
              { icon: "~", color: "text-yellow-600", label: "Partial" },
              { icon: "✕", color: "text-destructive/80", label: "Not supported" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2">
                <span className={`font-mono text-xs font-bold ${l.color}`}>{l.icon}</span>
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{l.label}</span>
              </div>
            ))}
          </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
