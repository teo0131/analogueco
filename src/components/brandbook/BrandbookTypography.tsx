import { motion } from "framer-motion";

const typeScale = [
  { label: "DISPLAY XL", size: "72px / 900", family: "Inter", sample: "DATA WHERE IT HAPPENS.", className: "text-6xl font-black uppercase tracking-tighter leading-none" },
  { label: "DISPLAY LG", size: "48px / 800", family: "Inter", sample: "OPERATIONAL INTELLIGENCE.", className: "text-5xl font-extrabold uppercase tracking-tighter leading-none" },
  { label: "HEADLINE", size: "32px / 700", family: "Inter", sample: "Real-Time Monitoring", className: "text-3xl font-bold uppercase tracking-tight leading-tight" },
  { label: "SUBTITLE", size: "20px / 600", family: "Inter", sample: "Stock discrepancy detected — Zone 3B", className: "text-xl font-semibold leading-snug" },
  { label: "BODY", size: "16px / 400", family: "Inter", sample: "A system that connects physical operations with real-time data to drive decisions, control, and scalability for physical businesses.", className: "text-base font-normal leading-relaxed max-w-[56ch]" },
  { label: "DATA / LABELS", size: "13px / 500", family: "Space Grotesk", sample: "TOLERANCE: 0.001mm / CALIBER: 8932-A / ZONE: 3B", className: "text-sm font-mono tracking-wider" },
  { label: "LABEL / UI", size: "10px / 400", family: "Space Grotesk", sample: "LAST UPDATE: 17.03.2025 — 09:42:17", className: "text-[10px] font-mono uppercase tracking-[0.25em]" },
];

export default function BrandbookTypography() {
  return (
    <section className="bg-background py-32 border-b border-border-subtle">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="grid grid-cols-12 mb-16">
          <div className="col-span-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">03 — TYPOGRAPHY</p>
              <h2 className="font-display text-5xl text-foreground">TYPOGRAPHY<br />SYSTEM</h2>
            </motion.div>
          </div>
          <div className="col-span-8 flex items-end">
            <p className="text-muted-foreground text-base leading-relaxed max-w-[56ch]">
              Two voices. Inter for display and UI — geometric, authoritative. Space Grotesk for data labels,
              timestamps, and technical readings. Never mix these roles.
            </p>
          </div>
        </div>

        <hr className="border-t-2 border-foreground mb-12" />

        {/* Font specimens */}
        <div className="grid grid-cols-2 gap-0 border border-border-subtle mb-12">
          <div className="border-r border-border-subtle p-12">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-6">PRIMARY — INTER</p>
            <div className="font-display text-8xl text-foreground mb-4" style={{ fontWeight: 900 }}>Aa</div>
            <div className="font-sans text-2xl font-light text-foreground mb-8">AaBbCcDdEeFfGgHh</div>
            <div className="grid grid-cols-9 gap-2">
              {[100,200,300,400,500,600,700,800,900].map(w => (
                <div key={w} className="text-center">
                  <div className="font-sans text-lg text-foreground" style={{ fontWeight: w }}>A</div>
                  <div className="font-mono text-[9px] text-muted-foreground">{w}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-12">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-6">DATA / LABELS — SPACE GROTESK</p>
            <div className="font-mono text-8xl text-foreground mb-4" style={{ fontWeight: 700 }}>Aa</div>
            <div className="font-mono text-2xl font-light text-foreground mb-8">0123456789:.</div>
            <div className="font-mono text-sm text-muted-foreground leading-relaxed">
              Exclusive use for:<br />
              — Pricing and metrics<br />
              — Timestamps and IDs<br />
              — System labels and tags<br />
              — Technical specifications
            </div>
          </div>
        </div>

        {/* Type scale */}
        <div className="border border-border-subtle">
          {typeScale.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              viewport={{ once: true }}
              className="grid grid-cols-12 border-b border-border-subtle last:border-b-0 hover:bg-muted/30 transition-colors duration-100"
            >
              <div className="col-span-2 border-r border-border-subtle p-4 flex flex-col justify-center">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{item.label}</p>
                <p className="font-mono text-[10px] text-muted-foreground/60 mt-1">{item.size}</p>
                <p className="font-mono text-[10px] text-primary mt-1">{item.family}</p>
              </div>
              <div className="col-span-10 p-6 flex items-center overflow-hidden">
                <span className={`${item.className} text-foreground truncate`}>{item.sample}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
