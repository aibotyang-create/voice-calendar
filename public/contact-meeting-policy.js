const compact=value=>String(value||'').replace(/\s+/g,'').toLowerCase();
export function explicitFirstMeeting(text){if(/(?:처음|최초)(?:으로)?\s*(?:만난|만나는|뵌|본)(?:\s*(?:것|거|게|건))?(?:도|이|은|는)?\s*아니|처음(?:이|은|은요)?\s*아니/.test(text||''))return false;return /(?:처음(?:으로|에)?|최초(?:로)?)\s*(?:(?:서로|직접|인사를?)\s*)?(?:만났|만난|만나|만남|뵀|뵈|봤|알게|소개받|인사)/.test(text||'');}
export function encounterChanges(current,entry){
 const changes={...entry.changes};
 if(!entry.firstMeetingExplicit){
  const place=compact(changes.metAt||entry.data?.metAt);
  delete changes.metAt;
  if(place&&changes.tags)changes.tags=changes.tags.filter(tag=>{const value=compact(tag);return value&&!place.includes(value)&&!value.includes(place);});
  if(!changes.tags?.length)delete changes.tags;
 }
 return changes;
}
