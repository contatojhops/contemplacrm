import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { MoreVertical, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useLeads, usePipelines, useTarefas } from '@/lib/store';
import { activeLead, deletePipeline } from '@/lib/pipelines';
import type { Pipeline } from '@/lib/types';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PipelineModal } from './PipelineModal';
import { pipelineDot } from './PipelineBadge';

export function PipelineSelector({ pipelineId }: { pipelineId?: string }) {
  const [pipelines, setPipelines] = usePipelines();
  const [leads, setLeads] = useLeads();
  const [tasks, setTasks] = useTarefas();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Pipeline | null>(null);
  const [removing, setRemoving] = useState<Pipeline | null>(null);
  const [target, setTarget] = useState('');
  const navigate = useNavigate();
  const sorted = [...pipelines].sort((a, b) => a.ordem - b.ordem);
  const current = pipelines.find(p => p.id === pipelineId);
  const selectPipeline = (id: string) => {
    if (id === 'all') navigate({ to: '/pipeline/todos' });
    else navigate({ to: '/pipeline/$id', params: { id } });
  };
  return (
    <div className="flex items-center gap-1">
      <Select value={pipelineId ?? 'all'} onValueChange={selectPipeline}>
        <SelectTrigger aria-label="Selecionar pipeline" className="h-10 w-[190px] bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as pipelines</SelectItem>
          {sorted.map(p => (
            <SelectItem key={p.id} value={p.id}>
              <span className="flex items-center gap-2"><span className={`h-2 w-2 shrink-0 rounded-full ${pipelineDot[p.cor]}`} />{p.nome}{p.arquivada ? ' (arquivada)' : ''}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="outline" className="h-10 w-9 shrink-0" aria-label="Opções de pipelines"><MoreVertical className="h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => { setEditing(null); setModal(true); }}><Plus className="h-4 w-4" />Nova pipeline</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={!current} onSelect={() => { if (current) { setEditing(current); setModal(true); } }}>Editar pipeline atual</DropdownMenuItem>
          <DropdownMenuItem disabled={!current} onSelect={() => {
            if (!current) return;
            if (!current.arquivada && pipelines.filter(x => !x.arquivada).length <= 1) { toast.error('Mantenha pelo menos uma pipeline disponível.'); return; }
            setPipelines(prev => prev.map(x => x.id === current.id ? { ...x, arquivada: !x.arquivada } : x));
          }}>{current?.arquivada ? 'Desarquivar pipeline atual' : 'Arquivar pipeline atual'}</DropdownMenuItem>
          <DropdownMenuItem disabled={!current} className="text-destructive focus:text-destructive" onSelect={() => {
            if (!current) return;
            if (pipelines.length <= 1) { toast.error('Não é possível excluir a última pipeline.'); return; }
            setTarget('');
            setRemoving(current);
          }}>Excluir pipeline atual</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <PipelineModal open={modal} onOpenChange={setModal} initial={editing} />
      <Dialog open={!!removing} onOpenChange={v => !v && setRemoving(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir pipeline {removing?.nome}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{leads.filter(l => l.pipeline_id === removing?.id).length} leads nesta pipeline. Esta ação não pode ser desfeita.</p>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger aria-label="Destino dos leads"><SelectValue placeholder="Escolha o destino dos leads" /></SelectTrigger>
            <SelectContent>
              {pipelines.filter(p => p.id !== removing?.id && !p.arquivada).map(p => <SelectItem key={p.id} value={p.id}>Mover para {p.nome}</SelectItem>)}
              <SelectItem value="delete">Excluir também os leads e suas tarefas</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)}>Cancelar</Button>
            <Button variant="destructive" disabled={!target} onClick={() => {
              if (!removing) return;
              try {
                const result = deletePipeline(pipelines, leads, tasks, removing.id, target === 'delete' ? undefined : target);
                setLeads(result.leads);
                setTasks(result.tasks);
                setPipelines(result.pipelines);
                setRemoving(null);
                navigate({ to: '/pipeline/todos' });
                toast.success('Pipeline excluída');
              } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível excluir.'); }
            }}>Confirmar exclusão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
