import { motion } from "framer-motion";
import heroDashboard from "@/assets/hero-dashboard.png";
import storeVision from "@/assets/store-vision.png";
import mockupLaptop from "@/assets/mockup-laptop.png";
import mockupSignage from "@/assets/mockup-signage.png";
import logo from "@/assets/logo.png";

const CVOverlay = () => (
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute top-[20%] left-[15%] w-20 h-32 border border-primary animate-bbox-pulse">
      <div className="absolute -top-4 left-0 bg-primary px-1 py-0.5">
        <span className="font-mono text-[8px] text-primary-foreground">PERSONA_01</span>
      </div>
    </div>
    <div className="absolute top-[25%] left-[45%] w-20 h-32 border border-primary animate-bbox-pulse" style={{ animationDelay: "0.5s" }}>
      <div className="absolute -top-4 left-0 bg-primary px-1 py-0.5">
        <span className="font-mono text-[8px] text-primary-foreground">PERSONA_02</span>
      </div>
    </div>
    <div className="absolute top-[30%] right-[20%] w-24 h-16 border border-yellow-400/80 animate-bbox-pulse" style={{ animationDelay: "1s" }}>
      <div className="absolute -top-4 left-0 bg-yellow-400 px-1 py-0.5">
        <span className="font-mono text-[8px] text-black">SHELF_ZONE_A</span>
      </div>
    </div>
    {[[30,40],[50,55],[70,35],[25,70],[60,65]].map(([x,y], i) => (
      <div key={i} className="absolute w-1.5 h-1.5 bg-primary animate-bbox-pulse" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.3}s` }} />
    ))}
    <div className="absolute left-0 right-0 h-px bg-primary/30 top-[50%]" />
    <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-primary" />
    <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-primary" />
    <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-primary" />
    <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-primary" />
    <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/60 border border-primary/40 px-2 py-0.5">
      <span className="font-mono text-[9px] text-primary uppercase tracking-widest">LIVE — 09:42:17</span>
    </div>
  </div>
);

export default function BrandbookMockups() {
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
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">05 — APPLICATIONS</p>
              <h2 className="font-display text-5xl text-foreground">BRAND<br />IN USE</h2>
            </motion.div>
          </div>
          <div className="col-span-8 flex items-end">
            <p className="text-muted-foreground text-base leading-relaxed max-w-[56ch]">
              AnalogueCo appears in digital interfaces and physical environments. The CV overlay language —
              bounding boxes, tracking points, data tags — is the visual signature of the intelligence layer.
            </p>
          </div>
        </div>

        <hr className="border-t-2 border-foreground mb-12" />

        {/* Main mockup grid */}
        <div className="grid grid-cols-12 gap-0 border border-border-subtle">
          {/* Large laptop mockup */}
          <div className="col-span-7 border-r border-border-subtle relative overflow-hidden group" style={{ minHeight: 360 }}>
            <img src={mockupLaptop} alt="Dashboard mockup" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute bottom-0 left-0 right-0 border-t border-border-subtle bg-background/90 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">DIGITAL — DASHBOARD INTERFACE</span>
              <span className="font-mono text-[10px] text-primary">ANALOGUECO PLATFORM</span>
            </div>
          </div>

          {/* Top-right: Store vision with CV overlay */}
          <div className="col-span-5 relative overflow-hidden group" style={{ minHeight: 180 }}>
            <img src={storeVision} alt="CV overlay store" className="w-full h-full object-cover grayscale transition-transform duration-700 group-hover:scale-105" />
            <CVOverlay />
            <div className="absolute bottom-0 left-0 right-0 border-t border-border-subtle bg-background/90 backdrop-blur-sm px-6 py-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">CV LAYER — STORE FEED</span>
            </div>
          </div>

          {/* Bottom row */}
          <div className="col-span-4 border-t border-r border-border-subtle relative overflow-hidden group" style={{ minHeight: 220 }}>
            <img src={mockupSignage} alt="Signage mockup" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute bottom-0 left-0 right-0 border-t border-border-subtle bg-background/90 backdrop-blur-sm px-6 py-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">ENVIRONMENTAL — SIGNAGE</span>
            </div>
          </div>

          {/* Logo on dark */}
          <div className="col-span-4 border-t border-r border-border-subtle bg-secondary flex items-center justify-center p-12 relative" style={{ minHeight: 220 }}>
            <div>
              <img src={logo} alt="AnalogueCo" className="h-14 w-auto brightness-0 invert mb-4" />
              <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest text-center">OPERATIONAL INTELLIGENCE</p>
            </div>
            <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-primary/40" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-primary/40" />
          </div>

          {/* Hero dashboard */}
          <div className="col-span-4 border-t border-border-subtle relative overflow-hidden group" style={{ minHeight: 220 }}>
            <img src={heroDashboard} alt="Hero dashboard" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute bottom-0 left-0 right-0 border-t border-border-subtle bg-background/90 backdrop-blur-sm px-6 py-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">DIGITAL — MONITORING FEED</span>
            </div>
          </div>
        </div>

        {/* Graphic elements section */}
        <div className="mt-16">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-8">GRAPHIC ELEMENTS — CV LANGUAGE</p>
          <div className="grid grid-cols-5 gap-0 border border-border-subtle">
            {[
              { label: "BOUNDING BOX", el: <div className="w-16 h-20 border-2 border-primary relative"><div className="absolute -top-5 left-0 bg-primary px-1.5 py-0.5"><span className="font-mono text-[8px] text-primary-foreground">LABEL</span></div></div> },
              { label: "TRACKING POINT", el: <div className="w-3 h-3 bg-primary relative"><div className="absolute inset-0 bg-primary animate-ping opacity-30" /></div> },
              { label: "SCAN LINE", el: <div className="w-full h-px bg-primary relative"><div className="absolute -right-1 -top-1 w-2 h-2 bg-primary" /></div> },
              { label: "CORNER BRACKET", el: <div className="relative w-10 h-10"><div className="absolute top-0 left-0 w-full h-full border-t-2 border-l-2 border-primary" /></div> },
              { label: "DATA TAG", el: <div className="bg-primary px-3 py-1.5"><span className="font-mono text-[10px] text-primary-foreground uppercase tracking-widest">ALERT_001</span></div> },
            ].map((item, i) => (
              <div key={item.label} className={`${i < 4 ? "border-r border-border-subtle" : ""} p-8 flex flex-col items-center justify-between gap-6`}>
                <div className="flex items-center justify-center h-20">
                  {item.el}
                </div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground text-center">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
