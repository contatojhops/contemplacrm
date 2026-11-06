import type { Lead, Pipeline, Tarefa, Etapa } from './types';
import { localDate } from './crm';
export const GENERAL_ID = 'pipeline_geral';
export const ETAPAS: Etapa[] = ['Novo Lead','Contato Realizado','Proposta Enviada','Em Análise','Fechado','Perdido'];
export const activeLead = (l: Lead) => !['Fechado','Perdido'].includes(l.etapa);
export const generalPipeline = (): Pipeline => ({ id: GENERAL_ID, nome: 'Geral', cor: 'azul', ordem: 0, arquivada: false, created_at: new Date().toISOString() });
export function normalizeLeads(leads: Lead[], pipelines: Pipeline[]) {
  const fallback = pipelines.find(p => p.id === GENERAL_ID) ?? pipelines.find(p => !p.arquivada) ?? pipelines[0];
  return leads.map(l => ({ ...l, pipeline_id: pipelines.some(p => p.id === l.pipeline_id) ? l.pipeline_id : fallback?.id ?? GENERAL_ID }));
}
export function deletePipeline(pipelines: Pipeline[], leads: Lead[], tasks: Tarefa[], id: string, target?: string) {
  if (pipelines.length <= 1) throw new Error('Não é possível excluir a última pipeline.');
  if (target && (target === id || !pipelines.some(p => p.id === target && !p.arquivada))) throw new Error('Escolha outra pipeline disponível.');
  const removedIds = new Set(leads.filter(l => l.pipeline_id === id).map(l => l.id));
  return { pipelines: pipelines.filter(p => p.id !== id), leads: target ? leads.map(l => l.pipeline_id === id ? { ...l, pipeline_id: target } : l) : leads.filter(l => l.pipeline_id !== id), tasks: target ? tasks : tasks.filter(t => !removedIds.has(t.lead_id)) };
}
export type Period = 'mes' | '30dias' | 'todos';
export function periodRange(period: Period, now = new Date()) {
  const end = new Date(now); end.setHours(23,59,59,999);
  if (period === 'todos') return { start: new Date(0), end, previousStart: new Date(0), previousEnd: new Date(0) };
  const start = period === 'mes' ? new Date(now.getFullYear(), now.getMonth(), 1) : new Date(now.getFullYear(), now.getMonth(), now.getDate()-29);
  const previousEnd = new Date(start.getTime()-1);
  const previousStart = period === 'mes' ? new Date(now.getFullYear(), now.getMonth()-1, 1) : new Date(start.getTime()-30*86400000);
  return { start, end, previousStart, previousEnd };
}
export function inRange(date: string | undefined, start: Date, end: Date) { if (!date) return false; const d = localDate(date); return d >= start && d <= end; }
export function currentStatus(leads: Lead[]) {
  const active = leads.filter(activeLead);
  return { ativos: active.length, emProposta: active.filter(l => ['Proposta Enviada','Em Análise'].includes(l.etapa)).length, aberto: active.reduce((s,l)=>s+l.valorCarta,0) };
}
export function periodMetrics(leads: Lead[], start: Date, end: Date) {
  const created = leads.filter(l => inRange(l.criadoEm,start,end));
  const closed = leads.filter(l => l.etapa === 'Fechado' && inRange(l.closed_at,start,end));
  const lost = leads.filter(l => l.etapa === 'Perdido' && inRange(l.stage_changed_at,start,end));
  return { leads: created.length, fechados: closed.length, perdidos: lost.length, conversao: closed.length+lost.length ? closed.length/(closed.length+lost.length)*100 : 0, fechado: closed.reduce((s,l)=>s+l.valorCarta,0) };
}
/** Current-status figures ignore the period; flow figures (captured, closed, lost, conversion) use it. */
export function metrics(leads: Lead[], start: Date, end: Date) {
  return { ...currentStatus(leads), ...periodMetrics(leads,start,end) };
}
export function leadCsv(leads: Lead[], pipelines: Pipeline[]) {
  const quote = (value: unknown) => `"${String(value ?? '').replace(/"/g,'""')}"`;
  return '\uFEFF'+[['Nome','Telefone','Pipeline','Produto','Origem','Etapa','Valor da carta','Criado em'],...leads.map(l => [l.nome,l.telefone,pipelines.find(p=>p.id===l.pipeline_id)?.nome ?? '',l.produto,l.origem,l.etapa,l.valorCarta,l.criadoEm])].map(row=>row.map(quote).join(';')).join('\r\n');
}