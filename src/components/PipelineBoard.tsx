import { PipelineBadge } from "./PipelineBadge";
import { metrics, periodRange, inRange, leadCsv, type Period } from "@/lib/pipelines";
import { Download, Upload } from "lucide-react";
import { LeadImportDialog } from "@/components/LeadImportDialog";
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
import { useLeads, usePipelines, useTarefas, useConfig } from "@/lib/store";
import type { Lead, Etapa, Pipeline } from "@/lib/types";
import { LeadCard, produtoColor } from "@/components/LeadCard";
import { LeadModal } from "@/components/LeadModal";
import { PipelineSelector } from "@/components/PipelineSelector";
import { formatBRL } from "@/lib/scoring";





function Column({ etapa, leads, onEdit, onAdvance, onTransfer, pipelines, showPipeline }: { pipelines: Pipeline[]; showPipeline: boolean; onTransfer: (l: Lead) => void; etapa: Etapa; leads: Lead[]; onEdit: (l: Lead) => void; onAdvance: (l: Lead) => void; }) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa });
  const total = leads.reduce((s, l) => s + l.valorCarta, 0);
  const headerColor =
    ["Lead Novo", "Contato Realizado"].includes(etapa) ? "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-800" :
    ["Reunião Agendada", "Proposta Enviada"].includes(etapa) ? "bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-950/60 dark:text-yellow-200 dark:border-yellow-800" :
    etapa === "Aguardando Pagamento" ? "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/60 dark:text-orange-200 dark:border-orange-800" :
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
  const [config] = useConfig();
  const stages = (config.etapas ?? []).map(item => item.nome);
  const [,setTasks] = useTarefas();
  const pipeline = pipelines.find(p => p.id === pipelineId);
  const [period,setPeriod] = useState<Period>("todos");
  const [customStart,setCustomStart] = useState("");
  const [customEnd,setCustomEnd] = useState("");
  const [filterTemperatura,setFilterTemperatura] = useState("all");
  const [filterPipeline,setFilterPipeline] = useState("all");
  const [sortBy,setSortBy] = useState<"nome"|"pipeline"|"produto"|"origem"|"etapa"|"temperatura"|"followUp"|"valor">("nome");
  const [sortDirection,setSortDirection] = useState<"asc"|"desc">("asc");
  const [transfer,setTransfer] = useState<Lead|null>(null);
  const [destination,setDestination] = useState("");
  const [leads, setLeads] = useLeads();
  const [view, setView] = useState<"kanban" | "lista">("kanban");
  const [search, setSearch] = useState("");
  const [filterProduto, setFilterProduto] = useState<string>("all");
  const [filterOrigem, setFilterOrigem] = useState<string>("all");
  const [filterEtapa, setFilterEtapa] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
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
    const range = periodRange(period, new Date(), customStart, customEnd);
    if (!inRange(l.criadoEm,range.start,range.end)) return false;
    if (search && !l.nome.toLowerCase().includes(search.toLowerCase()) && !l.telefone.includes(search)) return false;
    if (filterProduto !== "all" && l.produto !== filterProduto) return false;
    if (filterOrigem !== "all" && l.origem !== filterOrigem) return false;
    if (filterEtapa !== "all" && l.etapa !== filterEtapa) return false;
    if (filterTemperatura !== "all" && (l.detalhesCliente?.temperatura ?? "Morno") !== filterTemperatura) return false;
    if (filterPipeline !== "all" && l.pipeline_id !== filterPipeline) return false;
    return true;
  }), [leads, search, filterProduto, filterOrigem, filterEtapa, filterTemperatura, filterPipeline, pipelineId, period, customStart, customEnd]);

  const sortedLeads = useMemo(() => [...filtered].sort((a,b) => {
    const rank = (value?: string) => value === "Quente" ? 3 : value === "Frio" ? 1 : 2;
    let comparison = 0;
    if (sortBy === "temperatura") comparison = rank(a.detalhesCliente?.temperatura) - rank(b.detalhesCliente?.temperatura);
    else if (sortBy === "followUp") comparison = (a.proximoFollowUp ? localDate(a.proximoFollowUp).getTime() : 0) - (b.proximoFollowUp ? localDate(b.proximoFollowUp).getTime() : 0);
    else if (sortBy === "valor") comparison = a.valorCarta - b.valorCarta;
    else {
      const value = (lead: Lead) => sortBy === "pipeline" ? pipelines.find(p=>p.id===lead.pipeline_id)?.nome ?? "" : sortBy === "produto" ? lead.produto : sortBy === "origem" ? lead.origem : sortBy === "etapa" ? lead.etapa : lead.nome;
      comparison = value(a).localeCompare(value(b), "pt-BR", { sensitivity: "base" });
    }
    return comparison * (sortDirection === "asc" ? 1 : -1);
  }), [filtered, sortBy, sortDirection, pipelines]);
  const toggleSort = (field: typeof sortBy) => { if (sortBy === field) setSortDirection(current => current === "asc" ? "desc" : "asc"); else { setSortBy(field); setSortDirection(field === "temperatura" ? "desc" : "asc"); } };

  const productOptions = [...new Set([...(config.produtosAtivos ?? []).filter(p => p.ativo).map(p => p.nome), ...leads.map(l => l.produto)])];
  const originOptions = [...new Set([...(config.origens ?? []), ...leads.map(l => l.origem)])];

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const leadId = String(active.id);
    const overId = String(over.id);
    const target = stages.includes(overId) ? (overId as Etapa) : leads.find((l) => l.id === overId)?.etapa;
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
    const idx = stages.indexOf(lead.etapa);
    if (idx < 0 || idx >= stages.length - 2) return;
    move(lead, stages[idx + 1] as Etapa);
  };

  const range = periodRange("todos");
  const summary = metrics(leads.filter(l=>!pipelineId || l.pipeline_id===pipelineId), range.start,range.end);
  const exportCsv = () => {const blob = new Blob([leadCsv(filtered,pipelines)],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`leads-${new Date().toLocaleDateString("sv-SE")}.csv`;a.click();URL.revokeObjectURL(url);};
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
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" />Exportar CSV</Button><Button variant="outline" disabled={pipeline?.arquivada} onClick={() => setImportOpen(true)}><Upload className="h-4 w-4 mr-2" />Importar leads</Button><Button disabled={pipeline?.arquivada} onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />Novo Lead
        </Button></div>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou telefone" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={period} onValueChange={v=>setPeriod(v as Period)}><SelectTrigger aria-label="Período dos leads" className="w-[170px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todo o período</SelectItem><SelectItem value="mes">Mês atual</SelectItem><SelectItem value="7dias">Últimos 7 dias</SelectItem><SelectItem value="30dias">Últimos 30 dias</SelectItem><SelectItem value="semana">Semana atual</SelectItem><SelectItem value="personalizado">Personalizado</SelectItem></SelectContent></Select>
          {period === "personalizado" && <><Input aria-label="Data inicial do período" type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} className="w-[155px]" /><Input aria-label="Data final do período" type="date" min={customStart || undefined} value={customEnd} onChange={e=>setCustomEnd(e.target.value)} className="w-[155px]" /></>}
          <Select value={filterProduto} onValueChange={setFilterProduto}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Produto" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Produtos</SelectItem>
              {productOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterOrigem} onValueChange={setFilterOrigem}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Origem" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Origens</SelectItem>
              {originOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterTemperatura} onValueChange={setFilterTemperatura}><SelectTrigger className="w-[150px]"><SelectValue placeholder="Temperatura" /></SelectTrigger><SelectContent><SelectItem value="all">Todas temperaturas</SelectItem><SelectItem value="Quente">Quente</SelectItem><SelectItem value="Morno">Morno</SelectItem><SelectItem value="Frio">Frio</SelectItem></SelectContent></Select>
          <Select value={filterPipeline} onValueChange={setFilterPipeline}><SelectTrigger className="w-[150px]"><SelectValue placeholder="Pipeline" /></SelectTrigger><SelectContent><SelectItem value="all">Todas pipelines</SelectItem>{pipelines.filter(p=>!p.arquivada).map(p=><SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent></Select>
          <Select value={filterEtapa} onValueChange={setFilterEtapa}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Etapa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Etapas</SelectItem>
              {stages.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
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
            {stages.map((e) => (
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
                <TableHead><button type="button" className="inline-flex items-center gap-1 hover:text-primary" onClick={() => toggleSort("nome")}>Nome<span aria-hidden="true">{sortBy === "nome" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span></button></TableHead>
                <TableHead><button type="button" className="inline-flex items-center gap-1 hover:text-primary" onClick={() => toggleSort("pipeline")}>Pipeline<span aria-hidden="true">{sortBy === "pipeline" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span></button></TableHead>
                <TableHead><button type="button" className="inline-flex items-center gap-1 hover:text-primary" onClick={() => toggleSort("produto")}>Produto<span aria-hidden="true">{sortBy === "produto" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span></button></TableHead>
                <TableHead><button type="button" className="inline-flex items-center gap-1 hover:text-primary" onClick={() => toggleSort("origem")}>Origem<span aria-hidden="true">{sortBy === "origem" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span></button></TableHead>
                <TableHead><button type="button" className="inline-flex items-center gap-1 hover:text-primary" onClick={() => toggleSort("etapa")}>Etapa<span aria-hidden="true">{sortBy === "etapa" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span></button></TableHead>
                <TableHead><button type="button" className="inline-flex items-center gap-1 hover:text-primary" onClick={() => toggleSort("temperatura")}>Temperatura<span aria-hidden="true">{sortBy === "temperatura" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span></button></TableHead>
                <TableHead><button type="button" className="inline-flex items-center gap-1 hover:text-primary" onClick={() => toggleSort("followUp")}>Próximo Follow-up<span aria-hidden="true">{sortBy === "followUp" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span></button></TableHead>
                <TableHead><button type="button" className="inline-flex items-center gap-1 hover:text-primary" onClick={() => toggleSort("valor")}>Valor Carta<span aria-hidden="true">{sortBy === "valor" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span></button></TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum lead encontrado</TableCell></TableRow>}
              {sortedLeads.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.nome}</TableCell>
                  <TableCell><PipelineBadge pipeline={pipelines.find(p=>p.id===l.pipeline_id)} /></TableCell>
                  <TableCell><span className={`text-xs px-2 py-0.5 rounded border ${produtoColor[l.produto] ?? "bg-muted text-muted-foreground border-border"}`}>{l.produto}</span></TableCell>
                  <TableCell>{l.origem}</TableCell>
                  <TableCell><Select value={l.etapa} onValueChange={v => move(l, v as Etapa)}><SelectTrigger aria-label={`Etapa de ${l.nome}`}><SelectValue /></SelectTrigger><SelectContent>{stages.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent></Select></TableCell>
                  <TableCell><span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium border ${l.detalhesCliente?.temperatura === "Frio" ? "bg-blue-500/15 text-blue-700 border-blue-500/30" : l.detalhesCliente?.temperatura === "Quente" ? "bg-red-500/15 text-red-700 border-red-500/30" : "bg-gray-500/15 text-gray-700 border-gray-500/30"}`}>{l.detalhesCliente?.temperatura ?? "Morno"}</span></TableCell>
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
      <LeadImportDialog defaultPipelineId={pipelineId} open={importOpen} onOpenChange={setImportOpen} />
      <LeadModal defaultPipelineId={pipelineId} open={modalOpen} onOpenChange={setModalOpen} initial={editing} onSave={handleSave} />
    </div>
  );
}
