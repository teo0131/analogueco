// Idempotent demo account bootstrap.
// Creates a fixed demo user with its own demo comercio on first call.
// Public function (verify_jwt=false) — safe because it only ever touches
// the single, well-known demo user and refuses to do anything else.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEMO_EMAIL = "demo@analogueco.app";
const DEMO_PASSWORD = "DemoAnalogueCo2026!";
const DEMO_STORE_NAME = "Cafetería Demo · AnalogueCo";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Check if the demo user already exists.
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) throw listErr;

    let user = list.users.find((u) => u.email === DEMO_EMAIL);

    // 2. Create it if missing — handle_new_user trigger will spin up the comercio.
    if (!user) {
      const { data: created, error: createErr } =
        await supabase.auth.admin.createUser({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: { store_name: DEMO_STORE_NAME },
        });
      if (createErr) throw createErr;
      user = created.user!;
    }

    // 3. Force-approve the profile (in case the trigger left it pending).
    await supabase
      .from("profiles")
      .update({ is_approved: true })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({
        ok: true,
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (e) {
    console.error("seed-demo-account error", e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message ?? e) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
