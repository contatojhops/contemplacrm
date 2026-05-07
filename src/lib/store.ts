import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  mockLeads,
  mockClientes,
  mockTarefas,
  mockPropostas,
  mockCampanhas,
  defaultConfig,
} from "./mockData";

// v2: bump key prefix to invalidate stale 1969/1970 timestamps from previous builds
export const useLeads = () => useLocalStorage("crm.v2.leads", mockLeads);
export const useClientes = () => useLocalStorage("crm.v2.clientes", mockClientes);
export const useTarefas = () => useLocalStorage("crm.v2.tarefas", mockTarefas);
export const usePropostas = () => useLocalStorage("crm.v2.propostas", mockPropostas);
export const useCampanhas = () => useLocalStorage("crm.v2.campanhas", mockCampanhas);
export const useConfig = () => useLocalStorage("crm.v2.config", defaultConfig);
