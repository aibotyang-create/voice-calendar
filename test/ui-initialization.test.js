import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const {parseHTML}=await import(process.env.DOM_TEST_MODULE||'linkedom');
test('앱 초기화 뒤 메뉴별로 한 페이지만 보이고 대시보드 AI 비서와 인맥 편집창이 유지된다',async()=>{
 const {window}=parseHTML(fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8'));
 for(const key of ['document','Event','CustomEvent','MutationObserver','HTMLElement','HTMLInputElement','HTMLSelectElement'])globalThis[key]=window[key];
 globalThis.window=window;globalThis.location={hash:'#overview'};globalThis.localStorage={getItem:()=>null,setItem(){}};window.scrollTo=()=>{};window.matchMedia=()=>({matches:false,addEventListener(){}});globalThis.setInterval=()=>({unref(){}});
 Object.defineProperty(window.HTMLSelectElement.prototype,'options',{get(){return this.querySelectorAll('option')}});
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get(){return this._value??this.querySelector('option')?.getAttribute('value')??this.querySelector('option')?.textContent??''},set(v){this._value=String(v)}});
 window.HTMLSelectElement.prototype.add=function(o){this.append(o)};
 Object.defineProperty(window.HTMLAnchorElement.prototype,'hash',{get(){return '#'+(this.getAttribute('href')||'').split('#')[1]}});
 globalThis.Option=function(text,value){const o=document.createElement('option');o.textContent=text;o.value=value;return o};
 window.HTMLElement.prototype.show=function(){this.open=true};window.HTMLElement.prototype.close=function(){this.open=false;this.dispatchEvent(new Event('close'))};
 const {initPeople}=await import('../public/people.js');
 initPeople({getToken:()=>'',googleApi:async()=>({ok:true,json:async()=>({items:[]})}),onSchedule(){},onQuickEvent(){}});
 const $=id=>document.getElementById(id);
 assert.equal(document.querySelectorAll('.workspace-view').length,6);
 assert.ok(document.querySelector('.overview-view .unified-assistant'));assert.equal($('railImportance').value,'all');assert.equal(document.querySelector('.relationship-rail h3').textContent,'중요한 분들');
 for(const [route,expected]of [['calendar','calendar'],['people','people'],['capture','registration'],['vault','vault'],['preparation','preparation'],['overview','overview']]){
  location.hash='#'+route;window.dispatchEvent(new Event('hashchange'));
  assert.deepEqual([...document.querySelectorAll('.workspace-view')].filter(v=>!v.hidden).map(v=>v.dataset.view),[expected]);
 }
 $('addPerson').click();assert.ok($('pTags'));assert.equal($('pCategory').isConnected,true);assert.equal($('pStrength').hidden,false);assert.deepEqual([...document.querySelectorAll('.contact-category-block .relationship-options button')].map(b=>b.textContent),['대표','멘토','기관','지인','친구']);
 await new Promise(resolve=>queueMicrotask(resolve));
});
