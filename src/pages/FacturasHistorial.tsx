import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Printer, FileDown, Search, Building2, User, Receipt } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import html2pdf from "html2pdf.js";
import {
  FacturaFisicaTemplate,
  DatosFactura,
  DatosFiscales,
  DetalleFactura,
} from "@/components/factura/FacturaFisicaTemplate";

type FacturaRow = {
  id: string;
  numero_factura: string;
  fecha_expedicion: string;
  tipo_cliente: string;
  cliente_nombre: string;
  cliente_razon_social: string | null;
  cliente_documento: string | null;
  cliente_dv: string | null;
  cliente_direccion: string | null;
  cliente_email: string | null;
  medio_pago: string | null;
  vendedor: string | null;
  mesa: string | null;
  subtotal: number;
  descuento: number;
  base_gravable: number;
  iva_porcentaje: number;
  iva_total: number;
  otros_impuestos: number;
  total: number;
};

const COP = (v: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(v);

export default function FacturasHistorial() {
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<"todos" | "persona" | "empresa">("todos");
  const [seleccionada, setSeleccionada] = useState<FacturaRow | null>(null);
  const [detalles, setDetalles] = useState<DetalleFactura[]>([]);
  const [datosFiscales, setDatosFiscales] = useState<DatosFiscales | null>(null);
  const [formato, setFormato] = useState<"termica" | "carta">("carta");
  const facturaRef = useRef<HTMLDivElement>(null);

  const { data: facturas = [], isLoading } = useQuery({
    queryKey: ["facturas-historial"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facturas_fisicas")
        .select("*")
        .order("fecha_expedicion", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FacturaRow[];
    },
  });

  // Cargar datos fiscales una vez
  useEffect(() => {
    (async () => {
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
      } else {
        setDatosFiscales({
          nombreComercial: "Mi Negocio",
          regimenTributario: "Responsable de IVA",
          leyendaLegal: "Gracias por su compra",
          politicaCambios: "Esta factura es válida como soporte de la transacción",
        });
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = facturas;
    if (tipoFiltro !== "todos") list = list.filter((f) => f.tipo_cliente === tipoFiltro);
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      list = list.filter(
        (f) =>
          f.numero_factura.toLowerCase().includes(q) ||
          f.cliente_nombre.toLowerCase().includes(q) ||
          (f.cliente_razon_social ?? "").toLowerCase().includes(q) ||
          (f.cliente_documento ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [facturas, busqueda, tipoFiltro]);

  const totalFacturado = filtered.reduce((s, f) => s + Number(f.total), 0);
  const ivaRecaudado = filtered.reduce((s, f) => s + Number(f.iva_total), 0);

  const abrirFactura = async (f: FacturaRow) => {
    setSeleccionada(f);
    const { data } = await supabase
      .from("detalle_facturas_fisicas")
      .select("*")
      .eq("factura_id", f.id);
    setDetalles(
      (data ?? []).map((d: any) => ({
        descripcion: d.descripcion,
        cantidad: Number(d.cantidad),
        unidad: d.unidad ?? "unidad",
        precioUnitario: Number(d.precio_unitario),
        descuento: Number(d.descuento ?? 0),
        iva: Number(d.iva ?? 0),
        total: Number(d.total ?? 0),
      }))
    );
  };

  const datosFactura: DatosFactura | null = useMemo(() => {
    if (!seleccionada) return null;
    return {
      numeroFactura: seleccionada.numero_factura,
      fechaExpedicion: parseISO(seleccionada.fecha_expedicion),
      medioPago: seleccionada.medio_pago ?? "Efectivo",
      vendedor: seleccionada.vendedor ?? undefined,
      mesa: seleccionada.mesa ?? undefined,
      cliente: {
        tipo: (seleccionada.tipo_cliente as "persona" | "empresa") ?? "persona",
        nombre:
          seleccionada.tipo_cliente === "empresa"
            ? seleccionada.cliente_razon_social ?? seleccionada.cliente_nombre
            : seleccionada.cliente_nombre,
        documento:
          seleccionada.cliente_documento
            ? seleccionada.cliente_dv
              ? `${seleccionada.cliente_documento}-${seleccionada.cliente_dv}`
              : seleccionada.cliente_documento
            : "N/A",
        direccion: seleccionada.cliente_direccion ?? "",
        email: seleccionada.cliente_email ?? undefined,
      },
      detalles,
      subtotal: Number(seleccionada.subtotal),
      descuento: Number(seleccionada.descuento),
      baseGravable: Number(seleccionada.base_gravable),
      ivaPorcentaje: Number(seleccionada.iva_porcentaje),
      ivaTotal: Number(seleccionada.iva_total),
      otrosImpuestos: Number(seleccionada.otros_impuestos),
      total: Number(seleccionada.total),
    };
  }, [seleccionada, detalles]);

  const handlePrint = () => {
    if (!facturaRef.current || !seleccionada) return;
    const w = window.open("", "_blank");
    if (!w) {
      toast.error("No se pudo abrir ventana de impresión");
      return;
    }
    w.document.write(`
      <!DOCTYPE html><html><head><title>Factura ${seleccionada.numero_factura}</title>
      <style>
        body { margin:0; padding:${formato === "termica" ? "0" : "20px"}; font-family:'Courier New',monospace; }
        @media print { @page { size:${formato === "termica" ? "80mm auto" : "letter"}; margin:${formato === "termica" ? "2mm" : "10mm"}; } }
      </style></head><body>${facturaRef.current.innerHTML}</body></html>
    `);
    w.document.close();
    w.print();
  };

  const handlePDF = async () => {
    if (!facturaRef.current || !seleccionada) return;
    try {
      await html2pdf()
        .set({
          margin: formato === "termica" ? 2 : 10,
          filename: `Factura_${seleccionada.numero_factura}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: {
            unit: "mm",
            format: formato === "termica" ? [80, 297] : "letter",
            orientation: "portrait" as const,
          },
        })
        .from(facturaRef.current)
        .save();
      toast.success("PDF descargado");
    } catch (e) {
      console.error(e);
      toast.error("Error al generar PDF");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            Historial de Facturas
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} facturas · Total {COP(totalFacturado)} · IVA {COP(ivaRecaudado)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, cliente o NIT..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-8 w-72"
            />
          </div>
          <Tabs value={tipoFiltro} onValueChange={(v) => setTipoFiltro(v as any)}>
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="empresa">
                <Building2 className="h-3.5 w-3.5 mr-1" /> Empresa
              </TabsTrigger>
              <TabsTrigger value="persona">
                <User className="h-3.5 w-3.5 mr-1" /> Persona
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando...</p>}

      {!isLoading && filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No hay facturas registradas todavía.
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map((f) => (
          <Card
            key={f.id}
            className="hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => abrirFactura(f)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    #{f.numero_factura}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {f.tipo_cliente === "empresa" ? (
                      <><Building2 className="h-3 w-3 mr-1" />Empresa</>
                    ) : (
                      <><User className="h-3 w-3 mr-1" />Persona</>
                    )}
                  </Badge>
                  {f.iva_porcentaje > 0 && (
                    <Badge variant="outline" className="text-xs">IVA {f.iva_porcentaje}%</Badge>
                  )}
                </div>
                <p className="text-sm mt-0.5 truncate">
                  {f.cliente_razon_social ?? f.cliente_nombre}
                  {f.cliente_documento && (
                    <span className="text-muted-foreground"> · {f.cliente_documento}{f.cliente_dv ? `-${f.cliente_dv}` : ""}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(parseISO(f.fecha_expedicion), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                  {f.medio_pago && <> · {f.medio_pago}</>}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {COP(Number(f.total))}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Diálogo de vista previa */}
      <Dialog open={!!seleccionada} onOpenChange={(o) => !o && setSeleccionada(null)}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-3 flex-wrap">
              <span>Factura #{seleccionada?.numero_factura}</span>
              <div className="flex items-center gap-2">
                <Tabs value={formato} onValueChange={(v) => setFormato(v as any)}>
                  <TabsList>
                    <TabsTrigger value="carta">Carta</TabsTrigger>
                    <TabsTrigger value="termica">Térmica 80mm</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button size="sm" variant="outline" onClick={handlePDF}>
                  <FileDown className="h-4 w-4 mr-1" /> PDF
                </Button>
                <Button size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-1" /> Imprimir
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {datosFactura && datosFiscales && (
            <div className="bg-white text-black rounded-md overflow-hidden border">
              <FacturaFisicaTemplate
                ref={facturaRef}
                datosFiscales={datosFiscales}
                datosFactura={datosFactura}
                formato={formato}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
