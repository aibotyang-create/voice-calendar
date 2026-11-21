import test from 'node:test';import assert from 'node:assert/strict';
import {enrichContactDetails} from '../public/contact-details.js';import {validateContactImport} from '../public/contact-import.js';
test('quoted multiple friends share yesterday encounter without future personal facts changing meeting date',()=>{
 const source="어제 대학교 친구 '박지훈' 만났고, 대학교 친구 ' 김민재'이랑 같이 만났어.\n같이 공릉동 카페에서 얘기했어.\n\n지훈이는 내년 2월에 독일 대학교로 교환학생 간대.\n여자친구는 중국에서 무용쪽 일하고 있고";
 const contacts=['박지훈','김민재'].map(name=>({name,sourceQuote:source,intent:'record',tags:[],category:'지인',notes:name==='박지훈'?'내년 2월 독일 교환학생 예정. 여자친구는 중국에서 무용 관련 일을 함.':'',meeting:{date:'2027-02',text:(name==='박지훈'?'대학교 친구 김민재':'대학교 친구 박지훈')+'와 공릉동 카페에서 만남.',sourceQuote:'어제 공릉동 카페에서 두 친구를 만남'}}));
 const result=validateContactImport(enrichContactDetails({contacts},source,'2026-11-22'),source);assert.equal(result.length,2);for(const p of result){assert.equal(p.meeting.date,'2026-11-21');assert.match(p.meeting.text,/공릉동 카페/);assert.match(p.meeting.text,/대학교 친구/);assert.doesNotMatch(p.meeting.text,/교환학생|여자친구/);assert.equal(p.category,'친구');assert.ok(p.tags.includes('대학교'));}assert.match(result[0].notes,/교환학생/);assert.equal(result[1].notes,'');
});
