import test from 'node:test';
import assert from 'node:assert/strict';
import {missedTodos,initMissedTodos} from '../public/missed-todos.js';
const {parseHTML}=await import(process.env.DOM_TEST_MODULE||'linkedom');
test('missed list includes all seven-day unchecked rows without deduplicating or limiting to four',()=>{
 const rows=Array.from({length:12},(_,i)=>({id:String(i),date:'2026-11-07',text:'할 일 '+i,createdAt:i}));
 assert.equal(missedTodos([...rows,{id:'done',date:'2026-11-13',done:true},{id:'archived',date:'2026-11-12',archived:true},{id:'old',date:'2026-11-06'},{id:'today',date:'2026-11-14'}],'2026-11-14').length,12);
});
test('panel watches each past day and moves original tasks to today, tomorrow and saved archive',async()=>{
 const {document}=parseHTML('<div id="host"></div>');globalThis.document=document;const watched=[],moves=[];
 const store={watchBacklogTodos:fn=>{fn([]);return ()=>{};},watchMissedDismissals:fn=>{fn([]);return ()=>{};},watchTodos:(date,callback)=>{watched.push(date);callback(date==='2026-11-13'?[{id:'original',text:'놓친 일',date,done:false}]:[]);return ()=>{};},moveTodo:async(id,date)=>moves.push({id,date}),archiveTodo:async id=>moves.push({id,archive:true})};
 for(const index of [0,1,2]){document.getElementById('host').replaceChildren();initMissedTodos({host:document.getElementById('host'),getData:()=>({store}),today:()=> '2026-11-14',onError:e=>{throw e;}}).render();const buttons=document.querySelectorAll('.missed-todo-actions button');assert.equal(buttons.length,4);await buttons[index].onclick();assert.equal(document.querySelectorAll('.missed-todo-row').length,0);}
 assert.deepEqual(moves,[{id:'original',date:'2026-11-14'},{id:'original',date:'2026-11-15'},{id:'original',archive:true}]);assert.equal(new Set(watched).size,7);assert.ok(watched.includes('2026-11-07'));assert.ok(!watched.includes('2026-11-14'));
});

test('weekly panel preserves saved parent-child order and indentation instead of creation order',async()=>{
 const {document}=parseHTML('<div id="host"></div>');globalThis.document=document;const moves=[];
 const rows=[{id:'child2',text:'\t· 두번째 자식',date:'2026-11-13',order:2,createdAt:300},{id:'next',text:'다른 부모',date:'2026-11-13',order:3,createdAt:400},{id:'parent',text:'상위 항목',date:'2026-11-13',order:0,createdAt:100},{id:'child1',text:'\t· 첫번째 자식',date:'2026-11-13',order:1,createdAt:200}];
 const store={watchBacklogTodos:fn=>{fn([]);return ()=>{};},watchMissedDismissals:fn=>{fn([]);return ()=>{};},watchTodos:(date,fn)=>{fn(date==='2026-11-13'?rows:[]);return ()=>{};},moveTodo:async(id,date)=>moves.push([id,date])};
 initMissedTodos({host:document.getElementById('host'),getData:()=>({store}),today:()=> '2026-11-14',onError:e=>{throw e;}}).render();
 const rendered=[...document.querySelectorAll('.missed-todo-row')];assert.deepEqual(rendered.map(r=>r.dataset.todoId),['parent','child1','child2','next']);assert.equal(rendered[1].querySelector('.missed-todo-body span').style.paddingLeft,'22px');
 await rendered[0].querySelector('button').onclick();assert.deepEqual([...document.querySelectorAll('.missed-todo-row')].map(r=>r.dataset.todoId),['next']);assert.deepEqual(moves,[['parent','2026-11-14']]);
});
