import { Button } from "@/components/ui/button";
import { featureEnabled } from "@/lib/features";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, UserPlus, MessageSquare, CheckSquare, FileText, X } from "lucide-react";

export function FloatingActionButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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
          onClick={() => { navigate({ to: it.to }); setOpen(false); }}
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
    </div>
  );
}
