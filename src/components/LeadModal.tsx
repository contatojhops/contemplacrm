import { usePipelines, useConfig } from "@/lib/store";
import { GENERAL_ID } from "@/lib/pipelines";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Lead, Produto, Origem } from "@/lib/types";


interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  initial?: Lead | null;
  defaultPipelineId?: string;
  onSave: (l: Lead) => void;
}

export function LeadModal({ open, onOpenChange, initial, onSave, defaultPipelineId }: Props) {
  const [pipelines] = usePipelines();
  const [config] = useConfig();
  const produtos = (config.produtosAtivos ?? []).filter(p => p.ativo).map(p => p.nome);
  const origens = config.origens ?? [];
  const [form, setForm] = useState<Partial<Lead>>(initial ?? {
    nome: "", telefone: "", email: "", produto: "Imóvel", valorCarta: 0,
    origem: "WhatsApp", perfil: "", observacoes: "",
  });

  useEffect(() => {
    if (open) setForm(initial ?? {
      pipeline_id: defaultPipelineId ?? pipelines.find(p=>!p.arquivada)?.id ?? GENERAL_ID,
      nome: "", telefone: "", email: "",
      produto: config.produtosAtivos?.find(p => p.ativo)?.nome ?? "Imóvel",
      valorCarta: 0,
      origem: config.origens?.[0] ?? "WhatsApp",
      perfil: "", observacoes: "",
    });
  }, [open, initial, defaultPipelineId, pipelines, config.produtosAtivos, config.origens]);

  const update = (patch: Partial<Lead>) => setForm((f) => ({ ...f, ...patch }));

  const submit = () => {
    if (!form.nome?.trim() || !form.telefone?.trim()) { toast.error("Preencha nome e telefone."); return; }
    if ((form.valorCarta ?? 0) < 0) { toast.error("Informe um valor válido."); return; }
    if (!form.pipeline_id || !pipelines.some(p=>p.id===form.pipeline_id && (!p.arquivada || p.id===initial?.pipeline_id))) { toast.error("Selecione uma pipeline disponível."); return; }
    const now = new Date().toISOString();
    const lead: Lead = {
      ...initial,
      stage_changed_at: initial?.stage_changed_at ?? now,
      pipeline_id: form.pipeline_id,
      id: initial?.id ?? crypto.randomUUID(),
      nome: form.nome.trim(),
      telefone: form.telefone.trim(),
      email: form.email ?? "",
      produto: form.produto as Produto,
      valorCarta: Number(form.valorCarta) || 0,
      origem: form.origem as Origem,
      etapa: initial?.etapa ?? "Novo Lead",
      perfil: form.perfil,
      observacoes: form.observacoes,
      ultimoContato: initial?.ultimoContato ?? now,
      diasNaEtapa: initial?.diasNaEtapa ?? 0,
      criadoEm: initial?.criadoEm ?? now,
      respondeuMensagem: initial?.respondeuMensagem,
      reuniaoAgendada: initial?.reuniaoAgendada,
      temUrgencia: initial?.temUrgencia,
      rendaEstimada: initial?.rendaEstimada,
      proximoFollowUp: initial?.proximoFollowUp,
      proximaAcaoTipo: initial?.proximaAcaoTipo,
    };
    onSave(lead);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar Lead" : "Novo Lead"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Nome completo</Label>
            <Input value={form.nome ?? ""} onChange={(e) => update({ nome: e.target.value })} />
          </div>
          <div>
            <Label>Telefone (WhatsApp)</Label>
            <Input value={form.telefone ?? ""} onChange={(e) => update({ telefone: e.target.value })} />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input value={form.email ?? ""} onChange={(e) => update({ email: e.target.value })} />
          </div>
          <div>
            <Label>Produto</Label>
            <Select value={form.produto} onValueChange={(v) => update({ produto: v as Produto })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{[...new Set([...produtos, ...(form.produto ? [form.produto] : [])])].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Valor da Carta (R$)</Label>
            <Input type="number" value={form.valorCarta ?? 0} onChange={(e) => update({ valorCarta: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Origem</Label>
            <Select value={form.origem} onValueChange={(v) => update({ origem: v as Origem })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{[...new Set([...origens, ...(form.origem ? [form.origem] : [])])].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label>Pipeline</Label><Select value={form.pipeline_id} onValueChange={v=>update({pipeline_id:v})}><SelectTrigger aria-label="Pipeline do lead"><SelectValue placeholder="Selecione a pipeline" /></SelectTrigger><SelectContent>{pipelines.filter(p=>!p.arquivada || p.id===initial?.pipeline_id).map(p=><SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent></Select></div>
          <div className="col-span-2">
            <Label>Perfil do cliente</Label>
            <Input value={form.perfil ?? ""} onChange={(e) => update({ perfil: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label>Observações iniciais</Label>
            <Textarea value={form.observacoes ?? ""} onChange={(e) => update({ observacoes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
