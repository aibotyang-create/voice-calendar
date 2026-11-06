import test from 'node:test';
import assert from 'node:assert/strict';
import {monthRange,eventDays,seoulDay,calendarUrl} from '../public/calendar.js';
import {cleanContact,matchPeople,contactAge,categoryOptions,contactColor,dailyTodoItems} from '../public/people-data.js';
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
  assert.equal(p.name,'민수');assert.equal(p.strength,5);assert.equal(p.category,'unknown');assert.equal(p.notes.length,4000);
  assert.equal(contactAge(''),null);assert.equal(calendarUrl('javascript:alert(1)'),'https://calendar.google.com/');
});
test('사용자 카테고리와 색상을 보존하고 개인 색상 우선·카테고리 색상 상속을 적용한다',()=>{
  const options=categoryOptions([{id:'default-0',name:'클라이언트',color:'#123456'},{id:'startup',name:'스타트업',color:'#aabbcc'}],[{category:'동료'}]);
  assert.ok(options.some(c=>c.name==='동료'));assert.ok(!options.some(c=>c.name==='고객'));
  assert.equal(contactColor(cleanContact({category:'스타트업'}),options),'#aabbcc');
  assert.equal(contactColor(cleanContact({category:'스타트업',color:'#654321'}),options),'#654321');
  assert.equal(cleanContact({color:'red;display:none'}).color,'');
});
test('할 일은 날짜별로 구분하고 숨긴 항목을 제외하며 완료 상태를 보존한다',()=>{
  const data=[{id:'2',date:'2026-11-06',text:'미팅 준비',done:true,createdAt:2},{id:'1',date:'2026-11-06',text:'제안서 작성',done:false,createdAt:1},{id:'3',date:'2026-11-07',createdAt:3},{id:'4',date:'2026-11-06',archived:true,createdAt:4}];
  const shown=dailyTodoItems(data,'2026-11-06');assert.deepEqual(shown.map(t=>t.id),['1','2']);assert.equal(shown.filter(t=>t.done).length,1);assert.equal(data[0].id,'2');
});
