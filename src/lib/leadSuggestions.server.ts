import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output, jsonSchema, NoObjectGeneratedError } from "ai";
import { createLovableAiGatewayRunIdFetch } from "./aig-run-id.server";

export interface StalledLeadInput { id: string; nome: string; etapa: string; diasNaEtapa: number; produto: string; valor: number; origem: string; diasSemContato: number | null; observacoes: string; objetivo: string; temperatura: string; ultimaInteracao: string; }
export interface LeadSuggestion { id: string; proximoPasso: string; motivo: string; }

const schema = jsonSchema<{ sugestoes: LeadSuggestion[] }>({
  type: "object", additionalProperties: false, required: ["sugestoes"],
  properties: { sugestoes: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "proximoPasso", "motivo"], properties: { id: { type: "string" }, proximoPasso: { type: "string" }, motivo: { type: "string" } } } } },
});

export async function suggestNextSteps(leads: StalledLeadInput[], apiKey: string): Promise<LeadSuggestion[]> {
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({ baseURL: "https://ai.gateway.lovable.dev/v1", apiKey, headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" }, fetch: runIdFetch.fetch });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system: "Você é um coach de vendas de consórcio no Brasil. Para cada lead parado no funil, sugira UM próximo passo concreto e curto (até 12 palavras, começando com verbo no infinitivo, ex.: 'Enviar simulação pelo WhatsApp') e um motivo curto (até 20 palavras) baseado nos dados do lead. Responda em português do Brasil. Devolva exatamente um item por lead, com o mesmo id.",
    prompt: JSON.stringify(leads),
    experimental_output: Output.object({ schema }),
    maxRetries: 0,
    providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "low", include: ["reasoning.encrypted_content"] } },
  });
  try {
    const out = JSON.parse(await result.text) as { sugestoes?: LeadSuggestion[] };
    if (!Array.isArray(out.sugestoes)) return [];
    const ids = new Set(leads.map(l => l.id));
    return out.sugestoes.filter((s: LeadSuggestion) => typeof s?.proximoPasso === "string" && typeof s?.motivo === "string" && ids.has(s.id)).map((s: LeadSuggestion) => ({ id: s.id, proximoPasso: s.proximoPasso.trim().slice(0, 140), motivo: s.motivo.trim().slice(0, 220) }));
  } catch (e) {
    if (NoObjectGeneratedError.isInstance(e) || e instanceof SyntaxError) return [];
    throw e;
  }
}
