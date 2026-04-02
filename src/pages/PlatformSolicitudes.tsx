import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Shield, Loader2, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Solicitud {
  user_id: string;
  email: string;
  comercio_id: string | null;
  comercio_nombre: string | null;
  created_at: string;
}

const PlatformSolicitudes = () => {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('platform-admin-actions', {
        method: 'GET',
      });
      if (error) throw error;
      setSolicitudes(data?.solicitudes || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "No se pudieron cargar las solicitudes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSolicitudes(); }, []);

  const handleAction = async (userId: string, action: 'approve' | 'reject') => {
    setActionLoading(userId);
    try {
      const { data, error } = await supabase.functions.invoke('platform-admin-actions', {
        body: { target_user_id: userId, action },
      });
      if (error) throw error;
      toast({ title: "Éxito", description: data?.message || "Acción completada" });
      fetchSolicitudes();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "No se pudo completar la acción", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Solicitudes de Acceso</h1>
            <p className="text-muted-foreground text-sm">Panel Super-Admin · AnalogueCo Platform</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSolicitudes} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Comercios Pendientes de Aprobación
            <Badge variant="secondary">{solicitudes.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : solicitudes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay solicitudes pendientes</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nombre del Negocio</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitudes.map((s) => (
                  <TableRow key={s.user_id}>
                    <TableCell className="font-medium">{s.email}</TableCell>
                    <TableCell>{s.comercio_nombre || "Sin nombre"}</TableCell>
                    <TableCell>{new Date(s.created_at).toLocaleDateString('es-CO')}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleAction(s.user_id, 'approve')}
                        disabled={actionLoading === s.user_id}
                      >
                        {actionLoading === s.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        )}
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAction(s.user_id, 'reject')}
                        disabled={actionLoading === s.user_id}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rechazar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformSolicitudes;
