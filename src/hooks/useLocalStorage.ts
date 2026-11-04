import { useCallback, useEffect, useState } from "react";

const CHANGE_EVENT = "crm-storage-change";
const RESET_KEY = "crm_business_reset_v1";
const BUSINESS = /(?:^|\.)(leads|clientes|tarefas|propostas|campanhas|interacoes|documentos|indicacoes|oportunidades|notificacoes)$/i;

function resetBusinessData() {
  if (localStorage.getItem(RESET_KEY)) return;
  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (/^crm[._]/i.test(key) && BUSINESS.test(key)) localStorage.removeItem(key);
  }
  localStorage.setItem(RESET_KEY, "done");
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const read = useCallback(() => {
    try {
      resetBusinessData();
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : initialValue;
    } catch { return initialValue; }
  }, [key]);
  useEffect(() => {
    setValue(read());
    const sync = () => setValue(read());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(CHANGE_EVENT, sync); window.removeEventListener("storage", sync); };
  }, [read]);
  const save = useCallback((update: T | ((previous: T) => T)) => {
    const previous = read();
    const next = typeof update === "function" ? (update as (previous: T) => T)(previous) : update;
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      throw new Error("Não foi possível salvar. Libere espaço no navegador e tente novamente.");
    }
    setValue(next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, [key, read]);
  return [value, save] as const;
}
