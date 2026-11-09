import type { CSSProperties } from "react";

export const STAGE_COLOR_PALETTE = [
  { name: "Azul", value: "#3B82F6" }, { name: "Ciano", value: "#06B6D4" },
  { name: "Turquesa", value: "#14B8A6" }, { name: "Verde", value: "#22C55E" },
  { name: "Esmeralda", value: "#10B981" }, { name: "Lima", value: "#84CC16" },
  { name: "Amarelo", value: "#EAB308" }, { name: "Âmbar", value: "#F59E0B" },
  { name: "Laranja", value: "#F97316" }, { name: "Vermelho", value: "#EF4444" },
  { name: "Rosa", value: "#EC4899" }, { name: "Pink", value: "#D946EF" },
  { name: "Roxo", value: "#A855F7" }, { name: "Índigo", value: "#6366F1" },
  { name: "Violeta", value: "#8B5CF6" }, { name: "Cinza", value: "#94A3B8" },
] as const;

export function getStageHeaderStyle(stage: string, configuredColor?: string): CSSProperties {
  const legacyColors: Record<string, string> = {
    "Lead Novo": "#3B82F6", "Contato Realizado": "#3B82F6",
    "Reunião Agendada": "#EAB308", "Proposta Enviada": "#EAB308",
    "Aguardando Pagamento": "#F97316", "Fechado": "#10B981", "Perdido": "#EF4444",
  };
  const color = configuredColor || legacyColors[stage] || "#64748B";
  return {
    backgroundColor: `color-mix(in srgb, ${color} 16%, var(--card))`,
    borderColor: `color-mix(in srgb, ${color} 48%, transparent)`,
    color,
  };
}
