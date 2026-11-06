export function bindVoiceInput({button,input,report,onFinish=()=>{},onState=()=>{},owner='people'}){
  const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Speech){button.disabled=true;button.title='이 브라우저에서는 키보드의 음성 받아쓰기를 이용해주세요.';report('음성 인식 미지원 · 키보드 음성 받아쓰기를 이용해주세요.');return {stop(){}};}
  const speech=new Speech();speech.lang='ko-KR';speech.continuous=false;speech.interimResults=true;
  let active=false,cancelled=false,base='',received=false;const initial=button.innerHTML;
  speech.onstart=()=>{active=true;onState(true);button.classList.add('listening');button.setAttribute('aria-pressed','true');button.innerHTML='<span class="record-dot"></span> 말하기 완료';report('듣고 있어요. 다 말하면 버튼을 다시 눌러주세요.');};
  speech.onresult=event=>{let text='';for(let i=0;i<event.results.length;i++)text+=event.results[i][0].transcript;received=Boolean(text.trim());input.value=(base+text).slice(0,input.maxLength>0?input.maxLength:4000);};
  speech.onerror=event=>{cancelled=true;report(event.error==='not-allowed'?'마이크 권한을 허용해주세요. 텍스트로도 입력할 수 있어요.':event.error==='no-speech'?'음성이 들리지 않았어요. 다시 시도해주세요.':'음성 입력이 중단됐어요. 입력된 내용을 확인해주세요.');};
  speech.onend=()=>{active=false;onState(false);button.classList.remove('listening');button.setAttribute('aria-pressed','false');button.innerHTML=initial;if(!cancelled&&received)onFinish();};
  document.addEventListener('malhae-voice-start',event=>{if(event.detail!==owner&&active){cancelled=true;speech.abort();}});
  button.onclick=()=>{if(active){speech.stop();return;}document.dispatchEvent(new CustomEvent('malhae-voice-start',{detail:owner}));cancelled=false;received=false;base=input.value.trim()?input.value.trim()+' ':'';try{speech.start();}catch{report('마이크를 시작하지 못했어요. 잠시 후 다시 시도해주세요.');}};
  return {stop(){cancelled=true;if(active)speech.abort();}};
}
