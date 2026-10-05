import { motion } from "framer-motion";

const snap = [0.19, 1, 0.22, 1] as const;

export default function PitchBusinessModel() {
  return (
    <section className="bg-background py-32 border-b border-border-subtle">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="grid grid-cols-12 mb-12">
          <div className="col-span-4">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
              PRICING STRUCTURE
            </p>
            <h3 className="font-display text-4xl text-foreground leading-tight">
              SETUP +<br />SUBSCRIPTION
            </h3>
          </div>
          <div className="col-span-8 flex items-end">
            <p className="text-muted-foreground text-base leading-relaxed max-w-[56ch]">
              Clients pay for what was previously only possible through physical presence: real-time control. A unique hardware + AI setup and a monthly fee that scales with the business.
            </p>
          </div>
        </div>

        <hr className="border-t-2 border-foreground mb-12" />

        <div className="grid grid-cols-2 gap-0 border border-border-subtle">
          {[
            {
              tag: "ONE-TIME PAYMENT",
              name: "SETUP",
              price: "$3,220,000",
              unit: "COP",
              desc: "Hardware, installation, calibration, and on-site system training.",
              items: ["Cameras + edge device", "POS integration", "Zone calibration"],
            },
            {
              tag: "RECURRING",
              name: "MONTHLY SaaS",
              price: "$510,000",
              unit: "COP / MONTH",
              desc: "Software, AI models, alerts, dashboard, and continuous support.",
              items: ["24/7 operational intelligence", "Real-time alerts", "Reports and support"],
            },
          ].map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: snap }}
              viewport={{ once: true }}
              className={`p-10 ${i === 0 ? "border-r border-border-subtle" : "bg-secondary text-white"}`}
            >
              <p
                className={`font-mono text-[10px] uppercase tracking-widest mb-6 ${
                  i === 0 ? "text-primary" : "text-[#9DB7FF]"
                }`}
              >
                {p.tag}
              </p>
              <p className={`font-display text-2xl mb-8 ${i === 0 ? "text-foreground" : "text-white"}`}>
                {p.name}
              </p>
              <div className="flex items-baseline gap-2 mb-6">
                <span className={`font-display text-5xl ${i === 0 ? "text-foreground" : "text-white"}`}>
                  {p.price}
                </span>
                <span
                  className={`font-mono text-xs uppercase tracking-widest ${
                    i === 0 ? "text-muted-foreground" : "text-white/50"
                  }`}
                >
                  {p.unit}
                </span>
              </div>
              <p
                className={`text-sm leading-relaxed mb-6 max-w-[44ch] ${
                  i === 0 ? "text-foreground/70" : "text-white/70"
                }`}
              >
                {p.desc}
              </p>
              <ul className="space-y-2">
                {p.items.map((it) => (
                  <li
                    key={it}
                    className={`flex gap-2.5 text-xs ${
                      i === 0 ? "text-foreground/70" : "text-white/70"
                    }`}
                  >
                    <span className={i === 0 ? "text-primary" : "text-[#1E5EFF]"}>→</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
