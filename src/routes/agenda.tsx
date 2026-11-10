import { pageHead } from "@/lib/metadata";
import { DELETE_CONFIRMATION, localDate, localInput, whatsappUrl } from "@/lib/crm";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useTarefas, useLeads } from "@/lib/store";
import { Phone, MessageCircle, Users, Mail, MapPin, FileText, Repeat, MoreHorizontal, Plus, Calendar as CalendarIcon, List as ListIcon, Check, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { Tarefa, TarefaTipo, TarefaPrioridade } from "@/lib/types";

export const Route = createFileRoute("/agenda")({ head: () => pageHead("Agenda e Tarefas", "Compromissos e tarefas do consultor de consórcio."), component: AgendaPage });

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

function TaskCard({ t, onToggle, onEdit, onDelete, onReschedule, onLeadClick }: {
  t: Tarefa;
  onToggle: (id: string) => void;
  onEdit: (t: Tarefa) => void;
  onDelete: (id: string) => void;
  onReschedule: (t: Tarefa) => void;
  onLeadClick: (leadId: string) => void;
}) {
  const Icon = tipoIcon[t.tipo] ?? MoreHorizontal;
  const linkedLeadId = t.lead_id || t.leadId;
  const overdue = !t.concluida && localDate(t.data) < new Date() && !isSameDay(localDate(t.data), new Date());
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`border border-border rounded-lg p-3 bg-card flex items-start gap-3 transition-colors ${linkedLeadId ? "cursor-pointer hover:border-primary/50 hover:bg-accent/30" : ""}`} onClick={() => linkedLeadId && onLeadClick(linkedLeadId)} role={linkedLeadId ? "button" : undefined} tabIndex={linkedLeadId ? 0 : undefined} onKeyDown={(e) => { if (linkedLeadId && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onLeadClick(linkedLeadId); } }}>
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
          {localDate(t.data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
        </div>
        {t.descricao && (
          <div className="text-xs cursor-pointer" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
            {expanded ? t.descricao : (t.descricao.length > 60 ? t.descricao.slice(0, 60) + "…" : t.descricao)}
          </div>
        )}
        <div className="flex gap-1 pt-1">
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onToggle(t.id); }}><Check className="h-3 w-3 mr-1" />{t.concluida ? "Reabrir" : "Concluir"}</Button>
          <Button size="sm" variant="ghost" aria-label="Editar tarefa" title="Editar tarefa" onClick={(e) => { e.stopPropagation(); onEdit(t); }}><Pencil className="h-3 w-3" /></Button>
          <Button size="sm" variant="ghost" aria-label="Reagendar tarefa" title="Reagendar tarefa" onClick={(e) => { e.stopPropagation(); onReschedule(t); }}><Repeat className="h-3 w-3" /></Button>
          <Button size="sm" variant="ghost" aria-label="Excluir tarefa" title="Excluir tarefa" onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}><Trash2 className="h-3 w-3" /></Button>
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
  const [leads] = useLeads();
  const draftKey = `contemplacrm:draft:task:${initial?.id ?? "new"}`;
  const wasOpen = useRef(false);
  const [leadSearch, setLeadSearch] = useState("");
  const [form, setForm] = useState<Partial<Tarefa>>(initial ?? {
    titulo: "", tipo: "Follow-up", cliente: "", data: new Date().toISOString(), concluida: false, prioridade: "Média", descricao: "", lembrete: false,
  });

  useEffect(() => {
    if (open && !wasOpen.current) {
      let restored: { form: Partial<Tarefa>; leadSearch?: string } | null = null;
      try {
        const raw = sessionStorage.getItem(draftKey);
        if (raw) restored = JSON.parse(raw);
      } catch {
        sessionStorage.removeItem(draftKey);
      }
      setForm(restored?.form ?? initial ?? { titulo: "", tipo: "Follow-up", cliente: "", data: new Date().toISOString(), concluida: false, prioridade: "Média" });
      setLeadSearch(restored?.leadSearch ?? "");
    }
    wasOpen.current = open;
  }, [open, draftKey]);

  const updateDraft = (nextForm: Partial<Tarefa>, nextSearch = leadSearch) => {
    setForm(nextForm);
    try { sessionStorage.setItem(draftKey, JSON.stringify({ form: nextForm, leadSearch: nextSearch })); } catch { /* Keep task editing available without storage. */ }
  };
  const updateLeadSearch = (value: string) => {
    setLeadSearch(value);
    try { sessionStorage.setItem(draftKey, JSON.stringify({ form, leadSearch: value })); } catch { /* Keep task editing available without storage. */ }
  };

  const submit = () => {
    const linked = leads.find(l=>l.id===form.lead_id);
    if (!form.titulo?.trim() || !linked) { toast.error("Preencha o título e selecione um lead"); return; }
    if (!form.data || !Number.isFinite(localDate(form.data).getTime())) { toast.error("Informe uma data válida"); return; }
    const t: Tarefa = {
      id: initial?.id ?? crypto.randomUUID(),
      titulo: form.titulo,
      tipo: (form.tipo as TarefaTipo) ?? "Outro",
      cliente: linked.nome,
      lead_id: linked.id,

      leadId: linked.id,
      data: form.data ?? new Date().toISOString(),
      concluida: initial?.concluida ?? false,
      prioridade: form.prioridade as TarefaPrioridade,
      descricao: form.descricao,
      lembrete: form.lembrete,
      proximaAcaoId: initial?.proximaAcaoId,
    };
    onSave(t);
    sessionStorage.removeItem(draftKey);
    onOpenChange(false);
  };

  const dataValue = form.data ? localInput(form.data) : "";

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen && sessionStorage.getItem(draftKey)) {
        if (!window.confirm("Deseja descartar o rascunho desta tarefa?")) return;
        sessionStorage.removeItem(draftKey);
      }
      onOpenChange(nextOpen);
    }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={form.titulo ?? ""} onChange={(e) => updateDraft({ ...form, titulo: e.target.value })} />
          </div>
          <div>
            <Label>Lead</Label>
            <Input aria-label="Buscar lead da tarefa" placeholder="Buscar por nome ou telefone" value={leadSearch} onChange={e=>updateLeadSearch(e.target.value)} />
            <Select value={form.lead_id} onValueChange={v=>updateDraft({...form,lead_id:v})}><SelectTrigger aria-label="Lead da tarefa"><SelectValue placeholder="Selecione um lead" /></SelectTrigger><SelectContent>{leads.filter(l=>l.nome.toLowerCase().includes(leadSearch.toLowerCase())||l.telefone.includes(leadSearch)).map(l=><SelectItem key={l.id} value={l.id}>{l.nome} · {l.telefone}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => updateDraft({ ...form, tipo: v as TarefaTipo })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.prioridade} onValueChange={(v) => updateDraft({ ...form, prioridade: v as TarefaPrioridade })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIOS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Data e hora</Label>
            <Input type="datetime-local" value={dataValue} onChange={(e) => updateDraft({ ...form, data: e.target.value ? new Date(e.target.value).toISOString() : "" })} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.descricao ?? ""} onChange={(e) => updateDraft({ ...form, descricao: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={!!form.lembrete} onCheckedChange={(b) => updateDraft({ ...form, lembrete: b })} />
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

  const dotsFor = (d: Date) => tarefas.filter((t) => isSameDay(localDate(t.data), d));

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
                    const overdue = !t.concluida && localDate(t.data) < new Date() && !isSameDay(localDate(t.data), new Date());
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
  const [savedTasks, setTarefas] = useTarefas();
  const [leads, setLeads] = useLeads();
  const tarefas = savedTasks.map(t=>({...t,cliente:leads.find(l=>l.id===(t.lead_id || t.leadId))?.nome ?? t.cliente}));
  const [view, setView] = useState<"calendario" | "lista">("lista");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tarefa | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const selectedLead = selectedLeadId ? leads.find(lead => lead.id === selectedLeadId) : undefined;

  const toggle = (id: string) => {
    const task = savedTasks.find(t => t.id === id);
    if (!task) return;
    const completed = !task.concluida;
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, concluida: completed } : t));
    if (task.proximaAcaoId) {
      setLeads(prev => prev.map(lead => {
        if (lead.id !== task.lead_id) return lead;
        const details = lead.detalhesCliente ?? {};
        if (completed) {
          const action = details.proximaAcao;
          if (!action || action.id !== task.proximaAcaoId) return lead;
          return { ...lead, detalhesCliente: {
            ...details,
            proximaAcao: undefined,
            acoesConcluidas: [...(details.acoesConcluidas ?? []), { id: action.id, data: new Date().toISOString(), tipo: action.tipo, descricao: action.descricao }],
          } };
        }
        const date = localDate(task.data);
        const hora = date.toTimeString().slice(0, 5);
        return { ...lead, detalhesCliente: {
          ...details,
          proximaAcao: { id: task.proximaAcaoId, data: task.data, hora, tipo: task.tipo, descricao: task.descricao ?? task.titulo },
          acoesConcluidas: (details.acoesConcluidas ?? []).filter(action => action.id !== task.proximaAcaoId),
        } };
      }));
    }
  };
  const remove = (id: string) => {
    if (!confirm(DELETE_CONFIRMATION)) return;
    const task = savedTasks.find(t => t.id === id);
    setTarefas(prev => prev.filter(t => t.id !== id));
    if (task?.proximaAcaoId) {
      setLeads(prev => prev.map(lead => lead.id === task.lead_id && lead.detalhesCliente?.proximaAcao?.id === task.proximaAcaoId
        ? { ...lead, detalhesCliente: { ...lead.detalhesCliente, proximaAcao: undefined } }
        : lead));
    }
    toast.success("Tarefa excluída");
  };
  const save = (t: Tarefa) => {
    setTarefas((prev) => {
      const ex = prev.some((p) => p.id === t.id);
      return ex ? prev.map((p) => p.id === t.id ? t : p) : [t, ...prev];
    });
    if (t.proximaAcaoId) {
      const date = localDate(t.data);
      setLeads(prev => prev.map(lead => {
        if (lead.id !== t.lead_id) return lead;
        const details = lead.detalhesCliente;
        const action = details?.proximaAcao;
        if (!details || !action || action.id !== t.proximaAcaoId) return lead;
        return {
          ...lead,
          detalhesCliente: {
            ...details,
            proximaAcao: {
              ...action,
              data: t.data,
              hora: date.toTimeString().slice(0, 5),
              tipo: t.tipo,
              descricao: t.descricao ?? t.titulo,
            },
          },
        };
      }));
    }
    toast.success(editing ? "Tarefa atualizada!" : "Tarefa criada!");
    setEditing(null);
  };
  const reschedule = (t: Tarefa) => {
    const newDate = new Date(); newDate.setDate(newDate.getDate() + 1);
    const original = localDate(t.data); newDate.setHours(original.getHours(), original.getMinutes(), 0, 0);
    setTarefas((prev) => prev.map((p) => p.id === t.id ? { ...p, data: newDate.toISOString() } : p));
    if (t.proximaAcaoId) {
      setLeads(prev => prev.map(lead => {
        if (lead.id !== t.lead_id) return lead;
        const details = lead.detalhesCliente;
        const action = details?.proximaAcao;
        if (!details || !action || action.id !== t.proximaAcaoId) return lead;
        return {
          ...lead,
          detalhesCliente: {
            ...details,
            proximaAcao: {
              ...action,
              data: newDate.toISOString(),
              hora: newDate.toTimeString().slice(0, 5),
            },
          },
        };
      }));
    }
    toast.success("Reagendada para amanhã");
  };

  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const endOfWeek = new Date(today); endOfWeek.setDate(endOfWeek.getDate() + 7);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const counts = useMemo(() => {
    const hoje = tarefas.filter((t) => isSameDay(localDate(t.data), now) && !t.concluida).length;
    const atrasadas = tarefas.filter((t) => !t.concluida && localDate(t.data) < today).length;
    const semana = tarefas.filter((t) => { const d = localDate(t.data); return d >= today && d < endOfWeek; }).length;
    const concluidasMes = tarefas.filter((t) => t.concluida && localDate(t.data) >= startOfMonth && localDate(t.data) < endOfMonth).length;
    return { hoje, atrasadas, semana, concluidasMes };
  }, [tarefas]);

  const grupos = useMemo(() => {
    const porDataEHora = (a: Tarefa, b: Tarefa) => localDate(a.data).getTime() - localDate(b.data).getTime();
    const pendentes = tarefas.filter(t => !t.concluida);
    return {
      "Concluídas": tarefas.filter(t => t.concluida).sort(porDataEHora),
      "Futuras": pendentes.filter(t => localDate(t.data) >= endOfMonth).sort(porDataEHora),
      Atrasadas: pendentes.filter(t => localDate(t.data) < today).sort(porDataEHora),
      Hoje: pendentes.filter(t => isSameDay(localDate(t.data), now)).sort(porDataEHora),
      Amanhã: pendentes.filter(t => isSameDay(localDate(t.data), tomorrow)).sort(porDataEHora),
      "Esta Semana": pendentes.filter(t => { const d = localDate(t.data); return d > tomorrow && d < endOfWeek; }).sort(porDataEHora),
      "Próximo Mês": pendentes.filter(t => { const d = localDate(t.data); return d >= endOfWeek && d < endOfMonth; }).sort(porDataEHora),
    };
  }, [tarefas]);

  const dayTasks = selectedDay ? tarefas.filter((t) => isSameDay(localDate(t.data), selectedDay)) : [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda & Tarefas</h1>
          <p className="text-muted-foreground">Seus compromissos e follow-ups</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
                <TaskCard key={t.id} t={t} onToggle={toggle} onEdit={(t) => { setEditing(t); setModalOpen(true); }} onDelete={remove} onReschedule={reschedule} onLeadClick={setSelectedLeadId} />
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
            {(["Hoje", "Amanhã", "Esta Semana", "Próximo Mês"] as const).map((titulo) => {
              const lista = grupos[titulo];
              return (
                <Card key={titulo} className="min-w-0">
                  <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center justify-between">
                    {titulo}<Badge variant="secondary">{lista.length}</Badge>
                  </CardTitle></CardHeader>
                  <CardContent className="space-y-2 pt-0 max-h-[600px] overflow-y-auto overscroll-contain pr-2">
                    {lista.length === 0 && <p className="text-xs text-muted-foreground py-1">Nada por aqui</p>}
                    {lista.map((t) => (
                      <TaskCard key={t.id} t={t} onToggle={toggle} onEdit={(t) => { setEditing(t); setModalOpen(true); }} onDelete={remove} onReschedule={reschedule} onLeadClick={setSelectedLeadId} />
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
            {(["Concluídas", "Futuras", "Atrasadas"] as const).map((titulo) => {
              const lista = grupos[titulo];
              return (
                <Card key={titulo} className={titulo === "Atrasadas" && lista.length > 0 ? "border-destructive/50 min-w-0" : "min-w-0"}>
                  <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center justify-between">
                    {titulo}<Badge variant="secondary">{lista.length}</Badge>
                  </CardTitle></CardHeader>
                  <CardContent className="space-y-2 pt-0 max-h-[600px] overflow-y-auto overscroll-contain pr-2">
                    {lista.length === 0 && <p className="text-xs text-muted-foreground py-1">Nada por aqui</p>}
                    {lista.map((t) => (
                      <TaskCard key={t.id} t={t} onToggle={toggle} onEdit={(t) => { setEditing(t); setModalOpen(true); }} onDelete={remove} onReschedule={reschedule} onLeadClick={setSelectedLeadId} />
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={!!selectedLeadId} onOpenChange={(open) => { if (!open) setSelectedLeadId(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedLead?.nome ?? "Lead vinculado à tarefa"}</DialogTitle>
          </DialogHeader>
          {selectedLead ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-3 space-y-2">
                <div className="text-xs text-muted-foreground font-medium">CONTATO</div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm">{selectedLead.telefone || "Telefone não informado"}</span>
                  {selectedLead.telefone && <Button size="sm" variant="outline" asChild><a href={whatsappUrl(selectedLead.telefone)} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 mr-1" />WhatsApp</a></Button>}
                </div>
                {selectedLead.email && <div className="text-sm text-muted-foreground break-all">{selectedLead.email}</div>}
              </div>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground font-medium">PRODUTOS DE INTERESSE</div>
                {(selectedLead.produtos?.length ? selectedLead.produtos : selectedLead.produto ? [{ produto: selectedLead.produto, quantidade: 1, valorUnitario: selectedLead.valorCarta }] : []).map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{item.produto}</div>
                      <div className="text-xs text-muted-foreground">Qtd.: {item.quantidade} · Unitário: {item.valorUnitario.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                    </div>
                    <div className="text-sm font-semibold whitespace-nowrap">{(item.valorUnitario * item.quantidade).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                  </div>
                ))}
                {!selectedLead.produtos?.length && !selectedLead.produto && <p className="text-sm text-muted-foreground">Nenhum produto informado.</p>}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Etapa: {selectedLead.etapa}</span>
                <span>{selectedLead.origem}</span>
              </div>
              <Button className="w-full" variant="outline" asChild><Link to="/clientes/$id" params={{ id: `lead_${selectedLead.id}` }}>Abrir perfil completo</Link></Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Este lead não está mais disponível no CRM.</p>
          )}
        </DialogContent>
      </Dialog>
      <TaskModal open={modalOpen} onOpenChange={setModalOpen} initial={editing} onSave={save} />
    </div>
  );
}
