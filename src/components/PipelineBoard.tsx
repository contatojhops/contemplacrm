import { PipelineBadge } from "./PipelineBadge";
import { metrics, periodRange, inRange, leadCsv, type Period } from "@/lib/pipelines";
import { Download, Upload } from "lucide-react";
import { LeadImportDialog } from "@/components/LeadImportDialog";
import { changeStage, DELETE_CONFIRMATION, localDate } from "@/lib/crm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, UIEvent } from "react";
import { toast } from "sonner";
import { DndContext, pointerWithin, type DragEndEvent, PointerSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Search, LayoutGrid, List as ListIcon, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
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
import { getStageHeaderStyle } from "@/lib/stageColors";





function Column({ etapa, leads, onEdit, onAdvance, onTransfer, pipelines, showPipeline, stageColor }: { pipelines: Pipeline[]; showPipeline: boolean; onTransfer: (l: Lead) => void; etapa: Etapa; leads: Lead[]; onEdit: (l: Lead) => void; onAdvance: (l: Lead) => void; stageColor?: string; }) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa });
  const total = leads.reduce((s, l) => s + l.valorCarta, 0);
  const headerStyle = getStageHeaderStyle(etapa, stageColor);

  return (
    <div className="kanban-column flex flex-col w-72 shrink-0">
      <div className="kanban-column-header rounded-t-lg border px-3 py-2" style={headerStyle}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">{etapa}</span>
          <span className="text-xs bg-background/80 rounded-full px-2 py-0.5 font-medium">{leads.length}</span>
        </div>
        <div className="text-[11px] mt-0.5 opacity-80">{formatBRL(total)}</div>
      </div>
      <div
        ref={setNodeRef}
        data-kanban-pan-area="true"
        className={`kanban-column-body flex-1 min-h-[200px] bg-muted/40 border border-t-0 border-border rounded-b-lg p-2 space-y-2 ${isOver ? "bg-accent" : ""}`}
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
  const meetingStageIndex = stages.findIndex(stage => /reuni.*(agend|marcad)|agend.*reuni/i.test(stage));
  const shouldSetHot = (target: Etapa) => {
    const targetIndex = stages.indexOf(target);
    return meetingStageIndex >= 0 && target !== "Perdido" && targetIndex >= meetingStageIndex;
  };
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
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(() => new Set());
  const [bulkPipeline, setBulkPipeline] = useState("");
  const [bulkStage, setBulkStage] = useState("");
  const [bulkProduct, setBulkProduct] = useState("");
  const [bulkOrigin, setBulkOrigin] = useState("");
  const [bulkTemperature, setBulkTemperature] = useState("");
  const kanbanViewportRef = useRef<HTMLDivElement | null>(null);
  const kanbanContentRef = useRef<HTMLDivElement | null>(null);
  const kanbanScrollbarRef = useRef<HTMLDivElement | null>(null);
  const panRef = useRef<{ pointerId: number; startX: number; startScrollLeft: number } | null>(null);
  const [kanbanMetrics, setKanbanMetrics] = useState({ scrollWidth: 0, clientWidth: 0, scrollLeft: 0 });
  const [kanbanVisible, setKanbanVisible] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  useEffect(() => {
    const scrollbar = kanbanScrollbarRef.current;
    if (scrollbar) scrollbar.scrollLeft = kanbanMetrics.scrollLeft;
  }, [kanbanVisible, kanbanMetrics.scrollLeft]);

  const handleKanbanScrollbar = (event: UIEvent<HTMLDivElement>) => {
    const viewport = kanbanViewportRef.current;
    if (viewport && Math.abs(viewport.scrollLeft - event.currentTarget.scrollLeft) > 1) {
      viewport.scrollLeft = event.currentTarget.scrollLeft;
    }
  };

  const startKanbanPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (!target.closest("[data-kanban-pan-area]")) return;
    if (target.closest("[data-kanban-drag], button, a, input, select, [role='button']")) return;
    const viewport = kanbanViewportRef.current;
    if (!viewport || viewport.scrollWidth <= viewport.clientWidth) return;
    panRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: viewport.scrollLeft,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsPanning(true);
  };

  const moveKanbanPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pan = panRef.current;
    const viewport = kanbanViewportRef.current;
    if (!pan || !viewport || pan.pointerId !== event.pointerId) return;
    viewport.scrollLeft = pan.startScrollLeft - (event.clientX - pan.startX);
  };

  const stopKanbanPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (panRef.current?.pointerId !== event.pointerId) return;
    panRef.current = null;
    setIsPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const scrollKanban = (direction: "left" | "right") => {
    const viewport = kanbanViewportRef.current;
    if (!viewport) return;
    viewport.scrollBy({
      left: (direction === "right" ? 1 : -1) * viewport.clientWidth,
      behavior: "smooth",
    });
  };

  const [pendingAdvance, setPendingAdvance] = useState<{ lead: Lead; target: Etapa } | null>(null);
  const [noActivity, setNoActivity] = useState(false);
  const [nextType, setNextType] = useState("Follow-up");
  const [nextDateTime, setNextDateTime] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}T09:00`;
  });
  const [nextDescription, setNextDescription] = useState("");
  const [lossLead, setLossLead] = useState<Lead | null>(null);
  const [lossReason, setLossReason] = useState("");
  const move = (lead: Lead, target: Etapa) => {
    if (lead.etapa === target) return;
    if (target === "Perdido") { setLossReason(""); setLossLead(lead); return; }
    setPendingAdvance({ lead, target });
    setNoActivity(false);
    setNextType("Follow-up");
    setNextDescription("");
    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9,0,0,0);
    setNextDateTime(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}T09:00`);
  };
  const confirmAdvance = () => {
    if (!pendingAdvance) return;
    const { lead, target } = pendingAdvance;
    if (!noActivity && (!nextDescription.trim() || !nextDateTime || !Number.isFinite(new Date(nextDateTime).getTime()))) { toast.error("Informe a descrição, data e horário da próxima atividade."); return; }
    const now = new Date().toISOString();
    setLeads(prev => prev.map(item => { if (item.id !== lead.id) return item; const moved = changeStage(item, target); return { ...moved, ...(shouldSetHot(target) ? { detalhesCliente: { ...moved.detalhesCliente, temperatura: "Quente" as const } } : {}), historicoEtapas: [...(item.historicoEtapas ?? []), { id: crypto.randomUUID(), etapaAnterior: item.etapa, etapaNova: target, data: now, atividadeRegistrada: !noActivity }] }; }));
    if (!noActivity) {
      const taskId = crypto.randomUUID();
      const taskDate = new Date(nextDateTime).toISOString();
      setTasks(prev => [{ id: taskId, lead_id: lead.id, leadId: lead.id, titulo: nextType + ": " + nextDescription.trim(), tipo: nextType as "Follow-up" | "Ligação" | "WhatsApp" | "Reunião" | "E-mail" | "Visita" | "Enviar Proposta" | "Recontato" | "Outro", cliente: lead.nome, data: taskDate, concluida: false, prioridade: "Média", descricao: nextDescription.trim(), lembrete: true, proximaAcaoId: taskId }, ...prev]);
      setLeads(prev => prev.map(item => item.id === lead.id ? { ...item, detalhesCliente: { ...item.detalhesCliente, proximaAcao: { id: taskId, data: taskDate, hora: new Date(taskDate).toTimeString().slice(0,5), tipo: nextType, descricao: nextDescription.trim() } } } : item));
    }
    setPendingAdvance(null);
    toast.success(noActivity ? `Movido para ${target} sem registrar atividade` : `Movido para ${target} e próxima atividade agendada`);
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

  useEffect(() => {
    if (view !== "kanban") {
      setKanbanVisible(false);
      setKanbanMetrics({ scrollWidth: 0, clientWidth: 0, scrollLeft: 0 });
      return;
    }
    const viewport = kanbanViewportRef.current;
    if (!viewport) return;

    const syncMetrics = () => {
      const next = {
        scrollWidth: viewport.scrollWidth,
        clientWidth: viewport.clientWidth,
        scrollLeft: viewport.scrollLeft,
      };
      setKanbanMetrics(current =>
        current.scrollWidth === next.scrollWidth &&
        current.clientWidth === next.clientWidth &&
        Math.abs(current.scrollLeft - next.scrollLeft) < 1
          ? current
          : next
      );
      const scrollbar = kanbanScrollbarRef.current;
      if (scrollbar && Math.abs(scrollbar.scrollLeft - next.scrollLeft) > 1) {
        scrollbar.scrollLeft = next.scrollLeft;
      }
    };

    syncMetrics();
    viewport.addEventListener("scroll", syncMetrics, { passive: true });
    const resizeObserver = new ResizeObserver(syncMetrics);
    resizeObserver.observe(viewport);
    if (kanbanContentRef.current) resizeObserver.observe(kanbanContentRef.current);
    const intersectionObserver = new IntersectionObserver(
      entries => setKanbanVisible(entries[0]?.isIntersecting ?? false),
      { threshold: 0.05 }
    );
    intersectionObserver.observe(viewport);

    return () => {
      viewport.removeEventListener("scroll", syncMetrics);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [view, filtered.length, stages.length]);

  const toggleSort = (field: typeof sortBy) => { if (sortBy === field) setSortDirection(current => current === "asc" ? "desc" : "asc"); else { setSortBy(field); setSortDirection(field === "temperatura" ? "desc" : "asc"); } };

  const visibleLeadIds = sortedLeads.map(lead => lead.id);
  const selectedVisibleCount = visibleLeadIds.filter(id => selectedLeadIds.has(id)).length;
  const allVisibleSelected = visibleLeadIds.length > 0 && selectedVisibleCount === visibleLeadIds.length;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;
  const selectedCount = selectedLeadIds.size;
  const toggleLeadSelection = (id: string, checked: boolean) => setSelectedLeadIds(current => {
    const next = new Set(current);
    if (checked) next.add(id); else next.delete(id);
    return next;
  });
  const toggleVisibleSelection = (checked: boolean) => setSelectedLeadIds(current => {
    const next = new Set(current);
    visibleLeadIds.forEach(id => checked ? next.add(id) : next.delete(id));
    return next;
  });
  const clearSelection = () => setSelectedLeadIds(new Set());
  const applyBulkUpdate = (patch: Partial<Lead>, message: string) => {
    if (!selectedCount) return;
    setLeads(prev => prev.map(lead => selectedLeadIds.has(lead.id) ? { ...lead, ...patch } : lead));
    clearSelection();
    toast.success(message);
  };
  const applyBulkStage = () => {
    if (!bulkStage || !selectedCount) return;
    const now = new Date().toISOString();
    setLeads(prev => prev.map(lead => { if (!selectedLeadIds.has(lead.id)) return lead; const target = bulkStage as Etapa; const moved = changeStage(lead, target); return { ...moved, ...(shouldSetHot(target) ? { detalhesCliente: { ...moved.detalhesCliente, temperatura: "Quente" as const } } : {}), historicoEtapas: [...(lead.historicoEtapas ?? []), { id: crypto.randomUUID(), etapaAnterior: lead.etapa, etapaNova: bulkStage, data: now, atividadeRegistrada: false }] }; }));
    setBulkStage("");
    clearSelection();
    toast.success(`Etapa atualizada para ${bulkStage}`);
  };
  const applyBulkDelete = () => {
    if (!selectedCount || !confirm(`Excluir ${selectedCount} lead(s) selecionado(s)? Esta ação não pode ser desfeita.`)) return;
    const ids = new Set(selectedLeadIds);
    setLeads(prev => prev.filter(lead => !ids.has(lead.id)));
    setTasks(prev => prev.filter(task => !ids.has(task.lead_id)));
    clearSelection();
    toast.success(`${ids.size} lead(s) excluído(s)`);
  };

  // Select.Item não aceita value vazio. Leads importados sem produto continuam válidos,
  // mas não devem gerar uma opção vazia nos filtros e ações em massa.
  const productOptions = [...new Set([
    ...(config.produtosAtivos ?? []).filter(p => p.ativo).map(p => p.nome),
    ...leads.flatMap(lead => lead.produtos?.length ? lead.produtos.map(item => item.produto) : [lead.produto]),
  ].map(value => value?.trim()).filter((value): value is string => Boolean(value)))];
  const originOptions = [...new Set([
    ...(config.origens ?? []),
    ...leads.map(lead => lead.origem),
  ].map(value => value?.trim()).filter((value): value is string => Boolean(value)))];

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
    const existing = leads.find(item => item.id === lead.id);
    const changedStage = existing && existing.etapa !== lead.etapa;
    setLeads(prev => {
      const exists = prev.some(item => item.id === lead.id);
      const saved = changedStage && existing ? { ...lead, etapa: existing.etapa, stage_changed_at: existing.stage_changed_at, historicoEtapas: existing.historicoEtapas } : lead;
      return exists ? prev.map(item => item.id === lead.id ? saved : item) : [lead, ...prev];
    });
    if (changedStage && existing) {
      setPendingAdvance({ lead: existing, target: lead.etapa });
      setNoActivity(false);
      setNextType("Follow-up");
      setNextDescription("");
      const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9,0,0,0);
      const pad = (n: number) => String(n).padStart(2, "0");
      setNextDateTime(d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate()) + "T09:00");
    }
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
      {view === "lista" && selectedCount > 0 && <Card className="p-3 border-primary/30 bg-primary/5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-medium text-sm">{selectedCount} lead(s) selecionado(s)</div>
          <div className="flex items-center gap-2"><Button size="sm" variant="ghost" onClick={clearSelection}>Limpar seleção</Button><Button size="sm" variant="destructive" onClick={applyBulkDelete}><Trash2 className="h-4 w-4 mr-1" />Excluir selecionados</Button></div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[170px] flex-1 space-y-1"><label className="text-xs text-muted-foreground">Mover para pipeline</label><Select value={bulkPipeline} onValueChange={setBulkPipeline}><SelectTrigger><SelectValue placeholder="Selecionar pipeline" /></SelectTrigger><SelectContent>{pipelines.filter(p => !p.arquivada).map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent></Select></div>
          <Button size="sm" variant="outline" disabled={!bulkPipeline} onClick={() => { applyBulkUpdate({ pipeline_id: bulkPipeline }, "Leads movidos para outra pipeline"); setBulkPipeline(""); }}>Aplicar</Button>
          <div className="min-w-[150px] flex-1 space-y-1"><label className="text-xs text-muted-foreground">Alterar etapa</label><Select value={bulkStage} onValueChange={setBulkStage}><SelectTrigger><SelectValue placeholder="Selecionar etapa" /></SelectTrigger><SelectContent>{stages.filter(stage => stage !== "Perdido").map(stage => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}</SelectContent></Select></div>
          <Button size="sm" variant="outline" disabled={!bulkStage} onClick={applyBulkStage}>Aplicar</Button>
          <div className="min-w-[130px] flex-1 space-y-1"><label className="text-xs text-muted-foreground">Alterar produto</label><Select value={bulkProduct} onValueChange={setBulkProduct}><SelectTrigger><SelectValue placeholder="Selecionar produto" /></SelectTrigger><SelectContent>{productOptions.map(product => <SelectItem key={product} value={product}>{product}</SelectItem>)}</SelectContent></Select></div>
          <Button size="sm" variant="outline" disabled={!bulkProduct} onClick={() => { applyBulkUpdate({ produto: bulkProduct }, "Produto atualizado nos leads selecionados"); setBulkProduct(""); }}>Aplicar</Button>
          <div className="min-w-[130px] flex-1 space-y-1"><label className="text-xs text-muted-foreground">Alterar origem</label><Select value={bulkOrigin} onValueChange={setBulkOrigin}><SelectTrigger><SelectValue placeholder="Selecionar origem" /></SelectTrigger><SelectContent>{originOptions.map(origin => <SelectItem key={origin} value={origin}>{origin}</SelectItem>)}</SelectContent></Select></div>
          <Button size="sm" variant="outline" disabled={!bulkOrigin} onClick={() => { applyBulkUpdate({ origem: bulkOrigin }, "Origem atualizada nos leads selecionados"); setBulkOrigin(""); }}>Aplicar</Button>
          <div className="min-w-[130px] flex-1 space-y-1"><label className="text-xs text-muted-foreground">Temperatura</label><Select value={bulkTemperature} onValueChange={setBulkTemperature}><SelectTrigger><SelectValue placeholder="Selecionar temperatura" /></SelectTrigger><SelectContent><SelectItem value="Frio">Frio</SelectItem><SelectItem value="Morno">Morno</SelectItem><SelectItem value="Quente">Quente</SelectItem></SelectContent></Select></div>
          <Button size="sm" variant="outline" disabled={!bulkTemperature} onClick={() => { const temperature = bulkTemperature as "Frio" | "Morno" | "Quente"; setLeads(prev => prev.map(lead => selectedLeadIds.has(lead.id) ? { ...lead, detalhesCliente: { ...lead.detalhesCliente, temperatura } } : lead)); clearSelection(); setBulkTemperature(""); toast.success("Temperatura atualizada nos leads selecionados"); }}>Aplicar</Button>
        </div>
        <p className="text-xs text-muted-foreground">A seleção considera os leads marcados, mesmo que você altere os filtros. Para marcar todos os resultados atuais, use a caixa no cabeçalho da tabela. A etapa “Perdido” continua exigindo motivo e deve ser aplicada individualmente.</p>
      </Card>}

      {view === "kanban" ? (
        <>
          <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
            <div
              ref={kanbanViewportRef}
              data-kanban-pan-area="true"
              onPointerDown={startKanbanPan}
              onPointerMove={moveKanbanPan}
              onPointerUp={stopKanbanPan}
              onPointerCancel={stopKanbanPan}
              className={`overflow-x-auto overflow-y-hidden pb-8 ${isPanning ? "cursor-grabbing select-none" : "cursor-grab"}`}
              aria-label="Quadros do Kanban. Arraste para os lados para navegar."
            >
              <div ref={kanbanContentRef} className="flex w-max gap-3">
                {stages.map((e) => (
                  <Column
                    key={e}
                    etapa={e}
                    stageColor={config.etapas?.find(item => item.nome === e)?.cor}
                    leads={filtered.filter((l) => l.etapa === e)}
                    onEdit={(l) => { setEditing(l); setModalOpen(true); }}
                    onAdvance={handleAdvance}
                    pipelines={pipelines} showPipeline={!pipelineId}
                    onTransfer={l=>{setTransfer(l);setDestination("");}}
                  />
                ))}
              </div>
            </div>
          </DndContext>

          {kanbanVisible && kanbanMetrics.scrollWidth > kanbanMetrics.clientWidth + 2 && (
            <>
              <div className="pointer-events-none fixed bottom-3 left-4 right-4 z-40 flex justify-center lg:left-[17rem]">
                <div
                  ref={kanbanScrollbarRef}
                  onScroll={handleKanbanScrollbar}
                  tabIndex={0}
                  aria-label="Barra de rolagem horizontal do Kanban"
                  className="kanban-horizontal-scrollbar pointer-events-auto h-3 w-full max-w-full overflow-x-auto overflow-y-hidden rounded-full border border-white/10 bg-[#0D172B]/90 px-1 shadow-lg backdrop-blur-xl"
                >
                  <div style={{ width: `${kanbanMetrics.scrollWidth}px`, height: "1px" }} />
                </div>
              </div>
              <div className="fixed right-4 top-1/2 z-40 flex flex-col gap-2">
                {kanbanMetrics.scrollLeft > 2 && (
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Rolar Kanban para a esquerda"
                    title="Voltar nos quadros"
                    className="h-9 w-9 rounded-full border-white/15 bg-[#0D172B]/95 text-white shadow-xl backdrop-blur-xl hover:bg-primary hover:text-white"
                    onClick={() => scrollKanban("left")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                {kanbanMetrics.scrollLeft < kanbanMetrics.scrollWidth - kanbanMetrics.clientWidth - 2 && (
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Rolar Kanban para a direita"
                    title="Avançar nos quadros"
                    className="h-9 w-9 rounded-full border-white/15 bg-[#0D172B]/95 text-white shadow-xl backdrop-blur-xl hover:bg-primary hover:text-white"
                    onClick={() => scrollKanban("right")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </>
          )}
        </>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><Checkbox aria-label="Selecionar todos os leads exibidos" checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false} onCheckedChange={value => toggleVisibleSelection(value === true)} /></TableHead>
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
              {filtered.length === 0 && <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">Nenhum lead encontrado</TableCell></TableRow>}
              {sortedLeads.map((l) => (
                <TableRow key={l.id} data-state={selectedLeadIds.has(l.id) ? "selected" : undefined}>
                  <TableCell><Checkbox aria-label={`Selecionar ${l.nome}`} checked={selectedLeadIds.has(l.id)} onCheckedChange={value => toggleLeadSelection(l.id, value === true)} /></TableCell>
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

      <Dialog open={!!pendingAdvance} onOpenChange={open => !open && setPendingAdvance(null)}><DialogContent>
        <DialogHeader><DialogTitle>Avançar lead para {pendingAdvance?.target}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Defina o próximo passo para {pendingAdvance?.lead.nome}.</p>
          <div className="flex items-center gap-2 rounded-md border border-border p-3">
            <Checkbox id="no-next-activity" checked={noActivity} onCheckedChange={value => setNoActivity(value === true)} />
            <label htmlFor="no-next-activity" className="text-sm cursor-pointer">Não registrar nenhuma atividade no momento</label>
          </div>
          {!noActivity && <div className="space-y-3">
            <div><label className="text-sm font-medium">Tipo de atividade</label><Select value={nextType} onValueChange={setNextType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Follow-up","Ligação","WhatsApp","Reunião","E-mail","Visita","Enviar Proposta","Recontato","Outro"].map(type=><SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm font-medium">Data e horário</label><Input type="datetime-local" value={nextDateTime} onChange={e=>setNextDateTime(e.target.value)} /></div>
            <div><label className="text-sm font-medium">Descrição da próxima atividade</label><Textarea value={nextDescription} onChange={e=>setNextDescription(e.target.value)} placeholder="Ex.: Ligar para apresentar a simulação..." /></div>
          </div>}
        </div>
        <DialogFooter><Button variant="outline" onClick={()=>setPendingAdvance(null)}>Cancelar</Button><Button onClick={confirmAdvance}>Confirmar avanço</Button></DialogFooter>
      </DialogContent></Dialog>
      <Dialog open={!!lossLead} onOpenChange={open => !open && setLossLead(null)}><DialogContent><DialogHeader><DialogTitle>Motivo da perda</DialogTitle></DialogHeader><Textarea aria-label="Motivo da perda" value={lossReason} onChange={e => setLossReason(e.target.value)} /><DialogFooter><Button variant="outline" onClick={() => setLossLead(null)}>Cancelar</Button><Button onClick={() => { if (!lossLead || !lossReason.trim()) { toast.error("Informe o motivo da perda."); return; } setLeads(prev => prev.map(l => l.id === lossLead.id ? changeStage(l, "Perdido", lossReason) : l)); setLossLead(null); toast.success("Lead marcado como perdido"); }}>Confirmar perda</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={!!transfer} onOpenChange={v=>!v&&setTransfer(null)}><DialogContent><DialogHeader><DialogTitle>Mover para outra pipeline</DialogTitle></DialogHeader><Select value={destination} onValueChange={setDestination}><SelectTrigger aria-label="Pipeline de destino"><SelectValue placeholder="Selecione a pipeline" /></SelectTrigger><SelectContent>{pipelines.filter(p=>!p.arquivada&&p.id!==transfer?.pipeline_id).map(p=><SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent></Select><DialogFooter><Button variant="outline" onClick={()=>setTransfer(null)}>Cancelar</Button><Button disabled={!destination} onClick={()=>{if(!transfer)return;setLeads(prev=>prev.map(l=>l.id===transfer.id?{...l,pipeline_id:destination}:l));setTransfer(null);toast.success("Lead movido para outra pipeline");}}>Mover lead</Button></DialogFooter></DialogContent></Dialog>
      <LeadImportDialog defaultPipelineId={pipelineId} open={importOpen} onOpenChange={setImportOpen} />
      <LeadModal defaultPipelineId={pipelineId} open={modalOpen} onOpenChange={setModalOpen} initial={editing} onSave={handleSave} />
    </div>
  );
}
