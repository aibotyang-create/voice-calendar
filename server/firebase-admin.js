import {getApps,initializeApp,cert} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import {firebaseConfig} from '../public/firebase-config.js';
export function serverFirebase(){let credentials;try{credentials=JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT||'');}catch{throw Error('서버 Firebase 관리자 키 설정이 필요합니다.');}let expected=firebaseConfig.projectId;try{expected=JSON.parse(process.env.FIREBASE_WEB_CONFIG||'{}').projectId||expected;}catch{}if(credentials.project_id!==expected||!credentials.private_key||!credentials.client_email)throw Error('서버 Firebase 프로젝트와 관리자 키를 확인해주세요.');const app=getApps().find(app=>app.name==='pin-lock')||initializeApp({credential:cert(credentials),projectId:expected},'pin-lock');return {auth:getAuth(app),db:getFirestore(app),projectId:expected};}
