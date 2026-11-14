import test from 'node:test';
import assert from 'node:assert/strict';
import {simpleNewContacts} from '../public/contact-intents.js';
import {groundContactQuotes} from '../public/contact-grounding.js';
import {validateContactImport,prepareContactImport} from '../public/contact-import.js';
import handler from '../api/parse.js';

test('name-only commands register new people without company or existing contact',async()=>{
  for(const text of ['안상민 등록해줘','안상민을 인맥으로 추가해줘','인맥: 안상민 등록','안상민, 김현수 추가해줘']){
    const parsed=validateContactImport({contacts:simpleNewContacts(text)},text);
    const entries=await prepareContactImport(parsed,[],[],'request','2026-11-14');
    assert.equal(entries[0].data.name,'안상민');assert.equal(entries[0].operation,'created');assert.equal(entries[0].data.company,'');
  }
  assert.equal(simpleNewContacts('안상민 중요도 3으로 바꿔줘'),null);
  assert.equal(simpleNewContacts('김현수 대표와 오늘 미팅했어'),null);
});
test('quotation repair retains explicitly named people but rejects invented names and drops unsupported details',()=>{
  const source='오늘 안상민 만났어';
  const fixed=groundContactQuotes({contacts:[{name:'안상민',sourceQuote:'안상민을 만났다',company:'가상의 회사',notes:'투자를 약속함'}]},source);
  const parsed=validateContactImport(fixed,source);assert.equal(parsed[0].name,'안상민');assert.equal(parsed[0].company,'');assert.equal(parsed[0].notes,'');
  assert.throws(()=>validateContactImport(groundContactQuotes({contacts:[{name:'김상민',sourceQuote:''}]},source),source));
});
test('authenticated name-only registration succeeds without model calls',async()=>{
  const fetchBefore=global.fetch,keys=['OPENAI_API_KEY','GOOGLE_CLIENT_ID','ALLOWED_EMAIL'],before=keys.map(k=>process.env[k]);
  Object.assign(process.env,{OPENAI_API_KEY:'test',GOOGLE_CLIENT_ID:'client',ALLOWED_EMAIL:'owner@example.com'});let calls=0;
  global.fetch=async url=>{calls++;assert.match(url,/tokeninfo/);return {ok:true,json:async()=>({aud:'client',email:'owner@example.com',email_verified:true})};};
  try{const res={setHeader(){},status(n){this.code=n;return this;},json(data){this.data=data;return this;}};
    await handler({method:'POST',headers:{authorization:'Bearer test'},body:{mode:'contacts',text:'안상민 등록해줘',history:[]}},res);
    assert.equal(calls,1);assert.equal(res.data.contacts[0].name,'안상민');assert.equal(res.data.contacts[0].intent,'record');
  }finally{global.fetch=fetchBefore;keys.forEach((k,i)=>before[i]===undefined?delete process.env[k]:process.env[k]=before[i]);}
});
