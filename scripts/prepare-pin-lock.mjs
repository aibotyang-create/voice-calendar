import {writeFile,mkdir} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {hashPin} from '../server/pin-crypto.js';
const destination=resolve(process.argv[2]||'.env.pin-lock.private'),chunks=[];for await(const chunk of process.stdin)chunks.push(chunk);const pin=Buffer.concat(chunks).toString('utf8').trim();if(!/^\d{6}$/.test(pin))throw Error('표준 입력으로 6자리 PIN을 전달해주세요.');
const pepper=randomBytes(32).toString('base64url'),record=await hashPin(pin,pepper);await mkdir(dirname(destination),{recursive:true});await writeFile(destination,'# PRIVATE — never commit or upload this file\nAPP_LOCK_PEPPER='+pepper+'\nAPP_PIN_BOOTSTRAP_RECORD='+JSON.stringify(record)+'\nAPP_LOCK_REQUIRED=true\n',{flag:'wx',mode:0o600});console.log('설정 파일 생성 완료: '+destination);
