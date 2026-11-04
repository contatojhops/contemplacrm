import type { Pipeline, PipelineCor } from '@/lib/types';
export const pipelineDot: Record<PipelineCor,string> = { azul:'bg-primary', verde:'bg-success', amarelo:'bg-warning', vermelho:'bg-destructive', roxo:'bg-chart-3' };
export const pipelineFill: Record<PipelineCor,string> = { azul:'var(--primary)',verde:'var(--success)',amarelo:'var(--warning)',vermelho:'var(--destructive)',roxo:'var(--chart-3)' };
export function PipelineBadge({ pipeline }: { pipeline?: Pipeline }) {
  if (!pipeline) return null;
  return <span className="inline-flex max-w-full items-center gap-1.5 rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground"><span className={`h-2 w-2 shrink-0 rounded-full ${pipelineDot[pipeline.cor]}`} /><span className="truncate">{pipeline.nome}</span>{pipeline.arquivada && <span>(arquivada)</span>}</span>;
}