import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  mockLeads,
  mockClientes,
  mockTarefas,
  mockPropostas,
  mockCampanhas,
  defaultConfig,
} from "./mockData";

export const useLeads = () => useLocalStorage("crm.leads", mockLeads);
export const useClientes = () => useLocalStorage("crm.clientes", mockClientes);
export const useTarefas = () => useLocalStorage("crm.tarefas", mockTarefas);
export const usePropostas = () => useLocalStorage("crm.propostas", mockPropostas);
export const useCampanhas = () => useLocalStorage("crm.campanhas", mockCampanhas);
export const useConfig = () => useLocalStorage("crm.config", defaultConfig);
