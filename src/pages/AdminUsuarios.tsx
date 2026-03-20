import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserCheck, UserX, Crown, Shield, User } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";

type AppRole = "owner" | "admin" | "user";

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  is_approved: boolean;
  created_at: string;
  role: AppRole;
}

const roleBadge = (role: AppRole) => {
  if (role === "owner") return <Badge className="bg-yellow-500 text-white border-yellow-600 gap-1"><Crown className="h-3 w-3" />Owner</Badge>;
  if (role === "admin") return <Badge className="bg-blue-600 text-white border-blue-700 gap-1"><Shield className="h-3 w-3" />Admin</Badge>;
  return <Badge variant="secondary" className="gap-1"><User className="h-3 w-3" />Usuario</Badge>;
};

const AdminUsuarios = () => {
  const navigate = useNavigate();
  const { isOwner, isAdmin, loading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("No tienes permisos para acceder a esta página");
      navigate("/home");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchUsers();
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
        role: (roles?.find(r => r.user_id === profile.user_id)?.role ?? "user") as AppRole,
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
      toast.success(approve ? "Usuario aprobado" : "Acceso revocado");
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Error al actualizar usuario");
    }
  };

  const handleRoleChange = async (userId: string, currentRole: AppRole, newRole: AppRole) => {
    if (!isOwner) {
      toast.error("Solo el Owner puede cambiar roles");
      return;
    }
    // Prevent downgrading another owner
    if (currentRole === "owner" && newRole !== "owner") {
      toast.error("No puedes cambiar el rol de otro Owner");
      return;
    }
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;
      toast.success(`Rol actualizado a ${newRole}`);
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

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">
          {isOwner
            ? "Aprueba usuarios, asigna roles y gestiona accesos. Solo el Owner puede cambiar roles."
            : "Visualiza usuarios y aprueba o revoca accesos."}
        </p>
      </div>

      {/* Role legend */}
      <div className="flex gap-4 flex-wrap text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5"><Crown className="h-3.5 w-3.5 text-yellow-500" /><strong>Owner</strong> — acceso total, gestiona roles</span>
        <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-blue-500" /><strong>Admin</strong> — operación + supervisión</span>
        <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /><strong>Usuario</strong> — POS, caja y turnos</span>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    user.role === "owner" ? "bg-yellow-100 dark:bg-yellow-900/30" :
                    user.role === "admin" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-muted"
                  }`}>
                    {user.role === "owner" ? <Crown className="h-5 w-5 text-yellow-600" /> :
                     user.role === "admin" ? <Shield className="h-5 w-5 text-blue-600" /> :
                     <User className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div>
                    <CardTitle className="text-base">{user.email || "Sin email"}</CardTitle>
                    <CardDescription className="text-xs">
                      Registrado: {new Date(user.created_at).toLocaleDateString("es-CO")}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={user.is_approved ? "default" : "destructive"}>
                    {user.is_approved ? "Aprobado" : "Pendiente"}
                  </Badge>
                  {roleBadge(user.role)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2 flex-wrap items-center">
                {/* Approve / revoke access */}
                {!user.is_approved ? (
                  <Button size="sm" onClick={() => handleApprove(user.user_id, true)} className="gap-2">
                    <UserCheck className="h-4 w-4" />Aprobar
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => handleApprove(user.user_id, false)} className="gap-2">
                    <UserX className="h-4 w-4" />Revocar Acceso
                  </Button>
                )}

                {/* Role selector — owner only, and can't demote another owner */}
                {isOwner && user.role !== "owner" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Rol:</span>
                    <Select
                      value={user.role}
                      onValueChange={(val) => handleRoleChange(user.user_id, user.role, val as AppRole)}
                    >
                      <SelectTrigger className="h-8 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuario</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Owner badge — can't be changed */}
                {isOwner && user.role === "owner" && (
                  <span className="text-xs text-muted-foreground italic">Rol Owner no modificable</span>
                )}
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
