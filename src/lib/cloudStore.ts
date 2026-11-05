import { useCallback, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type CollectionTable = "pipelines" | "leads" | "clientes" | "tarefas" | "propostas" | "campanhas";
export type CloudTable = CollectionTable | "configuracoes";
export const COLLECTION_TABLES: CollectionTable[] = ["pipelines", "leads", "clientes", "tarefas", "propostas", "campanhas"];
export const SAVE_ERROR = "Não foi possível salvar. Verifique sua conexão e tente novamente.";

type Entry = { data: unknown; loaded: boolean };
const state = new Map<CloudTable, Entry>();
const listeners = new Set<() => void>();
let userId: string | null = null;
let version = 0;
const emit = () => { version++; listeners.forEach((l) => l()); };
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export function setCloudUser(id: string | null) {
  if (id === userId) return;
  userId = id;
  state.clear();
  emit();
  if (id) void reloadAll();
}
export const getCloudUser = () => userId;

async function fetchTable(table: CloudTable) {
  if (table === "configuracoes") {
    const { data, error } = await supabase.from("configuracoes").select("data").maybeSingle();
    if (error) throw error;
    return data?.data ?? null;
  }
  const { data, error } = await supabase.from(table).select("id,data");
  if (error) throw error;
  return (data ?? []).map((r) => r.data);
}

export async function reloadAll() {
  const uid = userId;
  if (!uid) return;
  const tables: CloudTable[] = [...COLLECTION_TABLES, "configuracoes"];
  const results = await Promise.allSettled(tables.map(fetchTable));
  if (uid !== userId) return;
  results.forEach((r, i) => {
    if (r.status === "fulfilled") state.set(tables[i], { data: r.value, loaded: true });
    else if (!state.get(tables[i])?.loaded) state.set(tables[i], { data: tables[i] === "configuracoes" ? null : [], loaded: true });
  });
  emit();
}

export const cloudReady = () => [...COLLECTION_TABLES, "configuracoes" as const].every((t) => state.get(t)?.loaded);
export const useCloudReady = () => useSyncExternalStore(subscribe, () => (userId ? cloudReady() : false), () => false);

type Item = { id: string };
export function diffCollection(prev: Item[], next: Item[]) {
  const before = new Map(prev.map((i) => [i.id, JSON.stringify(i)]));
  const nextIds = new Set(next.map((i) => i.id));
  return {
    upserts: next.filter((i) => before.get(i.id) !== JSON.stringify(i)),
    deletes: prev.filter((i) => !nextIds.has(i.id)).map((i) => i.id),
  };
}

async function persistCollection(table: CollectionTable, prev: Item[], next: Item[]) {
  const { upserts, deletes } = diffCollection(prev, next);
  const now = new Date().toISOString();
  if (upserts.length) {
    const { error } = await supabase.from(table).upsert(upserts.map((i) => ({ id: i.id, user_id: userId!, data: i as never, updated_at: now })), { onConflict: "user_id,id" });
    if (error) throw error;
  }
  if (deletes.length) {
    const { error } = await supabase.from(table).delete().in("id", deletes);
    if (error) throw error;
  }
}

export function useCloudCollection<T extends Item>(table: CollectionTable) {
  useSyncExternalStore(subscribe, () => version, () => 0);
  const value = (state.get(table)?.data as T[] | undefined) ?? EMPTY;
  const save = useCallback((update: T[] | ((previous: T[]) => T[])) => {
    if (!userId) return;
    const prev = ((state.get(table)?.data as T[]) ?? []);
    const next = typeof update === "function" ? (update as (p: T[]) => T[])(prev) : update;
    state.set(table, { data: next, loaded: true });
    emit();
    persistCollection(table, prev, next).catch(() => {
      state.set(table, { data: prev, loaded: true });
      emit();
      toast.error(SAVE_ERROR);
    });
  }, [table]);
  return [value as T[], save] as const;
}
const EMPTY: never[] = [];

export function useCloudDocument<T extends object>(defaults: T) {
  useSyncExternalStore(subscribe, () => version, () => 0);
  const stored = state.get("configuracoes")?.data as Partial<T> | null | undefined;
  const value = stored ? ({ ...defaults, ...stored } as T) : defaults;
  const save = useCallback((update: T | ((previous: T) => T)) => {
    if (!userId) return;
    const prevRaw = state.get("configuracoes")?.data as T | null;
    const prev = prevRaw ? ({ ...defaults, ...prevRaw } as T) : defaults;
    const next = typeof update === "function" ? (update as (p: T) => T)(prev) : update;
    state.set("configuracoes", { data: next, loaded: true });
    emit();
    supabase.from("configuracoes").upsert({ user_id: userId, data: next as never, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).then(({ error }) => {
      if (!error) return;
      state.set("configuracoes", { data: prevRaw, loaded: true });
      emit();
      toast.error(SAVE_ERROR);
    });
  }, [defaults]);
  return [value, save] as const;
}

/** Bulk insert without duplicating ids already in the cloud. Returns how many records were added. */
export async function importCollections(payload: Partial<Record<CollectionTable, Item[]>>, config?: object | null, overwrite = false) {
  let count = 0;
  for (const table of COLLECTION_TABLES) {
    const incoming = (payload[table] ?? []).filter((i) => i && typeof i.id === "string");
    if (!incoming.length) continue;
    const existing = new Set(((state.get(table)?.data as Item[]) ?? []).map((i) => i.id));
    const rows = overwrite ? incoming : incoming.filter((i) => !existing.has(i.id));
    if (!rows.length) continue;
    const { error } = await supabase.from(table).upsert(rows.map((i) => ({ id: i.id, user_id: userId!, data: i as never })), { onConflict: "user_id,id" });
    if (error) throw error;
    count += overwrite ? rows.length : rows.filter((i) => !existing.has(i.id)).length;
  }
  if (config && (overwrite || !state.get("configuracoes")?.data)) {
    const { error } = await supabase.from("configuracoes").upsert({ user_id: userId!, data: config as never }, { onConflict: "user_id" });
    if (error) throw error;
  }
  await reloadAll();
  return count;
}

export function snapshot() {
  const out: Record<string, unknown> = {};
  for (const t of COLLECTION_TABLES) out[t] = state.get(t)?.data ?? [];
  out.configuracoes = state.get("configuracoes")?.data ?? null;
  return out;
}
export const cloudIsEmpty = () => COLLECTION_TABLES.every((t) => t === "pipelines" ? ((state.get(t)?.data as Item[]) ?? []).length <= 1 : !((state.get(t)?.data as Item[]) ?? []).length);

export const LOCAL_PREFIX = "crm_initialized_v5";
export function readLocalData() {
  const out: Partial<Record<CollectionTable, Item[]>> = {};
  let config: object | null = null;
  try {
    for (const t of COLLECTION_TABLES) {
      const raw = localStorage.getItem(`${LOCAL_PREFIX}.${t}`);
      if (raw) { const v = JSON.parse(raw); if (Array.isArray(v)) out[t] = v; }
    }
    const raw = localStorage.getItem(`${LOCAL_PREFIX}.config`);
    if (raw) config = JSON.parse(raw);
  } catch { /* ignore broken local data */ }
  const total = Object.values(out).reduce((s, a) => s + (a?.length ?? 0), 0);
  return { collections: out, config, total };
}

export function validateBackup(json: unknown): { collections: Partial<Record<CollectionTable, Item[]>>; config: object | null } {
  if (!json || typeof json !== "object") throw new Error("Arquivo inválido.");
  const obj = json as Record<string, unknown>;
  const collections: Partial<Record<CollectionTable, Item[]>> = {};
  let found = false;
  for (const t of COLLECTION_TABLES) {
    if (obj[t] === undefined) continue;
    if (!Array.isArray(obj[t]) || !(obj[t] as unknown[]).every((i) => i && typeof i === "object" && typeof (i as Item).id === "string")) throw new Error(`Seção "${t}" inválida no backup.`);
    collections[t] = obj[t] as Item[];
    found = true;
  }
  const config = obj.configuracoes && typeof obj.configuracoes === "object" ? (obj.configuracoes as object) : null;
  if (!found && !config) throw new Error("O arquivo não contém dados do CRM.");
  return { collections, config };
}
