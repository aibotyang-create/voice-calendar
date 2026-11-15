import {todoSubtree} from './todo-subtree.js';
import {dailyTodoItems} from './people-data.js';
import {seoulDay} from './calendar.js';
import {nextTodoOrder} from './people-data.js';

export function todoMoveTargets(date,now=Date.now()){
  const today=seoulDay(now),tomorrow=seoulDay(Date.parse(today+'T12:00:00+09:00')+86400000);
  return [...(date===today?[]:[{date:today,label:'오늘'}]),{date:tomorrow,label:'내일'}];
}

export async function updateStoredTodoGroup(fs,db,root,id,patchFor){
 const ref=fs.doc(db,...root,'todos',id),initial=await fs.runTransaction(db,tx=>tx.get(ref));if(!initial.exists())throw Error('이동할 할 일을 찾지 못했어요.');const original={...initial.data(),id};
 const result=await fs.getDocs(fs.query(fs.collection(db,...root,'todos'),fs.where('date','==',original.date),fs.limit(300)));
 const ordered=dailyTodoItems(result.docs.map(d=>({...d.data(),id:d.id})),original.date),group=original.archived?[original]:todoSubtree(ordered,id);if(!group.length)group.push(original);
 const patches=await patchFor(group,original);
 await fs.runTransaction(db,async tx=>{const rows=await Promise.all(group.map(t=>tx.get(fs.doc(db,...root,'todos',t.id))));for(let i=0;i<rows.length;i++){if(!rows[i].exists()||rows[i].data().date!==original.date||!!rows[i].data().archived!==!!original.archived)throw Error('할 일이 변경됐어요. 다시 시도해주세요.');}group.forEach((t,i)=>tx.update(fs.doc(db,...root,'todos',t.id),{...patches[i],updatedAt:fs.serverTimestamp()}));});
}
export async function moveStoredTodo(fs,db,root,id,date,restore=false){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('이동할 날짜를 확인해주세요.');
 return updateStoredTodoGroup(fs,db,root,id,async(group,original)=>{if(original.archived&&!restore)throw Error('이동할 할 일을 찾지 못했어요.');const result=await fs.getDocs(fs.query(fs.collection(db,...root,'todos'),fs.where('date','==',date),fs.limit(300))),items=result.docs.map(d=>({...d.data(),id:d.id})),ids=new Set(group.map(t=>t.id));if(items.filter(t=>!t.archived&&!ids.has(t.id)).length+group.length>300)throw Error('하루 할 일은 최대 300개까지 저장할 수 있어요.');const order=nextTodoOrder(items,date);return group.map((t,i)=>({...restore?{archived:false}:{},date,order:order+i}));});
}
