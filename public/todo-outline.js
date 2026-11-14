// Tabs and a bullet encode outline depth in the existing text field, so older
// clients and exports retain readable subtasks without a Firestore migration.
export function outlineText(text){const match=String(text||'').match(/^(\t{1,3})· (.*)$/s);return match?{depth:match[1].length,text:match[2]}:{depth:0,text:String(text||'')};}
export function encodeOutline(text,depth=0){const value=String(text).trim(),level=Math.max(0,Math.min(3,Number(depth)||0));return (level?'\t'.repeat(level)+'· ':'')+value;}
export function styleOutline(input,depth){input.dataset.outlineDepth=String(depth);input.style.setProperty('--todo-indent',depth*22+'px');const row=input.closest('[data-todo-id]');if(row){row.classList.toggle('todo-child',depth>0);row.style.setProperty('--todo-indent',depth*22+'px');}}
export function bindTodoOutline(list,{getItems,getStore,report}){
 list.addEventListener('keydown',async event=>{
  const input=event.target.closest('.todo-editor');if(!input||event.key!=='Tab'||event.isComposing||input.disabled)return;
  const row=input.closest('[data-todo-id]'),anchor=row||input;let previous=anchor.previousElementSibling;while(previous&&!previous.dataset.todoId)previous=previous.previousElementSibling;
  const prior=getItems().find(item=>item.id===previous?.dataset.todoId),old=Number(input.dataset.outlineDepth)||0;
  if(!event.shiftKey&&!prior)return;
  event.preventDefault();event.stopImmediatePropagation();const depth=event.shiftKey?Math.max(0,old-1):Math.min(3,old+1,outlineText(prior.text).depth+1);if(depth===old)return;
  const store=getStore();if(!store)return;styleOutline(input,depth);
  if(!row)return;
  const item=getItems().find(item=>item.id===row.dataset.todoId);if(!item)return;
  const text=encodeOutline(input.value,depth);if(!input.value.trim())return;
  try{await store.patchTodoText(item.id,text);item.text=text;report('저장됨');}catch(error){styleOutline(input,old);report(error.message);}
 },true);
}
