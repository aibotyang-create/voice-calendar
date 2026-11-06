export function shiftedDay(day,offset){return new Date(Date.parse(day+'T12:00:00Z')+offset*86400000).toISOString().slice(0,10);}
export function pastelColor(hex,amount=.78){if(!/^#[0-9a-f]{6}$/i.test(hex||''))return '#eee8f8';return '#'+[1,3,5].map(i=>Math.round(parseInt(hex.slice(i,i+2),16)*(1-amount)+255*amount).toString(16).padStart(2,'0')).join('');}
export function insertTodoOrder(items,afterId,newId){const ids=items.map(p=>p.id),index=afterId===null?-1:ids.indexOf(afterId);ids.splice(index+1,0,newId);return ids;}
