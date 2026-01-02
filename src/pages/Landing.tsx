import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Box, ArrowRight, ShoppingCart, Package, BarChart3 } from "lucide-react";
import coffeeHeroImage from "@/assets/coffee-woman-hero.jpg";
import { AIAssistant } from "@/components/AIAssistant";
import { Card, CardContent } from "@/components/ui/card";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Full Banner */}
      <div className="relative h-[50vh] min-h-[350px] overflow-hidden">
        {/* Background Image with Slow Zoom Animation */}
        <img 
          src={coffeeHeroImage}
          alt="Coffee hero background"
          width={1920}
          height={1080}
          loading="eager"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover animate-slow-zoom"
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Content */}
        <div className="relative h-full container mx-auto px-4 flex flex-col items-center justify-center text-center">
          {/* Logo */}
          <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-xl">
            <Box className="h-10 w-10 text-primary-foreground" />
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight drop-shadow-lg">
            AnalogueCo
          </h1>
          
          <p className="text-lg md:text-xl text-white/90 mb-6 max-w-2xl drop-shadow-md">
            Sistema POS y gestión de inventario todo en uno
          </p>

          <Button 
            size="lg" 
            onClick={() => navigate("/pos")}
            className="text-lg px-8 py-5 shadow-lg"
          >
            Comenzar a facturar
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* AI Assistant Section */}
      <div className="container mx-auto px-4 py-8">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-0">
            <AIAssistant />
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div className="bg-muted/50 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-10">
            Todo lo que necesitas para tu negocio
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <FeatureCard
              icon={ShoppingCart}
              title="Facturación POS"
              description="Sistema de punto de venta rápido y fácil de usar con calculadora de cambio"
            />
            <FeatureCard
              icon={Package}
              title="Gestión de Inventario"
              description="Control de stock, proveedores, recetas y movimientos tipo kardex"
            />
            <FeatureCard
              icon={BarChart3}
              title="Reportes y Análisis"
              description="Dashboard de ventas, historial diario y exportación a Excel"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-muted-foreground">
        <p>© {new Date().getFullYear()} AnalogueCo. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => (
  <div className="bg-card rounded-xl p-6 shadow-sm border border-border text-center">
    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm">{description}</p>
  </div>
);

export default Landing;
