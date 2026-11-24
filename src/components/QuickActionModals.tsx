import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { matchesSearch } from "@/lib/search";
import { localDate, localInput } from "@/lib/crm";
import { toast } from "sonner";
import type { Lead, Tarefa, TarefaTipo, TarefaPrioridade, Interacao, InteracaoTipo, InteracaoResultado } from "@/lib/types";

const TIPOS: TarefaTipo[] = ["Follow-up", "Ligação", "WhatsApp", "Reunião", "E-mail", "Visita", "Enviar Proposta", "Recontato", "Outro"];
const PRIORIDADES: TarefaPrioridade[] = ["Alta", "Média", "Baixa"];
const INTERACAO_TIPOS: InteracaoTipo[] = ["WhatsApp", "Ligação", "Reunião", "Instagram DM", "E-mail", "Presencial"];
const RESULTADOS: InteracaoResultado[] = ["Positivo", "Neutro", "Negativo"];
const OBJECOES = ["Parcela muito alta", "Preciso pensar mais", "Tenho dívidas", "Não conheço consórcio", "Tenho medo de não ser contemplado", "Já tentei consórcio antes", "Prefiro financiamento", "Não tenho urgência agora"];

export function QuickTaskModal({ open, onOpenChange, leads, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; leads: Lead[]; onSave: (task: Tarefa) => void }) {
  const [titulo, setTitulo] = useState("");
  const [leadId, setLeadId] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  const [tipo, setTipo] = useState<TarefaTipo>("Follow-up");
  const [prioridade, setPrioridade] = useState<TarefaPrioridade>("Média");
  const [data, setData] = useState(localInput());
  const [descricao, setDescricao] = useState("");
  const [lembrete, setLembrete] = useState(false);
  useEffect(() => { if (open) { setTitulo(""); setLeadId(""); setLeadSearch(""); setTipo("Follow-up"); setPrioridade("Média"); setData(localInput()); setDescricao(""); setLembrete(false); } }, [open]);
  const submit = () => {
    const linked = leads.find(l => l.id === leadId);
    if (!titulo.trim()) { toast.error("Preencha o título da tarefa"); return; }
    if (!data || !Number.isFinite(new Date(data).getTime())) { toast.error("Informe uma data válida"); return; }
    onSave({ id: crypto.randomUUID(), titulo: titulo.trim(), tipo, cliente: linked?.nome ?? "", lead_id: linked?.id ?? "", leadId: linked?.id, data: new Date(data).toISOString(), concluida: false, prioridade, descricao, lembrete });
    onOpenChange(false);
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader><div className="space-y-3">
    <div><Label>Título</Label><Input value={titulo} onChange={e=>setTitulo(e.target.value)} /></div>
    <div><Label>Lead (opcional)</Label><Input aria-label="Buscar lead da tarefa" placeholder="Buscar por nome ou telefone" value={leadSearch} onChange={e=>setLeadSearch(e.target.value)} /><div className="flex items-center gap-2 mt-2"><Select value={leadId || undefined} onValueChange={setLeadId}><SelectTrigger aria-label="Lead da tarefa"><SelectValue placeholder="Sem lead vinculado" /></SelectTrigger><SelectContent>{leads.filter(l=>matchesSearch(leadSearch,{text:[l.nome],digits:[l.telefone]})).map(l=><SelectItem key={l.id} value={l.id}>{l.nome} · {l.telefone}</SelectItem>)}</SelectContent></Select>{leadId && <Button type="button" size="sm" variant="ghost" onClick={()=>setLeadId("")}>Remover</Button>}</div></div>
    <div className="grid grid-cols-2 gap-3"><div><Label>Tipo</Label><Select value={tipo} onValueChange={v=>setTipo(v as TarefaTipo)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TIPOS.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div><div><Label>Prioridade</Label><Select value={prioridade} onValueChange={v=>setPrioridade(v as TarefaPrioridade)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORIDADES.map(p=><SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div></div>
    <div><Label>Data e hora</Label><Input type="datetime-local" value={data} onChange={e=>setData(e.target.value)} /></div>
    <div><Label>Descrição</Label><Textarea value={descricao} onChange={e=>setDescricao(e.target.value)} /></div>
    <div className="flex items-center gap-2"><Switch checked={lembrete} onCheckedChange={setLembrete} /><Label>Ativar lembrete</Label></div>
  </div><DialogFooter><Button variant="outline" onClick={()=>onOpenChange(false)}>Cancelar</Button><Button onClick={submit}>Salvar</Button></DialogFooter></DialogContent></Dialog>;
}

export function QuickInteractionModal({ open, onOpenChange, leads, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; leads: { id: string; nome: string; telefone: string }[]; onSave: (leadId: string, interaction: Interacao) => void }) {
  const [leadId, setLeadId] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  const [tipo, setTipo] = useState<InteracaoTipo>("WhatsApp");
  const [data, setData] = useState(localInput());
  const [duracao, setDuracao] = useState(0);
  const [resumo, setResumo] = useState("");
  const [resultado, setResultado] = useState<InteracaoResultado>("Neutro");
  const [objs, setObjs] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  useEffect(() => { if (open) { setLeadId(""); setLeadSearch(""); setTipo("WhatsApp"); setData(localInput()); setDuracao(0); setResumo(""); setResultado("Neutro"); setObjs([]); setCustom(""); } }, [open]);
  const submit = () => {
    if (!leadId) { toast.error("Selecione um lead ou cliente"); return; }
    if (!data || !Number.isFinite(new Date(data).getTime())) { toast.error("Informe uma data válida"); return; }
    if (!resumo.trim()) { toast.error("Adicione um resumo"); return; }
    onSave(leadId, { id: crypto.randomUUID(), tipo, data: new Date(data).toISOString(), duracao, resumo: resumo.trim(), resultado, objecoes: objs });
    onOpenChange(false);
    toast.success("Interação registrada");
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Registrar Interação</DialogTitle></DialogHeader><div className="space-y-3">
    <div><Label>Lead / Cliente</Label><Input placeholder="Buscar por nome ou telefone" value={leadSearch} onChange={e=>setLeadSearch(e.target.value)} /><Select value={leadId || undefined} onValueChange={setLeadId}><SelectTrigger className="mt-2"><SelectValue placeholder="Selecione o contato" /></SelectTrigger><SelectContent>{leads.filter(l=>matchesSearch(leadSearch,{text:[l.nome],digits:[l.telefone]})).map(l=><SelectItem key={l.id} value={l.id}>{l.nome} · {l.telefone}</SelectItem>)}</SelectContent></Select></div>
    <div className="grid grid-cols-2 gap-3"><div><Label>Tipo</Label><Select value={tipo} onValueChange={v=>setTipo(v as InteracaoTipo)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{INTERACAO_TIPOS.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div><div><Label>Resultado</Label><Select value={resultado} onValueChange={v=>setResultado(v as InteracaoResultado)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{RESULTADOS.map(r=><SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div><div><Label>Data e hora</Label><Input type="datetime-local" value={data} onChange={e=>setData(e.target.value)} /></div><div><Label>Duração (min)</Label><Input type="number" value={duracao} onChange={e=>setDuracao(Number(e.target.value))} /></div></div>
    <div><Label>Resumo</Label><Textarea value={resumo} onChange={e=>setResumo(e.target.value)} /></div>
    <div><Label>Objeções mencionadas</Label><div className="flex flex-wrap gap-1 mt-1">{OBJECOES.map(o=><Badge key={o} variant={objs.includes(o)?"default":"outline"} className="cursor-pointer" onClick={()=>setObjs(p=>p.includes(o)?p.filter(x=>x!==o):[...p,o])}>{o}</Badge>)}</div><div className="flex gap-2 mt-2"><Input placeholder="Outra objeção" value={custom} onChange={e=>setCustom(e.target.value)} /><Button type="button" onClick={()=>{if(custom.trim()){setObjs(p=>[...p,custom.trim()]);setCustom("");}}}>Adicionar</Button></div></div>
  </div><DialogFooter><Button variant="outline" onClick={()=>onOpenChange(false)}>Cancelar</Button><Button onClick={submit}>Salvar</Button></DialogFooter></DialogContent></Dialog>;
}
