import { pageHead } from "@/lib/metadata";
import { FEATURES } from "@/lib/features";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useClientes, useConfig, usePropostas } from "@/lib/store";
import { calcularSimulacao } from "@/lib/simulator";
import { formatBRL } from "@/lib/scoring";
import type { Produto, Proposta, PropostaStatus } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/propostas")({ head: () => pageHead("Propostas e Simulações", "Propostas e simulações de consórcio."), beforeLoad: () => { if (!FEATURES.propostas) throw redirect({ to: "/" }); }, component: PropostasPage });

const STATUS: PropostaStatus[] = ["Rascunho", "Enviada", "Em Análise", "Aprovada", "Recusada"];

function statusColor(s: PropostaStatus) {
  switch (s) {
    case "Rascunho": return "bg-secondary text-secondary-foreground";
    case "Enviada": return "bg-primary text-primary-foreground";
    case "Em Análise": return "bg-warning text-warning-foreground";
    case "Aprovada": return "bg-success text-success-foreground";
    case "Recusada": return "bg-destructive text-destructive-foreground";
  }
}

function PropostasPage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Propostas & Simulações</h1>
        <p className="text-muted-foreground">Gerencie propostas e simule consórcios</p>
      </div>
      <Tabs defaultValue="propostas">
        <TabsList>
          <TabsTrigger value="propostas">📄 Propostas</TabsTrigger>
          <TabsTrigger value="simulador">🧮 Simulador</TabsTrigger>
        </TabsList>
        <TabsContent value="propostas"><PropostasTab /></TabsContent>
        <TabsContent value="simulador"><SimuladorTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function PropostasTab() {
  const [propostas] = usePropostas();
  const [config] = useConfig();
  const produtos = (config.produtosAtivos ?? []).filter(p => p.ativo).map(p => p.nome);
  const [fStatus, setFStatus] = useState("all");
  const [fProduto, setFProduto] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = propostas.filter((p) => {
    if (fStatus !== "all" && p.status !== fStatus) return false;
    if (fProduto !== "all" && p.produto !== fProduto) return false;
    if (search && !p.leadNome.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <Card className="p-3">
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Buscar cliente" className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              {STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fProduto} onValueChange={setFProduto}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Produto" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Produtos</SelectItem>
              {produtos.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Carta</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Parcela</TableHead>
              <TableHead>Taxa Adm</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Comissão Est.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => {
              const productConfig = config.simuladorProdutos?.find(item => item.produto === p.produto);
              const taxa = p.taxaAdmin ?? productConfig?.taxaAdmin ?? config.taxaAdmin;
              const comissao = p.comissaoEstimada ?? (p.valorCarta * (productConfig?.comissao ?? config.comissao)) / 100;
              const open = expanded === p.id;
              return (
                <>
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => setExpanded(open ? null : p.id)}>
                    <TableCell>{new Date(p.criadaEm).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="font-medium">{p.leadNome}</TableCell>
                    <TableCell>{p.produto}</TableCell>
                    <TableCell>{formatBRL(p.valorCarta)}</TableCell>
                    <TableCell>{p.prazoMeses}m</TableCell>
                    <TableCell>{formatBRL(p.parcela)}</TableCell>
                    <TableCell>{taxa}%</TableCell>
                    <TableCell><Badge className={statusColor(p.status)}>{p.status}</Badge></TableCell>
                    <TableCell className="text-success font-medium">{formatBRL(comissao)}</TableCell>
                  </TableRow>
                  {open && (
                    <TableRow>
                      <TableCell colSpan={9} className="bg-accent/30">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 text-sm">
                          <div><div className="text-xs text-muted-foreground">Fundo Reserva</div>{p.fundoReserva ?? productConfig?.fundoReserva ?? config.fundoReserva}%</div>
                          <div><div className="text-xs text-muted-foreground">Seguro</div>{p.seguro ? "Sim" : "Não"}</div>
                          <div><div className="text-xs text-muted-foreground">Valor Seguro</div>{p.valorSeguro ? formatBRL(p.valorSeguro) : "—"}</div>
                          <div><div className="text-xs text-muted-foreground">Comissão Estimada</div><span className="text-success font-bold">{formatBRL(comissao)}</span></div>
                          {p.observacoes && <div className="col-span-full"><div className="text-xs text-muted-foreground">Observações</div>{p.observacoes}</div>}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function SimuladorTab() {
  const [config] = useConfig();
  const produtos = (config.produtosAtivos ?? []).filter(p => p.ativo).map(p => p.nome);
  const [, setPropostas] = usePropostas();
  const [clientes] = useClientes();
  const [valorCarta, setValorCarta] = useState(100000);
  const [prazo, setPrazo] = useState(80);
  const initialProductConfig = config.simuladorProdutos?.find(p => p.produto === "Veículo");
  const [taxaAdmin, setTaxaAdmin] = useState(initialProductConfig?.taxaAdmin ?? config.taxaAdmin);
  const [fundoReserva, setFundoReserva] = useState(initialProductConfig?.fundoReserva ?? config.fundoReserva);
  const [comissao, setComissao] = useState(initialProductConfig?.comissao ?? config.comissao);
  const [seguro, setSeguro] = useState(false);
  const [valorSeguro, setValorSeguro] = useState(initialProductConfig?.valorSeguro ?? config.valorSeguroDefault);
  const [produto, setProduto] = useState<Produto>(produtos.includes("Veículo") ? "Veículo" : produtos[0] ?? "Outros");
  const [saveModal, setSaveModal] = useState(false);
  const [clienteSel, setClienteSel] = useState("");
  const [novoCliente, setNovoCliente] = useState("");

  useEffect(() => {
    const settings = config.simuladorProdutos?.find(item => item.produto === produto);
    setTaxaAdmin(settings?.taxaAdmin ?? config.taxaAdmin);
    setFundoReserva(settings?.fundoReserva ?? config.fundoReserva);
    setComissao(settings?.comissao ?? config.comissao);
    setValorSeguro(settings?.valorSeguro ?? config.valorSeguroDefault);
  }, [produto, config.simuladorProdutos, config.taxaAdmin, config.fundoReserva, config.comissao, config.valorSeguroDefault]);

  const result = useMemo(() => calcularSimulacao({
    valorCarta, prazo, taxaAdmin, fundoReserva, seguro, valorSeguro, comissao,
  }), [valorCarta, prazo, taxaAdmin, fundoReserva, seguro, valorSeguro, comissao]);

  const salvarProposta = () => {
    const nome = clienteSel || novoCliente;
    if (!nome) { toast.error("Selecione ou informe um cliente"); return; }
    const cliente = clientes.find((c) => c.nome === clienteSel);
    const nova: Proposta = {
      id: crypto.randomUUID(),
      leadId: cliente?.id ?? "",
      leadNome: nome,
      produto, valorCarta, prazoMeses: prazo, parcela: result.parcela,
      status: "Rascunho",
      criadaEm: new Date().toISOString(),
      taxaAdmin, fundoReserva, seguro, valorSeguro: seguro ? valorSeguro : 0,
      comissaoEstimada: result.comissaoEstimada,
      clienteId: cliente?.id,
    };
    setPropostas((p) => [nova, ...p]);
    toast.success("Proposta salva!");
    setSaveModal(false); setClienteSel(""); setNovoCliente("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle>Parâmetros</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Produto</Label>
            <Select value={produto} onValueChange={(v) => setProduto(v as Produto)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{produtos.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Valor da Carta (R$)</Label>
            <Input type="number" value={valorCarta} onChange={(e) => setValorCarta(Number(e.target.value))} />
          </div>
          <div>
            <Label>Prazo: {prazo} meses</Label>
            <Slider min={12} max={240} step={1} value={[prazo]} onValueChange={(v) => setPrazo(v[0])} className="my-3" />
            <Input type="number" min={12} max={240} value={prazo} onChange={(e) => setPrazo(Number(e.target.value))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Taxa Administração (%)</Label>
              <Input type="number" step="0.1" value={taxaAdmin} onChange={(e) => setTaxaAdmin(Number(e.target.value))} />
            </div>
            <div>
              <Label>Fundo Reserva (%)</Label>
              <Input type="number" step="0.1" value={fundoReserva} onChange={(e) => setFundoReserva(Number(e.target.value))} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={seguro} onCheckedChange={setSeguro} />
            <Label>Incluir Seguro</Label>
          </div>
          {seguro && (
            <div>
              <Label>Valor do Seguro (R$/mês)</Label>
              <Input type="number" value={valorSeguro} onChange={(e) => setValorSeguro(Number(e.target.value))} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Resultado</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-primary text-primary-foreground p-6 text-center">
            <div className="text-sm opacity-80">Parcela mensal</div>
            <div className="text-4xl font-bold mt-1">{formatBRL(result.parcela)}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-border rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Valor total a pagar</div>
              <div className="text-lg font-bold">{formatBRL(result.totalPagar)}</div>
            </div>
            <div className="border border-border rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Total de taxas</div>
              <div className="text-lg font-bold">{formatBRL(result.totalTaxas)}</div>
            </div>
            {seguro && (
              <div className="border border-border rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Custo do seguro total</div>
                <div className="text-lg font-bold">{formatBRL(result.custoSeguro)}</div>
              </div>
            )}
            <div className="border border-success/40 bg-success/10 rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Comissão estimada</div>
              <div className="text-lg font-bold text-success">{formatBRL(result.comissaoEstimada)}</div>
            </div>
          </div>
          <Button className="w-full" onClick={() => setSaveModal(true)}>Salvar como Proposta</Button>
        </CardContent>
      </Card>

      <Dialog open={saveModal} onOpenChange={setSaveModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Salvar Proposta</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Cliente existente</Label>
              <Select value={clienteSel} onValueChange={(v) => { setClienteSel(v); setNovoCliente(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="text-center text-xs text-muted-foreground">ou</div>
            <div>
              <Label>Novo cliente</Label>
              <Input value={novoCliente} onChange={(e) => { setNovoCliente(e.target.value); setClienteSel(""); }} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveModal(false)}>Cancelar</Button>
            <Button onClick={salvarProposta}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
