export type Produto = "Imóvel" | "Veículo" | "Serviço" | "Moto" | "Investimento" | "Outros";
export type Origem = "Meta Ads" | "Instagram" | "WhatsApp" | "Indicação" | "Orgânico" | "Outros";
export type Temperatura = "Frio" | "Morno" | "Quente";
export type Etapa =
  | "Novo Lead"
  | "Contato Realizado"
  | "Proposta Enviada"
  | "Em Análise"
  | "Fechado"
  | "Perdido";

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  produto: Produto;
  valorCarta: number;
  origem: Origem;
  temperatura: Temperatura;
  etapa: Etapa;
  perfil?: string;
  observacoes?: string;
  rendaEstimada?: number;
  respondeuMensagem?: boolean;
  reuniaoAgendada?: boolean;
  temUrgencia?: boolean;
  ultimoContato: string; // ISO
  proximoFollowUp?: string; // ISO
  proximaAcaoTipo?: string;
  diasNaEtapa: number;
  criadoEm: string;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  produto: Produto;
  valorCarta: number;
  parcelasPagas: number;
  parcelasTotais: number;
  contemplado: boolean;
  fechadoEm: string;
}

export interface Tarefa {
  id: string;
  titulo: string;
  tipo: "Ligação" | "WhatsApp" | "Reunião" | "E-mail" | "Visita";
  cliente: string;
  leadId?: string;
  data: string; // ISO
  concluida: boolean;
}

export interface Proposta {
  id: string;
  leadId: string;
  leadNome: string;
  produto: Produto;
  valorCarta: number;
  prazoMeses: number;
  parcela: number;
  status: "Rascunho" | "Enviada" | "Aceita" | "Recusada";
  criadaEm: string;
}

export interface Campanha {
  id: string;
  nome: string;
  canal: Origem;
  investimento: number;
  leadsGerados: number;
  vendas: number;
  inicio: string;
  fim?: string;
  ativa: boolean;
}

export interface Configuracoes {
  metaMensal: number;
  consultorNome: string;
  consultorEmail: string;
  whatsappNumero: string;
}
