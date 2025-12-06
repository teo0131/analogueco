import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, Building2, FileText, Scale } from "lucide-react";
import { toast } from "sonner";

const ConfiguracionFiscal = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Datos del negocio
  const [nombreComercial, setNombreComercial] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [nit, setNit] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [ciudad, setCiudad] = useState("");

  // Datos fiscales
  const [regimenTributario, setRegimenTributario] = useState("Régimen Simplificado");
  const [numeroResolucionDian, setNumeroResolucionDian] = useState("");
  const [fechaResolucion, setFechaResolucion] = useState("");
  const [prefijoFactura, setPrefijoFactura] = useState("");
  const [rangoDesde, setRangoDesde] = useState("");
  const [rangoHasta, setRangoHasta] = useState("");
  const [consecutivoActual, setConsecutivoActual] = useState("1");

  // Textos legales
  const [leyendaLegal, setLeyendaLegal] = useState("Gracias por su compra");
  const [politicaCambios, setPoliticaCambios] = useState("Esta factura es válida como soporte de la transacción");

  // Logo
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("datos_fiscales")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data) {
          setNombreComercial(data.nombre_comercial || "");
          setRazonSocial(data.razon_social || "");
          setNit(data.nit || "");
          setDireccion(data.direccion || "");
          setTelefono(data.telefono || "");
          setEmail(data.email || "");
          setCiudad(data.ciudad || "");
          setRegimenTributario(data.regimen_tributario || "Régimen Simplificado");
          setNumeroResolucionDian(data.numero_resolucion_dian || "");
          setFechaResolucion(data.fecha_resolucion || "");
          setPrefijoFactura(data.prefijo_factura || "");
          setRangoDesde(data.rango_autorizado_desde?.toString() || "");
          setRangoHasta(data.rango_autorizado_hasta?.toString() || "");
          setConsecutivoActual(data.consecutivo_actual?.toString() || "1");
          setLeyendaLegal(data.leyenda_legal || "Gracias por su compra");
          setPoliticaCambios(data.politica_cambios || "Esta factura es válida como soporte de la transacción");
          setLogoUrl(data.logo_url || "");
        }
      } catch (error) {
        console.error("Error loading fiscal data:", error);
        toast.error("Error al cargar datos fiscales");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSave = async () => {
    if (!nombreComercial.trim()) {
      toast.error("El nombre comercial es requerido");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuario no autenticado");
        return;
      }

      const datosFiscales = {
        user_id: user.id,
        nombre_comercial: nombreComercial.trim(),
        razon_social: razonSocial.trim() || null,
        nit: nit.trim() || null,
        direccion: direccion.trim() || null,
        telefono: telefono.trim() || null,
        email: email.trim() || null,
        ciudad: ciudad.trim() || null,
        regimen_tributario: regimenTributario.trim() || null,
        numero_resolucion_dian: numeroResolucionDian.trim() || null,
        fecha_resolucion: fechaResolucion || null,
        prefijo_factura: prefijoFactura.trim() || null,
        rango_autorizado_desde: rangoDesde ? parseInt(rangoDesde) : null,
        rango_autorizado_hasta: rangoHasta ? parseInt(rangoHasta) : null,
        consecutivo_actual: consecutivoActual ? parseInt(consecutivoActual) : 1,
        leyenda_legal: leyendaLegal.trim() || null,
        politica_cambios: politicaCambios.trim() || null,
        logo_url: logoUrl.trim() || null,
      };

      const { error } = await supabase
        .from("datos_fiscales")
        .upsert(datosFiscales, { onConflict: "user_id" });

      if (error) throw error;

      toast.success("Datos fiscales guardados exitosamente");
    } catch (error) {
      console.error("Error saving fiscal data:", error);
      toast.error("Error al guardar datos fiscales");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configuración Fiscal</h1>
        <p className="text-muted-foreground">
          Configura los datos de tu negocio para las facturas físicas
        </p>
      </div>

      <div className="space-y-6">
        {/* Datos del Negocio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Datos del Negocio
            </CardTitle>
            <CardDescription>
              Información básica que aparecerá en el encabezado de tus facturas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombreComercial">Nombre Comercial *</Label>
                <Input
                  id="nombreComercial"
                  value={nombreComercial}
                  onChange={(e) => setNombreComercial(e.target.value)}
                  placeholder="Ej: Fraterno Café"
                />
              </div>
              <div>
                <Label htmlFor="razonSocial">Razón Social</Label>
                <Input
                  id="razonSocial"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  placeholder="Ej: Fraterno Café S.A.S."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nit">NIT</Label>
                <Input
                  id="nit"
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                  placeholder="Ej: 900.123.456-7"
                />
              </div>
              <div>
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  placeholder="Ej: Bogotá D.C."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Ej: Calle 123 # 45-67"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej: 601 123 4567"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: facturacion@miempresa.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="logoUrl">URL del Logo (opcional)</Label>
              <Input
                id="logoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://ejemplo.com/logo.png"
              />
              {logoUrl && (
                <div className="mt-2">
                  <img src={logoUrl} alt="Logo preview" className="h-16 object-contain" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Datos Fiscales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Información Tributaria
            </CardTitle>
            <CardDescription>
              Datos de resolución DIAN y configuración de numeración
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="regimenTributario">Régimen Tributario</Label>
              <Input
                id="regimenTributario"
                value={regimenTributario}
                onChange={(e) => setRegimenTributario(e.target.value)}
                placeholder="Ej: Régimen Simplificado"
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numeroResolucionDian">Número de Resolución DIAN</Label>
                <Input
                  id="numeroResolucionDian"
                  value={numeroResolucionDian}
                  onChange={(e) => setNumeroResolucionDian(e.target.value)}
                  placeholder="Ej: 18764000123456"
                />
              </div>
              <div>
                <Label htmlFor="fechaResolucion">Fecha de Resolución</Label>
                <Input
                  id="fechaResolucion"
                  type="date"
                  value={fechaResolucion}
                  onChange={(e) => setFechaResolucion(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="prefijoFactura">Prefijo</Label>
                <Input
                  id="prefijoFactura"
                  value={prefijoFactura}
                  onChange={(e) => setPrefijoFactura(e.target.value)}
                  placeholder="Ej: FACT"
                />
              </div>
              <div>
                <Label htmlFor="rangoDesde">Rango Desde</Label>
                <Input
                  id="rangoDesde"
                  type="number"
                  value={rangoDesde}
                  onChange={(e) => setRangoDesde(e.target.value)}
                  placeholder="Ej: 1"
                />
              </div>
              <div>
                <Label htmlFor="rangoHasta">Rango Hasta</Label>
                <Input
                  id="rangoHasta"
                  type="number"
                  value={rangoHasta}
                  onChange={(e) => setRangoHasta(e.target.value)}
                  placeholder="Ej: 10000"
                />
              </div>
            </div>

            <div className="max-w-xs">
              <Label htmlFor="consecutivoActual">Consecutivo Actual</Label>
              <Input
                id="consecutivoActual"
                type="number"
                value={consecutivoActual}
                onChange={(e) => setConsecutivoActual(e.target.value)}
                placeholder="1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Próximo número de factura a generar
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Textos Legales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Textos y Leyendas
            </CardTitle>
            <CardDescription>
              Mensajes que aparecerán en el pie de página de las facturas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="leyendaLegal">Leyenda/Mensaje Principal</Label>
              <Textarea
                id="leyendaLegal"
                value={leyendaLegal}
                onChange={(e) => setLeyendaLegal(e.target.value)}
                placeholder="Ej: Gracias por su compra en Fraterno Café"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="politicaCambios">Política de Cambios/Devoluciones</Label>
              <Textarea
                id="politicaCambios"
                value={politicaCambios}
                onChange={(e) => setPoliticaCambios(e.target.value)}
                placeholder="Ej: No se aceptan devoluciones de productos preparados"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botón Guardar */}
        <Button onClick={handleSave} disabled={saving} size="lg" className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Guardando..." : "Guardar Configuración"}
        </Button>
      </div>
    </div>
  );
};

export default ConfiguracionFiscal;
