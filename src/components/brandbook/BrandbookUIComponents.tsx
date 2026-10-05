import { motion } from "framer-motion";

export default function BrandbookUIComponents() {
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
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">08 — UI</p>
              <h2 className="font-display text-5xl text-foreground">UI<br />COMPONENTS</h2>
            </motion.div>
          </div>
          <div className="col-span-8 flex items-end">
            <p className="text-muted-foreground text-base leading-relaxed max-w-[56ch]">
              Each component is a mechanical switch. Click feel, not squish.
              No border-radius. No soft shadows. Depth is achieved through contrast and layering.
            </p>
          </div>
        </div>

        <hr className="border-t-2 border-foreground mb-12" />

        <div className="grid grid-cols-12 gap-0 border border-border-subtle">
          {/* Buttons */}
          <div className="col-span-6 border-r border-border-subtle p-10">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-8">BUTTONS</p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <button className="bg-foreground text-background font-mono text-xs uppercase tracking-[0.2em] px-8 py-4 hover:bg-primary transition-colors duration-100 active:scale-[0.98]">
                  PRIMARY ACTION
                </button>
                <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">bg-foreground → hover: bg-primary</span>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <button className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-[0.2em] px-8 py-4 hover:bg-primary/80 transition-colors duration-100 active:scale-[0.98]">
                  ACCENT ACTION
                </button>
                <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">bg-primary accent blue</span>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <button className="border-2 border-foreground text-foreground font-mono text-xs uppercase tracking-[0.2em] px-8 py-4 hover:bg-foreground hover:text-background transition-colors duration-100">
                  SECONDARY / OUTLINE
                </button>
                <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">border-foreground, bg-transparent</span>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <button className="border border-primary/40 text-primary font-mono text-xs uppercase tracking-[0.2em] px-8 py-4 hover:border-primary transition-colors duration-100">
                  GHOST / SUBTLE
                </button>
                <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">border-primary/40</span>
              </div>
            </div>
          </div>

          {/* Inputs */}
          <div className="col-span-6 p-10">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-8">INPUTS AND FORMS</p>
            <div className="space-y-6">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">STORE IDENTIFIER</label>
                <input
                  type="text"
                  placeholder="Enter store ID"
                  className="w-full bg-transparent border-b-2 border-foreground focus:border-primary outline-none py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/40 transition-colors duration-100"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">ALERT THRESHOLD</label>
                <input
                  type="text"
                  placeholder="0.00%"
                  className="w-full bg-transparent border-b-2 border-foreground focus:border-primary outline-none py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/40 transition-colors duration-100"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">MONITORING ZONE</label>
                <select className="w-full bg-transparent border-b-2 border-foreground focus:border-primary outline-none py-2 font-mono text-sm text-foreground transition-colors duration-100">
                  <option>Zone A — Entrance</option>
                  <option>Zone B — Shelving</option>
                  <option>Zone C — POS Area</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="col-span-12 border-t border-border-subtle p-10">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-8">ALERT CARDS</p>
            <div className="grid grid-cols-4 gap-0 border border-border-subtle">
              {[
                { type: "CRITICAL", title: "Stock discrepancy", desc: "Zone 3B — 4 SKUs unaccounted for", color: "border-destructive bg-destructive/5", dot: "bg-destructive" },
                { type: "WARNING", title: "Unregistered sale", desc: "POS Terminal 02 — 09:31", color: "border-yellow-500 bg-yellow-500/5", dot: "bg-yellow-500" },
                { type: "INFO", title: "Flagged behavior", desc: "Camera 7 — Employee deviation", color: "border-primary bg-primary/5", dot: "bg-primary" },
                { type: "NOMINAL", title: "Store performance", desc: "+12% vs last Tuesday", color: "border-border-subtle bg-background", dot: "bg-green-500" },
              ].map((card, i) => (
                <div key={card.type} className={`${i < 3 ? "border-r border-border-subtle" : ""} p-6 border-l-4 ${card.color}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 ${card.dot} animate-bbox-pulse inline-block`} />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{card.type}</span>
                  </div>
                  <p className="font-mono text-sm font-bold text-foreground mb-1">{card.title}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="col-span-12 border-t border-border-subtle p-10">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-6">BADGES AND LABELS</p>
            <div className="flex flex-wrap gap-3 items-center">
              <span className="bg-foreground text-background font-mono text-[10px] uppercase tracking-widest px-3 py-1">LIVE</span>
              <span className="bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest px-3 py-1">ACTIVE</span>
              <span className="border border-border-subtle text-foreground font-mono text-[10px] uppercase tracking-widest px-3 py-1">ZONE A</span>
              <span className="border border-destructive/60 text-destructive font-mono text-[10px] uppercase tracking-widest px-3 py-1">ALERT</span>
              <span className="border border-yellow-500/60 text-yellow-700 font-mono text-[10px] uppercase tracking-widest px-3 py-1">WARNING</span>
              <span className="bg-muted text-muted-foreground font-mono text-[10px] uppercase tracking-widest px-3 py-1">OFFLINE</span>
              <span className="border border-green-500/60 text-green-700 font-mono text-[10px] uppercase tracking-widest px-3 py-1">NOMINAL</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
