import { useCallback, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type CollectionTable = "pipelines" | "leads" | "clientes" | "tarefas" | "propostas" | "campanhas";
export type CloudTable = CollectionTable | "configuracoes";
export const COLLECTION_TABLES: CollectionTable[] = ["pipelines", "leads", "clientes", "tarefas", "propostas", "campanhas"];
export const SAVE_ERROR = "Não foi possível salvar. Verifique sua conexão e tente novamente.";

type Entry = { data: unknown; loaded: boolean };
const state = new Map<CloudTable, Entry>();
const loadErrors = new Map<CloudTable, string>();
const listeners = new Set<() => void>();
const writeQueues = new Map<CloudTable, Promise<void>>();
let userId: string | null = null;
let version = 0;
const emit = () => { version++; listeners.forEach((l) => l()); };
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export function setCloudUser(id: string | null) {
  if (id === userId) return;
  userId = id;
  state.clear();
  loadErrors.clear();
  writeQueues.clear();
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
  const results = await Promise.allSettled(tables.map((table) => {
    // Do not let a focus-triggered refresh overwrite optimistic state while a write is queued.
    if (writeQueues.has(table)) return Promise.resolve(state.get(table)?.data ?? (table === "configuracoes" ? null : []));
    return fetchTable(table);
  }));
  if (uid !== userId) return;
  results.forEach((r, i) => {
    const table = tables[i];
    if (r.status === "fulfilled") {
      state.set(table, { data: r.value, loaded: true });
      loadErrors.delete(table);
    } else {
      // A failed request is never represented as an empty collection.
      state.set(table, { data: state.get(table)?.data ?? (table === "configuracoes" ? null : []), loaded: false });
      loadErrors.set(table, "Não foi possível carregar os dados da nuvem. Verifique a conexão e tente novamente.");
    }
  });
  emit();
}

export const cloudReady = () => [...COLLECTION_TABLES, "configuracoes" as const].every((t) => state.get(t)?.loaded);
export function cloudLoadError() {
  return [...loadErrors.values()][0] ?? null;
}
export const useCloudReady = () => useSyncExternalStore(subscribe, () => (userId ? cloudReady() : false), () => false);
export const useCloudError = () => useSyncExternalStore(subscribe, cloudLoadError, () => null);

type Item = { id: string };
export function diffCollection(prev: Item[], next: Item[]) {
  const before = new Map(prev.map((i) => [i.id, JSON.stringify(i)]));
  const nextIds = new Set(next.map((i) => i.id));
  return {
    upserts: next.filter((i) => before.get(i.id) !== JSON.stringify(i)),
    deletes: prev.filter((i) => !nextIds.has(i.id)).map((i) => i.id),
  };
}

/** One database function applies inserts, updates and deletes in a single transaction. */
async function persistCollection(table: CollectionTable, prev: Item[], next: Item[]) {
  const { upserts, deletes } = diffCollection(prev, next);
  if (!upserts.length && !deletes.length) return;
  const { error } = await supabase.rpc("persist_crm_collection", {
    p_table: table,
    p_upserts: upserts,
    p_deletes: deletes,
  });
  if (error) throw error;
}

export function useCloudCollection<T extends Item>(table: CollectionTable) {
  useSyncExternalStore(subscribe, () => version, () => 0);
  const value = (state.get(table)?.data as T[] | undefined) ?? EMPTY;
  const save = useCallback((update: T[] | ((previous: T[]) => T[])) => {
    const uid = userId;
    if (!uid) {
      toast.error("Sua sessão expirou. Entre novamente para salvar.");
      return;
    }
    const prev = (state.get(table)?.data as T[] | undefined) ?? [];
    const next = typeof update === "function" ? (update as (p: T[]) => T[])(prev) : update;
    state.set(table, { data: next, loaded: true });
    loadErrors.delete(table);
    emit();

    // Serialize writes per table. Each queued write persists the latest desired
    // snapshot against the latest server snapshot, avoiding stale diffs/races.
    const previousQueue = writeQueues.get(table) ?? Promise.resolve();
    const task = previousQueue.catch(() => undefined).then(async () => {
      if (uid !== userId) return;
      const remote = await fetchTable(table) as T[];
      const desired = (state.get(table)?.data as T[] | undefined) ?? next;
      await persistCollection(table, remote, desired);
      if (uid === userId) {
        loadErrors.delete(table);
        state.set(table, { data: desired, loaded: true });
        emit();
      }
    }).catch(async () => {
      if (uid !== userId) return;
      try {
        const remote = await fetchTable(table) as T[];
        state.set(table, { data: remote, loaded: true });
        loadErrors.delete(table);
      } catch {
        state.set(table, { data: state.get(table)?.data ?? prev, loaded: false });
        loadErrors.set(table, "Falha ao confirmar a gravação. Reconecte e atualize os dados antes de continuar.");
      }
      emit();
      toast.error(SAVE_ERROR);
    });
    writeQueues.set(table, task);
    void task.finally(() => {
      if (writeQueues.get(table) === task) writeQueues.delete(table);
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
    const uid = userId;
    if (!uid) {
      toast.error("Sua sessão expirou. Entre novamente para salvar.");
      return;
    }
    const prevRaw = state.get("configuracoes")?.data as T | null;
    const prev = prevRaw ? ({ ...defaults, ...prevRaw } as T) : defaults;
    const next = typeof update === "function" ? (update as (p: T) => T)(prev) : update;
    state.set("configuracoes", { data: next, loaded: true });
    loadErrors.delete("configuracoes");
    emit();
    const previousQueue = writeQueues.get("configuracoes") ?? Promise.resolve();
    const task = previousQueue.catch(() => undefined).then(async () => {
      if (uid !== userId) return;
      const desired = state.get("configuracoes")?.data ?? next;
      const { error } = await supabase.from("configuracoes").upsert({ user_id: uid, data: desired as never, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (error) throw error;
    }).catch(async () => {
      if (uid !== userId) return;
      try {
        const remote = await fetchTable("configuracoes");
        state.set("configuracoes", { data: remote, loaded: true });
        loadErrors.delete("configuracoes");
      } catch {
        state.set("configuracoes", { data: prevRaw, loaded: false });
        loadErrors.set("configuracoes", "Falha ao confirmar as configurações na nuvem.");
      }
      emit();
      toast.error(SAVE_ERROR);
    });
    writeQueues.set("configuracoes", task);
    void task.finally(() => {
      if (writeQueues.get("configuracoes") === task) writeQueues.delete("configuracoes");
    });
  }, [defaults]);
  return [value, save] as const;
}

/** Bulk insert without duplicating ids already in the cloud. Returns how many records were added. */
export async function importCollections(payload: Partial<Record<CollectionTable, Item[]>>, config?: object | null, overwrite = false) {
  if (!userId) throw new Error("É necessário entrar na conta para importar dados.");
  let count = 0;
  for (const table of COLLECTION_TABLES) {
    const incoming = (payload[table] ?? []).filter((i) => i && typeof i.id === "string");
    if (!incoming.length) continue;
    const remote = await fetchTable(table) as Item[];
    const existing = new Set(remote.map((i) => i.id));
    const rows = overwrite ? incoming : incoming.filter((i) => !existing.has(i.id));
    if (!rows.length) continue;
    const next = overwrite ? rows : [...remote, ...rows];
    await persistCollection(table, remote, next);
    count += rows.length;
  }
  if (config && (overwrite || !state.get("configuracoes")?.data)) {
    const { error } = await supabase.from("configuracoes").upsert({ user_id: userId, data: config as never }, { onConflict: "user_id" });
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
export const cloudIsEmpty = () => cloudReady() && COLLECTION_TABLES.every((t) => t === "pipelines" ? ((state.get(t)?.data as Item[]) ?? []).length <= 1 : !((state.get(t)?.data as Item[]) ?? []).length);

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
