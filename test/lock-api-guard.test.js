import test from 'node:test';
import assert from 'node:assert/strict';
import parse from '../api/parse.js';
import assistant from '../api/assistant.js';
test('enabled lock rejects direct AI API calls even with owner Google token when PIN cookie is absent',async()=>{
 const oldFetch=global.fetch,keys=['APP_LOCK_REQUIRED','OPENAI_API_KEY','GOOGLE_CLIENT_ID','ALLOWED_EMAIL'],before=keys.map(k=>process.env[k]);Object.assign(process.env,{APP_LOCK_REQUIRED:'true',OPENAI_API_KEY:'test',GOOGLE_CLIENT_ID:'client',ALLOWED_EMAIL:'owner@example.com'});let calls=0;global.fetch=async url=>{calls++;assert.match(url,/tokeninfo/);return {ok:true,json:async()=>({aud:'client',email:'owner@example.com',email_verified:true,sub:'google-sub'})};};
 try{for(const [handler,mode,extra]of [[parse,'contacts',{}],[assistant,'plan',{context:{contacts:[]}}]]){const res={setHeader(){},status(code){this.code=code;return this;},json(data){this.data=data;return this;}};await handler({method:'POST',headers:{authorization:'Bearer owner'},body:{mode,text:'나랑 가장 가까운 변호사 누구지?',history:[],...extra}},res);assert.equal(res.code,401);assert.match(res.data.error,/비밀번호/);}assert.equal(calls,2);}finally{global.fetch=oldFetch;keys.forEach((k,i)=>before[i]===undefined?delete process.env[k]:process.env[k]=before[i]);}
});
