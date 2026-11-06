const $=id=>document.getElementById(id);
let config={},token='',expires=0,busy=false,history=[],draft=null,saved=null,recognition=null,listening=false;
const scope='openid email https://www.googleapis.com/auth/calendar.events';
const status=s=>$('status').textContent=s;
const authenticated=()=>token&&Date.now()<expires;
function lock(value){busy=value;for(const id of ['submit','mic','save','discard','another','undo','connect']) $(id).disabled=value;$('mic').disabled=value||!recognition;}
function clear(){history=[];draft=null;$('draft').hidden=true;$('success').hidden=true;$('text').value='';status('');}
function sessionLost(){token='';expires=0;$('connect').textContent='Google 캘린더 다시 연결 ↗';}
async function googleApi(path,options={}){
  if(!authenticated()){sessionLost();throw Error('Google 연결이 만료됐어요. 위의 연결 버튼을 눌러주세요.');}
  const response=await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events'+path,{...options,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'}});
  if(response.status===401){sessionLost();throw Error('Google 연결이 만료됐어요. 다시 연결해주세요.');}
  return response;
}
$('connect').onclick=()=>{
  if(!config.ready){$('setup').open=true;status('아직 초기 설정 전이에요. README의 Vercel 환경 변수 설정을 먼저 완료해주세요.');return;}
  if(!window.google?.accounts?.oauth2){status('Google 연결 모듈을 불러오는 중이에요. 잠시 후 다시 눌러주세요.');return;}
  const client=google.accounts.oauth2.initTokenClient({client_id:config.clientId,scope,
    callback:r=>{if(r.error){status('Google 연결이 완료되지 않았어요. 다시 시도해주세요.');return;}
      if(!google.accounts.oauth2.hasGrantedAllScopes(r,...scope.split(' '))){status('캘린더 권한을 허용해야 등록할 수 있어요.');return;}
      token=r.access_token;expires=Date.now()+(Number(r.expires_in)-60)*1000;$('connect').textContent='✓ Google 캘린더 연결됨';status('연결됐어요. 등록할 일정을 말해주세요.');},
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
  const event={id:draft.id,summary:$('title').value.trim(),location:$('location').value,description:$('description').value,start:{dateTime:start,timeZone:'Asia/Seoul'},end:{dateTime:end,timeZone:'Asia/Seoul'},reminders:{useDefault:false,overrides:[{method:'popup',minutes:Number($('reminder').value)}]}};
  status('Google 캘린더에 등록하고 있어요…');
  let response=await googleApi('',{method:'POST',body:JSON.stringify(event)});
  if(response.status===409) response=await googleApi('/'+draft.id);
  if(!response.ok) throw Error('캘린더 등록에 실패했어요. 연결과 권한을 확인한 후 등록 버튼으로 재시도해주세요.');
  saved=await response.json();$('draft').hidden=true;$('success').hidden=false;$('successTitle').textContent=saved.summary;
  $('successDetail').textContent=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric',weekday:'short',hour:'numeric',minute:'2-digit'}).format(new Date(saved.start.dateTime))+(saved.location?' · '+saved.location:'');
  const url=new URL(saved.htmlLink||'https://calendar.google.com/');
  $('calendarLink').href=url.protocol==='https:'&&['www.google.com','calendar.google.com'].includes(url.hostname)?url.href:'https://calendar.google.com/';
  status('캘린더에 등록했어요.');draft=null;
}
$('submit').onclick=parse;
$('eventForm').onsubmit=async e=>{e.preventDefault();if(busy) return;lock(true);try{await save();}catch(e){status(e.message);}finally{lock(false);}};
$('undo').onclick=async()=>{if(!saved||busy) return;lock(true);try{const r=await googleApi('/'+encodeURIComponent(saved.id),{method:'DELETE'});if(!r.ok&&r.status!==410&&r.status!==404) throw Error('취소에 실패했어요. 다시 시도해주세요.');saved=null;$('success').hidden=true;status('등록한 일정을 취소했어요.');}catch(e){status(e.message);}finally{lock(false);}};
$('discard').onclick=clear;$('another').onclick=clear;
document.querySelectorAll('[data-example]').forEach(b=>b.onclick=()=>{if(!busy){clear();$('text').value=b.dataset.example;$('text').focus();}});
const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
if(Speech){
  recognition=new Speech();recognition.lang='ko-KR';recognition.interimResults=true;recognition.continuous=false;
  let base='',failed=false;
  recognition.onstart=()=>{listening=true;$('mic').classList.add('listening');$('mic').querySelector('span').textContent='말하기 완료';$('submit').disabled=true;status('듣고 있어요. 다 말하면 마이크를 한 번 더 눌러주세요.');};
  recognition.onresult=e=>{let result='';for(let i=0;i<e.results.length;i++) result+=e.results[i][0].transcript;$('text').value=base+result;};
  recognition.onerror=e=>{failed=true;status(e.error==='not-allowed'?'마이크 권한을 허용해주세요. 텍스트로도 입력할 수 있어요.':'음성을 인식하지 못했어요. 다시 말하거나 직접 입력해주세요.');};
  recognition.onend=()=>{listening=false;$('mic').classList.remove('listening');$('mic').querySelector('span').textContent='말로 입력';$('submit').disabled=busy;if(!failed&&$('text').value.trim()) parse();};
  $('mic').onclick=()=>{if(listening){recognition.stop();return;}if(!authenticated()){status('먼저 Google 캘린더를 연결해주세요.');return;}base=$('text').value.trim()?$('text').value.trim()+' ':'';failed=false;try{recognition.start();}catch{status('마이크를 시작하지 못했어요. 잠시 후 다시 시도해주세요.');}};
}else{$('mic').disabled=true;$('voiceHint').textContent='키보드 음성 받아쓰기로 입력하세요';}
fetch('/api/config').then(r=>r.json()).then(c=>{config=c;$('setupState').textContent=c.ready?'서버 설정이 준비됐어요. Google 계정을 연결해주세요.':'아직 Google·AI 설정 전이에요. 제공된 README를 따라 환경 변수를 설정해주세요.';if(!c.ready) $('setup').open=true;}).catch(()=>status('서버에 연결하지 못했어요. 새로고침해주세요.'));
