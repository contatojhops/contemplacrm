import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { useClientes, useLeads } from "@/lib/store";
import { calcScore } from "@/lib/scoring";
import { ScoreBadge } from "@/components/LeadCard";
import { toast } from "sonner";
import type { Cliente, ClienteFase, ClientePerfil, Produto, Temperatura } from "@/lib/types";

export const Route = createFileRoute("/clientes")({ component: ClientesPage });

const FASES: (ClienteFase | "Todos")[] = ["Todos", "Lead", "Recuperação", "Cliente Ativo", "Contemplado"];
const PRODUTOS: Produto[] = ["Imóvel", "Veículo", "Serviço", "Moto", "Investimento", "Outros"];
const PERFIS: ClientePerfil[] = ["Pessoa Física", "Profissional Liberal", "Empresário", "Investidor"];
const TEMPS: Temperatura[] = ["Frio", "Morno", "Quente"];

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
  const [leads] = useLeads();
  const [search, setSearch] = useState("");
  const [fase, setFase] = useState<typeof FASES[number]>("Todos");
  const [fProduto, setFProduto] = useState("all");
  const [fPerfil, setFPerfil] = useState("all");
  const [fTemp, setFTemp] = useState("all");

  // Tratar leads também como clientes virtuais para visualização unificada
  const todos: Cliente[] = useMemo(() => {
    const fromLeads: Cliente[] = leads.map((l) => ({
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
      fase: "Lead",
      temperatura: l.temperatura,
      origem: l.origem,
      ultimaInteracao: l.ultimoContato,
    }));
    const enriched = clientes.map((c) => ({
      ...c,
      fase: c.fase ?? (c.contemplado ? "Contemplado" as const : "Cliente Ativo" as const),
    }));
    return [...enriched, ...fromLeads];
  }, [clientes, leads]);

  const filtered = todos.filter((c) => {
    const s = search.toLowerCase();
    if (search && !c.nome.toLowerCase().includes(s) && !c.telefone.includes(search) && !(c.cpf ?? "").includes(search)) return false;
    if (fase !== "Todos" && c.fase !== fase) return false;
    if (fProduto !== "all" && c.produto !== fProduto) return false;
    if (fPerfil !== "all" && c.perfil !== fPerfil) return false;
    if (fTemp !== "all" && c.temperatura !== fTemp) return false;
    return true;
  });

  const remove = (id: string) => {
    if (id.startsWith("lead_")) { toast.error("Exclua o lead na página de Leads"); return; }
    if (!confirm("Excluir cliente?")) return;
    setClientes((p) => p.filter((c) => c.id !== id));
    toast.success("Cliente excluído");
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Sua base de clientes</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Novo Cliente</Button>
      </div>

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
              {PRODUTOS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fPerfil} onValueChange={setFPerfil}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Perfil" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Perfis</SelectItem>
              {PERFIS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fTemp} onValueChange={setFTemp}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Temperatura" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {TEMPS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
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
              <TableHead>Temperatura</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Última Interação</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => {
              const lead = leads.find((l) => l.id === c.id.replace("lead_", "")) ?? leads.find((l) => l.nome === c.nome);
              const score = lead ? calcScore(lead) : 70;
              return (
                <TableRow key={c.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link to="/clientes/$id" params={{ id: c.id }} className="hover:underline">{c.nome}</Link>
                  </TableCell>
                  <TableCell><Badge className={faseColor(c.fase)}>{c.fase ?? "—"}</Badge></TableCell>
                  <TableCell>{c.produto}</TableCell>
                  <TableCell>{c.perfil ?? "—"}</TableCell>
                  <TableCell>{c.temperatura ?? "—"}</TableCell>
                  <TableCell><ScoreBadge score={score} /></TableCell>
                  <TableCell>{c.ultimaInteracao ? new Date(c.ultimaInteracao).toLocaleDateString("pt-BR") : new Date(c.fechadoEm).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" asChild className="h-7 w-7">
                        <Link to="/clientes/$id" params={{ id: c.id }}><Eye className="h-3.5 w-3.5" /></Link>
                      </Button>
                      <Button size="icon" variant="ghost" asChild className="h-7 w-7">
                        <Link to="/clientes/$id" params={{ id: c.id }}><Pencil className="h-3.5 w-3.5" /></Link>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
