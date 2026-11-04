import { pageHead } from "@/lib/metadata";
import { DELETE_CONFIRMATION } from "@/lib/crm";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfig, useLeads } from "@/lib/store";
import { toast } from "sonner";
import { Plus, Trash2, Copy, ChevronUp, ChevronDown } from "lucide-react";
import type { EtapaItem, TagItem, Template } from "@/lib/types";

export const Route = createFileRoute("/configuracoes")({ head: () => pageHead("Configurações", "Preferências e perfil do consultor."), component: ConfigPage });

function ConfigPage() {
  const [config, setConfig] = useConfig();
  const [form, setForm] = useState(config);
  const [leads] = useLeads();
  useEffect(() => setForm(config), [config]);
  const [novaEtapa, setNovaEtapa] = useState("");
  const [novoProduto, setNovoProduto] = useState("");
  const [novaOrigem, setNovaOrigem] = useState("");
  const [novaTag, setNovaTag] = useState({ nome: "", cor: "#3b82f6" });
  const [novoTemplate, setNovoTemplate] = useState<Template>({ id: "", nome: "", canal: "WhatsApp", texto: "" });

  const save = () => { if (!form.consultorNome.trim() || [form.metaMensal, form.taxaAdmin, form.fundoReserva, form.comissao].some(v => !Number.isFinite(v) || v < 0)) { toast.error("Confira os campos do consultor e os valores."); return; } setConfig(form); toast.success("Configurações salvas!"); };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => setForm({ ...form, consultorFoto: r.result as string });
    r.readAsDataURL(f);
  };

  const moveEtapa = (i: number, dir: -1 | 1) => {
    const arr = [...(form.etapas ?? [])];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setForm({ ...form, etapas: arr });
  };

  const addEtapa = () => {
    if (!novaEtapa.trim()) return;
    const nova: EtapaItem = { id: `e_${Date.now()}`, nome: novaEtapa.trim() };
    setForm({ ...form, etapas: [...(form.etapas ?? []), nova] });
    setNovaEtapa("");
  };

  const removeEtapa = (id: string) => {
    if (!confirm(DELETE_CONFIRMATION)) return;
    if (leads.some(l => l.etapa === form.etapas?.find(e => e.id === id)?.nome)) { toast.error("Mova os leads desta etapa antes de excluí-la."); return; }
    setForm({ ...form, etapas: (form.etapas ?? []).filter((e) => e.id !== id || e.fixa) });
  };

  return (
    <div className="p-6 space-y-4 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Personalize seu CRM</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Perfil do Consultor</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2 flex items-center gap-4">
            {form.consultorFoto && <img src={form.consultorFoto} alt="Foto" className="h-16 w-16 rounded-full object-cover" />}
            <div><Label>Foto</Label><Input type="file" accept="image/*" onChange={handlePhoto} /></div>
          </div>
          <div><Label>Nome</Label><Input value={form.consultorNome} onChange={(e) => setForm({ ...form, consultorNome: e.target.value })} /></div>
          <div><Label>E-mail</Label><Input value={form.consultorEmail} onChange={(e) => setForm({ ...form, consultorEmail: e.target.value })} /></div>
          <div><Label>Telefone</Label><Input value={form.consultorTelefone ?? ""} onChange={(e) => setForm({ ...form, consultorTelefone: e.target.value })} /></div>
          <div><Label>Cargo</Label><Input value={form.consultorCargo ?? ""} onChange={(e) => setForm({ ...form, consultorCargo: e.target.value })} /></div>
          <div><Label>Meta Mensal de Receita (R$)</Label><Input type="number" value={form.metaMensal} onChange={(e) => setForm({ ...form, metaMensal: Number(e.target.value) })} /></div>
          <div><Label>Meta Mensal de Vendas</Label><Input type="number" value={form.metaUnidades ?? 0} onChange={(e) => setForm({ ...form, metaUnidades: Number(e.target.value) })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Configurações do Simulador</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><Label>Taxa Admin (%)</Label><Input type="number" step="0.1" value={form.taxaAdmin} onChange={(e) => setForm({ ...form, taxaAdmin: Number(e.target.value) })} /></div>
          <div><Label>Fundo Reserva (%)</Label><Input type="number" step="0.1" value={form.fundoReserva} onChange={(e) => setForm({ ...form, fundoReserva: Number(e.target.value) })} /></div>
          <div><Label>Comissão (%)</Label><Input type="number" step="0.1" value={form.comissao} onChange={(e) => setForm({ ...form, comissao: Number(e.target.value) })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pipeline — Etapas</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(form.etapas ?? []).map((et, i) => (
            <div key={et.id} className="flex items-center gap-2">
              <Input value={et.nome} onChange={(e) => {
                const arr = [...(form.etapas ?? [])]; arr[i] = { ...arr[i], nome: e.target.value };
                setForm({ ...form, etapas: arr });
              }} disabled={et.fixa} />
              <Button size="icon" variant="ghost" onClick={() => moveEtapa(i, -1)}><ChevronUp className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => moveEtapa(i, 1)}><ChevronDown className="h-4 w-4" /></Button>
              {et.fixa ? <Badge variant="secondary">Fixa</Badge> : <Button size="icon" variant="ghost" onClick={() => removeEtapa(et.id)}><Trash2 className="h-4 w-4" /></Button>}
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <Input placeholder="Nova etapa" value={novaEtapa} onChange={(e) => setNovaEtapa(e.target.value)} />
            <Button onClick={addEtapa}><Plus className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Produtos</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(form.produtosAtivos ?? []).map((p, i) => (
            <div key={i} className="flex items-center justify-between border rounded p-2">
              <Input className="border-0 max-w-xs" value={p.nome} onChange={(e) => {
                const arr = [...(form.produtosAtivos ?? [])]; arr[i] = { ...arr[i], nome: e.target.value };
                setForm({ ...form, produtosAtivos: arr });
              }} />
              <div className="flex items-center gap-2">
                <Switch checked={p.ativo} onCheckedChange={(v) => {
                  const arr = [...(form.produtosAtivos ?? [])]; arr[i] = { ...arr[i], ativo: v };
                  setForm({ ...form, produtosAtivos: arr });
                }} />
                <Button size="icon" variant="ghost" onClick={() => confirm(DELETE_CONFIRMATION) && setForm({ ...form, produtosAtivos: (form.produtosAtivos ?? []).filter((_, k) => k !== i) })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <Input placeholder="Novo produto" value={novoProduto} onChange={(e) => setNovoProduto(e.target.value)} />
            <Button onClick={() => { if (!novoProduto.trim()) return; setForm({ ...form, produtosAtivos: [...(form.produtosAtivos ?? []), { nome: novoProduto.trim(), ativo: true }] }); setNovoProduto(""); }}><Plus className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Origens de Lead</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(form.origens ?? []).map((o, i) => (
            <div key={i} className="flex items-center justify-between border rounded p-2">
              <span className="text-sm">{o}</span>
              <Button size="icon" variant="ghost" onClick={() => confirm(DELETE_CONFIRMATION) && setForm({ ...form, origens: (form.origens ?? []).filter((_, k) => k !== i) })}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input placeholder="Nova origem" value={novaOrigem} onChange={(e) => setNovaOrigem(e.target.value)} />
            <Button onClick={() => { if (!novaOrigem.trim()) return; setForm({ ...form, origens: [...(form.origens ?? []), novaOrigem.trim()] }); setNovaOrigem(""); }}><Plus className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tags Customizáveis</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {(form.tags ?? []).map((t) => (
              <div key={t.id} className="flex items-center gap-1 border rounded-full pl-2 pr-1 py-1">
                <span className="h-3 w-3 rounded-full" style={{ background: t.cor }} />
                <span className="text-xs">{t.nome}</span>
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => confirm(DELETE_CONFIRMATION) && setForm({ ...form, tags: (form.tags ?? []).filter((x) => x.id !== t.id) })}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1"><Label>Nome</Label><Input value={novaTag.nome} onChange={(e) => setNovaTag({ ...novaTag, nome: e.target.value })} /></div>
            <div><Label>Cor</Label><Input type="color" value={novaTag.cor} onChange={(e) => setNovaTag({ ...novaTag, cor: e.target.value })} className="w-16 p-1 h-9" /></div>
            <Button onClick={() => { if (!novaTag.nome.trim()) return; const nt: TagItem = { id: `tg_${Date.now()}`, nome: novaTag.nome.trim(), cor: novaTag.cor }; setForm({ ...form, tags: [...(form.tags ?? []), nt] }); setNovaTag({ nome: "", cor: "#3b82f6" }); }}><Plus className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Templates de Mensagem</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Variáveis: {"{nome} {produto} {valor_carta} {parcela}"}</p>
          {(form.templates ?? []).map((t) => (
            <div key={t.id} className="border rounded p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{t.nome} <Badge variant="secondary" className="ml-2">{t.canal}</Badge></div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(t.texto).then(() => toast.success("Copiado!")).catch(() => toast.error("Não foi possível copiar.")); }}><Copy className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => confirm(DELETE_CONFIRMATION) && setForm({ ...form, templates: (form.templates ?? []).filter((x) => x.id !== t.id) })}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t.texto}</p>
            </div>
          ))}
          <div className="border rounded p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Nome" value={novoTemplate.nome} onChange={(e) => setNovoTemplate({ ...novoTemplate, nome: e.target.value })} />
              <Select value={novoTemplate.canal} onValueChange={(v) => setNovoTemplate({ ...novoTemplate, canal: v as "WhatsApp" | "Instagram" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="WhatsApp">WhatsApp</SelectItem><SelectItem value="Instagram">Instagram</SelectItem></SelectContent>
              </Select>
            </div>
            <Textarea placeholder="Mensagem..." value={novoTemplate.texto} onChange={(e) => setNovoTemplate({ ...novoTemplate, texto: e.target.value })} />
            <Button size="sm" onClick={() => { if (!novoTemplate.nome.trim() || !novoTemplate.texto.trim()) return; setForm({ ...form, templates: [...(form.templates ?? []), { ...novoTemplate, id: `tp_${Date.now()}` }] }); setNovoTemplate({ id: "", nome: "", canal: "WhatsApp", texto: "" }); }}><Plus className="h-4 w-4 mr-1" />Novo Template</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Aparência</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between">
          <Label>Modo escuro</Label>
          <Switch checked={form.darkMode ?? false} onCheckedChange={(v) => { setForm({ ...form, darkMode: v }); document.documentElement.classList.toggle("dark", v); }} />
        </CardContent>
      </Card>

      <div className="sticky bottom-4 flex justify-end">
        <Button size="lg" onClick={save}>Salvar alterações</Button>
      </div>
    </div>
  );
}
