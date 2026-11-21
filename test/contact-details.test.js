import test from 'node:test';
import assert from 'node:assert/strict';
import {enrichContactDetails} from '../public/contact-details.js';
import {validateContactImport,prepareContactImport,saveContactImports} from '../public/contact-import.js';

test('prompt fills category, activity, venue, tag and dated encounter in their real stored fields',async()=>{
 const source='어제 네일 관리하는 문아림 대표님 처음 만났어. 서울창업캠프에서';
 const raw={contacts:[{name:'문아림',category:'지인',sourceQuote:source,tags:[],meeting:null}]};
 const detailed=enrichContactDetails(raw,source,'2026-11-14');
 const parsed=validateContactImport(detailed,source);
 assert.equal(parsed[0].category,'대표');assert.equal(parsed[0].title,'대표');assert.equal(parsed[0].intro,'네일 관리');assert.equal(parsed[0].metAt,'서울창업캠프');assert.deepEqual(parsed[0].tags,['서울창업캠프']);assert.equal(parsed[0].meeting.date,'2026-11-13');
 const entries=await prepareContactImport(parsed,[{id:'existing',name:'문아림',company:'',phone:'010-1111-2222',notes:'기존 메모',tags:['기존 태그'],strength:4}],[],'request','2026-11-14'),writes=[];
 const fs={doc:(_, ...path)=>path.join('/'),serverTimestamp:()=>1,runTransaction:async(_,fn)=>fn({get:async()=>({exists:()=>true,data:()=>({name:'문아림',phone:'010-1111-2222',notes:'기존 메모',tags:['기존 태그'],strength:4})}),set:(path,data)=>writes.push({path,data})})};
 await saveContactImports(fs,{},['users','owner'],entries);
 assert.match(writes[0].path,/contacts\/existing$/);assert.equal(writes[0].data.metAt,'서울창업캠프');assert.equal(writes[0].data.intro,'네일 관리');assert.equal(writes[0].data.phone,'010-1111-2222');assert.ok(writes[0].data.tags.includes('서울창업캠프'));assert.equal(writes[1].data.date,'2026-11-13');assert.match(writes[1].data.text,/문아림.*서울창업캠프/);
});
test('missing or ungrounded venues are not invented, and spacing in venue tags is accepted',()=>{
 const source='문아림님 만났어';const row=enrichContactDetails({contacts:[{name:'문아림',sourceQuote:source,metAt:'가상의 장소'}]},source,'2026-11-14').contacts[0];assert.equal(row.metAt,'');
 const text='문아림 대표님을 서울창업캠프에서 처음 만났어';const parsed=validateContactImport({contacts:[{name:'문아림',sourceQuote:text,tags:['서울 창업 캠프']}]},text);assert.deepEqual(parsed[0].tags,['서울 창업 캠프']);
});
