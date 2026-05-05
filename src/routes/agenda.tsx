import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useTarefas, useClientes } from "@/lib/store";
import { Phone, MessageCircle, Users, Mail, MapPin, FileText, Repeat, MoreHorizontal, Plus, Calendar as CalendarIcon, List as ListIcon, Check, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { Tarefa, TarefaTipo, TarefaPrioridade } from "@/lib/types";

export const Route = createFileRoute("/agenda")({ component: AgendaPage });

const tipoIcon: Record<TarefaTipo, typeof Phone> = {
  "Ligação": Phone,
  "WhatsApp": MessageCircle,
  "Reunião": Users,
  "E-mail": Mail,
  "Visita": MapPin,
  "Follow-up": Repeat,
  "Enviar Proposta": FileText,
  "Recontato": Repeat,
  "Outro": MoreHorizontal,
};

const TIPOS: TarefaTipo[] = ["Follow-up", "Ligação", "WhatsApp", "Reunião", "E-mail", "Visita", "Enviar Proposta", "Recontato", "Outro"];
const PRIOS: TarefaPrioridade[] = ["Alta", "Média", "Baixa"];

function prioColor(p?: TarefaPrioridade) {
  if (p === "Alta") return "bg-destructive text-destructive-foreground";
  if (p === "Média") return "bg-warning text-warning-foreground";
  return "bg-success text-success-foreground";
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }

function TaskCard({ t, onToggle, onEdit, onDelete, onReschedule }: {
  t: Tarefa;
  onToggle: (id: string) => void;
  onEdit: (t: Tarefa) => void;
  onDelete: (id: string) => void;
  onReschedule: (t: Tarefa) => void;
}) {
  const Icon = tipoIcon[t.tipo] ?? MoreHorizontal;
  const overdue = !t.concluida && new Date(t.data) < new Date() && !isSameDay(new Date(t.data), new Date());
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-border rounded-lg p-3 bg-card flex items-start gap-3">
      <Icon className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`text-sm font-medium ${t.concluida ? "line-through text-muted-foreground" : ""}`}>{t.titulo}</div>
          {t.prioridade && <Badge className={prioColor(t.prioridade)}>{t.prioridade}</Badge>}
          {t.concluida ? <Badge variant="secondary">Concluída</Badge> :
            overdue ? <Badge className="bg-destructive text-destructive-foreground">⚠️ Atrasada</Badge> :
            <Badge variant="outline">Pendente</Badge>}
        </div>
        <div className="text-xs text-muted-foreground">{t.tipo} · {t.cliente}</div>
        <div className="text-xs text-muted-foreground">
          {new Date(t.data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
        </div>
        {t.descricao && (
          <div className="text-xs cursor-pointer" onClick={() => setExpanded(!expanded)}>
            {expanded ? t.descricao : (t.descricao.length > 60 ? t.descricao.slice(0, 60) + "…" : t.descricao)}
          </div>
        )}
        <div className="flex gap-1 pt-1">
          <Button size="sm" variant="outline" onClick={() => onToggle(t.id)}><Check className="h-3 w-3 mr-1" />Concluir</Button>
          <Button size="sm" variant="ghost" onClick={() => onEdit(t)}><Pencil className="h-3 w-3" /></Button>
          <Button size="sm" variant="ghost" onClick={() => onReschedule(t)}><Repeat className="h-3 w-3" /></Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(t.id)}><Trash2 className="h-3 w-3" /></Button>
        </div>
      </div>
    </div>
  );
}

function TaskModal({ open, onOpenChange, initial, onSave }: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  initial: Tarefa | null;
  onSave: (t: Tarefa) => void;
}) {
  const [clientes] = useClientes();
  const [form, setForm] = useState<Partial<Tarefa>>(initial ?? {
    titulo: "", tipo: "Follow-up", cliente: "", data: new Date().toISOString(), concluida: false, prioridade: "Média", descricao: "", lembrete: false,
  });

  const submit = () => {
    if (!form.titulo || !form.cliente) { toast.error("Preencha título e cliente"); return; }
    const t: Tarefa = {
      id: initial?.id ?? `t_${Date.now()}`,
      titulo: form.titulo!,
      tipo: (form.tipo as TarefaTipo) ?? "Outro",
      cliente: form.cliente!,
      clienteId: form.clienteId,
      data: form.data ?? new Date().toISOString(),
      concluida: initial?.concluida ?? false,
      prioridade: form.prioridade as TarefaPrioridade,
      descricao: form.descricao,
      lembrete: form.lembrete,
    };
    onSave(t);
    onOpenChange(false);
  };

  const dataValue = form.data ? new Date(form.data).toISOString().slice(0, 16) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={form.titulo ?? ""} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          </div>
          <div>
            <Label>Cliente</Label>
            <Select value={form.cliente} onValueChange={(v) => {
              const c = clientes.find((c) => c.nome === v);
              setForm({ ...form, cliente: v, clienteId: c?.id });
            }}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {clientes.map((c) => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as TarefaTipo })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.prioridade} onValueChange={(v) => setForm({ ...form, prioridade: v as TarefaPrioridade })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIOS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Data e hora</Label>
            <Input type="datetime-local" value={dataValue} onChange={(e) => setForm({ ...form, data: new Date(e.target.value).toISOString() })} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.descricao ?? ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={!!form.lembrete} onCheckedChange={(b) => setForm({ ...form, lembrete: b })} />
            <Label>Ativar lembrete</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CalendarView({ tarefas, onDayClick }: { tarefas: Tarefa[]; onDayClick: (d: Date) => void }) {
  const [cursor, setCursor] = useState(new Date());
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const days: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));

  const weekdays = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  const dotsFor = (d: Date) => tarefas.filter((t) => isSameDay(new Date(t.data), d));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{monthNames[month]} {year}</CardTitle>
        <div className="flex gap-1">
          <Button size="icon" variant="outline" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" onClick={() => setCursor(new Date())}>Hoje</Button>
          <Button size="icon" variant="outline" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground mb-1">
          {weekdays.map((w) => <div key={w} className="text-center font-medium py-1">{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            if (!d) return <div key={i} />;
            const ts = dotsFor(d);
            const today = isSameDay(d, new Date());
            return (
              <button
                key={i}
                onClick={() => onDayClick(d)}
                className={`aspect-square border border-border rounded-md p-1 text-left text-xs hover:bg-accent ${today ? "ring-2 ring-primary" : ""}`}
              >
                <div className="font-medium">{d.getDate()}</div>
                <div className="flex flex-wrap gap-0.5 mt-1">
                  {ts.slice(0, 4).map((t) => {
                    const overdue = !t.concluida && new Date(t.data) < new Date() && !isSameDay(new Date(t.data), new Date());
                    const cls = t.concluida ? "bg-success" : overdue ? "bg-destructive" : t.prioridade === "Alta" ? "bg-warning" : "bg-primary";
                    return <span key={t.id} className={`h-1.5 w-1.5 rounded-full ${cls}`} />;
                  })}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function AgendaPage() {
  const [tarefas, setTarefas] = useTarefas();
  const [view, setView] = useState<"calendario" | "lista">("lista");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tarefa | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const toggle = (id: string) => setTarefas((prev) => prev.map((t) => t.id === id ? { ...t, concluida: !t.concluida } : t));
  const remove = (id: string) => setTarefas((prev) => prev.filter((t) => t.id !== id));
  const save = (t: Tarefa) => {
    setTarefas((prev) => {
      const ex = prev.some((p) => p.id === t.id);
      return ex ? prev.map((p) => p.id === t.id ? t : p) : [t, ...prev];
    });
    toast.success(editing ? "Tarefa atualizada!" : "Tarefa criada!");
    setEditing(null);
  };
  const reschedule = (t: Tarefa) => {
    const newDate = new Date(t.data); newDate.setDate(newDate.getDate() + 1);
    setTarefas((prev) => prev.map((p) => p.id === t.id ? { ...p, data: newDate.toISOString() } : p));
    toast.success("Reagendada para amanhã");
  };

  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const endOfWeek = new Date(today); endOfWeek.setDate(endOfWeek.getDate() + 7);
  const endOfMonth = new Date(today); endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const counts = useMemo(() => {
    const hoje = tarefas.filter((t) => isSameDay(new Date(t.data), now) && !t.concluida).length;
    const atrasadas = tarefas.filter((t) => !t.concluida && new Date(t.data) < today).length;
    const semana = tarefas.filter((t) => { const d = new Date(t.data); return d >= today && d < endOfWeek; }).length;
    const concluidasMes = tarefas.filter((t) => t.concluida && new Date(t.data) >= startOfMonth).length;
    return { hoje, atrasadas, semana, concluidasMes };
  }, [tarefas]);

  const grupos = useMemo(() => ({
    Atrasadas: tarefas.filter((t) => !t.concluida && new Date(t.data) < today),
    Hoje: tarefas.filter((t) => isSameDay(new Date(t.data), now)),
    Amanhã: tarefas.filter((t) => isSameDay(new Date(t.data), tomorrow)),
    "Esta Semana": tarefas.filter((t) => { const d = new Date(t.data); return d > tomorrow && d < endOfWeek; }),
    "Próximo Mês": tarefas.filter((t) => { const d = new Date(t.data); return d >= endOfWeek && d < endOfMonth; }),
  }), [tarefas]);

  const dayTasks = selectedDay ? tarefas.filter((t) => isSameDay(new Date(t.data), selectedDay)) : [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda & Tarefas</h1>
          <p className="text-muted-foreground">Seus compromissos e follow-ups</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border border-border rounded-md overflow-hidden">
            <Button size="sm" variant={view === "calendario" ? "default" : "ghost"} onClick={() => setView("calendario")} className="rounded-none">
              <CalendarIcon className="h-4 w-4 mr-1" />Calendário
            </Button>
            <Button size="sm" variant={view === "lista" ? "default" : "ghost"} onClick={() => setView("lista")} className="rounded-none">
              <ListIcon className="h-4 w-4 mr-1" />Lista
            </Button>
          </div>
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4 mr-2" />Nova Tarefa</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Tarefas de Hoje</div><div className="text-2xl font-bold mt-1">{counts.hoje}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Atrasadas</div><div className="text-2xl font-bold text-destructive mt-1">{counts.atrasadas}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Esta Semana</div><div className="text-2xl font-bold mt-1">{counts.semana}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Concluídas este mês</div><div className="text-2xl font-bold text-success mt-1">{counts.concluidasMes}</div></CardContent></Card>
      </div>

      {view === "calendario" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"><CalendarView tarefas={tarefas} onDayClick={setSelectedDay} /></div>
          <Card>
            <CardHeader><CardTitle className="text-base">{selectedDay ? selectedDay.toLocaleDateString("pt-BR") : "Selecione um dia"}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {dayTasks.length === 0 && <p className="text-sm text-muted-foreground">Sem tarefas</p>}
              {dayTasks.map((t) => (
                <TaskCard key={t.id} t={t} onToggle={toggle} onEdit={(t) => { setEditing(t); setModalOpen(true); }} onDelete={remove} onReschedule={reschedule} />
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grupos).map(([titulo, lista]) => (
            <Card key={titulo} className={titulo === "Atrasadas" && lista.length > 0 ? "border-destructive/50" : ""}>
              <CardHeader><CardTitle className="text-base flex items-center justify-between">
                {titulo}<Badge variant="secondary">{lista.length}</Badge>
              </CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {lista.length === 0 && <p className="text-sm text-muted-foreground">Nada por aqui</p>}
                {lista.map((t) => (
                  <TaskCard key={t.id} t={t} onToggle={toggle} onEdit={(t) => { setEditing(t); setModalOpen(true); }} onDelete={remove} onReschedule={reschedule} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TaskModal open={modalOpen} onOpenChange={setModalOpen} initial={editing} onSave={save} />
    </div>
  );
}
