export type Produto = string;
export interface LeadProduto {
  produto: Produto;
  quantidade: number;
  valorUnitario: number;
}
export type Origem = string;
export type Etapa = string;

export type ClientePerfil = "Pessoa Física" | "Profissional Liberal" | "Empresário" | "Investidor";
export type ClienteFase = "Lead" | "Recuperação" | "Cliente Ativo" | "Contemplado";

export interface Lead {
  id: string;
  pipeline_id: string;
  nome: string;
  telefone: string;
  email: string;
  produto: Produto;
  valorCarta: number;
  produtos?: LeadProduto[];
  origem: Origem;
  etapa: Etapa;
  perfil?: string;
  observacoes?: string;
  rendaEstimada?: number;
  respondeuMensagem?: boolean;
  reuniaoAgendada?: boolean;
  temUrgencia?: boolean;
  ultimoContato: string;
  proximoFollowUp?: string;
  proximaAcaoTipo?: string;
  diasNaEtapa: number;
  criadoEm: string;
  stage_changed_at?: string;
  historicoEtapas?: { id: string; etapaAnterior: string; etapaNova: string; data: string; atividadeRegistrada: boolean }[];
  closed_at?: string;
  motivoPerda?: string;
  detalhesCliente?: Partial<Cliente>;
}

export type InteracaoTipo = "WhatsApp" | "Ligação" | "Reunião" | "Instagram DM" | "E-mail" | "Presencial";
export type InteracaoResultado = "Positivo" | "Neutro" | "Negativo";

export interface Interacao {
  id: string;
  tipo: InteracaoTipo;
  data: string;
  duracao?: number;
  resumo: string;
  resultado: InteracaoResultado;
  objecoes?: string[];
}

export interface ObjecaoRegistrada {
  id: string;
  texto: string;
  resposta: string;
  data: string;
}

export interface Documento {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  data: string;
  base64: string;
}

export interface ProximaAcao {
  id?: string;
  data: string;
  hora?: string;
  tipo: string;
  descricao: string;
}

export interface AcaoConcluida {
  id?: string;
  data: string;
  tipo: string;
  descricao: string;
}

export type StatusPagamento = "Em Dia" | "Atenção" | "Inadimplente";
export type Oportunidade = "Upsell" | "Cross-sell" | "Nenhuma";

export interface Indicacao {
  id: string;
  nome: string;
  status: "Lead" | "Cliente Ativo" | "Não convertido";
  data: string;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  produto: Produto;
  valorCarta: number;
  produtos?: LeadProduto[];
  parcelasPagas: number;
  parcelasTotais: number;
  contemplado: boolean;
  dataEntrada?: string;
  fechadoEm: string;
  grupo?: string;
  cota?: string;
  parcelaMensal?: number;
  statusPagamento?: StatusPagamento;
  oportunidade?: Oportunidade;
  oportunidadeNotas?: string;
  contempladoEm?: string;
  dataAdesao?: string;
  prazoTotal?: number;
  prazoRestante?: number;
  historicoPagamentos?: { mes: string; status: "Pago" | "Atrasado" | "Faltou" }[];
  indicacoes?: Indicacao[];
  // estendidos
  cpf?: string;
  dataNascimento?: string;
  profissao?: string;
  rendaEstimada?: number;
  cidade?: string;
  estado?: string;
  origem?: Origem;
  perfil?: ClientePerfil;
  fase?: ClienteFase;
  tags?: string[];
  ultimaInteracao?: string;
  prazoMeses?: number;
  parcelaEstimada?: number;
  observacoesProduto?: string;
  interacoes?: Interacao[];
  objecoes?: ObjecaoRegistrada[];
  documentos?: Documento[];
  proximaAcao?: ProximaAcao;
  acoesConcluidas?: AcaoConcluida[];
  objetivo?: string;
  capacidadeMensal?: number;
  temperatura?: "Frio" | "Morno" | "Quente";
  atualizacoes?: string;
  historicoAtualizacoes?: { id: string; texto: string; data: string }[];
}

export type TarefaTipo = "Ligação" | "WhatsApp" | "Reunião" | "E-mail" | "Visita" | "Follow-up" | "Enviar Proposta" | "Recontato" | "Outro";
export type TarefaPrioridade = "Alta" | "Média" | "Baixa";

export interface Tarefa {
  id: string;
  lead_id: string;
  titulo: string;
  tipo: TarefaTipo;
  cliente: string;
  clienteId?: string;
  leadId?: string;
  data: string;
  concluida: boolean;
  prioridade?: TarefaPrioridade;
  descricao?: string;
  lembrete?: boolean;
  proximaAcaoId?: string;
}

export type PipelineCor = "azul" | "verde" | "amarelo" | "vermelho" | "roxo";
export interface Pipeline {
  id: string;
  nome: string;
  descricao?: string;
  cor: PipelineCor;
  ordem: number;
  arquivada: boolean;
  created_at: string;
}

export type PropostaStatus = "Rascunho" | "Enviada" | "Em Análise" | "Aprovada" | "Recusada";

export interface Proposta {
  id: string;
  leadId: string;
  leadNome: string;
  produto: Produto;
  valorCarta: number;
  prazoMeses: number;
  parcela: number;
  status: PropostaStatus;
  criadaEm: string;
  taxaAdmin?: number;
  fundoReserva?: number;
  seguro?: boolean;
  valorSeguro?: number;
  comissaoEstimada?: number;
  observacoes?: string;
  clienteId?: string;
}

export type CanalCampanha = "Meta Ads" | "Instagram" | "WhatsApp Broadcast" | "Orgânico" | "Indicação" | "Outro";

export interface Campanha {
  id: string;
  nome: string;
  canal: CanalCampanha;
  investimento: number;
  leadsGerados: number;
  vendas: number;
  receita?: number;
  inicio: string;
  fim?: string;
  ativa: boolean;
  utm?: string;
  observacoes?: string;
}

export interface Template {
  id: string;
  nome: string;
  canal: "WhatsApp" | "Instagram";
  texto: string;
}

export interface TagItem {
  id: string;
  nome: string;
  cor: string;
}

export interface EtapaItem {
  id: string;
  nome: string;
  fixa?: boolean;
}

export interface Configuracoes {
  metaMensal: number;
  metaUnidades?: number;
  consultorNome: string;
  consultorEmail: string;
  consultorTelefone?: string;
  consultorCargo?: string;
  consultorFoto?: string;
  whatsappNumero: string;
  taxaAdmin: number;
  fundoReserva: number;
  comissao: number;
  valorSeguroDefault: number;
  simuladorProdutos?: { produto: string; taxaAdmin: number; fundoReserva: number; comissao: number; valorSeguro: number }[];
  etapas?: EtapaItem[];
  produtosAtivos?: { nome: string; ativo: boolean; aliases?: string[] }[];
  origens?: string[];
  tags?: TagItem[];
  templates?: Template[];
  darkMode?: boolean;
}
