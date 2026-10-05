import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

type Item = { id: string; label: string };
type Module = { id: string; label: string; items: Item[] };

const modules: Module[] = [
  {
    id: "negocio",
    label: "BUSINESS",
    items: [
      { id: "business", label: "BUSINESS" },
      { id: "features", label: "FEATURE SET" },
      { id: "comparison", label: "COMPETITIVE LANDSCAPE" },
      { id: "persona", label: "PRIMARY USER" },
    ],
  },
  {
    id: "branding",
    label: "BRANDING",
    items: [
      { id: "about", label: "ABOUT" },
      { id: "logo", label: "IDENTITY" },
      { id: "colors", label: "COLOR PALETTE" },
      { id: "typography", label: "TYPOGRAPHY" },
      { id: "mockups", label: "APPLICATIONS" },
      { id: "ui", label: "COMPONENTS" },
      { id: "applications-grid", label: "APPLICATION GALLERY" },
    ],
  },
  {
    id: "gtm",
    label: "GO TO MARKET",
    items: [
      { id: "marketing360", label: "360 MARKETING" },
    ],
  },
];

export default function BrandbookNav() {
  const [active, setActive] = useState("hero");
  const [scrolled, setScrolled] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const moduleMatch = location.pathname.match(/^\/modulo\/(.+)$/);
  const currentModuleId = moduleMatch ? moduleMatch[1] : null;

  useEffect(() => {
    setOpenId(location.state?.openModule ?? null);
  }, [location.pathname, location.state]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const goToSection = (moduleId: string, sectionId: string) => {
    setActive(sectionId);
    setOpenId(null);
    if (currentModuleId === moduleId) {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`/modulo/${moduleId}#${sectionId}`);
    }
  };

  // Scroll-spy: highlight the module containing the visible section
  useEffect(() => {
    const allIds = ["hero", ...modules.flatMap((m) => m.items.map((i) => i.id))];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    allIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [location.pathname]);

  const handleModuleClick = (m: Module) => {
    if (m.items.length === 0) return;
    const nextOpen = openId === m.id ? null : m.id;
    const first = m.items[0];
    if (currentModuleId !== m.id) {
      navigate(`/modulo/${m.id}#${first.id}`, { state: { openModule: nextOpen } });
    } else {
      goToSection(m.id, first.id);
    }
    setOpenId(nextOpen);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-200 ${
        scrolled || location.pathname !== "/"
          ? "bg-secondary/95 backdrop-blur-sm border-secondary-foreground/10"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex items-center justify-between h-14">
        <div />
        <div className="flex items-center gap-3 md:gap-4 w-full justify-end" ref={containerRef}>
          <button
            onClick={() => {
              setOpenId(null);
              if (location.pathname !== "/") navigate("/");
              else {
                const el = document.getElementById("hero");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }
              setActive("hero");
            }}
            className={`font-mono text-[9px] uppercase tracking-widest whitespace-nowrap transition-colors duration-100 ${
              location.pathname === "/" && active === "hero"
                ? "text-[#1E5EFF]"
                : "text-white/30 hover:text-white/70"
            }`}
          >
            HOME
          </button>
          {modules.map((m) => {
            const isActive =
              currentModuleId === m.id || m.items.some((i) => i.id === active);
            const isOpen = openId === m.id;
            const isEmpty = m.items.length === 0;
            return (
              <div key={m.id} className="relative">
                <button
                  onClick={() => handleModuleClick(m)}
                  disabled={isEmpty}
                  className={`font-mono text-[9px] uppercase tracking-widest whitespace-nowrap transition-colors duration-100 flex items-center gap-1 ${
                    isEmpty
                      ? "text-white/20 cursor-not-allowed"
                      : isActive || isOpen
                      ? "text-[#1E5EFF]"
                      : "text-white/30 hover:text-white/70"
                  }`}
                >
                  {m.label}
                  {isEmpty ? (
                    <span className="text-[7px] text-white/20">(EMPTY)</span>
                  ) : (
                    <span className="text-[8px]">▾</span>
                  )}
                </button>
                {isOpen && !isEmpty && (
                  <div className="absolute right-0 top-full mt-2 min-w-[200px] bg-[#0B0B0B]/95 backdrop-blur-sm border border-white/10 py-2">
                    {m.items.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => goToSection(m.id, b.id)}
                        className={`w-full text-left px-4 py-2 font-mono text-[9px] uppercase tracking-widest transition-colors ${
                          active === b.id ? "text-[#1E5EFF]" : "text-white/60 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <a
            href="https://analogueco.lovable.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[9px] uppercase tracking-widest whitespace-nowrap text-white/70 border border-white/20 px-3 py-1 hover:border-white/50 hover:text-white transition-colors"
          >
            EXPLORE PRODUCT ↗
          </a>
          <Link
            to="/presentacion"
            className="font-mono text-[9px] uppercase tracking-widest whitespace-nowrap text-[#1E5EFF] border border-[#1E5EFF]/40 px-3 py-1 hover:bg-[#1E5EFF]/10 transition-colors"
          >
            PITCH ↗
          </Link>
        </div>
      </div>
    </nav>
  );
}
