import test from 'node:test';
import assert from 'node:assert/strict';
import {initContactVault} from '../public/contact-vault.js';
const {parseHTML}=await import(process.env.DOM_TEST_MODULE||'linkedom');
test('linked documents filter by person, display inline safely and stop old previews on person switch',async()=>{
 const {document}=parseHTML('<dialog><form id="person"></form></dialog>');globalThis.document=document;
 let selected,emit,resolveOld,unsubscribed=0;
 const store={watchContactDocuments:(id,fn)=>{selected=id;emit=fn;return ()=>unsubscribed++;},documentBlob:async entry=>entry.id==='slow'?new Promise(resolve=>resolveOld=resolve):new Blob([entry.content])};
 const vault=initContactVault({host:document.getElementById('person'),getData:()=>({store})});vault.openPerson({id:'a'});assert.equal(selected,'a');
 emit([{id:'note',contactId:'a',title:'미팅 자료',date:'2026-11-14',source:'note',content:'# 회의\n- [ ] 자료 검토\n<script>unsafe</script>',mime:'text/markdown'},{id:'other',contactId:'b',title:'다른 인맥 문서',date:'2026-11-15'},{id:'archived',contactId:'a',archived:true,date:'2026-11-15'}]);
 assert.equal(document.querySelectorAll('.contact-vault-item').length,1);await document.querySelector('.contact-vault-item').onclick();assert.equal(document.querySelector('.contact-vault-preview').hidden,false);assert.match(document.querySelector('.contact-vault-preview').textContent,/자료 검토/);assert.equal(document.querySelector('.contact-vault-preview script'),null);
 document.querySelector('.contact-vault-preview-head button').click();assert.equal(document.querySelector('.contact-vault-preview').hidden,true);
 emit([{id:'slow',contactId:'a',date:'2026-11-14',title:'늦은 문서',source:'note',content:'늦게 표시되면 안 됨',mime:'text/markdown'}]);const pending=document.querySelector('.contact-vault-item').onclick();vault.openPerson({id:'b'});resolveOld(new Blob(['old']));await pending;assert.equal(document.querySelector('.contact-vault-preview').hidden,true);assert.ok(unsubscribed>=1);
});
