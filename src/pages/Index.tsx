import BrandbookHero from "@/components/brandbook/BrandbookHero";
import BrandbookPersona from "@/components/brandbook/BrandbookPersona";
import BrandbookFeatures from "@/components/brandbook/BrandbookFeatures";
import BrandbookComparison from "@/components/brandbook/BrandbookComparison";
import BrandbookClosing from "@/components/brandbook/BrandbookClosing";
import BrandbookMarketing360 from "@/components/brandbook/BrandbookMarketing360";
import BrandbookNav from "@/components/brandbook/BrandbookNav";
import BrandbookPricing from "@/components/brandbook/BrandbookPricing";

const Index = () => {
  return (
    <div className="bg-background min-h-screen">
      <BrandbookNav />
      <div id="hero"><BrandbookHero /></div>
      <div id="pricing"><BrandbookPricing /></div>
      <div id="persona"><BrandbookPersona hideNumber /></div>
      <div id="features"><BrandbookFeatures hideNumber /></div>
      <div id="comparison"><BrandbookComparison hideNumber /></div>
      <div id="marketing360">
        <BrandbookMarketing360 showBlocks={["01", "15", "16", "20", "27"]} hideHeader hideNumbers />
      </div>
      <BrandbookClosing />
    </div>
  );
};

export default Index;
