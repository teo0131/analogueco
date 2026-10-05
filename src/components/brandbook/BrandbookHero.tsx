import { Logo } from "@/components/brand/Logo";
import heroDashboard from "@/assets/hero-dashboard.png";
import posMockup from "@/assets/pos-mockup.png";
import { motion } from "framer-motion";

const snap = [0.19, 1, 0.22, 1];

const FloatingCard = ({
  label,
  value,
  status,
  delay,
  className,
}: {
  label: string;
  value: string;
  status: "alert" | "info" | "warn";
  delay: number;
  className?: string;
}) => {
  const dotColor =
    status === "alert" ? "bg-red-400" : status === "info" ? "bg-blue-400" : "bg-yellow-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: snap }}
      className={`absolute backdrop-blur-sm border border-white/10 bg-black/60 p-3 min-w-[180px] ${className}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-2 h-2 ${dotColor} animate-bbox-pulse inline-block`} />
        <span className="text-white/50 font-mono text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-white font-mono text-xs font-semibold leading-tight">{value}</p>
    </motion.div>
  );
};

export default function BrandbookHero() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: "linear-gradient(160deg, #0A1540 0%, #1533B0 65%, #1E5EFF 100%)" }}>
      {/* Top nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 pt-8 pb-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <Logo variant="mark" className="h-9 w-auto text-white" />
          <span className="font-display text-white text-xl tracking-wide">ANALOGUECO</span>
        </motion.div>
      </nav>

      {/* Hero content */}
      <div className="relative z-10 flex flex-col justify-center flex-1 px-8 pt-16 pb-0">
        <div className="grid grid-cols-12 gap-0 border-l border-white/10">
          {/* Left — Text */}
          <div className="col-span-5 pl-8 pr-8 flex flex-col justify-center py-16">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="mb-6"
            >
              <span className="font-mono text-[#1E5EFF] text-xs uppercase tracking-[0.25em] border border-[#1E5EFF]/40 px-3 py-1">
                OPERATIONAL INTELLIGENCE
              </span>
            </motion.div>

            <motion.h1
              initial={{ clipPath: "inset(100% 0 0 0)", opacity: 0 }}
              animate={{ clipPath: "inset(0% 0 0 0)", opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: snap }}
              className="font-display text-[72px] leading-[0.95] text-white mb-6"
            >
              DATA WHERE
              <br />
              <span className="text-[#1E5EFF]">IT HAPPENS.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-white/55 text-base leading-relaxed max-w-[48ch] font-light mb-10"
            >
              An operational platform for physical retail. Centralize POS, inventory, finance, and team workflows today — with computer vision, audio, and sensors in development.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="flex items-center gap-4"
            >
              <a
                href="https://analogueco.lovable.app"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#1E5EFF] text-white font-mono text-xs uppercase tracking-[0.2em] px-8 py-4 hover:bg-[#0D46CC] transition-colors duration-100 active:scale-[0.98] inline-block"
              >
                EXPLORE PRODUCT ↗
              </a>
              <a href="/presentacion" className="border border-white/20 text-white/70 font-mono text-xs uppercase tracking-[0.2em] px-8 py-4 hover:border-white/50 hover:text-white transition-all duration-100">
                VIEW PITCH ↗
              </a>
            </motion.div>

            {/* Metrics */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.4 }}
              className="flex items-center gap-8 mt-12 pt-8 border-t border-white/10"
            >
              {[
                { val: "MVP", label: "Operational platform" },
                { val: "PILOT", label: "Fraterno Café" },
                { val: "R&D", label: "Physical intelligence" },
              ].map((m) => (
                <div key={m.label}>
                  <p className="font-mono text-white text-lg font-bold">{m.val}</p>
                  <p className="font-mono text-white/40 text-[10px] uppercase tracking-widest mt-0.5">{m.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Dashboard Mockup */}
          <div className="col-span-7 relative border-l border-white/10">
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: snap }}
              className="relative h-full min-h-[580px]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 overflow-hidden" />
              <img
                src={heroDashboard}
                alt="AnalogueCo dashboard"
                className="w-full h-full object-cover opacity-80"
              />

              {/* POS hardware mockup overlay */}
              <motion.img
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.6, duration: 1, ease: snap }}
                src={posMockup}
                alt="AnalogueCo POS system"
                className="absolute inset-0 w-[138%] h-[138%] -left-[19%] -top-[16.5%] object-contain object-center drop-shadow-2xl z-10"
              />

              {/* Corner bracket decorations */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#1E5EFF]" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#1E5EFF]" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#1E5EFF]" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#1E5EFF]" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom meta bar */}
      <div className="relative z-10 border-t border-white/10 flex items-center justify-between px-8 py-4">
        <span className="font-mono text-white/25 text-[10px] uppercase tracking-widest">AnalogueCo — Operational Intelligence</span>
        <span className="font-mono text-white/25 text-[10px] uppercase tracking-widest">VERSION 1.0 — 2025</span>
        <span className="font-mono text-white/25 text-[10px] uppercase tracking-widest">INTELLIGENCE FROM THE REAL WORLD.</span>
      </div>
    </section>
  );
}
