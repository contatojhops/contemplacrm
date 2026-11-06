import { describe,it,expect } from 'bun:test';
import { diffCollection, validateBackup } from './cloudStore';
describe('cloud sync',()=>{
 it('upserts only changed items',()=>expect(diffCollection([{id:'a',n:1},{id:'b',n:1}],[{id:'a',n:1},{id:'b',n:2}]).upserts).toEqual([{id:'b',n:2}]));
 it('deletes removed items',()=>expect(diffCollection([{id:'a'},{id:'b'}],[{id:'a'}]).deletes).toEqual(['b']));
 it('rejects backup without CRM data',()=>expect(()=>validateBackup({foo:1})).toThrow());
 it('rejects items without id',()=>expect(()=>validateBackup({leads:[{nome:'x'}]})).toThrow());
});
