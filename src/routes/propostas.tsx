import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePropostas } from "@/lib/store";
import { formatBRL } from "@/lib/scoring";

export const Route = createFileRoute("/propostas")({ component: PropostasPage });

function PropostasPage() {
  const [propostas] = usePropostas();
  const statusColor = (s: string) =>
    s === "Aceita" ? "bg-success text-success-foreground" :
    s === "Recusada" ? "bg-destructive text-destructive-foreground" :
    s === "Enviada" ? "bg-chart-1 text-primary-foreground" : "bg-muted text-muted-foreground";

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Propostas & Simulações</h1>
        <p className="text-muted-foreground">Acompanhe suas simulações enviadas</p>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Valor Carta</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Parcela</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criada em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {propostas.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.leadNome}</TableCell>
                <TableCell>{p.produto}</TableCell>
                <TableCell>{formatBRL(p.valorCarta)}</TableCell>
                <TableCell>{p.prazoMeses} meses</TableCell>
                <TableCell>{formatBRL(p.parcela)}</TableCell>
                <TableCell><Badge className={statusColor(p.status)}>{p.status}</Badge></TableCell>
                <TableCell>{new Date(p.criadaEm).toLocaleDateString("pt-BR")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
