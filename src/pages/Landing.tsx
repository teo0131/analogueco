import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Box, ArrowRight, ShoppingCart, Package, BarChart3 } from "lucide-react";
import heroImage from "@/assets/landing-hero.png";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        
        {/* Content */}
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            {/* Logo */}
            <div className="h-20 w-20 bg-primary rounded-2xl flex items-center justify-center mb-8 shadow-xl">
              <Box className="h-12 w-12 text-primary-foreground" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 tracking-tight">
              AnalogueCo
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Sistema POS y gestión de inventario todo en uno
            </p>

            <Button 
              size="lg" 
              onClick={() => navigate("/pos")}
              className="text-lg px-8 py-6 shadow-lg"
            >
              Comenzar a facturar
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-12">
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
      <footer className="py-8 text-center text-muted-foreground">
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
