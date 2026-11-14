import test from 'node:test';
import assert from 'node:assert/strict';
import {saveMissedDismissal,MISSED_DISMISSAL_EVENT} from '../public/missed-dismissals.js';
import {initMissedTodos} from '../public/missed-todos.js';
const {parseHTML}=await import(process.env.DOM_TEST_MODULE||'linkedom');
test('dismissal persists outside original todo and survives panel reload, leaving original date and unchecked state',async()=>{
 const {document}=parseHTML('<div id="host"></div>');globalThis.document=document;
 const original={id:'todo-a',text:'아직 하지 않은 일',date:'2026-11-12',done:false,archived:false};let hidden=[];const writes=[];
 const fs={doc:(_, ...path)=>path.join('/'),serverTimestamp:()=>1,setDoc:async(path,data)=>{writes.push({path,data});hidden=[data.label];}};
 const store={watchMissedDismissals:fn=>{fn(hidden);return ()=>{};},watchTodos:(date,fn)=>{fn(date===original.date?[original]:[]);return ()=>{};},hideMissedTodo:id=>saveMissedDismissal(fs,{},['users','owner'],id)};
 const mount=()=>{document.getElementById('host').replaceChildren();initMissedTodos({host:document.getElementById('host'),getData:()=>({store}),today:()=> '2026-11-14',onError:e=>{throw e;}}).render();};mount();
 assert.equal(document.querySelector('.missed-todo-heading h2').textContent,'이번주 할일들');assert.equal(document.querySelector('.missed-todo-today').textContent,'11/14');assert.equal(document.querySelector('.missed-todo-body small').textContent,'11/12');await document.querySelector('.missed-todo-dismiss').onclick();assert.equal(document.querySelectorAll('.missed-todo-row').length,0);mount();assert.equal(document.querySelectorAll('.missed-todo-row').length,0);
 assert.deepEqual(original,{id:'todo-a',text:'아직 하지 않은 일',date:'2026-11-12',done:false,archived:false});assert.match(writes[0].path,/users\/owner\/tasks\/missed-hide-todo-a$/);assert.equal(writes[0].data.eventId,MISSED_DISMISSAL_EVENT);
});
