export function initTodoArchive({host,getData,today,onError}){
 const button=document.createElement('button'),list=document.createElement('div');button.type='button';button.className='text-button todo-archive-toggle';button.textContent='보관함';list.className='todo-archive-list';list.hidden=true;
 const controls=host.querySelector('.todo-date-controls');controls.before(button,list);let session=null,off=()=>{},items=[];
 button.onclick=()=>{list.hidden=!list.hidden;button.setAttribute('aria-expanded',String(!list.hidden));};
 function draw(){list.replaceChildren();button.textContent='보관함'+(items.length?' ('+items.length+')':'');if(!items.length){list.textContent='보관한 할 일이 없어요.';return;}
  for(const item of items){const row=document.createElement('div'),text=document.createElement('span'),restore=document.createElement('button');row.className='todo-archive-row';text.textContent=item.text;restore.type='button';restore.className='text-button';restore.textContent='오늘로 복원';restore.onclick=async()=>{const store=getData().store;if(!store)return;restore.disabled=true;try{await store.restoreTodo(item.id,today());}catch(e){onError(e);restore.disabled=false;}};row.append(text,restore);list.append(row);}
 }
 return {render(){const store=getData().store;if(store===session)return;off();session=store;items=[];draw();if(store)off=store.watchArchivedTodos(rows=>{if(getData().store!==store)return;items=rows.sort((a,b)=>b.date.localeCompare(a.date));draw();},onError);}};
}
