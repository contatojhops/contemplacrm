import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useClientes } from "@/lib/store";
import { formatBRL } from "@/lib/scoring";

export const Route = createFileRoute("/clientes")({ component: ClientesPage });

function ClientesPage() {
  const [clientes] = useClientes();
  const [search, setSearch] = useState("");
  const filtered = clientes.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase()) || c.telefone.includes(search)
  );

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground">Sua base de clientes ativos</p>
      </div>
      <Card className="p-3">
        <div className="relative max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar cliente" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Valor Carta</TableHead>
              <TableHead>Parcelas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fechado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell>{c.telefone}</TableCell>
                <TableCell>{c.produto}</TableCell>
                <TableCell>{formatBRL(c.valorCarta)}</TableCell>
                <TableCell>{c.parcelasPagas}/{c.parcelasTotais}</TableCell>
                <TableCell>
                  {c.contemplado
                    ? <Badge className="bg-success text-success-foreground">Contemplado</Badge>
                    : <Badge variant="secondary">Em curso</Badge>}
                </TableCell>
                <TableCell>{new Date(c.fechadoEm).toLocaleDateString("pt-BR")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
