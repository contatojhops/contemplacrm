import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  mockLeads,
  mockClientes,
  mockTarefas,
  mockPropostas,
  mockCampanhas,
  defaultConfig,
} from "./mockData";

// crm_initialized_v4: invalidate stale cached mock data (current date is May 2026)
export const useLeads = () => useLocalStorage("crm_initialized_v4.leads", mockLeads);
export const useClientes = () => useLocalStorage("crm_initialized_v4.clientes", mockClientes);
export const useTarefas = () => useLocalStorage("crm_initialized_v4.tarefas", mockTarefas);
export const usePropostas = () => useLocalStorage("crm_initialized_v4.propostas", mockPropostas);
export const useCampanhas = () => useLocalStorage("crm_initialized_v4.campanhas", mockCampanhas);
export const useConfig = () => useLocalStorage("crm_initialized_v4.config", defaultConfig);
