import type { Lead, Produto, Temperatura } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Pencil, ArrowRight, Calendar } from "lucide-react";
import { calcScore, scoreColor, formatBRL } from "@/lib/scoring";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const produtoColor: Record<Produto, string> = {
  "Imóvel": "bg-blue-500/15 text-blue-700 border-blue-500/30",
  "Veículo": "bg-orange-500/15 text-orange-700 border-orange-500/30",
  "Serviço": "bg-purple-500/15 text-purple-700 border-purple-500/30",
  "Moto": "bg-yellow-500/15 text-yellow-800 border-yellow-500/30",
  "Investimento": "bg-green-500/15 text-green-700 border-green-500/30",
  "Outros": "bg-gray-500/15 text-gray-700 border-gray-500/30",
};

const tempIcon: Record<Temperatura, string> = {
  Frio: "🔵",
  Morno: "🟡",
  Quente: "🔴",
};

const scoreClass = {
  red: "bg-destructive text-destructive-foreground",
  yellow: "bg-warning text-warning-foreground",
  green: "bg-success text-success-foreground",
};

export interface LeadCardProps {
  lead: Lead;
  onEdit: (l: Lead) => void;
  onAdvance: (l: Lead) => void;
}

export function LeadCard({ lead, onEdit, onAdvance }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const score = calcScore(lead);
  const c = scoreColor(score);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border border-border rounded-lg p-3 shadow-sm space-y-2 cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-sm leading-tight">{lead.nome}</div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${scoreClass[c]}`}>{score}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${produtoColor[lead.produto]}`}>{lead.produto}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-accent">
          {tempIcon[lead.temperatura]} {lead.temperatura}
        </span>
      </div>
      <div className="text-xs text-muted-foreground">
        {lead.origem} · {formatBRL(lead.valorCarta)}
      </div>
      <div className="text-[11px] text-muted-foreground">{lead.diasNaEtapa} dias nesta etapa</div>
      {lead.proximoFollowUp && (
        <div className="flex items-center gap-1 text-[11px] text-foreground">
          <Calendar className="h-3 w-3" />
          {new Date(lead.proximoFollowUp).toLocaleDateString("pt-BR")} · {lead.proximaAcaoTipo}
        </div>
      )}
      <div className="flex items-center gap-1 pt-1 border-t border-border" onPointerDown={(e) => e.stopPropagation()}>
        <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
          <a href={`https://wa.me/55${lead.telefone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
            <MessageCircle className="h-3.5 w-3.5" />
          </a>
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(lead)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 ml-auto" onClick={() => onAdvance(lead)}>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export { produtoColor };
export function ScoreBadge({ score }: { score: number }) {
  const c = scoreColor(score);
  return <Badge className={scoreClass[c]}>{score}</Badge>;
}
