import type { Pipeline, PipelineCor } from '@/lib/types';
export const pipelineDot: Record<PipelineCor,string> = {
  azul: 'bg-primary', verde: 'bg-success', amarelo: 'bg-warning', vermelho: 'bg-destructive', roxo: 'bg-chart-3',
  ciano: 'bg-cyan-500', laranja: 'bg-orange-500', rosa: 'bg-pink-500', indigo: 'bg-indigo-500',
  turquesa: 'bg-teal-500', esmeralda: 'bg-emerald-500', cinza: 'bg-slate-400',
};
export const pipelineFill: Record<PipelineCor,string> = {
  azul: 'var(--primary)', verde: 'var(--success)', amarelo: 'var(--warning)', vermelho: 'var(--destructive)', roxo: 'var(--chart-3)',
  ciano: '#06B6D4', laranja: '#F97316', rosa: '#EC4899', indigo: '#6366F1',
  turquesa: '#14B8A6', esmeralda: '#10B981', cinza: '#94A3B8',
};
export function PipelineBadge({ pipeline }: { pipeline?: Pipeline }) {
  if (!pipeline) return null;
  return <span className="inline-flex max-w-full items-center gap-1.5 rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground"><span className={`h-2 w-2 shrink-0 rounded-full ${pipelineDot[pipeline.cor] ?? pipelineDot.azul}`} /><span className="truncate">{pipeline.nome}</span>{pipeline.arquivada && <span>(arquivada)</span>}</span>;
}