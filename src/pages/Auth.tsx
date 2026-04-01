import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Box, Lock, Store, Users } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pinSeguridad, setPinSeguridad] = useState("");
  const [storeName, setStoreName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [signupMode, setSignupMode] = useState<"new" | "invite">("new");

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Por favor ingresa tu correo electrónico");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Se ha enviado un enlace de recuperación a tu correo");
      setShowForgotPassword(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("¡Bienvenido!");
      navigate("/");
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (signupMode === "new") {
      if (pinSeguridad.length !== 4 || !/^\d{4}$/.test(pinSeguridad)) {
        toast.error("El PIN debe ser de exactamente 4 dígitos numéricos");
        return;
      }
      if (!storeName.trim()) {
        toast.error("Por favor ingresa el nombre de tu negocio");
        return;
      }
    }

    if (signupMode === "invite" && !inviteCode.trim()) {
      toast.error("Por favor ingresa el código de invitación");
      return;
    }

    setLoading(true);
    
    const metadata: Record<string, string> = {};
    if (signupMode === "invite") {
      metadata.invite_code = inviteCode.trim();
    } else {
      metadata.store_name = storeName.trim();
    }

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: metadata,
      },
    });

    if (signupError) {
      if (signupError.message.includes("already registered")) {
        toast.error("Este correo ya está registrado. Intenta iniciar sesión.");
      } else {
        toast.error(signupError.message);
      }
      setLoading(false);
      return;
    }

    // Save PIN for new business owners
    if (signupData.user && signupMode === "new" && pinSeguridad) {
      const { error: settingsError } = await supabase
        .from("user_settings")
        .upsert({
          user_id: signupData.user.id,
          pin_seguridad: pinSeguridad,
        }, { onConflict: "user_id" });

      if (settingsError) {
        console.error("Error saving PIN:", settingsError);
      }
    }

    if (signupMode === "invite") {
      toast.success("¡Te has unido al comercio! Iniciando sesión...");
    } else {
      toast.success("¡Comercio creado exitosamente! Revisa tu correo para confirmar.");
    }
    navigate("/");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-primary rounded-xl flex items-center justify-center">
              <Box className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">AnalogueCo</CardTitle>
          <CardDescription>
            Ingresa o crea tu cuenta para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              {showForgotPassword ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Correo electrónico</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Te enviaremos un enlace para restablecer tu contraseña.
                  </p>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Enviando..." : "Enviar enlace de recuperación"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    Volver al inicio de sesión
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Correo electrónico</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Cargando..." : "Iniciar Sesión"}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm text-muted-foreground"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    ¿Olvidaste tu contraseña?
                  </Button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="signup">
              {/* Mode selector */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Button
                  type="button"
                  variant={signupMode === "new" ? "default" : "outline"}
                  className="gap-2 h-auto py-3"
                  onClick={() => setSignupMode("new")}
                >
                  <Store className="h-4 w-4" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Nuevo Comercio</div>
                    <div className="text-xs opacity-70">Soy dueño</div>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={signupMode === "invite" ? "default" : "outline"}
                  className="gap-2 h-auto py-3"
                  onClick={() => setSignupMode("invite")}
                >
                  <Users className="h-4 w-4" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Unirme</div>
                    <div className="text-xs opacity-70">Tengo código</div>
                  </div>
                </Button>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Correo electrónico</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                  />
                </div>

                {signupMode === "new" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="signup-store" className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        Nombre del Negocio
                      </Label>
                      <Input
                        id="signup-store"
                        type="text"
                        placeholder="Ej: Mi Restaurante"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-pin" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        PIN de Seguridad (4 dígitos)
                      </Label>
                      <Input
                        id="signup-pin"
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        placeholder="••••"
                        value={pinSeguridad}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          setPinSeguridad(value);
                        }}
                        disabled={loading}
                        required
                        className="text-center text-xl tracking-widest"
                      />
                      <p className="text-xs text-muted-foreground">
                        Este PIN se usará para acciones administrativas
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="signup-invite" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Código de Invitación
                    </Label>
                    <Input
                      id="signup-invite"
                      type="text"
                      placeholder="Ej: a1b2c3d4"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      disabled={loading}
                      required
                      className="text-center text-lg tracking-widest font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      Pide este código al dueño del comercio
                    </p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Cargando..." : signupMode === "new" ? "Crear Comercio" : "Unirme al Comercio"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
