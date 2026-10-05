import { motion } from "framer-motion";

const snap = [0.19, 1, 0.22, 1];

const features = [
  {
    id: "01",
    title: "REAL-TIME MONITORING",
    desc: "Continuous video intelligence in every zone. Knows what is happening at the exact moment — from shelf activity to traffic patterns.",
    tags: ["Computer Vision", "Live Feed", "Zone Mapping"],
    metric: "< 200ms latency",
  },
  {
    id: "02",
    title: "BEHAVIOR TRACKING",
    desc: "Detects and classifies employee and customer behavior patterns without manual audits. Reveals anomalies before they turn into losses.",
    tags: ["ML Classification", "Anomaly Detection", "Pattern Analysis"],
    metric: "99.4% accuracy",
  },
  {
    id: "03",
    title: "INVENTORY: REALITY VS SYSTEM",
    desc: "Compares what the camera sees on the shelves against what your system says should be there. Eliminates ghost stock and untracked shrinkage.",
    tags: ["SKU Detection", "Reconciliation", "Discrepancy Alerts"],
    metric: "±0.3% tolerance",
  },
  {
    id: "04",
    title: "LOSS DETECTION",
    desc: "Flags unrecorded transactions, unauthorized merchandise movement, and behavioral indicators of internal or external theft.",
    tags: ["Transactional Correlation", "Theft Indicators", "Real-Time Alerts"],
    metric: "Avg. 3.1s detection",
  },
  {
    id: "05",
    title: "OPERATIONAL ANALYTICS",
    desc: "Time-series intelligence on your store's performance. Understand peak hours, underperforming zones, and staffing gaps.",
    tags: ["Time Series", "Heat Maps", "KPI Dashboard"],
    metric: "Daily + weekly reports",
  },
];

type Props = { part?: 0 | 1 | 2; compact?: boolean; hideNumber?: boolean };

export default function BrandbookFeatures({ part = 0, compact = false, hideNumber = false }: Props) {
  const py = compact ? "py-12" : "py-32";
  const mb = compact ? "mb-8" : "mb-16";
  const list = part === 1 ? features.slice(0, 3) : part === 2 ? features.slice(3) : features;
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
                  ? hideNumber ? "FEATURE SET (CONT.)" : "06 — FEATURE SET (CONT.)"
                  : hideNumber ? "FEATURE SET" : "06 — FEATURE SET"}
              </p>
              <h2 className="font-display text-5xl text-white">
                {part === 2 ? <>FEATURES<br />(CONT.)</> : <>FEATURE<br />SET</>}
              </h2>
            </motion.div>
          </div>
          <div className="col-span-8 flex items-end">
            <p className="text-white/50 text-base leading-relaxed max-w-[56ch]">
              Five modules. One platform. Designed to make the invisible visible —
              and convert physical reality into structured, actionable data.
            </p>
          </div>
        </div>

        <hr className="border-t border-white/10 mb-0" />

        <div className="border border-white/10 border-t-0">
          {list.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: snap }}
              viewport={{ once: true }}
              className="grid grid-cols-12 border-b border-white/10 last:border-b-0 group hover:bg-white/[0.02] transition-colors duration-150"
            >
              <div className="col-span-1 border-r border-white/10 p-8 flex items-start justify-center">
                <span className="font-mono text-primary text-2xl font-bold">{f.id}</span>
              </div>
              <div className="col-span-5 border-r border-white/10 p-8">
                <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest mb-3 group-hover:text-primary transition-colors duration-150">{f.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{f.desc}</p>
              </div>
              <div className="col-span-4 border-r border-white/10 p-8 flex items-center">
                <div className="flex flex-wrap gap-2">
                  {f.tags.map(tag => (
                    <span key={tag} className="border border-white/10 px-3 py-1 font-mono text-[10px] text-white/50 uppercase tracking-widest">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="col-span-2 p-8 flex items-center justify-end">
                <div className="text-right">
                  <div className="w-2 h-2 bg-primary mb-2 ml-auto animate-bbox-pulse" />
                  <span className="font-mono text-[10px] text-primary uppercase tracking-widest">{f.metric}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
