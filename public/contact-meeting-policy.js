const compact=value=>String(value||'').replace(/\s+/g,'').toLowerCase();
export function explicitFirstMeeting(text){return /(?:처음(?:으로|에)?|최초(?:로)?)\s*(?:(?:서로|직접|인사를?)\s*)?(?:만났|만난|만나|만남|뵀|뵈|봤|알게|소개받|인사)/.test(text||'');}
export function encounterChanges(current,entry){
 const changes={...entry.changes};
 if(current&&!entry.firstMeetingExplicit){
  const place=compact(changes.metAt||entry.data?.metAt);
  delete changes.metAt;
  if(place&&changes.tags)changes.tags=changes.tags.filter(tag=>{const value=compact(tag);return value&&!place.includes(value)&&!value.includes(place);});
  if(!changes.tags?.length)delete changes.tags;
 }
 return changes;
}
