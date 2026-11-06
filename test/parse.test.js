import test from 'node:test';
import assert from 'node:assert/strict';
import handler,{validateEvent,aiError} from '../api/parse.js';
test('AI 키, 크레딧, 요청 제한, 모델 오류를 구분하고 원문은 노출하지 않는다',()=>{
  assert.match(aiError(401,{message:'secret'}),/401/);
  assert.match(aiError(429,{code:'insufficient_quota'}),/insufficient_quota/);
  assert.match(aiError(429),/429/);
  assert.match(aiError(404,{code:'model_not_found'}),/model_not_found/);
  assert.ok(!aiError(400,{message:'secret'}).includes('secret'));
});
const event={title:'팀 미팅',start:'2030-06-12T15:00:00+09:00',end:'2030-06-12T16:00:00+09:00',location:'강남',description:'',reminderMinutes:30,question:null};
test('완전한 일정과 추가 질문을 구별한다',()=>{
  assert.equal(validateEvent(event).title,'팀 미팅');
  assert.deepEqual(validateEvent({question:'몇 시로 잡을까요?'}),{question:'몇 시로 잡을까요?'});
});
test('시간대 누락, 역전된 시간, 잘못된 알림을 거절한다',()=>{
  assert.throws(()=>validateEvent({...event,start:'2030-06-12T15:00:00'}));
  assert.throws(()=>validateEvent({...event,end:event.start}));
  assert.throws(()=>validateEvent({...event,reminderMinutes:-1}));
});
function response(){return {code:200,setHeader(){},status(n){this.code=n;return this;},json(data){this.data=data;return this;}};}
test('API 인증 및 AI 구조화 응답 처리',async()=>{
  const original=global.fetch,env={...process.env};
  process.env.OPENAI_API_KEY='test';process.env.GOOGLE_CLIENT_ID='test-client';process.env.ALLOWED_EMAIL='owner@example.com';
  try{
    let calls=0;
    global.fetch=async(url,options)=>{calls++;if(url.includes('tokeninfo')) return {ok:true,json:async()=>({aud:'test-client',email:'owner@example.com',email_verified:true})};
      const request=JSON.parse(options.body);assert.equal(request.text.format.strict,true);assert.equal(request.store,false);
      if(request.text.format.name==='contact')return {ok:true,json:async()=>({output:[{content:[{type:'output_text',text:JSON.stringify({name:'김민수',company:'ABC',title:'팀장',category:'고객',lastContact:'',notes:'제안서 논의',focus:'도입 비용',followup:'제안서 보내기',email:'',phone:''})}]}]})};
      return {ok:true,json:async()=>({output:[{content:[{type:'output_text',text:JSON.stringify(event)}]}]})};};
    let res=response();await handler({method:'POST',headers:{},body:{text:'내일 미팅',history:[]}},res);assert.equal(res.code,401);assert.equal(calls,0);
    res=response();await handler({method:'POST',headers:{authorization:'Bearer test'},body:{text:'미팅',history:[]}},res);assert.equal(res.code,200);assert.equal(res.data.title,'팀 미팅');assert.equal(calls,2);
    res=response();await handler({method:'POST',headers:{authorization:'Bearer test'},body:{mode:'contact',text:'ABC 김민수 팀장 제안서 보내기',history:[]}},res);assert.equal(res.code,200);assert.equal(res.data.contact.name,'김민수');assert.equal(res.data.contact.followup,'제안서 보내기');
    global.fetch=async()=>({ok:true,json:async()=>({aud:'other-client',email:'owner@example.com',email_verified:true})});
    res=response();await handler({method:'POST',headers:{authorization:'Bearer test'},body:{text:'미팅',history:[]}},res);assert.equal(res.code,403);
    res=response();await handler({method:'POST',headers:{authorization:'Bearer test'},body:'{'},res);assert.equal(res.code,400);
  }finally{global.fetch=original;for(const key of ['OPENAI_API_KEY','GOOGLE_CLIENT_ID','ALLOWED_EMAIL']){if(env[key]===undefined) delete process.env[key];else process.env[key]=env[key];}}
});
