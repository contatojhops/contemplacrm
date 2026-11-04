import { createFileRoute } from "@tanstack/react-router";
import { PipelineBoard } from "@/components/PipelineBoard";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/pipeline/todos")({head:()=>pageHead("Todos os leads", "Visão consolidada das pipelines de vendas."),component:()=> <PipelineBoard />});
