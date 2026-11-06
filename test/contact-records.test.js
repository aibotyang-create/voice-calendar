import test from 'node:test';import assert from 'node:assert/strict';
import {recordDate,parseRecord,sortedRecordLines} from '../public/contact-records.js';
test('기록 날짜는 짧은 날짜를 보존하고 존재하지 않는 날짜를 거절한다',()=>{assert.equal(recordDate('26.11.07'),'2026-11-07');assert.equal(recordDate('2026-02-30'),'');assert.equal(recordDate('26/10/23'),'2026-10-23');assert.deepEqual(parseRecord('[x] 2026-11-07 미팅 자료 보내기'),{date:'2026-11-07',text:'미팅 자료 보내기',done:true});});
test('기록은 최신 날짜부터 정렬하고 같은 날짜는 나중에 추가한 것을 위에 둔다',()=>{const lines=['- 26/10/23 이전 기록','- 2026-11-07 오늘 기록','날짜 없는 이전 메모','- 2026-11-07 나중에 추가'];assert.deepEqual(sortedRecordLines(lines).map(x=>x.index),[3,1,0,2]);assert.equal(lines[0],'- 26/10/23 이전 기록');});
