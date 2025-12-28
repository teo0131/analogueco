import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Lock, Store, Save, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ConfiguracionCuenta() {
  const queryClient = useQueryClient();
  const [storeName, setStoreName] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Fetch user settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["user-settings-config"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      setUserEmail(user.email || "");

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      setStoreName(settings.store_name || "");
    }
  }, [settings]);

  // Mutation para actualizar nombre de tienda
  const updateStoreNameMutation = useMutation({
    mutationFn: async (newStoreName: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          store_name: newStoreName,
        }, { onConflict: "user_id" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings-config"] });
      toast.success("Nombre de tienda actualizado");
    },
    onError: () => {
      toast.error("Error al actualizar nombre de tienda");
    },
  });

  // Mutation para actualizar PIN
  const updatePinMutation = useMutation({
    mutationFn: async ({ currentPin, newPin }: { currentPin: string; newPin: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Verificar PIN actual si existe
      const { data: currentSettings } = await supabase
        .from("user_settings")
        .select("pin_seguridad")
        .eq("user_id", user.id)
        .maybeSingle();

      if (currentSettings?.pin_seguridad) {
        if (currentPin !== currentSettings.pin_seguridad) {
          throw new Error("PIN actual incorrecto");
        }
      }

      // Actualizar PIN
      const { error } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          pin_seguridad: newPin,
        }, { onConflict: "user_id" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings-config"] });
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      toast.success("PIN de seguridad actualizado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar PIN");
    },
  });

  const handleSaveStoreName = () => {
    if (!storeName.trim()) {
      toast.error("El nombre de tienda no puede estar vacío");
      return;
    }
    updateStoreNameMutation.mutate(storeName);
  };

  const handleSavePin = () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast.error("El nuevo PIN debe ser de 4 dígitos numéricos");
      return;
    }

    if (newPin !== confirmPin) {
      toast.error("Los PINs no coinciden");
      return;
    }

    if (settings?.pin_seguridad && !currentPin) {
      toast.error("Debes ingresar tu PIN actual");
      return;
    }

    updatePinMutation.mutate({ currentPin, newPin });
  };

  const hasPin = !!settings?.pin_seguridad;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8 text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración de Cuenta</h1>
        <p className="text-muted-foreground">
          Administra tu perfil y configuración de seguridad
        </p>
      </div>

      {/* Información de cuenta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información de Cuenta
          </CardTitle>
          <CardDescription>
            Tu información básica de cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Correo Electrónico</Label>
            <Input value={userEmail} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">
              El correo electrónico no se puede cambiar
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Nombre de tienda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Nombre de Tienda
          </CardTitle>
          <CardDescription>
            Este nombre aparecerá en tus facturas y reportes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store-name">Nombre de tu negocio</Label>
            <Input
              id="store-name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Mi Tienda"
            />
          </div>
          <Button
            onClick={handleSaveStoreName}
            disabled={updateStoreNameMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateStoreNameMutation.isPending ? "Guardando..." : "Guardar Nombre"}
          </Button>
        </CardContent>
      </Card>

      {/* PIN de seguridad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            PIN de Seguridad
          </CardTitle>
          <CardDescription>
            El PIN se usa para eliminar órdenes e ingresos de inventario
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
            {hasPin ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm">PIN configurado</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <span className="text-sm">No tienes un PIN configurado</span>
              </>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <p className="text-sm font-medium">
              {hasPin ? "Cambiar PIN" : "Configurar PIN"}
            </p>

            {hasPin && (
              <div className="space-y-2">
                <Label htmlFor="current-pin">PIN Actual</Label>
                <div className="relative">
                  <Input
                    id="current-pin"
                    type={showCurrentPin ? "text" : "password"}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowCurrentPin(!showCurrentPin)}
                  >
                    {showCurrentPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-pin">Nuevo PIN (4 dígitos)</Label>
              <div className="relative">
                <Input
                  id="new-pin"
                  type={showNewPin ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowNewPin(!showNewPin)}
                >
                  {showNewPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-pin">Confirmar Nuevo PIN</Label>
              <Input
                id="confirm-pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
              />
              {confirmPin && confirmPin !== newPin && (
                <p className="text-xs text-destructive">Los PINs no coinciden</p>
              )}
              {confirmPin && confirmPin === newPin && newPin.length === 4 && (
                <p className="text-xs text-green-600">Los PINs coinciden</p>
              )}
            </div>

            <Button
              onClick={handleSavePin}
              disabled={updatePinMutation.isPending || newPin.length !== 4 || newPin !== confirmPin}
            >
              <Lock className="h-4 w-4 mr-2" />
              {updatePinMutation.isPending ? "Guardando..." : hasPin ? "Cambiar PIN" : "Configurar PIN"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}