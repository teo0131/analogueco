import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, LogOut, CheckCircle2, XCircle, Delete, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import analoguecoIcon from "@/assets/analogueco-icon.png";

type FeedbackState = {
  type: "success" | "error";
  message: string;
  nombre?: string;
  cargo?: string;
  tipo?: string;
} | null;

export default function Kiosko() {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve owner user id (the business owner whose employees are tracked)
  useEffect(() => {
    const resolveOwner = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setOwnerUserId(user.id);
    };
    resolveOwner();
  }, []);

  // Clock update
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-clear feedback after 4s
  useEffect(() => {
    if (feedback) {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => {
        setFeedback(null);
        setPin("");
      }, 4000);
    }
    return () => { if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current); };
  }, [feedback]);

  const handleDigit = (d: string) => {
    if (pin.length < 6) setPin(prev => prev + d);
  };

  const handleDelete = () => setPin(prev => prev.slice(0, -1));
  const handleClear = () => setPin("");

  const handleClock = async (tipo: "entrada" | "salida") => {
    if (!pin || pin.length < 3) return;
    if (!ownerUserId) {
      setFeedback({ type: "error", message: "Sesión no válida. Recarga la página." });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("kiosk-clockin", {
        body: { pin, tipo, owner_user_id: ownerUserId },
      });

      if (error || data?.error) {
        setFeedback({ type: "error", message: data?.error || "Error al registrar" });
      } else {
        setFeedback({
          type: "success",
          message: tipo === "entrada" ? "¡Bienvenido! Entrada registrada" : "¡Hasta luego! Salida registrada",
          nombre: `${data.empleado.nombre} ${data.empleado.apellido}`,
          cargo: data.empleado.cargo || "",
          tipo,
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Error de conexión. Intenta de nuevo." });
    } finally {
      setLoading(false);
    }
  };

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--sidebar-background)) 100%)" }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <img src={analoguecoIcon} alt="AnalogueCo" className="h-10 w-10 object-contain" style={{ mixBlendMode: "screen" }} />
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Control de</p>
          <p className="text-xl font-bold tracking-tight">Asistencia</p>
        </div>
      </div>

      {/* Time display */}
      <div className="text-center mb-8">
        <p className="text-5xl font-mono font-bold tracking-tight text-foreground">
          {format(currentTime, "HH:mm")}
        </p>
        <p className="text-sm text-muted-foreground mt-1 capitalize">
          {format(currentTime, "EEEE, d 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      {/* Feedback overlay */}
      {feedback ? (
        <div className={`w-full max-w-sm rounded-2xl p-8 text-center border-2 transition-all ${
          feedback.type === "success"
            ? "bg-card border-primary/50"
            : "bg-card border-destructive/50"
        }`}>
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-primary" />
          ) : (
            <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          )}
          {feedback.nombre && (
            <p className="text-2xl font-bold mb-1">{feedback.nombre}</p>
          )}
          {feedback.cargo && (
            <p className="text-sm text-muted-foreground mb-3">{feedback.cargo}</p>
          )}
          <p className={`text-base font-medium ${
            feedback.type === "success" ? "text-green-300" : "text-red-300"
          }`}>
            {feedback.message}
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            {format(currentTime, "HH:mm:ss")}
          </p>
        </div>
      ) : (
        <div className="w-full max-w-sm">
          {/* PIN display */}
          <div className="flex items-center justify-center gap-3 mb-6 h-14">
            <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    i < pin.length
                      ? "border-primary bg-primary/20"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {i < pin.length && (
                    <div className="w-3 h-3 rounded-full bg-primary" />
                  )}
                </div>
              ))}
            </div>
            <button onClick={handleDelete} className="text-muted-foreground hover:text-foreground transition-colors">
              <Delete className="w-5 h-5" />
            </button>
          </div>

          <p className="text-center text-sm text-muted-foreground mb-4">
            Ingresa tu PIN de empleado
          </p>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {digits.map((d) => (
              <button
                key={d}
                onClick={() => handleDigit(d)}
                disabled={loading}
                className={`h-16 rounded-xl text-2xl font-semibold border border-border transition-all
                  bg-card hover:bg-primary/10 hover:border-primary/50 active:scale-95
                  ${d === "0" ? "col-start-2" : ""}`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              className="h-14 text-base gap-2 bg-green-600 hover:bg-green-700 text-white"
              disabled={pin.length < 3 || loading}
              onClick={() => handleClock("entrada")}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              Entrada
            </Button>
            <Button
              size="lg"
              variant="destructive"
              className="h-14 text-base gap-2"
              disabled={pin.length < 3 || loading}
              onClick={() => handleClock("salida")}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
              Salida
            </Button>
          </div>

          <button onClick={handleClear} className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
            Borrar todo
          </button>
        </div>
      )}

      <p className="mt-8 text-xs text-muted-foreground">
        Si no tienes PIN, solicítalo a tu supervisor
      </p>
    </div>
  );
}
