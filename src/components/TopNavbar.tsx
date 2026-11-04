import { Button } from "@/components/ui/button";
import { FEATURES } from "@/lib/features";
import { MobileNavigation } from "./MobileNavigation";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLeads, useClientes, usePropostas, useTarefas, useConfig } from "@/lib/store";

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
    const out: { tipo: string; nome: string; sub: string; to: string }[] = [];
    leads.forEach((l) => {
      if (l.nome.toLowerCase().includes(s) || l.telefone.includes(q)) out.push({ tipo: "Lead", nome: l.nome, sub: l.etapa, to: "/leads" });
    });
    clientes.forEach((c) => {
      if (c.nome.toLowerCase().includes(s) || c.telefone.includes(q) || (c.cpf ?? "").includes(q)) out.push({ tipo: "Cliente", nome: c.nome, sub: c.fase ?? "Cliente", to: `/clientes/${c.id}` });
    });
    propostas.filter(() => FEATURES.propostas).forEach((p) => {
      if (p.leadNome.toLowerCase().includes(s)) out.push({ tipo: "Proposta", nome: p.leadNome, sub: p.status, to: "/propostas" });
    });
    return out.slice(0, 8);
  }, [q, leads, clientes, propostas]);

  const notifications = useMemo(() => {
    const list: { id: string; texto: string; tipo: string }[] = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    leads.forEach((l) => {
      if (l.proximoFollowUp && new Date(l.proximoFollowUp) < today && !["Fechado", "Perdido"].includes(l.etapa)) {
        list.push({ id: `f${l.id}`, texto: `Follow-up com ${l.nome} está atrasado`, tipo: "atraso" });
      }
      const dias = (Date.now() - new Date(l.ultimoContato).getTime()) / 86400000;
      if (dias > 7 && !["Fechado", "Perdido"].includes(l.etapa)) {
        list.push({ id: `c${l.id}`, texto: `${l.nome} sem contato há ${Math.floor(dias)} dias`, tipo: "contato" });
      }
    });
    const tHoje = tarefas.filter((t) => !t.concluida && new Date(t.data).toDateString() === new Date().toDateString());
    if (tHoje.length > 0) list.push({ id: "thoje", texto: `Você tem ${tHoje.length} tarefa(s) para hoje`, tipo: "tarefa" });
    return list.slice(0, 10);
  }, [leads, tarefas]);

  const initials = config.consultorNome.split(" ").map((n) => n[0]).slice(0, 2).join("");

  return (
    <header className="sticky top-0 z-30 h-14 border-b bg-card/80 backdrop-blur flex items-center gap-3 px-4">
      <MobileNavigation />
      <div className="flex-1 max-w-xl relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar leads ou clientes..." value={q} onChange={(e) => setQ(e.target.value)} />
        {results.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-popover border rounded-md shadow-lg max-h-80 overflow-y-auto">
            {results.map((r, i) => (
              <Button key={i} onClick={() => { navigate({ to: r.to }); setQ(""); }} className="w-full text-left px-3 py-2 hover:bg-accent flex items-center justify-between text-sm">
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
        <PopoverContent align="end" className="w-80 p-0">
          <div className="px-3 py-2 border-b text-sm font-semibold">Notificações</div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && <div className="p-4 text-sm text-muted-foreground">Sem notificações 🎉</div>}
            {notifications.map((n) => (
              <div key={n.id} className="px-3 py-2 text-sm border-b last:border-0 hover:bg-accent">{n.texto}</div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <Link to="/configuracoes" className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold overflow-hidden">
        {config.consultorFoto ? <img src={config.consultorFoto} alt="" className="h-full w-full object-cover" /> : initials || <User className="h-4 w-4" />}
      </Link>
    </header>
  );
}
