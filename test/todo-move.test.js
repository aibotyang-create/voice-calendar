import {test} from 'node:test';
import assert from 'node:assert/strict';
import {todoMoveTargets,moveStoredTodo} from '../public/todo-move.js';

test('move targets use Seoul today and handle month rollover',()=>{
  const now=Date.parse('2026-11-30T16:00:00Z');
  assert.deepEqual(todoMoveTargets('2026-12-01',now),[{date:'2026-12-02',label:'내일로 이동'}]);
  assert.deepEqual(todoMoveTargets('2026-11-30',now).map(x=>x.date),['2026-12-01','2026-12-02']);
});

test('move patches date and order without overwriting completed task or edited text',async()=>{
  let patch;
  const fs={collection:()=>0,where:()=>0,limit:()=>0,query:()=>0,doc:()=>0,
    getDocs:async()=>({docs:[{id:'other',data:()=>({date:'2026-11-15',order:8})}]}),
    serverTimestamp:()=>123,runTransaction:async(_,fn)=>fn({get:async()=>({exists:()=>true,data:()=>({date:'2026-11-14',done:true,text:'새 내용'})}),update:(_,data)=>{patch=data;}})};
  await moveStoredTodo(fs,{},['users','owner'],'task','2026-11-15');
  assert.deepEqual(patch,{date:'2026-11-15',order:9,updatedAt:123});
});
