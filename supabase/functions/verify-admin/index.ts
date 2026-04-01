import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ isAdmin: false, isOwner: false, isApproved: false, error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ isAdmin: false, isOwner: false, isApproved: false, error: "Authentication failed" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Verifying permissions for user:", user.id);

    // Check profile for approval status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_approved, comercio_id')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.log("Profile fetch error:", profileError.message);
    }

    const isApproved = profile?.is_approved ?? false;
    const comercioId = profile?.comercio_id ?? null;

    // Check comercio membership for role (primary source of truth)
    const { data: membership, error: membershipError } = await supabase
      .from('comercio_miembros')
      .select('rol, comercio_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (membershipError) {
      console.log("Membership fetch error:", membershipError.message);
    }

    const comercioRole = membership?.rol ?? 'user';
    const isOwner = comercioRole === 'owner';
    const isAdmin = isOwner || comercioRole === 'admin';

    console.log("User verification result:", { userId: user.id, isAdmin, isOwner, isApproved, comercioId, comercioRole });

    return new Response(
      JSON.stringify({ 
        isAdmin, 
        isOwner,
        isApproved,
        comercioId: membership?.comercio_id ?? comercioId,
        comercioRole,
        userId: user.id,
        email: user.email 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Verify admin error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ isAdmin: false, isOwner: false, isApproved: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
