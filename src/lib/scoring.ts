import type { Lead } from "./types";

export function calcScore(lead: Lead): number {
  let s = 0;
  if (lead.rendaEstimada && lead.rendaEstimada > 0) s += 20;
  // ≥1 interação registrada (proxy: respondeu mensagem ou tem último contato)
  if (lead.respondeuMensagem) s += 15;
  // tipo "Reunião"
  if (lead.reuniaoAgendada) s += 25;
  // tag "tem urgência"
  if (lead.temUrgencia) s += 20;
  if (lead.produto) s += 10;
  if (lead.temperatura === "Quente") s += 10;
  if (lead.temperatura === "Frio") s -= 20;
  const ref = lead.ultimoContato || lead.criadoEm;
  const dias = (Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24);
  if (dias > 7) s -= 30;
  return Math.max(0, Math.min(100, s));
}

export function scoreColor(score: number): "red" | "yellow" | "green" {
  if (score <= 30) return "red";
  if (score <= 60) return "yellow";
  return "green";
}

export function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}
