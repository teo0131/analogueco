export default function SourceCite({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/40 hover:text-white/80 underline-offset-4 hover:underline transition-colors"
    >
      SOURCE: {label} ↗
    </a>
  );
}