import { useState } from 'react';
import { Link, useRouterState, useNavigate } from '@tanstack/react-router';
import { Target, ChevronDown, Plus, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { usePipelines, useLeads, useTarefas } from '@/lib/store';
import { activeLead, deletePipeline } from '@/lib/pipelines';
import type { Pipeline } from '@/lib/types';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PipelineModal } from './PipelineModal';
import { pipelineDot } from './PipelineBadge';
export function PipelineNavigation({ onNavigate }: { onNavigate?:()=>void }) {
  const [open,setOpen]=useLocalStorage('crm.pipeline_menu_open',true);
  const [pipelines,setPipelines]=usePipelines();const [leads,setLeads]=useLeads();const [tasks,setTasks]=useTarefas();
  const [modal,setModal]=useState(false);const [editing,setEditing]=useState<Pipeline|null>(null);const [removing,setRemoving]=useState<Pipeline|null>(null);const [target,setTarget]=useState('');
  const path=useRouterState({select:s=>s.location.pathname});const navigate=useNavigate();
  return <div><Button variant="ghost" className="w-full justify-start text-sidebar-foreground" onClick={()=>setOpen(!open)} aria-expanded={open}><Target className="h-4 w-4" /><span className="flex-1 text-left">Leads & Pipeline</span><ChevronDown className={`h-4 w-4 transition-transform ${open?'':'-rotate-90'}`} /></Button>
    {open&&<div className="ml-3 border-l border-sidebar-border pl-2 space-y-1"><Link to="/pipeline/todos" onClick={onNavigate} className={`block rounded-md px-2 py-2 text-sm ${path==='/pipeline/todos'?'bg-sidebar-primary text-sidebar-primary-foreground':'hover:bg-sidebar-accent'}`}>Todos os leads</Link>
    {[...pipelines].sort((a,b)=>a.ordem-b.ordem).map(p=><div key={p.id} className={`flex items-center rounded-md ${path===`/pipeline/${p.id}`?'bg-sidebar-primary text-sidebar-primary-foreground':'hover:bg-sidebar-accent'}`}><Link to="/pipeline/$id" params={{id:p.id}} onClick={onNavigate} className="flex flex-1 min-w-0 items-center gap-2 px-2 py-2 text-sm"><span className={`h-2 w-2 shrink-0 rounded-full ${pipelineDot[p.cor]}`} /><span className="truncate">{p.nome}{p.arquivada?' (arquivada)':''}</span><span className="ml-auto text-xs">{leads.filter(l=>l.pipeline_id===p.id&&activeLead(l)).length}</span></Link><DropdownMenu><DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" aria-label={`Opções de ${p.nome}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={()=>{setEditing(p);setModal(true);}}>Editar</DropdownMenuItem><DropdownMenuItem onSelect={()=>{if(!p.arquivada&&pipelines.filter(x=>!x.arquivada).length<=1){toast.error('Mantenha pelo menos uma pipeline disponível.');return;}setPipelines(prev=>prev.map(x=>x.id===p.id?{...x,arquivada:!x.arquivada}:x));}}>{p.arquivada?'Desarquivar':'Arquivar'}</DropdownMenuItem><DropdownMenuItem onSelect={()=>{if(pipelines.length<=1){toast.error('Não é possível excluir a última pipeline.');return;}setTarget('');setRemoving(p);}}>Excluir</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>)}
    <Button variant="ghost" className="w-full justify-start text-sidebar-foreground" onClick={()=>{setEditing(null);setModal(true);}}><Plus className="h-3.5 w-3.5" />Nova pipeline</Button></div>}
    <PipelineModal open={modal} onOpenChange={setModal} initial={editing} />
    <Dialog open={!!removing} onOpenChange={v=>!v&&setRemoving(null)}><DialogContent><DialogHeader><DialogTitle>Excluir pipeline {removing?.nome}</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">{leads.filter(l=>l.pipeline_id===removing?.id).length} leads nesta pipeline. Esta ação não pode ser desfeita.</p><Select value={target} onValueChange={setTarget}><SelectTrigger aria-label="Destino dos leads"><SelectValue placeholder="Escolha o destino dos leads" /></SelectTrigger><SelectContent>{pipelines.filter(p=>p.id!==removing?.id&&!p.arquivada).map(p=><SelectItem key={p.id} value={p.id}>Mover para {p.nome}</SelectItem>)}<SelectItem value="delete">Excluir também os leads e suas tarefas</SelectItem></SelectContent></Select><DialogFooter><Button variant="outline" onClick={()=>setRemoving(null)}>Cancelar</Button><Button variant="destructive" disabled={!target} onClick={()=>{if(!removing)return;try{const result=deletePipeline(pipelines,leads,tasks,removing.id,target==='delete'?undefined:target);setLeads(result.leads);setTasks(result.tasks);setPipelines(result.pipelines);setRemoving(null);navigate({to:'/pipeline/todos'});toast.success('Pipeline excluída');}catch(e){toast.error(e instanceof Error?e.message:'Não foi possível excluir.');}}}>Confirmar exclusão</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}