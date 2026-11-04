import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Pipeline, PipelineCor } from '@/lib/types';
import { usePipelines } from '@/lib/store';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { pipelineDot } from './PipelineBadge';
export function PipelineModal({ open, onOpenChange, initial }: { open:boolean; onOpenChange:(v:boolean)=>void; initial?:Pipeline|null }) {
  const [pipelines,save] = usePipelines();
  const [nome,setNome] = useState(''); const [descricao,setDescricao] = useState(''); const [cor,setCor] = useState<PipelineCor>('azul');
  useEffect(()=>{if(open){setNome(initial?.nome??'');setDescricao(initial?.descricao??'');setCor(initial?.cor??'azul');}},[open,initial]);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{initial?'Editar pipeline':'Nova pipeline'}</DialogTitle></DialogHeader>
    <div className="space-y-3"><div><Label htmlFor="pipeline-nome">Nome</Label><Input id="pipeline-nome" placeholder="Evento X, Grupo WhatsApp, Indicações, Tráfego Pago" value={nome} onChange={e=>setNome(e.target.value)} /></div><div><Label htmlFor="pipeline-descricao">Descrição</Label><Textarea id="pipeline-descricao" value={descricao} onChange={e=>setDescricao(e.target.value)} /></div><div><Label>Cor</Label><div className="flex gap-2 mt-2">{(Object.keys(pipelineDot) as PipelineCor[]).map(c=><Button key={c} size="icon" variant="outline" aria-label={`Cor ${c}`} aria-pressed={cor===c} onClick={()=>setCor(c)} className={cor===c?'ring-2 ring-ring':''}><span className={`h-4 w-4 rounded-full ${pipelineDot[c]}`} /></Button>)}</div></div></div>
    <DialogFooter><Button variant="outline" onClick={()=>onOpenChange(false)}>Cancelar</Button><Button onClick={()=>{if(!nome.trim()){toast.error('Informe o nome da pipeline.');return;} if(pipelines.some(p=>p.id!==initial?.id&&p.nome.toLowerCase()===nome.trim().toLowerCase())){toast.error('Já existe uma pipeline com esse nome.');return;} const p:Pipeline={id:initial?.id??crypto.randomUUID(),nome:nome.trim(),descricao:descricao.trim(),cor,ordem:initial?.ordem??pipelines.length,arquivada:initial?.arquivada??false,created_at:initial?.created_at??new Date().toISOString()};save(prev=>initial?prev.map(x=>x.id===p.id?p:x):[...prev,p]);onOpenChange(false);toast.success('Pipeline salva');}}>Salvar pipeline</Button></DialogFooter>
  </DialogContent></Dialog>;
}