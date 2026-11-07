const compact=value=>String(value||'').normalize('NFKC').replace(/[\s\-().·]/g,'').toLowerCase();
export function verifiedCard(parsed){
 const transcript=String(parsed?.transcript||''),evidence=compact(transcript),contact={};
 for(const field of ['name','company','title','phone','email','address']){const value=String(parsed?.[field]||'').trim();contact[field]=value&&compact(value)&&evidence.includes(compact(value))?value:'';}
 if(!contact.name)throw Error('명함에서 이름을 확실히 읽지 못했어요. 밝은 곳에서 다시 촬영해주세요.');
 if(contact.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email))contact.email='';
 if(contact.phone&&contact.phone.replace(/\D/g,'').length<7)contact.phone='';
 return {...contact,category:/대표|CEO|chief executive/i.test(contact.title)?'대표':'지인',lastContact:'',notes:'',focus:'',followup:''};
}
// Saving waits for both recognition and the five-second cancellation window.
export async function waitForCardSave(started,{now=Date.now,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){const remaining=5000-(now()-started);if(remaining>0)await wait(remaining);}
export async function saveRecognizedCard({started,isCurrent,prepare,save,wait=waitForCardSave}){await wait(started);if(!isCurrent())return false;const entries=await prepare();if(!isCurrent())return false;await save(entries);return true;}
export async function focusCamera(track,x,y,supported=globalThis.navigator?.mediaDevices?.getSupportedConstraints?.()||{}){if(!track?.getCapabilities||!track.applyConstraints)return false;const caps=track.getCapabilities(),settings={};if(caps.focusMode?.includes('single-shot'))settings.focusMode='single-shot';else if(caps.focusMode?.includes('continuous'))settings.focusMode='continuous';if(supported.pointsOfInterest)settings.pointsOfInterest=[{x:Math.max(0,Math.min(1,x)),y:Math.max(0,Math.min(1,y))}];if(!Object.keys(settings).length)return false;await track.applyConstraints({advanced:[settings]});return true;}
