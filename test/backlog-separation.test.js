import test from 'node:test';
import assert from 'node:assert/strict';
import {backlogTodo,isBacklogTodo,isSavedTodo} from '../public/todo-storage.js';
import {dailyTodoItems} from '../public/people-data.js';
import {initMissedTodos} from '../public/missed-todos.js';
const {parseHTML}=await import(process.env.DOM_TEST_MODULE||'linkedom');
test('undated planning ideas keep registration date but never appear in daily tasks or saved archive until explicitly moved',async()=>{
 const idea=backlogTodo({id:'idea',date:'2026-11-14',text:'언젠가 해보고 싶은 것',createdAt:1});
 assert.equal(isBacklogTodo(idea),true);assert.equal(isSavedTodo(idea),false);assert.deepEqual(dailyTodoItems([idea],'2026-11-14'),[]);
 const {document}=parseHTML('<div id="host"></div>');globalThis.document=document;let move;
 const store={watchBacklogTodos:fn=>{fn([idea]);return ()=>{};},watchMissedDismissals:fn=>{fn([]);return ()=>{};},watchTodos:(date,fn)=>{assert.notEqual(date,'2026-11-14');fn([]);return ()=>{};},restoreTodo:async(id,date)=>move={id,date}};
 initMissedTodos({host:document.getElementById('host'),getData:()=>({store}),today:()=> '2026-11-14',onError:e=>{throw e;}}).render();
 assert.match(document.querySelector('.missed-todo-list').textContent,/언젠가/);await document.querySelector('.missed-todo-actions button').onclick();assert.deepEqual(move,{id:'idea',date:'2026-11-14'});assert.equal(document.querySelectorAll('.missed-todo-row').length,0);
});
