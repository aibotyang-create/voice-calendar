import {firebaseConfig} from '../public/firebase-config.js';
export default function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET') return res.status(405).json({error:'GET 요청만 가능합니다.'});
  let firebase=firebaseConfig;try{const raw=JSON.parse(process.env.FIREBASE_WEB_CONFIG||'null');if(raw?.apiKey&&raw?.projectId&&raw?.appId&&raw?.authDomain){firebase=Object.fromEntries(['apiKey','authDomain','projectId','appId','storageBucket','messagingSenderId'].filter(k=>typeof raw[k]==='string').map(k=>[k,raw[k]]));}}catch{}
  res.json({clientId:process.env.GOOGLE_CLIENT_ID||'',ready:Boolean(process.env.GOOGLE_CLIENT_ID&&process.env.OPENAI_API_KEY&&process.env.ALLOWED_EMAIL),firebase});
}
