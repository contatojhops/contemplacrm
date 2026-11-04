import { describe, it, expect } from 'bun:test';
import { calcScore, scoreColor } from './scoring';
import { changeStage, closedThisMonth, stageDays, whatsappUrl, localDate } from './crm';
import { FEATURES } from './features';
import { mockLeads, mockClientes, mockTarefas, mockPropostas, mockCampanhas } from './mockData';

const lead = { id: 'test', nome: 'Teste', telefone: '11987654321', email: '', produto: 'Imóvel', valorCarta: 100000, origem: 'WhatsApp', etapa: 'Novo Lead', diasNaEtapa: 0, criadoEm: new Date().toISOString(), ultimoContato: new Date().toISOString() };
describe('CRM rules', () => {
  it('awards 20 for income', () => expect(calcScore({ ...lead, rendaEstimada: 1 }) - calcScore(lead)).toBe(20));
  it('awards 15 for response', () => expect(calcScore({ ...lead, respondeuMensagem: true }) - calcScore(lead)).toBe(15));
  it('awards 25 for meeting', () => expect(calcScore({ ...lead, reuniaoAgendada: true }) - calcScore(lead)).toBe(25));
  it('awards 20 for urgency', () => expect(calcScore({ ...lead, temUrgencia: true }) - calcScore(lead)).toBe(20));
  it('awards 10 for product', () => expect(calcScore(lead)).toBe(10));
  it('subtracts 30 after seven days', () => expect(calcScore({ ...lead, rendaEstimada: 1, respondeuMensagem: true, ultimoContato: new Date(Date.now()-8*86400000).toISOString() })).toBe(15));
  it('clamps below zero', () => expect(calcScore({ ...lead, ultimoContato: '2000-01-01' })).toBe(0));
  it('retains badge thresholds', () => expect([0,30,31,60,61,100].map(scoreColor)).toEqual(['red','red','yellow','yellow','green','green']));
  it('requires loss reason', () => expect(() => changeStage(lead, 'Perdido')).toThrow());
  it('stores loss reason', () => expect(changeStage(lead, 'Perdido', 'Sem interesse').motivoPerda).toBe('Sem interesse'));
  it('updates stage age timestamp', () => { const updated = changeStage(lead, 'Contato Realizado', '', new Date('2026-05-01T12:00:00Z')); expect(stageDays(updated, new Date('2026-05-03T12:00:00Z'))).toBe(2); });
  it('counts closure not creation month', () => { const closed = changeStage({ ...lead, criadoEm: '2026-01-01' }, 'Fechado', '', new Date('2026-05-02T12:00:00Z')); expect(closedThisMonth([closed], new Date('2026-05-03')).length).toBe(1); expect(closedThisMonth([closed], new Date('2026-01-03')).length).toBe(0); });
  it('disables portfolio and proposals', () => expect(FEATURES).toEqual({ carteira: false, propostas: false }));
  it('contains no example business records', () => expect([mockLeads,mockClientes,mockTarefas,mockPropostas,mockCampanhas].map(x => x.length)).toEqual([0,0,0,0,0]));
  it('does not duplicate country code', () => expect(whatsappUrl('5511987654321')).toBe('https://wa.me/5511987654321'));
  it('adds country code for local phone', () => expect(whatsappUrl('(11) 98765-4321')).toBe('https://wa.me/5511987654321'));
  it('parses date-only as local midnight', () => expect(localDate('2026-05-01').getHours()).toBe(0));
});