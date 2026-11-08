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
import type { Lead, Produto, Origem, Etapa } from "@/lib/types";


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
  const stages = (config.etapas ?? []).map(item => item.nome);
  const defaultStage = stages.find(stage => !["Fechado", "Perdido"].includes(stage)) ?? "Novo Lead";
  const stageOptions = initial ? stages : stages.filter(stage => !["Fechado", "Perdido"].includes(stage));
  const [form, setForm] = useState<Partial<Lead>>(initial ?? {
    pipeline_id: defaultPipelineId ?? pipelines.find(p=>!p.arquivada)?.id ?? GENERAL_ID,
    etapa: defaultStage,
    nome: "", telefone: "", email: "", produto: "Imóvel", valorCarta: 0,
    origem: "WhatsApp", perfil: "", observacoes: "",
  });

  useEffect(() => {
    if (open) {
      const existingHistory = initial?.detalhesCliente?.historicoAtualizacoes ?? [];
      const legacyUpdate = initial?.detalhesCliente?.atualizacoes?.trim();
      const history = legacyUpdate && !existingHistory.some(item => item.texto === legacyUpdate)
        ? [...existingHistory, { id: crypto.randomUUID(), texto: legacyUpdate, data: "" }]
        : existingHistory;
      setForm(initial ? { ...initial, detalhesCliente: { ...initial.detalhesCliente, atualizacoes: "", historicoAtualizacoes: history } } : {
        pipeline_id: defaultPipelineId ?? pipelines.find(p=>!p.arquivada)?.id ?? GENERAL_ID,
        etapa: defaultStage,
        nome: "", telefone: "", email: "",
        produto: config.produtosAtivos?.find(p => p.ativo)?.nome ?? "Imóvel",
        valorCarta: 0,
        origem: config.origens?.[0] ?? "WhatsApp",
        perfil: "", observacoes: "",
      });
    }
  }, [open, initial, defaultPipelineId, pipelines, config.produtosAtivos, config.origens, defaultStage]);

  const update = (patch: Partial<Lead>) => setForm((f) => ({ ...f, ...patch }));
  const updateCommercial = (patch: Partial<NonNullable<Lead["detalhesCliente"]>>) => setForm(f => ({ ...f, detalhesCliente: { ...f.detalhesCliente, ...patch } }));
  const registerUpdate = () => {
    const text = form.detalhesCliente?.atualizacoes?.trim() ?? "";
    if (!text) { toast.error("Escreva uma atualização antes de registrar."); return; }
    updateCommercial({ atualizacoes: "", historicoAtualizacoes: [...(form.detalhesCliente?.historicoAtualizacoes ?? []), { id: crypto.randomUUID(), texto: text, data: new Date().toISOString() }] });
    toast.success("Atualização registrada no histórico.");
  };

  const submit = () => {
    if (!form.nome?.trim() || !form.telefone?.trim()) { toast.error("Preencha nome e telefone."); return; }
    if ((form.valorCarta ?? 0) < 0) { toast.error("Informe um valor válido."); return; }
    if (!form.pipeline_id || !pipelines.some(p=>p.id===form.pipeline_id && (!p.arquivada || p.id===initial?.pipeline_id))) { toast.error("Selecione uma pipeline disponível."); return; }
    if (!form.etapa || !stageOptions.includes(form.etapa)) { toast.error("Selecione uma etapa válida."); return; }
    const now = new Date().toISOString();
    const lead: Lead = {
      ...initial,
      stage_changed_at: initial && form.etapa !== initial.etapa ? now : initial?.stage_changed_at ?? now,
      historicoEtapas: initial && form.etapa !== initial.etapa
        ? [...(initial.historicoEtapas ?? []), { id: crypto.randomUUID(), etapaAnterior: initial.etapa, etapaNova: form.etapa, data: now, atividadeRegistrada: false }]
        : initial?.historicoEtapas ?? [],
      pipeline_id: form.pipeline_id,
      id: initial?.id ?? crypto.randomUUID(),
      nome: form.nome.trim(),
      telefone: form.telefone.trim(),
      email: form.email ?? "",
      produto: form.produto as Produto,
      valorCarta: Number(form.valorCarta) || 0,
      origem: form.origem as Origem,
      etapa: (form.etapa as Etapa) ?? defaultStage,
      perfil: form.perfil,
      observacoes: form.observacoes,
      ultimoContato: initial?.ultimoContato ?? now,
      diasNaEtapa: initial && form.etapa !== initial.etapa ? 0 : initial?.diasNaEtapa ?? 0,
      criadoEm: initial?.criadoEm ?? now,
      respondeuMensagem: initial?.respondeuMensagem,
      reuniaoAgendada: initial?.reuniaoAgendada,
      temUrgencia: initial?.temUrgencia,
      rendaEstimada: initial?.rendaEstimada,
      proximoFollowUp: initial?.proximoFollowUp,
      proximaAcaoTipo: initial?.proximaAcaoTipo,
      detalhesCliente: {
        ...initial?.detalhesCliente,
        objetivo: form.detalhesCliente?.objetivo,
        capacidadeMensal: form.detalhesCliente?.capacidadeMensal,
        temperatura: form.detalhesCliente?.temperatura,
        atualizacoes: "",
        historicoAtualizacoes: form.detalhesCliente?.historicoAtualizacoes ?? initial?.detalhesCliente?.historicoAtualizacoes ?? [],
      },
    };
    onSave(lead);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar Lead" : "Novo Lead"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2">
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
          <div><Label>Pipeline</Label><Select value={form.pipeline_id} onValueChange={v=>update({pipeline_id:v})}><SelectTrigger aria-label="Pipeline do lead"><SelectValue placeholder="Selecione a pipeline" /></SelectTrigger><SelectContent>{pipelines.filter(p=>!p.arquivada || p.id===initial?.pipeline_id).map(p=><SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent></Select></div>
          <div className="col-span-2"><Label>{initial ? "Etapa atual no Kanban" : "Etapa inicial no Kanban"}</Label><Select value={form.etapa ?? defaultStage} onValueChange={v=>update({etapa:v})}><SelectTrigger aria-label="Etapa do lead"><SelectValue placeholder="Selecione a etapa" /></SelectTrigger><SelectContent>{stageOptions.map(stage=><SelectItem key={stage} value={stage}>{stage}</SelectItem>)}</SelectContent></Select></div>
          <div className="col-span-2">
            <Label>Perfil do cliente</Label>
            <Input value={form.perfil ?? ""} onChange={(e) => update({ perfil: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label>Objetivo do cliente</Label>
            <Input placeholder="Ex.: comprar imóvel para renda, trocar de veículo, investir..." value={form.detalhesCliente?.objetivo ?? ""} onChange={(e) => updateCommercial({ objetivo: e.target.value })} />
          </div>
          <div>
            <Label>Capacidade mensal (R$)</Label>
            <Input type="number" min="0" value={form.detalhesCliente?.capacidadeMensal ?? ""} onChange={(e) => updateCommercial({ capacidadeMensal: e.target.value === "" ? undefined : Number(e.target.value) })} />
          </div>
          <div>
            <Label>Temperatura</Label>
            <Select value={form.detalhesCliente?.temperatura ?? "Morno"} onValueChange={(v) => updateCommercial({ temperatura: v as "Frio" | "Morno" | "Quente" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Frio">Frio</SelectItem>
                <SelectItem value="Morno">Morno</SelectItem>
                <SelectItem value="Quente">Quente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Observações iniciais</Label>
            <Textarea value={form.observacoes ?? ""} onChange={(e) => update({ observacoes: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label>Atualizações da negociação</Label>
            <Textarea rows={3} placeholder="Registre uma nova atualização da negociação..." value={form.detalhesCliente?.atualizacoes ?? ""} onChange={(e) => updateCommercial({ atualizacoes: e.target.value })} />
            <div className="mt-2 flex justify-end">
              <Button type="button" size="sm" variant="secondary" onClick={registerUpdate}>Registrar atualização</Button>
            </div>
            {(form.detalhesCliente?.historicoAtualizacoes ?? []).length > 0 && <section className="space-y-2 mt-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Histórico</h4>
              {(form.detalhesCliente?.historicoAtualizacoes ?? []).slice().reverse().map(item => <div key={item.id} className="rounded-md border border-border p-2 text-xs"><div className="text-muted-foreground mb-1">{item.data ? new Date(item.data).toLocaleString("pt-BR") : "Data não disponível (registro anterior)"}</div>{item.texto}</div>)}
            </section>}
          </div>
        </div>
        <DialogFooter className="shrink-0 border-t pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
