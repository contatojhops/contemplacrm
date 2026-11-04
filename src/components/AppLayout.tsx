import { useEffect } from "react";
import { useConfig } from "@/lib/store";
import { Outlet } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
import { FloatingActionButton } from "./FloatingActionButton";
import { Toaster } from "@/components/ui/sonner";

export function AppLayout() {
  const [config] = useConfig();
  useEffect(() => { document.documentElement.classList.toggle("dark", !!config.darkMode); }, [config.darkMode]);
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopNavbar />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <FloatingActionButton />
      <Toaster richColors position="top-right" />
    </div>
  );
}
