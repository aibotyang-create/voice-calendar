import test from 'node:test';
import assert from 'node:assert/strict';
import {moveTodoIds} from '../public/todo-reorder.js';
import {dailyTodoItems,nextTodoOrder} from '../public/people-data.js';
import {resolveEventColor} from '../public/calendar.js';
import {buildManualEvent} from '../public/event-editor.js';
test('할 일을 위·아래로 옮기고 기존 입력 목록을 변경하지 않는다',()=>{
  const ids=['a','b','c'];assert.deepEqual(moveTodoIds(ids,'c','a'),['c','a','b']);assert.deepEqual(moveTodoIds(ids,'a','c',true),['b','c','a']);assert.deepEqual(ids,['a','b','c']);assert.deepEqual(moveTodoIds(ids,'missing','a'),ids);
});
test('저장된 순서를 우선하고 이전 할 일과 새 항목을 뒤에 유지한다',()=>{
  const date='2026-11-06',data=[{id:'old',date,createdAt:100},{id:'a',date,createdAt:200,order:1},{id:'b',date,createdAt:300,order:0}];
  assert.deepEqual(dailyTodoItems(data,date).map(t=>t.id),['b','a','old']);assert.equal(nextTodoOrder(data,date),101);
});
test('Google 일정 색상이 우선하며 기본 일정은 캘린더 색상을 상속한다',()=>{
  const palette={'3':{background:'#abcdef',foreground:'#123456'}},calendar={background:'#445566',foreground:'#ffffff'};
  assert.deepEqual(resolveEventColor({colorId:'3'},palette,calendar),palette['3']);assert.deepEqual(resolveEventColor({},palette,calendar),calendar);assert.equal(resolveEventColor({colorId:'99'},palette,calendar).background,'#445566');
});
test('직접 추가할 일정은 Google 시간대·색상·재시도 ID를 유지하고 시간 역전을 거절한다',()=>{
  const values={title:' 미팅 ',start:'2030-06-12T15:00',end:'2030-06-12T16:00',location:'강남',description:'자료 준비',reminder:'30',colorId:'3'};
  const event=buildManualEvent(values,'abc123');assert.equal(event.id,'abc123');assert.equal(event.summary,'미팅');assert.equal(event.colorId,'3');assert.equal(event.start.dateTime,'2030-06-12T15:00:00+09:00');assert.equal(event.reminders.overrides[0].minutes,30);
  assert.throws(()=>buildManualEvent({...values,end:values.start},'abc123'));
});
