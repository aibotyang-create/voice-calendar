import {createHmac,randomBytes,scrypt as derive,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(derive);
export const PIN_COST={N:131072,r:8,p:1};
function pepperKey(value){if(typeof value!=='string'||Buffer.from(value,'base64url').length<32)throw Error('Server PIN key is missing');return Buffer.from(value,'base64url');}
function prehash(pin,pepper){return createHmac('sha256',pepperKey(pepper)).update(pin,'utf8').digest();}
export function validPinRecord(record){return record?.v===1&&record.algorithm==='scrypt-hmac-sha256'&&record.N===PIN_COST.N&&record.r===8&&record.p===1&&typeof record.salt==='string'&&Buffer.from(record.salt,'base64url').length===16&&typeof record.hash==='string'&&Buffer.from(record.hash,'base64url').length===64;}
export async function hashPin(pin,pepper){if(!/^\d{6}$/.test(pin))throw Error('PIN must have six digits');const salt=randomBytes(16),key=await scrypt(prehash(pin,pepper),salt,64,{...PIN_COST,maxmem:256*1024*1024});return {v:1,algorithm:'scrypt-hmac-sha256',...PIN_COST,salt:salt.toString('base64url'),hash:key.toString('base64url')};}
export async function verifyPin(pin,record,pepper){if(!/^\d{6}$/.test(pin)||!validPinRecord(record))return false;const key=await scrypt(prehash(pin,pepper),Buffer.from(record.salt,'base64url'),64,{...PIN_COST,maxmem:256*1024*1024});return timingSafeEqual(key,Buffer.from(record.hash,'base64url'));}
export function signSessionId(id,pepper){return id+'.'+createHmac('sha256',pepperKey(pepper)).update('workspace-session:'+id).digest('base64url');}
export function readSignedSession(value,pepper){if(typeof value!=='string'||!/^[-\w]{43}\.[-\w]{43}$/.test(value))return null;const id=value.split('.')[0],expected=Buffer.from(signSessionId(id,pepper)),actual=Buffer.from(value);return expected.length===actual.length&&timingSafeEqual(expected,actual)?id:null;}
