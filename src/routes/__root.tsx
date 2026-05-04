import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Consórcio CRM" },
      { name: "description", content: "CRM para consultores de consórcio" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: () => <AppLayout />,
  notFoundComponent: () => (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
    </div>
  ),
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}
