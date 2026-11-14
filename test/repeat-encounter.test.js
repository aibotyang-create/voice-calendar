import test from 'node:test';
import assert from 'node:assert/strict';
import {validateContactImport,prepareContactImport,mergeImportedContact,saveContactImports} from '../public/contact-import.js';
import {mentionSource} from '../public/contact-mentions.js';
const old={id:'person',name:'이종무',category:'대표',metAt:'ST글로벌창업캠프',tags:['ST글로벌창업캠프'],company:'기존 회사',phone:'010-1111-2222',notes:'기존 메모',intro:'기존 소개',strength:4};
test('repeat encounter preserves original venue/tags and saves separate dated conversation even if model calls it first',async()=>{
 const source='내가 오늘 마포생고기 집에서 오늘 이종무 대표님을 만났어';
 const parsed=validateContactImport({contacts:[{name:'이종무',sourceQuote:source,metAt:'마포생고기',tags:['마포생고기'],meeting:{date:'2026-11-14',text:'마포생고기에서 이종무를 처음 만남',sourceQuote:source}}]},source);
 const entries=await prepareContactImport(parsed,[old],[],'repeat','2026-11-14'),merged=mergeImportedContact(old,entries[0]);
 assert.equal(merged.metAt,old.metAt);assert.deepEqual(merged.tags,old.tags);assert.equal(merged.phone,old.phone);assert.equal(merged.intro,old.intro);assert.doesNotMatch(entries[0].meeting.text,/처음/);
 const writes=[],fs={doc:(_, ...path)=>path.join('/'),serverTimestamp:()=>1,runTransaction:async(_,fn)=>fn({get:async()=>({exists:()=>true,data:()=>old}),set:(path,data)=>writes.push({path,data})})};await saveContactImports(fs,{},['users','owner'],entries);assert.equal(writes[0].data.metAt,old.metAt);assert.deepEqual(writes[0].data.tags,old.tags);assert.equal(writes[1].data.date,'2026-11-14');assert.match(writes[1].data.text,/마포생고기/);
});
test('new contact or explicitly first meeting may store venue, and stale client still cannot replace an existing venue',async()=>{
 const source='이종무 처음 만났어. 마포생고기에서';const parsed=validateContactImport({contacts:[{name:'이종무',sourceQuote:source,metAt:'마포생고기',tags:['마포생고기']}]},source),entries=await prepareContactImport(parsed,[old],[],'first','2026-11-14');assert.equal(mergeImportedContact(old,entries[0]).metAt,'마포생고기');
 const ordinary={...parsed[0],firstMeetingExplicit:false},fresh=await prepareContactImport([ordinary],[],[],'new','2026-11-14');assert.equal(mergeImportedContact(null,fresh[0]).metAt,'마포생고기');assert.equal(mergeImportedContact(old,fresh[0]).metAt,old.metAt);
});
test('explicit named participant overrides unrelated selected contacts',()=>{
 const other={id:'other',name:'김채원'},text='오늘 이종무 대표님을 만났어';assert.equal(mentionSource(text,[other],[other,old]),text);const narrowed=mentionSource(text,[other,old],[other,old]);assert.match(narrowed,/@이종무/);assert.doesNotMatch(narrowed,/@김채원/);
});
