import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, Save, Eye, Palette, Type, Settings2 } from "lucide-react";
import { toast } from "sonner";
import fraternoLogo from "@/assets/fraterno-logo.svg";

// ── Types ─────────────────────────────────────────────────────────────────────
interface MenuItem {
  id: string;
  nombre: string;
  categoria: string | null;
  precio: number;
  descripcion: string | null;
  es_activo: boolean;
}

interface CartaConfig {
  id?: string;
  comercio_id?: string;
  titulo: string;
  subtitulo: string;
  leyenda_pie: string;
  mostrar_logo: boolean;
  logo_url: string | null;
  color_fondo: string;
  color_texto: string;
  color_acento: string;
  color_categorias: string;
  fuente_titulos: string;
  fuente_cuerpo: string;
  estilo: string;
  mostrar_descripcion: boolean;
  mostrar_precio_decimales: boolean;
  simbolo_moneda: string;
  orden_categorias: string[];
  categorias_ocultas: string[];
  items_ocultos: string[];
}

// Default = Fraterno brand language (warm coffee tones, wordmark logo)
const DEFAULT_CONFIG: CartaConfig = {
  titulo: "Fraterno",
  subtitulo: "Café · Pastelería · Cerveza · Pizza",
  leyenda_pie: "Precios en COP · Sujetos a cambio sin previo aviso",
  mostrar_logo: true,
  logo_url: null, // null → render Fraterno wordmark
  color_fondo: "#F2E3C6",        // crema cálido
  color_texto: "#3B2A1F",        // café oscuro
  color_acento: "#7A3B1F",       // café tostado
  color_categorias: "#3B2A1F",
  fuente_titulos: "Playfair Display",
  fuente_cuerpo: "Georgia",
  estilo: "minimal",
  mostrar_descripcion: false,
  mostrar_precio_decimales: false,
  simbolo_moneda: "$",
  orden_categorias: [],
  categorias_ocultas: [],
  items_ocultos: [],
};

const FONT_OPTIONS = ["Inter", "Space Grotesk", "Playfair Display", "Georgia", "Helvetica", "Times New Roman", "Courier New"];

// Normalize for dedup / sort
const norm = (s: string) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export default function CartaImprimible() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [config, setConfig] = useState<CartaConfig>(DEFAULT_CONFIG);
  const [comercioId, setComercioId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // ── Load comercio + items + config ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: m } = await supabase
        .from("comercio_miembros")
        .select("comercio_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!m?.comercio_id) {
        setLoading(false);
        return;
      }
      setComercioId(m.comercio_id);

      const [{ data: itemsData }, { data: cfg }] = await Promise.all([
        supabase
          .from("menu_items")
          .select("id, nombre, categoria, precio, descripcion, es_activo")
          .eq("es_activo", true)
          .gt("precio", 0)
          .order("categoria", { ascending: true }),
        supabase.from("carta_config").select("*").eq("comercio_id", m.comercio_id).maybeSingle(),
      ]);

      setItems((itemsData || []) as MenuItem[]);
      if (cfg) {
        setConfig({
          ...DEFAULT_CONFIG,
          ...cfg,
          orden_categorias: (cfg.orden_categorias as string[]) || [],
          categorias_ocultas: (cfg.categorias_ocultas as string[]) || [],
          items_ocultos: (cfg.items_ocultos as string[]) || [],
        });
      }
      setLoading(false);
    })();
  }, []);

  // ── Group + dedupe items by category ────────────────────────────────────────
  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, { name: string; price: number; desc: string | null; id: string }>>();
    for (const it of items) {
      if (!it.categoria) continue;
      if (config.items_ocultos.includes(it.id)) continue;
      const catKey = it.categoria.trim();
      if (config.categorias_ocultas.includes(catKey)) continue;
      const nameKey = norm(it.nombre);
      const inner = map.get(catKey) || new Map();
      const prev = inner.get(nameKey);
      const price = Number(it.precio);
      if (!prev || price > prev.price) {
        inner.set(nameKey, {
          id: it.id,
          name: it.nombre.trim().replace(/\b\w/g, (c) => c.toUpperCase()),
          price,
          desc: it.descripcion,
        });
      }
      map.set(catKey, inner);
    }

    const cats = Array.from(map.keys()).sort((a, b) => {
      const ia = config.orden_categorias.indexOf(a);
      const ib = config.orden_categorias.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b, "es");
    });

    return cats.map((c) => ({
      categoria: c,
      items: Array.from(map.get(c)!.values()).sort((a, b) => a.name.localeCompare(b.name, "es")),
    }));
  }, [items, config.orden_categorias, config.categorias_ocultas, config.items_ocultos]);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.categoria && set.add(i.categoria.trim()));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [items]);

  // ── Format price ────────────────────────────────────────────────────────────
  const fmt = (p: number) => {
    const v = config.mostrar_precio_decimales ? p.toFixed(2) : Math.round(p).toString();
    return `${config.simbolo_moneda}${v.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!comercioId) return;
    setSaving(true);
    const payload = { ...config, comercio_id: comercioId };
    const { error } = await supabase
      .from("carta_config")
      .upsert(payload, { onConflict: "comercio_id" });
    setSaving(false);
    if (error) toast.error("Error al guardar: " + error.message);
    else toast.success("Carta guardada");
  };

  const handlePrint = () => window.print();

  const update = <K extends keyof CartaConfig>(k: K, v: CartaConfig[K]) =>
    setConfig((c) => ({ ...c, [k]: v }));

  const toggleCatHidden = (cat: string) => {
    setConfig((c) => ({
      ...c,
      categorias_ocultas: c.categorias_ocultas.includes(cat)
        ? c.categorias_ocultas.filter((x) => x !== cat)
        : [...c.categorias_ocultas, cat],
    }));
  };

  if (loading) {
    return <div className="p-8 text-muted-foreground">Cargando carta…</div>;
  }

  return (
    <>
      {/* Print styles: only print the .carta-print area */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .carta-print, .carta-print * { visibility: visible !important; }
          .carta-print { position: absolute; left: 0; top: 0; width: 100%; }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>

      <div className="container mx-auto p-4 lg:p-6 max-w-[1600px]">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── EDITOR PANEL ─────────────────────────────────────────────── */}
          <Card className="lg:w-[380px] p-4 space-y-4 print:hidden h-fit lg:sticky lg:top-4">
            <div>
              <h1 className="text-xl font-bold">Carta Imprimible</h1>
              <p className="text-xs text-muted-foreground">
                Personaliza tu carta con tu lenguaje de marca.
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} size="sm" className="flex-1">
                <Save className="h-4 w-4 mr-1" /> {saving ? "Guardando…" : "Guardar"}
              </Button>
              <Button onClick={handlePrint} size="sm" variant="secondary" className="flex-1">
                <Printer className="h-4 w-4 mr-1" /> Imprimir
              </Button>
            </div>

            <Tabs defaultValue="contenido">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="contenido"><Eye className="h-3.5 w-3.5 mr-1" />Contenido</TabsTrigger>
                <TabsTrigger value="marca"><Palette className="h-3.5 w-3.5 mr-1" />Marca</TabsTrigger>
                <TabsTrigger value="opciones"><Settings2 className="h-3.5 w-3.5 mr-1" />Opciones</TabsTrigger>
              </TabsList>

              {/* CONTENIDO */}
              <TabsContent value="contenido" className="space-y-3 mt-4">
                <div>
                  <Label>Título</Label>
                  <Input value={config.titulo} onChange={(e) => update("titulo", e.target.value)} />
                </div>
                <div>
                  <Label>Subtítulo</Label>
                  <Input
                    value={config.subtitulo}
                    placeholder="Ej: Café · Pastelería · Cerveza"
                    onChange={(e) => update("subtitulo", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Leyenda al pie</Label>
                  <Textarea
                    rows={2}
                    value={config.leyenda_pie}
                    onChange={(e) => update("leyenda_pie", e.target.value)}
                  />
                </div>

                <div className="pt-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Categorías visibles
                  </Label>
                  <div className="space-y-1.5 mt-2 max-h-48 overflow-y-auto pr-1">
                    {allCategories.map((cat) => (
                      <label
                        key={cat}
                        className="flex items-center gap-2 text-sm cursor-pointer p-1.5 rounded hover:bg-muted"
                      >
                        <Switch
                          checked={!config.categorias_ocultas.includes(cat)}
                          onCheckedChange={() => toggleCatHidden(cat)}
                        />
                        <span className="capitalize">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* MARCA */}
              <TabsContent value="marca" className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <Label>Mostrar logo</Label>
                  <Switch
                    checked={config.mostrar_logo}
                    onCheckedChange={(v) => update("mostrar_logo", v)}
                  />
                </div>
                {config.mostrar_logo && (
                  <div>
                    <Label>URL del logo</Label>
                    <Input
                      value={config.logo_url || ""}
                      placeholder="https://…"
                      onChange={(e) => update("logo_url", e.target.value)}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <ColorField label="Fondo" value={config.color_fondo} onChange={(v) => update("color_fondo", v)} />
                  <ColorField label="Texto" value={config.color_texto} onChange={(v) => update("color_texto", v)} />
                  <ColorField label="Acento" value={config.color_acento} onChange={(v) => update("color_acento", v)} />
                  <ColorField label="Categorías" value={config.color_categorias} onChange={(v) => update("color_categorias", v)} />
                </div>

                <div>
                  <Label className="flex items-center gap-1"><Type className="h-3 w-3" /> Fuente títulos</Label>
                  <Select value={config.fuente_titulos} onValueChange={(v) => update("fuente_titulos", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="flex items-center gap-1"><Type className="h-3 w-3" /> Fuente cuerpo</Label>
                  <Select value={config.fuente_cuerpo} onValueChange={(v) => update("fuente_cuerpo", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <PresetButton label="Industrial" onClick={() => setConfig((c) => ({
                    ...c, color_fondo: "#0B0B0B", color_texto: "#F5F5F5",
                    color_acento: "#1E5EFF", color_categorias: "#FFFFFF",
                    fuente_titulos: "Space Grotesk", fuente_cuerpo: "Inter",
                  }))} />
                  <PresetButton label="Café cálido" onClick={() => setConfig((c) => ({
                    ...c, color_fondo: "#FBF7F0", color_texto: "#3B2A1F",
                    color_acento: "#A0522D", color_categorias: "#3B2A1F",
                    fuente_titulos: "Playfair Display", fuente_cuerpo: "Georgia",
                  }))} />
                  <PresetButton label="Minimal blanco" onClick={() => setConfig((c) => ({
                    ...c, color_fondo: "#FFFFFF", color_texto: "#0B0B0B",
                    color_acento: "#0B0B0B", color_categorias: "#0B0B0B",
                    fuente_titulos: "Helvetica", fuente_cuerpo: "Helvetica",
                  }))} />
                  <PresetButton label="Bistró" onClick={() => setConfig((c) => ({
                    ...c, color_fondo: "#1A1212", color_texto: "#F4E9D8",
                    color_acento: "#C8A26A", color_categorias: "#C8A26A",
                    fuente_titulos: "Playfair Display", fuente_cuerpo: "Georgia",
                  }))} />
                </div>
              </TabsContent>

              {/* OPCIONES */}
              <TabsContent value="opciones" className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <Label>Mostrar descripciones</Label>
                  <Switch
                    checked={config.mostrar_descripcion}
                    onCheckedChange={(v) => update("mostrar_descripcion", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Precios con decimales</Label>
                  <Switch
                    checked={config.mostrar_precio_decimales}
                    onCheckedChange={(v) => update("mostrar_precio_decimales", v)}
                  />
                </div>
                <div>
                  <Label>Símbolo de moneda</Label>
                  <Input
                    value={config.simbolo_moneda}
                    onChange={(e) => update("simbolo_moneda", e.target.value)}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* ── PREVIEW ──────────────────────────────────────────────────── */}
          <div className="flex-1 flex justify-center">
            <div
              ref={printRef}
              className="carta-print shadow-2xl"
              style={{
                width: "210mm",
                minHeight: "297mm",
                backgroundColor: config.color_fondo,
                color: config.color_texto,
                fontFamily: `'${config.fuente_cuerpo}', sans-serif`,
                padding: "18mm",
              }}
            >
              {/* Header */}
              <header style={{ borderBottom: `1.5px solid ${config.color_acento}`, paddingBottom: "8mm", marginBottom: "10mm" }}>
                {config.mostrar_logo && config.logo_url && (
                  <img src={config.logo_url} alt="Logo" style={{ maxHeight: "22mm", marginBottom: "4mm" }} />
                )}
                {config.mostrar_logo && !config.logo_url && (
                  // Logo oficial Fraterno (SVG) + subtítulo decorativo
                  <div style={{ textAlign: "center", marginBottom: "6mm" }}>
                    <img
                      src={fraternoLogo}
                      alt={config.titulo}
                      style={{
                        height: "90mm",
                        maxWidth: "90%",
                        margin: "0 auto",
                        display: "block",
                      }}
                    />
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      gap: "4mm", marginTop: "4mm",
                    }}>
                      <span style={{ width: "14mm", height: "0.5px", background: config.color_acento }} />
                      <span style={{
                        fontFamily: `'${config.fuente_cuerpo}', serif`,
                        fontSize: "8pt",
                        letterSpacing: "0.35em",
                        textTransform: "uppercase",
                        color: config.color_acento,
                      }}>
                        {config.subtitulo || "Carta"}
                      </span>
                      <span style={{ width: "14mm", height: "0.5px", background: config.color_acento }} />
                    </div>
                  </div>
                )}
                {!config.mostrar_logo && (
                  <div className="flex justify-between items-end">
                    <div>
                      <h1
                        style={{
                          fontFamily: `'${config.fuente_titulos}', sans-serif`,
                          fontSize: "32pt",
                          fontWeight: 700,
                          letterSpacing: "0.02em",
                          margin: 0,
                          lineHeight: 1,
                        }}
                      >
                        {config.titulo.toUpperCase()}
                      </h1>
                      {config.subtitulo && (
                        <p style={{
                          color: config.color_acento,
                          fontSize: "9pt",
                          fontWeight: 600,
                          letterSpacing: "0.15em",
                          marginTop: "3mm",
                          textTransform: "uppercase",
                        }}>
                          {config.subtitulo}
                        </p>
                      )}
                    </div>
                    <div style={{ fontSize: "8pt", letterSpacing: "0.2em", opacity: 0.6 }}>CARTA</div>
                  </div>
                )}
              </header>

              {/* Body: categories */}
              {grouped.length === 0 && (
                <p style={{ opacity: 0.6 }}>No hay productos para mostrar.</p>
              )}

              {grouped.map((g) => (
                <section key={g.categoria} style={{ marginBottom: "9mm", breakInside: "avoid" }}>
                  <div style={{
                    fontSize: "7pt",
                    color: config.color_acento,
                    letterSpacing: "0.2em",
                    fontWeight: 600,
                    marginBottom: "1mm",
                  }}>
                    — {String(g.items.length).padStart(2, "0")} ÍTEMS
                  </div>
                  <h2
                    style={{
                      fontFamily: `'${config.fuente_titulos}', sans-serif`,
                      fontSize: "14pt",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      color: config.color_categorias,
                      margin: 0,
                      paddingBottom: "2mm",
                      borderBottom: `0.4px solid ${config.color_texto}33`,
                      textTransform: "uppercase",
                    }}
                  >
                    {g.categoria}
                  </h2>
                  <ul style={{ listStyle: "none", padding: 0, margin: "4mm 0 0 0" }}>
                    {g.items.map((it) => (
                      <li
                        key={it.id}
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "3mm",
                          fontSize: "10pt",
                          marginBottom: config.mostrar_descripcion && it.desc ? "3mm" : "1.8mm",
                        }}
                      >
                        <span style={{ flexShrink: 0 }}>{it.name}</span>
                        <span
                          style={{
                            flex: 1,
                            borderBottom: `0.4px dotted ${config.color_texto}55`,
                            transform: "translateY(-2px)",
                          }}
                        />
                        <span style={{ fontWeight: 700, flexShrink: 0 }}>{fmt(it.price)}</span>
                        {config.mostrar_descripcion && it.desc && (
                          <div style={{ width: "100%", fontSize: "8pt", opacity: 0.65, marginTop: "1mm" }}>
                            {it.desc}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}

              {/* Footer */}
              {config.leyenda_pie && (
                <footer style={{
                  marginTop: "10mm",
                  paddingTop: "4mm",
                  borderTop: `0.4px solid ${config.color_texto}33`,
                  fontSize: "7pt",
                  opacity: 0.55,
                  textAlign: "center",
                }}>
                  {config.leyenda_pie}
                </footer>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-1 items-center">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 rounded border border-border cursor-pointer bg-transparent"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="text-xs h-9" />
      </div>
    </div>
  );
}

function PresetButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="text-xs">
      {label}
    </Button>
  );
}
