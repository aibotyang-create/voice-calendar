import {outlineText,encodeOutline} from './todo-outline.js';
export function bindInlineTodoEdit(label,{value,save,onSaved,onFinish,onError}){
 label.tabIndex=0;label.setAttribute('role','button');label.setAttribute('aria-label',outlineText(value).text+' 수정');label.title='클릭해서 수정';
 function start(){if(!label.isConnected)return;const input=document.createElement('input'),outline=outlineText(value);input.className='weekly-todo-editor';input.type='text';input.maxLength=290;input.value=outline.text;input.setAttribute('aria-label','이번주 할 일 내용 수정');label.replaceWith(input);input.focus();input.select?.();let saving=false,finished=false;
  function finish(){if(finished)return;finished=true;input.replaceWith(label);onFinish();}
  async function persist(){if(saving||finished)return;const text=input.value.trim();if(!text){finish();return;}const encoded=encodeOutline(text,outline.depth);if(encoded===value){finish();return;}saving=true;input.disabled=true;try{await save(encoded);value=encoded;label.textContent=encoded;onSaved(encoded);finish();}catch(e){onError(e);input.disabled=false;input.focus();}finally{saving=false;}}
  input.onblur=persist;input.onkeydown=event=>{if(event.isComposing||event.keyCode===229)return;if(event.key==='Enter'){event.preventDefault();persist();}else if(event.key==='Escape'&&!saving){event.preventDefault();finish();}};
 }
 label.onclick=start;label.onkeydown=event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();start();}};
}
