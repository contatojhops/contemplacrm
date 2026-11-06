import { useEffect, useState } from "react";
import { useConfig } from "@/lib/store";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
import { FloatingActionButton } from "./FloatingActionButton";
import { Toaster } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { reloadAll, setCloudUser, useCloudReady, useCloudError } from "@/lib/cloudStore";
import { LocalImportPrompt } from "./LocalImportPrompt";

const PUBLIC_PATHS = ["/login", "/reset-password"];

export function AppLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [auth, setAuth] = useState<"loading" | "in" | "out">("loading");
  const ready = useCloudReady();
  const cloudError = useCloudError();
  const [config] = useConfig();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      setCloudUser(session?.user.id ?? null);
      setAuth(session ? "in" : "out");
    });
    supabase.auth.getUser().then(({ data }) => {
      setCloudUser(data.user?.id ?? null);
      setAuth(data.user ? "in" : "out");
    });
    const onFocus = () => { void reloadAll(); };
    window.addEventListener("focus", onFocus);
    return () => { sub.subscription.unsubscribe(); window.removeEventListener("focus", onFocus); };
  }, []);

  const isPublic = PUBLIC_PATHS.includes(path);
  useEffect(() => {
    if (auth === "out" && !isPublic) navigate({ to: "/login", replace: true });
    if (auth === "in" && path === "/login") navigate({ to: "/", replace: true });
  }, [auth, isPublic, path, navigate]);
  useEffect(() => { document.documentElement.classList.toggle("dark", !!config.darkMode); }, [config.darkMode]);

  if (isPublic) return <><Outlet /><Toaster richColors position="top-right" /></>;
  if (auth !== "in") return <div className="min-h-screen bg-background" />;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopNavbar />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          {ready ? <Outlet /> : cloudError ? (
            <div className="mx-auto max-w-xl p-6 mt-12 rounded-xl border bg-card text-card-foreground space-y-3" role="alert">
              <h2 className="font-semibold">Não foi possível carregar seus dados</h2>
              <p className="text-sm text-muted-foreground">{cloudError}</p>
              <Button onClick={() => void reloadAll()}>Tentar novamente</Button>
            </div>
          ) : (
            <div className="p-6 space-y-4" aria-label="Carregando dados">
              <Skeleton className="h-9 w-64" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>
              <Skeleton className="h-72" />
            </div>
          )}
        </main>
      </div>
      {ready && <FloatingActionButton />}
      {ready && <LocalImportPrompt />}
      <Toaster richColors position="top-right" />
    </div>
  );
}
