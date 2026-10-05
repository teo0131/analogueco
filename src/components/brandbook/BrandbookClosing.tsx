import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const snap = [0.19, 1, 0.22, 1];

export default function BrandbookClosing() {
  return (
    <section className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "linear-gradient(160deg, #0A1540 0%, #1533B0 65%, #1E5EFF 100%)" }}>
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-32 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: snap }}
          viewport={{ once: true }}
        >
          <Logo className="h-16 w-auto mx-auto mb-16 text-white/80" />
        </motion.div>

        <motion.h2
          initial={{ clipPath: "inset(100% 0 0 0)", opacity: 0 }}
          whileInView={{ clipPath: "inset(0% 0 0 0)", opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8, ease: snap }}
          viewport={{ once: true }}
          className="font-display text-[80px] leading-none text-white mb-8 max-w-5xl"
        >
          WE ARE BUILDING
          <br />
          THE <span className="text-[#1E5EFF]">INFRASTRUCTURE</span>
          <br />
          OF PHYSICAL RETAIL.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          viewport={{ once: true }}
          className="text-white/40 text-base font-mono uppercase tracking-[0.2em] max-w-[56ch] mb-16"
        >
          INTELLIGENCE FROM THE REAL WORLD.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          viewport={{ once: true }}
          className="flex items-center gap-6"
        >
          <Button asChild className="rounded-none h-auto px-10 py-4 uppercase text-xs">
            <a href="https://analogueco.lovable.app" target="_blank" rel="noopener noreferrer">EXPLORE PRODUCT ↗</a>
          </Button>
          <Button asChild variant="outline" className="rounded-none h-auto px-10 py-4 uppercase text-xs">
            <a href="/modulo/negocio">EXPLORE BUSINESS</a>
          </Button>
        </motion.div>
      </div>

      <div className="relative z-10 border-t border-white/10 grid grid-cols-3 px-8 py-6">
        <div>
          <p className="font-mono text-[10px] text-white/25 uppercase tracking-widest">© 2025 ANALOGUECO</p>
        </div>
        <div className="text-center">
          <p className="font-mono text-[10px] text-white/25 uppercase tracking-widest">BRAND MANUAL V1.0</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] text-white/25 uppercase tracking-widest">OPERATIONAL INTELLIGENCE</p>
        </div>
      </div>
    </section>
  );
}
