export const categories=['고객','파트너','투자자','지인'];
export function cleanContact(input){
  const fields={name:100,company:200,title:100,lastContact:10,notes:4000,focus:1000,followup:1000,email:200,phone:100};const out={};
  for(const [key,max] of Object.entries(fields))out[key]=String(input[key]||'').trim().slice(0,max);
  out.category=categories.includes(input.category)?input.category:'지인';out.strength=Math.max(1,Math.min(5,Number.parseInt(input.strength)||3));out.archived=Boolean(input.archived);
  return out;
}
export function matchPeople(event,contacts){
  const text=(event.summary||'')+' '+(event.description||'');const emails=new Set((event.attendees||[]).map(a=>(a.email||'').toLowerCase()));
  return contacts.filter(p=>!p.archived&&((p.email&&emails.has(p.email.toLowerCase()))||(p.name.length>=2&&text.includes(p.name))));
}
export function contactAge(date,now=Date.now()){
  if(!/^\d{4}-\d\d-\d\d$/.test(date||''))return null;return Math.max(0,Math.floor((now-Date.parse(date+'T00:00:00+09:00'))/86400000));
}
