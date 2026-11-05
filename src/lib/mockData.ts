import type { Lead, Cliente, Tarefa, Proposta, Campanha, Configuracoes, Template, TagItem, EtapaItem } from "./types";

export const mockLeads: Lead[] = [];
export const mockClientes: Cliente[] = [];
export const mockTarefas: Tarefa[] = [];
export const mockPropostas: Proposta[] = [];
export const mockCampanhas: Campanha[] = [];

export const defaultEtapas: EtapaItem[] = [
  { id: "e1", nome: "Novo Lead" },
  { id: "e2", nome: "Contato Realizado" },
  { id: "e3", nome: "Proposta Enviada" },
  { id: "e4", nome: "Em Análise" },
  { id: "e5", nome: "Fechado", fixa: true },
  { id: "e6", nome: "Perdido", fixa: true },
];

export const defaultTags: TagItem[] = [
  { id: "tg1", nome: "VIP", cor: "#f59e0b" },
  { id: "tg2", nome: "Indicação", cor: "#10b981" },
  { id: "tg3", nome: "Reativação", cor: "#3b82f6" },
  { id: "tg4", nome: "Urgente", cor: "#ef4444" },
];

export const defaultTemplates: Template[] = [
  { id: "tp1", nome: "Boas-vindas WhatsApp", canal: "WhatsApp", texto: "Olá {nome}! Sou consultor de consórcio e vi seu interesse em {produto}. Posso enviar uma simulação personalizada?" },
  { id: "tp2", nome: "Follow-up Proposta", canal: "WhatsApp", texto: "Oi {nome}, tudo bem? Conseguiu analisar a proposta de {produto} no valor de R$ {valor_carta}? A parcela ficou em R$ {parcela}." },
  { id: "tp3", nome: "Convite Reunião", canal: "Instagram", texto: "{nome}, podemos marcar uma conversa rápida sobre o consórcio de {produto}? Tenho condições especiais pra você." },
];

export const defaultConfig: Configuracoes = {
  metaMensal: 0,
  metaUnidades: 0,
  consultorNome: "",
  consultorEmail: "",
  consultorTelefone: "",
  consultorCargo: "",
  whatsappNumero: "",
  taxaAdmin: 18,
  fundoReserva: 1,
  comissao: 1.5,
  valorSeguroDefault: 35,
  etapas: defaultEtapas,
  produtosAtivos: [
    { nome: "Imóvel", ativo: true },
    { nome: "Veículo", ativo: true },
    { nome: "Moto", ativo: true },
    { nome: "Serviço", ativo: true },
    { nome: "Investimento", ativo: true },
    { nome: "Outros", ativo: true },
  ],
  origens: ["Meta Ads", "Instagram", "WhatsApp", "Indicação", "Orgânico", "Outros"],
  tags: defaultTags,
  templates: defaultTemplates,
  darkMode: false,
};
