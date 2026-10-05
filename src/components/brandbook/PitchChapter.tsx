import { motion } from "framer-motion";

const snap = [0.19, 1, 0.22, 1] as const;

type Props = {
  id: string;          // "01" .. "07"
  label: string;       // "PROBLEM"
  title: string;       // "EL DOLOR INVISIBLE..."
  description: string; // párrafo de framing
  quote?: string;      // frase ancla
};

/**
 * Separador / intro de cada capítulo del pitch.
 * Va inmediatamente antes de las secciones del brandbook que ilustran ese punto.
 */
export default function PitchChapter({ id, label, title, description, quote }: Props) {
  return (
    <section className="bg-secondary py-24 border-y border-white/10 relative overflow-hidden">
      {/* Grid sutil */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
      <div className="max-w-[1400px] mx-auto px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: snap }}
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-12 gap-8 items-end"
        >
          <div className="col-span-12 md:col-span-7">
            <div className="h-px w-full bg-white/20 mb-6" />
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#9DB7FF] mb-4">
              {label}
            </p>
            <h2 className="font-display text-5xl md:text-6xl text-white leading-[0.95] whitespace-pre-line">
              {title}
            </h2>
          </div>
          <div className="col-span-12 md:col-span-5">
            <p className="text-white/70 text-base leading-relaxed max-w-[48ch] mb-5">
              {description}
            </p>
            {quote && (
              <div className="border-l-2 border-[#1E5EFF] pl-4">
                <p className="font-display text-white/90 text-lg italic leading-snug">
                  "{quote}"
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
