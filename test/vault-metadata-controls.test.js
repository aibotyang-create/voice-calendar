import test from 'node:test';
import assert from 'node:assert/strict';
import {initNotebook} from '../public/vault-notebook.js';
import {contactSearchResults} from '../public/vault-controls.js';
const {parseHTML}=await import(process.env.DOM_TEST_MODULE||'linkedom');
function setup(){const {window,document,Event}=parseHTML('<html><body><div id="host"></div></body></html>');globalThis.document=document;globalThis.window=window;globalThis.Event=Event;Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this._value||''},set(v){this._value=v;}});Object.defineProperty(window.HTMLSelectElement.prototype,'options',{configurable:true,get(){return this.querySelectorAll('option');}});globalThis.Option=function(text,value){const option=document.createElement('option');option.textContent=text;option.value=value;return option;};return {document,Event};}
test('saved note date opens mini calendar, contact search finds company and saving preserves note content',async()=>{
 const {document,Event}=setup();let saved;
 const contacts=[{id:'p',name:'이종무',company:'테스트 회사'}],store={documentBlob:async()=>new Blob(['내용']),saveDocument:async entry=>{saved=entry;return entry;}};
 const notebook=initNotebook({host:document.getElementById('host'),getData:()=>({store,contacts}),today:()=> '2026-11-14',activeDay:()=> '2026-11-14',navigate(){},onSaved(){},errorMessage:e=>e.message,markdown:(text,host)=>host.textContent=text});notebook.render();
 await notebook.open({id:'note',date:'2026-11-01',title:'기존 노트',content:'보존할 기존 내용',source:'note',mime:'text/markdown',filename:'기존.md'});
 assert.equal(document.getElementById('noteDate').readOnly,false);document.getElementById('noteDatePicker').click();assert.equal(document.querySelector('.vault-date-popover').hidden,false);document.querySelector('button[aria-label="2026-11-15 기록 날짜"]').click();assert.equal(document.getElementById('noteDate').value,'2026-11-15');
 const search=document.getElementById('noteContactSearch');search.value='테스트';search.dispatchEvent(new Event('input'));const result=[...document.querySelectorAll('.vault-contact-results button')].find(b=>b.textContent.includes('이종무'));assert.ok(result);result.click();assert.equal(document.getElementById('noteContact').value,'p');
 await document.getElementById('noteSave').onclick();assert.equal(saved.content,'보존할 기존 내용');assert.equal(saved.date,'2026-11-15');assert.equal(saved.contactId,'p');
});
test('uploaded document date and person edit only metadata and leave original file format intact',async()=>{
 const {document,Event}=setup();let patch;
 const store={documentBlob:async()=>new Blob(['binary']),patchDocument:async(id,value)=>patch={id,...value},saveDocument:()=>{throw Error('must not replace uploaded file');}};
 const notebook=initNotebook({host:document.getElementById('host'),getData:()=>({store,contacts:[]}),today:()=> '2026-11-14',activeDay:()=> '2026-11-14',navigate(){},onSaved(){},errorMessage:e=>e.message,markdown(){}});notebook.render();await notebook.open({id:'uploaded',date:'2026-11-01',title:'보고서',content:'',source:'upload',mime:'application/octet-stream',filename:'보고서.docx',driveFileId:'valid_drive_file_123'});
 document.getElementById('noteDate').value='2026-11-12';document.getElementById('noteDate').dispatchEvent(new Event('input'));await document.getElementById('noteSave').onclick();assert.deepEqual(patch,{id:'uploaded',date:'2026-11-12',contactId:''});assert.equal(document.getElementById('noteTitle').disabled,true);
 assert.deepEqual(contactSearchResults([{id:'a',name:'홍길동',company:'회사'},{id:'b',name:'숨김',company:'회사',archived:true}],'회사').map(p=>p.id),['a']);
});
