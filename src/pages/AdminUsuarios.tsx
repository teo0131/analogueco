import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserCheck, UserX, Crown, Shield, User, Copy, RefreshCw, Users } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

type ComercioRole = "owner" | "admin" | "user";

interface TeamMember {
  id: string;
  user_id: string;
  email: string | null;
  is_approved: boolean;
  created_at: string;
  rol: ComercioRole;
}

const roleBadge = (role: ComercioRole) => {
  if (role === "owner") return <Badge className="bg-yellow-500 text-white border-yellow-600 gap-1"><Crown className="h-3 w-3" />Dueño</Badge>;
  if (role === "admin") return <Badge className="bg-blue-600 text-white border-blue-700 gap-1"><Shield className="h-3 w-3" />Admin</Badge>;
  return <Badge variant="secondary" className="gap-1"><User className="h-3 w-3" />Empleado</Badge>;
};

const AdminUsuarios = () => {
  const navigate = useNavigate();
  const { isOwner, isAdmin, loading: roleLoading, comercioId } = useUserRole();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [comercioName, setComercioName] = useState("");

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("No tienes permisos para acceder a esta página");
      navigate("/home");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin && comercioId) {
      fetchTeam();
      fetchComercio();
    }
  }, [isAdmin, comercioId]);

  const fetchComercio = async () => {
    if (!comercioId) return;
    const { data } = await supabase
      .from("comercios")
      .select("nombre, invite_code")
      .eq("id", comercioId)
      .single();
    if (data) {
      setInviteCode(data.invite_code || "");
      setComercioName(data.nombre || "");
    }
  };

  const fetchTeam = async () => {
    if (!comercioId) return;
    try {
      // Get comercio members
      const { data: miembros, error: miembrosError } = await supabase
        .from("comercio_miembros")
        .select("id, user_id, rol, created_at")
        .eq("comercio_id", comercioId)
        .order("created_at");

      if (miembrosError) throw miembrosError;

      // Get profiles for these members
      const userIds = miembros?.map(m => m.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, is_approved")
        .in("user_id", userIds);

      const team: TeamMember[] = (miembros || []).map(m => {
        const profile = profiles?.find(p => p.user_id === m.user_id);
        return {
          id: m.id,
          user_id: m.user_id,
          email: profile?.email ?? null,
          is_approved: profile?.is_approved ?? false,
          created_at: m.created_at,
          rol: m.rol as ComercioRole,
        };
      });

      setMembers(team);
    } catch (error) {
      console.error("Error fetching team:", error);
      toast.error("Error al cargar equipo");
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
      fetchTeam();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Error al actualizar usuario");
    }
  };

  const handleRoleChange = async (memberId: string, currentRole: ComercioRole, newRole: ComercioRole) => {
    if (!isOwner) {
      toast.error("Solo el dueño puede cambiar roles");
      return;
    }
    if (currentRole === "owner") {
      toast.error("No puedes cambiar el rol del dueño");
      return;
    }
    try {
      const { error } = await supabase
        .from("comercio_miembros")
        .update({ rol: newRole })
        .eq("id", memberId);

      if (error) throw error;
      toast.success(`Rol actualizado a ${newRole}`);
      fetchTeam();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Error al actualizar rol");
    }
  };

  const handleRemoveMember = async (memberId: string, memberRole: ComercioRole) => {
    if (!isOwner) {
      toast.error("Solo el dueño puede eliminar miembros");
      return;
    }
    if (memberRole === "owner") {
      toast.error("No puedes eliminar al dueño");
      return;
    }
    try {
      const { error } = await supabase
        .from("comercio_miembros")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
      toast.success("Miembro eliminado del comercio");
      fetchTeam();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Error al eliminar miembro");
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success("Código copiado al portapapeles");
  };

  const regenerateInviteCode = async () => {
    if (!isOwner || !comercioId) return;
    const newCode = Math.random().toString(36).substring(2, 10);
    const { error } = await supabase
      .from("comercios")
      .update({ invite_code: newCode })
      .eq("id", comercioId);

    if (error) {
      toast.error("Error al regenerar código");
    } else {
      setInviteCode(newCode);
      toast.success("Código de invitación regenerado");
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
        <h1 className="text-2xl font-bold">Equipo — {comercioName}</h1>
        <p className="text-muted-foreground">
          {isOwner
            ? "Invita empleados, asigna roles y gestiona tu equipo."
            : "Visualiza los miembros de tu comercio."}
        </p>
      </div>

      {/* Invite Code Section */}
      {isOwner && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5" />
              Código de Invitación
            </CardTitle>
            <CardDescription>
              Comparte este código con tus empleados para que se registren y se unan a tu comercio automáticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                value={inviteCode}
                readOnly
                className="font-mono text-lg tracking-widest text-center max-w-xs"
              />
              <Button variant="outline" size="icon" onClick={copyInviteCode} title="Copiar">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={regenerateInviteCode} title="Regenerar código">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role legend */}
      <div className="flex gap-4 flex-wrap text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5"><Crown className="h-3.5 w-3.5 text-yellow-500" /><strong>Dueño</strong> — control total</span>
        <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-blue-500" /><strong>Admin</strong> — operación + supervisión</span>
        <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /><strong>Empleado</strong> — POS, caja y turnos</span>
      </div>

      <div className="grid gap-4">
        {members.map((member) => (
          <Card key={member.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    member.rol === "owner" ? "bg-yellow-100 dark:bg-yellow-900/30" :
                    member.rol === "admin" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-muted"
                  }`}>
                    {member.rol === "owner" ? <Crown className="h-5 w-5 text-yellow-600" /> :
                     member.rol === "admin" ? <Shield className="h-5 w-5 text-blue-600" /> :
                     <User className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div>
                    <CardTitle className="text-base">{member.email || "Sin email"}</CardTitle>
                    <CardDescription className="text-xs">
                      Desde: {new Date(member.created_at).toLocaleDateString("es-CO")}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={member.is_approved ? "default" : "destructive"}>
                    {member.is_approved ? "Activo" : "Pendiente"}
                  </Badge>
                  {roleBadge(member.rol)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2 flex-wrap items-center">
                {/* Approve / revoke access */}
                {isOwner && !member.is_approved && (
                  <Button size="sm" onClick={() => handleApprove(member.user_id, true)} className="gap-2">
                    <UserCheck className="h-4 w-4" />Aprobar
                  </Button>
                )}
                {isOwner && member.is_approved && member.rol !== "owner" && (
                  <Button size="sm" variant="outline" onClick={() => handleApprove(member.user_id, false)} className="gap-2">
                    <UserX className="h-4 w-4" />Revocar
                  </Button>
                )}

                {/* Role selector — owner only */}
                {isOwner && member.rol !== "owner" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Rol:</span>
                    <Select
                      value={member.rol}
                      onValueChange={(val) => handleRoleChange(member.id, member.rol, val as ComercioRole)}
                    >
                      <SelectTrigger className="h-8 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Empleado</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Remove member */}
                {isOwner && member.rol !== "owner" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemoveMember(member.id, member.rol)}
                    className="gap-2"
                  >
                    Eliminar
                  </Button>
                )}

                {member.rol === "owner" && (
                  <span className="text-xs text-muted-foreground italic">Dueño del comercio</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {members.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No hay miembros en el equipo
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminUsuarios;
