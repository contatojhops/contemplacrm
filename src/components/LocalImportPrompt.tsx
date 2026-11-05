import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cloudIsEmpty, getCloudUser, importCollections, readLocalData } from "@/lib/cloudStore";

export function LocalImportPrompt() {
  const [open, setOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const key = `crm_import_offer_${getCloudUser()}`;
  useEffect(() => {
    if (localStorage.getItem(key)) return;
    const local = readLocalData();
    if (local.total > 0 && cloudIsEmpty()) { setTotal(local.total); setOpen(true); }
  }, [key]);
  const close = () => { localStorage.setItem(key, "done"); setOpen(false); };
  const run = async () => {
    setBusy(true);
    try {
      const local = readLocalData();
      const n = await importCollections(local.collections, local.config);
      toast.success(`${n} registros importados para sua conta.`);
      close();
    } catch { toast.error("Não foi possível importar. Tente novamente em Configurações › Dados."); }
    finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar dados deste navegador?</DialogTitle>
          <DialogDescription>Encontramos {total} registros salvos neste navegador. Deseja enviá-los para sua conta e acessá-los de qualquer dispositivo?</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={close}>Agora não</Button>
          <Button onClick={run} disabled={busy}>{busy ? "Importando..." : "Importar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
