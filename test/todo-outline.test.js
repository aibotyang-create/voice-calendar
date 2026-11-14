import test from 'node:test';
import assert from 'node:assert/strict';
import {outlineText,encodeOutline,bindTodoOutline} from '../public/todo-outline.js';
const {parseHTML}=await import(process.env.DOM_TEST_MODULE||'linkedom');
test('outline storage retains readable text and depth, and typed bullets become indented subtasks',()=>{
 assert.deepEqual(outlineText(encodeOutline('자료 준비',2)),{depth:2,text:'자료 준비'});assert.equal(encodeOutline('자료 준비',0),'자료 준비');assert.deepEqual(outlineText('· 기존 문장'),{depth:1,text:'기존 문장'});assert.deepEqual(outlineText('\t세부 내용'),{depth:1,text:'세부 내용'});
});
test('Tab indents persisted and draft todos, Shift Tab outdents without changing date or completion',async()=>{
 const {document,Event}=parseHTML('<div id="list"><div data-todo-id="parent"><input class="todo-editor"></div><div data-todo-id="child"><input class="todo-editor" value="자료 준비"></div><input class="todo-draft todo-editor" value="다음 세부 작업"></div>');globalThis.document=document;
 const items=[{id:'parent',text:'회의 준비',done:false,date:'2026-11-14'},{id:'child',text:'자료 준비',done:false,date:'2026-11-14'}],writes=[];
 bindTodoOutline(document.getElementById('list'),{getItems:()=>items,getStore:()=>({patchTodoText:async(id,text)=>writes.push({id,text})}),report(){}});
 const input=document.querySelector('[data-todo-id="child"] input'),draft=document.querySelector('.todo-draft');
 const tab=async(target,shiftKey=false)=>{const event=new Event('keydown',{bubbles:true,cancelable:true});event.key='Tab';event.shiftKey=shiftKey;target.dispatchEvent(event);await Promise.resolve();await Promise.resolve();return event;};
 await tab(input);assert.equal(outlineText(writes[0].text).depth,1);assert.equal(input.closest('div').classList.contains('todo-child'),true);assert.equal(input.value,'자료 준비');
 await tab(draft);assert.equal(draft.dataset.outlineDepth,'1');assert.equal(writes.length,1);
 await tab(input,true);assert.equal(writes[1].text,'자료 준비');assert.equal(input.closest('div').classList.contains('todo-child'),false);assert.equal(items[1].date,'2026-11-14');assert.equal(items[1].done,false);
});
