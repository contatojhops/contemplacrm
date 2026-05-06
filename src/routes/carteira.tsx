import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useClientes } from "@/lib/store";
import { formatBRL } from "@/lib/scoring";
import type { Cliente, StatusPagamento, Indicacao } from "@/lib/types";
import { Users, Trophy, AlertTriangle, TrendingUp, Share2, Plus, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/carteira")({ component: CarteiraPage });

function statusBadge(s?: StatusPagamento) {
  if (s === "Em Dia") return <Badge className="bg-success text-success-foreground">✅ Em Dia</Badge>;
  if (s === "Atenção") return <Badge className="bg-warning text-warning-foreground">⚠️ Atenção</Badge>;
  if (s === "Inadimplente") return <Badge className="bg-destructive text-destructive-foreground">🔴 Inadimplente</Badge>;
  return <Badge variant="secondary">—</Badge>;
}

function oppBadge(c: Cliente) {
  if (c.oportunidade === "Upsell") return <Badge className="bg-chart-2 text-white">📈 Upsell</Badge>;
  if (c.oportunidade === "Cross-sell") return <Badge className="bg-chart-1 text-white">➕ Cross-sell</Badge>;
  return <span className="text-xs text-muted-foreground">—</span>;
}

function CarteiraPage() {
  const [clientes, setClientes] = useClientes();
  const [selected, setSelected] = useState<Cliente | null>(null);
  const [refOpen, setRefOpen] = useState(false);
  const [refNome, setRefNome] = useState("");

  const ativos = clientes.filter((c) => c.fase !== "Lead");
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const contempladosMes = ativos.filter((c) => c.contempladoEm && new Date(c.contempladoEm) >= monthStart).length;
  const inadimplentes = ativos.filter((c) => c.statusPagamento === "Inadimplente").length;
  const oportunidades = ativos.filter((c) => c.oportunidade && c.oportunidade !== "Nenhuma").length;
  const totalIndicacoes = ativos.reduce((s, c) => s + (c.indicacoes?.length ?? 0), 0);

  const kpis = [
    { label: "Cotistas Ativos", value: ativos.length, icon: Users, color: "text-chart-1" },
    { label: "Contemplados no Mês", value: contempladosMes, icon: Trophy, color: "text-success" },
    { label: "Inadimplência", value: inadimplentes, icon: AlertTriangle, color: "text-destructive" },
    { label: "Oportunidades", value: oportunidades, icon: TrendingUp, color: "text-chart-2" },
    { label: "Indicações Geradas", value: totalIndicacoes, icon: Share2, color: "text-chart-3" },
  ];

  const sel = useMemo(() => selected ? clientes.find((c) => c.id === selected.id) ?? selected : null, [clientes, selected]);

  const addIndicacao = () => {
    if (!sel || !refNome.trim()) return;
    const nova: Indicacao = { id: `ind_${Date.now()}`, nome: refNome.trim(), status: "Lead", data: new Date().toISOString() };
    setClientes((p) => p.map((c) => c.id === sel.id ? { ...c, indicacoes: [...(c.indicacoes ?? []), nova] } : c));
    setRefNome(""); setRefOpen(false);
    toast.success("Indicação registrada!");
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Carteira Ativa</h1>
        <p className="text-muted-foreground">Pós-venda e relacionamento com cotistas</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}><CardContent className="p-4">
            <div className="flex items-center justify-between"><k.icon className={`h-5 w-5 ${k.color}`} /></div>
            <div className="mt-2 text-2xl font-bold">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead><TableHead>Grupo</TableHead><TableHead>Cota</TableHead>
              <TableHead>Produto</TableHead><TableHead>Valor Carta</TableHead><TableHead>Parcela</TableHead>
              <TableHead>Status</TableHead><TableHead>Oportunidade</TableHead><TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ativos.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                Nenhum cliente na carteira ainda.
              </TableCell></TableRow>
            )}
            {ativos.map((c) => (
              <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelected(c)}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell>{c.grupo ?? "—"}</TableCell>
                <TableCell>{c.cota ?? "—"}</TableCell>
                <TableCell>{c.produto}</TableCell>
                <TableCell>{formatBRL(c.valorCarta)}</TableCell>
                <TableCell>{c.parcelaMensal ? formatBRL(c.parcelaMensal) : "—"}</TableCell>
                <TableCell>{statusBadge(c.statusPagamento)}</TableCell>
                <TableCell>{oppBadge(c)}</TableCell>
                <TableCell><Button size="icon" variant="ghost" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={!!sel} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {sel && (
            <>
              <SheetHeader><SheetTitle>{sel.nome}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-5">
                <Card><CardContent className="p-4 grid grid-cols-2 gap-3 text-sm">
                  <div><div className="text-xs text-muted-foreground">Grupo / Cota</div><div className="font-medium">{sel.grupo} / {sel.cota}</div></div>
                  <div><div className="text-xs text-muted-foreground">Produto</div><div className="font-medium">{sel.produto}</div></div>
                  <div><div className="text-xs text-muted-foreground">Valor Carta</div><div className="font-medium">{formatBRL(sel.valorCarta)}</div></div>
                  <div><div className="text-xs text-muted-foreground">Parcela</div><div className="font-medium">{formatBRL(sel.parcelaMensal ?? 0)}</div></div>
                  <div><div className="text-xs text-muted-foreground">Prazo</div><div className="font-medium">{sel.prazoRestante}/{sel.prazoTotal}</div></div>
                  <div><div className="text-xs text-muted-foreground">Adesão</div><div className="font-medium">{sel.dataAdesao ? new Date(sel.dataAdesao).toLocaleDateString("pt-BR") : "—"}</div></div>
                  <div className="col-span-2"><div className="text-xs text-muted-foreground">Contemplação</div>
                    <div className="font-medium">{sel.contemplado ? `Contemplado em ${sel.contempladoEm ? new Date(sel.contempladoEm).toLocaleDateString("pt-BR") : "—"}` : "Não contemplado"}</div>
                  </div>
                </CardContent></Card>

                <div>
                  <div className="text-sm font-semibold mb-2">Histórico de Pagamentos (últimos 6 meses)</div>
                  <div className="flex gap-2">
                    {(sel.historicoPagamentos ?? []).map((h, i) => (
                      <div key={i} className="flex-1 text-center">
                        <div className={`h-10 rounded ${h.status === "Pago" ? "bg-success/30" : h.status === "Atrasado" ? "bg-warning/30" : "bg-destructive/30"}`} />
                        <div className="text-xs mt-1">{h.mes}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold">Indicações</div>
                    <Button size="sm" variant="outline" onClick={() => setRefOpen(true)}><Plus className="h-3 w-3 mr-1" />Registrar</Button>
                  </div>
                  {(sel.indicacoes ?? []).length === 0 && <p className="text-xs text-muted-foreground">Nenhuma indicação registrada.</p>}
                  <div className="space-y-2">
                    {(sel.indicacoes ?? []).map((i) => (
                      <div key={i.id} className="flex items-center justify-between text-sm border rounded p-2">
                        <span>{i.nome}</span>
                        <Badge variant={i.status === "Cliente Ativo" ? "default" : "secondary"}>{i.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold mb-2">Oportunidades</div>
                  <div className="flex items-center gap-2 mb-2">{oppBadge(sel)}</div>
                  {sel.oportunidadeNotas && <p className="text-xs text-muted-foreground">{sel.oportunidadeNotas}</p>}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={refOpen} onOpenChange={setRefOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Indicação</DialogTitle></DialogHeader>
          <Input placeholder="Nome da pessoa indicada" value={refNome} onChange={(e) => setRefNome(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefOpen(false)}>Cancelar</Button>
            <Button onClick={addIndicacao}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
