import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "@/hooks/use-toast";
import { Logo } from "@/components/brand/Logo";

const planLabels: Record<string, string> = {
  starter: "Starter — COP 510,000 / month",
  growth: "Growth — COP 990,000 / month",
  scale: "Scale — COP 1,890,000 / month",
  enterprise: "Enterprise — Custom",
};

export default function Auth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialMode = params.get("mode") === "login" ? "login" : "signup";
  const plan = params.get("plan") || "";
  const [mode, setMode] = useState<"signup" | "login">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/dashboard", { replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate("/dashboard", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: name, plan },
          },
        });
        if (error) throw error;
        toast({
          title: "Account created",
          description: "Check your email to confirm your account.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message ?? "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth?mode=login`,
    });
    if (result.error) {
      toast({
        title: "Error with Google",
        description: (result.error as Error).message ?? "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: "linear-gradient(160deg, #0A1540 0%, #1533B0 65%, #1E5EFF 100%)" }}
    >
      <Link to="/" className="flex items-center gap-3 mb-10">
        <Logo variant="mark" className="h-8 w-auto text-white" />
        <span className="font-display text-white text-lg tracking-wide">ANALOGUECO</span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl">
        <h1 className="font-display text-3xl text-black mb-2">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-black/60 text-sm mb-6">
          {mode === "signup"
            ? "Start seeing the invisible in your operation."
            : "Log in to access your dashboard."}
        </p>

        {plan && planLabels[plan] && (
          <div className="mb-6 p-3 bg-[#1E5EFF]/10 border border-[#1E5EFF]/30 rounded-md">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#1E5EFF] mb-1">
              Selected plan
            </p>
            <p className="text-sm font-semibold text-black">{planLabels[plan]}</p>
          </div>
        )}

        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 border border-black/15 rounded-md py-3 text-sm font-medium text-black hover:bg-black/5 transition-colors mb-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-black/40 font-mono uppercase tracking-widest">or</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-black/15 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#1E5EFF]"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-black/15 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#1E5EFF]"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border border-black/15 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#1E5EFF]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1E5EFF] text-white font-mono text-xs uppercase tracking-widest py-3 rounded-md hover:bg-[#0D46CC] transition-colors disabled:opacity-50"
          >
            {loading ? "Processing..." : mode === "signup" ? "Create account" : "Log in"}
          </button>
        </form>

        <p className="text-center text-sm text-black/60 mt-6">
          {mode === "signup" ? "Already have an account?" : "Don't have an account yet?"}{" "}
          <button
            onClick={() => setMode(mode === "signup" ? "login" : "signup")}
            className="text-[#1E5EFF] font-semibold hover:underline"
          >
            {mode === "signup" ? "Log in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}