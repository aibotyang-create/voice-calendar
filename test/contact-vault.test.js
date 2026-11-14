import test from 'node:test';
import assert from 'node:assert/strict';
import {initContactVault} from '../public/contact-vault.js';
const {parseHTML}=await import(process.env.DOM_TEST_MODULE||'linkedom');
test('archive section sits below related todos and previews expand over map until close',async()=>{
 const {document}=parseHTML('<html><body><section class="people-view"><div class="network-canvas"><div class="network-wrap">지도</div></div></section><dialog><form><section class="contact-record-section"><h3>관련 할 일</h3></section><div class="person-actions"><button>지금 저장</button></div></form></dialog></body></html>');globalThis.document=document;document.body.dataset.page='people';
 const store={watchContactDocuments:(id,fn)=>{fn([{id:'report',contactId:id,title:'보고서',date:'2026-11-14',source:'note',content:'# 큰 보고서\n문서 내용',mime:'text/markdown'}]);return ()=>{};},documentBlob:async()=>new Blob(['body'])};
 const vault=initContactVault({host:document.querySelector('form'),getData:()=>({store})});vault.openPerson({id:'a'});
 const section=document.querySelector('.contact-vault');assert.equal(section.previousElementSibling.querySelector('h3').textContent,'관련 할 일');assert.equal(section.nextElementSibling.className,'person-actions');
 await document.querySelector('.contact-vault-item').onclick();const canvas=document.querySelector('.network-canvas'),preview=document.querySelector('.contact-vault-preview');assert.equal(preview.parentElement,canvas);assert.equal(canvas.classList.contains('has-vault-preview'),true);assert.match(preview.textContent,/문서 내용/);
 preview.querySelector('button').click();assert.equal(canvas.classList.contains('has-vault-preview'),false);assert.equal(preview.hidden,true);assert.equal(preview.parentElement,section);
});
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
