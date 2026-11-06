import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {existsSync} from 'node:fs';
if(existsSync('.env')) process.loadEnvFile('.env');
const handlers={'/api/assistant':(await import('./api/assistant.js')).default,'/api/config':(await import('./api/config.js')).default,'/api/parse':(await import('./api/parse.js')).default};
http.createServer(async(req,res)=>{
  res.status=n=>{res.statusCode=n;return res;};res.json=v=>{res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(v));};
  try{
    const path=new URL(req.url,'http://localhost').pathname;
    if(handlers[path]){let raw='';for await(const c of req){raw+=c;if(raw.length>4100000) return res.status(413).json({error:'입력이 너무 길어요.'});}req.body=raw?JSON.parse(raw):{};return await handlers[path](req,res);}
    const file=resolve('public','.'+(path==='/'?'/index.html':decodeURIComponent(path)));
    if(!file.startsWith(resolve('public')+'\\')&&!file.startsWith(resolve('public')+'/')) return res.status(403).end();
    const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
    res.setHeader('Content-Type',types[extname(file)]||'text/plain');res.end(await readFile(file));
  }catch{res.status(404).end('Not found');}
}).listen(3000,'127.0.0.1',()=>console.log('말해 캘린더: http://localhost:3000'));
