import { pageHead } from "@/lib/metadata";
import { FEATURES } from "@/lib/features";
import { DELETE_CONFIRMATION, whatsappUrl, localDate, localInput } from "@/lib/crm";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClientes, useLeads, usePropostas, useConfig, useTarefas } from "@/lib/store";
import { ArrowLeft, MessageCircle, Plus, Upload, Download, Trash2, X, FileText, Image as ImageIcon, File } from "lucide-react";
import { ScoreBadge } from "@/components/LeadCard";
import { calcScore, formatBRL } from "@/lib/scoring";
import { toast } from "sonner";
import type { Cliente, ClienteFase, ClientePerfil, Documento, Interacao, InteracaoResultado, InteracaoTipo, ObjecaoRegistrada, Origem, Produto, Tarefa, TarefaTipo } from "@/lib/types";

export const Route = createFileRoute("/clientes/$id")({ head: () => pageHead("Perfil do cliente", "Dados, interações e próximas ações do cliente."), component: ClienteProfilePage });

const PERFIS: ClientePerfil[] = ["Pessoa Física", "Profissional Liberal", "Empresário", "Investidor"];
const FASES: ClienteFase[] = ["Lead", "Recuperação", "Cliente Ativo", "Contemplado"];
const TAGS_PREDEF = ["aguardando documentos", "recontato em 30 dias", "tem urgência", "muito interessado", "sem urgência", "tem dívidas", "quer pensar mais"];
const INTERACAO_TIPOS: InteracaoTipo[] = ["WhatsApp", "Ligação", "Reunião", "Instagram DM", "E-mail", "Presencial"];
const INTERACAO_ICON: Record<InteracaoTipo, string> = { WhatsApp: "💬", Ligação: "📞", Reunião: "🤝", "Instagram DM": "📱", "E-mail": "📧", Presencial: "🤝" };
const RESULTADOS: InteracaoResultado[] = ["Positivo", "Neutro", "Negativo"];
const RESULT_ICON: Record<InteracaoResultado, string> = { Positivo: "✅", Neutro: "➡️", Negativo: "❌" };
const OBJECOES_PREDEF = ["Parcela muito alta", "Preciso pensar mais", "Tenho dívidas", "Não conheço consórcio", "Tenho medo de não ser contemplado", "Já tentei consórcio antes", "Prefiro financiamento", "Não tenho urgência agora"];

function initials(nome: string) { return nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase(); }
function perfilColor(p?: ClientePerfil) {
  switch (p) {
    case "Investidor": return "bg-success";
    case "Empresário": return "bg-primary";
    case "Profissional Liberal": return "bg-warning";
    default: return "bg-secondary";
  }
}
function faseBadge(f?: ClienteFase) {
  switch (f) {
    case "Cliente Ativo": return "bg-primary text-primary-foreground";
    case "Contemplado": return "bg-success text-success-foreground";
    case "Recuperação": return "bg-warning text-warning-foreground";
    default: return "bg-secondary text-secondary-foreground";
  }
}

function ClienteProfilePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [clientes, setClientes] = useClientes();
  const [leads, setLeads] = useLeads();
  const [propostas] = usePropostas();
  const [tarefas, setTarefas] = useTarefas();
  const [config] = useConfig();

  // Resolver cliente: pode vir de leads (id começa com lead_)
  const fromLead = id.startsWith("lead_");
  const realId = fromLead ? id.slice(5) : id;
  const baseLead = fromLead ? leads.find((l) => l.id === realId) : leads.find((l) => l.nome === clientes.find((c) => c.id === id)?.nome);

  const cliente: Cliente | undefined = useMemo(() => {
    if (fromLead && baseLead) {
      return {
        id, nome: baseLead.nome, telefone: baseLead.telefone, email: baseLead.email,
        produto: baseLead.produto, valorCarta: baseLead.valorCarta, produtos: baseLead.produtos, parcelasPagas: 0,
        parcelasTotais: 0, contemplado: false, fechadoEm: baseLead.closed_at ?? baseLead.stage_changed_at ?? "",
        ...baseLead.detalhesCliente, perfil: baseLead.perfil as ClientePerfil,
        fase: baseLead.etapa === "Fechado" ? "Cliente Ativo" : baseLead.detalhesCliente?.fase ?? "Lead", origem: baseLead.origem,
        ultimaInteracao: baseLead.ultimoContato, rendaEstimada: baseLead.rendaEstimada,
      };
    }
    return clientes.find((c) => c.id === id);
  }, [id, clientes, baseLead, fromLead]);

  const [tab, setTab] = useState("dados");
  const [interacaoModal, setInteracaoModal] = useState(false);
  const [objecaoModal, setObjecaoModal] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const produtos = [...new Set([...(config.produtosAtivos ?? []).filter(p => p.ativo).map(p => p.nome), ...(cliente?.produto ? [cliente.produto] : [])])];
  const origens = [...new Set([...(config.origens ?? []), ...(cliente?.origem ? [cliente.origem] : [])])];

  if (!cliente) {
    return (
      <div className="p-6">
        <p>Cliente não encontrado</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/clientes">Voltar</Link></Button>
      </div>
    );
  }

  const update = (patch: Partial<Cliente>) => {
    if (fromLead) {
      setLeads(prev => prev.map(l => l.id === realId ? { ...l, nome: patch.nome ?? l.nome, telefone: patch.telefone ?? l.telefone, email: patch.email ?? l.email, perfil: patch.perfil ?? l.perfil, produto: patch.produto ?? l.produto, valorCarta: patch.valorCarta ?? l.valorCarta, origem: patch.origem ?? l.origem, rendaEstimada: patch.rendaEstimada ?? l.rendaEstimada, ultimoContato: patch.ultimaInteracao ?? l.ultimoContato, respondeuMensagem: patch.interacoes ? patch.interacoes.length > 0 : l.respondeuMensagem, reuniaoAgendada: patch.interacoes ? patch.interacoes.some(i => i.tipo === "Reunião") : l.reuniaoAgendada, temUrgencia: patch.tags ? patch.tags.includes("tem urgência") : l.temUrgencia, detalhesCliente: { ...l.detalhesCliente, ...patch } } : l));
    } else {
      setClientes((p) => p.map((c) => c.id === id ? { ...c, ...patch } : c));
    }
  };

  const saveAll = () => { toast.success("Cliente salvo!"); };

  const score = baseLead ? calcScore(baseLead) : 70;
  const fase = cliente.fase ?? (cliente.contemplado ? "Contemplado" : "Cliente Ativo");
  const propostasCliente = propostas.filter((p) => p.leadNome === cliente.nome || p.clienteId === cliente.id);

  const saveNextAction = (action = cliente.proximaAcao) => {
    if (!action || !action.data || !action.tipo?.trim() || !action.descricao?.trim()) {
      toast.error("Preencha data, tipo e descrição da próxima ação.");
      return;
    }
    const actionDate = localDate(action.data);
    if (!Number.isFinite(actionDate.getTime())) { toast.error("Informe uma data válida."); return; }
    const [hours, minutes] = (action.hora || "09:00").split(":").map(Number);
    actionDate.setHours(hours || 0, minutes || 0, 0, 0);
    const normalized = { ...action, id: action.id ?? crypto.randomUUID() };
    update({ proximaAcao: normalized });
    if (fromLead) {
      const existing = tarefas.find(t => t.proximaAcaoId === normalized.id);
      const validTypes: TarefaTipo[] = ["Ligação", "WhatsApp", "Reunião", "E-mail", "Visita", "Follow-up", "Enviar Proposta", "Recontato", "Outro"];
      const task: Tarefa = {
        id: existing?.id ?? crypto.randomUUID(),
        titulo: normalized.tipo + ": " + normalized.descricao,
        tipo: validTypes.includes(normalized.tipo as TarefaTipo) ? normalized.tipo as TarefaTipo : "Follow-up",
        cliente: cliente.nome,
        lead_id: realId,
        leadId: realId,
        data: actionDate.toISOString(),
        concluida: false,
        prioridade: existing?.prioridade ?? "Média",
        descricao: normalized.descricao,
        lembrete: existing?.lembrete ?? true,
        proximaAcaoId: normalized.id,
      };
      setTarefas(prev => existing ? prev.map(t => t.id === existing.id ? task : t) : [task, ...prev]);
    }
    toast.success(fromLead ? "Próxima ação salva e adicionada à Agenda." : "Próxima ação salva.");
  };

  const addInteracao = (i: Interacao) => {
    const list = [...(cliente.interacoes ?? []), i];
    update({ interacoes: list, ultimaInteracao: i.data });
  };
  const addObjecao = (o: ObjecaoRegistrada) => {
    update({ objecoes: [...(cliente.objecoes ?? []), o] });
  };
  const toggleTag = (t: string) => {
    const tags = cliente.tags ?? [];
    update({ tags: tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t] });
  };
  const addCustomTag = () => {
    if (!tagInput.trim()) return;
    update({ tags: [...(cliente.tags ?? []), tagInput.trim()] });
    setTagInput("");
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    try {
      const documents = await Promise.all(Array.from(files).map(async f => {
        if (f.size > 2 * 1024 * 1024) throw new Error("Cada arquivo deve ter até 2 MB.");
        const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(f); });
        return { id: crypto.randomUUID(), nome: f.name, tipo: f.type, tamanho: f.size, data: new Date().toISOString(), base64 };
      }));
      update({ documentos: [...(cliente.documentos ?? []), ...documents] });
      toast.success("Documentos salvos");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível salvar os documentos."); }
  };
  const removeDoc = (did: string) => { if (confirm(DELETE_CONFIRMATION)) update({ documentos: (cliente.documentos ?? []).filter((d) => d.id !== did) }); };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm"><Link to="/clientes"><ArrowLeft className="h-4 w-4 mr-1" />Clientes</Link></Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Coluna esquerda */}
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className={`h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold text-white ${perfilColor(cliente.perfil)}`}>
                {initials(cliente.nome)}
              </div>
              <h2 className="text-xl font-bold">{cliente.nome}</h2>
              <div className="flex flex-wrap gap-1 justify-center">
                <Badge className={faseBadge(fase)}>{fase}</Badge>
                <ScoreBadge score={score} />
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Telefone:</span>
                <div className="flex items-center gap-1">
                  <span>{cliente.telefone}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" asChild>
                    <a href={whatsappUrl(cliente.telefone)} target="_blank" rel="noreferrer"><MessageCircle className="h-3.5 w-3.5 text-success" /></a>
                  </Button>
                </div>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">E-mail:</span><span className="truncate">{cliente.email}</span></div>
              <div className="flex items-start justify-between gap-2"><span className="text-muted-foreground">Produtos:</span><div className="flex flex-wrap justify-end gap-1">{[...new Map((baseLead?.produtos?.length ? baseLead.produtos : [{ produto: cliente.produto, quantidade: 1, valorUnitario: cliente.valorCarta }]).map(item => [item.produto, { ...item, quantidade: (baseLead?.produtos ?? []).filter(p => p.produto === item.produto).reduce((sum, p) => sum + p.quantidade, 0) || item.quantidade }])).values()].map(item => <Badge key={item.produto} variant="secondary">{item.produto}{item.quantidade > 1 ? ` ×${item.quantidade}` : ""}</Badge>)}</div></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Carta:</span><span>{formatBRL(cliente.valorCarta)}</span></div>
              {baseLead && <div className="flex justify-between"><span className="text-muted-foreground">Entrada:</span><span>{localDate(baseLead.criadoEm).toLocaleDateString("pt-BR")}</span></div>}
            </div>
            {cliente.proximaAcao && (
              <div className="rounded-lg border border-border p-3 bg-accent/50">
                <div className="text-xs font-semibold text-muted-foreground mb-1">Próxima Ação</div>
                <div className="text-sm font-medium">{localDate(cliente.proximaAcao.data).toLocaleDateString("pt-BR")} {cliente.proximaAcao.hora}</div>
                <div className="text-xs">{cliente.proximaAcao.descricao}</div>
              </div>
            )}
            <div className="space-y-2">
              <Button size="sm" className="w-full" onClick={() => setInteracaoModal(true)}>Registrar Interação</Button>
              {FEATURES.propostas && <Button size="sm" variant="outline" className="w-full" asChild><Link to="/propostas">Criar Proposta</Link></Button>}
              <Button size="sm" variant="outline" className="w-full" asChild><Link to="/agenda">Agendar Tarefa</Link></Button>
            </div>
          </CardContent>
        </Card>

        {/* Coluna direita */}
        <div className="lg:col-span-2">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
              <TabsTrigger value="produto">Produto</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
              <TabsTrigger value="objecoes">Objeções</TabsTrigger>
              {FEATURES.propostas && <TabsTrigger value="propostas">Propostas</TabsTrigger>}
              <TabsTrigger value="docs">Documentos</TabsTrigger>
              <TabsTrigger value="acao">Próxima Ação</TabsTrigger>
            </TabsList>

            <TabsContent value="dados">
              <Card><CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>Nome completo</Label><Input value={cliente.nome} onChange={(e) => update({ nome: e.target.value })} /></div>
                <div><Label>CPF/CNPJ</Label><Input value={cliente.cpf ?? ""} onChange={(e) => update({ cpf: e.target.value })} /></div>
                <div><Label>Data de nascimento</Label><Input type="date" value={cliente.dataNascimento ?? ""} onChange={(e) => update({ dataNascimento: e.target.value })} /></div>
                <div><Label>Profissão</Label><Input value={cliente.profissao ?? ""} onChange={(e) => update({ profissao: e.target.value })} /></div>
                <div><Label>Renda estimada (R$)</Label><Input type="number" value={cliente.rendaEstimada ?? 0} onChange={(e) => update({ rendaEstimada: Number(e.target.value) })} /></div>
                <div><Label>Capacidade mensal (R$)</Label><Input type="number" value={cliente.capacidadeMensal ?? 0} onChange={(e) => update({ capacidadeMensal: Number(e.target.value) })} /></div>
                <div className="md:col-span-2"><Label>Objetivo do cliente</Label><Input placeholder="Ex.: comprar imóvel para renda, trocar de veículo, investir..." value={cliente.objetivo ?? ""} onChange={(e) => update({ objetivo: e.target.value })} /></div>
                <div><Label>Temperatura do lead</Label><Select value={cliente.temperatura ?? "Morno"} onValueChange={(v) => update({ temperatura: v as Cliente["temperatura"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Frio">Frio</SelectItem><SelectItem value="Morno">Morno</SelectItem><SelectItem value="Quente">Quente</SelectItem></SelectContent></Select></div>
                <div><Label>Telefone (WhatsApp)</Label><Input value={cliente.telefone} onChange={(e) => update({ telefone: e.target.value })} /></div>
                <div><Label>E-mail</Label><Input value={cliente.email} onChange={(e) => update({ email: e.target.value })} /></div>
                <div><Label>Cidade</Label><Input value={cliente.cidade ?? ""} onChange={(e) => update({ cidade: e.target.value })} /></div>
                <div><Label>Estado</Label><Input value={cliente.estado ?? ""} onChange={(e) => update({ estado: e.target.value })} /></div>
                <div>
                  <Label>Como conheceu</Label>
                  <Select value={cliente.origem} onValueChange={(v) => update({ origem: v as Origem })}>
                    <SelectTrigger><SelectValue placeholder="Origem" /></SelectTrigger>
                    <SelectContent>{origens.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Perfil</Label>
                  <Select value={cliente.perfil} onValueChange={(v) => update({ perfil: v as ClientePerfil })}>
                    <SelectTrigger><SelectValue placeholder="Perfil" /></SelectTrigger>
                    <SelectContent>{PERFIS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fase</Label>
                  <Select value={fase} onValueChange={(v) => update({ fase: v as ClienteFase })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{FASES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-1">
                    {(cliente.tags ?? []).map((t) => (
                      <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => toggleTag(t)}>{t} <X className="h-3 w-3 ml-1" /></Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {TAGS_PREDEF.filter((t) => !(cliente.tags ?? []).includes(t)).map((t) => (
                      <Badge key={t} variant="outline" className="cursor-pointer" onClick={() => toggleTag(t)}>+ {t}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Tag personalizada" value={tagInput} onChange={(e) => setTagInput(e.target.value)} />
                    <Button onClick={addCustomTag}>Adicionar</Button>
                  </div>
                </div>
                <div className="md:col-span-2"><Button onClick={saveAll}>Salvar alterações</Button></div>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="produto">
              <Card><CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Produto</Label>
                  <Select value={cliente.produto} onValueChange={(v) => update({ produto: v as Produto })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{produtos.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Valor da carta (R$)</Label><Input type="number" value={cliente.valorCarta} onChange={(e) => update({ valorCarta: Number(e.target.value) })} /></div>
                <div><Label>Prazo preferido (meses)</Label><Input type="number" value={cliente.prazoMeses ?? 60} onChange={(e) => {
                  const prazo = Number(e.target.value);
                  const productConfig = config.simuladorProdutos?.find(item => item.produto === cliente.produto);
                  const taxas = (cliente.valorCarta * ((productConfig?.taxaAdmin ?? config.taxaAdmin) + (productConfig?.fundoReserva ?? config.fundoReserva))) / 100;
                  const parcela = prazo > 0 ? (cliente.valorCarta + taxas) / prazo : 0;
                  update({ prazoMeses: prazo, parcelaEstimada: parcela });
                }} /></div>
                <div><Label>Parcela estimada (R$)</Label><Input value={(cliente.parcelaEstimada ?? 0).toFixed(2)} readOnly /></div>
                <div className="md:col-span-2"><Label>Observações</Label><Textarea value={cliente.observacoesProduto ?? ""} onChange={(e) => update({ observacoesProduto: e.target.value })} /></div>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="historico">
              <Card><CardContent className="p-6 space-y-4">
                <div className="flex justify-end"><Button onClick={() => setInteracaoModal(true)}><Plus className="h-4 w-4 mr-1" />Registrar Interação</Button></div>
                {fromLead && baseLead && (baseLead.historicoEtapas ?? []).length > 0 && <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Histórico de etapas</h3>
                  {(baseLead.historicoEtapas ?? []).slice().reverse().map(item => <div key={item.id} className="rounded-md border border-border p-2 text-xs"><div className="text-muted-foreground">{new Date(item.data).toLocaleString("pt-BR")}</div><div>{item.etapaAnterior} → {item.etapaNova}</div><div className="text-muted-foreground">{item.atividadeRegistrada ? "Próxima atividade registrada" : "Sem atividade registrada"}</div></div>)}
                </div>}
                <div className="relative pl-6 space-y-4 border-l border-border">
                  {(cliente.interacoes ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhuma interação registrada</p>}
                  {(cliente.interacoes ?? []).slice().reverse().map((i) => (
                    <div key={i.id} className="relative">
                      <div className="absolute -left-[31px] h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">{INTERACAO_ICON[i.tipo]}</div>
                      <div className="bg-card border border-border rounded-lg p-3 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{i.tipo}</span>
                          <Badge variant="outline">{RESULT_ICON[i.resultado]} {i.resultado}</Badge>
                          {i.duracao && <span className="text-xs text-muted-foreground">{i.duracao} min</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">{new Date(i.data).toLocaleString("pt-BR")}</div>
                        <p className="text-sm">{i.resumo}</p>
                        {i.objecoes && i.objecoes.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {i.objecoes.map((o) => <Badge key={o} variant="secondary">{o}</Badge>)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="objecoes">
              <Card><CardContent className="p-6 space-y-4">
                <div className="flex justify-end"><Button onClick={() => setObjecaoModal(true)}><Plus className="h-4 w-4 mr-1" />Registrar Objeção</Button></div>
                <Table>
                  <TableHeader><TableRow><TableHead>Objeção</TableHead><TableHead>Resposta utilizada</TableHead><TableHead>Data</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(cliente.objecoes ?? []).map((o) => (
                      <TableRow key={o.id}><TableCell>{o.texto}</TableCell><TableCell>{o.resposta}</TableCell><TableCell>{localDate(o.data).toLocaleDateString("pt-BR")}</TableCell></TableRow>
                    ))}
                    {(cliente.objecoes ?? []).length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Nenhuma objeção registrada</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent></Card>
            </TabsContent>

            {FEATURES.propostas && <TabsContent value="propostas">
              <Card><CardContent className="p-6 space-y-4">
                <div className="flex justify-end"><Button asChild><Link to="/propostas"><Plus className="h-4 w-4 mr-1" />Nova Proposta</Link></Button></div>
                <Table>
                  <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Produto</TableHead><TableHead>Carta</TableHead><TableHead>Prazo</TableHead><TableHead>Parcela</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {propostasCliente.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{localDate(p.criadaEm).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{p.produto}</TableCell>
                        <TableCell>{formatBRL(p.valorCarta)}</TableCell>
                        <TableCell>{p.prazoMeses}m</TableCell>
                        <TableCell>{formatBRL(p.parcela)}</TableCell>
                        <TableCell><Badge>{p.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {propostasCliente.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhuma proposta</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent></Card>
            </TabsContent>}

            <TabsContent value="docs">
              <Card><CardContent className="p-6 space-y-4">
                <label onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }} className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-accent">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm">Clique ou arraste arquivos (PDF, JPG, PNG, DOCX)</span>
                  <input type="file" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png,.docx" onChange={(e) => handleFiles(e.target.files)} />
                </label>
                <div className="space-y-2">
                  {(cliente.documentos ?? []).map((d) => {
                    const Icon = d.tipo.startsWith("image") ? ImageIcon : d.tipo.includes("pdf") ? FileText : File;
                    return (
                      <div key={d.id} className="flex items-center gap-3 p-2 border border-border rounded-lg">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{d.nome}</div>
                          <div className="text-xs text-muted-foreground">{(d.tamanho / 1024).toFixed(1)} KB · {localDate(d.data).toLocaleDateString("pt-BR")}</div>
                        </div>
                        <Button size="icon" variant="ghost" asChild className="h-7 w-7"><a href={d.base64} download={d.nome}><Download className="h-4 w-4" /></a></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeDoc(d.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    );
                  })}
                  {(cliente.documentos ?? []).length === 0 && <p className="text-sm text-muted-foreground text-center">Nenhum documento</p>}
                </div>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="acao">
              <Card><CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><Label>Data</Label><Input type="date" value={cliente.proximaAcao?.data?.slice(0,10) ?? ""} onChange={(e) => update({ proximaAcao: { ...(cliente.proximaAcao ?? { tipo: "Follow-up", descricao: "" }), data: e.target.value } })} /></div>
                  <div><Label>Hora</Label><Input type="time" value={cliente.proximaAcao?.hora ?? ""} onChange={(e) => update({ proximaAcao: { ...(cliente.proximaAcao ?? { data: new Date().toISOString(), tipo: "Follow-up", descricao: "" }), hora: e.target.value } })} /></div>
                  <div><Label>Tipo</Label><Input value={cliente.proximaAcao?.tipo ?? ""} onChange={(e) => update({ proximaAcao: { ...(cliente.proximaAcao ?? { data: new Date().toISOString(), descricao: "" }), tipo: e.target.value } })} /></div>
                  <div className="md:col-span-2"><Label>Descrição</Label><Textarea value={cliente.proximaAcao?.descricao ?? ""} onChange={(e) => update({ proximaAcao: { ...(cliente.proximaAcao ?? { data: new Date().toISOString(), tipo: "Follow-up" }), descricao: e.target.value } })} /></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => saveNextAction()}>{fromLead ? "Salvar e adicionar à Agenda" : "Salvar próxima ação"}</Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    if (cliente.proximaAcao) {
                      update({
                        acoesConcluidas: [...(cliente.acoesConcluidas ?? []), { id: cliente.proximaAcao.id, data: new Date().toISOString(), tipo: cliente.proximaAcao.tipo, descricao: cliente.proximaAcao.descricao }],
                        proximaAcao: undefined,
                      });
                      if (fromLead && cliente.proximaAcao.id) setTarefas(prev => prev.map(t => t.proximaAcaoId === cliente.proximaAcao?.id ? { ...t, concluida: true } : t));
                      toast.success("Concluída e registrada no histórico.");
                    }
                  }}>Concluída</Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    if (cliente.proximaAcao) {
                      const d = localDate(cliente.proximaAcao.data); d.setDate(d.getDate() + 1);
                      saveNextAction({ ...cliente.proximaAcao, data: d.toISOString() });
                    }
                  }}>Reagendar</Button>
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-2">Histórico de ações concluídas</h3>
                  <div className="space-y-1">
                    {(cliente.acoesConcluidas ?? []).map((a, i) => (
                      <div key={i} className="text-xs border border-border rounded p-2">
                        ✓ {new Date(a.data).toLocaleDateString("pt-BR")} — {a.tipo}: {a.descricao}
                      </div>
                    ))}
                    {(cliente.acoesConcluidas ?? []).length === 0 && <p className="text-xs text-muted-foreground">Nenhuma ação concluída</p>}
                  </div>
                </div>
              </CardContent></Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <InteracaoModal open={interacaoModal} onOpenChange={setInteracaoModal} onSave={addInteracao} />
      <ObjecaoModal open={objecaoModal} onOpenChange={setObjecaoModal} onSave={addObjecao} />
    </div>
  );
}

function InteracaoModal({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (b: boolean) => void; onSave: (i: Interacao) => void }) {
  const [tipo, setTipo] = useState<InteracaoTipo>("WhatsApp");
  const [data, setData] = useState(localInput());
  const [duracao, setDuracao] = useState(0);
  const [resumo, setResumo] = useState("");
  const [resultado, setResultado] = useState<InteracaoResultado>("Neutro");
  const [objs, setObjs] = useState<string[]>([]);
  const [custom, setCustom] = useState("");

  const submit = () => {
    if (!data || !Number.isFinite(new Date(data).getTime())) { toast.error("Informe uma data válida"); return; }
    if (!resumo.trim()) { toast.error("Adicione um resumo"); return; }
    onSave({ id: crypto.randomUUID(), tipo, data: new Date(data).toISOString(), duracao, resumo, resultado, objecoes: objs });
    onOpenChange(false);
    setResumo(""); setObjs([]); setCustom("");
    toast.success("Interação registrada");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar Interação</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as InteracaoTipo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{INTERACAO_TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Resultado</Label>
              <Select value={resultado} onValueChange={(v) => setResultado(v as InteracaoResultado)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RESULTADOS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Data e hora</Label><Input type="datetime-local" value={data} onChange={(e) => setData(e.target.value)} /></div>
            <div><Label>Duração (min)</Label><Input type="number" value={duracao} onChange={(e) => setDuracao(Number(e.target.value))} /></div>
          </div>
          <div><Label>Resumo</Label><Textarea value={resumo} onChange={(e) => setResumo(e.target.value)} /></div>
          <div>
            <Label>Objeções mencionadas</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {OBJECOES_PREDEF.map((o) => (
                <Badge key={o} variant={objs.includes(o) ? "default" : "outline"} className="cursor-pointer"
                  onClick={() => setObjs((p) => p.includes(o) ? p.filter((x) => x !== o) : [...p, o])}>{o}</Badge>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input placeholder="Outra objeção" value={custom} onChange={(e) => setCustom(e.target.value)} />
              <Button onClick={() => { if (custom.trim()) { setObjs((p) => [...p, custom.trim()]); setCustom(""); } }}>Adicionar</Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ObjecaoModal({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (b: boolean) => void; onSave: (o: ObjecaoRegistrada) => void }) {
  const [texto, setTexto] = useState(OBJECOES_PREDEF[0]);
  const [custom, setCustom] = useState("");
  const [resposta, setResposta] = useState("");

  const submit = () => {
    const t = texto === "Outro" ? custom : texto;
    if (!t || !resposta) { toast.error("Preencha objeção e resposta"); return; }
    onSave({ id: crypto.randomUUID(), texto: t, resposta, data: new Date().toISOString() });
    onOpenChange(false);
    setResposta(""); setCustom("");
    toast.success("Objeção registrada");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar Objeção</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Objeção</Label>
            <Select value={texto} onValueChange={setTexto}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {OBJECOES_PREDEF.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {texto === "Outro" && <div><Label>Texto da objeção</Label><Input value={custom} onChange={(e) => setCustom(e.target.value)} /></div>}
          <div><Label>Resposta/argumento utilizado</Label><Textarea value={resposta} onChange={(e) => setResposta(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
