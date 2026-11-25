import { useSyncExternalStore } from "react";
import type { Lead } from "./types";
import { stageDays } from "./crm";

export interface Suggestion { proximoPasso: string; motivo: string; key: string; }
const KEY = "crm_ai_next_steps_v1";
let state: Record<string, Suggestion> = {};
if (typeof window !== "undefined") { try { state = JSON.parse(sessionStorage.getItem(KEY) ?? "{}"); } catch { state = {}; } }
const subs = new Set<() => void>();

/** Lead ativo parado: mais de 7 dias na mesma etapa (mesmo critério do Dashboard). */
export const isStalled = (l: Lead, now = new Date()) => !["Fechado", "Perdido"].includes(l.etapa) && stageDays(l, now) > 7;
/** A sugestão vale enquanto o lead não muda de etapa nem recebe novo contato. */
export const suggestionKey = (l: Lead) => `${l.etapa}|${l.stage_changed_at ?? l.criadoEm}|${l.ultimoContato ?? ""}`;

export function setSuggestions(items: Record<string, Suggestion>) {
  state = { ...state, ...items };
  try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch { /* memória apenas */ }
  subs.forEach(f => f());
}
export function useSuggestion(lead: Lead) {
  const s = useSyncExternalStore(cb => { subs.add(cb); return () => subs.delete(cb); }, () => state[lead.id], () => undefined);
  return s && s.key === suggestionKey(lead) ? s : undefined;
}
export const hasFreshSuggestion = (l: Lead) => state[l.id]?.key === suggestionKey(l);
