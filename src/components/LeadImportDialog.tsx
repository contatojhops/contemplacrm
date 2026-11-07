import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfig, useLeads, usePipelines } from "@/lib/store";
import type { Lead, Pipeline, PipelineCor } from "@/lib/types";

type ImportRow = {
  line: number;
  nome: string;
  telefone: string;
  email: string;
  produto: string;
  valorCarta: number;
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
};

const TEMPLATE_HEADERS = ["Nome", "Telefone", "Email", "Produto", "Valor da carta", "Origem", "Etapa", "Perfil", "Objetivo", "Capacidade mensal", "Temperatura", "Observações"];
const normalizePhone = (value: string) => value.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
const normalizeEmail = (value: string) => value.trim().toLowerCase();
const normalizeText = (value: string) => value.trim().toLocaleLowerCase("pt-BR");

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
    valorCarta: ["valor da carta", "valor carta", "credito", "crédito", "valor"],
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
    const capacidade = get("capacidadeMensal") ? numberValue(get("capacidadeMensal")) : undefined;
    const temperature = get("temperatura").trim().toLocaleLowerCase("pt-BR");
    const row: ImportRow = {
      line: index + 2, nome: get("nome"), telefone: get("telefone"), email: get("email"),
      produto: get("produto") || "Imóvel", valorCarta, origem: get("origem") || "Importação",
      etapa: get("etapa"), perfil: get("perfil"), objetivo: get("objetivo"),
      capacidadeMensal: capacidade, temperatura: temperature === "frio" ? "Frio" : temperature === "quente" ? "Quente" : "Morno",
      observacoes: get("observacoes"), action: "merge",
    };
    if (!row.nome.trim()) row.error = "Nome não informado.";
    else if (!normalizePhone(row.telefone)) row.error = "Telefone não informado.";
    else if (!Number.isFinite(valorCarta) || (capacidade !== undefined && !Number.isFinite(capacidade))) row.error = "Valor numérico inválido.";
    return row;
  });
}

function downloadTemplate() {
  const examples = [
    ["Maria Silva", "71991234567", "maria@email.com", "Imóvel", "100000", "Meta Ads", "Novo Lead", "Investidor", "Comprar imóvel para renda", "1500", "Quente", "Interessada em carta de crédito"],
    ["João Souza", "71987654321", "", "Veículo", "80000", "Indicação", "Contato Realizado", "Empresário", "Trocar de veículo", "1200", "Morno", ""],
  ];
  const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const csv = "\uFEFF" + [TEMPLATE_HEADERS, ...examples].map(row => row.map(quote).join(";")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = "modelo-importacao-leads.csv"; anchor.click();
  URL.revokeObjectURL(url);
}

export function LeadImportDialog({ open, onOpenChange, defaultPipelineId }: { open: boolean; onOpenChange: (open: boolean) => void; defaultPipelineId?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [leads, setLeads] = useLeads();
  const [pipelines, setPipelines] = usePipelines();
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
      const parsed = parseCsv(await file.text());
      setRows(parsed);
      setFileName(file.name);
      toast.success(`${parsed.length} linhas analisadas.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível ler a planilha."); }
  };

  const importNow = async () => {
    const finalRows = analyzedRows;
    if (!finalRows.length || finalRows.some(row => row.error)) { toast.error("Corrija as linhas inválidas antes de importar."); return; }
    if (!pipelineChoice) { toast.error("Selecione uma pipeline de destino."); return; }
    if (pipelineChoice === "__new__" && !newPipelineName.trim()) { toast.error("Informe o nome da nova pipeline."); return; }
    if (pipelineChoice === "__new__" && pipelines.some(p => p.nome.toLowerCase() === newPipelineName.trim().toLowerCase())) { toast.error("Já existe uma pipeline com esse nome."); return; }
    setBusy(true);
    try {
      let destinationId = pipelineChoice;
      if (pipelineChoice === "__new__") {
        const created: Pipeline = { id: crypto.randomUUID(), nome: newPipelineName.trim(), cor: "azul" as PipelineCor, ordem: pipelines.length, arquivada: false, created_at: new Date().toISOString() };
        setPipelines(prev => [...prev, created]);
        destinationId = created.id;
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
          produto: row.produto.trim() || "Imóvel", valorCarta: row.valorCarta,
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
            email: fill(existing.email, incoming.email), produto: fill(existing.produto, incoming.produto),
            valorCarta: existing.valorCarta || incoming.valorCarta, origem: fill(existing.origem, incoming.origem),
            perfil: fill(existing.perfil, incoming.perfil), observacoes: fill(existing.observacoes, incoming.observacoes),
            detalhesCliente: { ...existing.detalhesCliente, objetivo: fill(existing.detalhesCliente?.objetivo, row.objetivo), capacidadeMensal: existing.detalhesCliente?.capacidadeMensal ?? row.capacidadeMensal, temperatura: existing.detalhesCliente?.temperatura ?? row.temperatura },
          };
        } else imported.push(existing ? { ...existing, ...incoming } : incoming);
      }
      setLeads(prev => {
        const replaced = prev.map(lead => replacements[lead.id] ?? lead);
        const withoutReplaced = replaced.filter(lead => !imported.some(item => item.id === lead.id));
        return [...imported, ...withoutReplaced];
      });
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
                <table className="w-full text-sm"><thead className="sticky top-0 bg-muted"><tr><th className="p-2 text-left">Linha / Lead</th><th className="p-2 text-left">Telefone</th><th className="p-2 text-left">Situação</th><th className="p-2 text-left">Ação</th></tr></thead><tbody>
                  {analyzedRows.map(row => <tr key={row.line} className="border-t"><td className="p-2"><div className="font-medium">{row.nome || "Sem nome"}</div><div className="text-xs text-muted-foreground">Linha {row.line}</div></td><td className="p-2 whitespace-nowrap">{row.telefone || "—"}</td><td className="p-2">{row.error ? <span className="text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{row.error}</span> : row.duplicateId ? <span className="text-amber-600">Já existe: {row.duplicateName}</span> : <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Novo lead</span>}</td><td className="p-2">{row.duplicateId && !row.error ? <Select value={row.action} onValueChange={value => setRows(prev => prev.map(item => item.line === row.line ? { ...item, action: value as ImportRow["action"] } : item))}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="merge">Acrescentar</SelectItem><SelectItem value="replace">Substituir</SelectItem><SelectItem value="skip">Ignorar</SelectItem></SelectContent></Select> : row.error ? "Corrigir arquivo" : "Importar"}</td></tr>)}
                </tbody></table>
              </div>
              <p className="text-xs text-muted-foreground">Duplicidade identificada por telefone ou e-mail. “Acrescentar” preenche apenas campos vazios; “Substituir” atualiza os dados da planilha sem apagar o histórico comercial; “Ignorar” mantém o cadastro atual.</p>
            </div>
          </>}
        </div>
        <DialogFooter className="shrink-0 border-t pt-3"><Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button><Button onClick={importNow} disabled={busy || !analyzedRows.length || analyzedRows.some(row => row.error)}>{busy ? "Importando..." : `Importar ${readyCount} leads`}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
