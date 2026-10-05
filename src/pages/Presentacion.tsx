import { useLayoutEffect, useRef, useState } from "react";
import BrandbookAbout from "@/components/brandbook/BrandbookAbout";
import BrandbookPersona from "@/components/brandbook/BrandbookPersona";
import BrandbookComparison from "@/components/brandbook/BrandbookComparison";
import BrandbookClosing from "@/components/brandbook/BrandbookClosing";
import PitchCover from "@/components/brandbook/PitchCover";
import PitchChapter from "@/components/brandbook/PitchChapter";
import PitchMacroContext from "@/components/brandbook/PitchMacroContext";
import PitchPainPoints from "@/components/brandbook/PitchPainPoints";
import PitchMarketOpportunity from "@/components/brandbook/PitchMarketOpportunity";
import PitchWhatWeAre from "@/components/brandbook/PitchWhatWeAre";
import PitchMVPStatus from "@/components/brandbook/PitchMVPStatus";
import PitchScreenShowcase from "@/components/brandbook/PitchScreenShowcase";
import PitchRoadmap from "@/components/brandbook/PitchRoadmap";
import PitchValidation from "@/components/brandbook/PitchValidation";
import PitchMarketAnalysis from "@/components/brandbook/PitchMarketAnalysis";
import PitchBusinessModel from "@/components/brandbook/PitchBusinessModel";
import PitchGTM from "@/components/brandbook/PitchGTM";
import PitchProjection from "@/components/brandbook/PitchProjection";
import PitchFounderFit from "@/components/brandbook/PitchFounderFit";
import SlideDeck from "@/components/brandbook/SlideDeck";

/**
 * Pitch AnalogueCo v2 — estructura enterprise honesta.
 * Diferencia LIVE / IN R&D / VISION. Construido desde operación real.
 */

const slideIds = [
  "cover",
  "macro",
  "ch-problema",
  "persona-1",
  "persona-2",
  "pain",
  "ch-oportunidad",
  "market-opportunity",
  "what-we-are",
  "ch-como-funciona",
  "about-1",
  "mvp-status",
  "screens-intro",
  "screen-home",
  "screen-pos",
  "screen-mesas",
  "screen-finanzas",
  "screen-cameras",
  "ch-diferenciador",
  "comparison-1",
  "comparison-2",
  "roadmap",
  "validation",
  "market-analysis",
  "ch-modelo",
  "business-model",
  "gtm",
  "projection",
  "founder-fit",
  "cierre",
];

/**
 * Fit-to-viewport slide. Mide el contenido y aplica `transform: scale`
 * para que SIEMPRE quepa en pantalla sin scroll interno.
 */
const Slide = ({ children }: { children: React.ReactNode }) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const measure = () => {
      if (!outerRef.current || !innerRef.current) return;
      const cw = outerRef.current.clientWidth;
      const ch = outerRef.current.clientHeight;
      const iw = innerRef.current.scrollWidth;
      const ih = innerRef.current.scrollHeight;
      if (!iw || !ih) return;
      setScale(Math.min(cw / iw, ch / ih, 1));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (outerRef.current) ro.observe(outerRef.current);
    if (innerRef.current) ro.observe(innerRef.current);
    window.addEventListener("resize", measure);
    const t = setTimeout(measure, 120);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      clearTimeout(t);
    };
  }, []);

  return (
    <div
      ref={outerRef}
      className="h-screen w-full overflow-hidden bg-background flex items-center justify-center"
    >
      <div
        ref={innerRef}
        style={{
          width: "100vw",
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Presentacion = () => {
  return (
    <div className="bg-background">
      <SlideDeck slideIds={slideIds}>
        <Slide><PitchCover /></Slide>

        {/* 00 · CONTEXTO MACRO */}
        <Slide><PitchMacroContext /></Slide>

        {/* 01 · PROBLEMA */}
        <Slide>
          <PitchChapter
            id="01"
            label="PROBLEM"
            title={"THE INVISIBLE\nPAIN OF\nPHYSICAL RETAIL"}
            description="Physical retail owners operate blindly: they depend on being present to have control. When they are away, they don't know what is happening."
            quote="I know something isn't right, but I can't be in two places at once."
          />
        </Slide>
        <Slide><BrandbookPersona part={1} compact hideNumber /></Slide>
        <Slide><BrandbookPersona part={2} compact hideNumber /></Slide>
        <Slide><PitchPainPoints /></Slide>

        {/* 02 · OPORTUNIDAD */}
        <Slide>
          <PitchChapter
            id="02"
            label="OPPORTUNITY"
            title={"PHYSICAL RETAIL\nIS NOT DYING.\nIT IS UNDERSERVED."}
            description="Retail trade grew 12.7% in March 2025 according to DANE. There are hundreds of thousands of SMEs operating with fragmented tools — and no one is building their unified operational system."
            quote="AI stayed in the digital realm. The physical world is still waiting."
          />
        </Slide>
        <Slide><PitchMarketOpportunity /></Slide>

        {/* 03 · QUÉ ES + CÓMO FUNCIONA */}
        <Slide><PitchWhatWeAre /></Slide>
        <Slide>
          <PitchChapter
            id="03"
            label="HOW IT WORKS"
            title={"ONE PLATFORM.\nLAYERS OF\nINTELLIGENCE."}
            description="An ERP/POS base already operating in production, upon which we are building a physical perception layer with vision, audio, and sensors."
            quote="Data where it happens."
          />
        </Slide>
        <Slide><BrandbookAbout part={1} compact hideNumber /></Slide>

        {/* 04 · PMV ESTADO REAL */}
        <Slide><PitchMVPStatus /></Slide>

        {/* 04b · PRODUCTO · PANTALLAS REALES */}
        <Slide>
          <PitchChapter
            id="04b"
            label="PRODUCT"
            title={"WHAT IS ALREADY\nBUILT,\nON SCREEN."}
            description="These are the actual production screens of AnalogueCo, operating today at Fraterno Café. Each slide shows a module of the system."
            quote="This already exists and is being built."
          />
        </Slide>
        <Slide><PitchScreenShowcase screen="home" index={1} total={5} /></Slide>
        <Slide><PitchScreenShowcase screen="pos" index={2} total={5} /></Slide>
        <Slide><PitchScreenShowcase screen="mesas" index={3} total={5} /></Slide>
        <Slide><PitchScreenShowcase screen="finanzas" index={4} total={5} /></Slide>
        <Slide><PitchScreenShowcase screen="cameras" index={5} total={5} /></Slide>

        {/* 05 · DIFERENCIADOR */}
        <Slide>
          <PitchChapter
            id="04"
            label="DIFFERENTIATOR"
            title={"WE ARE NOT POS.\nWE ARE NOT CCTV.\nWE ARE NOT ERP."}
            description="We connect physical operation + transactional data in a single system. Where the POS ends and the CCTV just watches, AnalogueCo understands."
            quote="Where others record, we interpret."
          />
        </Slide>
        <Slide><BrandbookComparison part={1} compact hideNumber /></Slide>
        <Slide><BrandbookComparison part={2} compact hideNumber /></Slide>

        {/* 06 · ROADMAP */}
        <Slide><PitchRoadmap /></Slide>

        {/* 07 · VALIDACIÓN */}
        <Slide><PitchValidation /></Slide>

        {/* 08 · MERCADO */}
        <Slide><PitchMarketAnalysis /></Slide>

        {/* 09 · MODELO DE NEGOCIO */}
        <Slide>
          <PitchChapter
            id="05"
            label="BUSINESS MODEL"
            title={"SOFTWARE +\nINSTRUMENTATION\nSETUP"}
            description="Monthly operational software subscription. One-time setup when perception hardware is introduced. The client pays for continuous systemic control."
            quote="We charge for the infrastructure, not for the event."
          />
        </Slide>
        <Slide><PitchBusinessModel /></Slide>

        {/* 10 · GTM y PROYECCIÓN */}
        <Slide><PitchGTM /></Slide>
        <Slide><PitchProjection /></Slide>

        {/* 11 · FOUNDER FIT */}
        <Slide><PitchFounderFit /></Slide>

        {/* CIERRE */}
        <Slide><BrandbookClosing /></Slide>
      </SlideDeck>
    </div>
  );
};

export default Presentacion;
