import test from 'node:test';
import assert from 'node:assert/strict';
import {isSavedTodo,savedTodoPatch,dismissedTodoPatch} from '../public/todo-storage.js';
import {initTodoArchive} from '../public/todo-archive.js';
const {parseHTML}=await import(process.env.DOM_TEST_MODULE||'linkedom');
test('explicitly saved tasks remain distinct from old dismissals and remove cleanly from archive',async()=>{
 const old={id:'old',text:'이전에 삭제',date:'2026-11-10',archived:true,order:4};
 let saved={id:'saved',text:'직접 보관',date:'2026-11-11',done:true,...savedTodoPatch()};
 assert.equal(isSavedTodo(old),false);assert.equal(isSavedTodo(saved),true);
 const {document}=parseHTML('<section><div class="todo-date-controls"></div></section>');globalThis.document=document;let emit;
 const store={watchArchivedTodos:fn=>{emit=fn;fn([old,saved]);return ()=>{};},dismissTodo:async id=>{assert.equal(id,'saved');saved={...saved,...dismissedTodoPatch()};emit([old,saved]);}};
 initTodoArchive({host:document.querySelector('section'),getData:()=>({store}),today:()=> '2026-11-14',onError:e=>{throw e;}}).render();
 assert.equal(document.querySelectorAll('.todo-archive-row').length,1);assert.equal(document.querySelector('.todo-archive-row span').textContent,'직접 보관');
 await document.querySelector('.todo-archive-remove').onclick();assert.equal(document.querySelectorAll('.todo-archive-row').length,0);assert.equal(isSavedTodo(saved),false);assert.equal(saved.done,true);
});
