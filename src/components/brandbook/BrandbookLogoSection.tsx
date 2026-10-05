import logoVariations from "@/assets/logo-variations.png";
import { Logo } from "@/components/brand/Logo";
import { motion } from "framer-motion";

export default function BrandbookLogoSection() {
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
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">01 — IDENTITY</p>
              <h2 className="font-display text-5xl text-foreground">LOGO<br />SYSTEM</h2>
            </motion.div>
          </div>
          <div className="col-span-8 flex items-end">
            <p className="text-muted-foreground text-base leading-relaxed max-w-[56ch]">
              The AnalogueCo brand is an origami geometric shape — folded with precision, mechanically exact.
              It communicates structural intelligence. Never distort, recolor, or add effects.
            </p>
          </div>
        </div>

        <hr className="border-t-2 border-foreground mb-12" />

        {/* Real logo variations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="border border-border-subtle overflow-hidden mb-16"
        >
          <img src={logoVariations} alt="AnalogueCo logo variations" className="w-full h-auto" />
        </motion.div>

        {/* Clearspace rule */}
        <div className="grid grid-cols-12">
          <div className="col-span-4">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">CLEAR SPACE RULE</p>
            <div className="border border-dashed border-primary/40 p-16 relative">
              <div className="absolute top-2 left-2 font-mono text-[9px] text-primary uppercase tracking-widest">X</div>
              <div className="absolute top-2 right-2 font-mono text-[9px] text-primary uppercase tracking-widest">X</div>
              <div className="absolute bottom-2 left-2 font-mono text-[9px] text-primary uppercase tracking-widest">X</div>
              <div className="absolute bottom-2 right-2 font-mono text-[9px] text-primary uppercase tracking-widest">X</div>
              <Logo className="h-12 w-auto mx-auto text-foreground" />
            </div>
            <p className="font-mono text-[10px] text-muted-foreground mt-3 leading-relaxed">
              Minimum clear space is equal to the height of the logotype uppercase on all sides.
            </p>
          </div>
          <div className="col-span-4 col-start-5">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">MINIMUM SIZE</p>
            <div className="space-y-4">
              {[
                { size: "32px", label: "Digital minimum" },
                { size: "16mm", label: "Print minimum" },
                { size: "24px", label: "Favicon minimum (icon only)" },
              ].map((s) => (
                <div key={s.size} className="flex items-center gap-4 border-b border-border-subtle pb-3">
                  <span className="font-mono text-sm font-bold text-foreground w-16">{s.size}</span>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-3 col-start-10">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">DON'TS</p>
            <ul className="space-y-2">
              {[
                "Rotate or tilt",
                "Change color",
                "Add shadow",
                "Stretch or compress",
                "Use on complex backgrounds",
                "Apply gradient to the brand",
              ].map((rule) => (
                <li key={rule} className="flex items-start gap-2">
                  <span className="text-destructive font-mono text-xs mt-0.5">✕</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
