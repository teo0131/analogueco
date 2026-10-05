import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";

const snap = [0.19, 1, 0.22, 1] as const;

const plans = [
  {
    id: "starter",
    name: "Starter",
    desc: "MVP to start seeing the invisible.",
    price: "$ 510.000",
    unit: "COP / MONTH",
    features: ["1 camera", "Real-time alerts", "Basic monitoring"],
    highlight: false,
  },
  {
    id: "growth",
    name: "Growth",
    desc: "For operations already generating serious revenue.",
    price: "$ 990.000",
    unit: "COP / MONTH",
    features: [
      "Up to 3 cameras",
      "Real-time alerts",
      "Dashboard & insights",
      "POS integration",
    ],
    highlight: true,
  },
  {
    id: "scale",
    name: "Scale",
    desc: "Multi-location, automation, and advanced analytics.",
    price: "$ 1.890.000",
    unit: "COP / MONTH",
    features: [
      "Up to 8 cameras",
      "Advanced analytics",
      "Automations",
      "Multi-location support",
    ],
    highlight: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    desc: "Infrastructure tailored to your operation.",
    price: "Custom",
    unit: "PRICING",
    features: [
      "Unlimited cameras",
      "Full integrations",
      "Dedicated support",
      "Custom AI models",
    ],
    highlight: false,
  },
];

export default function BrandbookPricing() {
  return (
    <section className="bg-white py-32 border-b border-black/10">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="text-center mb-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-black/50 mb-6">
            — — PLANS
          </p>
          <h2 className="font-display text-5xl md:text-6xl text-black leading-tight">
            Choose your level of operational intelligence.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: snap }}
              viewport={{ once: true }}
              className={`relative rounded-2xl border bg-white p-8 flex flex-col ${
                p.highlight
                  ? "border-[#1E5EFF] shadow-[0_8px_40px_-12px_rgba(30,94,255,0.35)]"
                  : "border-black/10"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1E5EFF] text-white font-mono text-[10px] uppercase tracking-widest px-4 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-display text-2xl text-black">{p.name}</h3>
                {p.highlight && <Sparkles className="w-5 h-5 text-[#1E5EFF]" />}
              </div>
              <p className="text-black/60 text-sm leading-relaxed mb-8 min-h-[3rem]">
                {p.desc}
              </p>
              <div className="mb-8">
                <p className="font-display text-4xl text-black">{p.price}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-black/40 mt-1">
                  {p.unit}
                </p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-black/80">
                    <Check className="w-4 h-4 text-[#1E5EFF] mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={
                  p.id === "enterprise"
                    ? "/auth?mode=signup&plan=enterprise"
                    : `/auth?mode=signup&plan=${p.id}`
                }
                className={`block text-center font-mono text-xs uppercase tracking-widest py-3 rounded-md transition-colors ${
                  p.highlight
                    ? "bg-[#1E5EFF] text-white hover:bg-[#0D46CC]"
                    : "border border-black/15 text-black hover:bg-black hover:text-white"
                }`}
              >
                {p.id === "enterprise" ? "Contact sales" : "Get started now"}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}