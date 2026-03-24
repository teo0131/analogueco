import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

async function sendWhatsAppMessage(phoneNumberId: string, token: string, to: string, text: string) {
  const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("WhatsApp send error:", err);
  }
  return res.ok;
}

async function callAI(systemPrompt: string, userMessage: string, conversationHistory: { role: string; content: string }[]) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-10), // keep last 10 for context
    { role: "user", content: userMessage },
  ];

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);

  // ── Meta Webhook Verification ──────────────────────────────────────────────
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const verifyToken = Deno.env.get("WA_VERIFY_TOKEN") ?? "analogueco_verify_token";

    if (mode === "subscribe" && token === verifyToken) {
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  // ── Incoming Message ───────────────────────────────────────────────────────
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // Skip non-message events (status updates, etc.)
    if (!value?.messages?.length) {
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const message = value.messages[0];
    const from = message.from; // sender phone number
    const messageText = message.text?.body ?? "";
    const waMessageId = message.id;
    const phoneNumberId = value.metadata?.phone_number_id;

    if (!messageText || !from) {
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Supabase (service role for webhook — no user auth) ─────────────────
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ── Find which user owns this phone number ID ──────────────────────────
    const { data: settingsRows } = await supabaseAdmin
      .from("user_settings")
      .select("user_id, whatsapp_access_token, whatsapp_phone_number_id, store_name")
      .eq("whatsapp_phone_number_id", phoneNumberId)
      .limit(1);

    const settings = settingsRows?.[0];
    if (!settings) {
      console.warn("No user found for phone_number_id:", phoneNumberId);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = settings.user_id;
    const waToken = settings.whatsapp_access_token;
    const storeName = settings.store_name ?? "nuestro negocio";

    // ── Find or create CRM conversation for this sender ────────────────────
    let { data: convRows } = await supabaseAdmin
      .from("crm_conversaciones")
      .select("id, total_mensajes, contacto_id")
      .eq("user_id", userId)
      .eq("canal", "whatsapp")
      .eq("canal_referencia", from)
      .eq("estado", "bot")
      .limit(1);

    let conversationId: string;
    let contactoId: string | null = null;

    if (convRows && convRows.length > 0) {
      conversationId = convRows[0].id;
      contactoId = convRows[0].contacto_id;
    } else {
      // Find or create CRM contact
      let { data: contactRows } = await supabaseAdmin
        .from("crm_contactos")
        .select("id, nombre")
        .eq("user_id", userId)
        .eq("telefono", from)
        .limit(1);

      if (!contactRows?.length) {
        const { data: newContact } = await supabaseAdmin
          .from("crm_contactos")
          .insert({ user_id: userId, nombre: `WA: +${from}`, telefono: from, canal_principal: "whatsapp" })
          .select("id")
          .single();
        contactoId = newContact?.id ?? null;
      } else {
        contactoId = contactRows[0].id;
      }

      const { data: newConv } = await supabaseAdmin
        .from("crm_conversaciones")
        .insert({
          user_id: userId,
          contacto_id: contactoId,
          canal: "whatsapp",
          canal_referencia: from,
          estado: "bot",
          telefono_cliente: from,
        })
        .select("id")
        .single();
      conversationId = newConv!.id;
    }

    // ── Load recent conversation history ───────────────────────────────────
    const { data: recentMsgs } = await supabaseAdmin
      .from("crm_mensajes")
      .select("rol, contenido")
      .eq("conversacion_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(12);

    const history = (recentMsgs ?? []).reverse().map((m) => ({
      role: m.rol === "cliente" ? "user" : "assistant",
      content: m.contenido,
    }));

    // ── Load menu for context ──────────────────────────────────────────────
    const { data: menuItems } = await supabaseAdmin
      .from("menu_items")
      .select("nombre, precio, categoria, descripcion, es_activo")
      .eq("user_id", userId)
      .eq("es_activo", true)
      .limit(50);

    const menuText = menuItems?.length
      ? menuItems.map((i) => `- ${i.nombre} (${i.categoria ?? "General"}): $${i.precio}${i.descripcion ? " — " + i.descripcion : ""}`).join("\n")
      : "No hay menú disponible actualmente.";

    // ── Build AI system prompt ─────────────────────────────────────────────
    const systemPrompt = `Eres el asistente de WhatsApp de "${storeName}". Eres amable, eficiente y conoces perfectamente el menú.

MENÚ ACTUAL:
${menuText}

TUS CAPACIDADES:
1. Responder preguntas sobre el menú, precios, horarios y disponibilidad
2. Tomar pedidos de domicilio completos (nombre, dirección, items, cantidad)
3. Confirmar el pedido y avisar que será revisado por el equipo
4. Gestionar preguntas frecuentes

FLUJO DE DOMICILIO:
- Saluda al cliente
- Pregunta qué desea pedir (muestra el menú si lo piden)
- Recoge los ítems y cantidades
- Pregunta el nombre y dirección de entrega
- Confirma el pedido completo con total estimado
- Indica que el equipo lo aprobará en breve

FORMATO DE CONFIRMACIÓN DE PEDIDO (cuando tengas todos los datos):
Cuando tengas nombre, dirección y al menos 1 ítem, responde con este JSON embebido (además de tu mensaje amable):
[PEDIDO_JSON]{"nombre":"...","telefono":"${from}","direccion":"...","items":[{"nombre":"...","cantidad":1,"precio":0}],"notas":"..."}[/PEDIDO_JSON]

REGLAS:
- Responde SIEMPRE en español
- Sé conciso y amigable
- Si no entiendes algo, pide aclaración
- Si el cliente insulta o el bot no puede ayudar, indica que un agente humano lo atenderá pronto y cambia el estado a "abierto"
- Nunca inventes precios que no estén en el menú`;

    // ── Call AI ────────────────────────────────────────────────────────────
    const aiResponse = await callAI(systemPrompt, messageText, history);

    // ── Parse pedido JSON if present ───────────────────────────────────────
    const pedidoMatch = aiResponse.match(/\[PEDIDO_JSON\]([\s\S]*?)\[\/PEDIDO_JSON\]/);
    const cleanResponse = aiResponse.replace(/\[PEDIDO_JSON\][\s\S]*?\[\/PEDIDO_JSON\]/g, "").trim();

    if (pedidoMatch) {
      try {
        const pedidoData = JSON.parse(pedidoMatch[1]);
        const items: { nombre: string; cantidad: number; precio: number }[] = pedidoData.items ?? [];
        const total = items.reduce((sum, i) => sum + (i.precio * i.cantidad), 0);

        // Create domicilio
        const { data: newDomicilio } = await supabaseAdmin
          .from("domicilios")
          .insert({
            user_id: userId,
            nombre_cliente: pedidoData.nombre ?? `Cliente WA +${from}`,
            telefono_cliente: from,
            direccion_entrega: pedidoData.direccion ?? "Sin dirección",
            notas_cliente: pedidoData.notas ?? null,
            canal: "whatsapp",
            whatsapp_conversation_id: conversationId,
            total,
            estado: "pendiente",
          })
          .select("id")
          .single();

        if (newDomicilio?.id) {
          const detalles = items.map((item) => ({
            domicilio_id: newDomicilio.id,
            nombre_item: item.nombre,
            cantidad: item.cantidad,
            precio_unitario: item.precio,
            subtotal: item.precio * item.cantidad,
          }));
          await supabaseAdmin.from("detalle_domicilios").insert(detalles);

          // Link domicilio to conversation
          await supabaseAdmin
            .from("crm_conversaciones")
            .update({ domicilio_id: newDomicilio.id })
            .eq("id", conversationId);
        }
      } catch (parseErr) {
        console.error("Failed to parse pedido JSON:", parseErr);
      }
    }

    // ── Save incoming message ──────────────────────────────────────────────
    await supabaseAdmin.from("crm_mensajes").insert({
      conversacion_id: conversationId,
      user_id: userId,
      rol: "cliente",
      canal: "whatsapp",
      contenido: messageText,
      wa_message_id: waMessageId,
      leido: false,
    });

    // ── Save bot response ──────────────────────────────────────────────────
    if (cleanResponse) {
      await supabaseAdmin.from("crm_mensajes").insert({
        conversacion_id: conversationId,
        user_id: userId,
        rol: "bot",
        canal: "whatsapp",
        contenido: cleanResponse,
        leido: true,
      });

      // Update conversation stats
      await supabaseAdmin
        .from("crm_conversaciones")
        .update({
          ultimo_mensaje: cleanResponse.substring(0, 200),
          ultimo_mensaje_at: new Date().toISOString(),
          total_mensajes: (convRows?.[0]?.total_mensajes ?? 0) + 2,
        })
        .eq("id", conversationId);

      // Send response back to WhatsApp
      if (waToken && phoneNumberId) {
        await sendWhatsAppMessage(phoneNumberId, waToken, from, cleanResponse);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
