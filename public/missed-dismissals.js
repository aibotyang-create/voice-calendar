export const MISSED_DISMISSAL_EVENT='__missed_todo_dismissal__';
export function saveMissedDismissal(fs,db,root,id){
 if(typeof id!=='string'||!id||id.includes('/')||id.length>300)throw Error('할 일 정보를 확인해주세요.');
 return fs.setDoc(fs.doc(db,...root,'tasks','missed-hide-'+id),{eventId:MISSED_DISMISSAL_EVENT,label:id,done:true,updatedAt:fs.serverTimestamp()});
}
