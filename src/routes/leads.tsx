import { createFileRoute, redirect } from "@tanstack/react-router";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/leads")({head:()=>pageHead("Leads", "Leads e pipelines de vendas."),beforeLoad:()=>{throw redirect({to:"/pipeline/todos"});}});
