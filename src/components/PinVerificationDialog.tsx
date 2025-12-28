import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Lock, AlertTriangle } from "lucide-react";

interface PinVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export const PinVerificationDialog = ({
  open,
  onOpenChange,
  onSuccess,
  title = "Verificación de Seguridad",
  description = "Ingresa tu PIN de 4 dígitos para continuar",
}: PinVerificationDialogProps) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPin("");
      setError("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleVerify = async () => {
    if (pin.length !== 4) {
      setError("El PIN debe tener 4 dígitos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Usuario no autenticado");
        return;
      }

      const { data: settings, error: fetchError } = await supabase
        .from("user_settings")
        .select("pin_seguridad")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) {
        setError("Error al verificar PIN");
        return;
      }

      if (!settings?.pin_seguridad) {
        setError("No tienes un PIN configurado. Configúralo en ajustes.");
        return;
      }

      if (settings.pin_seguridad === pin) {
        onSuccess();
        onOpenChange(false);
      } else {
        setError("PIN incorrecto");
        setPin("");
        inputRef.current?.focus();
      }
    } catch (err) {
      setError("Error al verificar PIN");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pin">PIN de Seguridad</Label>
            <Input
              ref={inputRef}
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setPin(value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              className="text-center text-2xl tracking-widest"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleVerify} disabled={loading || pin.length !== 4}>
            {loading ? "Verificando..." : "Verificar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
