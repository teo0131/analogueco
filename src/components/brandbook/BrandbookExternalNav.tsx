import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";

const sections = [
  { id: "cover", label: "HOME" },
  { id: "ch-problema", label: "01 PROBLEM" },
  { id: "ch-solucion", label: "02 SOLUTION" },
  { id: "ch-impacto", label: "03 IMPACT" },
  { id: "ch-modelo", label: "04 MODEL" },
  { id: "ch-equipo", label: "05 TEAM" },
  { id: "ch-mentalidad", label: "06 MINDSET" },
  { id: "cierre", label: "CLOSING" },
];

export default function BrandbookExternalNav() {
  const [active, setActive] = useState("cover");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    window.dispatchEvent(new CustomEvent("deck:goto", { detail: id }));
    setActive(id);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-200 ${
        scrolled
          ? "bg-[#0B0B0B]/95 backdrop-blur-sm border-white/10"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-8 flex items-center justify-between h-14 gap-6">
        <Link
          to="/"
          className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
        >
          <Logo variant="mark" className="h-6 w-auto" />
          <span className="font-mono text-[9px] uppercase tracking-widest">← BRANDBOOK</span>
        </Link>
        <div className="flex items-center gap-6 overflow-x-auto">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`font-mono text-[9px] uppercase tracking-widest whitespace-nowrap transition-colors duration-100 ${
                active === s.id ? "text-[#1E5EFF]" : "text-white/30 hover:text-white/70"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}