import { useEffect, useRef, useState } from "react";
import { BellRing, Check, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTarefas } from "@/lib/store";
import type { Tarefa } from "@/lib/types";

const CHECK_INTERVAL_MS = 15_000;
const EARLY_WINDOW_MS = 5 * 60_000;
const SNOOZE_MS = 5 * 60_000;

type ReminderItem = { task: Tarefa; key: string };

function storageKey(task: Tarefa) {
  return `contemplacrm:reminder:${task.id}:${new Date(task.data).getTime()}`;
}

function readNumber(key: string, fallback = 0) {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function ReminderWatcher() {
  const [tasks, saveTasks] = useTarefas();
  const [active, setActive] = useState<ReminderItem | null>(null);
  const activeRef = useRef<ReminderItem | null>(null);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const checkReminders = () => {
      if (activeRef.current) return;
      const now = Date.now();

      const due = tasks
        .filter((task) => task.lembrete && !task.concluida && !!task.data)
        .map((task) => ({ task, timestamp: new Date(task.data).getTime(), key: storageKey(task) }))
        .filter(({ timestamp }) =>
          Number.isFinite(timestamp) &&
          timestamp > now &&
          now >= timestamp - EARLY_WINDOW_MS
        )
        .sort((a, b) => a.timestamp - b.timestamp);

      for (const item of due) {
        const shownKey = `${item.key}:shown`;
        const snoozeKey = `${item.key}:snooze-until`;
        const snoozeCountKey = `${item.key}:snooze-count`;
        const shown = readNumber(shownKey);
        const snoozeUntil = readNumber(snoozeKey);
        const snoozeCount = readNumber(snoozeCountKey);

        if (shown) continue;
        if (snoozeUntil > now) continue;

        // After one five-minute snooze, show the reminder once more and close its cycle.
        if (snoozeCount >= 1) {
          try {
            localStorage.setItem(shownKey, "1");
            localStorage.removeItem(snoozeKey);
          } catch {
            // The in-memory alert still works if browser storage is unavailable.
          }
        }

        const reminder = { task: item.task, key: item.key };
        activeRef.current = reminder;
        setActive(reminder);
        return;
      }
    };

    checkReminders();
    const interval = window.setInterval(checkReminders, CHECK_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") checkReminders();
    };
    window.addEventListener("focus", checkReminders);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", checkReminders);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [tasks]);

  const dismiss = () => {
    activeRef.current = null;
    setActive(null);
  };

  const complete = () => {
    if (!active) return;
    saveTasks((previous) => previous.map((task) =>
      task.id === active.task.id ? { ...task, concluida: true } : task
    ));
    try {
      localStorage.setItem(`${active.key}:shown`, "1");
      localStorage.removeItem(`${active.key}:snooze-until`);
    } catch {
      // Completion is persisted by the CRM independently of reminder bookkeeping.
    }
    dismiss();
  };

  const snooze = () => {
    if (!active) return;
    const snoozeKey = `${active.key}:snooze-until`;
    const countKey = `${active.key}:snooze-count`;
    try {
      localStorage.setItem(snoozeKey, String(Date.now() + SNOOZE_MS));
      localStorage.setItem(countKey, "1");
    } catch {
      // If storage is unavailable, dismiss this display without changing the task.
    }
    dismiss();
  };

  return (
    <Dialog open={!!active} onOpenChange={() => undefined}>
      <DialogContent
        className="max-w-md border border-red-300/40 bg-red-700/80 text-white shadow-2xl shadow-red-950/30 backdrop-blur-md [&>button]:hidden"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2 text-red-100">
            <BellRing className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">Lembrete de tarefa</span>
          </div>
          <DialogTitle className="text-xl text-white">{active?.task.titulo}</DialogTitle>
          <DialogDescription className="text-red-100">
            {active?.task.cliente ? `Lead: ${active.task.cliente} · ` : ""}
            {active?.task.tipo}
          </DialogDescription>
        </DialogHeader>
        {active?.task.descricao && (
          <p className="rounded-lg border border-white/15 bg-black/10 p-3 text-sm text-white/95">
            {active.task.descricao}
          </p>
        )}
        {active?.task.data && (
          <p className="flex items-center gap-2 text-sm text-red-50">
            <Clock3 className="h-4 w-4" />
            {new Date(active.task.data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
          </p>
        )}
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={snooze}>
            <Clock3 className="mr-2 h-4 w-4" /> Adiar 5 min
          </Button>
          <Button className="bg-white text-red-800 hover:bg-red-50" onClick={complete}>
            <Check className="mr-2 h-4 w-4" /> Concluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
