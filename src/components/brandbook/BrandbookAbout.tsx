import { motion } from "framer-motion";

const snap = [0.19, 1, 0.22, 1];

type Props = { part?: 0 | 1 | 2; compact?: boolean; hideNumber?: boolean };

export default function BrandbookAbout({ part = 0, compact = false, hideNumber = false }: Props) {
  const py = compact ? "py-12" : "py-32";
  const mb = compact ? "mb-8" : "mb-16";
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
                  ? hideNumber ? "SUMMARY (CONT.)" : "00 — SUMMARY (CONT.)"
                  : hideNumber ? "SUMMARY" : "00 — SUMMARY"}
              </p>
              <h2 className="font-display text-5xl text-foreground">
                {part === 2 ? <>IDENTITY<br />AND SCOPE</> : <>ABOUT<br />THE<br />PROJECT</>}
              </h2>
            </motion.div>
          </div>
          <div className="col-span-8" />
        </div>

        <hr className="border-t-2 border-foreground mb-0" />

        {part !== 2 && [
          {
            label: "ABOUT ANALOGUECO",
            content: "AnalogueCo is an operational intelligence system designed for physical businesses. By integrating computer vision with transactional data, it enables real-time visibility, control, and decision-making at the point where business actually happens.",
            large: true,
          },
          {
            label: "INDUSTRIA",
            content: "Retail, Food & Beverage, Physical Retail",
          },
          {
            label: "VISION",
            content: "Closing the gap between physical operations and digital intelligence.",
          },
          {
            label: "MISSION",
            content: "Transforming real-world activity into actionable business data.",
          },
        ].map((row, i) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: snap }}
            viewport={{ once: true }}
            className="grid grid-cols-12 border-b border-border-subtle py-10"
          >
            <div className="col-span-3">
              <p className="font-mono text-xs uppercase tracking-widest text-foreground">{row.label}</p>
            </div>
            <div className="col-span-9">
              <p className={`text-foreground leading-relaxed ${row.large ? "text-lg" : "text-base"} max-w-[72ch]`}>
                {row.content}
              </p>
            </div>
          </motion.div>
        ))}

        {part !== 1 && (<>
        {/* Personality block */}
        <div className="bg-secondary mt-0 p-12 border border-secondary">
          <div className="grid grid-cols-12">
            <div className="col-span-3">
              <p className="font-mono text-xs uppercase tracking-widest text-white/40">PROJECT PERSONALITY</p>
            </div>
            <div className="col-span-9 flex flex-wrap gap-3">
              {["Analytical", "Precise", "Minimal", "Strategic", "Systemic", "Invisible Intelligence"].map((tag) => (
                <span
                  key={tag}
                  className="border border-white/20 px-4 py-2 font-mono text-xs text-white/80 uppercase tracking-widest hover:border-primary hover:text-primary transition-all duration-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Author / Scope bar */}
        <div className="grid grid-cols-3 gap-0 border border-border-subtle border-t-0 bg-background">
          <div className="border-r border-border-subtle p-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">AUTHOR</p>
            <p className="font-mono text-sm text-foreground">AnalogueCo Studio</p>
          </div>
          <div className="border-r border-border-subtle p-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">SCOPE</p>
            <p className="font-mono text-sm text-foreground">Operational Intelligence<br />Computer Vision Platform<br />Physical Retail</p>
          </div>
          <div className="p-6 flex items-center justify-end">
            <p className="font-mono text-[10px] text-muted-foreground">© 2025 AnalogueCo. All rights reserved.</p>
          </div>
        </div>
        </>)}
      </div>
    </section>
  );
}
