import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfig, useLeads, usePipelines } from "@/lib/store";
import { importCollections } from "@/lib/cloudStore";
import type { Lead, LeadProduto, Pipeline, PipelineCor } from "@/lib/types";

type ImportRow = {
  line: number;
  nome: string;
  telefone: string;
  email: string;
  produto: string;
  valorCarta: number;
  produtos: LeadProduto[];
  origem: string;
  etapa: string;
  perfil: string;
  objetivo: string;
  capacidadeMensal?: number;
  temperatura: "Frio" | "Morno" | "Quente";
  observacoes: string;
  error?: string;
  duplicateId?: string;
  duplicateName?: string;
  duplicateKind?: "phone" | "email" | "both";
  action: "merge" | "replace" | "skip";
  productNotes?: string[];
};

const TEMPLATE_HEADERS = ["Nome", "Telefone", "Email", "Produto", "Quantidade", "Valor do Produto", "Produto 2", "Quantidade 2", "Valor do Produto 2", "Origem", "Etapa", "Perfil", "Objetivo", "Capacidade mensal", "Temperatura", "Observações"];
const normalizePhone = (value: string) => value.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
const normalizeEmail = (value: string) => value.trim().toLowerCase();
const normalizeText = (value: string) => value.trim().toLocaleLowerCase("pt-BR");
const normalizeProductKey = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]/g, "");
const PRODUCT_SYNONYMS: Record<string, string[]> = {
  imovel: ["imovel", "imoveis", "casa", "casas", "apartamento", "apartamentos", "apto", "aptos"],
  veiculo: ["veiculo", "veiculos", "carro", "carros", "automovel", "automoveis", "auto", "autos"],
  moto: ["moto", "motos", "motocicleta", "motocicletas"],
};
const editDistance = (a: string, b: string) => {
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = previous[0]; previous[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = previous[j];
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return previous[b.length];
};
function resolveImportedProduct(raw: string, products: { nome: string; ativo: boolean; aliases?: string[] }[]) {
  const key = normalizeProductKey(raw);
  if (!key) return { value: raw, note: undefined as string | undefined };
  const candidates = products.filter(product => product.ativo && product.nome.trim()).map(product => {
    const productKey = normalizeProductKey(product.nome);
    const semanticGroup = Object.entries(PRODUCT_SYNONYMS).find(([, words]) => words.includes(productKey));
    const keys = [productKey, ...(product.aliases ?? []).map(normalizeProductKey), ...(semanticGroup?.[1] ?? [])].filter(Boolean);
    return { name: product.nome.trim(), keys: [...new Set(keys)] };
  });
  const exact = candidates.filter(candidate => candidate.keys.some(candidateKey => candidateKey === key || (candidateKey.length > 4 && candidateKey.replace(/s$/, "") === key.replace(/s$/, ""))));
  if (exact.length === 1) return { value: exact[0].name, note: raw.trim() === exact[0].name ? undefined : `${raw} → ${exact[0].name}` };
  if (exact.length > 1) return { value: raw, note: `${raw}: correspondência ambígua; mantido para revisão` };
  const ranked = candidates.map(candidate => {
    const score = Math.max(...candidate.keys.map(candidateKey => {
      const longest = Math.max(key.length, candidateKey.length);
      return longest ? 1 - editDistance(key, candidateKey) / longest : 0;
    }));
    return { ...candidate, score };
  }).sort((a, b) => b.score - a.score);
  if (ranked[0]?.score >= 0.84 && (!ranked[1] || ranked[0].score - ranked[1].score >= 0.08)) {
    return { value: ranked[0].name, note: `${raw} → ${ranked[0].name} (correspondência aproximada)` };
  }
  if (ranked[0]?.score >= 0.72) return { value: raw, note: `${raw}: possível correspondência com ${ranked[0].name}; mantido para revisão` };
  return { value: raw, note: undefined as string | undefined };
}

const formatImportCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(value);

function parseCsv(text: string) {
  const firstLine = text.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] ?? "";
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '"') {
      if (quoted && source[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell.trim()); cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && source[i + 1] === "\n") i++;
      row.push(cell.trim()); cell = "";
      if (row.some(value => value !== "")) rows.push(row);
      row = [];
    } else cell += char;
  }
  row.push(cell.trim());
  if (row.some(value => value !== "")) rows.push(row);
  if (rows.length < 2) throw new Error("A planilha precisa ter cabeçalho e pelo menos uma linha de lead.");
  const headers = rows[0].map(normalizeText);
  const aliases: Record<string, string[]> = {
    nome: ["nome", "nome completo", "name"],
    telefone: ["telefone", "celular", "whatsapp", "phone"],
    email: ["email", "e-mail"],
    produto: ["produto", "interesse", "tipo de crédito"],
    quantidade: ["quantidade", "qtd", "qtd."],
    valorCarta: ["valor do produto", "valor da carta", "valor carta", "credito", "crédito", "valor"],
    produto2: ["produto 2"],
    quantidade2: ["quantidade 2", "qtd 2", "qtd. 2"],
    valorCarta2: ["valor do produto 2", "valor da carta 2", "valor carta 2"],
    origem: ["origem", "fonte"],
    etapa: ["etapa", "status"],
    perfil: ["perfil"],
    objetivo: ["objetivo"],
    capacidadeMensal: ["capacidade mensal", "parcela disponível", "capacidade"],
    temperatura: ["temperatura"],
    observacoes: ["observações", "observacoes", "notas", "comentários", "comentarios"],
  };
  const indexes: Record<string, number> = {};
  for (const [field, names] of Object.entries(aliases)) {
    const index = headers.findIndex(header => names.includes(header));
    if (index >= 0) indexes[field] = index;
  }
  if (indexes.nome === undefined || indexes.telefone === undefined) throw new Error("A planilha precisa conter as colunas Nome e Telefone.");
  const numberValue = (raw: string) => {
    if (!raw.trim()) return 0;
    const cleaned = raw.replace(/R\$\s?/gi, "").replace(/\s/g, "");
    const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : /^\d{1,3}(\.\d{3})+$/.test(cleaned) ? cleaned.replace(/\./g, "") : cleaned;
    const value = Number(normalized);
    return Number.isFinite(value) && value >= 0 ? value : NaN;
  };
  return rows.slice(1).map((values, index): ImportRow => {
    const get = (field: string) => indexes[field] === undefined ? "" : values[indexes[field]] ?? "";
    const valorCarta = numberValue(get("valorCarta"));
    const quantidadeRaw = get("quantidade");
    const quantidade = quantidadeRaw ? numberValue(quantidadeRaw) : 1;
    const produto2 = get("produto2").trim();
    const valorCarta2 = get("valorCarta2") ? numberValue(get("valorCarta2")) : 0;
    const quantidade2Raw = get("quantidade2");
    const quantidade2 = quantidade2Raw ? numberValue(quantidade2Raw) : 1;
    const produto1 = get("produto").trim();
    // Só cria uma linha de produto quando a respectiva célula estiver preenchida.
    // Isso evita inventar "Imóvel" quando o contato possui apenas Veículo na segunda posição.
    const produtos: LeadProduto[] = [
      ...(produto1 ? [{ produto: produto1, quantidade, valorUnitario: valorCarta }] : []),
      ...(produto2 ? [{ produto: produto2, quantidade: quantidade2, valorUnitario: valorCarta2 }] : []),
    ];
    const totalProdutos = produtos.reduce((sum, item) => sum + item.quantidade * item.valorUnitario, 0);
    const capacidade = get("capacidadeMensal") ? numberValue(get("capacidadeMensal")) : undefined;
    const temperature = get("temperatura").trim().toLocaleLowerCase("pt-BR");
    const row: ImportRow = {
      line: index + 2, nome: get("nome"), telefone: get("telefone"), email: get("email"),
      produto: produtos[0]?.produto ?? "", valorCarta: totalProdutos, produtos, origem: get("origem") || "Importação",
      etapa: get("etapa"), perfil: get("perfil"), objetivo: get("objetivo"),
      capacidadeMensal: capacidade, temperatura: temperature === "frio" ? "Frio" : temperature === "quente" ? "Quente" : "Morno",
      observacoes: get("observacoes"), action: "merge",
    };
    if (!row.nome.trim()) row.error = "Nome não informado.";
    else if (!normalizePhone(row.telefone)) row.error = "Telefone não informado.";
    else if (row.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) row.error = "E-mail inválido.";
    else if (produtos.some(item => !Number.isFinite(item.valorUnitario) || item.valorUnitario < 0 || !Number.isInteger(item.quantidade) || item.quantidade < 1) || (capacidade !== undefined && !Number.isFinite(capacidade))) row.error = "Confira quantidades e valores numéricos dos produtos.";
    return row;
  });
}

function downloadTemplate() {
  const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const csv = "\uFEFF" + TEMPLATE_HEADERS.map(quote).join(";") + "\r\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = "modelo-importacao-leads.csv"; anchor.click();
  URL.revokeObjectURL(url);
}

export function LeadImportDialog({ open, onOpenChange, defaultPipelineId }: { open: boolean; onOpenChange: (open: boolean) => void; defaultPipelineId?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [leads] = useLeads();
  const [pipelines] = usePipelines();
  const [config] = useConfig();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [pipelineChoice, setPipelineChoice] = useState(defaultPipelineId ?? "");
  const [newPipelineName, setNewPipelineName] = useState("");
  const [initialStage, setInitialStage] = useState((config.etapas ?? []).find(stage => !["Fechado", "Perdido"].includes(stage.nome))?.nome ?? "Novo Lead");
  const [busy, setBusy] = useState(false);
  const stages = (config.etapas ?? []).map(stage => stage.nome);
  useEffect(() => { if (open) { setPipelineChoice(defaultPipelineId ?? ""); setInitialStage((config.etapas ?? []).find(stage => !["Fechado", "Perdido"].includes(stage.nome))?.nome ?? "Novo Lead"); } }, [open, defaultPipelineId, config.etapas]);
  const analyzedRows = useMemo(() => {
    if (!rows.length) return rows;
    const existingByPhone = new Map<string, Lead>();
    const existingByEmail = new Map<string, Lead>();
    leads.forEach(lead => {
      const phone = normalizePhone(lead.telefone);
      const email = normalizeEmail(lead.email ?? "");
      if (phone) existingByPhone.set(phone, lead);
      if (email) existingByEmail.set(email, lead);
    });
    const seenPhones = new Set<string>(), seenEmails = new Set<string>();
    return rows.map(row => {
      if (row.error) return row;
      const phone = normalizePhone(row.telefone), email = normalizeEmail(row.email);
      if ((phone && seenPhones.has(phone)) || (email && seenEmails.has(email))) return { ...row, error: "Contato repetido na própria planilha. Mantenha apenas uma linha." };
      if (phone) seenPhones.add(phone);
      if (email) seenEmails.add(email);
      const byPhone = phone ? existingByPhone.get(phone) : undefined;
      const byEmail = email ? existingByEmail.get(email) : undefined;
      if (byPhone && byEmail && byPhone.id !== byEmail.id) return { ...row, error: "Telefone e e-mail correspondem a leads diferentes. Revise manualmente." };
      const match = byPhone ?? byEmail;
      if (!match) return row;
      return { ...row, duplicateId: match.id, duplicateName: match.nome, duplicateKind: byPhone && byEmail ? "both" : byPhone ? "phone" : "email" };
    });
  }, [rows, leads]);
  const validRows = analyzedRows.filter(row => !row.error);
  const duplicates = analyzedRows.filter(row => row.duplicateId && !row.error);
  const readyCount = validRows.filter(row => !row.duplicateId || row.action !== "skip").length;

  const loadFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) { toast.error("Por enquanto, utilize o modelo CSV disponibilizado nesta tela. Ele abre normalmente no Excel e no Google Planilhas."); return; }
    try {
      setRows([]); setFileName(file.name);
      const buffer = await file.arrayBuffer();
      let csvText: string;
      try { csvText = new TextDecoder("utf-8", { fatal: true }).decode(buffer); }
      catch { csvText = new TextDecoder("windows-1252").decode(buffer); }
      const parsed = parseCsv(csvText).map(row => {
        const productNotes: string[] = [];
        const produtos = row.produtos.map(item => {
          const resolved = resolveImportedProduct(item.produto, config.produtosAtivos ?? []);
          if (resolved.note) productNotes.push(resolved.note);
          return { ...item, produto: resolved.value };
        });
        return { ...row, produtos, produto: produtos[0]?.produto ?? "", valorCarta: produtos.reduce((sum, item) => sum + item.quantidade * item.valorUnitario, 0), productNotes };
      });
      setRows(parsed);
      setFileName(file.name);
      toast.success(`${parsed.length} linhas analisadas.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível ler a planilha."); }
  };

  const importNow = async () => {
    const finalRows = analyzedRows;
    if (!finalRows.length || finalRows.some(row => row.error)) { toast.error("Corrija as linhas inválidas antes de importar."); return; }
    if (!readyCount) { toast.info("Não há leads novos ou atualizações para importar."); return; }
    if (!pipelineChoice) { toast.error("Selecione uma pipeline de destino."); return; }
    if (pipelineChoice === "__new__" && !newPipelineName.trim()) { toast.error("Informe o nome da nova pipeline."); return; }
    if (pipelineChoice === "__new__" && pipelines.some(p => p.nome.toLowerCase() === newPipelineName.trim().toLowerCase())) { toast.error("Já existe uma pipeline com esse nome."); return; }
    setBusy(true);
    try {
      let destinationId = pipelineChoice;
      let createdPipeline: Pipeline | undefined;
      if (pipelineChoice === "__new__") {
        createdPipeline = { id: crypto.randomUUID(), nome: newPipelineName.trim(), cor: "azul" as PipelineCor, ordem: pipelines.length, arquivada: false, created_at: new Date().toISOString() };
        destinationId = createdPipeline.id;
      }
      const now = new Date().toISOString();
      const imported: Lead[] = [];
      const replacements: Record<string, Lead> = {};
      for (const row of finalRows) {
        if (row.duplicateId && row.action === "skip") continue;
        const existing = row.duplicateId ? leads.find(lead => lead.id === row.duplicateId) : undefined;
        const incoming: Lead = {
          id: existing?.id ?? crypto.randomUUID(), pipeline_id: destinationId,
          nome: row.nome.trim(), telefone: row.telefone.trim(), email: row.email.trim(),
          produto: row.produtos[0]?.produto ?? row.produto.trim(), valorCarta: row.valorCarta, produtos: row.produtos,
          origem: row.origem.trim() || "Importação",
          etapa: stages.includes(row.etapa) && !["Fechado", "Perdido"].includes(row.etapa) ? row.etapa : initialStage,
          perfil: row.perfil.trim(), observacoes: row.observacoes.trim(),
          ultimoContato: existing?.ultimoContato ?? now, diasNaEtapa: existing?.diasNaEtapa ?? 0,
          criadoEm: existing?.criadoEm ?? now, stage_changed_at: existing?.stage_changed_at ?? now,
          detalhesCliente: { ...existing?.detalhesCliente, objetivo: row.objetivo.trim() || existing?.detalhesCliente?.objetivo, capacidadeMensal: row.capacidadeMensal ?? existing?.detalhesCliente?.capacidadeMensal, temperatura: row.temperatura },
        };
        if (existing && row.action === "merge") {
          const fill = (current: string | undefined, next: string) => current?.trim() ? current : next;
          replacements[existing.id] = {
            ...existing,
            nome: fill(existing.nome, incoming.nome), telefone: fill(existing.telefone, incoming.telefone),
            email: fill(existing.email, incoming.email),
            produto: fill(existing.produto, incoming.produto),
            valorCarta: existing.produtos?.length || existing.produto ? existing.valorCarta : incoming.valorCarta,
            produtos: existing.produtos?.length ? existing.produtos : existing.produto ? [{ produto: existing.produto, quantidade: 1, valorUnitario: existing.valorCarta }] : incoming.produtos,
            origem: fill(existing.origem, incoming.origem),
            perfil: fill(existing.perfil, incoming.perfil ?? ""), observacoes: fill(existing.observacoes, incoming.observacoes ?? ""),
            detalhesCliente: { ...existing.detalhesCliente, objetivo: fill(existing.detalhesCliente?.objetivo, row.objetivo), capacidadeMensal: existing.detalhesCliente?.capacidadeMensal ?? row.capacidadeMensal, temperatura: existing.detalhesCliente?.temperatura ?? row.temperatura },
          };
        } else imported.push(existing ? { ...existing, ...incoming } : incoming);
      }
      const changedLeads = [...Object.values(replacements), ...imported];
      await importCollections({ ...(createdPipeline ? { pipelines: [createdPipeline] } : {}), leads: changedLeads }, null, true);
      const added = imported.filter(item => !leads.some(lead => lead.id === item.id)).length;
      const updated = Object.keys(replacements).length + imported.filter(item => leads.some(lead => lead.id === item.id)).length;
      const skipped = finalRows.filter(row => row.duplicateId && row.action === "skip").length;
      toast.success(`Importação concluída: ${added} novos, ${updated} atualizados e ${skipped} ignorados.`);
      setRows([]); setFileName(""); setNewPipelineName(""); onOpenChange(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao importar os leads."); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={value => { if (!value && busy) return; onOpenChange(value); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader><DialogTitle>Importar leads de uma planilha</DialogTitle></DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="rounded-lg border p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-primary" /><div><p className="text-sm font-medium">Modelo oficial de importação</p><p className="text-xs text-muted-foreground">CSV compatível com Excel e Google Planilhas.</p></div></div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}><Download className="h-4 w-4 mr-2" />Baixar modelo</Button>
          </div>
          <div className="space-y-2">
            <Label>Arquivo CSV</Label>
            <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) void loadFile(file); event.target.value = ""; }} />
            <div className="flex flex-wrap items-center gap-2"><Button variant="outline" onClick={() => inputRef.current?.click()}><Upload className="h-4 w-4 mr-2" />Selecionar planilha</Button>{fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}</div>
            <p className="text-xs text-muted-foreground">Campos obrigatórios: Nome e Telefone. As demais colunas são opcionais. Use uma linha por contato.</p>
          </div>
          {analyzedRows.length > 0 && <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">Linhas</p><p className="text-xl font-semibold">{rows.length}</p></div>
              <div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">Válidas</p><p className="text-xl font-semibold">{validRows.length}</p></div>
              <div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">Duplicadas</p><p className="text-xl font-semibold">{duplicates.length}</p></div>
              <div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">Novos/atualizar</p><p className="text-xl font-semibold">{readyCount}</p></div>
            </div>
            <div className="space-y-2">
              <Label>Destino dos leads</Label>
              <Select value={pipelineChoice} onValueChange={setPipelineChoice}><SelectTrigger><SelectValue placeholder="Selecione uma pipeline" /></SelectTrigger><SelectContent>{pipelines.filter(p => !p.arquivada).map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}<SelectItem value="__new__">Criar nova pipeline</SelectItem></SelectContent></Select>
              {pipelineChoice === "__new__" && <div className="space-y-1"><Label>Nome da nova pipeline</Label><Input value={newPipelineName} onChange={event => setNewPipelineName(event.target.value)} placeholder="Ex.: Leads de campanha novembro" /></div>}
              <div className="space-y-1"><Label>Etapa inicial padrão</Label><Select value={initialStage} onValueChange={setInitialStage}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{stages.filter(stage => !["Fechado", "Perdido"].includes(stage)).map(stage => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2">
              <Label>Prévia e tratamento de duplicados</Label>
              <div className="max-h-64 overflow-auto rounded-md border">
                <table className="w-full text-sm"><thead className="sticky top-0 bg-muted"><tr><th className="p-2 text-left">Linha / Lead</th><th className="p-2 text-left">Telefone</th><th className="p-2 text-left">Produtos / valores</th><th className="p-2 text-left">Situação</th><th className="p-2 text-left">Ação</th></tr></thead><tbody>
                  {analyzedRows.map(row => <tr key={row.line} className="border-t"><td className="p-2"><div className="font-medium">{row.nome || "Sem nome"}</div><div className="text-xs text-muted-foreground">Linha {row.line}</div></td><td className="p-2 whitespace-nowrap">{row.telefone || "—"}</td><td className="p-2 min-w-48"><div className="space-y-0.5">{row.produtos.length ? row.produtos.map((item, index) => <div key={index} className="text-xs">{item.produto} · {item.quantidade} × {formatImportCurrency(item.valorUnitario)}</div>) : <span className="text-xs text-muted-foreground">Sem produto informado</span>}{row.productNotes?.map((note, noteIndex) => <div key={noteIndex} className="text-[10px] text-amber-600">{note}</div>)}<div className="text-xs font-medium">{formatImportCurrency(row.valorCarta)} total</div></div></td><td className="p-2">{row.error ? <span className="text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{row.error}</span> : row.duplicateId ? <span className="text-amber-600">Já existe: {row.duplicateName}</span> : <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Novo lead</span>}</td><td className="p-2">{row.error ? <div className="flex items-center gap-2"><span className="text-xs text-destructive">Remover linha</span><Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title={`Remover ${row.nome || `linha ${row.line}`} desta importação`} aria-label={`Remover ${row.nome || `linha ${row.line}`} desta importação`} onClick={() => setRows(prev => prev.filter(item => item.line !== row.line))}><Trash2 className="h-4 w-4" /></Button></div> : row.duplicateId ? <Select value={row.action} onValueChange={value => setRows(prev => prev.map(item => item.line === row.line ? { ...item, action: value as ImportRow["action"] } : item))}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="merge">Acrescentar</SelectItem><SelectItem value="replace">Substituir</SelectItem><SelectItem value="skip">Ignorar</SelectItem></SelectContent></Select> : "Importar"}</td></tr>)}
                </tbody></table>
              </div>
              <p className="text-xs text-muted-foreground">Duplicidade identificada por telefone ou e-mail. “Acrescentar” preenche apenas campos vazios e mantém pipeline/etapa atuais; “Substituir” atualiza os dados da planilha, direciona para a pipeline escolhida e preserva o histórico comercial; “Ignorar” mantém o cadastro atual.</p>
            </div>
          </>}
        </div>
        <DialogFooter className="shrink-0 border-t pt-3"><Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button><Button onClick={importNow} disabled={busy || !analyzedRows.length || analyzedRows.some(row => row.error)}>{busy ? "Importando..." : `Importar ${readyCount} leads`}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
