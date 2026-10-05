import { motion } from "framer-motion";
import mateoPhoto from "@/assets/mateo-vallejo.jpg";

const snap = [0.19, 1, 0.22, 1] as const;

const intereses = ["Entrepreneurship", "Venture Capital", "Marketing"];

const experiencia = [
  { k: "STARTUP 101 BOOTCAMP", v: "University of Regina · TagIt Project." },
  { k: "ONGOING LABORATORY", v: "AnalogueCo Project." },
  { k: "EAFIT MARKETING CLUB", v: "Active member." },
];

const mentors = [
  {
    name: "Juan Carlos Arbeláez",
    role: "Computer Vision · Generative Design",
    note: "Researcher with experience at EAFIT. Technical support in the perception layer.",
  },
  {
    name: "Santiago Sánchez (coming soon)",
    role: "Machine Learning Engineer",
    note: "Experience developing applied AI solutions. Technical model validation.",
  },
];

const needs = [
  "Technical co-founder focused on computer vision / mechatronics",
  "Early adopters in gastronomy and SME retail",
  "Seed capital to accelerate the perception layer",
];

export default function PitchFounderFit() {
  return (
    <section className="bg-secondary py-24 border-b border-white/10">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="grid grid-cols-12 mb-12">
          <div className="col-span-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#9DB7FF] mb-3">
              FOUNDER-MARKET FIT
            </p>
            <h2 className="font-display text-5xl text-white leading-[0.95]">
              TEAM OF ONE.<br />BUILT<br />TO SCALE.
            </h2>
          </div>
          <div className="col-span-7 flex items-end">
            <p className="text-white/50 text-base leading-relaxed max-w-[60ch]">
              Today AnalogueCo is built by a single person. It is not a limitation we
              hide — it is the most honest starting point and the reason why
              every decision is born from operating the real business.
            </p>
          </div>
        </div>

        <hr className="border-t border-white/20 mb-10" />

        <div className="grid grid-cols-12 gap-8 items-stretch">
          {/* Identidad del fundador */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: snap }}
            viewport={{ once: true }}
            className="col-span-12 md:col-span-5"
          >
            <div className="border border-white/10 p-6 h-full flex gap-5 bg-white/[0.02]">
              <div className="w-40 shrink-0 aspect-[3/4] overflow-hidden border border-white/10 grayscale">
                <img src={mateoPhoto} alt="Mateo Vallejo" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#9DB7FF] mb-2">FOUNDER</p>
                <p className="font-display text-white text-3xl leading-tight mb-3">MATEO VALLEJO</p>
                <ul className="space-y-1.5 text-white/70 text-sm leading-relaxed">
                  <li>Product Design Engineering.</li>
                  <li>Stakeholder · Intrapreneurship at Fraterno Café.</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Intereses + Experiencia */}
          <div className="col-span-12 md:col-span-7 grid grid-cols-1 gap-5">
            <div className="border border-white/10 p-6 bg-white/[0.02]">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1E5EFF] mb-3">INTERESTS</p>
              <ul className="flex flex-wrap gap-2">
                {intereses.map((i) => (
                  <li key={i} className="border border-white/15 px-3 py-1.5 text-white/80 text-sm">
                    {i}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-white/10 p-6 bg-white/[0.02]">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1E5EFF] mb-4">EXPERIENCE</p>
              <ul className="space-y-3">
                {experiencia.map((e) => (
                  <li key={e.k} className="border-l-2 border-[#1E5EFF] pl-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#9DB7FF] mb-1">{e.k}</p>
                    <p className="text-white/75 text-sm leading-relaxed">{e.v}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Acompañamiento técnico — mentores */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: snap }}
          viewport={{ once: true }}
          className="mt-10 border-t border-white/15 pt-8 grid grid-cols-12 gap-8"
        >
          <div className="col-span-12 md:col-span-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#9DB7FF] mb-2">TECHNICAL SUPPORT</p>
            <p className="font-display text-white text-3xl leading-tight">Specialized mentoring.</p>
            <p className="text-white/40 text-xs leading-relaxed mt-3">
              They are not the founding team. They technically validate the perception layer and operational AI.
            </p>
          </div>
          <ul className="col-span-12 md:col-span-9 grid grid-cols-2 gap-5">
            {mentors.map((m) => (
              <li key={m.name} className="border border-white/10 bg-white/[0.02] p-5">
                <p className="font-display text-white text-xl leading-tight mb-1">{m.name}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1E5EFF] mb-3">{m.role}</p>
                <p className="text-white/60 text-sm leading-relaxed">{m.note}</p>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Qué necesita */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: snap }}
          viewport={{ once: true }}
          className="mt-10 border-t border-white/15 pt-8 grid grid-cols-12 gap-8"
        >
          <div className="col-span-12 md:col-span-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#9DB7FF] mb-2">WHAT WE NEED</p>
            <p className="font-display text-white text-3xl leading-tight">The next step.</p>
          </div>
          <ul className="col-span-12 md:col-span-9 grid grid-cols-3 gap-5">
            {needs.map((n) => (
              <li key={n} className="border-l-2 border-[#1E5EFF] pl-4 text-white/80 text-sm leading-relaxed">
                {n}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}