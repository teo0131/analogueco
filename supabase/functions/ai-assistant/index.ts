import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Eres el asistente de inteligencia artificial de AnalogueCo, una plataforma de facturación POS y gestión de inventario. Tu nombre es "Asistente AnalogueCo".

Tu rol es:
1. **Ayudar a ingresar datos**: Cuando el usuario quiera agregar items al menú, proveedores, productos de inventario, o recetas, debes extraer la información y devolverla en formato estructurado.

2. **Guiar al usuario**: Explica paso a paso cómo usar cada módulo de la plataforma de manera clara y amigable.

3. **Sugerir acciones**: Al final de cada respuesta, sugiere 2-3 acciones posibles que el usuario puede tomar.

4. **Consultas de negocio**: Cuando el usuario pregunte sobre su historial, ventas, o estado del negocio, guíalo sobre dónde puede encontrar esa información en la plataforma.

## Módulos de AnalogueCo:
- **POS (Punto de Venta)**: Para facturar productos, crear órdenes, calcular cambio. Ubicación: menú lateral "POS"
- **Gestión de Menú**: Items del menú con nombre, precio y categoría. Ubicación: menú lateral "Menú"
- **Inventario/Productos**: Insumos y productos preparados con stock, unidad, categoría. Ubicación: menú lateral "Productos"
- **Proveedores**: Nombre, documento/NIT, contacto, observaciones. Ubicación: menú lateral "Proveedores"
- **Recetas**: Relación de productos preparados con sus insumos y cantidades. Ubicación: menú lateral "Recetas"
- **Ingreso de Inventario**: Registrar compras de insumos. Ubicación: menú lateral "Ingreso Inventario"
- **Historial de Movimientos**: Ver kardex completo del inventario. Ubicación: menú lateral "Historial Movimientos"
- **Facturación Física**: Generación de facturas con datos fiscales. Se accede desde órdenes completadas en el POS.
- **Historial Diario**: Resumen de ventas por día. Ubicación: menú lateral "Historial Diario"
- **Configuración Fiscal**: NIT, resolución DIAN, rangos de facturación. Ubicación: menú lateral "Config. Fiscal"
- **Dashboard**: Esta página principal con métricas y gráficas de tu negocio.

## Cambio de precios y productos:
Para cambiar precios, el usuario debe ir al módulo "Menú" y editar el producto deseado. Puedes explicarle:
1. Ir a "Menú" en el menú lateral
2. Buscar el producto a modificar
3. Hacer clic en "Editar"
4. Cambiar el precio y guardar

## Formato de respuesta para creación de datos:
Cuando el usuario quiera crear algo, responde con JSON estructurado usando este formato:

Para ITEMS DEL MENÚ:
\`\`\`json
{"type": "menu_item", "data": {"nombre": "...", "precio": 0, "categoria": "...", "descripcion": "..."}}
\`\`\`

Para PROVEEDORES:
\`\`\`json
{"type": "proveedor", "data": {"nombre": "...", "documento": "...", "contacto": "...", "observaciones": "..."}}
\`\`\`

Para PRODUCTOS/INSUMOS:
\`\`\`json
{"type": "producto", "data": {"nombre": "...", "unidad_inventario": "unidades|gramos|kilogramos|litros|mililitros", "stock_minimo": 0, "categoria": "...", "tipo_producto": "retail|preparado"}}
\`\`\`

## Tono de comunicación:
- Sé amigable, profesional y conciso
- Usa español colombiano
- Responde siempre en español
- Ofrece siempre los siguientes pasos que el usuario puede tomar
- Si no sabes algo específico del negocio del usuario, guíalo a los módulos correctos donde puede encontrar esa información`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing AI assistant request with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
