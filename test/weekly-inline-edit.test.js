import test from 'node:test';
import assert from 'node:assert/strict';
import {initMissedTodos} from '../public/missed-todos.js';
import {backlogTodo} from '../public/todo-storage.js';
const {parseHTML}=await import(process.env.DOM_TEST_MODULE||'linkedom');
test('weekly backlog text edits survive realtime redraw and only patch text; Escape cancels',async()=>{
 const {document}=parseHTML('<div id="host"></div>');globalThis.document=document;let emit,patch;
 const idea=backlogTodo({id:'idea',date:'2026-11-14',text:'기존 생각',createdAt:1});
 const store={watchBacklogTodos:fn=>{emit=fn;fn([idea]);return ()=>{};},watchMissedDismissals:fn=>{fn([]);return ()=>{};},watchTodos:(_,fn)=>{fn([]);return ()=>{};},patchTodoText:async(id,text)=>{patch={id,text};emit([{...idea,text}]);}};
 initMissedTodos({host:document.getElementById('host'),getData:()=>({store}),today:()=> '2026-11-14',onError:e=>{throw e;}}).render();
 document.querySelector('.missed-todo-body span').click();let editor=document.querySelector('.weekly-todo-editor');editor.value='수정한 생각';emit([idea]);assert.equal(document.querySelector('.weekly-todo-editor'),editor);await editor.onblur();assert.deepEqual(patch,{id:'idea',text:'수정한 생각'});assert.match(document.querySelector('.missed-todo-list').textContent,/수정한 생각/);assert.equal(idea.date,'2026-11-14');assert.equal(idea.archived,true);
 document.querySelector('.missed-todo-body span').click();editor=document.querySelector('.weekly-todo-editor');editor.value='취소할 내용';editor.onkeydown({key:'Escape',preventDefault(){}});assert.match(document.querySelector('.missed-todo-list').textContent,/수정한 생각/);assert.equal(patch.text,'수정한 생각');
});
