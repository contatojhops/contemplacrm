import { PipelineBadge } from "./PipelineBadge";
import { ETAPAS, metrics, periodRange, inRange, leadCsv, type Period } from "@/lib/pipelines";
import { Download } from "lucide-react";
import { changeStage, DELETE_CONFIRMATION, localDate } from "@/lib/crm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DndContext, pointerWithin, type DragEndEvent, PointerSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Search, LayoutGrid, List as ListIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLeads, usePipelines, useTarefas } from "@/lib/store";
import type { Lead, Etapa, Produto, Origem, Pipeline } from "@/lib/types";
import { LeadCard, ScoreBadge, produtoColor } from "@/components/LeadCard";
import { LeadModal } from "@/components/LeadModal";
import { PipelineSelector } from "@/components/PipelineSelector";
import { calcScore, formatBRL } from "@/lib/scoring";





function Column({ etapa, leads, onEdit, onAdvance, onTransfer, pipelines, showPipeline }: { pipelines: Pipeline[]; showPipeline: boolean; onTransfer: (l: Lead) => void; etapa: Etapa; leads: Lead[]; onEdit: (l: Lead) => void; onAdvance: (l: Lead) => void; }) {
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
          {leads.map((l) => <LeadCard key={l.id} lead={l} onEdit={onEdit} onAdvance={onAdvance} onTransfer={onTransfer} pipeline={pipelines.find(p=>p.id===l.pipeline_id)} showPipeline={showPipeline} />)}
        </SortableContext>
      </div>
    </div>
  );
}

export function PipelineBoard({ pipelineId }: { pipelineId?: string }) {
  const [pipelines] = usePipelines();
  const [,setTasks] = useTarefas();
  const pipeline = pipelines.find(p => p.id === pipelineId);
  const [period,setPeriod] = useState<Period>("todos");
  const [transfer,setTransfer] = useState<Lead|null>(null);
  const [destination,setDestination] = useState("");
  const [leads, setLeads] = useLeads();
  const [view, setView] = useState<"kanban" | "lista">("kanban");
  const [search, setSearch] = useState("");
  const [filterProduto, setFilterProduto] = useState<string>("all");
  const [filterOrigem, setFilterOrigem] = useState<string>("all");
  const [filterEtapa, setFilterEtapa] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);

  const [lossLead, setLossLead] = useState<Lead | null>(null);
  const [lossReason, setLossReason] = useState("");
  const move = (lead: Lead, target: Etapa) => {
    if (lead.etapa === target) return;
    if (target === "Perdido") { setLossReason(""); setLossLead(lead); return; }
    setLeads(prev => prev.map(l => l.id === lead.id ? changeStage(l, target) : l));
    toast.success(`Movido para ${target}`);
  };
  const remove = (lead: Lead) => {
    if (!confirm(DELETE_CONFIRMATION)) return;
    setLeads(prev => prev.filter(l => l.id !== lead.id));
    setTasks(prev=>prev.filter(t=>t.lead_id!==lead.id));
    toast.success("Lead excluído");
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const filtered = useMemo(() => leads.filter((l) => {
    if (pipelineId && l.pipeline_id !== pipelineId) return false;
    const range = periodRange(period);
    if (!inRange(l.criadoEm,range.start,range.end)) return false;
    if (search && !l.nome.toLowerCase().includes(search.toLowerCase()) && !l.telefone.includes(search)) return false;
    if (filterProduto !== "all" && l.produto !== filterProduto) return false;
    if (filterOrigem !== "all" && l.origem !== filterOrigem) return false;
    if (filterEtapa !== "all" && l.etapa !== filterEtapa) return false;
    return true;
  }), [leads, search, filterProduto, filterOrigem, filterEtapa, pipelineId, period]);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const leadId = String(active.id);
    const overId = String(over.id);
    const target = ETAPAS.includes(overId as Etapa) ? (overId as Etapa) : leads.find((l) => l.id === overId)?.etapa;
    if (!target) return;
    const lead = leads.find(l => l.id === leadId);
    if (lead) move(lead, target);
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
    move(lead, ETAPAS[idx + 1]);
  };

  const range = periodRange("todos");
  const summary = metrics(leads.filter(l=>!pipelineId || l.pipeline_id===pipelineId), range.start,range.end);
  const exportCsv = () => {const blob = new Blob([leadCsv(filtered,pipelines)],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="leads.csv";a.click();URL.revokeObjectURL(url);};
  if (pipelineId && !pipeline) return <div className="p-6 text-muted-foreground">Pipeline não encontrada.</div>;
  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{pipeline?.nome ?? "Todos os leads"}</h1>
            <PipelineSelector pipelineId={pipelineId} />
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2"><PipelineBadge pipeline={pipeline} /><span className="text-sm text-muted-foreground">{summary.leads} leads · {summary.ativos} ativos · {formatBRL(summary.aberto)} em aberto · {summary.conversao.toFixed(1)}% conversão</span></div>
        </div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" />Exportar CSV</Button><Button disabled={pipeline?.arquivada} onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />Novo Lead
        </Button></div>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou telefone" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={period} onValueChange={v=>setPeriod(v as Period)}><SelectTrigger aria-label="Período dos leads" className="w-[160px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todo o período</SelectItem><SelectItem value="mes">Mês atual</SelectItem><SelectItem value="30dias">Últimos 30 dias</SelectItem></SelectContent></Select>
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

      {filtered.length === 0 && <p className="text-sm text-muted-foreground">Nenhum lead ainda — cadastre o primeiro</p>}
      {view === "kanban" ? (
        <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {ETAPAS.map((e) => (
              <Column
                key={e}
                etapa={e}
                leads={filtered.filter((l) => l.etapa === e)}
                onEdit={(l) => { setEditing(l); setModalOpen(true); }}
                onAdvance={handleAdvance}
                pipelines={pipelines} showPipeline={!pipelineId}
                onTransfer={l=>{setTransfer(l);setDestination("");}}
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
                <TableHead>Pipeline</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Próximo Follow-up</TableHead>
                <TableHead>Valor Carta</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum lead encontrado</TableCell></TableRow>}
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.nome}</TableCell>
                  <TableCell><PipelineBadge pipeline={pipelines.find(p=>p.id===l.pipeline_id)} /></TableCell>
                  <TableCell><span className={`text-xs px-2 py-0.5 rounded border ${produtoColor[l.produto]}`}>{l.produto}</span></TableCell>
                  <TableCell>{l.origem}</TableCell>
                  <TableCell><Select value={l.etapa} onValueChange={v => move(l, v as Etapa)}><SelectTrigger aria-label={`Etapa de ${l.nome}`}><SelectValue /></SelectTrigger><SelectContent>{ETAPAS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent></Select></TableCell>
                  <TableCell><ScoreBadge score={calcScore(l)} /></TableCell>
                  <TableCell>{l.proximoFollowUp ? localDate(l.proximoFollowUp).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  <TableCell>{formatBRL(l.valorCarta)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => { setEditing(l); setModalOpen(true); }}>Editar</Button>
                    <Button variant="ghost" size="sm" onClick={()=>{setTransfer(l);setDestination("");}}>Mover pipeline</Button>
                    <Button size="icon" variant="ghost" aria-label={`Excluir ${l.nome}`} onClick={() => remove(l)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={!!lossLead} onOpenChange={open => !open && setLossLead(null)}><DialogContent><DialogHeader><DialogTitle>Motivo da perda</DialogTitle></DialogHeader><Textarea aria-label="Motivo da perda" value={lossReason} onChange={e => setLossReason(e.target.value)} /><DialogFooter><Button variant="outline" onClick={() => setLossLead(null)}>Cancelar</Button><Button onClick={() => { if (!lossLead || !lossReason.trim()) { toast.error("Informe o motivo da perda."); return; } setLeads(prev => prev.map(l => l.id === lossLead.id ? changeStage(l, "Perdido", lossReason) : l)); setLossLead(null); toast.success("Lead marcado como perdido"); }}>Confirmar perda</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={!!transfer} onOpenChange={v=>!v&&setTransfer(null)}><DialogContent><DialogHeader><DialogTitle>Mover para outra pipeline</DialogTitle></DialogHeader><Select value={destination} onValueChange={setDestination}><SelectTrigger aria-label="Pipeline de destino"><SelectValue placeholder="Selecione a pipeline" /></SelectTrigger><SelectContent>{pipelines.filter(p=>!p.arquivada&&p.id!==transfer?.pipeline_id).map(p=><SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent></Select><DialogFooter><Button variant="outline" onClick={()=>setTransfer(null)}>Cancelar</Button><Button disabled={!destination} onClick={()=>{if(!transfer)return;setLeads(prev=>prev.map(l=>l.id===transfer.id?{...l,pipeline_id:destination}:l));setTransfer(null);toast.success("Lead movido para outra pipeline");}}>Mover lead</Button></DialogFooter></DialogContent></Dialog>
      <LeadModal defaultPipelineId={pipelineId} open={modalOpen} onOpenChange={setModalOpen} initial={editing} onSave={handleSave} />
    </div>
  );
}
