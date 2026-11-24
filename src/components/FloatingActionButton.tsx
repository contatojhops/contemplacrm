import { Button } from "@/components/ui/button";
import { featureEnabled } from "@/lib/features";
import { useState } from "react";
import { LeadModal } from "@/components/LeadModal";
import { QuickTaskModal, QuickInteractionModal } from "@/components/QuickActionModals";
import { useLeads, usePipelines, useTarefas, useClientes } from "@/lib/store";
import { GENERAL_ID } from "@/lib/pipelines";
import { toast } from "sonner";
import { Plus, UserPlus, MessageSquare, CheckSquare, FileText, X } from "lucide-react";
import type { Interacao, Lead } from "@/lib/types";

export function FloatingActionButton() {
  const [open, setOpen] = useState(false);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [interactionModalOpen, setInteractionModalOpen] = useState(false);
  const [leads, setLeads] = useLeads();
  const [tarefas, setTarefas] = useTarefas();
  const [clientes, setClientes] = useClientes();
  const [pipelines] = usePipelines();
  const defaultPipelineId = pipelines.find(p => p.id === GENERAL_ID && !p.arquivada)?.id ?? pipelines.find(p => !p.arquivada)?.id ?? GENERAL_ID;

  const handleSaveLead = (lead: Lead) => {
    setLeads(prev => prev.some(item => item.id === lead.id) ? prev.map(item => item.id === lead.id ? lead : item) : [lead, ...prev]);
    toast.success("Lead cadastrado com sucesso!");
  };

  const handleSaveTask = (task: import("@/lib/types").Tarefa) => {
    setTarefas(prev => [task, ...prev]);
    toast.success("Tarefa criada!");
  };

  const handleSaveInteraction = (contactId: string, interaction: Interacao) => {
    if (contactId.startsWith("cliente:")) {
      const id = contactId.slice("cliente:".length);
      setClientes(prev => prev.map(c => c.id === id ? { ...c, interacoes: [...(c.interacoes ?? []), interaction], ultimaInteracao: interaction.data } : c));
      return;
    }
    setLeads(prev => prev.map(lead => lead.id === contactId ? {
      ...lead,
      ultimoContato: interaction.data,
      detalhesCliente: { ...lead.detalhesCliente, interacoes: [...(lead.detalhesCliente?.interacoes ?? []), interaction] },
    } : lead));
  };

  const interactionContacts = [
    ...leads.map(lead => ({ id: lead.id, nome: lead.nome, telefone: lead.telefone })),
    ...clientes.map(cliente => ({ id: `cliente:${cliente.id}`, nome: cliente.nome, telefone: cliente.telefone })),
  ];

  const items = [
    { icon: UserPlus, label: "Novo Lead", action: () => setLeadModalOpen(true), path: "/leads" },
    { icon: MessageSquare, label: "Registrar Interação", action: () => setInteractionModalOpen(true), path: "/clientes" },
    { icon: CheckSquare, label: "Nova Tarefa", action: () => setTaskModalOpen(true), path: "/agenda" },
    { icon: FileText, label: "Nova Proposta", action: () => {}, path: "/propostas" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {open && items.filter(it => featureEnabled(it.path)).map(it => (
        <Button key={it.label} onClick={() => { it.action(); setOpen(false); }} className="flex items-center gap-2 bg-card text-card-foreground border rounded-full shadow-lg pl-3 pr-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground animate-in slide-in-from-bottom-2">
          <it.icon className="h-4 w-4 text-primary" /> {it.label}
        </Button>
      ))}
      <Button onClick={() => setOpen(o => !o)} className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:scale-105 transition-transform" aria-label="Ações rápidas">
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
      <LeadModal open={leadModalOpen} onOpenChange={setLeadModalOpen} defaultPipelineId={defaultPipelineId} onSave={handleSaveLead} />
      <QuickTaskModal open={taskModalOpen} onOpenChange={setTaskModalOpen} leads={leads} onSave={handleSaveTask} />
      <QuickInteractionModal open={interactionModalOpen} onOpenChange={setInteractionModalOpen} leads={interactionContacts as Lead[]} onSave={handleSaveInteraction} />
    </div>
  );
}
