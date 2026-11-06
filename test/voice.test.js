import test from 'node:test';
import assert from 'node:assert/strict';
import {bindVoiceInput} from '../public/voice.js';
test('인맥 음성 입력은 내용과 길이를 보존하고 완료 시 한 번 정리한다',()=>{
  const before={window:global.window,document:global.document,CustomEvent:global.CustomEvent};
  let speech,finished=0;const events=new EventTarget();
  class Speech{constructor(){speech=this;}start(){this.onstart();}stop(){this.onend();}abort(){this.onend();}}
  global.window={SpeechRecognition:Speech};global.document=events;global.CustomEvent=class extends Event{constructor(name,args){super(name);this.detail=args.detail;}};
  const button={innerHTML:'말하기',classList:{add(){},remove(){}},setAttribute(){}};const input={value:'기존 메모',maxLength:20};
  try{
    bindVoiceInput({button,input,report(){},onFinish(){finished++;}});button.onclick();speech.onresult({results:[[{transcript:'김민수 미팅'}]]});button.onclick();
    assert.equal(input.value,'기존 메모 김민수 미팅');assert.equal(finished,1);
    button.onclick();speech.onresult({results:[[{transcript:'추가 내용'}]]});events.dispatchEvent(new CustomEvent('malhae-voice-start',{detail:'schedule'}));assert.equal(finished,1);
    button.onclick();speech.onerror({error:'not-allowed'});speech.onend();assert.equal(finished,1);
  }finally{for(const [key,value]of Object.entries(before)){if(value===undefined)delete global[key];else global[key]=value;}}
});
