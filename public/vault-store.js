import {fileInfo,validDay} from './vault-data.js';
import {createDriveFiles} from './drive-files.js';
export function createVaultStore(fs,db,root,accessToken){
  const drive=createDriveFiles(accessToken,root[1]),doc=id=>fs.doc(db,...root,'documents',id),attempts=new Map();
  async function save(entry,blob){const {id,...data}=entry,uploaded=await drive.save(blob,{filename:data.filename,mime:data.mime,date:data.date,entryId:id,updateFileId:entry.driveFileId||''});try{await fs.setDoc(doc(id),{...data,storagePath:'',driveFileId:uploaded.id,driveViewLink:uploaded.url,updatedAt:fs.serverTimestamp()});}catch(e){throw Error('파일은 Drive에 저장됐지만 보관함 목록 저장에 실패했어요. 최신 Firestore 규칙을 게시하고 다시 시도해주세요.');}return {...entry,driveFileId:uploaded.id,driveViewLink:uploaded.url};}
  return {
    watchDocuments:(onData,onError)=>fs.onSnapshot(fs.query(fs.collection(db,...root,'documents'),fs.orderBy('date','desc'),fs.limit(500)),s=>onData(s.docs.map(d=>({...d.data(),id:d.id}))),onError),
    saveDocument:async entry=>{if(!validDay(entry.date))throw Error('보관할 날짜를 선택해주세요.');return save(entry,new Blob([entry.content],{type:entry.mime}));},
    uploadDocument:async(file,date,contactId='',id)=>{if(!validDay(date))throw Error('보관할 날짜를 선택해주세요.');const info=fileInfo(file),key=[info.filename,file.size,file.lastModified,date,contactId].join('|');if(!id){if(!attempts.has(key))attempts.set(key,crypto.randomUUID());id=attempts.get(key);}const content=/\.(txt|md|csv)$/i.test(info.filename)?(await file.text()).slice(0,60000):'';const result=await save({id,title:info.filename,filename:info.filename,date,contactId,source:'upload',storagePath:'',mime:info.mime,size:info.size,content,sourceIds:[],createdAt:Date.now(),archived:false},file);attempts.delete(key);return result;},
    documentBlob:async entry=>(entry.source==='generated'||entry.source==='note')?new Blob([entry.content],{type:'text/markdown;charset=utf-8'}):drive.blob(entry.driveFileId)
  };
}
