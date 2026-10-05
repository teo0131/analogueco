import { ReactNode } from "react";

type Variant = "dark" | "light";

type Props = {
  src: string;
  alt: string;
  caption?: string;
  label?: string;
  variant?: Variant;
  aspect?: string;
  objectPosition?: string;
  children?: ReactNode;
  className?: string;
};

/**
 * Marco enterprise para mockups de producto AnalogueCo.
 * Mantiene continuidad visual (corner brackets + label) entre slides.
 */
export default function MockupFrame({
  src,
  alt,
  caption,
  label,
  variant = "light",
  aspect = "aspect-[16/10]",
  objectPosition = "object-top",
  children,
  className = "",
}: Props) {
  const isDark = variant === "dark";
  const borderColor = isDark ? "border-white/15" : "border-foreground/15";
  const bracketColor = isDark ? "border-[#1E5EFF]" : "border-primary";
  const labelText = isDark ? "text-white" : "text-white";
  const captionColor = isDark ? "text-white/50" : "text-muted-foreground";
  return (
    <figure className={`relative ${className}`}>
      <div className={`relative border ${borderColor} ${aspect} overflow-hidden bg-white shadow-[0_20px_60px_-30px_rgba(10,21,64,0.35)]`}>
        <img src={src} alt={alt} className={`absolute inset-0 w-full h-full object-cover ${objectPosition}`} />
        {/* corner brackets */}
        <div className={`absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 ${bracketColor}`} />
        <div className={`absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 ${bracketColor}`} />
        <div className={`absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 ${bracketColor}`} />
        <div className={`absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 ${bracketColor}`} />
        {label && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#1E5EFF] px-3 py-1">
            <span className={`font-mono text-[9px] uppercase tracking-[0.3em] ${labelText}`}>{label}</span>
          </div>
        )}
        {children}
      </div>
      {caption && (
        <figcaption className={`font-mono text-[10px] uppercase tracking-[0.25em] ${captionColor} mt-3`}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}