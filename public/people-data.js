export const categories=['대표','멘토','기관','지인','친구'];
export const defaultCategories=categories.map((name,i)=>({id:'fixed-'+i,name,color:['#9daee4','#e3b989','#8fc5bc','#b7a4d6','#e4a8bb'][i]}));
export function normalizedCategory(value,options=defaultCategories){const name=String(value||'').trim();return options.some(c=>c.name===name)?name:'';}
export function dailyTodoItems(items,date){return items.filter(t=>!t.archived&&t.date===date).sort((a,b)=>(a.order??a.createdAt)-(b.order??b.createdAt)||a.createdAt-b.createdAt||a.id.localeCompare(b.id));}
export function nextTodoOrder(items,date){return Math.max(0,...dailyTodoItems(items,date).map(t=>t.order??t.createdAt))+1;}
export function categoryOptions(records=[]){const options=new Map(defaultCategories.map(c=>[c.id,{...c}]));for(const c of records)if(options.has(c.id)||c.id?.startsWith('user-'))options.set(c.id,{...c});return [...options.values()].filter(c=>c.name!=='__removed__');}
export function contactColor(contact,options=defaultCategories){return options.find(c=>c.name===normalizedCategory(contact.category,options))?.color||'#b7a4d6';}
export function cleanContact(input,options=defaultCategories){
  const fields={name:100,company:200,title:100,lastContact:10,notes:4000,focus:1000,followup:1000,email:200,phone:100,address:500,sns:500,metAt:300,registeredOn:10,relationship:40};const out={};
  for(const [key,max] of Object.entries(fields))out[key]=String(input[key]||'').trim().slice(0,max);
  for(const key of ['sns','metAt','registeredOn','relationship'])if(!out[key])delete out[key];
  out.category=normalizedCategory(input.category??'지인',options);out.color=/^#[0-9a-f]{6}$/i.test(input.color||'')?input.color:'';out.strength=Math.max(1,Math.min(5,Number.parseInt(input.strength)||2));out.archived=Boolean(input.archived);
  out.tags=[...new Set((Array.isArray(input.tags)?input.tags:[]).map(t=>String(t).trim().slice(0,40)).filter(Boolean))].slice(0,20);
  return out;
}
export function matchPeople(event,contacts){
  const text=(event.summary||'')+' '+(event.description||'');const emails=new Set((event.attendees||[]).map(a=>(a.email||'').toLowerCase()));
  return contacts.filter(p=>!p.archived&&((p.email&&emails.has(p.email.toLowerCase()))||(p.name.length>=2&&text.includes(p.name))));
}
export function contactAge(date,now=Date.now()){
  if(!/^\d{4}-\d\d-\d\d$/.test(date||''))return null;return Math.max(0,Math.floor((now-Date.parse(date+'T00:00:00+09:00'))/86400000));
}
