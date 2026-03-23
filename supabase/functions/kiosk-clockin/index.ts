import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { pin, tipo, owner_user_id } = await req.json();

    if (!pin || !tipo || !owner_user_id) {
      return new Response(JSON.stringify({ error: "Faltan parámetros" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (tipo !== "entrada" && tipo !== "salida") {
      return new Response(JSON.stringify({ error: "Tipo inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find employee by PIN and owner
    const { data: empleado, error: empError } = await supabase
      .from("empleados")
      .select("id, nombre, apellido, cargo")
      .eq("pin", pin.trim())
      .eq("user_id", owner_user_id)
      .eq("estado", "activo")
      .single();

    if (empError || !empleado) {
      return new Response(JSON.stringify({ error: "PIN incorrecto o empleado no encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get last attendance record today to validate clock logic
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

    const { data: lastRecord } = await supabase
      .from("registros_asistencia")
      .select("tipo")
      .eq("empleado_id", empleado.id)
      .eq("user_id", owner_user_id)
      .gte("timestamp", startOfDay)
      .lte("timestamp", endOfDay)
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    const lastTipo = lastRecord?.tipo || null;

    if (tipo === "entrada" && lastTipo === "entrada") {
      return new Response(JSON.stringify({ error: "Ya tienes una entrada registrada hoy", empleado }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (tipo === "salida" && lastTipo !== "entrada") {
      return new Response(JSON.stringify({ error: "No hay entrada registrada para cerrar", empleado }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert clock record
    const { error: insertError } = await supabase.from("registros_asistencia").insert({
      user_id: owner_user_id,
      empleado_id: empleado.id,
      tipo,
      timestamp: new Date().toISOString(),
    });

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true, empleado }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("kiosk-clockin error:", err);
    return new Response(JSON.stringify({ error: "Error interno del servidor" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
