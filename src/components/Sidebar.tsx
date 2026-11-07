import { featureEnabled } from "@/lib/features";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Target,
  Users,
  Calendar,
  FileText,
  Briefcase,
  Megaphone,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useConfig } from "@/lib/store";

export const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pipeline/todos", label: "Leads & Pipeline", icon: Target },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/agenda", label: "Agenda & Tarefas", icon: Calendar },
  { to: "/propostas", label: "Propostas & Simulações", icon: FileText },
  { to: "/carteira", label: "Carteira Ativa", icon: Briefcase },
  { to: "/campanhas", label: "Campanhas", icon: Megaphone },
  { to: "/configuracoes", label: "Configurações", icon: SettingsIcon },
];

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [config] = useConfig();
  const initials = (config.consultorNome || "?").split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("");

  return (
    <aside className="hidden lg:flex sticky top-0 h-screen w-64 shrink-0 self-start flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-5 py-6 border-b border-sidebar-border/70">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary font-bold shadow-[0_0_22px_oklch(0.64_0.205_255_/_18%)]">
            <span className="text-lg">C</span>
          </div>
          <div>
            <div className="font-semibold tracking-tight text-[15px]">Contempla<span className="text-primary">CRM</span></div>
            <div className="text-[11px] tracking-wide text-sidebar-foreground/55">GESTÃO INTELIGENTE</div>
          </div>
        </div>
      </div>
      <nav className="min-h-0 flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/40">Menu principal</div>
        {items.filter(it => featureEnabled(it.to)).map((it) => {
          const active = it.to === "/" ? path === "/" : path.startsWith(it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200 ${
                active
                  ? "bg-primary/15 text-foreground border border-primary/25 shadow-[inset_0_0_18px_oklch(0.64_0.205_255_/_8%),0_0_18px_oklch(0.64_0.205_255_/_8%)]"
                  : "border border-transparent text-sidebar-foreground/75 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
              }`}
            >
              <it.icon className={`h-[17px] w-[17px] shrink-0 transition-colors ${active ? "text-primary" : "text-sidebar-foreground/65 group-hover:text-primary"}`} />
              <span className="font-medium">{it.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border/70 p-4">
        <div className="flex items-center gap-3 rounded-xl border border-sidebar-border/70 bg-white/[0.025] p-3">
          <div className="h-9 w-9 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center font-semibold text-primary text-xs">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-medium truncate">{config.consultorNome || "Seu nome"}</div>
            <div className="text-[11px] text-sidebar-foreground/55 truncate">{config.consultorCargo || "Complete seu perfil"}</div>
          </div>
        </div>
        <button type="button" onClick={() => supabase.auth.signOut()} className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-sidebar-foreground/65 transition-colors hover:bg-destructive/10 hover:text-destructive"><LogOut className="h-4 w-4" />Sair da conta</button>
      </div>
    </aside>
  );
}
