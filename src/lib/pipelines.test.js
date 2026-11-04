import { describe,it,expect } from 'bun:test';
import { normalizeLeads,generalPipeline,deletePipeline,metrics,periodRange,leadCsv,ETAPAS } from './pipelines';
const a={...generalPipeline(),id:'a'},b={...generalPipeline(),id:'b',nome:'Evento X'};
const lead={id:'l',pipeline_id:'a',nome:'Contato',etapa:'Proposta Enviada',valorCarta:100000,criadoEm:'2026-11-02',telefone:'11987654321'};
describe('pipelines',()=>{
 it('creates Geral',()=>expect(generalPipeline().nome).toBe('Geral'));
 it('assigns unlinked lead',()=>expect(normalizeLeads([{...lead,pipeline_id:undefined}],[a])[0].pipeline_id).toBe('a'));
 it('shares six stages',()=>expect(ETAPAS).toEqual(['Novo Lead','Contato Realizado','Proposta Enviada','Em Análise','Fechado','Perdido']));
 it('cannot delete last pipeline',()=>expect(()=>deletePipeline([a],[lead],[],'a')).toThrow());
 it('transfers populated pipeline',()=>expect(deletePipeline([a,b],[lead],[],'a','b').leads[0].pipeline_id).toBe('b'));
 it('removes linked tasks with leads',()=>expect(deletePipeline([a,b],[lead],[{lead_id:'l'}],'a').tasks).toEqual([]));
 it('counts both advanced stages',()=>{const r=periodRange('mes',new Date('2026-11-04T12:00:00'));expect(metrics([lead,{...lead,id:'l2',etapa:'Em Análise'}],r.start,r.end).emProposta).toBe(2);});
 it('uses closure date for sales',()=>{const r=periodRange('mes',new Date('2026-11-04T12:00:00'));expect(metrics([{...lead,criadoEm:'2026-01-01',etapa:'Fechado',closed_at:'2026-11-03'}],r.start,r.end).fechado).toBe(100000);});
 it('exports pipeline column',()=>expect(leadCsv([lead],[a])).toContain('"Pipeline"'));
 it('exports pipeline name',()=>expect(leadCsv([{...lead,pipeline_id:'b'}],[a,b])).toContain('"Evento X"'));
});