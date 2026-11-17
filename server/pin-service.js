import {randomBytes} from 'node:crypto';
import {validPinRecord,verifyPin,signSessionId,readSignedSession} from './pin-crypto.js';
export const LOCK_COOKIE='__Host-ai_calendar_lock',SESSION_MS=60*60*1000;
const fail=(status,message,retryAfter)=>Object.assign(Error(message),{status,retryAfter});
export function createPinService({db,auth,pepper,bootstrapRecord,allowedEmail,checkRules,now=Date.now}){
 const account=uid=>db.doc('_privatePin/'+uid),session=id=>db.doc('_privateSessions/'+id);
 async function identity(token){let decoded;try{decoded=await auth.verifyIdToken(token,true);}catch{throw fail(401,'Google로 다시 로그인해주세요.');}if(typeof allowedEmail!=='string'||!allowedEmail||typeof decoded.email!=='string'||!decoded.email||!decoded.uid||decoded.email_verified!==true||decoded.email?.toLowerCase()!==allowedEmail?.toLowerCase())throw fail(403,'허용된 Google 계정으로 로그인해주세요.');return decoded;}
 async function reserve(uid){return db.runTransaction(async tx=>{const ref=account(uid),snapshot=await tx.get(ref),stored=snapshot.exists?snapshot.data():null;if(!stored&&!validPinRecord(bootstrapRecord))throw fail(503,'서버 PIN 초기 설정이 필요합니다.');const data=stored||{record:bootstrapRecord,attempts:0,lockedUntil:0};if(!validPinRecord(data.record))throw fail(503,'서버 PIN 설정을 확인해주세요.');const time=now();if(data.lockedUntil>time)throw fail(429,'입력 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',Math.ceil((data.lockedUntil-time)/1000));const attempts=(data.lockedUntil?0:Number(data.attempts)||0)+1;tx.set(ref,{...data,attempts,lockedUntil:attempts>=5?time+15*60*1000:0,updatedAt:time});return data.record;});}
 async function inspect(cookie){const id=readSignedSession(cookie,pepper);if(!id)return null;const snapshot=await session(id).get();if(!snapshot.exists)return null;const data=snapshot.data();if(data.revoked||data.expiresAt<=now()||data.email!==allowedEmail?.toLowerCase())return null;return {id,...data};}
 async function unlock({idToken,pin,purpose,cookie}){if(!['workspace','people'].includes(purpose)||typeof pin!=='string'||!/^\d{6}$/.test(pin))throw fail(400,'6자리 숫자를 입력해주세요.');const user=await identity(idToken);let existing=null;if(purpose==='people'){existing=await inspect(cookie);if(!existing||existing.uid!==user.uid)throw fail(401,'먼저 앱 잠금을 해제해주세요.');}else{if(!checkRules||!await checkRules(idToken,user.uid))throw fail(503,'PIN 잠금용 Firebase 보안 규칙을 먼저 게시해주세요.');}
  const record=await reserve(user.uid);if(!await verifyPin(pin,record,pepper))throw fail(401,'비밀번호가 올바르지 않습니다.');await account(user.uid).update({attempts:0,lockedUntil:0,updatedAt:now()});
  if(purpose==='people'){await session(existing.id).update({peopleVerifiedAt:now()});return {expiresAt:existing.expiresAt,peopleVerified:true};}
  const id=randomBytes(32).toString('base64url'),expiresAt=now()+SESSION_MS,googleSub=user.firebase?.identities?.['google.com']?.[0];if(!googleSub)throw fail(403,'Google 계정으로 다시 로그인해주세요.');
  await session(id).set({uid:user.uid,email:user.email.toLowerCase(),googleSub,expiresAt,createdAt:now(),revoked:false,peopleVerifiedAt:0});const customToken=await auth.createCustomToken(user.uid,{app_lock_sid:id});return {customToken,expiresAt,cookie:signSessionId(id,pepper)};
 }
 async function revoke(cookie){const current=await inspect(cookie);if(current)await session(current.id).update({revoked:true,expiresAt:now()});}
 return {unlock,inspect,revoke};
}
