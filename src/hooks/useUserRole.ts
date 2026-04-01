import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserRoleData {
  isAdmin: boolean;
  isOwner: boolean;
  isApproved: boolean;
  loading: boolean;
  userId: string | null;
  comercioId: string | null;
  comercioRole: string | null;
}

interface VerifyResponse {
  isAdmin: boolean;
  isOwner: boolean;
  isApproved: boolean;
  comercioId?: string;
  comercioRole?: string;
  userId?: string;
  error?: string;
}

export const useUserRole = (): UserRoleData => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [comercioId, setComercioId] = useState<string | null>(null);
  const [comercioRole, setComercioRole] = useState<string | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setLoading(false);
          return;
        }

        setUserId(session.user.id);

        try {
          const { data, error } = await supabase.functions.invoke<VerifyResponse>('verify-admin');
          
          if (error) {
            console.error("Server-side verification error:", error);
            await fallbackClientCheck(session.user.id);
          } else if (data) {
            setIsApproved(data.isApproved);
            setIsAdmin(data.isAdmin);
            setIsOwner(data.isOwner ?? false);
            setComercioId(data.comercioId ?? null);
            setComercioRole(data.comercioRole ?? null);
          }
        } catch (err) {
          console.error("Edge function call failed, using fallback:", err);
          await fallbackClientCheck(session.user.id);
        }
      } catch (error) {
        console.error("Error checking user role:", error);
      } finally {
        setLoading(false);
      }
    };

    const fallbackClientCheck = async (uid: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_approved, comercio_id")
        .eq("user_id", uid)
        .single();

      setIsApproved(profile?.is_approved ?? false);
      setComercioId(profile?.comercio_id ?? null);

      // Check comercio_miembros for role
      const { data: membership } = await supabase
        .from("comercio_miembros")
        .select("rol, comercio_id")
        .eq("user_id", uid)
        .limit(1)
        .single();

      if (membership) {
        const role = membership.rol;
        setComercioRole(role);
        setComercioId(membership.comercio_id);
        setIsOwner(role === "owner");
        setIsAdmin(role === "owner" || role === "admin");
      } else {
        // Fallback to user_roles for backward compatibility
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", uid);

        const hasOwnerRole = roles?.some(r => r.role === "owner") ?? false;
        const hasAdminRole = hasOwnerRole || (roles?.some(r => r.role === "admin") ?? false);
        setIsOwner(hasOwnerRole);
        setIsAdmin(hasAdminRole);
      }
    };

    checkUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isAdmin, isOwner, isApproved, loading, userId, comercioId, comercioRole };
};
