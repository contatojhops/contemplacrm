import type { Lead, Cliente, Tarefa, Proposta, Campanha, Configuracoes } from "./types";

const now = Date.now();
const day = 86400000;
const iso = (d: number) => new Date(d).toISOString();

export const mockLeads: Lead[] = [
  { id: "l1", nome: "Carlos Mendes", telefone: "11987654321", email: "carlos@email.com", produto: "Imóvel", valorCarta: 350000, origem: "Meta Ads", temperatura: "Quente", etapa: "Novo Lead", rendaEstimada: 12000, respondeuMensagem: true, temUrgencia: true, ultimoContato: iso(now - 1*day), diasNaEtapa: 1, criadoEm: iso(now - 1*day), proximoFollowUp: iso(now + 1*day), proximaAcaoTipo: "Ligação" },
  { id: "l2", nome: "Mariana Souza", telefone: "11912345678", email: "mariana@email.com", produto: "Veículo", valorCarta: 80000, origem: "Instagram", temperatura: "Morno", etapa: "Contato Realizado", rendaEstimada: 6500, respondeuMensagem: true, ultimoContato: iso(now - 3*day), diasNaEtapa: 3, criadoEm: iso(now - 5*day), proximoFollowUp: iso(now + 2*day), proximaAcaoTipo: "WhatsApp" },
  { id: "l3", nome: "Pedro Almeida", telefone: "11999887766", email: "pedro@email.com", produto: "Moto", valorCarta: 25000, origem: "WhatsApp", temperatura: "Quente", etapa: "Proposta Enviada", rendaEstimada: 4500, respondeuMensagem: true, reuniaoAgendada: true, ultimoContato: iso(now - 2*day), diasNaEtapa: 2, criadoEm: iso(now - 8*day), proximoFollowUp: iso(now), proximaAcaoTipo: "Reunião" },
  { id: "l4", nome: "Juliana Ribeiro", telefone: "11988776655", email: "ju@email.com", produto: "Imóvel", valorCarta: 500000, origem: "Indicação", temperatura: "Quente", etapa: "Em Análise", rendaEstimada: 18000, respondeuMensagem: true, reuniaoAgendada: true, temUrgencia: true, ultimoContato: iso(now - 1*day), diasNaEtapa: 4, criadoEm: iso(now - 15*day) },
  { id: "l5", nome: "Roberto Lima", telefone: "11955443322", email: "roberto@email.com", produto: "Serviço", valorCarta: 30000, origem: "Orgânico", temperatura: "Frio", etapa: "Novo Lead", ultimoContato: iso(now - 10*day), diasNaEtapa: 10, criadoEm: iso(now - 10*day) },
  { id: "l6", nome: "Fernanda Costa", telefone: "11944332211", email: "fer@email.com", produto: "Veículo", valorCarta: 120000, origem: "Meta Ads", temperatura: "Morno", etapa: "Contato Realizado", rendaEstimada: 8000, respondeuMensagem: true, ultimoContato: iso(now - 9*day), diasNaEtapa: 6, criadoEm: iso(now - 12*day) },
  { id: "l7", nome: "Lucas Pereira", telefone: "11933221100", email: "lucas@email.com", produto: "Investimento", valorCarta: 200000, origem: "Indicação", temperatura: "Quente", etapa: "Fechado", rendaEstimada: 15000, respondeuMensagem: true, reuniaoAgendada: true, ultimoContato: iso(now - 2*day), diasNaEtapa: 1, criadoEm: iso(now - 20*day) },
  { id: "l8", nome: "Ana Beatriz", telefone: "11922110099", email: "ana@email.com", produto: "Imóvel", valorCarta: 280000, origem: "Instagram", temperatura: "Morno", etapa: "Perdido", ultimoContato: iso(now - 30*day), diasNaEtapa: 15, criadoEm: iso(now - 45*day) },
  { id: "l9", nome: "Rafael Santos", telefone: "11911009988", email: "rafael@email.com", produto: "Veículo", valorCarta: 95000, origem: "Meta Ads", temperatura: "Quente", etapa: "Proposta Enviada", rendaEstimada: 7500, respondeuMensagem: true, temUrgencia: true, ultimoContato: iso(now - 1*day), diasNaEtapa: 2, criadoEm: iso(now - 6*day), proximoFollowUp: iso(now + 1*day), proximaAcaoTipo: "Ligação" },
  { id: "l10", nome: "Camila Rocha", telefone: "11900998877", email: "camila@email.com", produto: "Outros", valorCarta: 40000, origem: "Outros", temperatura: "Frio", etapa: "Novo Lead", ultimoContato: iso(now - 5*day), diasNaEtapa: 5, criadoEm: iso(now - 5*day) },
  { id: "l11", nome: "Bruno Oliveira", telefone: "11988887777", email: "bruno@email.com", produto: "Imóvel", valorCarta: 420000, origem: "Meta Ads", temperatura: "Quente", etapa: "Em Análise", rendaEstimada: 14000, respondeuMensagem: true, reuniaoAgendada: true, ultimoContato: iso(now - 2*day), diasNaEtapa: 5, criadoEm: iso(now - 18*day) },
  { id: "l12", nome: "Patrícia Nunes", telefone: "11977776666", email: "patricia@email.com", produto: "Serviço", valorCarta: 50000, origem: "WhatsApp", temperatura: "Morno", etapa: "Fechado", rendaEstimada: 9000, respondeuMensagem: true, reuniaoAgendada: true, ultimoContato: iso(now - 3*day), diasNaEtapa: 1, criadoEm: iso(now - 25*day) },
];

export const mockClientes: Cliente[] = [
  { id: "c1", nome: "Lucas Pereira", telefone: "11933221100", email: "lucas@email.com", produto: "Investimento", valorCarta: 200000, parcelasPagas: 3, parcelasTotais: 120, contemplado: false, fechadoEm: iso(now - 90*day) },
  { id: "c2", nome: "Patrícia Nunes", telefone: "11977776666", email: "patricia@email.com", produto: "Serviço", valorCarta: 50000, parcelasPagas: 8, parcelasTotais: 60, contemplado: true, fechadoEm: iso(now - 240*day) },
  { id: "c3", nome: "Eduardo Martins", telefone: "11966665555", email: "edu@email.com", produto: "Imóvel", valorCarta: 380000, parcelasPagas: 24, parcelasTotais: 180, contemplado: true, fechadoEm: iso(now - 720*day) },
  { id: "c4", nome: "Renata Silva", telefone: "11955554444", email: "renata@email.com", produto: "Veículo", valorCarta: 90000, parcelasPagas: 12, parcelasTotais: 80, contemplado: false, fechadoEm: iso(now - 365*day) },
];

export const mockTarefas: Tarefa[] = [
  { id: "t1", titulo: "Ligar para Carlos sobre simulação", tipo: "Ligação", cliente: "Carlos Mendes", leadId: "l1", data: iso(now + 2*3600*1000), concluida: false },
  { id: "t2", titulo: "Enviar proposta para Pedro", tipo: "WhatsApp", cliente: "Pedro Almeida", leadId: "l3", data: iso(now + 4*3600*1000), concluida: false },
  { id: "t3", titulo: "Reunião com Juliana", tipo: "Reunião", cliente: "Juliana Ribeiro", leadId: "l4", data: iso(now + 6*3600*1000), concluida: false },
  { id: "t4", titulo: "Follow-up Mariana", tipo: "WhatsApp", cliente: "Mariana Souza", leadId: "l2", data: iso(now + 1*day), concluida: false },
  { id: "t5", titulo: "Visita técnica Bruno", tipo: "Visita", cliente: "Bruno Oliveira", leadId: "l11", data: iso(now + 2*day), concluida: false },
];

export const mockPropostas: Proposta[] = [
  { id: "p1", leadId: "l3", leadNome: "Pedro Almeida", produto: "Moto", valorCarta: 25000, prazoMeses: 60, parcela: 520, status: "Enviada", criadaEm: iso(now - 2*day) },
  { id: "p2", leadId: "l9", leadNome: "Rafael Santos", produto: "Veículo", valorCarta: 95000, prazoMeses: 80, parcela: 1480, status: "Enviada", criadaEm: iso(now - 1*day) },
  { id: "p3", leadId: "l4", leadNome: "Juliana Ribeiro", produto: "Imóvel", valorCarta: 500000, prazoMeses: 200, parcela: 3200, status: "Aceita", criadaEm: iso(now - 5*day) },
  { id: "p4", leadId: "l11", leadNome: "Bruno Oliveira", produto: "Imóvel", valorCarta: 420000, prazoMeses: 180, parcela: 2950, status: "Enviada", criadaEm: iso(now - 3*day) },
];

export const mockCampanhas: Campanha[] = [
  { id: "ca1", nome: "Imóveis - Black Friday", canal: "Meta Ads", investimento: 5000, leadsGerados: 87, vendas: 4, inicio: iso(now - 30*day), ativa: true },
  { id: "ca2", nome: "Veículos Instagram", canal: "Instagram", investimento: 2500, leadsGerados: 42, vendas: 2, inicio: iso(now - 20*day), ativa: true },
  { id: "ca3", nome: "Indicação Premiada", canal: "Indicação", investimento: 1500, leadsGerados: 23, vendas: 5, inicio: iso(now - 60*day), ativa: false },
];

export const defaultConfig: Configuracoes = {
  metaMensal: 1500000,
  consultorNome: "João Silva",
  consultorEmail: "joao@consorcio.com",
  whatsappNumero: "5511999998888",
  taxaAdmin: 18,
  fundoReserva: 2,
  comissao: 1.5,
  valorSeguroDefault: 35,
};
