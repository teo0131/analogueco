import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserCheck, UserX, Shield, User } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  is_approved: boolean;
  created_at: string;
  role: string;
}

const AdminUsuarios = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("No tienes permisos para acceder a esta página");
      navigate("/home");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        role: roles?.find(r => r.user_id === profile.user_id)?.role || "user"
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string, approve: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_approved: approve })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success(approve ? "Usuario aprobado" : "Usuario desaprobado");
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Error al actualizar usuario");
    }
  };

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    try {
      if (currentRole === "admin") {
        // Remove admin role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: "user" })
          .eq("user_id", userId);

        if (error) throw error;
        toast.success("Rol de admin removido");
      } else {
        // Add admin role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: "admin" })
          .eq("user_id", userId);

        if (error) throw error;
        toast.success("Usuario promovido a admin");
      }
      fetchUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Error al actualizar rol");
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">
          Aprueba o rechaza usuarios y gestiona roles de administrador
        </p>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${user.role === "admin" ? "bg-primary/20" : "bg-muted"}`}>
                    {user.role === "admin" ? (
                      <Shield className="h-5 w-5 text-primary" />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">{user.email || "Sin email"}</CardTitle>
                    <CardDescription className="text-xs">
                      Registrado: {new Date(user.created_at).toLocaleDateString("es-CO")}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={user.is_approved ? "default" : "destructive"}>
                    {user.is_approved ? "Aprobado" : "Pendiente"}
                  </Badge>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role === "admin" ? "Admin" : "Usuario"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2 flex-wrap">
                {!user.is_approved ? (
                  <Button
                    size="sm"
                    onClick={() => handleApprove(user.user_id, true)}
                    className="gap-2"
                  >
                    <UserCheck className="h-4 w-4" />
                    Aprobar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApprove(user.user_id, false)}
                    className="gap-2"
                  >
                    <UserX className="h-4 w-4" />
                    Revocar Acceso
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={user.role === "admin" ? "destructive" : "secondary"}
                  onClick={() => handleToggleAdmin(user.user_id, user.role)}
                  className="gap-2"
                >
                  <Shield className="h-4 w-4" />
                  {user.role === "admin" ? "Quitar Admin" : "Hacer Admin"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {users.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No hay usuarios registrados
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminUsuarios;
