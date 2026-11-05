import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/login")({
  head: () => pageHead("Entrar", "Acesse sua conta do Consórcio CRM."),
  component: LoginPage,
});

type Mode = "entrar" | "criar" | "esqueci";

function LoginPage() {
  const [mode, setMode] = useState<Mode>("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw new Error("E-mail ou senha incorretos.");
      } else if (mode === "criar") {
        if (senha.length < 6) throw new Error("A senha precisa ter pelo menos 6 caracteres.");
        const { data, error } = await supabase.auth.signUp({ email, password: senha, options: { emailRedirectTo: window.location.origin } });
        if (error) throw new Error(error.message.includes("registered") ? "Este e-mail já está cadastrado." : "Não foi possível criar a conta. Verifique os dados e tente novamente.");
        if (!data.session) toast.success("Conta criada! Faça login para continuar.");
        else toast.success("Conta criada com sucesso!");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw new Error("Não foi possível enviar o e-mail. Tente novamente.");
        toast.success("Enviamos um link para redefinir sua senha.");
        setMode("entrar");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setBusy(false); }
  };

  const title = mode === "entrar" ? "Entrar" : mode === "criar" ? "Criar conta" : "Esqueci minha senha";
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">C</div>
            <div className="font-semibold">Consórcio CRM</div>
          </div>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            {mode !== "esqueci" && <div className="space-y-1"><Label htmlFor="senha">Senha</Label><Input id="senha" type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} /></div>}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Aguarde..." : mode === "entrar" ? "Entrar" : mode === "criar" ? "Criar conta" : "Enviar link"}</Button>
          </form>
          <div className="mt-4 flex flex-col gap-1 text-sm">
            {mode === "entrar" ? <>
              <button type="button" className="text-primary hover:underline text-left" onClick={() => setMode("criar")}>Criar conta</button>
              <button type="button" className="text-muted-foreground hover:underline text-left" onClick={() => setMode("esqueci")}>Esqueci minha senha</button>
            </> : <button type="button" className="text-primary hover:underline text-left" onClick={() => setMode("entrar")}>Já tenho conta — entrar</button>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
