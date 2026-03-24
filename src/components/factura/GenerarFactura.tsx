import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, FileDown, X } from "lucide-react";
import { toast } from "sonner";
import {
  FacturaFisicaTemplate,
  DatosFiscales,
  DatosFactura,
  DetalleFactura,
} from "./FacturaFisicaTemplate";
import html2pdf from "html2pdf.js";

interface OrderItem {
  name: string;
  price: number;
}

interface CompletedOrder {
  id: string;
  orderNumber: number;
  items: OrderItem[];
  total: number;
  comment?: string;
  timestamp: Date;
}

interface GenerarFacturaProps {
  orden: CompletedOrder;
  open: boolean;
  onClose: () => void;
}

export const GenerarFactura = ({ orden, open, onClose }: GenerarFacturaProps) => {
  const facturaRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [formato, setFormato] = useState<"termica" | "carta">("carta");

  // Datos fiscales del negocio
  const [datosFiscales, setDatosFiscales] = useState<DatosFiscales>({
    nombreComercial: "Mi Negocio",
    regimenTributario: "Régimen Simplificado",
    leyendaLegal: "Gracias por su compra",
    politicaCambios: "Esta factura es válida como soporte de la transacción",
  });

  // Datos editables de la factura
  const [clienteNombre, setClienteNombre] = useState("Consumidor Final");
  const [clienteDocumento, setClienteDocumento] = useState("");
  const [clienteDireccion, setClienteDireccion] = useState("");
  const [medioPago, setMedioPago] = useState("Efectivo");
  const [vendedor, setVendedor] = useState("");
  const [mesa, setMesa] = useState("");
  const [numeroFactura, setNumeroFactura] = useState("");

  useEffect(() => {
    const loadDatosFiscales = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("datos_fiscales")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data) {
          setDatosFiscales({
            logoUrl: data.logo_url || undefined,
            nombreComercial: data.nombre_comercial,
            razonSocial: data.razon_social || undefined,
            nit: data.nit || undefined,
            direccion: data.direccion || undefined,
            telefono: data.telefono || undefined,
            email: data.email || undefined,
            ciudad: data.ciudad || undefined,
            regimenTributario: data.regimen_tributario || undefined,
            numeroResolucionDian: data.numero_resolucion_dian || undefined,
            fechaResolucion: data.fecha_resolucion || undefined,
            prefijoFactura: data.prefijo_factura || undefined,
            rangoDesde: data.rango_autorizado_desde || undefined,
            rangoHasta: data.rango_autorizado_hasta || undefined,
            leyendaLegal: data.leyenda_legal || undefined,
            politicaCambios: data.politica_cambios || undefined,
          });

          // Generar número de factura
          const consecutivo = (data.consecutivo_actual || 1);
          const prefijo = data.prefijo_factura || "";
          setNumeroFactura(`${prefijo}${String(consecutivo).padStart(6, "0")}`);
        } else {
          setNumeroFactura(`${String(orden.orderNumber).padStart(6, "0")}`);
        }
      } catch (error) {
        console.error("Error loading fiscal data:", error);
        setNumeroFactura(`${String(orden.orderNumber).padStart(6, "0")}`);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      loadDatosFiscales();
    }
  }, [open, orden.orderNumber]);

  const detalles: DetalleFactura[] = [...orden.items]
    .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
    .map((item) => ({
      descripcion: item.name,
      cantidad: 1,
      unidad: "unidad",
      precioUnitario: item.price,
      descuento: 0,
      iva: 0,
      total: item.price,
    }));

  const datosFactura: DatosFactura = {
    numeroFactura,
    fechaExpedicion: orden.timestamp,
    medioPago,
    vendedor: vendedor || undefined,
    mesa: mesa || undefined,
    cliente: {
      nombre: clienteNombre,
      documento: clienteDocumento || "N/A",
      direccion: clienteDireccion,
    },
    detalles,
    subtotal: orden.total,
    descuento: 0,
    baseGravable: orden.total,
    ivaTotal: 0,
    otrosImpuestos: 0,
    total: orden.total,
  };

  const handleGuardarFactura = async () => {
    setGuardando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuario no autenticado");
        return;
      }

      // Guardar factura
      const { data: facturaData, error: facturaError } = await supabase
        .from("facturas_fisicas")
        .insert({
          user_id: user.id,
          numero_factura: numeroFactura,
          orden_id: orden.id,
          fecha_expedicion: orden.timestamp.toISOString(),
          cliente_nombre: clienteNombre,
          cliente_documento: clienteDocumento || null,
          cliente_direccion: clienteDireccion || null,
          medio_pago: medioPago,
          vendedor: vendedor || null,
          mesa: mesa || null,
          subtotal: orden.total,
          descuento: 0,
          base_gravable: orden.total,
          iva_total: 0,
          otros_impuestos: 0,
          total: orden.total,
        })
        .select()
        .single();

      if (facturaError) throw facturaError;

      // Guardar detalles
      const detallesDB = detalles.map((d) => ({
        factura_id: facturaData.id,
        descripcion: d.descripcion,
        cantidad: d.cantidad,
        unidad: d.unidad,
        precio_unitario: d.precioUnitario,
        descuento: d.descuento,
        iva: d.iva,
        total: d.total,
      }));

      const { error: detallesError } = await supabase
        .from("detalle_facturas_fisicas")
        .insert(detallesDB);

      if (detallesError) throw detallesError;

      // Actualizar consecutivo
      await supabase
        .from("datos_fiscales")
        .update({ consecutivo_actual: (parseInt(numeroFactura.replace(/\D/g, "")) || 0) + 1 })
        .eq("user_id", user.id);

      toast.success("Factura guardada exitosamente");
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Error al guardar la factura");
    } finally {
      setGuardando(false);
    }
  };

  const handlePrint = () => {
    if (!facturaRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("No se pudo abrir ventana de impresión");
      return;
    }

    const content = facturaRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Factura ${numeroFactura}</title>
          <style>
            body { 
              margin: 0; 
              padding: ${formato === "termica" ? "0" : "20px"}; 
              font-family: 'Courier New', monospace;
            }
            @media print {
              @page {
                size: ${formato === "termica" ? "80mm auto" : "letter"};
                margin: ${formato === "termica" ? "2mm" : "10mm"};
              }
            }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSavePDF = async () => {
    if (!facturaRef.current) return;

    try {
      const options = {
        margin: formato === "termica" ? 2 : 10,
        filename: `Factura_${numeroFactura}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: {
          unit: "mm",
          format: formato === "termica" ? [80, 297] : "letter",
          orientation: "portrait" as const,
        },
      };

      await html2pdf().set(options).from(facturaRef.current).save();
      toast.success("PDF guardado exitosamente");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error al generar PDF");
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Generar Factura - Orden #{orden.orderNumber}</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de edición */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Datos de la Factura</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Número de Factura</Label>
                <Input
                  value={numeroFactura}
                  onChange={(e) => setNumeroFactura(e.target.value)}
                />
              </div>
              <div>
                <Label>Medio de Pago</Label>
                <Select value={medioPago} onValueChange={setMedioPago}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Tarjeta Débito">Tarjeta Débito</SelectItem>
                    <SelectItem value="Tarjeta Crédito">Tarjeta Crédito</SelectItem>
                    <SelectItem value="Transferencia">Transferencia</SelectItem>
                    <SelectItem value="Nequi">Nequi</SelectItem>
                    <SelectItem value="Daviplata">Daviplata</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Vendedor</Label>
                <Input
                  value={vendedor}
                  onChange={(e) => setVendedor(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
              <div>
                <Label>Mesa / Punto</Label>
                <Input
                  value={mesa}
                  onChange={(e) => setMesa(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <h4 className="font-medium pt-2">Datos del Cliente</h4>
            <div>
              <Label>Nombre / Razón Social</Label>
              <Input
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Documento (CC/NIT)</Label>
                <Input
                  value={clienteDocumento}
                  onChange={(e) => setClienteDocumento(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
              <div>
                <Label>Dirección</Label>
                <Input
                  value={clienteDireccion}
                  onChange={(e) => setClienteDireccion(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="pt-4">
              <Label>Formato de Impresión</Label>
              <Tabs value={formato} onValueChange={(v) => setFormato(v as "termica" | "carta")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="carta">Carta (PDF)</TabsTrigger>
                  <TabsTrigger value="termica">Térmica (80mm)</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handlePrint} className="flex-1">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button onClick={handleSavePDF} variant="secondary" className="flex-1">
                <FileDown className="h-4 w-4 mr-2" />
                Guardar PDF
              </Button>
            </div>

            <Button
              onClick={handleGuardarFactura}
              disabled={guardando}
              variant="outline"
              className="w-full"
            >
              {guardando ? "Guardando..." : "Guardar Factura en Sistema"}
            </Button>
          </div>

          {/* Vista previa */}
          <div className="border rounded-lg p-4 bg-gray-50 overflow-auto max-h-[70vh]">
            <h3 className="font-semibold text-lg mb-4 text-center">Vista Previa</h3>
            <div className={`mx-auto ${formato === "termica" ? "w-[80mm]" : ""}`}>
              <FacturaFisicaTemplate
                ref={facturaRef}
                datosFiscales={datosFiscales}
                datosFactura={datosFactura}
                formato={formato}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
