const compact=value=>String(value||'').replace(/\s+/g,'');
const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function enrichContactDetails(value,source,today){
 if(!Array.isArray(value?.contacts))return value;
 const single=value.contacts.length===1;
 return {...value,contacts:value.contacts.map(raw=>{
  if(!raw?.name||!source.includes(raw.name))return raw;
  const person={...raw,tags:[...(raw.tags||[])]};
  if(person.intent==='update')return person;
  const role=new RegExp(escape(person.name)+'\\s*(대표|팀장|이사|부장|교수|선생님)').exec(source);
  if(role){if(!person.title)person.title=role[1];if(role[1]==='대표'&&!person.categoryExplicit){person.category='대표';person.categoryExplicit=true;}}
  let place=person.metAt||'';
  if(single&&!place){
   // A standalone trailing location clause belongs to the sole participant.
   const tail=source.split(/[.!?\n]/).map(s=>s.trim()).filter(Boolean).at(-1)||'';
   const match=tail.match(/^([가-힣A-Za-z0-9][가-힣A-Za-z0-9 ·-]{1,60}?)에서(?:\s*(?:만났.*|처음.*))?$/);
   if(match)place=match[1].trim();
  }
  if(place&&compact(source).includes(compact(place))){person.metAt=place;if(!person.tags.some(t=>compact(t)===compact(place)))person.tags.push(place);}
  else person.metAt='';
  if(single&&!person.intro){const activity=new RegExp('(?:^|\\s)([^.!?\\n]{1,60}?)하는\\s*'+escape(person.name)).exec(source);if(activity)person.intro=activity[1].replace(/^(?:나(?:는)?\s+)?(?:오늘|어제|그저께)\s*/,'').trim();}
  if(!person.meeting?.text&&/만났/.test(source)&&single){
   const relative=source.match(/(?:^|\s)(오늘|어제|그저께)(?:\s|$)/)?.[1];
   const date=person.lastContact||(relative?new Date(Date.parse(today+'T12:00:00Z')-({오늘:0,어제:1,그저께:2}[relative])*86400000).toISOString().slice(0,10):today);
   person.meeting={date,text:source.trim(),sourceQuote:source};person.lastContact=date;
  }
  return person;
 })};
}
