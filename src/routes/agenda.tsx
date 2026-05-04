import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useTarefas } from "@/lib/store";
import { Phone, MessageCircle, Users, Mail, MapPin } from "lucide-react";

export const Route = createFileRoute("/agenda")({ component: AgendaPage });

const tipoIcon = {
  "Ligação": Phone,
  "WhatsApp": MessageCircle,
  "Reunião": Users,
  "E-mail": Mail,
  "Visita": MapPin,
};

function AgendaPage() {
  const [tarefas, setTarefas] = useTarefas();

  const toggle = (id: string) => {
    setTarefas((prev) => prev.map((t) => t.id === id ? { ...t, concluida: !t.concluida } : t));
  };

  const today = new Date().toDateString();
  const grupos = {
    Hoje: tarefas.filter((t) => new Date(t.data).toDateString() === today),
    Próximas: tarefas.filter((t) => new Date(t.data) > new Date() && new Date(t.data).toDateString() !== today),
    Atrasadas: tarefas.filter((t) => new Date(t.data) < new Date() && !t.concluida && new Date(t.data).toDateString() !== today),
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agenda & Tarefas</h1>
        <p className="text-muted-foreground">Seus compromissos e follow-ups</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Object.entries(grupos).map(([titulo, lista]) => (
          <Card key={titulo}>
            <CardHeader><CardTitle className="text-base flex items-center justify-between">
              {titulo}<Badge variant="secondary">{lista.length}</Badge>
            </CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {lista.length === 0 && <p className="text-sm text-muted-foreground">Nada por aqui</p>}
              {lista.map((t) => {
                const Icon = tipoIcon[t.tipo];
                return (
                  <div key={t.id} className="flex items-start gap-3 p-2 rounded-lg border border-border">
                    <Checkbox checked={t.concluida} onCheckedChange={() => toggle(t.id)} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${t.concluida ? "line-through text-muted-foreground" : ""}`}>{t.titulo}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                        <Icon className="h-3 w-3" />{t.tipo} · {t.cliente}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(t.data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
