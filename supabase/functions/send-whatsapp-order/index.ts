import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { numero_destino, mensaje, orden_id } = body;

    if (!numero_destino || !mensaje) {
      return new Response(JSON.stringify({ error: "numero_destino y mensaje son requeridos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user's WhatsApp config from user_settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from("user_settings")
      .select("whatsapp_phone_number_id, whatsapp_access_token")
      .eq("user_id", user.id)
      .maybeSingle();

    if (settingsError) throw settingsError;

    const phoneNumberId = settings?.whatsapp_phone_number_id;
    const accessToken = settings?.whatsapp_access_token;

    if (!phoneNumberId || !accessToken) {
      return new Response(
        JSON.stringify({
          error: "WhatsApp Business no configurado. Por favor configura tu Phone Number ID y Access Token en Configuración de Cuenta.",
          code: "WA_NOT_CONFIGURED",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean phone number: remove spaces, dashes, parentheses; ensure country code
    const cleanPhone = numero_destino.replace(/[\s\-\(\)]/g, "").replace(/^\+/, "");

    // Send message via Meta WhatsApp Cloud API
    const waUrl = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    const waResponse = await fetch(waUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "text",
        text: { body: mensaje },
      }),
    });

    const waData = await waResponse.json();

    if (!waResponse.ok) {
      console.error("WhatsApp API error:", waData);
      return new Response(
        JSON.stringify({
          error: waData?.error?.message || "Error al enviar mensaje de WhatsApp",
          details: waData,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update orden_compra as sent if orden_id provided
    if (orden_id) {
      await supabaseClient
        .from("ordenes_compra")
        .update({ whatsapp_enviado: true, estado: "enviada" })
        .eq("id", orden_id);
    }

    return new Response(
      JSON.stringify({ success: true, whatsapp_message_id: waData?.messages?.[0]?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in send-whatsapp-order:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
