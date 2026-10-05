import { motion } from "framer-motion";

const colors = [
  {
    name: "DEEP BLACK",
    hex: "#0B0B0B",
    hsl: "HSL(0, 0%, 4%)",
    usage: "Main background, Dominant UI surface",
    bg: "#0B0B0B",
    text: "#FFFFFF",
  },
  {
    name: "DARK GRAY",
    hex: "#2A2A2A",
    hsl: "HSL(0, 0%, 16%)",
    usage: "Secondary surface, Card background",
    bg: "#2A2A2A",
    text: "#FFFFFF",
  },
  {
    name: "ELECTRIC BLUE",
    hex: "#1E5EFF",
    hsl: "HSL(224, 100%, 56%)",
    usage: "Primary action, CV Overlays, Data accent",
    bg: "#1E5EFF",
    text: "#FFFFFF",
    primary: true,
  },
  {
    name: "LIGHT BLUE",
    hex: "#4D7FFF",
    hsl: "HSL(224, 100%, 65%)",
    usage: "Hover states, Secondary accent",
    bg: "#4D7FFF",
    text: "#FFFFFF",
  },
  {
    name: "PURE WHITE",
    hex: "#FFFFFF",
    hsl: "HSL(0, 0%, 100%)",
    usage: "Text on dark, Inverted logo",
    bg: "#FFFFFF",
    text: "#0B0B0B",
    border: true,
  },
  {
    name: "COOL GRAY",
    hex: "#EBEBEB",
    hsl: "HSL(0, 0%, 92%)",
    usage: "Dimmed surfaces, Disabled states",
    bg: "#EBEBEB",
    text: "#0B0B0B",
  },
];

export default function BrandbookColors() {
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
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">02 — PALETTE</p>
              <h2 className="font-display text-5xl text-foreground">COLOR<br />SYSTEM</h2>
            </motion.div>
          </div>
          <div className="col-span-8 flex items-end">
            <p className="text-muted-foreground text-base leading-relaxed max-w-[56ch]">
              A cold and industrial palette. No warmth. No nostalgia. The only chromatic moment —
              Electric Blue — is precisely targeted: CV overlays, alerts, primary actions. Everything else is structural.
            </p>
          </div>
        </div>

        <hr className="border-t-2 border-foreground mb-12" />

        <div className="grid grid-cols-6 border border-border-subtle">
          {colors.map((color, i) => (
            <motion.div
              key={color.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              viewport={{ once: true }}
              className={`border-r border-border-subtle last:border-r-0 ${color.primary ? "col-span-2" : "col-span-1"}`}
            >
              <div
                className={`h-48 ${color.primary ? "h-64" : ""} relative flex items-end p-4 ${color.border ? "border border-border-subtle" : ""}`}
                style={{ backgroundColor: color.bg }}
              >
                {color.primary && (
                  <span className="font-mono text-white/40 text-[10px] uppercase tracking-widest absolute top-4 left-4">
                    PRIMARY ACCENT ↗
                  </span>
                )}
              </div>
              <div className="border-t border-border-subtle p-4 bg-background">
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-foreground mb-1">{color.name}</p>
                <p className="font-mono text-xs text-primary mb-1">{color.hex}</p>
                <p className="font-mono text-[10px] text-muted-foreground mb-2">{color.hsl}</p>
                <p className="font-mono text-[10px] text-muted-foreground leading-tight">{color.usage}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Gradient */}
        <div className="mt-12 grid grid-cols-12 gap-0 border border-border-subtle">
          <div className="col-span-8 border-r border-border-subtle">
            <div className="h-32" style={{ background: "linear-gradient(160deg, #0A1540 0%, #1533B0 65%, #1E5EFF 100%)" }} />
            <div className="border-t border-border-subtle px-6 py-4">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-foreground mb-1">HERO GRADIENT</p>
              <p className="font-mono text-[10px] text-muted-foreground">linear-gradient(160deg, #0A1540 0%, #1533B0 65%, #1E5EFF 100%)</p>
            </div>
          </div>
          <div className="col-span-4">
            <div className="h-32" style={{ background: "linear-gradient(180deg, #0A1540 0%, #1E3A8A 100%)" }} />
            <div className="border-t border-border-subtle px-6 py-4">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-foreground mb-1">SURFACE GRADIENT</p>
              <p className="font-mono text-[10px] text-muted-foreground">linear-gradient(180deg, #0A1540 0%, #1E3A8A 100%)</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
