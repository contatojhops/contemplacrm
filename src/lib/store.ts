import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  mockLeads,
  mockClientes,
  mockTarefas,
  mockPropostas,
  mockCampanhas,
  defaultConfig,
} from "./mockData";

// v3: bump key prefix to invalidate stale 2025 mock data (current date is May 2026)
export const useLeads = () => useLocalStorage("crm.v3.leads", mockLeads);
export const useClientes = () => useLocalStorage("crm.v3.clientes", mockClientes);
export const useTarefas = () => useLocalStorage("crm.v3.tarefas", mockTarefas);
export const usePropostas = () => useLocalStorage("crm.v3.propostas", mockPropostas);
export const useCampanhas = () => useLocalStorage("crm.v3.campanhas", mockCampanhas);
export const useConfig = () => useLocalStorage("crm.v3.config", defaultConfig);
