// Busca tolerante compartilhada: ignora acentos/caixa e aceita pequenos erros de digitação
// de forma conservadora (todas as palavras da consulta precisam corresponder).

export function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function digitsOnly(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

/** Distância de Damerau-Levenshtein (transposição adjacente conta como 1 erro). */
export function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const row = d[i]!, prev = d[i - 1]!;
      row[j] = Math.min(prev[j]! + 1, row[j - 1]! + 1, prev[j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) row[j] = Math.min(row[j]!, d[i - 2]![j - 2]! + 1);
    }
  }
  return d[m]![n]!;
}

const MIN_FUZZY = 4;
const MIN_CONTAINS = 3;
const maxErrors = (len: number) => (len >= 8 ? 2 : len >= MIN_FUZZY ? 1 : 0);

function wordScore(q: string, w: string): number {
  if (w === q) return 100;
  if (w.startsWith(q)) return 80;
  if (q.length >= MIN_CONTAINS && w.includes(q)) return 60;
  const allowed = maxErrors(q.length);
  if (!allowed || w.length < MIN_FUZZY || q[0] !== w[0]) return 0;
  const full = Math.abs(w.length - q.length) <= allowed ? editDistance(q, w) : Infinity;
  const prefix = w.length > q.length ? editDistance(q, w.slice(0, q.length)) : Infinity;
  const dist = Math.min(full, prefix);
  return dist > allowed ? 0 : 40 - dist * 10;
}

export interface SearchFields {
  text?: (string | null | undefined)[];
  digits?: (string | null | undefined)[];
}

/** 0 = não corresponde; maior = mais relevante. Consulta vazia retorna 1. */
export function searchScore(query: string, fields: SearchFields): number {
  const raw = query.trim();
  if (!raw) return 1;
  if (/^[\d\s().+\-/]+$/.test(raw)) {
    const qDigits = digitsOnly(raw);
    if (!qDigits) return 0;
    const ds = (fields.digits ?? []).map(digitsOnly);
    if (qDigits.length < 3) return ds.some(v => v.startsWith(qDigits)) ? 50 : 0;
    return ds.some(v => v.includes(qDigits)) ? 90 : 0;
  }
  const qWords = normalizeText(raw).split(" ").filter(Boolean);
  const words = (fields.text ?? []).flatMap(v => normalizeText(v).split(" ").filter(Boolean));
  if (!qWords.length || !words.length) return 0;
  let total = 0;
  for (const q of qWords) {
    let best = 0;
    for (const w of words) { const s = wordScore(q, w); if (s > best) best = s; if (best === 100) break; }
    if (!best) return 0;
    total += best;
  }
  return total / qWords.length;
}

export function matchesSearch(query: string, fields: SearchFields): boolean {
  return searchScore(query, fields) > 0;
}
