export function seoulDay(value){return new Date(new Date(value).getTime()+9*3600000).toISOString().slice(0,10);}
export function monthRange(year,month){
  return {start:new Date(Date.UTC(year,month,1)-9*3600000).toISOString(),end:new Date(Date.UTC(year,month+1,1)-9*3600000).toISOString(),days:new Date(Date.UTC(year,month+1,0)).getUTCDate(),weekday:new Date(Date.UTC(year,month,1)).getUTCDay()};
}
export function eventDays(event){
  if(!event.start||!event.end) return [];
  const start=event.start.date?Date.parse(event.start.date+'T00:00:00+09:00'):Date.parse(event.start.dateTime);
  const end=event.end.date?Date.parse(event.end.date+'T00:00:00+09:00'):Date.parse(event.end.dateTime);
  if(!Number.isFinite(start)||!Number.isFinite(end)) return [];
  const days=[];let day=Date.parse(seoulDay(start)+'T00:00:00+09:00');
  const last=Date.parse(seoulDay(Math.max(start,end-1))+'T00:00:00+09:00');
  for(;day<=last&&days.length<3660;day+=86400000) days.push(seoulDay(day));
  return days;
}
export function calendarUrl(value){try{const url=new URL(value);if(url.protocol==='https:'&&['www.google.com','calendar.google.com'].includes(url.hostname)) return url.href;}catch{}return 'https://calendar.google.com/';}
export function resolveEventColor(event,palette={},calendarColor={}){
  const chosen=palette[event.colorId]||calendarColor;const valid=v=>/^#[0-9a-f]{6}$/i.test(v||'');const background=valid(chosen.background)?chosen.background:'#e5def6';const foreground=valid(chosen.foreground)?chosen.foreground:'#493964';return {background,foreground};
}
