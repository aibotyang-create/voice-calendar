export default function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET') return res.status(405).json({error:'GET 요청만 가능합니다.'});
  res.json({clientId:process.env.GOOGLE_CLIENT_ID||'',ready:Boolean(process.env.GOOGLE_CLIENT_ID&&process.env.OPENAI_API_KEY&&process.env.ALLOWED_EMAIL)});
}
