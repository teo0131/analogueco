import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const usePlatformAdmin = () => {
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { setLoading(false); return; }

        const { data } = await supabase
          .from('platform_admins')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        setIsPlatformAdmin(!!data);
      } catch {
        setIsPlatformAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, []);

  return { isPlatformAdmin, loading };
};
