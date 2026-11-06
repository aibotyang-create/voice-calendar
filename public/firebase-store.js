export async function prepareStore(config){
  if(!config) throw Error('Firebase 설정 전이에요. 설정 안내에 따라 FIREBASE_WEB_CONFIG를 추가해주세요.');
  const [app,auth,fs]=await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js')
  ]);
  const firebase=app.getApps().length?app.getApp():app.initializeApp(config);
  const session=auth.getAuth(firebase);await auth.setPersistence(session,auth.inMemoryPersistence);
  return {connect:async(onData,onError)=>{
  const provider=new auth.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
  const user=(await auth.signInWithPopup(session,provider)).user;
  const db=fs.getFirestore(firebase),root=['users',user.uid];let contacts=[],tasks=[],categories=[],todos=[];
  const report=()=>onData(contacts,tasks,categories,todos);
  const offContacts=fs.onSnapshot(fs.query(fs.collection(db,...root,'contacts'),fs.limit(500)),snapshot=>{contacts=snapshot.docs.map(doc=>({...doc.data(),id:doc.id}));report();},onError);
  const offTasks=fs.onSnapshot(fs.query(fs.collection(db,...root,'tasks'),fs.limit(1000)),snapshot=>{tasks=snapshot.docs.map(doc=>({...doc.data(),id:doc.id}));report();},onError);
  const offCategories=fs.onSnapshot(fs.query(fs.collection(db,...root,'categories'),fs.limit(50)),snapshot=>{categories=snapshot.docs.map(doc=>({...doc.data(),id:doc.id}));report();},onError);
  let activeDay='',offTodos=()=>{};
  return {
    save:async contact=>{const {id,...data}=contact;await fs.setDoc(fs.doc(db,...root,'contacts',id),{...data,updatedAt:fs.serverTimestamp()});},
    task:async(id,eventId,label,done)=>fs.setDoc(fs.doc(db,...root,'tasks',id),{eventId,label,done,updatedAt:fs.serverTimestamp()}),
    category:async(category,previousName,people=[])=>{const changed=people.filter(p=>previousName&&previousName!==category.name&&p.category===previousName);if(changed.length>499)throw Error('한 번에 변경할 수 있는 인맥 수를 초과했어요.');const batch=fs.writeBatch(db);const {id,...data}=category;batch.set(fs.doc(db,...root,'categories',id),{...data,updatedAt:fs.serverTimestamp()});for(const p of changed)batch.update(fs.doc(db,...root,'contacts',p.id),{category:category.name,updatedAt:fs.serverTimestamp()});await batch.commit();},
    watchDay:day=>{if(day===activeDay)return;activeDay=day;offTodos();todos=[];report();offTodos=fs.onSnapshot(fs.query(fs.collection(db,...root,'todos'),fs.where('date','==',day),fs.limit(300)),snapshot=>{if(day!==activeDay)return;todos=snapshot.docs.map(doc=>({...doc.data(),id:doc.id}));report();},onError);},
    todo:async todo=>{const {id,...data}=todo;await fs.setDoc(fs.doc(db,...root,'todos',id),{...data,updatedAt:fs.serverTimestamp()});},
    close:()=>{offContacts();offTasks();offCategories();offTodos();auth.signOut(session).catch(()=>{});}
  };
  }};
}
