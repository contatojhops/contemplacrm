import { pageHead } from "@/lib/metadata";
import { localDate } from "@/lib/crm";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCampanhas, useLeads } from "@/lib/store";
import { formatBRL } from "@/lib/scoring";
import type { Campanha, CanalCampanha, Etapa } from "@/lib/types";
import { DollarSign, Users, TrendingUp, Target, Plus, Eye, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/campanhas")({ head: () => pageHead("Campanhas", "Investimentos e resultados das campanhas."), component: CampanhasPage });

const CANAIS: CanalCampanha[] = ["Meta Ads", "Instagram", "WhatsApp Broadcast", "Orgânico", "Indicação", "Outro"];

function canalBadge(c: CanalCampanha) {
  const map: Record<CanalCampanha, string> = {
    "Meta Ads": "bg-blue-500 text-white",
    "Instagram": "bg-pink-500 text-white",
    "WhatsApp Broadcast": "bg-green-500 text-white",
    "Orgânico": "bg-gray-500 text-white",
    "Indicação": "bg-amber-500 text-white",
    "Outro": "bg-purple-500 text-white",
  };
  return <Badge className={map[c]}>{c}</Badge>;
}

const empty: Campanha = {
  id: "", nome: "", canal: "Meta Ads", investimento: 0, leadsGerados: 0, vendas: 0, receita: 0,
  inicio: new Date().toISOString(), ativa: true,
};

function CampanhasPage() {
  const [campanhas, setCampanhas] = useCampanhas();
  const [leads] = useLeads();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Campanha>(empty);
  const [detail, setDetail] = useState<Campanha | null>(null);
  const [fCanal, setFCanal] = useState("all");
  const [fStatus, setFStatus] = useState("all");

  const filtered = campanhas.filter((c) => {
    if (fCanal !== "all" && c.canal !== fCanal) return false;
    if (fStatus === "ativa" && !c.ativa) return false;
    if (fStatus === "encerrada" && c.ativa) return false;
    return true;
  });

  const totalInv = campanhas.reduce((s, c) => s + c.investimento, 0);
  const totalLeads = campanhas.reduce((s, c) => s + c.leadsGerados, 0);
  const cpl = totalLeads > 0 ? totalInv / totalLeads : 0;
  const totalReceita = campanhas.reduce((s, c) => s + (c.receita ?? 0), 0);
  const roiMedio = totalInv > 0 ? ((totalReceita - totalInv) / totalInv) * 100 : 0;

  const save = () => {
    if (!form.inicio || (form.fim && form.fim < form.inicio) || form.investimento < 0) { toast.error("Confira o período e o orçamento."); return; }
    if (!form.nome.trim()) { toast.error("Informe o nome da campanha"); return; }
    if (form.id) {
      setCampanhas((p) => p.map((c) => c.id === form.id ? form : c));
    } else {
      setCampanhas((p) => [...p, { ...form, id: crypto.randomUUID() }]);
    }
    toast.success("Campanha salva!");
    setOpen(false); setForm(empty);
  };

  const remove = (id: string) => {
    if (!confirm("Tem certeza que deseja excluir? Esta ação não pode ser desfeita.")) return;
    setCampanhas((p) => p.filter((c) => c.id !== id));
    toast.success("Campanha excluída");
  };

  const detailLeads = useMemo(() => detail ? leads.filter((l) => l.origem === detail.canal || l.origem === "Indicação" && detail.canal === "Indicação") : [], [detail, leads]);
  const ETAPAS: Etapa[] = ["Novo Lead", "Contato Realizado", "Proposta Enviada", "Em Análise", "Fechado", "Perdido"];

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campanhas</h1>
          <p className="text-muted-foreground">ROI e performance das campanhas</p>
        </div>
        <Button onClick={() => { setForm(empty); setOpen(true); }}><Plus className="h-4 w-4 mr-2" />Nova Campanha</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><DollarSign className="h-5 w-5 text-chart-1" /><div className="mt-2 text-2xl font-bold">{formatBRL(totalInv)}</div><div className="text-xs text-muted-foreground">Total Investido</div></CardContent></Card>
        <Card><CardContent className="p-4"><Users className="h-5 w-5 text-chart-2" /><div className="mt-2 text-2xl font-bold">{totalLeads}</div><div className="text-xs text-muted-foreground">Leads Gerados</div></CardContent></Card>
        <Card><CardContent className="p-4"><Target className="h-5 w-5 text-chart-3" /><div className="mt-2 text-2xl font-bold">{formatBRL(cpl)}</div><div className="text-xs text-muted-foreground">Custo por Lead</div></CardContent></Card>
        <Card><CardContent className="p-4"><TrendingUp className="h-5 w-5 text-success" /><div className="mt-2 text-2xl font-bold">{roiMedio.toFixed(2)}%</div><div className="text-xs text-muted-foreground">ROI Médio</div></CardContent></Card>
      </div>

      <Card className="p-3 flex flex-wrap gap-2">
        <Select value={fCanal} onValueChange={setFCanal}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Canal" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todos canais</SelectItem>{CANAIS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={fStatus} onValueChange={setFStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="ativa">Ativa</SelectItem><SelectItem value="encerrada">Encerrada</SelectItem></SelectContent>
        </Select>
      </Card>

      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Nome</TableHead><TableHead>Canal</TableHead><TableHead>Período</TableHead>
            <TableHead>Invest.</TableHead><TableHead>Leads</TableHead><TableHead>Conv.</TableHead>
            <TableHead>Taxa</TableHead><TableHead>CPL</TableHead><TableHead>Receita</TableHead>
            <TableHead>ROI</TableHead><TableHead>Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={11} className="text-center py-10 text-muted-foreground">
                Nenhuma campanha. Crie sua primeira para acompanhar o ROI.
              </TableCell></TableRow>
            )}
            {filtered.map((c) => {
              const taxa = c.leadsGerados > 0 ? (c.vendas / c.leadsGerados) * 100 : 0;
              const cplC = c.leadsGerados > 0 ? c.investimento / c.leadsGerados : 0;
              const isOrganico = c.investimento === 0;
              const roi = isOrganico ? 0 : (((c.receita ?? 0) - c.investimento) / c.investimento) * 100;
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>{canalBadge(c.canal)}</TableCell>
                  <TableCell className="text-xs">{localDate(c.inicio).toLocaleDateString("pt-BR")}{c.fim ? ` - ${localDate(c.fim).toLocaleDateString("pt-BR")}` : ""}</TableCell>
                  <TableCell>{formatBRL(c.investimento)}</TableCell>
                  <TableCell>{c.leadsGerados}</TableCell>
                  <TableCell>{c.vendas}</TableCell>
                  <TableCell>{taxa.toFixed(2)}%</TableCell>
                  <TableCell>{formatBRL(cplC)}</TableCell>
                  <TableCell>{formatBRL(c.receita ?? 0)}</TableCell>
                  <TableCell>{isOrganico ? <Badge className="bg-success text-success-foreground">Orgânico</Badge> : <span className={roi >= 0 ? "text-success" : "text-destructive"}>{roi.toFixed(2)}%</span>}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Ver campanha" onClick={() => setDetail(c)}><Eye className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Editar campanha" onClick={() => { setForm(c); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Excluir campanha" onClick={() => remove(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? "Editar Campanha" : "Nova Campanha"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div><Label>Canal</Label>
              <Select value={form.canal} onValueChange={(v) => setForm({ ...form, canal: v as CanalCampanha })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CANAIS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Orçamento (R$)</Label><Input type="number" value={form.investimento} onChange={(e) => setForm({ ...form, investimento: Number(e.target.value) })} /></div>
            <div><Label>Início</Label><Input type="date" value={form.inicio.slice(0, 10)} onChange={(e) => setForm({ ...form, inicio: e.target.value })} /></div>
            <div><Label>Fim</Label><Input type="date" value={form.fim?.slice(0, 10) ?? ""} onChange={(e) => setForm({ ...form, fim: e.target.value || undefined })} /></div>
            <div className="col-span-2"><Label>UTM / Tag</Label><Input value={form.utm ?? ""} onChange={(e) => setForm({ ...form, utm: e.target.value })} /></div>
            <div className="col-span-2"><Label>Observações</Label><Textarea value={form.observacoes ?? ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {detail && (
            <>
              <SheetHeader><SheetTitle>{detail.nome}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-4">
                <Card><CardContent className="p-4 grid grid-cols-3 gap-3 text-sm">
                  <div><div className="text-xs text-muted-foreground">Investimento</div><div className="font-medium">{formatBRL(detail.investimento)}</div></div>
                  <div><div className="text-xs text-muted-foreground">Leads</div><div className="font-medium">{detail.leadsGerados}</div></div>
                  <div><div className="text-xs text-muted-foreground">Vendas</div><div className="font-medium">{detail.vendas}</div></div>
                  <div><div className="text-xs text-muted-foreground">CPL</div><div className="font-medium">{formatBRL(detail.leadsGerados > 0 ? detail.investimento/detail.leadsGerados : 0)}</div></div>
                  <div><div className="text-xs text-muted-foreground">Receita</div><div className="font-medium">{formatBRL(detail.receita ?? 0)}</div></div>
                  <div><div className="text-xs text-muted-foreground">ROI</div><div className="font-medium">{detail.investimento > 0 ? `${(((detail.receita??0) - detail.investimento)/detail.investimento*100).toFixed(2)}%` : "Orgânico"}</div></div>
                </CardContent></Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-semibold mb-2">Leads por etapa</div>
                    <div className="h-56">
                      {detailLeads.length === 0 ? <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Nenhum lead nesta campanha</div> : <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ETAPAS.map((e) => ({ etapa: e, qtd: detailLeads.filter((l) => l.etapa === e).length }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="etapa" stroke="var(--muted-foreground)" fontSize={11} />
                          <YAxis stroke="var(--muted-foreground)" />
                          <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                          <Bar dataKey="qtd" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>}
                    </div>
                  </CardContent>
                </Card>
                <div>
                  <div className="text-sm font-semibold mb-2">Leads desta campanha</div>
                  <div className="space-y-1">
                    {detailLeads.length === 0 && <p className="text-xs text-muted-foreground">Nenhum lead.</p>}
                    {detailLeads.map((l) => (
                      <div key={l.id} className="flex items-center justify-between border rounded p-2 text-sm">
                        <span>{l.nome}</span>
                        <Badge variant="secondary">{l.etapa}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
