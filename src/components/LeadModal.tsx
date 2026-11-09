import { usePipelines, useConfig } from "@/lib/store";
import { GENERAL_ID } from "@/lib/pipelines";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Lead, LeadProduto, Produto, Origem, Etapa } from "@/lib/types";


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
    nome: "", telefone: "", email: "", produto: "Imóvel", valorCarta: 0, produtos: [{ produto: "Imóvel", quantidade: 1, valorUnitario: 0 }],
    origem: "WhatsApp", perfil: "", observacoes: "",
  });

  useEffect(() => {
    if (open) {
      const existingHistory = initial?.detalhesCliente?.historicoAtualizacoes ?? [];
      const legacyUpdate = initial?.detalhesCliente?.atualizacoes?.trim();
      const history = legacyUpdate && !existingHistory.some(item => item.texto === legacyUpdate)
        ? [...existingHistory, { id: crypto.randomUUID(), texto: legacyUpdate, data: "" }]
        : existingHistory;
      setForm(initial ? { ...initial, produtos: initial.produtos?.length ? initial.produtos : [{ produto: initial.produto, quantidade: 1, valorUnitario: initial.valorCarta }], detalhesCliente: { ...initial.detalhesCliente, atualizacoes: "", historicoAtualizacoes: history } } : {
        pipeline_id: defaultPipelineId ?? pipelines.find(p=>!p.arquivada)?.id ?? GENERAL_ID,
        etapa: defaultStage,
        nome: "", telefone: "", email: "",
        produto: config.produtosAtivos?.find(p => p.ativo)?.nome ?? "Imóvel",
        valorCarta: 0,
        produtos: [{ produto: config.produtosAtivos?.find(p => p.ativo)?.nome ?? "Imóvel", quantidade: 1, valorUnitario: 0 }],
        origem: config.origens?.[0] ?? "WhatsApp",
        perfil: "", observacoes: "",
      });
    }
  }, [open, initial, defaultPipelineId, pipelines, config.produtosAtivos, config.origens, defaultStage]);

  const update = (patch: Partial<Lead>) => setForm((f) => ({ ...f, ...patch }));
  const productRows = form.produtos?.length ? form.produtos : [{ produto: form.produto ?? "Imóvel", quantidade: 1, valorUnitario: form.valorCarta ?? 0 }];
  const totalProdutos = useMemo(() => productRows.reduce((sum, item) => sum + Math.max(0, Number(item.quantidade) || 0) * Math.max(0, Number(item.valorUnitario) || 0), 0), [productRows]);
  const updateProduct = (index: number, patch: Partial<LeadProduto>) => update({ produtos: productRows.map((item, i) => i === index ? { ...item, ...patch } : item) });
  const addProduct = () => update({ produtos: [...productRows, { produto: produtos[0] ?? "Imóvel", quantidade: 1, valorUnitario: 0 }] });
  const removeProduct = (index: number) => update({ produtos: productRows.filter((_, i) => i !== index) });
  const updateCommercial = (patch: Partial<NonNullable<Lead["detalhesCliente"]>>) => setForm(f => ({ ...f, detalhesCliente: { ...f.detalhesCliente, ...patch } }));
  const registerUpdate = () => {
    const text = form.detalhesCliente?.atualizacoes?.trim() ?? "";
    if (!text) { toast.error("Escreva uma atualização antes de registrar."); return; }
    updateCommercial({ atualizacoes: "", historicoAtualizacoes: [...(form.detalhesCliente?.historicoAtualizacoes ?? []), { id: crypto.randomUUID(), texto: text, data: new Date().toISOString() }] });
    toast.success("Atualização registrada no histórico.");
  };

  const submit = () => {
    if (!form.nome?.trim() || !form.telefone?.trim()) { toast.error("Preencha nome e telefone."); return; }
    if (!productRows.length || productRows.some(item => !item.produto?.trim() || !Number.isInteger(Number(item.quantidade)) || Number(item.quantidade) < 1 || !Number.isFinite(Number(item.valorUnitario)) || Number(item.valorUnitario) < 0)) { toast.error("Confira produto, quantidade e valor unitário de cada item."); return; }
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
      produto: productRows[0].produto as Produto,
      valorCarta: totalProdutos,
      produtos: productRows.map(item => ({ produto: item.produto, quantidade: Number(item.quantidade), valorUnitario: Number(item.valorUnitario) })),
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
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
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
          <div className="col-span-2 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Produtos de interesse</Label>
              <span className="text-xs text-muted-foreground">Adicione quantos itens forem necessários</span>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_76px_minmax(0,0.9fr)_32px] items-center gap-2 px-1">
              <span className="text-[11px] text-muted-foreground">Produto</span>
              <span className="text-[11px] text-muted-foreground">Qtd.</span>
              <span className="text-[11px] text-muted-foreground">Valor unitário (R$)</span>
              <span />
            </div>
            {productRows.map((item, index) => (
              <div key={index} className="grid grid-cols-[minmax(0,1fr)_76px_minmax(0,0.9fr)_32px] items-center gap-2">
                <Select value={item.produto} onValueChange={v => updateProduct(index, { produto: v })}>
                  <SelectTrigger aria-label={`Produto ${index + 1}`}><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{[...new Set([...produtos, item.produto].filter(Boolean))].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
                <Input aria-label={`Quantidade do produto ${index + 1}`} type="number" min="1" step="1" value={item.quantidade} onChange={e => updateProduct(index, { quantidade: Number(e.target.value) })} className="px-2 text-center" />
                <Input aria-label={`Valor unitário do produto ${index + 1}`} type="number" min="0" value={item.valorUnitario} onChange={e => updateProduct(index, { valorUnitario: Number(e.target.value) })} className="px-2" />
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label={`Remover produto ${index + 1}`} disabled={productRows.length === 1} onClick={() => removeProduct(index)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <Button type="button" size="sm" variant="outline" onClick={addProduct}><Plus className="mr-1 h-3.5 w-3.5" /> Acrescentar produto</Button>
              <div className="text-sm font-semibold">Valor total: {totalProdutos.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 })}</div>
            </div>
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
            <section className="space-y-2 mt-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Histórico</h4>
              {(form.detalhesCliente?.historicoAtualizacoes ?? []).length === 0 && <p className="text-xs text-muted-foreground">Nenhuma atualização registrada.</p>}
              {(form.detalhesCliente?.historicoAtualizacoes ?? []).slice().reverse().map(item => <div key={item.id} className="rounded-md border border-border p-2 text-xs"><div className="text-muted-foreground mb-1">{item.data ? new Date(item.data).toLocaleString("pt-BR") : "Data não disponível (registro anterior)"}</div>{item.texto}</div>)}
            </section>
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
