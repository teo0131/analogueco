import { Children, ReactNode, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize, Minimize } from "lucide-react";

type Props = {
  slideIds: string[];
  children: ReactNode;
};

const ease = [0.19, 1, 0.22, 1] as const;

export default function SlideDeck({ slideIds, children }: Props) {
  const slides = Children.toArray(children);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [presenter, setPresenter] = useState(false);

  // Synchronous: must be invoked directly from a user gesture so the browser
  // accepts requestFullscreen().
  const togglePresenter = useCallback(() => {
    const goingIn = !document.fullscreenElement;
    if (goingIn) {
      const el = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
      };
      const req = el.requestFullscreen?.bind(el) || el.webkitRequestFullscreen?.bind(el);
      req?.()?.catch(() => {});
      setPresenter(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setPresenter(false);
    }
  }, []);

  useEffect(() => {
    const onChange = () => setPresenter(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const isPresenter = presenter;

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(slides.length - 1, next));
      setDirection(clamped > index ? 1 : -1);
      setIndex(clamped);
      if (slideIds[clamped]) {
        window.history.replaceState(null, "", `#${slideIds[clamped]}`);
      }
    },
    [index, slides.length, slideIds]
  );

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        go(index + 1);
      } else if (["ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === "Home") {
        go(0);
      } else if (e.key === "End") {
        go(slides.length - 1);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        togglePresenter();
      } else if (e.key === "Escape" && presenter) {
        setPresenter(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, slides.length, togglePresenter, presenter]);

  // External navigation via custom event (used by top nav)
  useEffect(() => {
    const onGoto = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      const i = slideIds.indexOf(id);
      if (i >= 0) go(i);
    };
    window.addEventListener("deck:goto", onGoto as EventListener);
    return () => window.removeEventListener("deck:goto", onGoto as EventListener);
  }, [go, slideIds]);

  // Initial hash sync
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const i = slideIds.indexOf(hash);
    if (i > 0) setIndex(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wheel / trackpad swipe
  useEffect(() => {
    let locked = false;
    const onWheel = (e: WheelEvent) => {
      // Allow internal scroll if the slide content is taller than viewport
      const target = e.target as HTMLElement | null;
      const scrollable = target?.closest("[data-slide-scroll]") as HTMLElement | null;
      if (scrollable) {
        const { scrollTop, scrollHeight, clientHeight } = scrollable;
        const goingDown = e.deltaY > 0;
        const atTop = scrollTop <= 0;
        const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
        if ((goingDown && !atBottom) || (!goingDown && !atTop)) return;
      }
      if (locked) return;
      if (Math.abs(e.deltaY) < 30) return;
      locked = true;
      go(index + (e.deltaY > 0 ? 1 : -1));
      setTimeout(() => (locked = false), 700);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [go, index]);

  return (
    <div className={`fixed inset-0 bg-background overflow-hidden ${isPresenter ? "z-[2147483646]" : ""}`}>
      {isPresenter && (
        <style>{`nav.fixed{display:none!important}body{overflow:hidden!important}`}</style>
      )}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={index}
          custom={direction}
          initial={{ opacity: 0, x: direction * 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -60 }}
          transition={{ duration: 0.55, ease }}
          className="absolute inset-0 overflow-y-auto"
          data-slide-scroll
        >
          {slides[index]}
        </motion.div>
      </AnimatePresence>

      {/* Progress dots — siempre visibles, navegación secuencial */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] max-w-[min(90vw,720px)] overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/70 backdrop-blur-md border border-white/20 shadow-lg">
          {slides.map((_, i) => (
            <div
              key={i}
              aria-label={`Slide ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-6 bg-[#1E5EFF]" : "w-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Counter */}
      <div className="fixed bottom-6 right-8 z-50 font-mono text-[10px] uppercase tracking-[0.3em] text-white px-2 py-1 rounded bg-black/60 backdrop-blur-sm">
        {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
      </div>

      {/* Prev / Next */}
      <button
        onClick={() => go(index - 1)}
        disabled={index === 0}
        aria-label="Previous"
        className="fixed left-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12 flex items-center justify-center rounded-full border border-white/30 text-white bg-black/60 hover:bg-black/80 hover:border-white/60 transition disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm shadow-lg"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => go(index + 1)}
        disabled={index === slides.length - 1}
        aria-label="Next"
        className="fixed right-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12 flex items-center justify-center rounded-full border border-white/30 text-white bg-black/60 hover:bg-black/80 hover:border-white/60 transition disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm shadow-lg"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Fullscreen toggle */}
      <button
        onClick={togglePresenter}
        aria-label={isPresenter ? "Exit presentation" : "Presentation mode"}
        title={isPresenter ? "Exit (Esc)" : "Present (F)"}
        className="fixed top-4 right-4 z-50 h-10 w-10 flex items-center justify-center rounded-full border border-white/30 text-white bg-black/60 hover:bg-black/80 hover:border-white/60 transition backdrop-blur-sm shadow-lg"
      >
        {isPresenter ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
      </button>
    </div>
  );
}