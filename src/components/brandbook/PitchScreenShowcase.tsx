import { motion } from "framer-motion";
import homeImg from "@/assets/product-home.jpg";
import homeMenuImg from "@/assets/product-home-menu.jpg";
import finanzasImg from "@/assets/product-finanzas.png";
import posImg from "@/assets/product-pos.png";
import mesasImg from "@/assets/product-mesas.png";
import timelineImg from "@/assets/product-timeline.png";
import camerasImg from "@/assets/product-cameras.jpg";

const snap = [0.19, 1, 0.22, 1] as const;

export type ShowcaseScreen =
  | "home"
  | "home-menu"
  | "finanzas"
  | "pos"
  | "mesas"
  | "timeline"
  | "cameras";

const SCREENS: Record<ShowcaseScreen, { src: string; label: string; title: string; caption: string; alt: string }> = {
  home: {
    src: homeImg,
    label: "HOME · DASHBOARD",
    title: "Unified entry point.",
    caption: "A single platform to enter the physical business operation.",
    alt: "AnalogueCo main dashboard",
  },
  "home-menu": {
    src: homeMenuImg,
    label: "FINANCE · NAVIGATION",
    title: "Centralized financial modules.",
    caption: "Cash flow, accounts, invoicing, and reports in a single structure.",
    alt: "AnalogueCo financial modules menu",
  },
  finanzas: {
    src: finanzasImg,
    label: "FINANCE · CASH FLOW",
    title: "Real-time financial visibility.",
    caption: "Business income, expenses, and net crossed in a single timeline.",
    alt: "AnalogueCo cash flow",
  },
  pos: {
    src: posImg,
    label: "POS · INVOICING",
    title: "Register and active order on a single screen.",
    caption: "Invoicing, tables, and products connected to live inventory.",
    alt: "AnalogueCo invoicing and POS module",
  },
  mesas: {
    src: mesasImg,
    label: "TABLES · FLOOR PLAN DESIGNER",
    title: "The physical operation, mapped.",
    caption: "Every table, every zone, and every order — visible from a single canvas.",
    alt: "AnalogueCo restaurant floor plan designer",
  },
  timeline: {
    src: timelineImg,
    label: "OVERSIGHT · TIMELINE",
    title: "A single operational timeline.",
    caption: "Sales, sensors, cameras, and staff crossed event by event.",
    alt: "AnalogueCo operational events timeline",
  },
  cameras: {
    src: camerasImg,
    label: "SECURITY · COMPUTER VISION",
    title: "Perception layer in development.",
    caption: "Cameras connected to the operational system · counting, presence, and zones of interest.",
    alt: "AnalogueCo security module with computer vision",
  },
};

type Props = {
  screen: ShowcaseScreen;
  index: number;
  total: number;
};

/**
 * Mockup browser-style. Muestra la pantalla COMPLETA (object-contain),
 * sin recortar, dentro de una ventana que combina con la presentación.
 */
export default function PitchScreenShowcase({ screen, index, total }: Props) {
  const s = SCREENS[screen];
  const url = "analogueco.lovable.app";
  return (
    <section className="bg-secondary min-h-screen flex flex-col justify-center py-12 border-b border-white/10 relative overflow-hidden">
      {/* grilla sutil */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "120px 120px",
        }}
      />
      {/* halo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-[#1E5EFF]/10 blur-[120px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-8 w-full relative z-10">
        {/* Header */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#9DB7FF] mb-2">
              PRODUCT · {s.label}
            </p>
            <h2 className="font-display text-white text-3xl md:text-4xl leading-[0.95] max-w-[28ch]">
              {s.title}
            </h2>
          </div>
          <div className="text-right hidden md:block">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
              {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </p>
          </div>
        </div>

        {/* Browser mockup */}
        <motion.figure
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: snap }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="relative rounded-lg overflow-hidden border border-white/15 bg-[#0a1024] shadow-[0_60px_140px_-40px_rgba(0,0,0,0.8)]">
            {/* Title bar */}
            <div className="flex items-center gap-3 px-4 h-9 bg-[#0f1830] border-b border-white/10">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-3 py-1 rounded bg-white/5 border border-white/10 font-mono text-[10px] text-white/50 tracking-wider">
                  {url}
                </div>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                analogueco
              </span>
            </div>
            {/* Screen full — contain, no crop */}
            <div className="relative bg-white flex items-center justify-center" style={{ aspectRatio: "16 / 9" }}>
              <img
                src={s.src}
                alt={s.alt}
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
            </div>
          </div>

          <figcaption className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50 mt-5 flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-[#1E5EFF]" />
            {s.caption}
          </figcaption>
        </motion.figure>
      </div>
    </section>
  );
}