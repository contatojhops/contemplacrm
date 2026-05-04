import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useClientes } from "@/lib/store";
import { formatBRL } from "@/lib/scoring";

export const Route = createFileRoute("/carteira")({ component: CarteiraPage });

function CarteiraPage() {
  const [clientes] = useClientes();
  const totalCarteira = clientes.reduce((s, c) => s + c.valorCarta, 0);
  const contemplados = clientes.filter((c) => c.contemplado).length;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Carteira Ativa</h1>
        <p className="text-muted-foreground">Visão consolidada dos contratos ativos</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <div className="text-sm text-muted-foreground">Clientes Ativos</div>
          <div className="text-2xl font-bold mt-1">{clientes.length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-sm text-muted-foreground">Volume Total</div>
          <div className="text-2xl font-bold mt-1">{formatBRL(totalCarteira)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-sm text-muted-foreground">Contemplados</div>
          <div className="text-2xl font-bold mt-1">{contemplados}</div>
        </CardContent></Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clientes.map((c) => {
          const pct = (c.parcelasPagas / c.parcelasTotais) * 100;
          return (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  {c.nome}
                  {c.contemplado && <Badge className="bg-success text-success-foreground">Contemplado</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-muted-foreground">{c.produto} · {formatBRL(c.valorCarta)}</div>
                <Progress value={pct} />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{c.parcelasPagas}/{c.parcelasTotais} parcelas</span>
                  <span>{Math.round(pct)}%</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
