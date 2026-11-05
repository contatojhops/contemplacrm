import { useEffect } from "react";
import { defaultConfig } from "./mockData";
import type { Lead, Cliente, Tarefa, Proposta, Campanha, Pipeline } from "./types";
import { generalPipeline, normalizeLeads } from "./pipelines";
import { useCloudCollection, useCloudDocument, useCloudReady } from "./cloudStore";

export const usePipelines = () => {
  const [pipelines, save] = useCloudCollection<Pipeline>("pipelines");
  const ready = useCloudReady();
  useEffect(() => {
    if (ready && pipelines.length === 0) save([generalPipeline()]);
  }, [ready, pipelines.length, save]);
  return [pipelines, save] as const;
};
export const useLeads = () => {
  const [leads, save] = useCloudCollection<Lead>("leads");
  const [pipelines] = usePipelines();
  const ready = useCloudReady();
  useEffect(() => {
    if (ready && pipelines.length && leads.some(l => !pipelines.some(p => p.id === l.pipeline_id))) save(normalizeLeads(leads, pipelines));
  }, [ready, leads, pipelines, save]);
  return [leads, save] as const;
};
export const useClientes = () => useCloudCollection<Cliente & { id: string }>("clientes");
export const useTarefas = () => {
  const [tasks, save] = useCloudCollection<Tarefa>("tarefas");
  const [leads] = useLeads();
  const ready = useCloudReady();
  useEffect(() => {
    if (!ready) return;
    const needs = tasks.some(t => !t.lead_id && leads.some(l => l.id === t.leadId || l.nome === t.cliente));
    if (needs) save(tasks.map(t => ({ ...t, lead_id: t.lead_id || leads.find(l => l.id === t.leadId || l.nome === t.cliente)?.id || '' })));
  }, [ready, tasks, leads, save]);
  return [tasks, save] as const;
};
export const usePropostas = () => useCloudCollection<Proposta>("propostas");
export const useCampanhas = () => useCloudCollection<Campanha>("campanhas");
export const useConfig = () => useCloudDocument(defaultConfig);
