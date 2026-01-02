import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

interface VerifyResponse {
  isAdmin: boolean;
  isApproved: boolean;
  userId?: string;
  error?: string;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async (currentSession: Session | null) => {
      if (!currentSession?.user) {
        setSession(null);
        setLoading(false);
        return;
      }

      setSession(currentSession);

      // Server-side verification of permissions
      try {
        const { data, error } = await supabase.functions.invoke<VerifyResponse>('verify-admin');
        
        if (error) {
          console.error("Server-side verification error:", error);
          // Fallback to client-side check if server is unavailable
          await fallbackClientCheck(currentSession.user.id);
        } else if (data) {
          console.log("Server verification result:", data);
          setIsApproved(data.isApproved);
          setIsAdmin(data.isAdmin);
        }
      } catch (err) {
        console.error("Edge function call failed, using fallback:", err);
        await fallbackClientCheck(currentSession.user.id);
      }
      
      setLoading(false);
    };

    const fallbackClientCheck = async (userId: string) => {
      // Fallback: Check if user is approved via RLS-protected query
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_approved")
        .eq("user_id", userId)
        .single();

      setIsApproved(profile?.is_approved ?? false);

      // Fallback: Check if user is admin via RLS-protected query
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const hasAdminRole = roles?.some(r => r.role === "admin") ?? false;
      setIsAdmin(hasAdminRole);
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        checkAuth(session);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAuth(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // If user is not approved and not admin, show pending page
  if (isApproved === false && !isAdmin) {
    return <Navigate to="/pending-approval" replace />;
  }

  // If route requires admin and user is not admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <div key={session.user.id}>{children}</div>;
};

export default ProtectedRoute;
