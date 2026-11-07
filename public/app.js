import {seoulDay,monthRange,eventDays,calendarUrl,resolveEventColor} from './calendar.js';
import {initPeople} from './people.js';
import {initEventEditor,buildManualEvent} from './event-editor.js';
import {pastelColor} from './workspace-utils.js';
const $=id=>document.getElementById(id);
let config={},token='',expires=0,busy=false,history=[],draft=null,saved=null,recognition=null,listening=false;
const scope='openid email profile https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.calendarlist.readonly https://www.googleapis.com/auth/drive.file';
const status=s=>$('status').textContent=s;
const authenticated=()=>token&&Date.now()<expires;
function lock(value){busy=value;for(const id of ['submit','mic','save','discard','another','undo','connect']) $(id).disabled=value;$('mic').disabled=value||!recognition;}
function clear(){history=[];draft=null;$('draft').hidden=true;$('success').hidden=true;$('text').value='';status('');}
function sessionLost(){token='';expires=0;calendarRequest++;calendarEvents=[];eventPalette={};defaultCalendarColor={};colorMetadataLoaded=false;people.disconnect();$('connect').textContent='Google 계정 다시 연결 ↗';$('calendarStatus').textContent='Google 캘린더를 연결하면 일정이 표시됩니다.';renderCalendar();}
async function calendarRequestApi(resource,options={}){
  if(!authenticated()){sessionLost();throw Error('Google 연결이 만료됐어요. 위의 연결 버튼을 눌러주세요.');}
  const response=await fetch('https://www.googleapis.com/calendar/v3/'+resource,{...options,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'}});
  if(response.status===401){sessionLost();throw Error('Google 연결이 만료됐어요. 다시 연결해주세요.');}
  return response;
}
async function googleApi(path,options={}){return calendarRequestApi('calendars/primary/events'+path,options);}
$('connect').onclick=()=>{
  if(!config.ready){$('setup').open=true;status('아직 초기 설정 전이에요. README의 Vercel 환경 변수 설정을 먼저 완료해주세요.');return;}
  if(!window.google?.accounts?.oauth2){status('Google 연결 모듈을 불러오는 중이에요. 잠시 후 다시 눌러주세요.');return;}
  const client=google.accounts.oauth2.initTokenClient({client_id:config.clientId,scope,
    callback:async r=>{if(r.error){status('Google 연결이 완료되지 않았어요. 다시 시도해주세요.');return;}
      if(!google.accounts.oauth2.hasGrantedAllScopes(r,...scope.split(' '))){status('캘린더와 보관함(Drive) 권한을 모두 허용해주세요.');return;}
      token=r.access_token;expires=Date.now()+(Number(r.expires_in)-60)*1000;$('connect').textContent='✓ Google 로그인됨';status('같은 계정으로 캘린더와 인맥 저장소를 연결하고 있어요…');calendarEvents=[];renderCalendar();loadCalendar();people.connect();try{await people.connectStore(token);status('캘린더와 인맥 저장소가 같은 Google 계정으로 연결됐어요.');}catch(e){status('캘린더는 연결됐지만 인맥 저장소 연결에 실패했어요. '+e.message+' · 상단의 저장소 동기화 다시 시도를 눌러주세요.');}},
    error_callback:()=>status('연결 창이 닫혔어요. 팝업을 허용하고 다시 연결해주세요.')});
  client.requestAccessToken();
};
$('disconnect').onclick=()=>{if(token&&window.google) google.accounts.oauth2.revoke(token,()=>{});sessionLost();clear();status('Google 연결을 해제했어요.');};
const localTime=iso=>new Date(new Date(iso).getTime()+9*3600000).toISOString().slice(0,16);
function showDraft(e){
  draft={...e,id:crypto.randomUUID().replaceAll('-','')};$('draft').hidden=false;$('success').hidden=true;
  for(const key of ['title','location','description']) $(key).value=e[key];
  $('start').value=localTime(e.start);$('end').value=localTime(e.end);
  let option=[...$('reminder').options].find(x=>Number(x.value)===e.reminderMinutes);
  if(!option){option=new Option(e.reminderMinutes+'분 전',e.reminderMinutes);$('reminder').add(option);}
  $('reminder').value=e.reminderMinutes;
}
async function parse(){
  if(busy) return;
  if(!authenticated()){status('먼저 위의 Google 캘린더 연결 버튼을 눌러주세요.');return;}
  const text=$('text').value.trim();if(!text){status('등록할 일정을 말하거나 입력해주세요.');return;}
  draft=null;$('draft').hidden=true;$('success').hidden=true;lock(true);status('말씀하신 일정을 정리하고 있어요…');
  try{
    const response=await fetch('/api/parse',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({text,history}),signal:AbortSignal.timeout(55000)});
    const e=await response.json();if(!response.ok) throw Error(e.error||'일정 정리에 실패했어요.');
    history.push({role:'user',content:text});
    if(e.question){history.push({role:'assistant',content:e.question});$('text').value='';status(e.question);$('text').placeholder='답변을 말하거나 입력해주세요';$('text').focus();return;}
    showDraft(e);history=[];$('text').value='';
    if($('auto').checked){await save();}else status('내용을 확인하거나 수정한 뒤 등록해주세요.');
  }catch(e){status(e.message||'연결을 확인하고 다시 시도해주세요.');}finally{lock(false);}
}
async function save(){
  if(!draft) return;
  if(!$('eventForm').reportValidity()) return;
  if(!$('title').value.trim()) throw Error('일정 이름을 입력해주세요.');
  const start=$('start').value+':00+09:00',end=$('end').value+':00+09:00';
  if(Date.parse(end)<=Date.parse(start)||Date.parse(start)<Date.now()) throw Error('시작·종료 시간을 확인해주세요. 시작은 현재 이후, 종료는 시작 이후여야 해요.');
  // A stable Google event ID makes retrying a network failure idempotent.
  const event={id:draft.id,summary:$('title').value.trim(),location:$('location').value,description:$('description').value,start:{dateTime:start,timeZone:'Asia/Seoul'},end:{dateTime:end,timeZone:'Asia/Seoul'},extendedProperties:{private:{source:'malhae-calendar'}},reminders:{useDefault:false,overrides:[{method:'popup',minutes:Number($('reminder').value)}]}};
  status('Google 캘린더에 등록하고 있어요…');
  let response=await googleApi('',{method:'POST',body:JSON.stringify(event)});
  if(response.status===409) response=await googleApi('/'+draft.id);
  if(!response.ok) throw Error('캘린더 등록에 실패했어요. 연결과 권한을 확인한 후 등록 버튼으로 재시도해주세요.');
  saved=await response.json();$('draft').hidden=true;$('success').hidden=false;$('successTitle').textContent=saved.summary;
  $('successDetail').textContent=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric',weekday:'short',hour:'numeric',minute:'2-digit'}).format(new Date(saved.start.dateTime))+(saved.location?' · '+saved.location:'');
  const url=new URL(saved.htmlLink||'https://calendar.google.com/');
  $('calendarLink').href=url.protocol==='https:'&&['www.google.com','calendar.google.com'].includes(url.hostname)?url.href:'https://calendar.google.com/';
  status('캘린더에 등록했어요.');draft=null;
  const day=seoulDay(saved.start.dateTime);calendarYear=Number(day.slice(0,4));calendarMonth=Number(day.slice(5,7))-1;selectedDay=day;await loadCalendar();
  people.refresh();
}
$('submit').onclick=parse;
$('eventForm').onsubmit=async e=>{e.preventDefault();if(busy) return;lock(true);try{await save();}catch(e){status(e.message);}finally{lock(false);}};
$('undo').onclick=async()=>{if(!saved||busy) return;lock(true);try{const r=await googleApi('/'+encodeURIComponent(saved.id),{method:'DELETE'});if(!r.ok&&r.status!==410&&r.status!==404) throw Error('취소에 실패했어요. 다시 시도해주세요.');saved=null;$('success').hidden=true;status('등록한 일정을 취소했어요.');await loadCalendar();people.refresh();}catch(e){status(e.message);}finally{lock(false);}};
$('discard').onclick=clear;$('another').onclick=clear;
document.querySelectorAll('[data-example]').forEach(b=>b.onclick=()=>{if(!busy){clear();$('text').value=b.dataset.example;$('text').focus();}});
const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
if(Speech){
  recognition=new Speech();recognition.lang='ko-KR';recognition.interimResults=true;recognition.continuous=false;
  let base='',failed=false;
  document.addEventListener('malhae-voice-start',event=>{if(event.detail!=='schedule'&&listening){failed=true;recognition.abort();}});
  recognition.onstart=()=>{document.dispatchEvent(new CustomEvent('malhae-voice-start',{detail:'schedule'}));listening=true;$('mic').classList.add('listening');$('mic').querySelector('span').textContent='말하기 완료';$('submit').disabled=true;status('듣고 있어요. 다 말하면 마이크를 한 번 더 눌러주세요.');};
  recognition.onresult=e=>{let result='';for(let i=0;i<e.results.length;i++) result+=e.results[i][0].transcript;$('text').value=base+result;};
  recognition.onerror=e=>{failed=true;status(e.error==='not-allowed'?'마이크 권한을 허용해주세요. 텍스트로도 입력할 수 있어요.':'음성을 인식하지 못했어요. 다시 말하거나 직접 입력해주세요.');};
  recognition.onend=()=>{listening=false;$('mic').classList.remove('listening');$('mic').querySelector('span').textContent='말로 입력';$('submit').disabled=busy;if(!failed&&$('text').value.trim()) parse();};
  $('mic').onclick=()=>{if(listening){recognition.stop();return;}if(!authenticated()){status('먼저 Google 캘린더를 연결해주세요.');return;}base=$('text').value.trim()?$('text').value.trim()+' ':'';failed=false;try{recognition.start();}catch{status('마이크를 시작하지 못했어요. 잠시 후 다시 시도해주세요.');}};
}else{$('mic').disabled=true;$('voiceHint').textContent='키보드 음성 받아쓰기로 입력하세요';}
let calendarYear=Number(seoulDay(Date.now()).slice(0,4)),calendarMonth=Number(seoulDay(Date.now()).slice(5,7))-1,selectedDay=seoulDay(Date.now()),calendarEvents=[],calendarRequest=0,eventPalette={},defaultCalendarColor={},colorMetadataLoaded=false;
const colorNames=['','라벤더','세이지','포도','분홍','노랑','주황','청록','회색','파랑','바질','토마토'];
async function loadColorMetadata(){if(colorMetadataLoaded)return true;const session=token;const results=await Promise.allSettled([calendarRequestApi('colors'),calendarRequestApi('users/me/calendarList/primary')]);if(session!==token)return false;let ok=true;
  const colors=results[0];if(colors.status==='fulfilled'&&colors.value.ok){const data=await colors.value.json();eventPalette=Object.fromEntries(Object.entries(data.event||{}).map(([id,color])=>[id,{...color,name:colorNames[Number(id)]||'색상 '+id}]));}else ok=false;
  const calendar=results[1];if(calendar.status==='fulfilled'&&calendar.value.ok){const data=await calendar.value.json();defaultCalendarColor={background:data.backgroundColor,foreground:data.foregroundColor};}else ok=false;
  if(session!==token)return false;colorMetadataLoaded=ok;return ok;
}
const el=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;};
function renderCalendar(){
  if($('eventFilter').value==='todos'){document.dispatchEvent(new CustomEvent('ai-calendar:render-todos',{detail:{year:calendarYear,month:calendarMonth,selectedDay}}));return;}
  const range=monthRange(calendarYear,calendarMonth),prefix=calendarYear+'-'+String(calendarMonth+1).padStart(2,'0');
  $('monthTitle').textContent=calendarYear+'년 '+(calendarMonth+1)+'월';$('monthGrid').replaceChildren();$('eventList').replaceChildren();
  const events=calendarEvents.filter(e=>$('eventFilter').value==='all'||e.extendedProperties?.private?.source==='malhae-calendar');
  const indexed=events.map(event=>({event,days:eventDays(event)}));
  for(let i=0;i<range.weekday;i++) $('monthGrid').append(el('div','day-blank'));
  for(let day=1;day<=range.days;day++){
    const date=prefix+'-'+String(day).padStart(2,'0'),items=indexed.filter(e=>e.days.includes(date));
    const button=el('button','day'+(date===seoulDay(Date.now())?' today':'')+(date===selectedDay?' selected':''));button.type='button';button.setAttribute('aria-label',date+', 일정 '+items.length+'개');button.setAttribute('aria-pressed',String(date===selectedDay));
    button.append(el('span','day-number',day));for(const {event} of items.slice(0,2)){const chip=el('span','day-event',event.summary||'이름 없는 일정'),color=resolveEventColor(event,eventPalette,defaultCalendarColor);chip.style.background=pastelColor(color.background);chip.style.color='#575064';button.append(chip);}if(items.length>2)button.append(el('span','day-more','+'+(items.length-2)));
    button.onclick=()=>{selectedDay=date;renderCalendar();};$('monthGrid').append(button);
  }
  $('showMonth').hidden=!selectedDay;$('listTitle').textContent=selectedDay?selectedDay+' 일정':'이달의 일정 · '+events.length+'개';
  const shown=indexed.filter(e=>!selectedDay||e.days.includes(selectedDay));
  if(!shown.length) $('eventList').append(el('p','empty-note',authenticated()?'표시할 일정이 없어요. 위에서 새 일정을 등록해보세요.':'Google 계정을 연결해주세요.'));
  for(const {event:e} of shown){
    const row=el('article','event-row'),date=e.start.date||seoulDay(e.start.dateTime),time=e.start.date?'종일':new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',hour:'numeric',minute:'2-digit'}).format(new Date(e.start.dateTime));row.style.borderLeft='3px solid '+pastelColor(resolveEventColor(e,eventPalette,defaultCalendarColor).background,.45);row.style.paddingLeft='10px';
    row.append(el('div','event-time',date.slice(5).replace('-','/')+'\n'+time));const body=el('div','event-body');const link=el('a','event-name',e.summary||'이름 없는 일정');link.href=calendarUrl(e.htmlLink);link.target='_blank';link.rel='noopener noreferrer';body.append(link);if(e.location)body.append(el('p','event-location',e.location));if(e.extendedProperties?.private?.source==='malhae-calendar')body.append(el('span','person-tag','AI-calendar에서 등록'));row.append(body);$('eventList').append(row);
  }
}
async function loadCalendar(){
  if($('eventFilter').value==='todos'){calendarRequest++;renderCalendar();return;}
  const request=++calendarRequest,session=token;calendarEvents=[];renderCalendar();
  if(!authenticated()){$('calendarStatus').textContent='Google 캘린더를 연결하면 일정이 표시됩니다.';return;}
  $('calendarStatus').textContent='Google 캘린더에서 일정을 불러오고 있어요…';
  try{
    const colorsReady=await loadColorMetadata();if(request!==calendarRequest||session!==token)return;
    const range=monthRange(calendarYear,calendarMonth),params=new URLSearchParams({timeMin:range.start,timeMax:range.end,singleEvents:'true',orderBy:'startTime',maxResults:'2500',timeZone:'Asia/Seoul'});let next='',items=[];
    do{if(next)params.set('pageToken',next);const r=await googleApi('?'+params);if(!r.ok)throw Error('일정을 불러오지 못했어요. Google 연결·캘린더 권한을 확인해주세요.');const data=await r.json();items.push(...(data.items||[]));next=data.nextPageToken||'';if(request!==calendarRequest||session!==token)return;}while(next);
    calendarEvents=items.filter(e=>e.status!=='cancelled');$('calendarStatus').textContent=colorsReady?'Google 캘린더와 일정 색상 동기화됨':'일정은 불러왔어요. 색상을 불러오려면 Google 캘린더를 다시 연결해주세요.';renderCalendar();
  }catch(e){if(request===calendarRequest){$('calendarStatus').textContent=e.message;renderCalendar();}}
}
function changeMonth(delta){const date=new Date(Date.UTC(calendarYear,calendarMonth+delta,1));calendarYear=date.getUTCFullYear();calendarMonth=date.getUTCMonth();selectedDay=calendarYear+'-'+String(calendarMonth+1).padStart(2,'0')+'-01';loadCalendar();}
document.addEventListener('ai-calendar:select-date',event=>{const date=event.detail;if(!/^\d{4}-\d\d-\d\d$/.test(date||''))return;selectedDay=date;calendarYear=Number(date.slice(0,4));calendarMonth=Number(date.slice(5,7))-1;loadCalendar();});
$('prevMonth').onclick=()=>changeMonth(-1);$('nextMonth').onclick=()=>changeMonth(1);$('todayMonth').onclick=()=>{const d=seoulDay(Date.now());calendarYear=Number(d.slice(0,4));calendarMonth=Number(d.slice(5,7))-1;selectedDay=d;loadCalendar();};$('refreshCalendar').onclick=()=>{colorMetadataLoaded=false;loadCalendar();people.refresh();};$('eventFilter').onchange=()=>loadCalendar();$('showMonth').onclick=()=>{selectedDay=null;renderCalendar();};
document.addEventListener('ai-calendar:birthdays-synced',()=>loadCalendar());
const people=initPeople({getToken:()=>authenticated()?token:'',googleApi,onSchedule:(name,notes)=>{clear();$('text').value=name+'님과 미팅. 준비할 내용: '+notes;$('text').focus();document.querySelector('.composer').scrollIntoView({behavior:'smooth',block:'center'});},onQuickEvent:async(text,history,id)=>{
  if(!authenticated())throw Error('상단에서 Google 캘린더를 연결해주세요.');const response=await fetch('/api/parse',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({text,history}),signal:AbortSignal.timeout(55000)});const result=await response.json();if(!response.ok)throw Error(result.error||'일정을 정리하지 못했어요.');if(result.question)return result;
  const event=buildManualEvent({title:result.title,start:localTime(result.start),end:localTime(result.end),location:result.location,description:result.description,reminder:result.reminderMinutes,colorId:''},id);let saved=await googleApi('',{method:'POST',body:JSON.stringify(event)});if(saved.status===409)saved=await googleApi('/'+id);if(!saved.ok)throw Error('Google 캘린더 저장에 실패했어요. 다시 시도해주세요.');const stored=await saved.json();const day=seoulDay(stored.start.dateTime);calendarYear=Number(day.slice(0,4));calendarMonth=Number(day.slice(5,7))-1;selectedDay=day;await loadCalendar();people.refresh();return {saved:true};
}});
initEventEditor({connected:authenticated,defaultDay:()=>selectedDay||seoulDay(Date.now()),colors:()=>eventPalette,insert:async event=>{let response=await googleApi('',{method:'POST',body:JSON.stringify(event)});if(response.status===409)response=await googleApi('/'+event.id);if(!response.ok)throw Error('Google 캘린더에 저장하지 못했어요. 연결과 권한을 확인한 뒤 재시도해주세요.');return response.json();},onSaved:async event=>{const day=seoulDay(event.start.dateTime);calendarYear=Number(day.slice(0,4));calendarMonth=Number(day.slice(5,7))-1;selectedDay=day;await loadCalendar();people.refresh();}});
renderCalendar();
fetch('/api/config').then(r=>r.json()).then(c=>{config=c;people.configure(c.firebase);$('setupState').textContent=c.ready?'서버 설정이 준비됐어요. Google 계정을 연결해주세요.':'아직 Google·AI 설정 전이에요. 제공된 README를 따라 환경 변수를 설정해주세요.';if(!c.ready) $('setup').open=true;}).catch(()=>status('서버에 연결하지 못했어요. 새로고침해주세요.'));
