import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  TrendingUp,
  Users as UsersIcon,
  Flame,
  FileText,
  CheckCircle2,
  DollarSign,
  MessageCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLeads, usePropostas, useTarefas, useConfig } from "@/lib/store";
import { calcScore, formatBRL } from "@/lib/scoring";
import type { Etapa, Origem, Produto } from "@/lib/types";

export const Route = createFileRoute("/")({ component: Dashboard });

const PRODUTOS: Produto[] = ["Imóvel", "Veículo", "Serviço", "Moto", "Investimento", "Outros"];
const ORIGENS: Origem[] = ["Meta Ads", "Instagram", "WhatsApp", "Indicação", "Orgânico", "Outros"];
const ETAPAS: Etapa[] = ["Novo Lead", "Contato Realizado", "Proposta Enviada", "Em Análise", "Fechado", "Perdido"];
const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "oklch(0.6 0.05 250)"];

function Dashboard() {
  const [leads] = useLeads();
  const [propostas] = usePropostas();
  const [tarefas] = useTarefas();
  const [config] = useConfig();

  const stats = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const leadsMes = leads.filter((l) => new Date(l.criadoEm) >= monthStart);
    const quentes = leads.filter((l) => l.temperatura === "Quente");
    const propostasMes = propostas.filter((p) => new Date(p.criadaEm) >= monthStart && ["Enviada", "Em Análise", "Aprovada"].includes(p.status));
    const fechados = leads.filter((l) => l.etapa === "Fechado");
    const fechadosMes = fechados.filter((l) => new Date(l.criadoEm) >= monthStart);
    const ativos: Etapa[] = ["Novo Lead", "Contato Realizado", "Proposta Enviada", "Em Análise"];
    const pipelineValor = leads.filter((l) => ativos.includes(l.etapa)).reduce((s, l) => s + l.valorCarta, 0);
    const receitaFechada = fechadosMes.reduce((s, l) => s + l.valorCarta, 0);
    return { leadsMes: leadsMes.length, quentes: quentes.length, propostasMes: propostasMes.length, fechadosMes: fechadosMes.length, pipelineValor, receitaFechada };
  }, [leads, propostas]);

  const funnelData = ETAPAS.map((e) => ({ etapa: e, leads: leads.filter((l) => l.etapa === e).length }));
  const origemData = ORIGENS.map((o) => ({ name: o, value: leads.filter((l) => l.origem === o).length })).filter(d => d.value > 0);
  const produtoData = PRODUTOS.map((p) => ({ name: p, leads: leads.filter((l) => l.produto === p).length }));

  const evolucaoData = useMemo(() => {
    const out: { mes: string; leads: number; vendas: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const ls = leads.filter((l) => {
        const c = new Date(l.criadoEm);
        return c >= d && c < next;
      });
      out.push({
        mes: d.toLocaleDateString("pt-BR", { month: "short" }),
        leads: ls.length,
        vendas: ls.filter((l) => l.etapa === "Fechado").length,
      });
    }
    return out;
  }, [leads]);

  const conversaoData = PRODUTOS.map((p) => {
    const total = leads.filter((l) => l.produto === p).length;
    const fechados = leads.filter((l) => l.produto === p && l.etapa === "Fechado").length;
    return { name: p, taxa: total ? Math.round((fechados / total) * 100) : 0 };
  });

  const semContato = leads
    .filter((l) => {
      const dias = (Date.now() - new Date(l.ultimoContato).getTime()) / 86400000;
      return dias > 7 && !["Fechado", "Perdido"].includes(l.etapa);
    })
    .slice(0, 5);

  const followupsHoje = tarefas.filter((t) => {
    const d = new Date(t.data);
    const today = new Date();
    return !t.concluida && d.toDateString() === today.toDateString();
  }).slice(0, 5);

  const quentesSemProposta = leads.filter(
    (l) => l.temperatura === "Quente" && !propostas.some((p) => p.leadId === l.id) && !["Fechado", "Perdido"].includes(l.etapa)
  ).slice(0, 5);

  const metaPercent = Math.min(100, (stats.receitaFechada / config.metaMensal) * 100);

  const kpis = [
    { label: "Leads do Mês", value: stats.leadsMes, icon: UsersIcon, trend: "+12%", color: "text-chart-1" },
    { label: "Leads Quentes", value: stats.quentes, icon: Flame, trend: "+8%", color: "text-destructive" },
    { label: "Propostas Enviadas", value: stats.propostasMes, icon: FileText, trend: "+5%", color: "text-chart-3" },
    { label: "Vendas Fechadas", value: stats.fechadosMes, icon: CheckCircle2, trend: "+20%", color: "text-success" },
    { label: "Pipeline Potencial", value: formatBRL(stats.pipelineValor), icon: DollarSign, trend: "+15%", color: "text-chart-2" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da sua operação de vendas</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <k.icon className={`h-5 w-5 ${k.color}`} />
                <span className="text-xs text-success font-medium flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />{k.trend}
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold">{k.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold">{Math.round(metaPercent)}%</span>
            </div>
            <div className="mt-2 text-sm font-bold">Meta Mensal</div>
            <Progress value={metaPercent} className="mt-2 h-2" />
            <div className="text-xs text-muted-foreground mt-1">{formatBRL(stats.receitaFechada)} / {formatBRL(config.metaMensal)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Funil de Vendas</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--muted-foreground)" />
                <YAxis type="category" dataKey="etapa" stroke="var(--muted-foreground)" width={140} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                <Bar dataKey="leads" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Leads por Origem</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={origemData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {origemData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Leads por Produto</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={produtoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                <Bar dataKey="leads" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Evolução Mensal</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucaoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="mes" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                <Legend />
                <Line type="monotone" dataKey="leads" stroke="var(--chart-1)" strokeWidth={2} name="Leads Gerados" />
                <Line type="monotone" dataKey="vendas" stroke="var(--chart-5)" strokeWidth={2} name="Vendas Fechadas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Taxa de Conversão por Produto</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversaoData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" unit="%" stroke="var(--muted-foreground)" />
                <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" width={100} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                <Bar dataKey="taxa" fill="var(--chart-3)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Leads sem contato +7 dias</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {semContato.length === 0 && <p className="text-sm text-muted-foreground">Nenhum lead pendente 🎉</p>}
            {semContato.map((l) => (
              <div key={l.id} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-sm font-semibold">
                  {l.nome[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{l.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(l.ultimoContato).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <a href={`https://wa.me/55${l.telefone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-3 w-3 mr-1" />Contatar
                  </a>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Follow-ups de Hoje</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {followupsHoje.length === 0 && <p className="text-sm text-muted-foreground">Sem tarefas para hoje</p>}
            {followupsHoje.map((t) => (
              <div key={t.id} className="flex items-center gap-3">
                <div className="text-xs font-mono bg-accent rounded px-2 py-1">
                  {new Date(t.data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.cliente}</div>
                  <div className="text-xs text-muted-foreground">{t.tipo}</div>
                </div>
                <Button size="sm" variant="outline"><CheckCircle2 className="h-3 w-3 mr-1" />Concluir</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Leads Quentes sem Proposta</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {quentesSemProposta.length === 0 && <p className="text-sm text-muted-foreground">Tudo em ordem</p>}
            {quentesSemProposta.map((l) => {
              const score = calcScore(l);
              return (
                <div key={l.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{l.nome}</div>
                    <div className="text-xs text-muted-foreground">{l.produto}</div>
                  </div>
                  <Badge variant="secondary">{score}</Badge>
                  <Button size="sm" variant="outline"><FileText className="h-3 w-3 mr-1" />Proposta</Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

