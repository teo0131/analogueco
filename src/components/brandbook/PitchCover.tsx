import { Logo } from "@/components/brand/Logo";
import { motion } from "framer-motion";

const snap = [0.19, 1, 0.22, 1] as const;

/**
 * Portada de impacto para la Presentación Empresarial (pitch).
 * Lo primero que se ve: el logo de AnalogueCo a gran escala, reconocible al instante.
 */
export default function PitchCover() {
  return (
    <section
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0A1540 0%, #1533B0 65%, #1E5EFF 100%)" }}
    >
      {/* Grid sutil de fondo */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Marca de pitch arriba */}
      <div className="relative z-10 flex items-center justify-between px-8 pt-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
          ANALOGUECO — PRODUCT DEMO
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
          BUSINESS PRESENTATION
        </span>
      </div>

      {/* Logo gigante centrado */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: snap }}
          className="w-full max-w-5xl"
        >
          <Logo className="w-full h-auto text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6, ease: snap }}
          className="mt-16 flex flex-col items-center gap-4"
        >
          <span className="font-mono text-[#9DB7FF] text-[11px] uppercase tracking-[0.3em] border border-[#1E5EFF]/40 px-4 py-1.5">
            OPERATIONAL INTELLIGENCE
          </span>
          <p className="font-display text-white text-2xl md:text-3xl text-center max-w-3xl leading-tight">
            Data <span className="text-[#9DB7FF]">where</span> it happens.
          </p>
          <p className="text-white/55 text-sm md:text-base font-light max-w-[56ch] text-center mt-2">
            Intelligent operational infrastructure for physical retail.
          </p>
        </motion.div>
      </div>

      {/* Indicador de scroll */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="relative z-10 flex flex-col items-center pb-10 gap-2"
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/40">
          SWIPE TO START
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-8 bg-gradient-to-b from-white/60 to-transparent"
        />
      </motion.div>

      {/* Esquinas brackets */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/20" />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/20" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/20" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/20" />
    </section>
  );
}