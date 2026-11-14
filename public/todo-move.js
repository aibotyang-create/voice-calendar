import {seoulDay} from './calendar.js';
import {nextTodoOrder} from './people-data.js';

export function todoMoveTargets(date,now=Date.now()){
  const today=seoulDay(now),tomorrow=seoulDay(Date.parse(today+'T12:00:00+09:00')+86400000);
  return [...(date===today?[]:[{date:today,label:'오늘'}]),{date:tomorrow,label:'내일'}];
}

export async function moveStoredTodo(fs,db,root,id,date,restore=false){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('이동할 날짜를 확인해주세요.');
  const result=await fs.getDocs(fs.query(fs.collection(db,...root,'todos'),fs.where('date','==',date),fs.limit(300)));
  const items=result.docs.map(doc=>({...doc.data(),id:doc.id}));
  if(items.filter(item=>!item.archived&&item.id!==id).length>=300)throw Error('하루 할 일은 최대 300개까지 저장할 수 있어요.');
  const ref=fs.doc(db,...root,'todos',id);
  await fs.runTransaction(db,async transaction=>{
    const snapshot=await transaction.get(ref);
    if(!snapshot.exists()||(!restore&&snapshot.data().archived))throw Error('이동할 할 일을 찾지 못했어요.');
    if(snapshot.data().date===date&&!restore)return;
    transaction.update(ref,{...(restore?{archived:false}:{}),date,order:nextTodoOrder(items,date),updatedAt:fs.serverTimestamp()});
  });
}
