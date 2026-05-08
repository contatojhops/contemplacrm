import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  mockLeads,
  mockClientes,
  mockTarefas,
  mockPropostas,
  mockCampanhas,
  defaultConfig,
} from "./mockData";

const STORAGE_VERSION = "crm_initialized_v4";

export const useLeads = () => useLocalStorage(`${STORAGE_VERSION}.leads`, mockLeads);
export const useClientes = () => useLocalStorage(`${STORAGE_VERSION}.clientes`, mockClientes);
export const useTarefas = () => useLocalStorage(`${STORAGE_VERSION}.tarefas`, mockTarefas);
export const usePropostas = () => useLocalStorage(`${STORAGE_VERSION}.propostas`, mockPropostas);
export const useCampanhas = () => useLocalStorage(`${STORAGE_VERSION}.campanhas`, mockCampanhas);
export const useConfig = () => useLocalStorage(`${STORAGE_VERSION}.config`, defaultConfig);
