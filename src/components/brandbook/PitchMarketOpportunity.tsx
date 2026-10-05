import { motion } from "framer-motion";
import SourceCite from "./SourceCite";

const snap = [0.19, 1, 0.22, 1] as const;

const cards = [
  {
    metric: "+12,7%",
    title: "Retail trade Colombia",
    desc: "Real growth in March 2025 vs. previous year. Physical retail is not shutting down — it is re-organizing.",
    source: { label: "DANE · EMC Mar 2025", href: "https://www.dane.gov.co/files/operaciones/EMC/bol-EMC-mar2025.pdf" },
  },
  {
    metric: "~159.000",
    title: "Registered companies in Medellín",
    desc: "97.1% are micro and small enterprises. Our natural entry market — concentrated, accessible, and underserved.",
    source: { label: "Medellín Chamber of Commerce", href: "https://telemedellin.tv/camara-de-comercio-medellin-informe-gestion/710387/" },
  },
  {
    metric: "Pressure",
    title: "On small businesses",
    desc: "Shrinking margins, operational difficulties, and a growing need for efficiency and systemic control.",
    source: { label: "Fenalco · Neighborhood stores", href: "https://www.fenalco.com.co/blog/noticias-10/la-crisis-de-las-tiendas-de-barrio-se-agrava-significativamente-en-colombia-fenalco-7862" },
  },
];

export default function PitchMarketOpportunity() {
  return (
    <section className="bg-secondary py-24 border-b border-white/10">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="grid grid-cols-12 mb-12">
          <div className="col-span-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#9DB7FF] mb-3">
              MARKET OPPORTUNITY
            </p>
            <h2 className="font-display text-5xl text-white leading-[0.95]">
              PHYSICAL RETAIL<br />IS ALIVE —<br />AND POORLY DIGITALIZED.
            </h2>
          </div>
          <div className="col-span-7 flex items-end">
            <p className="text-white/50 text-base leading-relaxed max-w-[60ch]">
              Digitalization for SME retail is incomplete. Checkout and inventory
              software exist, but unified operational infrastructure does not.
            </p>
          </div>
        </div>

        <hr className="border-t border-white/20 mb-10" />

        <div className="grid grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: snap }}
              viewport={{ once: true }}
              className="border border-white/10 bg-white/[0.02] p-8 flex flex-col min-h-[320px]"
            >
              <p className="font-display text-[#1E5EFF] text-6xl leading-none mb-6">{c.metric}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/60 mb-3">
                {c.title}
              </p>
              <p className="text-white/70 text-sm leading-relaxed mb-6">{c.desc}</p>
              <div className="mt-auto pt-4 border-t border-white/10">
                <SourceCite href={c.source.href} label={c.source.label} />
              </div>
            </motion.div>
          ))}
        </div>

        <p className="mt-10 font-display text-white/80 text-2xl max-w-[60ch] leading-snug border-l-2 border-[#1E5EFF] pl-5">
          AI and automation focused on the digital realm.
          Physical operational oversight remains an open opportunity.
        </p>
      </div>
    </section>
  );
}