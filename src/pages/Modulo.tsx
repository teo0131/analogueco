import { useEffect } from "react";
import { useParams, Navigate, useLocation } from "react-router-dom";
import BrandbookNav from "@/components/brandbook/BrandbookNav";
import BrandbookAbout from "@/components/brandbook/BrandbookAbout";
import BrandbookLogoSection from "@/components/brandbook/BrandbookLogoSection";
import BrandbookColors from "@/components/brandbook/BrandbookColors";
import BrandbookTypography from "@/components/brandbook/BrandbookTypography";
import BrandbookMockups from "@/components/brandbook/BrandbookMockups";
import BrandbookPersona from "@/components/brandbook/BrandbookPersona";
import BrandbookFeatures from "@/components/brandbook/BrandbookFeatures";
import BrandbookComparison from "@/components/brandbook/BrandbookComparison";
import BrandbookUIComponents from "@/components/brandbook/BrandbookUIComponents";
import BrandbookApplicationsGrid from "@/components/brandbook/BrandbookApplicationsGrid";
import BrandbookBusinessPresentation from "@/components/brandbook/BrandbookBusinessPresentation";
import BrandbookMarketing360 from "@/components/brandbook/BrandbookMarketing360";
import BrandbookClosing from "@/components/brandbook/BrandbookClosing";

const modules: Record<string, () => JSX.Element> = {
  negocio: () => (
    <>
      <div id="business"><BrandbookBusinessPresentation /></div>
      <div id="features"><BrandbookFeatures /></div>
      <div id="comparison"><BrandbookComparison /></div>
      <div id="persona"><BrandbookPersona /></div>
    </>
  ),
  branding: () => (
    <>
      <div id="about"><BrandbookAbout /></div>
      <div id="logo"><BrandbookLogoSection /></div>
      <div id="colors"><BrandbookColors /></div>
      <div id="typography"><BrandbookTypography /></div>
      <div id="mockups"><BrandbookMockups /></div>
      <div id="ui"><BrandbookUIComponents /></div>
      <div id="applications-grid"><BrandbookApplicationsGrid /></div>
    </>
  ),
  gtm: () => (
    <div id="marketing360"><BrandbookMarketing360 /></div>
  ),
};

const Modulo = () => {
  const { id } = useParams();
  const location = useLocation();
  const Render = id ? modules[id] : undefined;

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 50);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  if (!Render) return <Navigate to="/" replace />;

  return (
    <div className="bg-background min-h-screen">
      <BrandbookNav />
      <div className="pt-14">
        <Render />
      </div>
      <BrandbookClosing />
    </div>
  );
};

export default Modulo;