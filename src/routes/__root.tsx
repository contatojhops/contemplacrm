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
      { property: "og:title", content: "Consórcio CRM" },
      { name: "twitter:title", content: "Consórcio CRM" },
      { property: "og:description", content: "CRM para consultores de consórcio" },
      { name: "twitter:description", content: "CRM para consultores de consórcio" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0a910787-2488-4a20-8568-e45dd23f27a5/id-preview-fac15bee--05a8725a-adda-486d-9d02-9924b3f3c000.lovable.app-1778104904110.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0a910787-2488-4a20-8568-e45dd23f27a5/id-preview-fac15bee--05a8725a-adda-486d-9d02-9924b3f3c000.lovable.app-1778104904110.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
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
