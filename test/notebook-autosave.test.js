import test from 'node:test';
import assert from 'node:assert/strict';
import {initNotebook} from '../public/vault-notebook.js';
const {parseHTML}=await import(process.env.DOM_TEST_MODULE||'linkedom');

test('notebook autosaves after ten seconds, preserves edits during save and creates a new linked person',async()=>{
  const {window,document,Event}=parseHTML('<html><body><div id="host"></div></body></html>');
  globalThis.document=document;globalThis.window=window;
  Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this._value||''},set(v){this._value=v;}});
  Object.defineProperty(window.HTMLSelectElement.prototype,'options',{configurable:true,get(){return this.querySelectorAll('option');}});
  globalThis.Option=function(text,value){const o=document.createElement('option');o.textContent=text;o.value=value;return o;};
  const original=setTimeout;let tick,release,person;const saved=[];
  globalThis.setTimeout=(fn,ms)=>ms===10000?(tick=fn,{unref(){}}):original(fn,ms);
  const store={saveDocument:async entry=>{saved.push(entry);await new Promise(resolve=>release=resolve);return entry;},save:async value=>{person=value;}};
  try{
    const notebook=initNotebook({host:document.getElementById('host'),getData:()=>({store,contacts:[]}),today:()=> '2026-11-14',activeDay:()=> '2026-11-14',navigate(){},onSaved(){},errorMessage:e=>e.message,markdown(){}});
    notebook.render();
    const text=document.getElementById('noteText');text.value='첫 기록';text.dispatchEvent(new Event('input'));
    const pending=tick();assert.equal(saved.length,1);assert.equal(saved[0].title,'제목 없음');
    assert.equal(text.disabled,false);text.value='저장 중 추가한 기록';text.dispatchEvent(new Event('input'));release();await pending;
    const next=tick();assert.equal(saved[1].content,'저장 중 추가한 기록');assert.equal(saved[1].id,saved[0].id);release();await next;
    document.getElementById('notePersonName').value='새 친구';await document.getElementById('notePersonCreate').onclick();
    assert.equal(person.name,'새 친구');assert.equal(document.getElementById('noteContact').value,person.id);
    const linked=tick();assert.equal(saved[2].contactId,person.id);release();await linked;
  }finally{globalThis.setTimeout=original;}
});
