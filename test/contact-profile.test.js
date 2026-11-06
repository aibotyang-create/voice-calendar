import test from 'node:test';
import assert from 'node:assert/strict';
import {priorityPeople,filterContactDetails} from '../public/contact-profile.js';
import {cleanContact} from '../public/people-data.js';
test('챙겨볼 사람은 기본으로 현재 가장 높은 중요도를 보이고 직접 선택도 지원한다',()=>{const people=[{name:'가',strength:2},{name:'나',strength:4},{name:'다',strength:4}];assert.deepEqual(priorityPeople(people).map(p=>p.name),['나','다']);assert.equal(priorityPeople(people,'2')[0].name,'가');assert.equal(priorityPeople(people,'5').length,0);assert.equal(priorityPeople(people,'all').length,3);assert.deepEqual(priorityPeople([]),[]);});
test('만난 장소와 등록일을 함께 필터하고 기존 인맥의 등록일을 추측하지 않는다',()=>{const people=[{name:'가',metAt:'창업 캠프, 고객사 방문',registeredOn:'2026-11-07'},{name:'나'}];assert.equal(filterContactDetails(people,{place:'고객사 방문',registered:'2026-11-07'})[0].name,'가');assert.equal(filterContactDetails(people,{registered:'2026-11-06'}).length,0);const old=cleanContact({name:'나'});assert.equal(old.registeredOn,undefined);const p=cleanContact({name:'가',relationship:'멘토',metAt:'캠프',registeredOn:'2026-11-07'});assert.equal(p.metAt,'캠프');assert.equal(p.relationship,'멘토');assert.equal(p.registeredOn,'2026-11-07');});
