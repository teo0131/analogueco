import personaImg from "@/assets/persona-carlos.png";
import { motion } from "framer-motion";

const snap = [0.19, 1, 0.22, 1];

type Props = { part?: 0 | 1 | 2; compact?: boolean; hideNumber?: boolean };

export default function BrandbookPersona({ part = 0, compact = false, hideNumber = false }: Props) {
  const py = compact ? "py-12" : "py-32";
  const mb = compact ? "mb-8" : "mb-16";
  const showPortrait = part === 0 || part === 1;
  const showRight = part === 0 || part === 2;
  return (
    <section className={`bg-secondary ${py} border-b border-white/10`}>
      <div className="max-w-[1400px] mx-auto px-8">
        <div className={`grid grid-cols-12 ${mb}`}>
          <div className="col-span-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <p className="font-mono text-xs uppercase tracking-widest text-white/40 mb-3">
                {part === 2
                  ? hideNumber ? "PERSONA (CONT.)" : "04 — PERSONA (CONT.)"
                  : hideNumber ? "USER PERSONA" : "04 — USER PERSONA"}
              </p>
              <h2 className="font-display text-5xl text-white">
                {part === 2 ? <>GOALS<br />AND PAINS</> : <>PRIMARY<br />USER</>}
              </h2>
            </motion.div>
          </div>
          <div className="col-span-8 flex items-end">
            <p className="text-white/50 text-base leading-relaxed max-w-[56ch]">
              Not the tech-first operator. It's the owner who built everything with his own hands —
              and now needs eyes in every place he cannot be.
            </p>
          </div>
        </div>

        <hr className={`border-t border-white/20 ${compact ? "mb-6" : "mb-12"}`} />

        <div className="grid grid-cols-12 gap-0 border border-white/10">
          {showPortrait && (
          <div className={`${showRight ? "col-span-3 border-r border-white/10" : "col-span-5 border-r border-white/10"}`}>
            <div className="relative overflow-hidden">
              <img src={personaImg} alt="Carlos — User Persona" className="w-full aspect-square object-cover object-top grayscale" />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary via-transparent to-transparent" />
              <div className="absolute inset-6 border border-primary/60 animate-bbox-pulse pointer-events-none">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-2 py-0.5">
                  <span className="font-mono text-[9px] text-primary-foreground uppercase tracking-widest">IDENTIFIED OWNER</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-white/10">
              <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest mb-1">Retail Store Owner</p>
              <p className="font-display text-3xl text-white">CARLOS</p>
              <div className="mt-4 grid grid-cols-3 gap-0 border border-white/10">
                {[{ l: "Age", v: "44" }, { l: "Country", v: "MX" }, { l: "Tech", v: "Low" }].map((s, i) => (
                  <div key={s.l} className={`p-3 text-center ${i < 2 ? "border-r border-white/10" : ""}`}>
                    <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest">{s.l}</p>
                    <p className="font-mono text-sm text-white font-bold">{s.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}

          {part === 1 && (
          <div className="col-span-7 p-8 flex items-center">
            <div>
              <div className="flex gap-3 mb-4 flex-wrap">
                {["Problem Owner", "Operation Dependent", "Decision Maker"].map(t => (
                  <span key={t} className="border border-white/20 px-3 py-1 font-mono text-[10px] text-white/60 uppercase tracking-widest">{t}</span>
                ))}
              </div>
              <p className="text-white/80 leading-relaxed text-base max-w-[72ch]">
                Carlos is a 44-year-old owner of a medium-sized retail store in Mexico City. He built the business
                with his own hands and manages a team of 8 people. He doesn't know what happens when he's away —
                and it's costing him. He trusts his people, but needs a system he can trust more.
              </p>
            </div>
          </div>
          )}

          {showRight && (
          <div className={part === 2 ? "col-span-12" : "col-span-9"}>
            {part === 0 && (
            <div className="bg-[#111111] border-b border-white/10 p-8">
              <div className="flex gap-3 mb-4 flex-wrap">
                {["Problem Owner", "Operation Dependent", "Decision Maker"].map(t => (
                  <span key={t} className="border border-white/20 px-3 py-1 font-mono text-[10px] text-white/60 uppercase tracking-widest">{t}</span>
                ))}
              </div>
              <p className="text-white/80 leading-relaxed text-base max-w-[72ch]">
                Carlos is a 44-year-old owner of a medium-sized retail store in Mexico City. He built the business
                with his own hands and manages a team of 8 people. He doesn't know what happens when he's away —
                and it's costing him. He trusts his people, but needs a system he can trust more.
              </p>
            </div>
            )}

            <div className="grid grid-cols-2">
              <div className="border-r border-white/10 p-8">
                <p className="font-mono text-xs uppercase tracking-widest text-primary mb-6">GOALS</p>
                <ul className="space-y-3">
                  {[
                    "Knowing what happens remotely, in real time",
                    "Detecting inventory losses before they accumulate",
                    "Understanding employee patterns and behaviors",
                    "Having data to make operational decisions faster",
                    "Reducing dependence on manual reports",
                  ].map(g => (
                    <li key={g} className="flex items-start gap-3">
                      <span className="text-primary mt-1 font-mono text-xs">→</span>
                      <span className="text-white/70 text-sm leading-relaxed">{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-8">
                <p className="font-mono text-xs uppercase tracking-widest text-destructive/80 mb-6">PAIN POINTS</p>
                <ul className="space-y-3">
                  {[
                    "No visibility when not at the store",
                    "Does not trust current inventory data",
                    "Cannot monitor employee behavior remotely",
                    "POS data does not match physical reality",
                    "Losses are discovered weeks later",
                  ].map(p => (
                    <li key={p} className="flex items-start gap-3">
                      <span className="text-destructive/80 mt-1 font-mono text-xs">✕</span>
                      <span className="text-white/70 text-sm leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-t border-white/10 p-8 bg-[#0D0D0D]">
              <p className="text-white/60 text-lg leading-relaxed italic max-w-[64ch]">
                "I know something isn't right. The numbers don't match what I see.
                But I can't be there every moment."
              </p>
              <p className="font-mono text-[10px] text-white/30 mt-3 uppercase tracking-widest">— Carlos, Store Owner · Primary Persona</p>
            </div>
          </div>
          )}
        </div>
      </div>
    </section>
  );
}
