import type { Lead, Etapa } from './types';

export function localDate(value: string | Date): Date {
  if (value instanceof Date) return new Date(value);
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
}

export function localInput(value: string | Date = new Date()) {
  const d = localDate(value);
  if (!Number.isFinite(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function whatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, '').replace(/^00/, '');
  return `https://wa.me/${digits.length <= 11 ? `55${digits}` : digits}`;
}

export function changeStage(lead: Lead, etapa: Etapa, reason = '', now = new Date()): Lead {
  if (lead.etapa === etapa) return lead;
  if (etapa === 'Perdido' && !reason.trim()) throw new Error('Informe o motivo da perda.');
  return { ...lead, etapa, stage_changed_at: now.toISOString(), closed_at: etapa === 'Fechado' ? now.toISOString() : undefined, motivoPerda: etapa === 'Perdido' ? reason.trim() : undefined, diasNaEtapa: 0 };
}

export function stageDays(lead: Lead, now = new Date()) {
  const start = localDate(lead.stage_changed_at ?? lead.criadoEm);
  return Number.isFinite(start.getTime()) ? Math.max(0, Math.floor((now.getTime()-start.getTime())/86400000)) : 0;
}

export function closedThisMonth(leads: Lead[], now = new Date()) {
  return leads.filter(l => {
    if (l.etapa !== 'Fechado' || !l.closed_at) return false;
    const d = localDate(l.closed_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
}

export const DELETE_CONFIRMATION = 'Tem certeza que deseja excluir? Esta ação não pode ser desfeita.';