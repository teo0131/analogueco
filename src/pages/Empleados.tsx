import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Users, Plus, Search, Edit2, Trash2, FileText, Upload,
  User, Phone, Mail, MapPin, Briefcase, Building2,
  Calendar, CreditCard, Heart, AlertCircle, ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Empleado {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string | null;
  email: string | null;
  telefono: string | null;
  cargo: string | null;
  departamento: string | null;
  fecha_ingreso: string | null;
  tipo_contrato: string | null;
  salario_base: number;
  tipo_pago: string;
  valor_hora: number;
  estado: string;
  foto_url: string | null;
  direccion: string | null;
  fecha_nacimiento: string | null;
  eps: string | null;
  arl: string | null;
  cuenta_bancaria: string | null;
  banco: string | null;
  tipo_cuenta: string | null;
  emergencia_nombre: string | null;
  emergencia_tel: string | null;
  notas: string | null;
  pin: string | null;
  created_at: string;
}

interface Documento {
  id: string;
  nombre: string;
  tipo: string;
  archivo_url: string | null;
  notas: string | null;
  created_at: string;
}

const emptyForm = {
  nombre: "", apellido: "", cedula: "", email: "", telefono: "",
  cargo: "", departamento: "", fecha_ingreso: "", tipo_contrato: "indefinido",
  salario_base: "", tipo_pago: "mensual", valor_hora: "", estado: "activo",
  direccion: "", fecha_nacimiento: "", eps: "", arl: "",
  cuenta_bancaria: "", banco: "", tipo_cuenta: "ahorros",
  emergencia_nombre: "", emergencia_tel: "", notas: "", pin: ""
};

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

const TIPO_DOC_LABELS: Record<string, string> = {
  hoja_vida: "Hoja de Vida", cedula: "Cédula", contrato: "Contrato",
  certificado: "Certificado", otro: "Otro"
};

export default function Empleados() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Empleado | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Detail panel
  const [selected, setSelected] = useState<Empleado | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [newDocNombre, setNewDocNombre] = useState("");
  const [newDocTipo, setNewDocTipo] = useState("otro");
  const [newDocNotas, setNewDocNotas] = useState("");

  useEffect(() => { fetchEmpleados(); }, []);

  const fetchEmpleados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("empleados")
      .select("*")
      .eq("user_id", user.id)
      .order("apellido");
    if (error) { toast.error("Error cargando empleados"); return; }
    setEmpleados(data || []);
    setLoading(false);
  };

  const fetchDocumentos = async (empleadoId: string) => {
    const { data } = await supabase
      .from("documentos_empleados")
      .select("*")
      .eq("empleado_id", empleadoId)
      .order("created_at", { ascending: false });
    setDocumentos(data || []);
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (e: Empleado) => {
    setEditing(e);
    setForm({
      nombre: e.nombre, apellido: e.apellido, cedula: e.cedula || "",
      email: e.email || "", telefono: e.telefono || "", cargo: e.cargo || "",
      departamento: e.departamento || "",
      fecha_ingreso: e.fecha_ingreso || "",
      tipo_contrato: e.tipo_contrato || "indefinido",
      salario_base: e.salario_base?.toString() || "", tipo_pago: e.tipo_pago || "mensual",
      valor_hora: e.valor_hora?.toString() || "", estado: e.estado || "activo",
      direccion: e.direccion || "", fecha_nacimiento: e.fecha_nacimiento || "",
      eps: e.eps || "", arl: e.arl || "", cuenta_bancaria: e.cuenta_bancaria || "",
      banco: e.banco || "", tipo_cuenta: e.tipo_cuenta || "ahorros",
      emergencia_nombre: e.emergencia_nombre || "", emergencia_tel: e.emergencia_tel || "",
      notas: e.notas || "", pin: e.pin || ""
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nombre || !form.apellido) { toast.error("Nombre y apellido son obligatorios"); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const payload = {
        user_id: user.id,
        nombre: form.nombre, apellido: form.apellido,
        cedula: form.cedula || null, email: form.email || null,
        telefono: form.telefono || null, cargo: form.cargo || null,
        departamento: form.departamento || null,
        fecha_ingreso: form.fecha_ingreso || null,
        tipo_contrato: form.tipo_contrato,
        salario_base: parseFloat(form.salario_base) || 0,
        tipo_pago: form.tipo_pago,
        valor_hora: parseFloat(form.valor_hora) || 0,
        estado: form.estado,
        direccion: form.direccion || null,
        fecha_nacimiento: form.fecha_nacimiento || null,
        eps: form.eps || null, arl: form.arl || null,
        cuenta_bancaria: form.cuenta_bancaria || null,
        banco: form.banco || null,
        tipo_cuenta: form.tipo_cuenta || null,
        emergencia_nombre: form.emergencia_nombre || null,
        emergencia_tel: form.emergencia_tel || null,
        notas: form.notas || null,
      };
      if (editing) {
        const { error } = await supabase.from("empleados").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Empleado actualizado");
      } else {
        const { error } = await supabase.from("empleados").insert(payload);
        if (error) throw error;
        toast.success("Empleado registrado");
      }
      setShowForm(false);
      fetchEmpleados();
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este empleado y todos sus registros?")) return;
    const { error } = await supabase.from("empleados").delete().eq("id", id);
    if (error) { toast.error("Error al eliminar"); return; }
    toast.success("Empleado eliminado");
    if (selected?.id === id) setSelected(null);
    fetchEmpleados();
  };

  const openDetail = (e: Empleado) => { setSelected(e); fetchDocumentos(e.id); };

  const handleUploadDoc = async (file: File) => {
    if (!selected || !newDocNombre) { toast.error("Ingresa un nombre para el documento"); return; }
    setUploadingDoc(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const path = `${user.id}/${selected.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("empleados-docs").upload(path, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("empleados-docs").getPublicUrl(path);
      await supabase.from("documentos_empleados").insert({
        user_id: user.id, empleado_id: selected.id,
        nombre: newDocNombre, tipo: newDocTipo,
        archivo_url: urlData.publicUrl, notas: newDocNotas || null,
      });
      toast.success("Documento subido");
      setNewDocNombre(""); setNewDocTipo("otro"); setNewDocNotas("");
      fetchDocumentos(selected.id);
    } catch { toast.error("Error subiendo documento"); }
    finally { setUploadingDoc(false); }
  };

  const handleDeleteDoc = async (docId: string) => {
    await supabase.from("documentos_empleados").delete().eq("id", docId);
    toast.success("Documento eliminado");
    if (selected) fetchDocumentos(selected.id);
  };

  const filtered = empleados.filter(e =>
    `${e.nombre} ${e.apellido} ${e.cargo || ""} ${e.cedula || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const f = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando empleados...</div>;

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Empleados
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {empleados.filter(e => e.estado === "activo").length} activos · {empleados.length} total
          </p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nuevo Empleado</Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por nombre, cargo, cédula..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista */}
        <div className="lg:col-span-1 space-y-2">
          {filtered.length === 0 ? (
            <div className="border rounded-lg border-dashed p-8 text-center text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Sin empleados registrados</p>
              <Button variant="link" size="sm" onClick={openCreate}>Registrar primero</Button>
            </div>
          ) : filtered.map(e => (
            <div
              key={e.id}
              onClick={() => openDetail(e)}
              className={`p-3 border rounded-lg cursor-pointer transition-all hover:bg-muted/50 ${selected?.id === e.id ? "ring-2 ring-primary bg-primary/5" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {e.nombre[0]}{e.apellido[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{e.nombre} {e.apellido}</p>
                  <p className="text-xs text-muted-foreground truncate">{e.cargo || "Sin cargo"}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant={e.estado === "activo" ? "default" : "secondary"} className="text-xs">{e.estado}</Badge>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detalle */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="border rounded-lg border-dashed p-12 text-center text-muted-foreground">
              <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Selecciona un empleado para ver su perfil completo</p>
            </div>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-lg">
                      {selected.nombre[0]}{selected.apellido[0]}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{selected.nombre} {selected.apellido}</CardTitle>
                      <p className="text-sm text-muted-foreground">{selected.cargo || "—"} · {selected.departamento || "—"}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(selected)}>
                      <Edit2 className="w-3 h-3 mr-1" />Editar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(selected.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="personal">
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="personal" className="flex-1 text-xs">Personal</TabsTrigger>
                    <TabsTrigger value="laboral" className="flex-1 text-xs">Laboral</TabsTrigger>
                    <TabsTrigger value="bancario" className="flex-1 text-xs">Bancario</TabsTrigger>
                    <TabsTrigger value="documentos" className="flex-1 text-xs">Documentos</TabsTrigger>
                  </TabsList>

                  {/* PERSONAL */}
                  <TabsContent value="personal" className="space-y-3">
                    {[
                      { icon: CreditCard, label: "Cédula", value: selected.cedula },
                      { icon: Mail, label: "Email", value: selected.email },
                      { icon: Phone, label: "Teléfono", value: selected.telefono },
                      { icon: MapPin, label: "Dirección", value: selected.direccion },
                      { icon: Calendar, label: "Nacimiento", value: selected.fecha_nacimiento ? format(new Date(selected.fecha_nacimiento), "dd/MM/yyyy") : null },
                      { icon: Heart, label: "EPS", value: selected.eps },
                      { icon: AlertCircle, label: "ARL", value: selected.arl },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-3 text-sm">
                        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground w-24 shrink-0">{label}</span>
                        <span className="font-medium">{value || "—"}</span>
                      </div>
                    ))}
                    {selected.emergencia_nombre && (
                      <div className="mt-3 p-3 rounded-md bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                        <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-1">Contacto de emergencia</p>
                        <p className="text-sm">{selected.emergencia_nombre} · {selected.emergencia_tel}</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* LABORAL */}
                  <TabsContent value="laboral" className="space-y-3">
                    {[
                      { icon: Briefcase, label: "Contrato", value: selected.tipo_contrato },
                      { icon: Calendar, label: "Ingreso", value: selected.fecha_ingreso ? format(new Date(selected.fecha_ingreso), "dd/MM/yyyy") : null },
                      { icon: Building2, label: "Depto.", value: selected.departamento },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-3 text-sm">
                        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground w-24 shrink-0">{label}</span>
                        <span className="font-medium">{value || "—"}</span>
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="p-3 rounded-md bg-muted/50 text-center">
                        <p className="text-xs text-muted-foreground">Salario Base</p>
                        <p className="font-bold text-lg text-primary">{formatCOP(selected.salario_base)}</p>
                        <p className="text-xs text-muted-foreground">{selected.tipo_pago}</p>
                      </div>
                      {selected.valor_hora > 0 && (
                        <div className="p-3 rounded-md bg-muted/50 text-center">
                          <p className="text-xs text-muted-foreground">Valor / Hora</p>
                          <p className="font-bold text-lg text-primary">{formatCOP(selected.valor_hora)}</p>
                        </div>
                      )}
                    </div>
                    {selected.notas && (
                      <div className="p-3 rounded-md bg-muted/30 border text-sm">
                        <p className="text-xs text-muted-foreground mb-1">Notas</p>
                        <p>{selected.notas}</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* BANCARIO */}
                  <TabsContent value="bancario" className="space-y-3">
                    {[
                      { label: "Banco", value: selected.banco },
                      { label: "Tipo de cuenta", value: selected.tipo_cuenta },
                      { label: "Número de cuenta", value: selected.cuenta_bancaria },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground w-32 shrink-0">{label}</span>
                        <span className="font-medium">{value || "—"}</span>
                      </div>
                    ))}
                  </TabsContent>

                  {/* DOCUMENTOS */}
                  <TabsContent value="documentos" className="space-y-4">
                    {/* Upload form */}
                    <div className="border rounded-lg p-3 bg-muted/20 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subir documento</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Nombre del documento" value={newDocNombre} onChange={e => setNewDocNombre(e.target.value)} className="text-sm" />
                        <Select value={newDocTipo} onValueChange={setNewDocTipo}>
                          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(TIPO_DOC_LABELS).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input placeholder="Notas opcionales" value={newDocNotas} onChange={e => setNewDocNotas(e.target.value)} className="text-sm" />
                      <label className="cursor-pointer">
                        <div className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-md py-3 text-sm text-muted-foreground hover:bg-muted/40 transition-colors ${uploadingDoc ? "opacity-50 pointer-events-none" : ""}`}>
                          <Upload className="w-4 h-4" />
                          {uploadingDoc ? "Subiendo..." : "Seleccionar archivo"}
                        </div>
                        <input type="file" className="hidden" disabled={uploadingDoc}
                          onChange={e => { const file = e.target.files?.[0]; if (file) handleUploadDoc(file); e.target.value = ""; }} />
                      </label>
                    </div>

                    {/* Doc list */}
                    {documentos.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Sin documentos</p>
                    ) : documentos.map(doc => (
                      <div key={doc.id} className="flex items-center gap-3 p-2 border rounded-lg">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.nombre}</p>
                          <p className="text-xs text-muted-foreground">{TIPO_DOC_LABELS[doc.tipo] || doc.tipo} · {format(new Date(doc.created_at), "dd/MM/yyyy")}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {doc.archivo_url && (
                            <Button size="sm" variant="ghost" asChild>
                              <a href={doc.archivo_url} target="_blank" rel="noopener noreferrer">Ver</a>
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteDoc(doc.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Empleado" : "Nuevo Empleado"}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="basico">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="basico" className="flex-1 text-xs">Básico</TabsTrigger>
              <TabsTrigger value="laboral" className="flex-1 text-xs">Laboral</TabsTrigger>
              <TabsTrigger value="personal" className="flex-1 text-xs">Personal</TabsTrigger>
              <TabsTrigger value="bancario" className="flex-1 text-xs">Bancario</TabsTrigger>
            </TabsList>

            <TabsContent value="basico" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Nombre *</Label><Input value={form.nombre} onChange={e => f("nombre", e.target.value)} /></div>
                <div className="space-y-1"><Label>Apellido *</Label><Input value={form.apellido} onChange={e => f("apellido", e.target.value)} /></div>
                <div className="space-y-1"><Label>Cédula</Label><Input value={form.cedula} onChange={e => f("cedula", e.target.value)} /></div>
                <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e => f("email", e.target.value)} /></div>
                <div className="space-y-1"><Label>Teléfono</Label><Input value={form.telefono} onChange={e => f("telefono", e.target.value)} /></div>
                <div className="space-y-1">
                  <Label>Estado</Label>
                  <Select value={form.estado} onValueChange={v => f("estado", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="laboral" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Cargo</Label><Input value={form.cargo} onChange={e => f("cargo", e.target.value)} /></div>
                <div className="space-y-1"><Label>Departamento</Label><Input value={form.departamento} onChange={e => f("departamento", e.target.value)} /></div>
                <div className="space-y-1"><Label>Fecha ingreso</Label><Input type="date" value={form.fecha_ingreso} onChange={e => f("fecha_ingreso", e.target.value)} /></div>
                <div className="space-y-1">
                  <Label>Tipo contrato</Label>
                  <Select value={form.tipo_contrato} onValueChange={v => f("tipo_contrato", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indefinido">Indefinido</SelectItem>
                      <SelectItem value="fijo">Término fijo</SelectItem>
                      <SelectItem value="obra_labor">Obra/Labor</SelectItem>
                      <SelectItem value="prestacion_servicios">Prestación de servicios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Tipo de pago</Label>
                  <Select value={form.tipo_pago} onValueChange={v => f("tipo_pago", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensual">Mensual</SelectItem>
                      <SelectItem value="quincenal">Quincenal</SelectItem>
                      <SelectItem value="por_hora">Por hora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Salario base ($)</Label><Input type="number" value={form.salario_base} onChange={e => f("salario_base", e.target.value)} /></div>
                <div className="space-y-1"><Label>Valor/hora ($)</Label><Input type="number" value={form.valor_hora} onChange={e => f("valor_hora", e.target.value)} /></div>
              </div>
              <div className="space-y-1"><Label>Notas laborales</Label><Textarea value={form.notas} onChange={e => f("notas", e.target.value)} rows={2} /></div>
            </TabsContent>

            <TabsContent value="personal" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Fecha de nacimiento</Label><Input type="date" value={form.fecha_nacimiento} onChange={e => f("fecha_nacimiento", e.target.value)} /></div>
                <div className="space-y-1"><Label>Dirección</Label><Input value={form.direccion} onChange={e => f("direccion", e.target.value)} /></div>
                <div className="space-y-1"><Label>EPS</Label><Input value={form.eps} onChange={e => f("eps", e.target.value)} /></div>
                <div className="space-y-1"><Label>ARL</Label><Input value={form.arl} onChange={e => f("arl", e.target.value)} /></div>
                <div className="space-y-1"><Label>Contacto emergencia</Label><Input placeholder="Nombre" value={form.emergencia_nombre} onChange={e => f("emergencia_nombre", e.target.value)} /></div>
                <div className="space-y-1"><Label>Teléfono emergencia</Label><Input value={form.emergencia_tel} onChange={e => f("emergencia_tel", e.target.value)} /></div>
              </div>
            </TabsContent>

            <TabsContent value="bancario" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Banco</Label><Input value={form.banco} onChange={e => f("banco", e.target.value)} /></div>
                <div className="space-y-1">
                  <Label>Tipo de cuenta</Label>
                  <Select value={form.tipo_cuenta} onValueChange={v => f("tipo_cuenta", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ahorros">Ahorros</SelectItem>
                      <SelectItem value="corriente">Corriente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 col-span-2"><Label>Número de cuenta</Label><Input value={form.cuenta_bancaria} onChange={e => f("cuenta_bancaria", e.target.value)} /></div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : editing ? "Guardar cambios" : "Registrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
