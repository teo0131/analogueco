import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      console.log("No authorization header provided");
      return new Response(
        JSON.stringify({ isAdmin: false, isApproved: false, error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client with the user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log("User authentication failed:", userError?.message);
      return new Response(
        JSON.stringify({ isAdmin: false, isApproved: false, error: "Authentication failed" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Verifying permissions for user:", user.id);

    // Check if user is approved using RLS-protected query
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_approved')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.log("Profile fetch error:", profileError.message);
    }

    const isApproved = profile?.is_approved ?? false;

    // Check if user has admin role using RLS-protected query
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.log("Roles fetch error:", rolesError.message);
    }

    const isAdmin = roles?.some(r => r.role === 'admin') ?? false;

    console.log("User verification result:", { userId: user.id, isAdmin, isApproved });

    return new Response(
      JSON.stringify({ 
        isAdmin, 
        isApproved,
        userId: user.id,
        email: user.email 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error("Verify admin error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ isAdmin: false, isApproved: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});