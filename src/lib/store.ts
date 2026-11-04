import { useLocalStorage } from "@/hooks/useLocalStorage";
import { defaultConfig } from "./mockData";
import type { Lead, Cliente, Tarefa, Proposta, Campanha } from "./types";

const STORAGE_VERSION = "crm_initialized_v5";

export const useLeads = () => useLocalStorage<Lead[]>(`${STORAGE_VERSION}.leads`, []);
export const useClientes = () => useLocalStorage<Cliente[]>(`${STORAGE_VERSION}.clientes`, []);
export const useTarefas = () => useLocalStorage<Tarefa[]>(`${STORAGE_VERSION}.tarefas`, []);
export const usePropostas = () => useLocalStorage<Proposta[]>(`${STORAGE_VERSION}.propostas`, []);
export const useCampanhas = () => useLocalStorage<Campanha[]>(`${STORAGE_VERSION}.campanhas`, []);
export const useConfig = () => useLocalStorage(`${STORAGE_VERSION}.config`, defaultConfig);
