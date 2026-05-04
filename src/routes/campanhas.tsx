import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCampanhas } from "@/lib/store";
import { formatBRL } from "@/lib/scoring";

export const Route = createFileRoute("/campanhas")({ component: CampanhasPage });

function CampanhasPage() {
  const [campanhas] = useCampanhas();
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Campanhas</h1>
        <p className="text-muted-foreground">ROI das suas campanhas de captação</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campanhas.map((c) => {
          const cpl = c.investimento / Math.max(1, c.leadsGerados);
          const conv = (c.vendas / Math.max(1, c.leadsGerados)) * 100;
          return (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  {c.nome}
                  {c.ativa
                    ? <Badge className="bg-success text-success-foreground">Ativa</Badge>
                    : <Badge variant="secondary">Encerrada</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-muted-foreground text-xs">Canal</div><div className="font-medium">{c.canal}</div></div>
                <div><div className="text-muted-foreground text-xs">Investimento</div><div className="font-medium">{formatBRL(c.investimento)}</div></div>
                <div><div className="text-muted-foreground text-xs">Leads</div><div className="font-medium">{c.leadsGerados}</div></div>
                <div><div className="text-muted-foreground text-xs">Vendas</div><div className="font-medium">{c.vendas}</div></div>
                <div><div className="text-muted-foreground text-xs">CPL</div><div className="font-medium">{formatBRL(cpl)}</div></div>
                <div><div className="text-muted-foreground text-xs">Conversão</div><div className="font-medium">{conv.toFixed(1)}%</div></div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
