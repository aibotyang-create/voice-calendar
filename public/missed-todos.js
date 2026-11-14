import {shiftedDay} from './workspace-utils.js';
export function missedTodos(items,today){const from=shiftedDay(today,-7);return items.filter(t=>!t.done&&!t.archived&&t.date>=from&&t.date<today).sort((a,b)=>b.date.localeCompare(a.date)||(a.order??a.createdAt)-(b.order??b.createdAt)||a.id.localeCompare(b.id));}
export function initMissedTodos({host,getData,today,onError}){
 const panel=document.createElement('section');panel.className='card missed-todos';panel.innerHTML='<h2>이번주 놓친 할일들</h2><p class="missed-todo-state" role="status"></p><div class="missed-todo-list"></div>';host.append(panel);
 const list=panel.querySelector('.missed-todo-list'),status=panel.querySelector('.missed-todo-state');let session=null,day='',offs=[],days=new Map();
 function draw(){const items=missedTodos([...days.values()].flat(),today());list.replaceChildren();status.textContent=session?(items.length?'':'지난 7일간 놓친 할 일이 없어요.'):'로그인 후 확인할 수 있어요.';
  for(const item of items){const row=document.createElement('article'),body=document.createElement('div'),text=document.createElement('span'),date=document.createElement('small'),actions=document.createElement('div');row.className='missed-todo-row';body.className='missed-todo-body';text.textContent=item.text;date.textContent=item.date;body.append(text,date);actions.className='missed-todo-actions';
   for(const [label,target]of [['오늘',today()],['내일',shiftedDay(today(),1)],['보관함',null]]){const button=document.createElement('button');button.type='button';button.className='text-button';button.textContent=label;button.setAttribute('aria-label',item.text+' '+label+'으로 이동');button.onclick=async()=>{const store=getData().store;if(!store||store!==session)return;actions.querySelectorAll('button').forEach(b=>b.disabled=true);try{if(target)await store.moveTodo(item.id,target);else await store.archiveTodo(item.id);if(getData().store!==store)return;for(const [key,rows]of days)days.set(key,rows.filter(t=>t.id!==item.id));draw();}catch(e){onError(e);actions.querySelectorAll('button').forEach(b=>b.disabled=false);}};actions.append(button);}
   row.append(body,actions);list.append(row);
  }
 }
 return {render(){const store=getData().store;if(store===session&&day===today())return;offs.forEach(off=>off());offs=[];days.clear();session=store;day=today();draw();if(!store)return;const bound=store,viewDay=day;for(let i=1;i<=7;i++){const date=shiftedDay(day,-i);offs.push(store.watchTodos(date,items=>{if(session!==bound||day!==viewDay)return;days.set(date,items);draw();},onError));}}};
}
