import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useConfig } from "@/lib/store";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/configuracoes")({ component: ConfiguracoesPage });

function ConfiguracoesPage() {
  const [config, setConfig] = useConfig();
  const [form, setForm] = useState(config);

  const save = () => {
    setConfig(form);
    toast.success("Configurações salvas!");
  };

  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Personalize o seu CRM</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Perfil do Consultor</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Nome</Label><Input value={form.consultorNome} onChange={(e) => setForm({ ...form, consultorNome: e.target.value })} /></div>
          <div><Label>E-mail</Label><Input value={form.consultorEmail} onChange={(e) => setForm({ ...form, consultorEmail: e.target.value })} /></div>
          <div><Label>WhatsApp</Label><Input value={form.whatsappNumero} onChange={(e) => setForm({ ...form, whatsappNumero: e.target.value })} /></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Metas</CardTitle></CardHeader>
        <CardContent>
          <Label>Meta Mensal (R$)</Label>
          <Input type="number" value={form.metaMensal} onChange={(e) => setForm({ ...form, metaMensal: Number(e.target.value) })} />
        </CardContent>
      </Card>
      <Button onClick={save}>Salvar alterações</Button>
    </div>
  );
}
