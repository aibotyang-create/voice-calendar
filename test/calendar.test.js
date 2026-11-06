import test from 'node:test';
import assert from 'node:assert/strict';
import {monthRange,eventDays,seoulDay,calendarUrl} from '../public/calendar.js';
import {cleanContact,matchPeople,contactAge} from '../public/people-data.js';
test('서울 날짜와 월 경계를 UTC와 무관하게 계산한다',()=>{
  assert.equal(seoulDay('2026-11-05T16:00:00Z'),'2026-11-06');
  assert.equal(monthRange(2024,1).days,29);
  assert.equal(monthRange(2026,11).end,'2026-12-31T15:00:00.000Z');
});
test('Google 종료 날짜는 제외하고 자정까지의 일정을 확장한다',()=>{
  assert.deepEqual(eventDays({start:{date:'2026-11-06'},end:{date:'2026-11-08'}}),['2026-11-06','2026-11-07']);
  assert.deepEqual(eventDays({start:{dateTime:'2026-11-06T23:00:00+09:00'},end:{dateTime:'2026-11-07T00:00:00+09:00'}}),['2026-11-06']);
});
test('일정과 인맥은 이름 또는 참석자 이메일로 연결하고 보관한 인맥은 제외한다',()=>{
  const contacts=[{id:'1',name:'김민수',email:'kim@example.com'},{id:'2',name:'박서연',email:'park@example.com'},{id:'3',name:'이수진',archived:true}];
  assert.deepEqual(matchPeople({summary:'김민수님 미팅',attendees:[{email:'PARK@example.com'}]},contacts).map(p=>p.id),['1','2']);
  assert.equal(matchPeople({summary:'이수진 미팅'},contacts).length,0);
});
test('인맥 입력 길이와 범위를 제한하고 URL은 Google HTTPS만 허용한다',()=>{
  const p=cleanContact({name:'  민수  ',strength:99,category:'unknown',notes:'a'.repeat(5000)});
  assert.equal(p.name,'민수');assert.equal(p.strength,5);assert.equal(p.category,'지인');assert.equal(p.notes.length,4000);
  assert.equal(contactAge(''),null);assert.equal(calendarUrl('javascript:alert(1)'),'https://calendar.google.com/');
});
