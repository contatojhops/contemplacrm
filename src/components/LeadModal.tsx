import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Lead, Produto, Origem } from "@/lib/types";

const PRODUTOS: Produto[] = ["Imóvel", "Veículo", "Serviço", "Moto", "Investimento", "Outros"];
const ORIGENS: Origem[] = ["Meta Ads", "Instagram", "WhatsApp", "Indicação", "Orgânico", "Outros"];

interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  initial?: Lead | null;
  onSave: (l: Lead) => void;
}

export function LeadModal({ open, onOpenChange, initial, onSave }: Props) {
  const [form, setForm] = useState<Partial<Lead>>(initial ?? {
    nome: "", telefone: "", email: "", produto: "Imóvel", valorCarta: 0,
    origem: "WhatsApp", perfil: "", observacoes: "",
  });

  useEffect(() => {
    if (open) setForm(initial ?? { nome: "", telefone: "", email: "", produto: "Imóvel", valorCarta: 0, origem: "WhatsApp", perfil: "", observacoes: "" });
  }, [open, initial]);

  const update = (patch: Partial<Lead>) => setForm((f) => ({ ...f, ...patch }));

  const submit = () => {
    if (!form.nome?.trim() || !form.telefone?.trim()) { toast.error("Preencha nome e telefone."); return; }
    if ((form.valorCarta ?? 0) < 0) { toast.error("Informe um valor válido."); return; }
    const now = new Date().toISOString();
    const lead: Lead = {
      ...initial,
      stage_changed_at: initial?.stage_changed_at ?? now,
      id: initial?.id ?? `l_${Date.now()}`,
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
              <SelectContent>{PRODUTOS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
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
              <SelectContent>{ORIGENS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
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
