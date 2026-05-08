import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  mockLeads,
  mockClientes,
  mockTarefas,
  mockPropostas,
  mockCampanhas,
  defaultConfig,
} from "./mockData";

// v4: bump key prefix to invalidate stale cached data (current date is May 2026)
export const useLeads = () => useLocalStorage("crm.v4.leads", mockLeads);
export const useClientes = () => useLocalStorage("crm.v4.clientes", mockClientes);
export const useTarefas = () => useLocalStorage("crm.v4.tarefas", mockTarefas);
export const usePropostas = () => useLocalStorage("crm.v4.propostas", mockPropostas);
export const useCampanhas = () => useLocalStorage("crm.v4.campanhas", mockCampanhas);
export const useConfig = () => useLocalStorage("crm.v4.config", defaultConfig);
