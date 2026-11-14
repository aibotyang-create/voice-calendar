import test from 'node:test';
import assert from 'node:assert/strict';
import {initMissedTodos} from '../public/missed-todos.js';
const {parseHTML}=await import(process.env.DOM_TEST_MODULE||'linkedom');
test('weekly task entry saves to submission day and appears immediately, including across midnight',async()=>{
 const {document}=parseHTML('<section></section>');globalThis.document=document;let day='2026-11-14',saved;
 const store={watchBacklogTodos:fn=>{fn([]);return ()=>{};},watchMissedDismissals:fn=>{fn([]);return ()=>{};},watchTodos:(date,fn)=>{fn([]);return ()=>{};},saveBacklogTodo:async item=>saved=item};
 initMissedTodos({host:document.querySelector('section'),getData:()=>({store}),today:()=>day,onError:e=>{throw e;}}).render();
 day='2026-11-15';const input=document.querySelector('.weekly-todo-add input');input.value='새로 등록한 할 일';await document.querySelector('form').onsubmit({preventDefault(){}});
 assert.equal(saved.date,'2026-11-15');assert.equal(saved.done,false);assert.equal(saved.archived,true);assert.equal(input.value,'');assert.match(document.querySelector('.missed-todo-list').textContent,/새로 등록한 할 일/);assert.equal(document.querySelector('.missed-todo-body small').textContent,'11/15');
});
