import type { Lead, Cliente, Tarefa, Proposta, Campanha, Configuracoes, Template, TagItem, EtapaItem } from "./types";

const now = Date.now();
const day = 86400000;
const iso = (d: number) => new Date(d).toISOString();

export const mockLeads: Lead[] = [
  { id: "l1", nome: "Carlos Mendes", telefone: "11987654321", email: "carlos@email.com", produto: "Imóvel", valorCarta: 350000, origem: "Meta Ads", temperatura: "Quente", etapa: "Proposta Enviada", perfil: "Empresário", rendaEstimada: 22000, respondeuMensagem: true, reuniaoAgendada: true, temUrgencia: true, ultimoContato: iso(now - 1*day), diasNaEtapa: 1, criadoEm: iso(now - 8*day), proximoFollowUp: iso(now + 1*day), proximaAcaoTipo: "Ligação" },
  { id: "l2", nome: "Fernanda Lima", telefone: "11912345678", email: "fernanda@email.com", produto: "Veículo", valorCarta: 80000, origem: "Instagram", temperatura: "Morno", etapa: "Contato Realizado", perfil: "Profissional Liberal", rendaEstimada: 9000, respondeuMensagem: true, ultimoContato: iso(now - 3*day), diasNaEtapa: 3, criadoEm: iso(now - 5*day), proximoFollowUp: iso(now + 2*day), proximaAcaoTipo: "WhatsApp" },
  { id: "l3", nome: "Roberto Souza", telefone: "11999887766", email: "roberto@email.com", produto: "Moto", valorCarta: 25000, origem: "WhatsApp", temperatura: "Frio", etapa: "Novo Lead", perfil: "Pessoa Física", ultimoContato: iso(now - 6*day), diasNaEtapa: 6, criadoEm: iso(now - 6*day) },
  { id: "l4", nome: "Juliana Castro", telefone: "11988776655", email: "juliana@email.com", produto: "Imóvel", valorCarta: 500000, origem: "Indicação", temperatura: "Quente", etapa: "Em Análise", perfil: "Investidor", rendaEstimada: 30000, respondeuMensagem: true, reuniaoAgendada: true, temUrgencia: true, ultimoContato: iso(now - 1*day), diasNaEtapa: 4, criadoEm: iso(now - 15*day) },
  { id: "l5", nome: "Marcos Oliveira", telefone: "11977665544", email: "marcos@email.com", produto: "Investimento", valorCarta: 200000, origem: "Meta Ads", temperatura: "Quente", etapa: "Em Análise", perfil: "Empresário", rendaEstimada: 25000, respondeuMensagem: true, reuniaoAgendada: true, ultimoContato: iso(now - 2*day), diasNaEtapa: 5, criadoEm: iso(now - 12*day) },
  { id: "l6", nome: "Ana Paula Rocha", telefone: "11966554433", email: "anapaula@email.com", produto: "Serviço", valorCarta: 45000, origem: "Orgânico", temperatura: "Morno", etapa: "Contato Realizado", perfil: "Pessoa Física", rendaEstimada: 5500, respondeuMensagem: true, ultimoContato: iso(now - 4*day), diasNaEtapa: 4, criadoEm: iso(now - 7*day) },
  { id: "l7", nome: "Bruno Ferreira", telefone: "11955443322", email: "bruno@email.com", produto: "Veículo", valorCarta: 120000, origem: "Meta Ads", temperatura: "Quente", etapa: "Proposta Enviada", perfil: "Profissional Liberal", rendaEstimada: 14000, respondeuMensagem: true, temUrgencia: true, ultimoContato: iso(now - 1*day), diasNaEtapa: 2, criadoEm: iso(now - 6*day), proximoFollowUp: iso(now + 1*day), proximaAcaoTipo: "Ligação" },
  { id: "l8", nome: "Camila Santos", telefone: "11944332211", email: "camila@email.com", produto: "Imóvel", valorCarta: 280000, origem: "Instagram", temperatura: "Morno", etapa: "Novo Lead", perfil: "Pessoa Física", ultimoContato: iso(now - 2*day), diasNaEtapa: 2, criadoEm: iso(now - 2*day) },
  { id: "l9", nome: "Diego Alves", telefone: "11933221100", email: "diego@email.com", produto: "Moto", valorCarta: 18000, origem: "WhatsApp", temperatura: "Frio", etapa: "Perdido", perfil: "Pessoa Física", ultimoContato: iso(now - 30*day), diasNaEtapa: 20, criadoEm: iso(now - 45*day) },
  { id: "l10", nome: "Elaine Gomes", telefone: "11922110099", email: "elaine@email.com", produto: "Imóvel", valorCarta: 420000, origem: "Indicação", temperatura: "Quente", etapa: "Proposta Enviada", perfil: "Investidor", rendaEstimada: 28000, respondeuMensagem: true, reuniaoAgendada: true, temUrgencia: true, ultimoContato: iso(now - 1*day), diasNaEtapa: 3, criadoEm: iso(now - 10*day) },
  { id: "l11", nome: "Felipe Nunes", telefone: "11911009988", email: "felipe@email.com", produto: "Veículo", valorCarta: 95000, origem: "Meta Ads", temperatura: "Morno", etapa: "Contato Realizado", perfil: "Empresário", rendaEstimada: 12000, respondeuMensagem: true, ultimoContato: iso(now - 5*day), diasNaEtapa: 5, criadoEm: iso(now - 9*day) },
  { id: "l12", nome: "Gabriela Torres", telefone: "11900998877", email: "gabriela@email.com", produto: "Serviço", valorCarta: 60000, origem: "Instagram", temperatura: "Morno", etapa: "Em Análise", perfil: "Profissional Liberal", rendaEstimada: 8500, respondeuMensagem: true, reuniaoAgendada: true, ultimoContato: iso(now - 2*day), diasNaEtapa: 6, criadoEm: iso(now - 14*day) },
  { id: "l13", nome: "Henrique Costa", telefone: "11988887777", email: "henrique@email.com", produto: "Investimento", valorCarta: 300000, origem: "Meta Ads", temperatura: "Quente", etapa: "Fechado", perfil: "Investidor", rendaEstimada: 35000, respondeuMensagem: true, reuniaoAgendada: true, temUrgencia: true, ultimoContato: iso(now - 2*day), diasNaEtapa: 1, criadoEm: iso(now - 25*day) },
  { id: "l14", nome: "Isabela Martins", telefone: "11977776666", email: "isabela@email.com", produto: "Imóvel", valorCarta: 180000, origem: "Orgânico", temperatura: "Frio", etapa: "Novo Lead", perfil: "Pessoa Física", ultimoContato: iso(now - 8*day), diasNaEtapa: 8, criadoEm: iso(now - 8*day) },
  { id: "l15", nome: "João Pedro Vieira", telefone: "11966665555", email: "joaopedro@email.com", produto: "Outros", valorCarta: 35000, origem: "WhatsApp", temperatura: "Morno", etapa: "Contato Realizado", perfil: "Pessoa Física", rendaEstimada: 4500, respondeuMensagem: true, ultimoContato: iso(now - 4*day), diasNaEtapa: 4, criadoEm: iso(now - 6*day) },
];

const histPagamentos = (pago = 6) => Array.from({ length: 6 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - (5 - i));
  return { mes: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }), status: i < pago ? "Pago" as const : "Atrasado" as const };
});

export const mockClientes: Cliente[] = [
  { id: "c1", nome: "Henrique Costa", telefone: "11988887777", email: "henrique@email.com", produto: "Investimento", valorCarta: 300000, parcelasPagas: 14, parcelasTotais: 120, contemplado: true, contempladoEm: iso(now - 60*day), fechadoEm: iso(now - 420*day), grupo: "0412", cota: "18", parcelaMensal: 2850, statusPagamento: "Em Dia", oportunidade: "Nenhuma", dataAdesao: iso(now - 420*day), prazoTotal: 120, prazoRestante: 106, fase: "Contemplado", historicoPagamentos: histPagamentos(6), indicacoes: [{ id: "i1", nome: "Marcos Oliveira", status: "Lead", data: iso(now - 12*day) }] },
  { id: "c2", nome: "Patricia Ramos", telefone: "11977776666", email: "patricia@email.com", produto: "Imóvel", valorCarta: 450000, parcelasPagas: 8, parcelasTotais: 180, contemplado: false, fechadoEm: iso(now - 240*day), grupo: "0387", cota: "05", parcelaMensal: 3100, statusPagamento: "Em Dia", oportunidade: "Cross-sell", oportunidadeNotas: "Cliente demonstrou interesse em consórcio de veículo", dataAdesao: iso(now - 240*day), prazoTotal: 180, prazoRestante: 172, fase: "Cliente Ativo", historicoPagamentos: histPagamentos(6), indicacoes: [] },
  { id: "c3", nome: "Thiago Barbosa", telefone: "11966665555", email: "thiago@email.com", produto: "Veículo", valorCarta: 100000, parcelasPagas: 5, parcelasTotais: 80, contemplado: false, fechadoEm: iso(now - 150*day), grupo: "0401", cota: "22", parcelaMensal: 1620, statusPagamento: "Atenção", oportunidade: "Nenhuma", dataAdesao: iso(now - 150*day), prazoTotal: 80, prazoRestante: 75, fase: "Cliente Ativo", historicoPagamentos: histPagamentos(5), indicacoes: [] },
  { id: "c4", nome: "Renata Peixoto", telefone: "11955554444", email: "renata@email.com", produto: "Imóvel", valorCarta: 220000, parcelasPagas: 18, parcelasTotais: 150, contemplado: false, fechadoEm: iso(now - 540*day), grupo: "0355", cota: "11", parcelaMensal: 1750, statusPagamento: "Em Dia", oportunidade: "Upsell", oportunidadeNotas: "Renda aumentou - elegível para carta maior", dataAdesao: iso(now - 540*day), prazoTotal: 150, prazoRestante: 132, fase: "Cliente Ativo", historicoPagamentos: histPagamentos(6), indicacoes: [{ id: "i2", nome: "Camila Santos", status: "Lead", data: iso(now - 5*day) }, { id: "i3", nome: "Lucas Cardoso", status: "Cliente Ativo", data: iso(now - 100*day) }] },
  { id: "c5", nome: "Lucas Cardoso", telefone: "11944443333", email: "lucas@email.com", produto: "Moto", valorCarta: 22000, parcelasPagas: 6, parcelasTotais: 60, contemplado: false, fechadoEm: iso(now - 180*day), grupo: "0398", cota: "33", parcelaMensal: 480, statusPagamento: "Inadimplente", oportunidade: "Nenhuma", dataAdesao: iso(now - 180*day), prazoTotal: 60, prazoRestante: 54, fase: "Cliente Ativo", historicoPagamentos: histPagamentos(4), indicacoes: [] },
];

export const mockTarefas: Tarefa[] = [
  { id: "t1", titulo: "Ligar para Carlos sobre simulação", tipo: "Ligação", cliente: "Carlos Mendes", leadId: "l1", data: iso(now + 2*3600*1000), concluida: false, prioridade: "Alta" },
  { id: "t2", titulo: "Enviar proposta para Bruno", tipo: "WhatsApp", cliente: "Bruno Ferreira", leadId: "l7", data: iso(now + 4*3600*1000), concluida: false, prioridade: "Alta" },
  { id: "t3", titulo: "Reunião com Juliana", tipo: "Reunião", cliente: "Juliana Castro", leadId: "l4", data: iso(now + 6*3600*1000), concluida: false, prioridade: "Alta" },
  { id: "t4", titulo: "Follow-up Fernanda", tipo: "WhatsApp", cliente: "Fernanda Lima", leadId: "l2", data: iso(now + 1*day), concluida: false, prioridade: "Média" },
  { id: "t5", titulo: "Cobrar parcela atrasada", tipo: "Ligação", cliente: "Lucas Cardoso", clienteId: "c5", data: iso(now + 2*day), concluida: false, prioridade: "Alta" },
];

export const mockPropostas: Proposta[] = [
  { id: "p1", leadId: "l1", leadNome: "Carlos Mendes", produto: "Imóvel", valorCarta: 350000, prazoMeses: 180, parcela: 2400, status: "Enviada", criadaEm: iso(now - 2*day), comissaoEstimada: 5250 },
  { id: "p2", leadId: "l7", leadNome: "Bruno Ferreira", produto: "Veículo", valorCarta: 120000, prazoMeses: 80, parcela: 1820, status: "Enviada", criadaEm: iso(now - 1*day), comissaoEstimada: 1800 },
  { id: "p3", leadId: "l4", leadNome: "Juliana Castro", produto: "Imóvel", valorCarta: 500000, prazoMeses: 200, parcela: 3200, status: "Aceita", criadaEm: iso(now - 5*day), comissaoEstimada: 7500 },
  { id: "p4", leadId: "l10", leadNome: "Elaine Gomes", produto: "Imóvel", valorCarta: 420000, prazoMeses: 180, parcela: 2950, status: "Enviada", criadaEm: iso(now - 3*day), comissaoEstimada: 6300 },
];

export const mockCampanhas: Campanha[] = [
  { id: "ca1", nome: "Imóvel dos Sonhos - Maio", canal: "Meta Ads", investimento: 1200, leadsGerados: 34, vendas: 4, receita: 18000, inicio: iso(now - 30*day), ativa: true, utm: "imovel_maio_25" },
  { id: "ca2", nome: "Consórcio de Veículos - Instagram", canal: "Instagram", investimento: 600, leadsGerados: 18, vendas: 2, receita: 4800, inicio: iso(now - 20*day), ativa: true, utm: "veiculo_ig" },
  { id: "ca3", nome: "Broadcast WhatsApp - Indicações", canal: "WhatsApp Broadcast", investimento: 0, leadsGerados: 12, vendas: 3, receita: 9000, inicio: iso(now - 15*day), ativa: true, utm: "wa_indicacao" },
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
