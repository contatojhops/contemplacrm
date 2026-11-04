import { useLocalStorage } from "@/hooks/useLocalStorage";
import { defaultConfig } from "./mockData";
import type { Lead, Cliente, Tarefa, Proposta, Campanha, Pipeline } from "./types";
import { useEffect } from "react";
import { generalPipeline, normalizeLeads } from "./pipelines";

const STORAGE_VERSION = "crm_initialized_v5";

export const usePipelines = () => {
  const [pipelines, save] = useLocalStorage<Pipeline[]>(`${STORAGE_VERSION}.pipelines`, []);
  useEffect(() => {
    const raw = localStorage.getItem(`${STORAGE_VERSION}.pipelines`);
    if (!raw || JSON.parse(raw).length === 0) save([generalPipeline()]);
  }, [save]);
  return [pipelines, save] as const;
};
export const useLeads = () => {
  const [leads, save] = useLocalStorage<Lead[]>(`${STORAGE_VERSION}.leads`, []);
  const [pipelines] = usePipelines();
  useEffect(() => {
    if (pipelines.length && leads.some(l => !pipelines.some(p => p.id === l.pipeline_id))) save(normalizeLeads(leads,pipelines));
  }, [leads,pipelines,save]);
  return [leads, save] as const;
};
export const useClientes = () => useLocalStorage<Cliente[]>(`${STORAGE_VERSION}.clientes`, []);
export const useTarefas = () => {
  const [tasks, save] = useLocalStorage<Tarefa[]>(`${STORAGE_VERSION}.tarefas`, []);
  const [leads] = useLeads();
  useEffect(() => {
    const needs = tasks.some(t => !t.lead_id && leads.some(l => l.id === t.leadId || l.nome === t.cliente));
    if (needs) save(tasks.map(t => ({ ...t, lead_id: t.lead_id || leads.find(l => l.id === t.leadId || l.nome === t.cliente)?.id || '' })));
  }, [tasks,leads,save]);
  return [tasks,save] as const;
};
export const usePropostas = () => useLocalStorage<Proposta[]>(`${STORAGE_VERSION}.propostas`, []);
export const useCampanhas = () => useLocalStorage<Campanha[]>(`${STORAGE_VERSION}.campanhas`, []);
export const useConfig = () => useLocalStorage(`${STORAGE_VERSION}.config`, defaultConfig);
