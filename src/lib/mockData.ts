import type { Lead, Cliente, Tarefa, Proposta, Campanha, Configuracoes, Template, TagItem, EtapaItem } from "./types";

// Datas fixas em 2025 para garantir consistência (ISO 8601)
const D = (s: string) => new Date(s + "T12:00:00.000Z").toISOString();

export const mockLeads: Lead[] = [
  { id: "l1",  nome: "Carlos Mendes",      telefone: "11987654321", email: "carlos@email.com",     produto: "Imóvel",       valorCarta: 350000, origem: "Meta Ads",  temperatura: "Quente", etapa: "Proposta Enviada",  perfil: "Empresário",          rendaEstimada: 22000, respondeuMensagem: true, reuniaoAgendada: true,  temUrgencia: true,  ultimoContato: D("2025-05-05"), diasNaEtapa: 1, criadoEm: D("2025-05-01"), proximoFollowUp: D("2025-05-08"), proximaAcaoTipo: "Ligação" },
  { id: "l2",  nome: "Fernanda Lima",      telefone: "11912345678", email: "fernanda@email.com",   produto: "Veículo",      valorCarta: 80000,  origem: "Instagram", temperatura: "Morno",  etapa: "Contato Realizado", perfil: "Profissional Liberal", rendaEstimada: 9000,  respondeuMensagem: true,                                            ultimoContato: D("2025-05-03"), diasNaEtapa: 3, criadoEm: D("2025-04-28"), proximoFollowUp: D("2025-05-09"), proximaAcaoTipo: "WhatsApp" },
  { id: "l3",  nome: "Roberto Souza",      telefone: "11999887766", email: "roberto@email.com",    produto: "Moto",         valorCarta: 25000,  origem: "WhatsApp",  temperatura: "Frio",   etapa: "Novo Lead",         perfil: "Pessoa Física",                                                                          ultimoContato: D("2025-04-30"), diasNaEtapa: 6, criadoEm: D("2025-04-30") },
  { id: "l4",  nome: "Juliana Castro",     telefone: "11988776655", email: "juliana@email.com",    produto: "Imóvel",       valorCarta: 500000, origem: "Indicação", temperatura: "Quente", etapa: "Em Análise",        perfil: "Investidor",          rendaEstimada: 30000, respondeuMensagem: true, reuniaoAgendada: true,  temUrgencia: true,  ultimoContato: D("2025-05-05"), diasNaEtapa: 4, criadoEm: D("2025-04-22") },
  { id: "l5",  nome: "Marcos Oliveira",    telefone: "11977665544", email: "marcos@email.com",     produto: "Investimento", valorCarta: 200000, origem: "Meta Ads",  temperatura: "Quente", etapa: "Em Análise",        perfil: "Empresário",          rendaEstimada: 25000, respondeuMensagem: true, reuniaoAgendada: true,                      ultimoContato: D("2025-05-04"), diasNaEtapa: 5, criadoEm: D("2025-04-25") },
  { id: "l6",  nome: "Ana Paula Rocha",    telefone: "11966554433", email: "anapaula@email.com",   produto: "Serviço",      valorCarta: 45000,  origem: "Orgânico",  temperatura: "Morno",  etapa: "Contato Realizado", perfil: "Pessoa Física",       rendaEstimada: 5500,  respondeuMensagem: true,                                            ultimoContato: D("2025-05-02"), diasNaEtapa: 4, criadoEm: D("2025-04-29") },
  { id: "l7",  nome: "Bruno Ferreira",     telefone: "11955443322", email: "bruno@email.com",      produto: "Veículo",      valorCarta: 120000, origem: "Meta Ads",  temperatura: "Quente", etapa: "Proposta Enviada",  perfil: "Profissional Liberal", rendaEstimada: 14000, respondeuMensagem: true,                       temUrgencia: true,  ultimoContato: D("2025-05-05"), diasNaEtapa: 2, criadoEm: D("2025-04-30"), proximoFollowUp: D("2025-05-08"), proximaAcaoTipo: "Ligação" },
  { id: "l8",  nome: "Camila Santos",      telefone: "11944332211", email: "camila@email.com",     produto: "Imóvel",       valorCarta: 280000, origem: "Instagram", temperatura: "Morno",  etapa: "Novo Lead",         perfil: "Pessoa Física",                                                                          ultimoContato: D("2025-05-04"), diasNaEtapa: 2, criadoEm: D("2025-05-04") },
  { id: "l9",  nome: "Diego Alves",        telefone: "11933221100", email: "diego@email.com",      produto: "Moto",         valorCarta: 18000,  origem: "WhatsApp",  temperatura: "Frio",   etapa: "Perdido",           perfil: "Pessoa Física",                                                                          ultimoContato: D("2025-03-15"), diasNaEtapa: 20, criadoEm: D("2025-03-01") },
  { id: "l10", nome: "Elaine Gomes",       telefone: "11922110099", email: "elaine@email.com",     produto: "Imóvel",       valorCarta: 420000, origem: "Indicação", temperatura: "Quente", etapa: "Proposta Enviada",  perfil: "Investidor",          rendaEstimada: 28000, respondeuMensagem: true, reuniaoAgendada: true,  temUrgencia: true,  ultimoContato: D("2025-05-05"), diasNaEtapa: 3, criadoEm: D("2025-04-26") },
  { id: "l11", nome: "Felipe Nunes",       telefone: "11911009988", email: "felipe@email.com",     produto: "Veículo",      valorCarta: 95000,  origem: "Meta Ads",  temperatura: "Morno",  etapa: "Contato Realizado", perfil: "Empresário",          rendaEstimada: 12000, respondeuMensagem: true,                                            ultimoContato: D("2025-05-01"), diasNaEtapa: 5, criadoEm: D("2025-04-27") },
  { id: "l12", nome: "Gabriela Torres",    telefone: "11900998877", email: "gabriela@email.com",   produto: "Serviço",      valorCarta: 60000,  origem: "Instagram", temperatura: "Morno",  etapa: "Em Análise",        perfil: "Profissional Liberal", rendaEstimada: 8500,  respondeuMensagem: true, reuniaoAgendada: true,                      ultimoContato: D("2025-05-04"), diasNaEtapa: 6, criadoEm: D("2025-04-22") },
  { id: "l14", nome: "Isabela Martins",    telefone: "11977776666", email: "isabela@email.com",    produto: "Imóvel",       valorCarta: 180000, origem: "Orgânico",  temperatura: "Frio",   etapa: "Novo Lead",         perfil: "Pessoa Física",                                                                          ultimoContato: D("2025-04-28"), diasNaEtapa: 8, criadoEm: D("2025-04-28") },
  { id: "l15", nome: "João Pedro Vieira",  telefone: "11966665555", email: "joaopedro@email.com",  produto: "Outros",       valorCarta: 35000,  origem: "WhatsApp",  temperatura: "Morno",  etapa: "Contato Realizado", perfil: "Pessoa Física",       rendaEstimada: 4500,  respondeuMensagem: true,                                            ultimoContato: D("2025-05-02"), diasNaEtapa: 4, criadoEm: D("2025-04-30") },
];

const histPagamentos = (pago = 6) => {
  const meses = ["dez/24", "jan/25", "fev/25", "mar/25", "abr/25", "mai/25"];
  return meses.map((mes, i) => ({ mes, status: i < pago ? "Pago" as const : "Atrasado" as const }));
};

export const mockClientes: Cliente[] = [
  { id: "c1", nome: "Henrique Costa",  telefone: "11988887777", email: "henrique@email.com", produto: "Investimento", perfil: "Empresário",          temperatura: "Quente", valorCarta: 300000, parcelasPagas: 14, parcelasTotais: 120, contemplado: true,  contempladoEm: D("2025-05-01"), fechadoEm: D("2024-03-10"), grupo: "0412", cota: "18", parcelaMensal: 2850, statusPagamento: "Em Dia",      oportunidade: "Nenhuma",   dataAdesao: D("2024-03-10"), prazoTotal: 120, prazoRestante: 106, fase: "Contemplado",  ultimaInteracao: D("2025-05-04"), historicoPagamentos: histPagamentos(6), indicacoes: [{ id: "i1", nome: "Marcos Oliveira", status: "Lead", data: D("2025-04-25") }] },
  { id: "c2", nome: "Patricia Ramos",  telefone: "11977776666", email: "patricia@email.com", produto: "Imóvel",       perfil: "Investidor",          temperatura: "Morno",  valorCarta: 450000, parcelasPagas: 8,  parcelasTotais: 180, contemplado: false,                                  fechadoEm: D("2024-09-15"), grupo: "0387", cota: "05", parcelaMensal: 3100, statusPagamento: "Em Dia",      oportunidade: "Cross-sell", oportunidadeNotas: "Cliente demonstrou interesse em consórcio de veículo", dataAdesao: D("2024-09-15"), prazoTotal: 180, prazoRestante: 172, fase: "Cliente Ativo", ultimaInteracao: D("2025-04-28"), historicoPagamentos: histPagamentos(6), indicacoes: [] },
  { id: "c3", nome: "Thiago Barbosa",  telefone: "11966665555", email: "thiago@email.com",   produto: "Veículo",      perfil: "Pessoa Física",       temperatura: "Morno",  valorCarta: 100000, parcelasPagas: 5,  parcelasTotais: 80,  contemplado: false,                                  fechadoEm: D("2024-12-08"), grupo: "0401", cota: "22", parcelaMensal: 1620, statusPagamento: "Atenção",     oportunidade: "Nenhuma",   dataAdesao: D("2024-12-08"), prazoTotal: 80, prazoRestante: 75,  fase: "Cliente Ativo", ultimaInteracao: D("2025-04-20"), historicoPagamentos: histPagamentos(5), indicacoes: [] },
  { id: "c4", nome: "Renata Peixoto",  telefone: "11955554444", email: "renata@email.com",   produto: "Imóvel",       perfil: "Empresário",          temperatura: "Quente", valorCarta: 220000, parcelasPagas: 18, parcelasTotais: 150, contemplado: false,                                  fechadoEm: D("2023-11-12"), grupo: "0355", cota: "11", parcelaMensal: 1750, statusPagamento: "Em Dia",      oportunidade: "Upsell",    oportunidadeNotas: "Renda aumentou - elegível para carta maior",          dataAdesao: D("2023-11-12"), prazoTotal: 150, prazoRestante: 132, fase: "Cliente Ativo", ultimaInteracao: D("2025-05-03"), historicoPagamentos: histPagamentos(6), indicacoes: [{ id: "i2", nome: "Camila Santos", status: "Lead", data: D("2025-05-01") }, { id: "i3", nome: "Lucas Cardoso", status: "Cliente Ativo", data: D("2024-11-10") }] },
  { id: "c5", nome: "Lucas Cardoso",   telefone: "11944443333", email: "lucas@email.com",    produto: "Moto",         perfil: "Pessoa Física",       temperatura: "Frio",   valorCarta: 22000,  parcelasPagas: 6,  parcelasTotais: 60,  contemplado: false,                                  fechadoEm: D("2024-11-10"), grupo: "0398", cota: "33", parcelaMensal: 480,  statusPagamento: "Inadimplente", oportunidade: "Nenhuma",  dataAdesao: D("2024-11-10"), prazoTotal: 60, prazoRestante: 54, fase: "Cliente Ativo", ultimaInteracao: D("2025-04-15"), historicoPagamentos: histPagamentos(4), indicacoes: [] },
];

export const mockTarefas: Tarefa[] = [
  { id: "t1", titulo: "Ligar para Carlos sobre simulação", tipo: "Ligação",  cliente: "Carlos Mendes",  leadId: "l1", data: D("2025-05-08"), concluida: false, prioridade: "Alta" },
  { id: "t2", titulo: "Enviar proposta para Bruno",        tipo: "WhatsApp", cliente: "Bruno Ferreira", leadId: "l7", data: D("2025-05-08"), concluida: false, prioridade: "Alta" },
  { id: "t3", titulo: "Reunião com Juliana",               tipo: "Reunião",  cliente: "Juliana Castro", leadId: "l4", data: D("2025-05-09"), concluida: false, prioridade: "Alta" },
  { id: "t4", titulo: "Follow-up Fernanda",                tipo: "WhatsApp", cliente: "Fernanda Lima",  leadId: "l2", data: D("2025-05-12"), concluida: false, prioridade: "Média" },
  { id: "t5", titulo: "Cobrar parcela atrasada",           tipo: "Ligação",  cliente: "Lucas Cardoso",  clienteId: "c5", data: D("2025-05-15"), concluida: false, prioridade: "Alta" },
];

export const mockPropostas: Proposta[] = [
  { id: "p1", leadId: "l1",  leadNome: "Carlos Mendes",   produto: "Imóvel",  valorCarta: 350000, prazoMeses: 180, parcela: 2400, status: "Enviada",  criadaEm: D("2025-05-02"), comissaoEstimada: 5250 },
  { id: "p2", leadId: "l7",  leadNome: "Bruno Ferreira",  produto: "Veículo", valorCarta: 120000, prazoMeses: 80,  parcela: 1820, status: "Enviada",  criadaEm: D("2025-05-04"), comissaoEstimada: 1800 },
  { id: "p3", leadId: "l4",  leadNome: "Juliana Castro",  produto: "Imóvel",  valorCarta: 500000, prazoMeses: 200, parcela: 3200, status: "Aprovada", criadaEm: D("2025-04-28"), comissaoEstimada: 7500 },
  { id: "p4", leadId: "l10", leadNome: "Elaine Gomes",    produto: "Imóvel",  valorCarta: 420000, prazoMeses: 180, parcela: 2950, status: "Em Análise", criadaEm: D("2025-05-03"), comissaoEstimada: 6300 },
];

export const mockCampanhas: Campanha[] = [
  { id: "ca1", nome: "Imóvel dos Sonhos - Maio",          canal: "Meta Ads",           investimento: 1200, leadsGerados: 34, vendas: 4, receita: 18000, inicio: D("2025-04-15"), ativa: true, utm: "imovel_maio_25" },
  { id: "ca2", nome: "Consórcio de Veículos - Instagram", canal: "Instagram",          investimento: 600,  leadsGerados: 18, vendas: 2, receita: 4800,  inicio: D("2025-04-01"), ativa: true, utm: "veiculo_ig" },
  { id: "ca3", nome: "Broadcast WhatsApp - Indicações",   canal: "WhatsApp Broadcast", investimento: 0,    leadsGerados: 12, vendas: 3, receita: 9000,  inicio: D("2025-03-20"), ativa: true, utm: "wa_indicacao" },
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
