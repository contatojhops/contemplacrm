import { Button } from "@/components/ui/button";
import { featureEnabled } from "@/lib/features";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LeadModal } from "@/components/LeadModal";
import { useLeads, usePipelines } from "@/lib/store";
import { GENERAL_ID } from "@/lib/pipelines";
import { toast } from "sonner";
import { Plus, UserPlus, MessageSquare, CheckSquare, FileText, X } from "lucide-react";

export function FloatingActionButton() {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [leads, setLeads] = useLeads();
  const [pipelines] = usePipelines();
  const navigate = useNavigate();
  const defaultPipelineId = pipelines.find(p => p.id === GENERAL_ID && !p.arquivada)?.id ?? pipelines.find(p => !p.arquivada)?.id ?? GENERAL_ID;

  const handleSave = (lead: import("@/lib/types").Lead) => {
    setLeads(prev => prev.some(item => item.id === lead.id) ? prev.map(item => item.id === lead.id ? lead : item) : [lead, ...prev]);
    toast.success("Lead cadastrado com sucesso!");
  };

  const items = [
    { icon: UserPlus, label: "Novo Lead", to: "/leads" },
    { icon: MessageSquare, label: "Registrar Interação", to: "/clientes" },
    { icon: CheckSquare, label: "Nova Tarefa", to: "/agenda" },
    { icon: FileText, label: "Nova Proposta", to: "/propostas" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {open && items.filter(it => featureEnabled(it.to)).map((it) => (
        <Button
          key={it.label}
          onClick={() => { if (it.to === "/leads") setModalOpen(true); else navigate({ to: it.to }); setOpen(false); }}
          className="flex items-center gap-2 bg-card text-card-foreground border rounded-full shadow-lg pl-3 pr-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground animate-in slide-in-from-bottom-2"
        >
          <it.icon className="h-4 w-4 text-primary" /> {it.label}
        </Button>
      ))}
      <Button
        onClick={() => setOpen((o) => !o)}
        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Ações rápidas"
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
      <LeadModal open={modalOpen} onOpenChange={setModalOpen} defaultPipelineId={defaultPipelineId} onSave={handleSave} />
    </div>
  );
}
