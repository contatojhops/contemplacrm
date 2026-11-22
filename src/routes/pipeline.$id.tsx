import { createFileRoute } from "@tanstack/react-router";
import { PipelineBoard } from "@/components/PipelineBoard";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/pipeline/$id")({head:()=>({meta:[{title:"Pipeline"}]}),component:PipelinePage});
function PipelinePage(){const {id}=Route.useParams();return <PipelineBoard pipelineId={id} />;}
