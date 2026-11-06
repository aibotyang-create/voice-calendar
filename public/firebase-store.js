import {createVaultStore} from './vault-store.js';
import {authenticateStore} from './google-session.js';
export async function prepareStore(config){
  if(!config) throw Error('Firebase 설정 전이에요. 설정 안내에 따라 FIREBASE_WEB_CONFIG를 추가해주세요.');
  const [app,auth,fs]=await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js')
  ]);
  const firebase=app.getApps().length?app.getApp():app.initializeApp(config);
  const session=auth.getAuth(firebase);await auth.setPersistence(session,auth.inMemoryPersistence);
  return {signOut:()=>auth.signOut(session),connect:async(onData,onError,accessToken)=>{
  const user=await authenticateStore(auth,session,accessToken);
  const db=fs.getFirestore(firebase),root=['users',user.uid];let contacts=[],tasks=[],categories=[],todos=[];
  const report=()=>onData(contacts,tasks,categories,todos);
  const offContacts=fs.onSnapshot(fs.query(fs.collection(db,...root,'contacts'),fs.limit(500)),snapshot=>{contacts=snapshot.docs.map(doc=>({...doc.data(),id:doc.id}));report();},onError);
  const offTasks=fs.onSnapshot(fs.query(fs.collection(db,...root,'tasks'),fs.limit(1000)),snapshot=>{tasks=snapshot.docs.map(doc=>({...doc.data(),id:doc.id}));report();},onError);
  const offCategories=fs.onSnapshot(fs.query(fs.collection(db,...root,'categories'),fs.limit(50)),snapshot=>{categories=snapshot.docs.map(doc=>({...doc.data(),id:doc.id}));report();},onError);
  let activeDay='',offTodos=()=>{};
  return {
    ...createVaultStore(fs,db,root,accessToken),
    save:async contact=>{const {id,...data}=contact;await fs.setDoc(fs.doc(db,...root,'contacts',id),{...data,updatedAt:fs.serverTimestamp()});},
    task:async(id,eventId,label,done)=>fs.setDoc(fs.doc(db,...root,'tasks',id),{eventId,label,done,updatedAt:fs.serverTimestamp()}),
    category:async(category,previousName,people=[])=>{const changed=people.filter(p=>previousName&&previousName!==category.name&&p.category===previousName);if(changed.length>499)throw Error('한 번에 변경할 수 있는 인맥 수를 초과했어요.');const batch=fs.writeBatch(db);const {id,...data}=category;batch.set(fs.doc(db,...root,'categories',id),{...data,updatedAt:fs.serverTimestamp()});for(const p of changed)batch.update(fs.doc(db,...root,'contacts',p.id),{category:category.name,updatedAt:fs.serverTimestamp()});await batch.commit();},
    watchDay:day=>{if(day===activeDay)return;activeDay=day;offTodos();todos=[];report();offTodos=fs.onSnapshot(fs.query(fs.collection(db,...root,'todos'),fs.where('date','==',day),fs.limit(300)),snapshot=>{if(day!==activeDay)return;todos=snapshot.docs.map(doc=>({...doc.data(),id:doc.id}));report();},onError);},
    todo:async todo=>{const {id,...data}=todo;await fs.setDoc(fs.doc(db,...root,'todos',id),{...data,updatedAt:fs.serverTimestamp()});},
    todosBatch:async entries=>{if(entries.length>300)throw Error('한 번에 최대 300개까지 기록할 수 있어요.');const batch=fs.writeBatch(db);for(const {id,...data} of entries)batch.set(fs.doc(db,...root,'todos',id),{...data,updatedAt:fs.serverTimestamp()});await batch.commit();},
    addExtractedTodos:async entries=>{if(entries.length>30)throw Error('한 번에 최대 30개까지 등록할 수 있어요.');return fs.runTransaction(db,async transaction=>{const refs=entries.map(entry=>fs.doc(db,...root,'todos',entry.id)),snapshots=await Promise.all(refs.map(ref=>transaction.get(ref)));let added=0;entries.forEach(({id,...data},i)=>{if(snapshots[i].exists())return;transaction.set(refs[i],{...data,updatedAt:fs.serverTimestamp()});added++;});return {added,skipped:entries.length-added};});},
    reorderTodos:async ids=>{if(ids.length>300||new Set(ids).size!==ids.length)throw Error('할 일 순서를 확인해주세요.');const batch=fs.writeBatch(db);ids.forEach((id,order)=>batch.update(fs.doc(db,...root,'todos',id),{order,updatedAt:fs.serverTimestamp()}));await batch.commit();},
    insertTodo:async(todo,ids)=>{if(ids.length>300||new Set(ids).size!==ids.length)throw Error('하루 할 일은 최대 300개까지 저장할 수 있어요.');const {id,...data}=todo,batch=fs.writeBatch(db);batch.set(fs.doc(db,...root,'todos',id),{...data,order:ids.indexOf(id),updatedAt:fs.serverTimestamp()});ids.filter(other=>other!==id).forEach(other=>batch.update(fs.doc(db,...root,'todos',other),{order:ids.indexOf(other),updatedAt:fs.serverTimestamp()}));await batch.commit();},
    watchTodos:(date,onData,onError)=>fs.onSnapshot(fs.query(fs.collection(db,...root,'todos'),fs.where('date','==',date),fs.limit(300)),snapshot=>onData(snapshot.docs.map(doc=>({...doc.data(),id:doc.id}))),onError),
    watchNote:(date,onData,onError)=>fs.onSnapshot(fs.doc(db,...root,'dailyNotes',date),snapshot=>onData(snapshot.exists()?snapshot.data().text:''),onError),
    note:async(date,text)=>fs.setDoc(fs.doc(db,...root,'dailyNotes',date),{text,updatedAt:fs.serverTimestamp()}),
    watchPlanning:(from,to,onData,onError)=>fs.onSnapshot(fs.query(fs.collection(db,...root,'todos'),fs.where('date','>=',from),fs.where('date','<=',to),fs.limit(1000)),snapshot=>onData(snapshot.docs.map(doc=>({...doc.data(),id:doc.id}))),onError),
    watchMemories:(onData,onError)=>fs.onSnapshot(fs.query(fs.collection(db,...root,'conversations'),fs.orderBy('date','desc'),fs.limit(200)),snapshot=>onData(snapshot.docs.map(doc=>({...doc.data(),id:doc.id}))),onError),
    deleteConversation:id=>fs.deleteDoc(fs.doc(db,...root,'conversations',id)),
    deleteContact:async(id)=>{await fs.updateDoc(fs.doc(db,...root,'contacts',id),{archived:true,updatedAt:fs.serverTimestamp()});},
    watchConversations:(contactId,onData,onError)=>fs.onSnapshot(fs.query(fs.collection(db,...root,'conversations'),fs.where('contactId','==',contactId),fs.limit(300)),snapshot=>onData(snapshot.docs.map(doc=>({...doc.data(),id:doc.id}))),onError),
    conversation:async(entry,lastContact)=>{const {id,...data}=entry,batch=fs.writeBatch(db);batch.set(fs.doc(db,...root,'conversations',id),{...data,updatedAt:fs.serverTimestamp()});batch.update(fs.doc(db,...root,'contacts',entry.contactId),{lastContact,updatedAt:fs.serverTimestamp()});await batch.commit();},
    close:(signOut=false)=>{offContacts();offTasks();offCategories();offTodos();if(signOut)auth.signOut(session).catch(()=>{});}
  };
  }};
}
