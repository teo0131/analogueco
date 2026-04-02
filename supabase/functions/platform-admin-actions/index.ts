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
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify the calling user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check platform admin status using service role (bypasses RLS)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: adminCheck } = await adminClient
      .from('platform_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!adminCheck) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // LIST pending comercios
    if (action === 'list' || req.method === 'GET') {
      const { data: pending } = await adminClient
        .from('profiles')
        .select('user_id, email, is_approved, comercio_id, created_at')
        .eq('is_approved', false);

      // Enrich with comercio name
      const enriched = [];
      for (const p of pending || []) {
        let comercioNombre = null;
        if (p.comercio_id) {
          const { data: comercio } = await adminClient
            .from('comercios')
            .select('nombre, created_at')
            .eq('id', p.comercio_id)
            .single();
          comercioNombre = comercio?.nombre;
        }
        enriched.push({
          user_id: p.user_id,
          email: p.email,
          comercio_id: p.comercio_id,
          comercio_nombre: comercioNombre,
          created_at: p.created_at,
        });
      }

      return new Response(JSON.stringify({ solicitudes: enriched }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // APPROVE or REJECT
    if (req.method === 'POST') {
      const body = await req.json();
      const { target_user_id, action: bodyAction } = body;

      if (!target_user_id || !bodyAction) {
        return new Response(JSON.stringify({ error: 'Missing target_user_id or action' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (bodyAction === 'approve') {
        const { error } = await adminClient
          .from('profiles')
          .update({ is_approved: true })
          .eq('user_id', target_user_id);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ success: true, message: 'Comercio aprobado' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (bodyAction === 'reject') {
        // Get comercio_id first
        const { data: profile } = await adminClient
          .from('profiles')
          .select('comercio_id')
          .eq('user_id', target_user_id)
          .single();

        // Delete membership, profile, comercio, then auth user
        await adminClient.from('comercio_miembros').delete().eq('user_id', target_user_id);
        await adminClient.from('user_roles').delete().eq('user_id', target_user_id);
        await adminClient.from('profiles').delete().eq('user_id', target_user_id);
        
        if (profile?.comercio_id) {
          await adminClient.from('comercios').delete().eq('id', profile.comercio_id);
        }

        // Delete auth user
        await adminClient.auth.admin.deleteUser(target_user_id);

        return new Response(JSON.stringify({ success: true, message: 'Solicitud rechazada y eliminada' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Platform admin error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
