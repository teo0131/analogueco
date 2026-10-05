type Variant = "live" | "rnd" | "vision";

const styles: Record<Variant, { bg: string; text: string; label: string }> = {
  live:   { bg: "bg-emerald-500/15 border-emerald-500/40", text: "text-emerald-400", label: "LIVE" },
  rnd:    { bg: "bg-amber-500/15 border-amber-500/40",   text: "text-amber-400",   label: "IN R&D" },
  vision: { bg: "bg-[#1E5EFF]/15 border-[#1E5EFF]/40",   text: "text-[#9DB7FF]",   label: "VISION" },
};

export default function StatusPill({ variant, label }: { variant: Variant; label?: string }) {
  const s = styles[variant];
  return (
    <span className={`inline-flex items-center gap-1.5 border ${s.bg} ${s.text} px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.25em]`}>
      <span className={`w-1.5 h-1.5 rounded-full ${variant === "live" ? "bg-emerald-400" : variant === "rnd" ? "bg-amber-400" : "bg-[#1E5EFF]"}`} />
      {label ?? s.label}
    </span>
  );
}