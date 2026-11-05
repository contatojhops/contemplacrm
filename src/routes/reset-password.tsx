import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/reset-password")({
  head: () => pageHead("Redefinir senha", "Crie uma nova senha para o Consórcio CRM."),
  component: ResetPage,
});

function ResetPage() {
  const [senha, setSenha] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (senha.length < 6) { toast.error("A senha precisa ter pelo menos 6 caracteres."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setBusy(false);
    if (error) { toast.error("Link inválido ou expirado. Solicite um novo."); return; }
    toast.success("Senha atualizada!");
    navigate({ to: "/" });
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader><CardTitle>Nova senha</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1"><Label htmlFor="nova">Nova senha</Label><Input id="nova" type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} /></div>
            <Button type="submit" className="w-full" disabled={busy}>Salvar nova senha</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
