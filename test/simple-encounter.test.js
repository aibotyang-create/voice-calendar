import test from 'node:test';
import assert from 'node:assert/strict';
import {simpleContactRequest,contactRequestPlan,preserveContactRequest} from '../public/contact-intents.js';
import {validateContactImport,prepareContactImport,saveContactImports} from '../public/contact-import.js';
import {validatePlan} from '../public/vault-data.js';

test('exact reported request passes assistant plan, extraction and writes both new contact and yesterday encounter',async()=>{
  const text='박철수 어제 만났어. 등록해줘.',today='2026-11-14';
  const plan=validatePlan(contactRequestPlan(text,today));assert.equal(plan.actions[0].text,text);
  const parsed=validateContactImport({contacts:simpleContactRequest(plan.actions[0].text,today)},text);
  const entries=await prepareContactImport(parsed,[],[],'same-request',today),writes=[];
  const fs={doc:(_, ...path)=>path.join('/'),serverTimestamp:()=>1,runTransaction:async(_,fn)=>fn({get:async()=>({exists:()=>false}),set:(path,data)=>writes.push({path,data})})};
  await saveContactImports(fs,{},['users','owner'],entries);
  assert.equal(writes.length,2);assert.equal(writes[0].data.name,'박철수');assert.equal(writes[0].data.lastContact,'2026-11-13');
  assert.equal(writes[1].data.date,'2026-11-13');assert.equal(writes[1].data.contactId,entries[0].id);assert.match(writes[1].data.text,/박철수/);
});
test('relative encounter dates, participants and original request survive planning',()=>{
  assert.deepEqual(simpleContactRequest('나 어제 박철수, 김현수 만났어','2026-03-01').map(p=>[p.name,p.lastContact]),[['박철수','2026-02-28'],['김현수','2026-02-28']]);
  assert.equal(simpleContactRequest('박철수 내일 만날거야','2026-11-14'),null);
  const text='박철수 어제 만났어. 등록해줘.';
  assert.equal(preserveContactRequest({question:'',actions:[{kind:'contact',text:'인맥 등록'}]},text).actions[0].text,text);
});
