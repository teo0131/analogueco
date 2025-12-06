import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserRoleData {
  isAdmin: boolean;
  isApproved: boolean;
  loading: boolean;
  userId: string | null;
}

export const useUserRole = (): UserRoleData => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setLoading(false);
          return;
        }

        setUserId(session.user.id);

        // Check if user is approved
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_approved")
          .eq("user_id", session.user.id)
          .single();

        setIsApproved(profile?.is_approved ?? false);

        // Check if user is admin
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);

        const hasAdminRole = roles?.some(r => r.role === "admin") ?? false;
        setIsAdmin(hasAdminRole);
      } catch (error) {
        console.error("Error checking user role:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isAdmin, isApproved, loading, userId };
};
