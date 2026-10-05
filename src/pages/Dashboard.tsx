import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Logo } from "@/components/brand/Logo";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth?mode=login", { replace: true });
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (!data.session) navigate("/auth?mode=login", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  if (loading) return null;
  const plan = (user?.user_metadata as any)?.plan ?? "—";
  const name = (user?.user_metadata as any)?.full_name ?? user?.email;

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <header className="bg-white border-b border-black/10">
        <div className="max-w-[1200px] mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo variant="mark" className="h-7 w-auto text-[#0A1540]" />
            <span className="font-display text-[#0A1540] text-base tracking-wide">ANALOGUECO</span>
          </div>
          <button
            onClick={handleLogout}
            className="font-mono text-[10px] uppercase tracking-widest text-black/60 hover:text-black"
          >
            Log out
          </button>
        </div>
      </header>
      <main className="max-w-[1200px] mx-auto px-8 py-16">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-black/40 mb-4">
          Dashboard
        </p>
        <h1 className="font-display text-4xl text-black mb-2">Hello, {name}</h1>
        <p className="text-black/60 mb-12">Welcome to your operational intelligence.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-black/10 p-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-black/40 mb-2">
              Plan
            </p>
            <p className="font-display text-2xl text-black capitalize">{plan}</p>
          </div>
          <div className="bg-white rounded-2xl border border-black/10 p-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-black/40 mb-2">
              Active cameras
            </p>
            <p className="font-display text-2xl text-black">0</p>
          </div>
          <div className="bg-white rounded-2xl border border-black/10 p-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-black/40 mb-2">
              Alerts today
            </p>
            <p className="font-display text-2xl text-black">0</p>
          </div>
        </div>

        <div className="mt-12 bg-white rounded-2xl border border-black/10 p-8">
          <h2 className="font-display text-2xl text-black mb-2">Next steps</h2>
          <p className="text-black/60 text-sm mb-6">
            Your account is ready. The payment gateway will be connected in a future phase to activate
            your subscription and start the installation.
          </p>
          <a
            href="mailto:hola@analogueco.com"
            className="inline-block bg-[#1E5EFF] text-white font-mono text-xs uppercase tracking-widest px-6 py-3 rounded-md hover:bg-[#0D46CC] transition-colors"
          >
            Coordinate installation
          </a>
        </div>
      </main>
    </div>
  );
}