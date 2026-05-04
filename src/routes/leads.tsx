import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Search, LayoutGrid, List as ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLeads } from "@/lib/store";
import type { Lead, Etapa, Produto, Origem, Temperatura } from "@/lib/types";
import { LeadCard, ScoreBadge, produtoColor } from "@/components/LeadCard";
import { LeadModal } from "@/components/LeadModal";
import { calcScore, formatBRL } from "@/lib/scoring";

export const Route = createFileRoute("/leads")({ component: LeadsPage });

const ETAPAS: Etapa[] = ["Novo Lead", "Contato Realizado", "Proposta Enviada", "Em Análise", "Fechado", "Perdido"];

function Column({ etapa, leads, onEdit, onAdvance }: { etapa: Etapa; leads: Lead[]; onEdit: (l: Lead) => void; onAdvance: (l: Lead) => void; }) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa });
  const total = leads.reduce((s, l) => s + l.valorCarta, 0);
  const headerColor =
    etapa === "Fechado" ? "bg-success/10 text-success border-success/30" :
    etapa === "Perdido" ? "bg-destructive/10 text-destructive border-destructive/30" :
    "bg-accent border-border";

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className={`rounded-t-lg border px-3 py-2 ${headerColor}`}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">{etapa}</span>
          <span className="text-xs bg-background/80 rounded-full px-2 py-0.5 font-medium">{leads.length}</span>
        </div>
        <div className="text-[11px] mt-0.5 opacity-80">{formatBRL(total)}</div>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[200px] bg-muted/40 border border-t-0 border-border rounded-b-lg p-2 space-y-2 ${isOver ? "bg-accent" : ""}`}
      >
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((l) => <LeadCard key={l.id} lead={l} onEdit={onEdit} onAdvance={onAdvance} />)}
        </SortableContext>
      </div>
    </div>
  );
}

function LeadsPage() {
  const [leads, setLeads] = useLeads();
  const [view, setView] = useState<"kanban" | "lista">("kanban");
  const [search, setSearch] = useState("");
  const [filterProduto, setFilterProduto] = useState<string>("all");
  const [filterOrigem, setFilterOrigem] = useState<string>("all");
  const [filterTemp, setFilterTemp] = useState<string>("all");
  const [filterEtapa, setFilterEtapa] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const filtered = useMemo(() => leads.filter((l) => {
    if (search && !l.nome.toLowerCase().includes(search.toLowerCase()) && !l.telefone.includes(search)) return false;
    if (filterProduto !== "all" && l.produto !== filterProduto) return false;
    if (filterOrigem !== "all" && l.origem !== filterOrigem) return false;
    if (filterTemp !== "all" && l.temperatura !== filterTemp) return false;
    if (filterEtapa !== "all" && l.etapa !== filterEtapa) return false;
    return true;
  }), [leads, search, filterProduto, filterOrigem, filterTemp, filterEtapa]);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const leadId = String(active.id);
    const overId = String(over.id);
    const target = ETAPAS.includes(overId as Etapa) ? (overId as Etapa) : leads.find((l) => l.id === overId)?.etapa;
    if (!target) return;
    setLeads((prev) => prev.map((l) => l.id === leadId && l.etapa !== target ? { ...l, etapa: target, diasNaEtapa: 0 } : l));
  };

  const handleSave = (lead: Lead) => {
    setLeads((prev) => {
      const exists = prev.some((p) => p.id === lead.id);
      return exists ? prev.map((p) => p.id === lead.id ? lead : p) : [lead, ...prev];
    });
    toast.success(editing ? "Lead atualizado!" : "Lead cadastrado com sucesso!");
    setEditing(null);
  };

  const handleAdvance = (lead: Lead) => {
    const idx = ETAPAS.indexOf(lead.etapa);
    if (idx < 0 || idx >= ETAPAS.length - 2) return;
    setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, etapa: ETAPAS[idx + 1], diasNaEtapa: 0 } : l));
    toast.success(`Movido para ${ETAPAS[idx + 1]}`);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline de Vendas</h1>
          <p className="text-muted-foreground">Gerencie seus leads e oportunidades</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />Novo Lead
        </Button>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou telefone" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterProduto} onValueChange={setFilterProduto}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Produto" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Produtos</SelectItem>
              {(["Imóvel","Veículo","Serviço","Moto","Investimento","Outros"] as Produto[]).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterOrigem} onValueChange={setFilterOrigem}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Origem" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Origens</SelectItem>
              {(["Meta Ads","Instagram","WhatsApp","Indicação","Orgânico","Outros"] as Origem[]).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterTemp} onValueChange={setFilterTemp}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Temperatura" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {(["Frio","Morno","Quente"] as Temperatura[]).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterEtapa} onValueChange={setFilterEtapa}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Etapa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Etapas</SelectItem>
              {ETAPAS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex border border-border rounded-md overflow-hidden">
            <Button size="sm" variant={view === "kanban" ? "default" : "ghost"} onClick={() => setView("kanban")} className="rounded-none">
              <LayoutGrid className="h-4 w-4 mr-1" />Kanban
            </Button>
            <Button size="sm" variant={view === "lista" ? "default" : "ghost"} onClick={() => setView("lista")} className="rounded-none">
              <ListIcon className="h-4 w-4 mr-1" />Lista
            </Button>
          </div>
        </div>
      </Card>

      {view === "kanban" ? (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {ETAPAS.map((e) => (
              <Column
                key={e}
                etapa={e}
                leads={filtered.filter((l) => l.etapa === e)}
                onEdit={(l) => { setEditing(l); setModalOpen(true); }}
                onAdvance={handleAdvance}
              />
            ))}
          </div>
        </DndContext>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Temperatura</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Próximo Follow-up</TableHead>
                <TableHead>Valor Carta</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.nome}</TableCell>
                  <TableCell><span className={`text-xs px-2 py-0.5 rounded border ${produtoColor[l.produto]}`}>{l.produto}</span></TableCell>
                  <TableCell>{l.temperatura}</TableCell>
                  <TableCell>{l.origem}</TableCell>
                  <TableCell>{l.etapa}</TableCell>
                  <TableCell><ScoreBadge score={calcScore(l)} /></TableCell>
                  <TableCell>{l.proximoFollowUp ? new Date(l.proximoFollowUp).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  <TableCell>{formatBRL(l.valorCarta)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => { setEditing(l); setModalOpen(true); }}>Editar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <LeadModal open={modalOpen} onOpenChange={setModalOpen} initial={editing} onSave={handleSave} />
    </div>
  );
}
