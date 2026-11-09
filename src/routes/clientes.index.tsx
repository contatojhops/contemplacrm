import { pageHead } from "@/lib/metadata";
import { DELETE_CONFIRMATION, localDate } from "@/lib/crm";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { useClientes, useLeads, useConfig } from "@/lib/store";
import { formatBRL } from "@/lib/scoring";
import { LeadModal } from "@/components/LeadModal";
import { toast } from "sonner";
import type { Lead } from "@/lib/types";
import type { Cliente, ClienteFase, ClientePerfil } from "@/lib/types";

export const Route = createFileRoute("/clientes/")({ head: () => pageHead("Clientes", "Base de clientes e contatos do Consórcio CRM."), component: ClientesPage });

const FASES: (ClienteFase | "Todos")[] = ["Todos", "Lead", "Recuperação", "Cliente Ativo", "Contemplado"];
const PERFIS: ClientePerfil[] = ["Pessoa Física", "Profissional Liberal", "Empresário", "Investidor"];

function faseColor(f?: ClienteFase) {
  switch (f) {
    case "Cliente Ativo": return "bg-primary text-primary-foreground";
    case "Contemplado": return "bg-success text-success-foreground";
    case "Recuperação": return "bg-warning text-warning-foreground";
    default: return "bg-secondary text-secondary-foreground";
  }
}

function ClientesPage() {
  const [clientes, setClientes] = useClientes();
  const [leads, setLeads] = useLeads();
  const [config] = useConfig();
  const produtos = [...new Set([...(config.produtosAtivos ?? []).filter(p => p.ativo).map(p => p.nome), ...clientes.flatMap(c => c.produtos?.length ? c.produtos.map(item => item.produto) : [c.produto]), ...leads.flatMap(l => l.produtos?.length ? l.produtos.map(item => item.produto) : [l.produto])].filter(Boolean))];
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [fase, setFase] = useState<typeof FASES[number]>("Todos");
  const [fProduto, setFProduto] = useState("all");
  const [fPerfil, setFPerfil] = useState("all");

  // Somente leads na etapa final "Fechado" entram na carteira de clientes.
  const todos: Cliente[] = useMemo(() => {
    const enriched = clientes.map((c) => ({
      ...c,
      fase: c.fase ?? (c.contemplado ? "Contemplado" as const : "Cliente Ativo" as const),
    }));
    const existingKeys = new Set(enriched.map((c) => `${c.nome.toLowerCase()}|${c.telefone}`));
    const fromLeads: Cliente[] = leads
      .filter((l) => l.etapa === "Fechado" && !existingKeys.has(`${l.nome.toLowerCase()}|${l.telefone}`))
      .map((l) => ({
        ...l.detalhesCliente,
        id: `lead_${l.id}`,
        nome: l.nome,
        telefone: l.telefone,
        email: l.email,
        produto: l.produto,
        valorCarta: l.valorCarta,
        parcelasPagas: 0,
        parcelasTotais: 0,
        contemplado: false,
        produtos: l.produtos,
        dataEntrada: l.criadoEm,
        fechadoEm: l.closed_at ?? l.stage_changed_at ?? "",
        fase: "Cliente Ativo",
        perfil: l.perfil as Cliente["perfil"],
        origem: l.origem,
        ultimaInteracao: l.ultimoContato,
      }));
    return [...enriched, ...fromLeads];
  }, [clientes, leads]);

  const filtered = todos.filter((c) => {
    const s = search.toLowerCase();
    if (search && !c.nome.toLowerCase().includes(s) && !c.telefone.includes(search) && !(c.cpf ?? "").includes(search)) return false;
    if (fase !== "Todos" && c.fase !== fase) return false;
    if (fProduto !== "all" && !(c.produtos?.length ? c.produtos.some(item => item.produto === fProduto) : c.produto === fProduto)) return false;
    if (fPerfil !== "all" && c.perfil !== fPerfil) return false;
    return true;
  });

  const totalFechado = todos.reduce((sum, cliente) => sum + (Number.isFinite(cliente.valorCarta) ? cliente.valorCarta : 0), 0);

  const remove = (id: string) => {
    if (!confirm(DELETE_CONFIRMATION)) return;
    if (id.startsWith("lead_")) setLeads(p => p.filter(l => l.id !== id.slice(5)));
    else setClientes((p) => p.filter((c) => c.id !== id));
    toast.success("Cliente excluído");
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Sua base de clientes</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4 mr-2" />Cadastrar Lead</Button>
      </div>

      <LeadModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={(lead: Lead) => {
          setLeads((p) => [lead, ...p]);
          toast.success("Lead cadastrado no pipeline. Ele aparecerá em Clientes quando chegar à etapa Fechado.");
        }}
      />

      <Card className="p-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="relative max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar por nome, CPF ou telefone" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-1">
              {FASES.map((f) => (
                <Button key={f} size="sm" variant={fase === f ? "default" : "outline"} onClick={() => setFase(f)}>{f}</Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={fProduto} onValueChange={setFProduto}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Produto" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Produtos</SelectItem>
                  {produtos.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={fPerfil} onValueChange={setFPerfil}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Perfil" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Perfis</SelectItem>
                  {PERFIS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="w-full lg:w-[250px] shrink-0 rounded-lg border border-success/25 bg-success/5 p-4">
            <div className="text-xs font-medium text-muted-foreground">Total em vendas fechadas</div>
            <div className="mt-1 text-2xl font-bold text-success whitespace-nowrap">{formatBRL(totalFechado)}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">Soma dos valores de todos os produtos dos clientes</div>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Fase</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Data de Entrada</TableHead>
              <TableHead>Data de Fechamento</TableHead>
              <TableHead>Valor Fechado</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum cliente encontrado</TableCell></TableRow>}
            {filtered.map((item) => {
              const produtosFechados = item.produtos?.length
                ? item.produtos.map(product => product.produto + (product.quantidade > 1 ? " ×" + product.quantidade : "")).join(", ")
                : item.produto;
              return (
                <TableRow key={item.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link to="/clientes/$id" params={{ id: item.id }} className="hover:underline">{item.nome}</Link>
                  </TableCell>
                  <TableCell><Badge className={faseColor(item.fase)}>{item.fase ?? "—"}</Badge></TableCell>
                  <TableCell>{produtosFechados || "—"}</TableCell>
                  <TableCell>{item.perfil ?? "—"}</TableCell>
                  <TableCell>{item.dataEntrada ? localDate(item.dataEntrada).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  <TableCell>{item.fechadoEm ? localDate(item.fechadoEm).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  <TableCell className="font-medium whitespace-nowrap">{formatBRL(item.valorCarta)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" asChild className="h-7 w-7">
                        <Link to="/clientes/$id" params={{ id: item.id }}><Eye className="h-3.5 w-3.5" /></Link>
                      </Button>
                      <Button size="icon" variant="ghost" asChild className="h-7 w-7">
                        <Link to="/clientes/$id" params={{ id: item.id }}><Pencil className="h-3.5 w-3.5" /></Link>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
