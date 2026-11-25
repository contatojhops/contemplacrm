import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const leadSchema = z.object({ id: z.string().max(100), nome: z.string().max(120), etapa: z.string().max(60), diasNaEtapa: z.number(), produto: z.string().max(60), valor: z.number(), origem: z.string().max(60), diasSemContato: z.number().nullable(), observacoes: z.string().max(400), objetivo: z.string().max(200), temperatura: z.string().max(20), ultimaInteracao: z.string().max(300) });

export const getNextStepSuggestions = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string().min(10), leads: z.array(leadSchema).min(1).max(30) }).parse(d))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
    const { data: claims, error } = await sb.auth.getClaims(data.token);
    if (error || !claims?.claims?.sub) return { sugestoes: [], error: "Sessão expirada. Entre novamente." };
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { sugestoes: [], error: "Recurso de IA não configurado." };
    const { suggestNextSteps } = await import("./leadSuggestions.server");
    try {
      return { sugestoes: await suggestNextSteps(data.leads, apiKey), error: null as string | null };
    } catch (e) {
      const status = (e as { statusCode?: number })?.statusCode;
      console.error("next-step suggestions failed", status, e);
      const msg = status === 429 ? "Muitas solicitações. Tente de novo em instantes." : status === 402 ? "Créditos de IA esgotados. Adicione créditos em Configurações → Planos." : status === 403 ? "Uso de IA bloqueado neste espaço de trabalho." : "Não foi possível gerar sugestões agora.";
      return { sugestoes: [], error: msg };
    }
  });
