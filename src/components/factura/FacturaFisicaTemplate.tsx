import { forwardRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export interface DetalleFactura {
  descripcion: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  descuento: number;
  iva: number;
  total: number;
}

export interface DatosCliente {
  tipo?: "persona" | "empresa";
  nombre: string;            // Nombre o Razón Social
  documento: string;         // CC o NIT formateado
  direccion: string;
  email?: string;
}

export interface DatosFiscales {
  logoUrl?: string;
  nombreComercial: string;
  razonSocial?: string;
  nit?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  ciudad?: string;
  regimenTributario?: string;
  numeroResolucionDian?: string;
  fechaResolucion?: string;
  prefijoFactura?: string;
  rangoDesde?: number;
  rangoHasta?: number;
  leyendaLegal?: string;
  politicaCambios?: string;
}

export interface DatosFactura {
  numeroFactura: string;
  fechaExpedicion: Date;
  medioPago: string;
  vendedor?: string;
  mesa?: string;
  cliente: DatosCliente;
  detalles: DetalleFactura[];
  subtotal: number;
  descuento: number;
  baseGravable: number;
  ivaPorcentaje?: number;
  ivaTotal: number;
  otrosImpuestos: number;
  total: number;
}

interface FacturaFisicaTemplateProps {
  datosFiscales: DatosFiscales;
  datosFactura: DatosFactura;
  formato: "termica" | "carta";
}

const numeroALetras = (numero: number): string => {
  const unidades = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
  const decenas = ["", "diez", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
  const especiales = ["once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"];

  if (numero === 0) return "cero pesos";
  if (numero < 0) return "menos " + numeroALetras(-numero);

  let palabras = "";
  const millones = Math.floor(numero / 1000000);
  const miles = Math.floor((numero % 1000000) / 1000);
  const cientos = Math.floor((numero % 1000) / 100);
  const resto = numero % 100;

  if (millones > 0) {
    palabras += millones === 1 ? "un millón " : numeroALetras(millones).replace(" pesos", "") + " millones ";
  }

  if (miles > 0) {
    palabras += miles === 1 ? "mil " : numeroALetras(miles).replace(" pesos", "") + " mil ";
  }

  if (cientos > 0) {
    if (cientos === 1 && resto === 0) {
      palabras += "cien ";
    } else {
      const centenas = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
      palabras += centenas[cientos] + " ";
    }
  }

  if (resto > 0) {
    if (resto < 10) {
      palabras += unidades[resto];
    } else if (resto < 20) {
      palabras += especiales[resto - 11] || (resto === 10 ? "diez" : "");
    } else {
      const decena = Math.floor(resto / 10);
      const unidad = resto % 10;
      if (resto === 20) {
        palabras += "veinte";
      } else if (resto < 30) {
        palabras += "veinti" + unidades[unidad];
      } else {
        palabras += decenas[decena] + (unidad > 0 ? " y " + unidades[unidad] : "");
      }
    }
  }

  return (palabras.trim() + " pesos").replace(/\s+/g, " ");
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);
};

export const FacturaFisicaTemplate = forwardRef<HTMLDivElement, FacturaFisicaTemplateProps>(
  ({ datosFiscales, datosFactura, formato }, ref) => {
    const esTermica = formato === "termica";
    const totalEnLetras = numeroALetras(Math.round(datosFactura.total));
    const esEmpresa = datosFactura.cliente.tipo === "empresa";

    return (
      <div
        ref={ref}
        className={`bg-white text-black ${
          esTermica ? "w-[80mm] text-[10px] p-2" : "w-full max-w-[210mm] p-8 text-sm"
        }`}
        style={{
          fontFamily: "'Courier New', 'Consolas', monospace",
          lineHeight: esTermica ? 1.3 : 1.5,
        }}
      >
        {/* ENCABEZADO - DATOS DEL EMISOR */}
        <header className={`text-center ${esTermica ? "mb-2" : "mb-6"} border-b-2 border-black pb-3`}>
          {datosFiscales.logoUrl && (
            <img
              src={datosFiscales.logoUrl}
              alt="Logo"
              width={esTermica ? 40 : 64}
              height={esTermica ? 40 : 64}
              loading="lazy"
              className={`mx-auto object-contain ${esTermica ? "h-10 mb-1" : "h-16 mb-2"}`}
            />
          )}
          <h1 className={`font-bold ${esTermica ? "text-sm" : "text-xl"}`}>
            {datosFiscales.nombreComercial}
          </h1>
          {datosFiscales.razonSocial && (
            <p className="text-xs">{datosFiscales.razonSocial}</p>
          )}
          {datosFiscales.nit && <p>NIT: {datosFiscales.nit}</p>}
          {datosFiscales.direccion && <p>{datosFiscales.direccion}</p>}
          {(datosFiscales.ciudad || datosFiscales.telefono) && (
            <p>
              {datosFiscales.ciudad}{datosFiscales.ciudad && datosFiscales.telefono && " - "}
              {datosFiscales.telefono && `Tel: ${datosFiscales.telefono}`}
            </p>
          )}
          {datosFiscales.email && <p>{datosFiscales.email}</p>}
          {datosFiscales.regimenTributario && (
            <p className="font-semibold">{datosFiscales.regimenTributario}</p>
          )}
          {datosFiscales.numeroResolucionDian && (
            <p className={`${esTermica ? "text-[8px]" : "text-xs"} mt-1`}>
              Resolución DIAN No. {datosFiscales.numeroResolucionDian}
              {datosFiscales.fechaResolucion && ` del ${datosFiscales.fechaResolucion}`}
            </p>
          )}
          {datosFiscales.prefijoFactura && datosFiscales.rangoDesde && datosFiscales.rangoHasta && (
            <p className={`${esTermica ? "text-[8px]" : "text-xs"}`}>
              Prefijo: {datosFiscales.prefijoFactura} | Rango: {datosFiscales.rangoDesde} - {datosFiscales.rangoHasta}
            </p>
          )}
          <p className={`${esTermica ? "text-[8px]" : "text-xs"} font-semibold mt-1`}>
            Factura por computador
          </p>
        </header>

        {/* INFO DE LA FACTURA */}
        <section className={`${esTermica ? "mb-2" : "mb-4"} border-b border-dashed border-black pb-2`}>
          <div className={`flex justify-between ${esTermica ? "" : "text-base"}`}>
            <span className="font-bold">FACTURA No.</span>
            <span className="font-bold">{datosFactura.numeroFactura}</span>
          </div>
          <div className="flex justify-between">
            <span>Fecha:</span>
            <span>{format(datosFactura.fechaExpedicion, "dd/MM/yyyy HH:mm", { locale: es })}</span>
          </div>
          <div className="flex justify-between">
            <span>Medio de Pago:</span>
            <span>{datosFactura.medioPago}</span>
          </div>
          {datosFactura.vendedor && (
            <div className="flex justify-between">
              <span>Vendedor:</span>
              <span>{datosFactura.vendedor}</span>
            </div>
          )}
          {datosFactura.mesa && (
            <div className="flex justify-between">
              <span>Mesa:</span>
              <span>{datosFactura.mesa}</span>
            </div>
          )}
        </section>

        {/* DATOS DEL CLIENTE */}
        <section className={`${esTermica ? "mb-2" : "mb-4"} border-b border-dashed border-black pb-2`}>
          <p className="font-bold">
            {esEmpresa ? "CLIENTE (EMPRESA):" : "CLIENTE:"}
          </p>
          {esEmpresa ? (
            <>
              <p><span className="font-semibold">Razón Social:</span> {datosFactura.cliente.nombre}</p>
              {datosFactura.cliente.documento && datosFactura.cliente.documento !== "N/A" && (
                <p><span className="font-semibold">NIT:</span> {datosFactura.cliente.documento}</p>
              )}
              {datosFactura.cliente.direccion && (
                <p><span className="font-semibold">Dirección:</span> {datosFactura.cliente.direccion}</p>
              )}
              {datosFactura.cliente.email && (
                <p><span className="font-semibold">Email:</span> {datosFactura.cliente.email}</p>
              )}
            </>
          ) : (
            <>
              <p>{datosFactura.cliente.nombre}</p>
              {datosFactura.cliente.documento && datosFactura.cliente.documento !== "N/A" && (
                <p>Doc: {datosFactura.cliente.documento}</p>
              )}
              {datosFactura.cliente.direccion && (
                <p>{datosFactura.cliente.direccion}</p>
              )}
            </>
          )}
        </section>

        {/* TABLA DE PRODUCTOS */}
        <section className={`${esTermica ? "mb-2" : "mb-4"}`}>
          {esTermica ? (
            <div>
              <div className="flex justify-between font-bold border-b border-black pb-1 mb-1">
                <span className="flex-1">Descripción</span>
                <span className="w-8 text-center">Cant</span>
                <span className="w-16 text-right">Total</span>
              </div>
              {datosFactura.detalles.map((item, index) => (
                <div key={index} className="flex justify-between py-0.5">
                  <span className="flex-1 truncate">{item.descripcion}</span>
                  <span className="w-8 text-center">{item.cantidad}</span>
                  <span className="w-16 text-right">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left py-2">Descripción</th>
                  <th className="text-center py-2 w-12">Cant</th>
                  <th className="text-center py-2 w-16">Unidad</th>
                  <th className="text-right py-2 w-24">V. Unit.</th>
                  <th className="text-right py-2 w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                {datosFactura.detalles.map((item, index) => (
                  <tr key={index} className="border-b border-gray-300">
                    <td className="py-2">{item.descripcion}</td>
                    <td className="text-center py-2">{item.cantidad}</td>
                    <td className="text-center py-2">{item.unidad}</td>
                    <td className="text-right py-2">{formatCurrency(item.precioUnitario)}</td>
                    <td className="text-right py-2">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* TOTALES */}
        <section className={`${esTermica ? "mb-2" : "mb-4"} border-t-2 border-black pt-2`}>
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(datosFactura.subtotal)}</span>
          </div>
          {datosFactura.descuento > 0 && (
            <div className="flex justify-between">
              <span>Descuento:</span>
              <span>-{formatCurrency(datosFactura.descuento)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Base Gravable:</span>
            <span>{formatCurrency(datosFactura.baseGravable)}</span>
          </div>
          {datosFactura.ivaTotal > 0 && (
            <div className="flex justify-between">
              <span>IVA ({datosFactura.ivaPorcentaje ?? 19}%):</span>
              <span>{formatCurrency(datosFactura.ivaTotal)}</span>
            </div>
          )}
          {datosFactura.otrosImpuestos > 0 && (
            <div className="flex justify-between">
              <span>Otros Impuestos:</span>
              <span>{formatCurrency(datosFactura.otrosImpuestos)}</span>
            </div>
          )}
          <div className={`flex justify-between font-bold ${esTermica ? "text-sm" : "text-lg"} mt-2 pt-2 border-t-2 border-black`}>
            <span>TOTAL A PAGAR:</span>
            <span>{formatCurrency(datosFactura.total)}</span>
          </div>
          <p className={`${esTermica ? "text-[8px]" : "text-xs"} italic mt-1 text-center`}>
            Son: {totalEnLetras.toUpperCase()}
          </p>
        </section>

        {/* PIE DE PÁGINA */}
        <footer className={`text-center ${esTermica ? "text-[8px]" : "text-xs"} border-t border-dashed border-black pt-2 space-y-1`}>
          <p className="italic">
            Esta factura constituye soporte de la operación según el Estatuto Tributario.
          </p>
          <p className="font-semibold">
            {datosFiscales.leyendaLegal || "Gracias por su compra"}
          </p>
          {datosFiscales.politicaCambios && (
            <p>{datosFiscales.politicaCambios}</p>
          )}
          <div className={`${esTermica ? "mt-2" : "mt-4"}`}>
            <p>________________________</p>
            <p>Firma Vendedor</p>
          </div>
        </footer>
      </div>
    );
  }
);

FacturaFisicaTemplate.displayName = "FacturaFisicaTemplate";
