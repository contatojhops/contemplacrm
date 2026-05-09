import type { Lead, Cliente, Tarefa, Proposta, Campanha, Configuracoes, Template, TagItem, EtapaItem } from "./types";

const initialLeads = [
  { id: "lead_l1", nome: "Carlos Mendes", telefone: "5511987654321", email: "carlos@email.com", produto: "Imóvel", valorCarta: 350000, origem: "Meta Ads", temperatura: "Quente", perfil: "Empresário", fase: "Lead", etapa: "Proposta Enviada", score: 85, rendaEstimada: 15000, createdAt: "2026-05-01", lastContactDate: "2026-05-05", cidade: "São Paulo", estado: "SP" },
  { id: "lead_l2", nome: "Fernanda Lima", telefone: "5511976543210", email: "fernanda@email.com", produto: "Veículo", valorCarta: 80000, origem: "Instagram", temperatura: "Morno", perfil: "Profissional Liberal", fase: "Lead", etapa: "Contato Realizado", score: 55, rendaEstimada: 8000, createdAt: "2026-04-28", lastContactDate: "2026-05-03", cidade: "São Paulo", estado: "SP" },
  { id: "lead_l3", nome: "Roberto Souza", telefone: "5511999887766", email: "roberto@email.com", produto: "Moto", valorCarta: 25000, origem: "WhatsApp", temperatura: "Frio", perfil: "Pessoa Física", fase: "Lead", etapa: "Novo Lead", score: 10, rendaEstimada: null, createdAt: "2026-04-20", lastContactDate: "2026-04-30", cidade: "Guarulhos", estado: "SP" },
  { id: "lead_l4", nome: "Juliana Castro", telefone: "5511988776655", email: "juliana@email.com", produto: "Imóvel", valorCarta: 500000, origem: "Indicação", temperatura: "Quente", perfil: "Investidor", fase: "Lead", etapa: "Em Análise", score: 90, rendaEstimada: 25000, createdAt: "2026-05-02", lastContactDate: "2026-05-05", cidade: "São Paulo", estado: "SP" },
  { id: "lead_l5", nome: "Marcos Oliveira", telefone: "5511977665544", email: "marcos@email.com", produto: "Investimento", valorCarta: 200000, origem: "Meta Ads", temperatura: "Quente", perfil: "Empresário", fase: "Lead", etapa: "Em Análise", score: 78, rendaEstimada: 20000, createdAt: "2026-04-25", lastContactDate: "2026-04-30", cidade: "Campinas", estado: "SP" },
  { id: "lead_l6", nome: "Ana Paula Rocha", telefone: "5511966554433", email: "anapaula@email.com", produto: "Serviço", valorCarta: 45000, origem: "Orgânico", temperatura: "Morno", perfil: "Pessoa Física", fase: "Lead", etapa: "Contato Realizado", score: 45, rendaEstimada: 5000, createdAt: "2026-04-22", lastContactDate: "2026-05-02", cidade: "São Paulo", estado: "SP" },
  { id: "lead_l7", nome: "Bruno Ferreira", telefone: "5511955443322", email: "bruno@email.com", produto: "Veículo", valorCarta: 120000, origem: "Meta Ads", temperatura: "Quente", perfil: "Profissional Liberal", fase: "Lead", etapa: "Proposta Enviada", score: 80, rendaEstimada: 12000, createdAt: "2026-05-03", lastContactDate: "2026-05-05", cidade: "São Paulo", estado: "SP" },
  { id: "lead_l8", nome: "Camila Santos", telefone: "5511944332211", email: "camila@email.com", produto: "Imóvel", valorCarta: 280000, origem: "Instagram", temperatura: "Morno", perfil: "Pessoa Física", fase: "Lead", etapa: "Novo Lead", score: 40, rendaEstimada: 9000, createdAt: "2026-05-04", lastContactDate: "2026-05-04", cidade: "São Paulo", estado: "SP" },
  { id: "lead_l9", nome: "Diego Alves", telefone: "5511933221100", email: "diego@email.com", produto: "Moto", valorCarta: 18000, origem: "WhatsApp", temperatura: "Frio", perfil: "Pessoa Física", fase: "Lead", etapa: "Perdido", score: 0, rendaEstimada: null, createdAt: "2026-04-01", lastContactDate: "2026-04-10", cidade: "Osasco", estado: "SP" },
  { id: "lead_l10", nome: "Elaine Gomes", telefone: "5511922110099", email: "elaine@email.com", produto: "Imóvel", valorCarta: 420000, origem: "Indicação", temperatura: "Quente", perfil: "Investidor", fase: "Lead", etapa: "Proposta Enviada", score: 88, rendaEstimada: 22000, createdAt: "2026-05-01", lastContactDate: "2026-05-05", cidade: "São Paulo", estado: "SP" },
  { id: "lead_l11", nome: "Felipe Nunes", telefone: "5511911009988", email: "felipe@email.com", produto: "Veículo", valorCarta: 95000, origem: "Meta Ads", temperatura: "Morno", perfil: "Empresário", fase: "Lead", etapa: "Contato Realizado", score: 52, rendaEstimada: 10000, createdAt: "2026-04-27", lastContactDate: "2026-05-01", cidade: "São Paulo", estado: "SP" },
  { id: "lead_l12", nome: "Gabriela Torres", telefone: "5511900998877", email: "gabriela@email.com", produto: "Serviço", valorCarta: 60000, origem: "Instagram", temperatura: "Morno", perfil: "Profissional Liberal", fase: "Lead", etapa: "Em Análise", score: 63, rendaEstimada: 7000, createdAt: "2026-04-26", lastContactDate: "2026-04-30", cidade: "São Paulo", estado: "SP" },
  { id: "lead_l14", nome: "Isabela Martins", telefone: "5511977776666", email: "isabela@email.com", produto: "Imóvel", valorCarta: 180000, origem: "Orgânico", temperatura: "Frio", perfil: "Pessoa Física", fase: "Lead", etapa: "Novo Lead", score: 10, rendaEstimada: null, createdAt: "2026-04-18", lastContactDate: "2026-04-25", cidade: "São Paulo", estado: "SP" },
  { id: "lead_l15", nome: "João Pedro Vieira", telefone: "5511966665555", email: "joaopedro@email.com", produto: "Outros bens móveis", valorCarta: 35000, origem: "WhatsApp", temperatura: "Morno", perfil: "Pessoa Física", fase: "Lead", etapa: "Contato Realizado", score: 38, rendaEstimada: 4500, createdAt: "2026-04-24", lastContactDate: "2026-04-28", cidade: "São Paulo", estado: "SP" }
];

export const mockLeads: Lead[] = initialLeads.map((lead) => ({
  ...lead,
  produto: lead.produto === "Outros bens móveis" ? "Outros" : lead.produto,
  rendaEstimada: lead.rendaEstimada ?? undefined,
  ultimoContato: lead.lastContactDate,
  diasNaEtapa: 0,
  criadoEm: lead.createdAt,
})) as Lead[];

const histPagamentos = (pago = 6) => {
  const meses = ["dez/25", "jan/26", "fev/26", "mar/26", "abr/26", "mai/26"];
  return meses.map((mes, i) => ({ mes, status: i < pago ? "Pago" as const : "Atrasado" as const }));
};

const initialActiveClients = [
  { id: "c1", nome: "Henrique Costa", telefone: "5511912345678", email: "henrique@email.com", produto: "Investimento", valorCarta: 300000, perfil: "Empresário", temperatura: "Quente", fase: "Contemplado", grupo: "0412", cota: "18", parcela: 2100, statusPagamento: "Em Dia", contemplado: true, contemplationDate: "2026-05-01", adhesionDate: "2026-01-10", lastContactDate: "2026-05-01", prazoTotal: 180, prazoRestante: 162, oportunidade: null },
  { id: "c2", nome: "Patricia Ramos", telefone: "5511923456789", email: "patricia@email.com", produto: "Imóvel", valorCarta: 450000, perfil: "Investidor", temperatura: "Quente", fase: "Cliente Ativo", grupo: "0387", cota: "05", parcela: 3200, statusPagamento: "Em Dia", contemplado: false, contemplationDate: null, adhesionDate: "2025-11-05", lastContactDate: "2026-05-03", prazoTotal: 200, prazoRestante: 143, oportunidade: "Cross-sell" },
  { id: "c3", nome: "Thiago Barbosa", telefone: "5511934567890", email: "thiago@email.com", produto: "Veículo", valorCarta: 100000, perfil: "Pessoa Física", temperatura: "Morno", fase: "Cliente Ativo", grupo: "0401", cota: "22", parcela: 1400, statusPagamento: "Atenção", contemplado: false, contemplationDate: null, adhesionDate: "2025-12-01", lastContactDate: "2026-04-28", prazoTotal: 84, prazoRestante: 66, oportunidade: null },
  { id: "c4", nome: "Renata Peixoto", telefone: "5511945678901", email: "renata@email.com", produto: "Imóvel", valorCarta: 220000, perfil: "Empresário", temperatura: "Morno", fase: "Cliente Ativo", grupo: "0355", cota: "11", parcela: 1800, statusPagamento: "Em Dia", contemplado: false, contemplationDate: null, adhesionDate: "2025-10-15", lastContactDate: "2026-05-02", prazoTotal: 150, prazoRestante: 119, oportunidade: "Upsell" },
  { id: "c5", nome: "Lucas Cardoso", telefone: "5511956789012", email: "lucas@email.com", produto: "Moto", valorCarta: 22000, perfil: "Pessoa Física", temperatura: "Frio", fase: "Cliente Ativo", grupo: "0398", cota: "33", parcela: 520, statusPagamento: "Inadimplente", contemplado: false, contemplationDate: null, adhesionDate: "2026-02-20", lastContactDate: "2026-04-20", prazoTotal: 60, prazoRestante: 50, oportunidade: null }
];

export const mockClientes: Cliente[] = initialActiveClients.map((client) => ({
  ...client,
  parcelasPagas: 0,
  parcelasTotais: client.prazoTotal,
  contempladoEm: client.contemplationDate ?? undefined,
  fechadoEm: client.adhesionDate,
  parcelaMensal: client.parcela,
  oportunidade: client.oportunidade ?? "Nenhuma",
  dataAdesao: client.adhesionDate,
  ultimaInteracao: client.lastContactDate,
  historicoPagamentos: histPagamentos(client.statusPagamento === "Inadimplente" ? 4 : 6),
  indicacoes: [],
})) as Cliente[];

export const mockTarefas: Tarefa[] = [
  { id: "t1", titulo: "Ligar para Carlos sobre simulação", tipo: "Ligação",  cliente: "Carlos Mendes",  leadId: "l1", data: "2026-05-08", concluida: false, prioridade: "Alta" },
  { id: "t2", titulo: "Enviar proposta para Bruno",        tipo: "WhatsApp", cliente: "Bruno Ferreira", leadId: "l7", data: "2026-05-08", concluida: false, prioridade: "Alta" },
  { id: "t3", titulo: "Reunião com Juliana",               tipo: "Reunião",  cliente: "Juliana Castro", leadId: "l4", data: "2026-05-09", concluida: false, prioridade: "Alta" },
  { id: "t4", titulo: "Follow-up Fernanda",                tipo: "WhatsApp", cliente: "Fernanda Lima",  leadId: "l2", data: "2026-05-10", concluida: false, prioridade: "Média" },
  { id: "t5", titulo: "Cobrar parcela atrasada",           tipo: "Ligação",  cliente: "Lucas Cardoso",  clienteId: "c5", data: "2026-05-07", concluida: false, prioridade: "Alta" },
];

export const mockPropostas: Proposta[] = [
  { id: "p1", leadId: "l1",  leadNome: "Carlos Mendes",   produto: "Imóvel",  valorCarta: 350000, prazoMeses: 180, parcela: 2400, status: "Enviada",  criadaEm: "2026-05-01", comissaoEstimada: 5250 },
  { id: "p2", leadId: "l7",  leadNome: "Bruno Ferreira",  produto: "Veículo", valorCarta: 120000, prazoMeses: 80,  parcela: 1820, status: "Enviada",  criadaEm: "2026-05-03", comissaoEstimada: 1800 },
  { id: "p3", leadId: "l4",  leadNome: "Juliana Castro",  produto: "Imóvel",  valorCarta: 500000, prazoMeses: 200, parcela: 3200, status: "Aprovada", criadaEm: "2026-04-28", comissaoEstimada: 7500 },
  { id: "p4", leadId: "l10", leadNome: "Elaine Gomes",    produto: "Imóvel",  valorCarta: 420000, prazoMeses: 180, parcela: 2950, status: "Em Análise", criadaEm: "2026-05-02", comissaoEstimada: 6300 },
];

export const mockCampanhas: Campanha[] = [
  { id: "ca1", nome: "Imóvel dos Sonhos - Maio",          canal: "Meta Ads",           investimento: 1200, leadsGerados: 34, vendas: 4, receita: 18000, inicio: "2026-04-01", fim: "2026-04-30", ativa: true, utm: "imovel_maio_26" },
  { id: "ca2", nome: "Consórcio de Veículos - Instagram", canal: "Instagram",          investimento: 600,  leadsGerados: 18, vendas: 2, receita: 4800,  inicio: "2026-04-15", fim: "2026-05-05", ativa: true, utm: "veiculo_ig" },
  { id: "ca3", nome: "Broadcast WhatsApp - Indicações",   canal: "WhatsApp Broadcast", investimento: 0,    leadsGerados: 12, vendas: 3, receita: 9000,  inicio: "2026-05-01", fim: "2026-05-31", ativa: true, utm: "wa_indicacao" },
];

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
  metaMensal: 1500000,
  metaUnidades: 8,
  consultorNome: "João Silva",
  consultorEmail: "joao@consorcio.com",
  consultorTelefone: "11999998888",
  consultorCargo: "Consultor de Consórcio",
  whatsappNumero: "5511999998888",
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
