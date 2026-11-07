import test from 'node:test';
import assert from 'node:assert/strict';
import {pageForHash} from '../public/navigation.js';
test('첫 화면·각 메뉴·기존 링크를 올바른 전용 화면으로 연결한다',()=>{
  assert.equal(pageForHash(''),'overview');assert.equal(pageForHash('#calendar'),'calendar');
  assert.equal(pageForHash('#agendaTitle'),'calendar');assert.equal(pageForHash('#people'),'people');
  assert.equal(pageForHash('#peopleCapture'),'registration');assert.equal(pageForHash('#capture'),'registration');
  assert.equal(pageForHash('#vault'),'vault');
  assert.equal(pageForHash('#preparation'),'calendar');assert.equal(pageForHash('#unknown'),'overview');
});
