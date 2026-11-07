import { useRef, useState } from "react";
import { LeadImportDialog } from "@/components/LeadImportDialog";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { importCollections, readLocalData, snapshot, validateBackup } from "@/lib/cloudStore";

export function DataSection() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ReturnType<typeof validateBackup> | null>(null);
  const [busy, setBusy] = useState(false);
  const [leadImportOpen, setLeadImportOpen] = useState(false);

  const importLocal = async () => {
    const local = readLocalData();
    if (!local.total && !local.config) { toast.info("Nenhum dado encontrado neste navegador."); return; }
    setBusy(true);
    try { const n = await importCollections(local.collections, local.config); toast.success(`${n} registros importados.`); }
    catch { toast.error("Não foi possível importar. Verifique sua conexão e tente novamente."); }
    finally { setBusy(false); }
  };
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ versao: 1, exportadoEm: new Date().toISOString(), ...snapshot() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `backup-crm-${new Date().toLocaleDateString("sv-SE")}.json`; a.click(); URL.revokeObjectURL(url);
  };
  const pickFile = async (file: File) => {
    try { setPending(validateBackup(JSON.parse(await file.text()))); }
    catch (e) { toast.error(e instanceof SyntaxError ? "Arquivo JSON inválido." : (e as Error).message); }
  };
  const restore = async () => {
    if (!pending) return;
    setBusy(true);
    try { const n = await importCollections(pending.collections, pending.config, true); toast.success(`Backup restaurado: ${n} registros.`); setPending(null); }
    catch { toast.error("Não foi possível restaurar. Verifique sua conexão e tente novamente."); }
    finally { setBusy(false); }
  };
  const count = pending ? Object.values(pending.collections).reduce((s, a) => s + (a?.length ?? 0), 0) : 0;

  return (
    <Card>
      <CardHeader><CardTitle>Dados</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="default" onClick={() => setLeadImportOpen(true)} disabled={busy}><Upload className="h-4 w-4 mr-2" />Importar leads da planilha</Button>
          <Button variant="outline" onClick={importLocal} disabled={busy}>Importar dados deste navegador</Button>
          <Button variant="outline" onClick={exportBackup}>Exportar backup (JSON)</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>Restaurar backup (JSON)</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void pickFile(f); e.target.value = ""; }} />
        </div>
        {pending && (
          <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm space-y-2">
            <p>O backup tem {count} registros{pending.config ? " e configurações" : ""}. Registros com o mesmo identificador serão substituídos. Confirmar restauração?</p>
            <div className="flex gap-2"><Button size="sm" onClick={restore} disabled={busy}>Confirmar restauração</Button><Button size="sm" variant="outline" onClick={() => setPending(null)}>Cancelar</Button></div>
          </div>
        )}
      </CardContent>
      <LeadImportDialog open={leadImportOpen} onOpenChange={setLeadImportOpen} />
    </Card>
  );
}
