export function contactChanges(before,after){return Object.fromEntries(Object.entries(after).filter(([key,value])=>JSON.stringify(value)!==JSON.stringify(before?.[key])));}
export function formatContactPhone(value){const text=String(value||''),digits=text.replace(/\D/g,'');return digits.length===11?digits.slice(0,3)+'-'+digits.slice(3,7)+'-'+digits.slice(7):text;}
export function createContactAutosave({write,onState=()=>{},delay=450}){
 let current=null,timer=null,chain=Promise.resolve();
 function enqueue(session,value){if(!session||!value)return Promise.resolve(false);const fingerprint=JSON.stringify(value);if(fingerprint===session.last)return Promise.resolve(true);const run=async()=>{if(fingerprint===session.last)return true;if(current===session)onState('saving',session);try{await write(value,session);session.last=fingerprint;if(current===session)onState('saved',session);return true;}catch(error){onState('error',session,error);return false;}};const result=chain.then(run,run);chain=result.catch(()=>{});return result;}
 function flush(){clearTimeout(timer);timer=null;return current?enqueue(current,current.read()):Promise.resolve(false)}
 return {open(session){flush();current=session;current.last=session.persisted===false?null:JSON.stringify(current.read());},change(){if(!current)return;current.dirty=true;clearTimeout(timer);onState('pending',current);const target=current;timer=setTimeout(()=>{timer=null;enqueue(target,target.read())},delay);},flush,close(){const result=flush();current=null;return result;}};
}
