import { Button } from "@/components/ui/button";
import { localDate } from "@/lib/crm";
import { FEATURES } from "@/lib/features";
import { MobileNavigation } from "./MobileNavigation";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Search, User, CalendarClock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLeads, useClientes, usePropostas, useTarefas, useConfig } from "@/lib/store";

type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  overdue: boolean;
  priority?: string;
};

export function TopNavbar() {
  const [leads] = useLeads();
  const [clientes] = useClientes();
  const [propostas] = usePropostas();
  const [tarefas] = useTarefas();
  const [config] = useConfig();
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const s = q.toLowerCase();
    const out: { tipo: string; nome: string; sub: string; to: string; id?: string }[] = [];
    leads.forEach((l) => {
      if (l.nome.toLowerCase().includes(s) || l.telefone.includes(q)) out.push({ tipo: "Lead", nome: l.nome, sub: l.etapa, to: "/pipeline/$id", id: l.pipeline_id });
    });
    clientes.forEach((c) => {
      if (c.nome.toLowerCase().includes(s) || c.telefone.includes(q) || (c.cpf ?? "").includes(q)) out.push({ tipo: "Cliente", nome: c.nome, sub: c.fase ?? "Cliente", to: "/clientes/$id", id: c.id });
    });
    propostas.filter(() => FEATURES.propostas).forEach((p) => {
      if (p.leadNome.toLowerCase().includes(s)) out.push({ tipo: "Proposta", nome: p.leadNome, sub: p.status, to: "/propostas" });
    });
    return out.slice(0, 8);
  }, [q, leads, clientes, propostas]);

  const notifications = useMemo<NotificationItem[]>(() => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const taskNotifications = tarefas
      .filter((task) => {
        if (task.concluida) return false;
        const due = localDate(task.data);
        return due < tomorrow;
      })
      .map((task) => {
        const due = localDate(task.data);
        const overdue = due < today;
        const leadName = leads.find((lead) => lead.id === task.lead_id)?.nome ?? task.cliente ?? "Lead sem vínculo";
        const time = due.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        const dateLabel = overdue
          ? due.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
          : "Hoje";
        return {
          id: task.id,
          title: task.titulo,
          detail: `${leadName} · ${dateLabel} às ${time}`,
          overdue,
          priority: task.prioridade,
        };
      })
      .sort((a, b) => Number(b.overdue) - Number(a.overdue));

    const staleLeadNotifications: NotificationItem[] = leads
      .filter((lead) => {
        if (["Fechado", "Perdido"].includes(lead.etapa)) return false;
        if (!lead.ultimoContato) return false;
        const days = (now.getTime() - localDate(lead.ultimoContato).getTime()) / 86400000;
        return days > 7;
      })
      .map((lead) => {
        const days = Math.floor((now.getTime() - localDate(lead.ultimoContato).getTime()) / 86400000);
        return {
          id: `stale-${lead.id}`,
          title: `Retomar contato com ${lead.nome}`,
          detail: `Sem contato há ${days} dias · ${lead.etapa}`,
          overdue: true,
        };
      });

    return [...taskNotifications, ...staleLeadNotifications].slice(0, 12);
  }, [leads, tarefas]);

  const initials = (config.consultorNome || "?").split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("");
  const openAgenda = () => navigate({ to: "/agenda" });

  return (
    <header className="sticky top-0 z-30 h-14 border-b bg-card/80 backdrop-blur flex items-center gap-3 px-4">
      <MobileNavigation />
      <div className="flex-1 max-w-xl relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar leads ou clientes..." value={q} onChange={(e) => setQ(e.target.value)} />
        {results.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-popover border rounded-md shadow-lg max-h-80 overflow-y-auto">
            {results.map((r, i) => (
              <Button key={i} variant="ghost" onClick={() => { if(r.to === '/pipeline/$id' && r.id) navigate({to:'/pipeline/$id',params:{id:r.id}}); else if(r.to === '/clientes/$id' && r.id) navigate({to:'/clientes/$id',params:{id:r.id}}); else navigate({to:'/propostas'}); setQ(""); }} className="w-full h-auto text-left px-3 py-2 hover:bg-accent flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{r.nome}</div>
                  <div className="text-xs text-muted-foreground">{r.tipo} · {r.sub}</div>
                </div>
                <Badge variant="secondary">{r.tipo}</Badge>
              </Button>
            ))}
          </div>
        )}
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button aria-label="Notificações" variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-accent flex items-center justify-center">
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">{notifications.length}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[min(22rem,calc(100vw-1.5rem))] p-0">
          <div className="px-3 py-3 border-b flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold">Sua rotina</div>
              <div className="text-xs text-muted-foreground">{notifications.length} item(ns) exigem atenção</div>
            </div>
            <Badge variant={notifications.some((item) => item.overdue) ? "destructive" : "secondary"}>{notifications.length}</Badge>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <div className="p-5 text-center">
                <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-success" />
                <p className="text-sm font-medium">Tudo em dia!</p>
                <p className="text-xs text-muted-foreground mt-1">Não há tarefas para hoje ou atrasadas.</p>
              </div>
            )}
            {notifications.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={openAgenda}
                className="w-full px-3 py-3 text-left border-b last:border-0 hover:bg-accent transition-colors flex items-start gap-2"
              >
                {item.overdue ? <AlertCircle className="h-4 w-4 mt-0.5 text-destructive shrink-0" /> : <CalendarClock className="h-4 w-4 mt-0.5 text-primary shrink-0" />}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-snug">{item.title}</span>
                  <span className="block text-xs text-muted-foreground mt-1">{item.detail}</span>
                  {item.priority && <span className="block text-[11px] text-muted-foreground mt-1">Prioridade: {item.priority}</span>}
                </span>
                {item.overdue && <Badge variant="destructive" className="shrink-0">Atrasada</Badge>}
              </button>
            ))}
          </div>
          <div className="p-2 border-t">
            <Button className="w-full" size="sm" onClick={openAgenda}>Ver todas as tarefas</Button>
          </div>
        </PopoverContent>
      </Popover>
      <Link to="/configuracoes" className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold overflow-hidden">
        {config.consultorFoto ? <img src={config.consultorFoto} alt="" className="h-full w-full object-cover" /> : initials || <User className="h-4 w-4" />}
      </Link>
    </header>
  );
}
