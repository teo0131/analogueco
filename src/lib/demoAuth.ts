import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DEMO_EMAIL = "demo@analogueco.app";
const DEMO_PASSWORD = "DemoAnalogueCo2026!";

/**
 * Bootstraps (idempotent) and signs in the public demo account, so
 * anyone (e.g. a professor) can explore the full app flow without
 * registering. Resolves to true on success.
 */
export async function loginAsDemo(): Promise<boolean> {
  try {
    // 1. Ensure the demo user exists. Edge function is idempotent.
    await supabase.functions.invoke("seed-demo-account");

    // 2. Sign in with the well-known demo credentials.
    const { error } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });

    if (error) {
      toast.error("No se pudo entrar al modo demo: " + error.message);
      return false;
    }

    toast.success("Estás en modo demostración");
    return true;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    toast.error("Error iniciando demo: " + msg);
    return false;
  }
}
