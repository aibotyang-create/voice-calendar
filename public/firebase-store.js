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
  const db=fs.getFirestore(firebase),root=['users',user.uid];let contacts=[],tasks=[];
  const report=()=>onData(contacts,tasks);
  const offContacts=fs.onSnapshot(fs.query(fs.collection(db,...root,'contacts'),fs.limit(500)),snapshot=>{contacts=snapshot.docs.map(doc=>({...doc.data(),id:doc.id}));report();},onError);
  const offTasks=fs.onSnapshot(fs.query(fs.collection(db,...root,'tasks'),fs.limit(1000)),snapshot=>{tasks=snapshot.docs.map(doc=>({...doc.data(),id:doc.id}));report();},onError);
  return {
    save:async contact=>{const {id,...data}=contact;await fs.setDoc(fs.doc(db,...root,'contacts',id),{...data,updatedAt:fs.serverTimestamp()});},
    task:async(id,eventId,label,done)=>fs.setDoc(fs.doc(db,...root,'tasks',id),{eventId,label,done,updatedAt:fs.serverTimestamp()}),
    close:()=>{offContacts();offTasks();auth.signOut(session).catch(()=>{});}
  };
  }};
}
