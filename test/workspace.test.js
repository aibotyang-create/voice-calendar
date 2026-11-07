import test from 'node:test';
import assert from 'node:assert/strict';
import {networkLayout,filterNetwork} from '../public/network-map.js';
import {shiftedDay,pastelColor,insertTodoOrder} from '../public/workspace-utils.js';
test('시냅스 지도는 실제 카테고리로 가지를 만들고 중요도에 따라 원 크기를 구분한다',()=>{
  const people=[{id:'1',name:'가나다',category:'대표',strength:5},{id:'2',name:'라마바',category:'멘토',strength:1}];const layout=networkLayout(people);
  assert.equal(layout.groups.length,2);assert.ok(layout.nodes[0].radius>layout.nodes[1].radius);assert.equal(layout.nodes[0].group.name,'대표');for(const n of layout.nodes){assert.ok(n.x>=48&&n.x<=952);assert.ok(n.y>=48&&n.y<=592);}
});
test('인맥 필터는 회사·카테고리·검색·중요도를 함께 적용한다',()=>{
  const people=[{name:'김민수',company:'ABC',title:'팀장',category:'대표',strength:5},{name:'박민수',company:'DEF',title:'이사',category:'대표',strength:2}];
  assert.equal(filterNetwork(people,{query:'민수',company:'ABC',importance:5}).length,1);
});
test('날짜 탭은 월말·연말을 넘기고, 할 일을 기존 두 항목 사이에 삽입한다',()=>{
  assert.equal(shiftedDay('2026-12-31',1),'2027-01-01');assert.equal(shiftedDay('2026-11-01',-1),'2026-10-31');assert.deepEqual(insertTodoOrder([{id:'a'},{id:'b'}],'a','new'),['a','new','b']);assert.deepEqual(insertTodoOrder([{id:'a'}],null,'first'),['first','a']);
  assert.equal(pastelColor('#000000'),'#c7c7c7');assert.match(pastelColor('invalid'),/^#[0-9a-f]{6}$/);
});

test('중요도 필터는 선택한 숫자 이상인 인맥을 표시한다',()=>{const people=[1,2,3,4,5].map(strength=>({id:String(strength),name:'인맥',strength}));for(let importance=1;importance<=5;importance++)assert.deepEqual(filterNetwork(people,{importance:String(importance)}).map(p=>p.strength),[importance,importance+1,importance+2,importance+3,importance+4].filter(n=>n<=5));assert.equal(filterNetwork(people,{importance:0}).length,5);});
