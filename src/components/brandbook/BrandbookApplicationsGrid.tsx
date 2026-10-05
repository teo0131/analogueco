import { motion } from "framer-motion";
import brandGrid from "@/assets/brand-applications-grid.png";

type Props = { part?: 0 | 1 | 2; compact?: boolean };

export default function BrandbookApplicationsGrid({ part = 0, compact = false }: Props) {
  const py = compact ? "py-12" : "py-32";
  const mb = compact ? "mb-8" : "mb-16";
  return (
    <section className={`bg-background ${py} border-b border-border`}>
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
                {part === 2 ? "06 — ECOSYSTEM (CONT.)" : "06 — BRAND ECOSYSTEM"}
              </p>
              <h2 className="font-display text-5xl text-foreground">
                {part === 2 ? <>TOUCH<br />POINTS</> : <>BRAND<br />IN CONTEXT</>}
              </h2>
            </motion.div>
          </div>
          <div className="col-span-8 flex items-end">
            <p className="text-muted-foreground text-base leading-relaxed max-w-[56ch]">
              AnalogueCo operates across all physical business touchpoints — from exterior signage
              to the operational dashboard. A coherent identity that conveys precision and intelligence in every environment.
            </p>
          </div>
        </div>

        <hr className={`border-t-2 border-foreground ${compact ? "mb-6" : "mb-12"}`} />

        {part !== 2 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <img
            src={brandGrid}
            alt="AnalogueCo brand in context — digital and physical applications"
            className="w-full h-auto"
          />
        </motion.div>
        )}

        {part !== 1 && (
        <div className={`${part === 2 ? "" : "mt-10"} grid grid-cols-4 border border-border`}>
          {[
            { label: "PHYSICAL PRESENCE", desc: "Signage, retail, F&B spaces" },
            { label: "DIGITAL IDENTITY", desc: "Platform, dashboard, mobile app" },
            { label: "LOGOTYPE SYSTEM", desc: "Origami icon + wordmark" },
            { label: "FIELD INTELLIGENCE", desc: "Real-time computer vision" },
          ].map((item, i) => (
            <div key={item.label} className={`p-6 ${i < 3 ? "border-r border-border" : ""}`}>
              <p className="font-mono text-[9px] uppercase tracking-widest text-primary mb-2">{item.label}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        )}
      </div>
    </section>
  );
}
