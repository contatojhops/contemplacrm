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
} from "lucide-react";
import { useConfig } from "@/lib/store";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads & Pipeline", icon: Target },
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
  const initials = config.consultorNome.split(" ").map((n) => n[0]).slice(0, 2).join("");

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold">
            C
          </div>
          <div>
            <div className="font-semibold text-sm">Consórcio CRM</div>
            <div className="text-xs text-sidebar-foreground/60">Gestão de Vendas</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((it) => {
          const active = it.to === "/" ? path === "/" : path.startsWith(it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <it.icon className="h-4 w-4" />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-sidebar-primary flex items-center justify-center font-semibold text-sidebar-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{config.consultorNome}</div>
            <div className="text-xs text-sidebar-foreground/60 truncate">Consultor de Consórcio</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
