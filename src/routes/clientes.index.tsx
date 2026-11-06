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
import { calcScore } from "@/lib/scoring";
import { ScoreBadge } from "@/components/LeadCard";
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
  const produtos = [...new Set([...(config.produtosAtivos ?? []).filter(p => p.ativo).map(p => p.nome), ...clientes.map(c => c.produto)])];
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [fase, setFase] = useState<typeof FASES[number]>("Todos");
  const [fProduto, setFProduto] = useState("all");
  const [fPerfil, setFPerfil] = useState("all");

  // Somente leads na etapa final "Fechado" entram na carteira de clientes.
  const todos: (Cliente & { lastContactDate: string })[] = useMemo(() => {
    const enriched = clientes.map((c) => ({
      ...c,
      fase: c.fase ?? (c.contemplado ? "Contemplado" as const : "Cliente Ativo" as const),
      lastContactDate: c.ultimaInteracao ?? c.fechadoEm,
    }));
    const existingKeys = new Set(enriched.map((c) => `${c.nome.toLowerCase()}|${c.telefone}`));
    const fromLeads: (Cliente & { lastContactDate: string })[] = leads
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
        fechadoEm: l.criadoEm,
        fase: l.detalhesCliente?.fase ?? (l.etapa === "Perdido" ? "Recuperação" : "Lead"),
        perfil: l.perfil as Cliente["perfil"],
        origem: l.origem,
        ultimaInteracao: l.ultimoContato,
        lastContactDate: l.ultimoContato,
      }));
    return [...enriched, ...fromLeads];
  }, [clientes, leads]);

  const filtered = todos.filter((c) => {
    const s = search.toLowerCase();
    if (search && !c.nome.toLowerCase().includes(s) && !c.telefone.includes(search) && !(c.cpf ?? "").includes(search)) return false;
    if (fase !== "Todos" && c.fase !== fase) return false;
    if (fProduto !== "all" && c.produto !== fProduto) return false;
    if (fPerfil !== "all" && c.perfil !== fPerfil) return false;
    return true;
  });

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

      <Card className="p-3 space-y-3">
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
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Fase</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Última Interação</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum cliente encontrado</TableCell></TableRow>}
            {filtered.map((item) => {
              const lead = leads.find((l) => l.id === item.id.replace("lead_", "")) ?? leads.find((l) => l.nome === item.nome);
              const score = lead ? calcScore(lead) : 70;
              return (
                <TableRow key={item.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link to="/clientes/$id" params={{ id: item.id }} className="hover:underline">{item.nome}</Link>
                  </TableCell>
                  <TableCell><Badge className={faseColor(item.fase)}>{item.fase ?? "—"}</Badge></TableCell>
                  <TableCell>{item.produto}</TableCell>
                  <TableCell>{item.perfil ?? "—"}</TableCell>
                  <TableCell><ScoreBadge score={score} /></TableCell>
                  <TableCell>{localDate(item.lastContactDate).toLocaleDateString("pt-BR")}</TableCell>
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
