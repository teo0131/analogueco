import { useState, useRef, useEffect, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Printer, FileDown, X, Building2, User, Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  FacturaFisicaTemplate,
  DatosFiscales,
  DatosFactura,
  DetalleFactura,
} from "./FacturaFisicaTemplate";
import html2pdf from "html2pdf.js";
import { parseNit, isLikelyNit } from "@/lib/nitValidation";

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

interface ItemEditable {
  descripcion: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
}

type TipoCliente = "persona" | "empresa";

export const GenerarFactura = ({ orden, open, onClose }: GenerarFacturaProps) => {
  const facturaRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [formato, setFormato] = useState<"termica" | "carta">("carta");

  const [datosFiscales, setDatosFiscales] = useState<DatosFiscales>({
    nombreComercial: "Mi Negocio",
    regimenTributario: "Responsable de IVA",
    leyendaLegal: "Gracias por su compra",
    politicaCambios: "Esta factura es válida como soporte de la transacción",
  });

  // Tipo de cliente
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>("persona");

  // Persona
  const [clienteNombre, setClienteNombre] = useState("Consumidor Final");
  const [clienteDocumento, setClienteDocumento] = useState("");

  // Empresa
  const [razonSocial, setRazonSocial] = useState("");
  const [nitInput, setNitInput] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");

  // Compartido
  const [clienteDireccion, setClienteDireccion] = useState("");

  // Factura
  const [medioPago, setMedioPago] = useState("Efectivo");
  const [vendedor, setVendedor] = useState("");
  const [mesa, setMesa] = useState("");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [ivaPorcentaje, setIvaPorcentaje] = useState<number>(0);

  // Items editables
  const [items, setItems] = useState<ItemEditable[]>([]);

  // NIT parsing
  const nitParsed = useMemo(() => (nitInput ? parseNit(nitInput) : null), [nitInput]);

  // Auto-detectar empresa si el documento parece NIT (modo persona)
  useEffect(() => {
    if (tipoCliente === "persona" && clienteDocumento && isLikelyNit(clienteDocumento)) {
      // Sugerir cambio a empresa
      setTipoCliente("empresa");
      setNitInput(clienteDocumento);
      setRazonSocial(clienteNombre !== "Consumidor Final" ? clienteNombre : "");
      toast.info("Se detectó un NIT. Cambiamos a modo Empresa.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteDocumento]);

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

          const consecutivo = data.consecutivo_actual || 1;
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
      // Inicializar items desde la orden
      const initial = [...orden.items]
        .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }))
        .map((it) => ({
          descripcion: it.name,
          cantidad: 1,
          unidad: "unidad",
          precioUnitario: it.price,
        }));
      setItems(initial);
    }
  }, [open, orden.orderNumber, orden.items]);

  // Cálculos
  const subtotal = useMemo(
    () => items.reduce((acc, it) => acc + it.cantidad * it.precioUnitario, 0),
    [items]
  );
  const baseGravable = subtotal;
  const ivaTotal = Math.round((baseGravable * ivaPorcentaje) / 100);
  const total = baseGravable + ivaTotal;

  const detalles: DetalleFactura[] = items.map((it) => ({
    descripcion: it.descripcion,
    cantidad: it.cantidad,
    unidad: it.unidad,
    precioUnitario: it.precioUnitario,
    descuento: 0,
    iva: ivaPorcentaje,
    total: it.cantidad * it.precioUnitario,
  }));

  const datosFactura: DatosFactura = {
    numeroFactura,
    fechaExpedicion: orden.timestamp,
    medioPago,
    vendedor: vendedor || undefined,
    mesa: mesa || undefined,
    cliente: {
      tipo: tipoCliente,
      nombre: tipoCliente === "empresa" ? razonSocial || "—" : clienteNombre,
      documento:
        tipoCliente === "empresa"
          ? nitParsed?.isValid
            ? nitParsed.formatted
            : nitInput || "N/A"
          : clienteDocumento || "N/A",
      direccion: clienteDireccion,
      email: clienteEmail || undefined,
    },
    detalles,
    subtotal,
    descuento: 0,
    baseGravable,
    ivaPorcentaje,
    ivaTotal,
    otrosImpuestos: 0,
    total,
  };

  const handleItemChange = (idx: number, field: keyof ItemEditable, value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addItem = () =>
    setItems((p) => [...p, { descripcion: "Nuevo ítem", cantidad: 1, unidad: "unidad", precioUnitario: 0 }]);
  const removeItem = (idx: number) => setItems((p) => p.filter((_, i) => i !== idx));

  const validarAntesDeGuardar = (): string | null => {
    if (tipoCliente === "empresa") {
      if (!razonSocial.trim()) return "La Razón Social es obligatoria para empresas";
      if (!nitParsed?.isValid) return nitParsed?.error || "NIT inválido";
      if (!clienteDireccion.trim()) return "La Dirección es obligatoria para empresas";
    }
    if (items.length === 0) return "La factura debe tener al menos un ítem";
    return null;
  };

  const handleGuardarFactura = async () => {
    const errorMsg = validarAntesDeGuardar();
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }

    setGuardando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuario no autenticado");
        return;
      }

      const { data: facturaData, error: facturaError } = await supabase
        .from("facturas_fisicas")
        .insert({
          user_id: user.id,
          numero_factura: numeroFactura,
          orden_id: orden.id,
          fecha_expedicion: orden.timestamp.toISOString(),
          tipo_cliente: tipoCliente,
          cliente_nombre: tipoCliente === "empresa" ? razonSocial : clienteNombre,
          cliente_razon_social: tipoCliente === "empresa" ? razonSocial : null,
          cliente_documento:
            tipoCliente === "empresa" ? nitParsed?.base || null : clienteDocumento || null,
          cliente_dv: tipoCliente === "empresa" ? nitParsed?.dv || null : null,
          cliente_direccion: clienteDireccion || null,
          cliente_email: clienteEmail || null,
          medio_pago: medioPago,
          vendedor: vendedor || null,
          mesa: mesa || null,
          subtotal,
          descuento: 0,
          base_gravable: baseGravable,
          iva_porcentaje: ivaPorcentaje,
          iva_total: ivaTotal,
          otros_impuestos: 0,
          total,
        })
        .select()
        .single();

      if (facturaError) throw facturaError;

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
            {/* Tipo de cliente */}
            <div>
              <Label>Tipo de Cliente</Label>
              <Tabs value={tipoCliente} onValueChange={(v) => setTipoCliente(v as TipoCliente)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="persona">
                    <User className="h-4 w-4 mr-2" />
                    Persona
                  </TabsTrigger>
                  <TabsTrigger value="empresa">
                    <Building2 className="h-4 w-4 mr-2" />
                    Empresa (NIT)
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="persona" className="space-y-3 pt-3">
                  <div>
                    <Label>Nombre</Label>
                    <Input
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Documento (CC)</Label>
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
                </TabsContent>

                <TabsContent value="empresa" className="space-y-3 pt-3">
                  <div>
                    <Label>Razón Social *</Label>
                    <Input
                      value={razonSocial}
                      onChange={(e) => setRazonSocial(e.target.value)}
                      placeholder="Ej: Comercializadora ABC S.A.S."
                    />
                  </div>
                  <div>
                    <Label>NIT *</Label>
                    <Input
                      value={nitInput}
                      onChange={(e) => setNitInput(e.target.value)}
                      placeholder="900123456 o 900.123.456-7"
                    />
                    {nitParsed && (
                      <div className="mt-1 flex items-center gap-1 text-xs">
                        {nitParsed.isValid ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span className="text-green-700">
                              NIT válido: <strong>{nitParsed.formatted}</strong>
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 text-destructive" />
                            <span className="text-destructive">{nitParsed.error}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Dirección *</Label>
                    <Input
                      value={clienteDireccion}
                      onChange={(e) => setClienteDireccion(e.target.value)}
                      placeholder="Dirección fiscal"
                    />
                  </div>
                  <div>
                    <Label>Correo electrónico</Label>
                    <Input
                      type="email"
                      value={clienteEmail}
                      onChange={(e) => setClienteEmail(e.target.value)}
                      placeholder="contacto@empresa.com"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="grid grid-cols-2 gap-3">
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

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Vendedor</Label>
                <Input value={vendedor} onChange={(e) => setVendedor(e.target.value)} placeholder="Opcional" />
              </div>
              <div>
                <Label>Mesa / Punto</Label>
                <Input value={mesa} onChange={(e) => setMesa(e.target.value)} placeholder="Opcional" />
              </div>
              <div>
                <Label>IVA</Label>
                <Select value={String(ivaPorcentaje)} onValueChange={(v) => setIvaPorcentaje(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% (Excluido)</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="19">19%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Items editables */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <Label>Ítems de la Factura</Label>
                <Button size="sm" variant="outline" onClick={addItem}>
                  <Plus className="h-3 w-3 mr-1" /> Agregar
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-1 items-end border rounded-md p-2">
                    <div className="col-span-5">
                      <Label className="text-xs">Descripción</Label>
                      <Input
                        value={it.descripcion}
                        onChange={(e) => handleItemChange(idx, "descripcion", e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Cant.</Label>
                      <Input
                        type="number"
                        min={1}
                        value={it.cantidad}
                        onChange={(e) => handleItemChange(idx, "cantidad", Number(e.target.value) || 0)}
                        className="h-8"
                      />
                    </div>
                    <div className="col-span-4">
                      <Label className="text-xs">V. Unit.</Label>
                      <Input
                        type="number"
                        min={0}
                        value={it.precioUnitario}
                        onChange={(e) => handleItemChange(idx, "precioUnitario", Number(e.target.value) || 0)}
                        className="h-8"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(idx)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs mt-2 px-1">
                <span className="text-muted-foreground">Subtotal: ${subtotal.toLocaleString("es-CO")}</span>
                <span className="text-muted-foreground">IVA: ${ivaTotal.toLocaleString("es-CO")}</span>
                <Badge variant="secondary">Total: ${total.toLocaleString("es-CO")}</Badge>
              </div>
            </div>

            <div className="pt-2">
              <Label>Formato de Impresión</Label>
              <Tabs value={formato} onValueChange={(v) => setFormato(v as "termica" | "carta")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="carta">Carta (PDF)</TabsTrigger>
                  <TabsTrigger value="termica">Térmica (80mm)</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handlePrint} className="flex-1">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button onClick={handleSavePDF} variant="secondary" className="flex-1">
                <FileDown className="h-4 w-4 mr-2" />
                PDF
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
          <div className="border rounded-lg p-4 bg-muted/30 overflow-auto max-h-[80vh]">
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
