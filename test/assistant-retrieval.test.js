import test from 'node:test';
import assert from 'node:assert/strict';
import {retrieveAssistantContext,closestContactAnswer} from '../public/assistant-retrieval.js';
import handler from '../api/assistant.js';
test('retrieval finds profession in intro and document evidence beyond original prefix',()=>{
 const contacts=Array.from({length:100},(_,i)=>({id:String(i),name:'일반 인맥'+i,strength:5}));contacts.push({id:'lawyer',name:'김변호',intro:'기업 자문 변호사',strength:4});
 const content='기타 내용 '.repeat(1500)+'법무 계약 검토 준비 내용';
 const context=retrieveAssistantContext({date:'2026-11-14'},'가장 가까운 변호사 법무 계약',{contacts,documents:[{id:'doc',title:'계약',content}],todos:[],memories:[],events:[]});
 assert.equal(context.contacts[0].id,'lawyer');assert.match(context.documents[0].content,/법무 계약 검토 준비 내용/);assert.equal(context.retrieval.available.contacts,101);
});
test('closest profession means highest importance, joint ties, never latest contact or non-lawyer',()=>{
 const contacts=[{id:'a',name:'김변호',intro:'변호사',importance:5,lastContact:'2020-01-01'},{id:'b',name:'이변호',title:'변호사',importance:2,lastContact:'2026-11-14'},{id:'c',name:'일반 지인',importance:5}];
 const answer=closestContactAnswer('나랑 가장 가까운 변호사 누구지?',{contacts});assert.match(answer.summary,/김변호님입니다/);assert.match(answer.summary,/중요도 5\/5/);assert.equal(answer.question,'');assert.deepEqual(answer.actions,[]);
 contacts.push({id:'d',name:'박변호',title:'변호사',importance:5});assert.match(closestContactAnswer('가장 가까운 변호사',{contacts}).summary,/동점.*김변호님, 박변호님/);
 assert.equal(closestContactAnswer('김변호 중요도 변경해줘',{contacts}),null);
});
test('authenticated assistant answers exact nearest-lawyer question from stored records without asking conditions',async()=>{
 const previous=global.fetch,keys=['OPENAI_API_KEY','GOOGLE_CLIENT_ID','ALLOWED_EMAIL'],values=keys.map(k=>process.env[k]);let calls=0;
 Object.assign(process.env,{OPENAI_API_KEY:'test',GOOGLE_CLIENT_ID:'client',ALLOWED_EMAIL:'owner@example.com'});
 global.fetch=async url=>{calls++;assert.match(url,/tokeninfo/);return {ok:true,json:async()=>({aud:'client',email:'owner@example.com',email_verified:true})};};
 try{const res={setHeader(){},status(n){this.code=n;return this;},json(data){this.data=data;return this;}};await handler({method:'POST',headers:{authorization:'Bearer test'},body:{mode:'plan',text:'나랑 가장 가까운 변호사 누구지?',history:[],context:{contacts:[{id:'lawyer',name:'유석현',title:'변호사',importance:4}]}}},res);assert.equal(calls,1);assert.match(res.data.summary,/유석현님/);assert.equal(res.data.question,'');assert.equal(res.data.actions.length,0);
 }finally{global.fetch=previous;keys.forEach((k,i)=>values[i]===undefined?delete process.env[k]:process.env[k]=values[i]);}
});
