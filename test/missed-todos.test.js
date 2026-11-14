import test from 'node:test';
import assert from 'node:assert/strict';
import {missedTodoRecommendations,groundedRecommendations} from '../public/recommendations.js';
import {moveStoredTodo} from '../public/todo-move.js';
import {initTodoArchive} from '../public/todo-archive.js';
const {parseHTML}=await import(process.env.DOM_TEST_MODULE||'linkedom');
test('last seven days only excludes completed, archived, duplicate and today tasks with dated evidence',()=>{
 const todos=[{id:'a',date:'2026-11-07',text:'제안서 보내기'},{id:'b',date:'2026-11-06',text:'너무 오래된 할 일'},{id:'c',date:'2026-11-13',text:'완료한 일',done:true},{id:'d',date:'2026-11-12',text:'보관한 일',archived:true},{id:'e',date:'2026-11-13',text:'오늘도 있는 일'},{id:'f',date:'2026-11-14',text:'오늘도 있는 일'}];
 const suggestions=missedTodoRecommendations(todos,'2026-11-14');assert.equal(suggestions.length,1);assert.deepEqual(suggestions[0].sources,['todo:a']);assert.match(suggestions[0].reason,/2026-11-07/);assert.equal(groundedRecommendations(suggestions,{date:'2026-11-14',todos}).length,1);
});
test('archive displays stored tasks and restores selected task to today without changing completion',async()=>{
 const {document}=parseHTML('<section><div class="todo-date-controls"></div></section>');globalThis.document=document;let restored,patch;
 const store={watchArchivedTodos:fn=>{fn([{id:'a',date:'2026-11-10',text:'보관할 일',done:true}]);return ()=>{};},restoreTodo:async(id,date)=>{restored={id,date};}};
 const archive=initTodoArchive({host:document.querySelector('section'),getData:()=>({store}),today:()=> '2026-11-14',onError:e=>{throw e;}});archive.render();document.querySelector('.todo-archive-toggle').click();assert.equal(document.querySelector('.todo-archive-list').hidden,false);await document.querySelector('.todo-archive-row button').onclick();assert.deepEqual(restored,{id:'a',date:'2026-11-14'});
 const fs={collection(){},query(){},where(){},limit(){},doc(){},serverTimestamp:()=>1,getDocs:async()=>({docs:[]}),runTransaction:async(_,fn)=>fn({get:async()=>({exists:()=>true,data:()=>({archived:true,done:true,date:'2026-11-14'})}),update:(_,data)=>patch=data})};
 await moveStoredTodo(fs,{},[],'a','2026-11-14',true);assert.equal(patch.archived,false);assert.equal(patch.date,'2026-11-14');assert.equal('done' in patch,false);
});
